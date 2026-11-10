const test = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const { getDatabaseConnectionOptions } = require("../config/databaseSsl");

function withEnvironment(values, run) {
  const previous = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  try {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
    run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
}

function connection(host) {
  const url = new URL("postgresql://localhost/fixture");
  url.hostname = host;
  url.username = "fixture";
  url.password = randomBytes(32).toString("base64url");
  return url;
}

test("Neon verifies TLS even when the SSL environment flag is missing or URL options request bypasses", () => {
  withEnvironment({ DATABASE_SSL: undefined, DATABASE_SSL_CA_PATH: undefined, NODE_ENV: "development" }, () => {
    const url = connection("fixture.neon.tech");
    for (const mode of ["disable", "no-verify", "require"]) {
      url.searchParams.set("sslmode", mode);
      url.searchParams.set("uselibpqcompat", "true");
      const options = getDatabaseConnectionOptions(url.toString());
      assert.equal(options.ssl.rejectUnauthorized, true);
      assert.equal(options.ssl.checkServerIdentity, undefined);
      assert.equal(options.enableChannelBinding, true);
      assert.equal(new URL(options.connectionString).searchParams.has("sslmode"), false);
      assert.equal(new URL(options.connectionString).password, url.password);
    }
  });
});

test("production and read-only audits require TLS while explicit local development can stay local", () => {
  withEnvironment({ DATABASE_SSL: undefined, DATABASE_SSL_CA_PATH: undefined, NODE_ENV: "development" }, () => {
    const value = connection("localhost").toString();
    assert.equal(getDatabaseConnectionOptions(value).ssl, undefined);
    assert.equal(getDatabaseConnectionOptions(value, { requireTls: true }).ssl.rejectUnauthorized, true);
    process.env.NODE_ENV = "production";
    assert.equal(getDatabaseConnectionOptions(value).ssl.rejectUnauthorized, true);
  });
});

test("configuration errors do not include credentials", () => {
  const secret = randomBytes(32).toString("hex");
  assert.throws(() => getDatabaseConnectionOptions(secret), error => !error.message.includes(secret));
  withEnvironment({ DATABASE_SSL_CA_PATH: "missing-fixture-certificate.crt" }, () => {
    assert.throws(() => getDatabaseConnectionOptions(connection("fixture.neon.tech").toString()),
      { message: "DATABASE_SSL_CA_PATH must point to a readable CA certificate file." });
  });
});
