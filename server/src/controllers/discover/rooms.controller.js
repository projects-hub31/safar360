const Room = require("../../models/Room");
const { ok } = require("../../utils/respond");

// Public room search. There's no real multi-property catalog/search UI yet
// (PropertyDetail.jsx shows one hardcoded demo lodge, the same single-vendor
// simplification TourDetail's own slug-bridge note documents for tours) — so
// this returns one arbitrary property owner's full room set (the earliest
// created) rather than building a search this pass doesn't need yet. The
// `ownerId` in the response is what a traveller's table/group enquiry and
// room booking actually target.
async function list(req, res, next) {
  try {
    const firstRoom = await Room.findOne().sort({ createdAt: 1 });
    if (!firstRoom) return ok(res, { ownerId: null, rooms: [] });

    const rooms = await Room.find({ ownerId: firstRoom.ownerId }).sort({ createdAt: 1 });
    ok(res, {
      ownerId: firstRoom.ownerId,
      rooms: rooms.map((r) => ({ id: r._id, name: r.name, capacity: r.capacity, nightlyRate: r.nightlyRate, total: r.total, booked: r.booked })),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { list };
