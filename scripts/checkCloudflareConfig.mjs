import { loadEnv } from "vite";
import { fileURLToPath } from "node:url";

const directory = fileURLToPath(new URL("../frontend/", import.meta.url));
const settings = { ...loadEnv("cloudflare", directory, ""), ...process.env };
const origins = String(settings.CORS_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean);
const validOrigin = origin => {
  try { const url = new URL(origin); return url.protocol === "https:" && url.origin === origin; }
  catch { return false; }
};
if (!/^[a-f0-9]{32}$/i.test(settings.HYPERDRIVE_ID || "") || !origins.length || !origins.every(validOrigin)) {
  console.error("Set a real HYPERDRIVE_ID and exact HTTPS CORS_ORIGINS in frontend/.env before deploying. See docs/cloudflare-deployment.md.");
  process.exitCode = 1;
}
