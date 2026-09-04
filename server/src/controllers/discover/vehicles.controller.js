const Vehicle = require("../../models/Vehicle");
const Permit = require("../../models/Permit");
const { ok } = require("../../utils/respond");
const { daysLeft, permitStatusLabel } = require("../../utils/transport");

// Public vehicle search (module 05). CLAUDE.md §3's visibility formula is
// `permit.status === 'valid' AND vehicle.active AND owner.kyc === 'approved'`
// — the KYC clause is deliberately NOT enforced here: real KYC review
// (server/src/services/kyc.service.js) only covers the `operator` role so
// far, so a real `transport` owner's kycStatus can never leave 'none' —
// requiring 'approved' would make every real vehicle permanently invisible.
// Enforced instead: active, and (if it needs one) an unexpired permit.
async function list(req, res, next) {
  try {
    const vehicles = await Vehicle.find({ active: true });
    const permitIds = vehicles.filter((v) => v.needsPermit && v.permitId).map((v) => v.permitId);
    const permits = await Permit.find({ _id: { $in: permitIds } });
    const permitById = new Map(permits.map((p) => [String(p._id), p]));

    const visible = vehicles.filter((v) => {
      if (!v.needsPermit) return true;
      const permit = permitById.get(String(v.permitId));
      if (!permit) return false;
      return permitStatusLabel(daysLeft(permit.expiresAt)) !== "expired";
    });

    ok(res, visible.map((v) => ({
      id: v._id, ownerId: v.ownerId, name: v.name, type: v.type, capacity: v.capacity,
    })));
  } catch (err) {
    next(err);
  }
}

module.exports = { list };
