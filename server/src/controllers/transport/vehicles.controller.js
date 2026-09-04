const Vehicle = require("../../models/Vehicle");
const ApiError = require("../../utils/ApiError");
const { ok } = require("../../utils/respond");

function toDto(v) {
  return {
    id: v._id,
    name: v.name,
    type: v.type,
    capacity: v.capacity,
    active: v.active,
    needsPermit: v.needsPermit,
    permitId: v.permitId,
  };
}

async function create(req, res, next) {
  try {
    const { name, type, capacity } = req.body;
    if (!name || !type || !(capacity > 0)) {
      throw new ApiError(400, "MISSING_FIELDS", "name, type and a positive capacity are required.");
    }
    const vehicle = await Vehicle.create({ ownerId: req.user.id, name, type, capacity });
    ok(res, toDto(vehicle), 201);
  } catch (err) {
    next(err);
  }
}

async function listMine(req, res, next) {
  try {
    const vehicles = await Vehicle.find({ ownerId: req.user.id }).sort({ createdAt: 1 });
    ok(res, vehicles.map(toDto));
  } catch (err) {
    next(err);
  }
}

// PATCH /api/transport/vehicles/:id — only `active` is toggled from the UI
// today, but accepts any of the client-editable fields for parity with the
// vendor listing PATCH convention.
async function update(req, res, next) {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!vehicle) throw new ApiError(404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
    for (const field of ["name", "type", "capacity", "active"]) {
      if (req.body[field] !== undefined) vehicle[field] = req.body[field];
    }
    await vehicle.save();
    ok(res, toDto(vehicle));
  } catch (err) {
    next(err);
  }
}

module.exports = { create, listMine, update, toDto };
