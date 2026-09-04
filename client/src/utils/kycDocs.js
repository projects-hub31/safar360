// Client slug <-> server type mapping for the identity/kyc wizard (the real
// endpoints live under /api/vendor/kyc/*, server/src/routes/vendor/index.js
// — module 04's route namespace, even though this is an identity-module
// screen, CLAUDE.md §9) and the 4 fixed rejection reasons' human labels —
// mirrors server/src/models/KycDocument.js's DOCUMENT_TYPES/REJECTION_REASONS
// exactly, "the same rule lives on both sides" per CLAUDE.md §4.
//
// Real KYC document review is currently only wired for the `operator` role
// (server/src/routes/vendor/index.js gates the whole /vendor/kyc/documents
// surface behind requireRole('operator') — server/src/services/kyc.service.js's
// own comment: "Only `operator` is in scope for this module"). Kyc.jsx/
// KycPending.jsx/KycRejected.jsx branch on the signed-in role and keep the
// pre-existing local-mock flow for transport/property/seller, rather than
// silently 403ing for roles the backend doesn't support yet.
export const DOC_TYPE = {
  cnicFront: 'cnic_front',
  cnicBack: 'cnic_back',
  registration: 'business_registration',
};

// Human labels for the server's document type enum — used by the admin
// queue (pages/admin/Kyc.jsx), which reviews per real document rather than
// through the client-side slot names (cnicFront/cnicBack/registration)
// DOC_TYPE above exists for.
export const DOC_TYPE_LABEL = {
  cnic_front: 'CNIC — front',
  cnic_back: 'CNIC — back',
  business_registration: 'Business registration',
};

export const REJECTION_LABELS = {
  image_unreadable: 'Image unreadable',
  document_expired: 'Document expired',
  name_mismatch: 'Name mismatch',
  missing_document: 'Missing document',
};

// One server doc -> the { status, filename, reason, id, approved } shape
// DocumentUpload/Kyc.jsx already render. 'pending' and 'approved' server
// statuses both surface as the uploader's own 'done' state (CLAUDE.md §2:
// "Uploaded copy always says 'in review,' never 'verified'") — `approved`
// only changes the pill shown, never unlocks a "Replace" action a real
// approved document shouldn't need.
export function mapOneDocToSlot(doc) {
  if (!doc) return { status: 'empty', filename: null, reason: null, id: null, approved: false };
  if (doc.status === 'rejected') {
    return {
      status: 'rejected',
      filename: doc.fileRef,
      reason: REJECTION_LABELS[doc.rejectionReason] || 'Rejected — resubmit this document.',
      id: doc.id,
      approved: false,
    };
  }
  return { status: 'done', filename: doc.fileRef, reason: null, id: doc.id, approved: doc.status === 'approved' };
}

// The server's flat `documents` array (GET /vendor/kyc/documents) -> the
// { cnicFront, cnicBack, registration } slot shape the wizard's three
// DocumentUpload instances each bind to.
export function mapDocsToSlots(documents) {
  const byType = new Map((documents || []).map((d) => [d.type, d]));
  const slots = {};
  for (const [clientKey, serverType] of Object.entries(DOC_TYPE)) {
    slots[clientKey] = mapOneDocToSlot(byType.get(serverType));
  }
  return slots;
}
