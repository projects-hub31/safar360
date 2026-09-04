const Route = require("../../models/Route");
const Vehicle = require("../../models/Vehicle");
const ApiError = require("../../utils/ApiError");
const { ok } = require("../../utils/respond");

function toDto(r) {
  return {
    id: r._id,
    vehicleId: r.vehicleId,
    from: r.from,
    to: r.to,
    fareMode: r.fareMode,
    wholeFare: r.wholeFare,
    seatFare: r.seatFare,
    minSeats: r.minSeats,
  };
}

// A pricing sheet only (§6) — this never touches inventory, so there's no
// atomic-check equivalent here, unlike every other "create" in this module.
async function create(req, res, next) {
  try {
    const { vehicleId, from, to, fareMode, wholeFare, seatFare, minSeats } = req.body;
    if (!vehicleId || !from || !to || !["whole", "seat"].includes(fareMode)) {
      throw new ApiError(400, "MISSING_FIELDS", "vehicleId, from, to and a valid fareMode are required.");
    }
    if (fareMode === "whole" && !(wholeFare > 0)) {
      throw new ApiError(400, "MISSING_FARE", "A flat fare is required for a whole-vehicle route.");
    }
    if (fareMode === "seat" && (!(seatFare > 0) || !(minSeats >= 1 && minSeats <= 12))) {
      throw new ApiError(400, "MISSING_FARE", "A per-seat fare and a minimum of 1-12 seats are required.");
    }
    const vehicle = await Vehicle.findOne({ _id: vehicleId, ownerId: req.user.id });
    if (!vehicle) throw new ApiError(404, "VEHICLE_NOT_FOUND", "Vehicle not found.");

    const route = await Route.create({
      ownerId: req.user.id, vehicleId, from, to, fareMode,
      wholeFare: fareMode === "whole" ? wholeFare : null,
      seatFare: fareMode === "seat" ? seatFare : null,
      minSeats: fareMode === "seat" ? minSeats : null,
    });
    ok(res, toDto(route), 201);
  } catch (err) {
    next(err);
  }
}

async function listMine(req, res, next) {
  try {
    const routes = await Route.find({ ownerId: req.user.id }).sort({ createdAt: 1 });
    ok(res, routes.map(toDto));
  } catch (err) {
    next(err);
  }
}

module.exports = { create, listMine, toDto };
