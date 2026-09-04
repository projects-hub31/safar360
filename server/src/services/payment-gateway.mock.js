const { sign } = require("../utils/webhookSignature");
const { processPaymentWebhook } = require("./webhook.service");

// No real gateway is integrated (Stripe/JazzCash/etc. are out of scope for
// this pass, CLAUDE.md §9) — this simulates one. A charge is `pending`
// immediately; a signed "webhook" fires a few seconds later through the
// exact same `processPaymentWebhook` path a real gateway's HTTP callback
// would hit, so the signature-verification code is genuinely exercised, not
// bypassed. Delivered in-process (a direct function call) rather than over a
// real HTTP round trip to the app's own server, to avoid self-referential
// network flakiness in dev — same signing/verifying code either way.
const DECLINE_CARD = "4000000000000002"; // Stripe's standard "generic decline"
const FRAUD_CARD = "4100000000000019"; // Stripe's standard "elevated risk" card
const FRAUD_AMOUNT_THRESHOLD = 400000;

function decideOutcome({ amount, method, methodDetail }) {
  const digits = String(methodDetail || "").replace(/\D/g, "");

  if (method === "card" && digits === DECLINE_CARD) {
    return { status: "failed", fraudScore: 0, fraudFactors: [] };
  }
  if (method === "card" && digits === FRAUD_CARD) {
    return {
      status: "held",
      fraudScore: 0.81,
      fraudFactors: [
        { label: "Card issued outside Pakistan", weight: 0.28 },
        { label: "First booking on this account", weight: 0.24 },
        { label: "Amount in top 5% of bookings", weight: 0.19 },
        { label: "Departure within 72h", weight: 0.11 },
        { label: "Device seen before, no chargebacks", weight: -0.14 },
      ],
    };
  }
  if ((method === "jazzcash" || method === "easypaisa") && digits.endsWith("0000")) {
    return { status: "failed", fraudScore: 0, fraudFactors: [] };
  }
  if (amount >= FRAUD_AMOUNT_THRESHOLD) {
    return {
      status: "held",
      fraudScore: 0.79,
      fraudFactors: [
        { label: "Amount in top 5% of bookings", weight: 0.19 },
        { label: "First booking on this account", weight: 0.24 },
        { label: "Departure within 72h", weight: 0.11 },
        { label: "Device seen before, no chargebacks", weight: -0.14 },
        { label: "Card issued outside Pakistan", weight: 0.28 },
      ],
    };
  }
  return { status: "confirmed", fraudScore: 0.12, fraudFactors: [{ label: "Established payment pattern", weight: 0.12 }] };
}

function chargeAsync({ paymentId, bookingId, amount, method, methodDetail }) {
  const outcome = decideOutcome({ amount, method, methodDetail });
  const delayMs = 2000 + Math.floor(Math.random() * 2000); // "a few seconds later", CLAUDE.md §9

  setTimeout(() => {
    const payload = { paymentId, bookingId, ...outcome };
    const signature = sign(payload);
    processPaymentWebhook(payload, signature).catch((err) => {
      console.error(`[payment-gateway.mock] webhook processing failed for ${paymentId}:`, err);
    });
  }, delayMs);

  return { status: "pending" };
}

module.exports = { chargeAsync, decideOutcome, DECLINE_CARD, FRAUD_CARD, FRAUD_AMOUNT_THRESHOLD };
