import { AsyncLocalStorage } from "node:async_hooks";
import { httpServerHandler } from "cloudflare:node";
import pg from "pg";
import appModule from "./app.js";

const scope = new AsyncLocalStorage();
let handler;

function apiHandler(env) {
  if (handler) return handler;
  const origins = String(env.CORS_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean);
  if (Buffer.byteLength(env.AUTH_TOKEN_SECRET || "") < 32 || !origins.length
    || !origins.every(origin => {
      try { const url = new URL(origin); return url.protocol === "https:" && url.origin === origin; }
      catch { return false; }
    })) throw new Error("Invalid API configuration");

  const app = appModule.createApp({
    getPool: () => scope.getStore().pool,
    getClientIp: () => scope.getStore().clientIp,
    authTokenSecret: env.AUTH_TOKEN_SECRET,
    corsOrigins: origins,
    nodeEnv: "production",
    supabaseUrl: env.SUPABASE_URL,
    supabaseSecretKey: env.SUPABASE_SECRET_KEY,
  });
  app.listen(3000);
  handler = httpServerHandler({ port: 3000 });
  return handler;
}

function apiError(status, message) {
  return Response.json({ message }, { status, headers: {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    ...(status === 429 ? { "Retry-After": "60" } : {}),
  } });
}

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname !== "/api" && !pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    let pool;
    try {
      if (!env.HYPERDRIVE?.connectionString) return apiError(503, "Service temporarily unavailable.");
      const handle = apiHandler(env);
      const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
      const limiter = request.method === "POST" && /^\/api\/auth\/login\/?$/i.test(pathname)
        ? env.LOGIN_RATE_LIMITER
        : /^\/api\/admin(?:\/|$)/i.test(pathname) && ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)
          ? env.ADMIN_RATE_LIMITER : null;
      if (limiter) {
        const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(clientIp));
        const key = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
        if (!(await limiter.limit({ key })).success) return apiError(429, "Too many requests. Try again later.");
      }
      // Hyperdrive maintains the remote connection pool; JS sockets remain request-local.
      pool = new pg.Pool({ connectionString: env.HYPERDRIVE.connectionString, max: 5,
        connectionTimeoutMillis: 5000, idleTimeoutMillis: 1000 });
      pool.on("error", () => console.error(JSON.stringify({ event: "database_connection_error" })));
      return await scope.run({ pool, clientIp }, () => handle.fetch(request, env, ctx));
    } catch {
      console.error(JSON.stringify({ event: "api_request_failed" }));
      return apiError(503, "Service temporarily unavailable.");
    } finally {
      if (pool) ctx.waitUntil(pool.end().catch(() => {
        console.error(JSON.stringify({ event: "database_cleanup_failed" }));
      }));
    }
  },
};
