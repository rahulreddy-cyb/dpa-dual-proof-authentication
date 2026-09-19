import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { authenticator } from "otplib";

process.env.DB_PATH = ":memory:";
process.env.WEB_ORIGIN = "http://localhost:5173";
const { server, db, app } = await import("../src/server.js");

async function request(path, options = {}) {
  const response = await fetch(`http://localhost:4000${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) }
  });
  return { status: response.status, body: await response.json() };
}

test("health endpoint", async () => {
  const r = await request("/health");
  assert.equal(r.status, 200);
  assert.equal(r.body.ok, true);
});

test("challenge + dual proof verification + replay protection", async () => {
  const user = db.prepare("SELECT * FROM users WHERE username='demo'").get();
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
  const deviceId = "test-device";

  let r = await request("/api/dev/device/register", {
    method: "POST",
    body: JSON.stringify({ username: "demo", deviceId, publicKeyPem })
  });
  assert.equal(r.status, 200);

  r = await request("/api/auth/challenge", {
    method: "POST",
    body: JSON.stringify({ username: "demo" })
  });
  assert.equal(r.status, 200);

  const sign = crypto.createSign("SHA256");
  sign.update(r.body.challenge);
  sign.end();
  const signature = sign.sign(privateKey).toString("base64url");
  const otp = authenticator.generate(user.totp_secret);

  const verifyBody = { username: "demo", challengeId: r.body.challengeId, deviceId, otp, signature };
  r = await request("/api/auth/verify", { method: "POST", body: JSON.stringify(verifyBody) });
  assert.equal(r.status, 200);
  assert.equal(r.body.ok, true);

  r = await request("/api/auth/verify", { method: "POST", body: JSON.stringify(verifyBody) });
  assert.equal(r.status, 401);
  assert.equal(r.body.error, "challenge_invalid_or_expired");
});

test("wrong signature is rejected even with valid OTP", async () => {
  const user = db.prepare("SELECT * FROM users WHERE username='demo'").get();
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
  db.prepare("INSERT OR REPLACE INTO devices(id,user_id,public_key_pem,created_at) VALUES(?,?,?,?,?)")
    .run("test-device-2", user.id, publicKeyPem, Date.now());

  const r1 = await request("/api/auth/challenge", {
    method: "POST",
    body: JSON.stringify({ username: "demo" })
  });
  const attacker = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" }).privateKey;
  const sign = crypto.createSign("SHA256");
  sign.update(r1.body.challenge);
  sign.end();
  const signature = sign.sign(attacker).toString("base64url");
  const otp = authenticator.generate(user.totp_secret);

  const r2 = await request("/api/auth/verify", {
    method: "POST",
    body: JSON.stringify({
      username: "demo",
      challengeId: r1.body.challengeId,
      deviceId: "test-device-2",
      otp,
      signature
    })
  });
  assert.equal(r2.status, 401);
  assert.equal(r2.body.error, "signature_invalid");
});

server.close();
