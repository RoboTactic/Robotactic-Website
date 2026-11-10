import { bindings, defineConfig } from "cf/config";
import { loadEnv } from "vite";

const settings = { ...loadEnv("cloudflare", import.meta.dirname, ""), ...process.env };

export default defineConfig({
  worker: {
    name: "robotactic",
    entrypoint: "../backend/worker.mjs",
    compatibilityDate: "2026-11-09",
    compatibilityFlags: ["nodejs_compat"],
    workersDev: true,
    previewUrls: false,
    assets: {
      notFoundHandling: "single-page-application",
      runWorkerFirst: ["/api", "/api/*"],
    },
    // Custom CPU limits require Workers Paid. Keep password hashing unchanged on Free.
    ...(settings.WORKERS_PAID_PLAN === "true" ? { limits: { cpuMs: 1000 } } : {}),
    observability: {
      enabled: true,
      redactQueryString: true,
      logs: { enabled: true, invocationLogs: false },
      traces: { enabled: true, headSamplingRate: 0.01 },
    },
    env: {
      ASSETS: bindings.assets(),
      HYPERDRIVE: bindings.hyperdrive({
        id: settings.HYPERDRIVE_ID || "REPLACE_WITH_HYPERDRIVE_ID",
      }),
      CORS_ORIGINS: bindings.text(settings.CORS_ORIGINS || ""),
      SUPABASE_URL: bindings.text(settings.SUPABASE_URL || ""),
      AUTH_TOKEN_SECRET: bindings.secret(),
      // Preview can run without image uploads; never supply a placeholder secret.
      ...(settings.ENABLE_IMAGE_UPLOADS === "true" ? { SUPABASE_SECRET_KEY: bindings.secret() } : {}),
      LOGIN_RATE_LIMITER: bindings.rateLimit({ namespace: "1001", simple: { limit: 5, period: 60 } }),
      ADMIN_RATE_LIMITER: bindings.rateLimit({ namespace: "1002", simple: { limit: 60, period: 60 } }),
    },
  },
});
