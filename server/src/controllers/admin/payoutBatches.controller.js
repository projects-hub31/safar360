const PayoutBatch = require("../../models/PayoutBatch");
const LedgerRow = require("../../models/LedgerRow");
const Dispute = require("../../models/Dispute");
const ApiError = require("../../utils/ApiError");
const { ok } = require("../../utils/respond");
const { logAudit, actorNameFor } = require("../../services/audit.service");
const { settleAccruingRows } = require("../../services/ledger.service");

function toDto(b) {
  return {
    id: b._id,
    status: b.status,
    ledgerRowIds: b.ledgerRowIds,
    totalAmount: b.totalAmount,
    preparedBy: b.preparedByName,
    approvedBy: b.approvedByName,
    preparedAt: b.createdAt,
    approvedAt: b.approvedAt,
  };
}

// GET /api/admin/payout-batches/candidates — every party with a `pending`
// ledger row, grouped (§3: a payout batch releases a party's pending rows
// together) — a party with an open dispute on any of its rows is held out
// entirely, never partially included.
async function candidates(req, res, next) {
  try {
    await settleAccruingRows();
    const rows = await LedgerRow.find({ state: "pending" });
    const refs = [...new Set(rows.map((r) => r.ref))];
    const openDisputeRefs = new Set((await Dispute.find({ bookingRef: { $in: refs }, status: "open" })).map((d) => d.bookingRef));

    const byParty = new Map();
    for (const row of rows) {
      if (!byParty.has(row.party)) byParty.set(row.party, { party: row.party, kind: row.kind, ledgerRowIds: [], amount: 0, hasOpenDispute: false });
      const group = byParty.get(row.party);
      group.ledgerRowIds.push(row._id);
      group.amount += row.net;
      if (openDisputeRefs.has(row.ref)) group.hasOpenDispute = true;
    }
    ok(res, [...byParty.values()]);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const batches = await PayoutBatch.find().sort({ createdAt: -1 });
    ok(res, batches.map(toDto));
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/payout-batches — prepare. A payee with an open dispute is
// checked again here (not just trusted from the candidates list), since the
// two calls aren't atomic with each other.
async function prepare(req, res, next) {
  try {
    const { ledgerRowIds } = req.body;
    if (!Array.isArray(ledgerRowIds) || !ledgerRowIds.length) {
      throw new ApiError(400, "MISSING_ROWS", "At least one ledger row is required.");
    }
    const rows = await LedgerRow.find({ _id: { $in: ledgerRowIds }, state: "pending" });
    if (rows.length !== ledgerRowIds.length) {
      throw new ApiError(400, "INVALID_ROWS", "One or more ledger rows weren't found or aren't pending.");
    }
    const refs = [...new Set(rows.map((r) => r.ref))];
    const openDispute = await Dispute.findOne({ bookingRef: { $in: refs }, status: "open" });
    if (openDispute) {
      throw new ApiError(409, "OPEN_DISPUTE", "A payee with an open dispute can't be included in a batch.");
    }

    const totalAmount = rows.reduce((n, r) => n + r.net, 0);
    const actorName = await actorNameFor(req.user.id);
    const batch = await PayoutBatch.create({
      ledgerRowIds, totalAmount, preparedBy: req.user.id, preparedByName: actorName, status: "prepared",
    });

    await logAudit({
      actorId: req.user.id, actorName, action: `Payout batch prepared — ${rows.length} payee(s)`,
      target: "Payout batch", category: "money", tone: "success",
    });
    ok(res, toDto(batch), 201);
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/payout-batches/:id/approve — two-step approval enforced by
// identity (§3): the preparer and approver are compared as real authenticated
// user ids, not a typed name string a demo has to fake.
async function approve(req, res, next) {
  try {
    const batch = await PayoutBatch.findById(req.params.id);
    if (!batch) throw new ApiError(404, "BATCH_NOT_FOUND", "Payout batch not found.");
    if (batch.status !== "prepared") throw new ApiError(409, "NOT_PREPARED", "This batch has already been approved.");

    const actorName = await actorNameFor(req.user.id);
    if (String(batch.preparedBy) === String(req.user.id)) {
      await logAudit({
        actorId: req.user.id, actorName, action: "Payout batch approval refused — same identity as preparer",
        target: "Payout batch", category: "money", tone: "danger", refused: true,
      });
      throw new ApiError(409, "SAME_IDENTITY", "You also prepared this batch — a second, different approver is required.");
    }

    batch.status = "approved";
    batch.approvedBy = req.user.id;
    batch.approvedByName = actorName;
    batch.approvedAt = new Date();
    await batch.save();
    await LedgerRow.updateMany({ _id: { $in: batch.ledgerRowIds } }, { state: "released" });

    await logAudit({
      actorId: req.user.id, actorName, action: "Payout batch approved and released",
      target: "Payout batch", category: "money", tone: "success",
    });
    ok(res, toDto(batch));
  } catch (err) {
    next(err);
  }
}

module.exports = { candidates, list, prepare, approve };
