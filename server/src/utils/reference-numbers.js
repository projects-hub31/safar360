const crypto = require("crypto");

// Reference number formats, CLAUDE.md §4. Bookings/orders/ledger rows all
// read back through these so the format lives in one place, not re-derived
// per module.
function datePart() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}${day}`;
}

function randomDigits(n) {
  const max = 10 ** n;
  return String(crypto.randomInt(0, max)).padStart(n, "0");
}

function genBookingRef() {
  return `SFR-${datePart()}-${randomDigits(4)}`;
}

function genOrderRef() {
  return `ORD-${datePart()}-${randomDigits(4)}`;
}

function genPaymentId() {
  return `pay_${crypto.randomBytes(6).toString("hex")}`;
}

function genLedgerId() {
  return `LG-${randomDigits(4)}`;
}

module.exports = { genBookingRef, genOrderRef, genPaymentId, genLedgerId };
