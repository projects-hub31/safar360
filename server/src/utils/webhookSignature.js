const crypto = require("crypto");
const env = require("../config/env");

function sign(payload) {
  const body = JSON.stringify(payload);
  return crypto.createHmac("sha256", env.webhookSecret).update(body).digest("hex");
}

function verify(payload, signature) {
  const expected = sign(payload);
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// CLAUDE.md §4: "webhook signature verification should retry up to 3x
// within 30s before giving up." Our mock gateway signs+verifies with a
// static shared secret, so verification is deterministic — this wrapper is
// what a real gateway integration (fetching a rotating signing key, etc.)
// would actually need retried; kept real (not stubbed) so the shape survives
// into a live-gateway swap later.
async function verifyWithRetry(payload, signature, { retries = 3, intervalMs = 10000 } = {}) {
  let lastErr = null;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return verify(payload, signature);
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
  throw lastErr || new Error("Webhook signature verification failed");
}

module.exports = { sign, verify, verifyWithRetry };
