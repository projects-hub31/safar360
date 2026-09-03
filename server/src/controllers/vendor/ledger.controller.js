const LedgerRow = require("../../models/LedgerRow");
const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");
const { ok } = require("../../utils/respond");

// LedgerRow.party is a display-name string, not a User ref (§3's shared
// shape predates a real vendor link — booking.controller.js / webhook.
// service.js still write `tour.operator`, itself copied from the vendor's
// User.name at listing-creation time, so this lookup stays correct as long
// as that copy does). Payouts are this ledger's first real consumer, per
// §9 days 8-9's own framing.
function toDto(row) {
  return {
    id: row._id,
    ledgerId: row.ledgerId,
    kind: row.kind,
    ref: row.ref,
    label: row.label,
    gross: row.gross,
    rate: row.rate,
    commission: row.commission,
    net: row.net,
    state: row.state,
    via: row.via,
    at: row.createdAt,
  };
}

// GET /api/vendor/ledger
async function getLedger(req, res, next) {
  try {
    const vendor = await User.findById(req.user.id);
    const rows = await LedgerRow.find({ party: vendor.name }).sort({ createdAt: -1 });
    ok(res, rows.map(toDto));
  } catch (err) {
    next(err);
  }
}

// POST /api/vendor/ledger/:id/reverse — vendor-scoped claw-back, ownership
// enforced via the same party-name match as the read above.
async function reverseRow(req, res, next) {
  try {
    const vendor = await User.findById(req.user.id);
    const row = await LedgerRow.findOne({ _id: req.params.id, party: vendor.name });
    if (!row) throw new ApiError(404, "LEDGER_ROW_NOT_FOUND", "Ledger row not found.");
    row.state = "reversed";
    await row.save();
    ok(res, toDto(row));
  } catch (err) {
    next(err);
  }
}

module.exports = { getLedger, reverseRow };
