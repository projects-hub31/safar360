const { ok } = require("../../utils/respond");
const { processPaymentWebhook } = require("../../services/webhook.service");

// POST /api/webhooks/payment — the real, externally-callable endpoint a live
// gateway would hit. The bundled mock gateway delivers in-process instead
// (payment-gateway.mock.js) to avoid self-referential HTTP flakiness in dev,
// but calls this exact same `processPaymentWebhook` logic either way — this
// route exists so the signature-verified path is independently reachable
// (e.g. for manual curl testing with a real HMAC) and so swapping in a real
// gateway later only means pointing it at this URL.
async function handlePaymentWebhook(req, res, next) {
  try {
    const signature = req.headers["x-webhook-signature"];
    const result = await processPaymentWebhook(req.body, signature);
    ok(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = { handlePaymentWebhook };
