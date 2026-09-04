const mongoose = require("mongoose");

const lineItemSchema = new mongoose.Schema({ label: String, amount: Number }, { _id: false });

const quoteSchema = new mongoose.Schema(
  {
    lineItems: [lineItemSchema],
    total: Number,
    expiryHours: Number,
    quotedAt: Date,
    expiresAt: Date,
  },
  { _id: false }
);

// Shared shape for transport quotes AND property table/group enquiries
// (CLAUDE.md §3 "Lead / quote lifecycle" — one lifecycle, `kind` is the only
// difference): request → quoted → accepted | expired | withdrawn, or
// request → declined. No inventory hold and no payment at any step before
// `accepted`, and accepting doesn't create a second Booking document — the
// Lead itself is the record of what was agreed.
const leadSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ["transport", "table", "group"], required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", default: null }, // transport kind only
    subjectLabel: { type: String, required: true },
    traveller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true }, // display-name snapshot at enquiry time
    date: { type: String, required: true }, // free-text date as entered (matches the <input type="date"> value shape)
    count: { type: Number, required: true },
    note: String,
    status: {
      type: String,
      enum: ["request", "quoted", "accepted", "declined", "expired", "withdrawn"],
      default: "request",
    },
    deadlineAt: Date, // owner's 24h "reply within" clock at `request` — display-only, no auto-transition (§3 doesn't define one)
    quote: { type: quoteSchema, default: null },
    acceptedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lead", leadSchema);
