const LedgerRow = require("../../models/LedgerRow");
const ApiError = require("../../utils/ApiError");
const { ok } = require("../../utils/respond");
const { logAudit, actorNameFor } = require("../../services/audit.service");
const { settleAccruingRows } = require("../../services/ledger.service");

function toDto(row) {
  return {
    id: row._id,
    ledgerId: row.ledgerId,
    kind: row.kind,
    ref: row.ref,
    party: row.party,
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

// GET /api/admin/ledger — the real platform-wide view, every party's rows
// (vendor commission, referral, payout) — no more seeded
// PLATFORM_LEDGER_EXTRA once every module that writes LedgerRow is real.
async function getLedger(req, res, next) {
  try {
    await settleAccruingRows();
    const rows = await LedgerRow.find().sort({ createdAt: -1 });
    ok(res, rows.map(toDto));
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/ledger/:id/reverse — unscoped (admin can reverse any
// party's row), unlike the vendor's own reverse action which is limited to
// its own rows.
async function reverseRow(req, res, next) {
  try {
    const row = await LedgerRow.findById(req.params.id);
    if (!row) throw new ApiError(404, "LEDGER_ROW_NOT_FOUND", "Ledger row not found.");
    row.state = "reversed";
    await row.save();

    const actorName = await actorNameFor(req.user.id);
    await logAudit({
      actorId: req.user.id, actorName, action: `Ledger row reversed — ${row.ledgerId}`,
      target: row.party, category: "money", tone: "held",
    });
    ok(res, toDto(row));
  } catch (err) {
    next(err);
  }
}

module.exports = { getLedger, reverseRow };
