const ApiError = require("../../utils/ApiError");
const { ok } = require("../../utils/respond");
const { VENDOR_PLANS } = require("../../utils/vendorPlans");
const subscriptionService = require("../../services/subscription.service");

function toDto(sub) {
  if (!sub) return { state: null, plan: null };
  return {
    state: sub.state,
    plan: sub.plan,
    commissionPct: sub.commissionPct,
    listingCap: sub.listingCap,
    currentPeriodEnd: sub.currentPeriodEnd,
    graceDays: subscriptionService.GRACE_DAYS,
    graceStartedAt: sub.graceStartedAt,
  };
}

async function getSubscription(req, res, next) {
  try {
    const sub = await subscriptionService.getSettled(req.user.id);
    ok(res, toDto(sub));
  } catch (err) {
    next(err);
  }
}

async function subscribe(req, res, next) {
  try {
    const { plan } = req.body;
    if (!VENDOR_PLANS[plan]) throw new ApiError(400, "INVALID_PLAN", "Choose a valid plan.");
    const sub = await subscriptionService.subscribe(req.user.id, plan);
    ok(res, toDto(sub), 201);
  } catch (err) {
    next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const sub = await subscriptionService.cancelSubscription(req.user.id);
    ok(res, toDto(sub));
  } catch (err) {
    next(err);
  }
}

// Dev-only testing levers — no real recurring billing exists to fail for
// real, same honestly-labeled shape as the client's own (and booking
// module's force-outcome panel, §7). Never present these as real capability.
async function simulateChargeFailure(req, res, next) {
  try {
    const sub = await subscriptionService.simulateChargeFailure(req.user.id);
    ok(res, toDto(sub));
  } catch (err) {
    next(err);
  }
}

async function retryCharge(req, res, next) {
  try {
    const sub = await subscriptionService.retryCharge(req.user.id);
    ok(res, toDto(sub));
  } catch (err) {
    next(err);
  }
}

async function exhaustRetries(req, res, next) {
  try {
    const sub = await subscriptionService.exhaustRetries(req.user.id);
    ok(res, toDto(sub));
  } catch (err) {
    next(err);
  }
}

module.exports = { getSubscription, subscribe, cancel, simulateChargeFailure, retryCharge, exhaustRetries };
