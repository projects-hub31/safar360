const Subscription = require("../models/Subscription");
const { VENDOR_PLANS } = require("../utils/vendorPlans");

const GRACE_DAYS = 3; // suspended → after 3 days elapse (§3 subscription table)
const SUSPENDED_TO_CANCELLED_DAYS = 90;
const CANCELLED_TO_PURGED_DAYS = 90;

const DAY_MS = 24 * 60 * 60 * 1000;

// Same "check on read, no cron/queue infra exists yet" pattern as
// booking.controller.js's settleIfLapsed — a subscription's clock-driven
// moves (grace→suspended, suspended→cancelled, cancelled→purged) are
// evaluated lazily whenever the document is read, not on a background timer.
async function settleTimers(sub) {
  if (!sub) return sub;
  const now = Date.now();
  let changed = false;

  if (sub.state === "grace" && sub.graceStartedAt && now - sub.graceStartedAt.getTime() >= GRACE_DAYS * DAY_MS) {
    sub.state = "suspended";
    sub.suspendedAt = new Date();
    changed = true;
  }
  if (sub.state === "suspended" && sub.suspendedAt && now - sub.suspendedAt.getTime() >= SUSPENDED_TO_CANCELLED_DAYS * DAY_MS) {
    sub.state = "cancelled";
    sub.cancelledAt = new Date();
    changed = true;
  }
  if (sub.state === "cancelled" && sub.cancelledAt && now - sub.cancelledAt.getTime() >= CANCELLED_TO_PURGED_DAYS * DAY_MS) {
    sub.state = "purged";
    sub.purgedAt = new Date();
    changed = true;
  }

  if (changed) await sub.save();
  return sub;
}

// Returns null (not a document) when the vendor has never subscribed —
// mirrors the client's own `{ state: null, plan: null }` starting shape
// (VendorContext.jsx) so the API's "no subscription yet" case matches
// exactly what the UI already expects.
async function getSettled(vendorId) {
  const sub = await Subscription.findOne({ vendor: vendorId });
  return settleTimers(sub);
}

async function subscribe(vendorId, plan) {
  const planDef = VENDOR_PLANS[plan];
  if (!planDef) return null;

  return Subscription.findOneAndUpdate(
    { vendor: vendorId },
    {
      vendor: vendorId,
      plan,
      state: "active",
      commissionPct: planDef.commissionPct,
      listingCap: planDef.listingCap,
      retryCount: 0,
      currentPeriodEnd: new Date(Date.now() + 30 * DAY_MS),
      pastDueAt: null,
      graceStartedAt: null,
      suspendedAt: null,
      cancelledAt: null,
      purgedAt: null,
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
}

async function cancelSubscription(vendorId) {
  const sub = await getSettled(vendorId);
  if (!sub || !["active", "past_due", "grace"].includes(sub.state)) return sub;
  sub.state = "cancelled";
  sub.cancelledAt = new Date();
  await sub.save();
  return sub;
}

// Manual testing lever, same honestly-labeled shape as the client's
// simulateChargeFailure (no real recurring billing exists to fail for real).
async function simulateChargeFailure(vendorId) {
  const sub = await getSettled(vendorId);
  if (!sub || sub.state !== "active") return sub;
  sub.state = "past_due";
  sub.pastDueAt = new Date();
  sub.retryCount = 0;
  await sub.save();
  return sub;
}

async function retryCharge(vendorId) {
  const sub = await getSettled(vendorId);
  if (!sub || !["past_due", "suspended"].includes(sub.state)) return sub;
  sub.state = "active";
  sub.retryCount = 0;
  sub.pastDueAt = null;
  sub.suspendedAt = null;
  await sub.save();
  return sub;
}

async function exhaustRetries(vendorId) {
  const sub = await getSettled(vendorId);
  if (!sub || sub.state !== "past_due") return sub;
  sub.state = "grace";
  sub.graceStartedAt = new Date();
  await sub.save();
  return sub;
}

function publishGateOk(sub) {
  return !!sub && (sub.state === "active" || sub.state === "grace");
}

// Falls back to null when the vendor has no subscription (or no active/
// grace one) — caller decides the fallback rate (Policy.commissionPct),
// exactly as §9's day 4-7 log flagged this as the follow-up wiring.
async function getCommissionRate(vendorId) {
  if (!vendorId) return null;
  const sub = await getSettled(vendorId);
  if (!sub) return null;
  return sub.commissionPct / 100;
}

module.exports = {
  GRACE_DAYS,
  getSettled,
  subscribe,
  cancelSubscription,
  simulateChargeFailure,
  retryCharge,
  exhaustRetries,
  publishGateOk,
  getCommissionRate,
};
