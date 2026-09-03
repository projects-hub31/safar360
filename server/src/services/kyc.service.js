const User = require("../models/User");
const KycDocument = require("../models/KycDocument");

// Required document set per vendor type, CLAUDE.md §3: "tour operator: CNIC
// front/back + business registration; transport: CNIC + route permit +
// fitness certificate." Only `operator` is in scope for this module —
// transport/property land with module 05's parallel track.
const REQUIRED_DOCS_BY_ROLE = {
  operator: ["cnic_front", "cnic_back", "business_registration"],
};

function requiredDocsFor(role) {
  return REQUIRED_DOCS_BY_ROLE[role] || [];
}

// Recomputes the vendor's aggregate `User.kycStatus` from its per-document
// rows — 'approved' only once every required doc is approved, 'rejected' if
// any required doc is rejected (a vendor should see the block immediately,
// not just when every doc happens to be reviewed), otherwise 'pending'.
async function recomputeStatus(vendorId, role) {
  const required = requiredDocsFor(role);
  if (!required.length) return;

  const docs = await KycDocument.find({ vendor: vendorId, type: { $in: required } });
  const byType = new Map(docs.map((d) => [d.type, d]));

  let status;
  if (docs.some((d) => d.status === "rejected")) {
    status = "rejected";
  } else if (required.every((t) => byType.get(t)?.status === "approved")) {
    status = "approved";
  } else {
    status = "pending";
  }

  await User.updateOne({ _id: vendorId }, { kycStatus: status });
  return status;
}

// Submitting again upserts the same (vendor, type) row rather than creating
// a new one — resubmission is scoped per rejected document, §3.
async function submitDocument(vendorId, role, { type, fileRef }) {
  const doc = await KycDocument.findOneAndUpdate(
    { vendor: vendorId, type },
    { vendor: vendorId, type, fileRef, status: "pending", rejectionReason: null, reviewedBy: null, reviewedAt: null },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
  await recomputeStatus(vendorId, role);
  return doc;
}

async function listDocuments(vendorId) {
  return KycDocument.find({ vendor: vendorId }).sort({ createdAt: 1 });
}

async function reviewDocument(docId, { decision, reason, reviewerId }) {
  const doc = await KycDocument.findById(docId);
  if (!doc) return null;

  const vendor = await User.findById(doc.vendor);
  doc.status = decision;
  doc.rejectionReason = decision === "rejected" ? reason : null;
  doc.reviewedBy = reviewerId;
  doc.reviewedAt = new Date();
  await doc.save();

  await recomputeStatus(doc.vendor, vendor?.role);
  return doc;
}

module.exports = { requiredDocsFor, recomputeStatus, submitDocument, listDocuments, reviewDocument };
