const mongoose = require("mongoose");

// All-or-nothing group payment, CLAUDE.md §3/§6 booking/group-split: everyone
// pays their own share inside a 24h window; if even one person hasn't paid
// when it closes, everyone who did pay is refunded in full. No seat is ever
// held or deducted until every participant has paid — only then does the
// real atomic seat deduction + Booking + ledger accrual fire (same "the
// server is the truth" capture point every other booking path uses).
const participantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    status: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
    paidAt: Date,
  },
  { _id: false }
);

const groupSplitSchema = new mongoose.Schema(
  {
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tour: { type: mongoose.Schema.Types.ObjectId, ref: "Tour", required: true },
    departureId: { type: mongoose.Schema.Types.ObjectId, required: true },
    tourTitle: { type: String, required: true },
    price: { type: Number, required: true }, // per-person, snapshotted at start time
    cancellationPolicy: { type: String, enum: ["flexible", "standard", "strict"], default: "standard" },
    status: { type: String, enum: ["open", "confirmed", "lapsed"], default: "open" },
    deadlineAt: { type: Date, required: true },
    participants: { type: [participantSchema], required: true },
    bookingRef: String, // set once every participant has paid and a real Booking is created
    outcomeReason: String, // set on a lapse (window closed, or a sold-out race at the final payment)
  },
  { timestamps: true }
);

module.exports = mongoose.model("GroupSplit", groupSplitSchema);
