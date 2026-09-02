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

module.exports = { CNIC_RE, CNIC_ERROR, isValidCnic, normalizePhone, isValidEmail };
