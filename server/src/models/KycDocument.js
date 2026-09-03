const mongoose = require("mongoose");

// Per-vendor-type required document set, CLAUDE.md §3 KYC. Only the tour
// operator set is meaningful right now — transport/property land with
// module 05 (a separate, parallel build track), so their types are declared
// here for the shared enum/registry but nothing yet requires them.
const DOCUMENT_TYPES = [
  "cnic_front",
  "cnic_back",
  "business_registration",
  "route_permit",
  "fitness_certificate",
];

// The exact 4 fixed rejection reasons, §3 — the reject action stays
// disabled client-side until one is chosen, and the reason is shown to the
// vendor verbatim, never paraphrased.
const REJECTION_REASONS = ["image_unreadable", "document_expired", "name_mismatch", "missing_document"];

// Resubmission is scoped per rejected document, not a full re-upload (§3) —
// enforced here by a unique (vendor, type) pair: submitting again upserts
// the same row rather than creating a new one.
const kycDocumentSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: DOCUMENT_TYPES, required: true },
    fileRef: { type: String, required: true }, // no real file storage wired up yet — a name/handle stands in
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    rejectionReason: { type: String, enum: REJECTION_REASONS },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
  },
  { timestamps: true }
);

kycDocumentSchema.index({ vendor: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("KycDocument", kycDocumentSchema);
module.exports.DOCUMENT_TYPES = DOCUMENT_TYPES;
module.exports.REJECTION_REASONS = REJECTION_REASONS;
