import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, scryptSync } from "node:crypto";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";

const bundle = fileURLToPath(new URL("../frontend/.cloudflare/output/v0/workers/default/bundle/index.js", import.meta.url));
const assets = fileURLToPath(new URL("../frontend/.cloudflare/output/v0/workers/default/assets/", import.meta.url));
const runtime = { compatibilityDate: "2026-11-09", compatibilityFlags: ["nodejs_compat"], modules: true };
const createRuntime = (options, withAssets = false) => {
  const config = convertV4MiniflareOptions(options);
  if (withAssets) {
    config.workers[0].config.assets = { directory: assets, hasUserWorker: true,
      notFoundHandling: "single-page-application", runWorkerFirst: ["/api", "/api/*"] };
    config.workers[0].config.env.ASSETS = { type: "assets" };
  }
  return new Miniflare(config);
};

test("Workers HTTP adapter preserves API routing, authorization, body limits and safe failures", async () => {
  const mf = createRuntime({ ...runtime, scriptPath: bundle, bindings: {
    AUTH_TOKEN_SECRET: randomBytes(32).toString("hex"),
    CORS_ORIGINS: "https://robotactic.example.com",
    HYPERDRIVE: { connectionString: "unused-in-these-tests" },
  }, ratelimits: {
    LOGIN_RATE_LIMITER: { namespace_id: "1001", simple: { limit: 5, period: 60 } },
    ADMIN_RATE_LIMITER: { namespace_id: "1002", simple: { limit: 60, period: 60 } },
  } }, true);
  try {
    for (const path of ["/", "/dashboard"]) {
      const response = await mf.dispatchFetch(`https://robotactic.example.com${path}`, { headers: { Accept: "text/html" } });
      assert.equal(response.status, 200);
      assert.match(await response.text(), /id="root"/);
      assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    }
    assert.equal((await mf.dispatchFetch("https://robotactic.example.com/logo/robotactic-mark-white.png")).status, 200);
    const responses = await Promise.all(Array.from({ length: 4 }, () => mf.dispatchFetch("https://robotactic.example.com/api/health")));
    for (const response of responses) {
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.equal((await response.json()).status, "ok");
    }
    assert.equal((await mf.dispatchFetch("https://robotactic.example.com/api/admin/users")).status, 401);
    const missing = await mf.dispatchFetch("https://robotactic.example.com/api/missing");
    assert.equal(missing.status, 404);
    assert.match(missing.headers.get("content-type"), /application\/json/);
    assert.equal((await mf.dispatchFetch("https://robotactic.example.com/api/auth/login", {
      method: "POST", headers: { Origin: "https://untrusted.example.com", "Content-Type": "application/json" }, body: "{}",
    })).status, 403);
    assert.equal((await mf.dispatchFetch("https://robotactic.example.com/api/auth/login", {
      method: "POST", headers: { Origin: "https://robotactic.example.com", "Content-Type": "application/json" }, body: "{",
    })).status, 400);
    assert.equal((await mf.dispatchFetch("https://robotactic.example.com/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: "x".repeat(110_000) }),
    })).status, 413);
    const compressed = gzipSync("{}");
    for (const [body, status] of [
      [compressed, 404],
      [Buffer.concat([compressed, Buffer.from("invalid-trailing-bytes")]), 400],
    ]) {
      const response = await mf.dispatchFetch("https://robotactic.example.com/api/missing", {
        method: "POST", headers: { "Content-Type": "application/json", "Content-Encoding": "gzip" }, body,
      });
      assert.equal(response.status, status);
      assert.match(response.headers.get("content-type"), /application\/json/);
    }
    assert.equal((await mf.dispatchFetch("https://robotactic.example.com/api/health")).status, 200);
    for (let i = 0; i < 5; i++) await mf.dispatchFetch("https://robotactic.example.com/api/auth/login", { method: "POST" });
    const limited = await mf.dispatchFetch("https://robotactic.example.com/api/auth/login", { method: "POST" });
    assert.equal(limited.status, 429);
    assert.equal(limited.headers.get("retry-after"), "60");
  } finally { await mf.dispose(); }

  const unconfigured = createRuntime({ ...runtime, scriptPath: bundle });
  try {
    const response = await unconfigured.dispatchFetch("https://robotactic.example.com/api/health");
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { message: "Service temporarily unavailable." });
  } finally { await unconfigured.dispose(); }
});

test("Workers scrypt verifies an existing Node-generated password hash", async () => {
  const password = randomBytes(24).toString("hex");
  const salt = randomBytes(16).toString("hex");
  const mf = createRuntime({ ...runtime, bindings: {
    PASSWORD: password, SALT: salt, EXPECTED: scryptSync(password, salt, 64).toString("hex"),
  }, script: `import { scrypt, timingSafeEqual } from "node:crypto";
    import { promisify } from "node:util";
    export default { async fetch(request, env) {
      const actual = await promisify(scrypt)(env.PASSWORD, env.SALT, 64);
      return Response.json({ matches: timingSafeEqual(Buffer.from(actual), Buffer.from(env.EXPECTED, "hex")) });
    } };` });
  try { assert.deepEqual(await (await mf.dispatchFetch("https://test.example.com/")).json(), { matches: true }); }
  finally { await mf.dispose(); }
});
