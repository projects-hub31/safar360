const LedgerRow = require("../models/LedgerRow");
const Booking = require("../models/Booking");
const { genLedgerId } = require("../utils/reference-numbers");

// One shared implementation, CLAUDE.md §3: "commission = round(gross *
// rate); net = commission for referrals, net = gross - commission for
// vendor/seller payouts." Every module that touches money calls this —
// never a second copy.
async function accrueCommission({ ref, party, label, gross, rate, kind = "commission", via }) {
  const commission = Math.round(gross * rate);
  const net = kind === "referral" ? commission : gross - commission;

  return LedgerRow.create({
    ledgerId: genLedgerId(),
    kind,
    ref,
    party,
    label,
    gross,
    rate,
    commission,
    net,
    state: "accruing",
    via,
  });
}

// Claws back commission on a refund/cancellation — the same function every
// cancellation path calls (§3: "no parallel refund path"), including the
// weather-override flow.
async function reverseLedger(ref) {
  return LedgerRow.updateMany({ ref, state: { $ne: "reversed" } }, { state: "reversed" });
}

// A row sits at `accruing` until the booking it's tied to has actually
// departed (§6 vendor/payouts: "Pending release: Departure happened;
// waiting for the Tuesday payout run") — nothing in this codebase runs a
// scheduled payout batch, so this is the same "check on read, no cron
// infra" shape every other lazily-settled state in this app uses (booking's
// settleIfLapsed, a subscription's grace timer, a lead's quote expiry).
// Called before any admin screen reads the ledger (the platform view, or
// payout-batch candidates) so `pending` rows are never stale.
async function settleAccruingRows() {
  const rows = await LedgerRow.find({ state: "accruing" });
  if (!rows.length) return;

  const refs = [...new Set(rows.map((r) => r.ref))];
  const bookings = await Booking.find({ ref: { $in: refs } });
  const departureByRef = new Map(bookings.map((b) => [b.ref, b.departureDate]));

  const toSettle = rows
    .filter((r) => {
      const departureDate = departureByRef.get(r.ref);
      return departureDate && departureDate.getTime() < Date.now();
    })
    .map((r) => r._id);

  if (toSettle.length) await LedgerRow.updateMany({ _id: { $in: toSettle } }, { state: "pending" });
}

module.exports = { accrueCommission, reverseLedger, settleAccruingRows };
