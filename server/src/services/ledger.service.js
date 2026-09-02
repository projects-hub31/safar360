const LedgerRow = require("../models/LedgerRow");
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

module.exports = { accrueCommission, reverseLedger };
