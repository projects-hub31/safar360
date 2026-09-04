// Mirrors client/src/context/vendor/vendor-context.js's DECLINE_REASONS
// exactly — CLAUDE.md §6 vendor/booking (detail): "Decline requires exactly
// one of 4 fixed reasons." Validated server-side too, same "the same rule
// lives on both sides" convention as utils/validators.js.
const DECLINE_REASONS = [
  { id: "guides", label: "No guide available that week" },
  { id: "weather", label: "Weather or road conditions" },
  { id: "minimum", label: "Below my minimum group size" },
  { id: "permits", label: "Permits won't clear in time" },
];

const DECLINE_REASON_IDS = DECLINE_REASONS.map((r) => r.id);

function labelForReason(id) {
  return DECLINE_REASONS.find((r) => r.id === id)?.label || null;
}

module.exports = { DECLINE_REASONS, DECLINE_REASON_IDS, labelForReason };
