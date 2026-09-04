const mongoose = require("mongoose");

// Two-step approval enforced by identity, not just role (§3 Ledger) — the
// preparer and approver are both real `User` references, checked against
// the authenticated user on approve, not a typed name string.
const payoutBatchSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ["prepared", "approved"], default: "prepared" },
    ledgerRowIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "LedgerRow", required: true }],
    totalAmount: { type: Number, required: true },
    preparedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    preparedByName: String, // display-name snapshots — same pattern as Dispute.travellerName
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approvedByName: String,
    approvedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("PayoutBatch", payoutBatchSchema);
