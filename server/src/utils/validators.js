// Mirrors client/src/utils/validators.js exactly — CLAUDE.md §4 "the same
// rule lives on both sides, not just the client."
const CNIC_RE = /^\d{5}-\d{7}-\d$/;
const CNIC_ERROR = "A CNIC is 13 digits as 00000-0000000-0. Check the number on the card.";

function isValidCnic(value) {
  return CNIC_RE.test(String(value || ""));
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

// Server-side mask, mirroring client/src/pages/vendor/BookingDetail.jsx's
// own maskCnic exactly — a vendor's booking detail should never receive the
// full CNIC over the wire in the first place (§6: "Masked CNIC display"),
// not just render it masked client-side.
function maskCnic(cnic) {
  const m = CNIC_RE.test(String(cnic || "")) ? String(cnic).match(/^(\d{5})-(\d{7})-(\d)$/) : null;
  if (!m) return cnic;
  return `${m[1]}-•••••••-${m[3]}`;
}

module.exports = { CNIC_RE, CNIC_ERROR, isValidCnic, normalizePhone, isValidEmail, maskCnic };
