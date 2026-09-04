const ApiError = require("../../utils/ApiError");
const { ok } = require("../../utils/respond");
const { DOCUMENT_TYPES, REJECTION_REASONS } = require("../../models/KycDocument");
const kycService = require("../../services/kyc.service");

function toDto(doc) {
  return {
    id: doc._id,
    type: doc.type,
    fileRef: doc.fileRef,
    status: doc.status,
    rejectionReason: doc.rejectionReason,
    reviewedAt: doc.reviewedAt,
    at: doc.createdAt,
  };
}

// POST /api/vendor/kyc/documents — submit or resubmit one document.
async function submit(req, res, next) {
  try {
    const { type, fileRef } = req.body;
    if (!DOCUMENT_TYPES.includes(type)) throw new ApiError(400, "INVALID_TYPE", "Unrecognized document type.");
    if (!fileRef) throw new ApiError(400, "MISSING_FILE", "Attach a file before submitting.");

    const doc = await kycService.submitDocument(req.user.id, req.user.role, { type, fileRef });
    ok(res, toDto(doc), 201);
  } catch (err) {
    next(err);
  }
}

// GET /api/vendor/kyc/documents — the vendor's own document set plus the
// list of types still required, so the wizard knows what's left.
async function list(req, res, next) {
  try {
    const docs = await kycService.listDocuments(req.user.id);
    ok(res, {
      documents: docs.map(toDto),
      required: kycService.requiredDocsFor(req.user.role),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/vendor/kyc/documents/queue — admin-only, one row per vendor with
// at least one document submitted (kyc.service.js's listQueue groups the
// per-document rows into this shape — a reviewer decides per document, but
// browses per vendor application).
async function queue(req, res, next) {
  try {
    const rows = await kycService.listQueue();
    ok(res, rows.map((r) => ({
      vendorId: r.vendorId,
      vendorName: r.vendorName,
      vendorType: r.vendorType,
      status: r.status,
      submittedAt: new Date(r.submittedAt),
      documents: r.documents.map(toDto),
    })));
  } catch (err) {
    next(err);
  }
}

// POST /api/vendor/kyc/documents/:id/review — admin-only. Reject requires
// exactly one of the 4 fixed reasons; the reason is shown to the vendor
// verbatim (§3), never paraphrased, so there's nothing to translate here.
async function review(req, res, next) {
  try {
    const { decision, reason } = req.body;
    if (!["approved", "rejected"].includes(decision)) {
      throw new ApiError(400, "INVALID_DECISION", "decision must be 'approved' or 'rejected'.");
    }
    if (decision === "rejected" && !REJECTION_REASONS.includes(reason)) {
      throw new ApiError(400, "INVALID_REASON", "Pick one of the 4 fixed rejection reasons.");
    }

    const doc = await kycService.reviewDocument(req.params.id, { decision, reason, reviewerId: req.user.id });
    if (!doc) throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found.");
    ok(res, toDto(doc));
  } catch (err) {
    next(err);
  }
}

module.exports = { submit, list, queue, review };
