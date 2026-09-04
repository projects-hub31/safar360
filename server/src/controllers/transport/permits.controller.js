const Permit = require("../../models/Permit");
const Vehicle = require("../../models/Vehicle");
const ApiError = require("../../utils/ApiError");
const { ok } = require("../../utils/respond");
const { daysLeft, permitStatusLabel } = require("../../utils/transport");

const DAY_MS = 86400000;
const RENEW_DAYS = 365;

function toDto(p) {
  const left = daysLeft(p.expiresAt);
  return {
    id: p._id,
    vehicleId: p.vehicleId,
    number: p.number,
    region: p.region,
    daysLeft: left,
    status: permitStatusLabel(left),
  };
}

// Adding a permit and linking it to a vehicle is what actually makes that
// vehicle need one — the client mock never wired this connection (Vehicles.jsx
// has no way to set `needsPermit` at all, and the old Permits.jsx never
// flipped it either), which meant the permit gate was only ever exercised by
// seed data. Fixed here since a permit that doesn't gate its own vehicle
// isn't a real permit.
async function create(req, res, next) {
  try {
    const { vehicleId, number, region, daysLeft: daysUntilExpiry } = req.body;
    if (!vehicleId || !number || !region || !(daysUntilExpiry >= 0)) {
      throw new ApiError(400, "MISSING_FIELDS", "vehicleId, number, region and daysLeft are required.");
    }
    const vehicle = await Vehicle.findOne({ _id: vehicleId, ownerId: req.user.id });
    if (!vehicle) throw new ApiError(404, "VEHICLE_NOT_FOUND", "Vehicle not found.");

    const expiresAt = new Date(Date.now() + daysUntilExpiry * DAY_MS);
    const permit = await Permit.create({ ownerId: req.user.id, vehicleId, number, region, expiresAt });

    vehicle.needsPermit = true;
    vehicle.permitId = permit._id;
    await vehicle.save();

    ok(res, toDto(permit), 201);
  } catch (err) {
    next(err);
  }
}

async function listMine(req, res, next) {
  try {
    const permits = await Permit.find({ ownerId: req.user.id }).sort({ createdAt: 1 });
    ok(res, permits.map(toDto));
  } catch (err) {
    next(err);
  }
}

async function renew(req, res, next) {
  try {
    const permit = await Permit.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!permit) throw new ApiError(404, "PERMIT_NOT_FOUND", "Permit not found.");
    permit.expiresAt = new Date(Date.now() + RENEW_DAYS * DAY_MS);
    await permit.save();
    ok(res, toDto(permit));
  } catch (err) {
    next(err);
  }
}

module.exports = { create, listMine, renew, toDto };
