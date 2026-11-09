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
    // Password verification needs more CPU than the Workers Free allowance.
    limits: { cpuMs: 1000 },
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
      SUPABASE_SECRET_KEY: bindings.secret(),
      LOGIN_RATE_LIMITER: bindings.rateLimit({ namespace: "1001", simple: { limit: 5, period: 60 } }),
      ADMIN_RATE_LIMITER: bindings.rateLimit({ namespace: "1002", simple: { limit: 60, period: 60 } }),
    },
  },
});
