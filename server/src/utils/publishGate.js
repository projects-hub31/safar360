// Ported verbatim from client/src/context/vendor/VendorContext.jsx's
// publishGate — same blocker copy, same order — so the client and server
// checks can never silently drift (CLAUDE.md §2 law: "the server is the
// truth", checked live, not just at wizard-submit time).
function publishGate(listing, { kycApproved, subOk, capBlocked }) {
  const blockers = [];
  if (!kycApproved) blockers.push("Identity verification (KYC) is not approved yet");
  if (!subOk) blockers.push("Your subscription needs to be active or in its grace period");
  const photoCount = listing.photos.length;
  if (photoCount < 3) {
    blockers.push(`Add ${3 - photoCount} more photo${3 - photoCount === 1 ? "" : "s"} (3 minimum)`);
  }
  if (!(listing.price > 0)) blockers.push("Set a price per person");
  if (listing.departures.length < 1) blockers.push("Add at least one departure in Availability");
  if (capBlocked) blockers.push("Your plan's listing cap is reached — upgrade to publish more listings");
  return blockers;
}

module.exports = { publishGate };
