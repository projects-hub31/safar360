const Tour = require("../../models/Tour");
const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");
const { ok } = require("../../utils/respond");
const { publishGate } = require("../../utils/publishGate");
const subscriptionService = require("../../services/subscription.service");

function toDto(t) {
  return {
    id: t._id,
    title: t.title,
    description: t.blurb,
    region: t.region,
    days: t.days,
    price: t.price,
    photos: t.photos.map((p) => ({ id: p._id, fileRef: p.fileRef, cover: p.cover })),
    bookingMode: t.bookingMode,
    cancellationPolicy: t.cancellationPolicy,
    departures: t.departures.map((d) => ({
      id: d._id,
      date: d.date,
      seatsTotal: d.seatsTotal,
      seatsLeft: d.seatsLeft,
      booked: d.seatsTotal - d.seatsLeft,
      blackout: d.blackout,
    })),
    status: t.status,
    createdAt: t.createdAt,
  };
}

async function findOwned(id, ownerId) {
  const tour = await Tour.findOne({ _id: id, ownerId });
  if (!tour) throw new ApiError(404, "LISTING_NOT_FOUND", "Listing not found.");
  return tour;
}

// POST /api/vendor/listings — a blank draft, same starting shape as the
// client's createDraftListing (VendorContext.jsx).
async function createDraft(req, res, next) {
  try {
    const owner = await User.findById(req.user.id);
    const tour = await Tour.create({
      title: "Untitled listing",
      blurb: "",
      region: "Gilgit-Baltistan",
      days: 3,
      price: 0,
      operator: owner.name || "Unnamed operator",
      ownerId: owner._id,
      bookingMode: "instant",
      cancellationPolicy: "standard",
      photos: [],
      departures: [],
      status: "draft",
      published: false,
      verified: false,
    });
    ok(res, toDto(tour), 201);
  } catch (err) {
    next(err);
  }
}

async function listMine(req, res, next) {
  try {
    const tours = await Tour.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
    ok(res, tours.map(toDto));
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const tour = await findOwned(req.params.id, req.user.id);
    ok(res, toDto(tour));
  } catch (err) {
    next(err);
  }
}

const PATCHABLE_FIELDS = ["title", "region", "days", "price", "bookingMode", "cancellationPolicy"];

async function update(req, res, next) {
  try {
    const tour = await findOwned(req.params.id, req.user.id);
    for (const field of PATCHABLE_FIELDS) {
      if (req.body[field] !== undefined) tour[field] = req.body[field];
    }
    if (req.body.description !== undefined) tour.blurb = req.body.description;
    await tour.save();
    ok(res, toDto(tour));
  } catch (err) {
    next(err);
  }
}

async function addPhoto(req, res, next) {
  try {
    const { fileRef } = req.body;
    if (!fileRef) throw new ApiError(400, "MISSING_FILE", "Attach a photo file.");
    const tour = await findOwned(req.params.id, req.user.id);
    tour.photos.push({ fileRef, cover: tour.photos.length === 0 });
    await tour.save();
    ok(res, toDto(tour), 201);
  } catch (err) {
    next(err);
  }
}

async function removePhoto(req, res, next) {
  try {
    const tour = await findOwned(req.params.id, req.user.id);
    const wasCover = tour.photos.id(req.params.photoId)?.cover;
    tour.photos.pull({ _id: req.params.photoId });
    if (wasCover && tour.photos.length) tour.photos[0].cover = true;
    await tour.save();
    ok(res, toDto(tour));
  } catch (err) {
    next(err);
  }
}

async function setCoverPhoto(req, res, next) {
  try {
    const tour = await findOwned(req.params.id, req.user.id);
    let found = false;
    tour.photos.forEach((p) => {
      const isMatch = String(p._id) === req.params.photoId;
      p.cover = isMatch;
      found = found || isMatch;
    });
    if (!found) throw new ApiError(404, "PHOTO_NOT_FOUND", "Photo not found.");
    await tour.save();
    ok(res, toDto(tour));
  } catch (err) {
    next(err);
  }
}

// POST /api/vendor/listings/:id/publish — the real gate (CLAUDE.md §2 law:
// "the server is the truth"), checked live against the vendor's actual
// KYC/subscription state, never the client's own say-so. Returns
// { ok:false, blockers } on 200 rather than a 4xx, mirroring the client's
// publishListing return shape exactly (VendorContext.jsx) so the calling
// screen's logic doesn't have to branch on status code vs. body.
async function publish(req, res, next) {
  try {
    const tour = await findOwned(req.params.id, req.user.id);
    const [owner, sub] = await Promise.all([
      User.findById(req.user.id),
      subscriptionService.getSettled(req.user.id),
    ]);

    let capBlocked = false;
    if (tour.status !== "published" && sub?.listingCap != null) {
      const publishedCount = await Tour.countDocuments({ ownerId: req.user.id, status: "published" });
      capBlocked = publishedCount >= sub.listingCap;
    }

    const blockers = publishGate(tour, {
      kycApproved: owner.kycStatus === "approved",
      subOk: subscriptionService.publishGateOk(sub),
      capBlocked,
    });

    if (blockers.length) return ok(res, { published: false, blockers });

    tour.status = "published";
    tour.published = true;
    await tour.save();
    ok(res, { published: true, blockers: [] });
  } catch (err) {
    next(err);
  }
}

// POST /api/vendor/listings/:id/departures
async function addDeparture(req, res, next) {
  try {
    const { date, seatsTotal } = req.body;
    if (!date || !(seatsTotal > 0)) throw new ApiError(400, "MISSING_FIELDS", "date and a positive seatsTotal are required.");
    const tour = await findOwned(req.params.id, req.user.id);
    tour.departures.push({ date: new Date(date), seatsTotal, seatsLeft: seatsTotal });
    await tour.save();
    ok(res, toDto(tour), 201);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/vendor/listings/:id/departures/:depId — a hard floor at
// `booked` (§6 vendor/availability): never lets the cap drop below
// travellers who already paid for that date.
async function setDepartureSeats(req, res, next) {
  try {
    const { seatsTotal } = req.body;
    const tour = await findOwned(req.params.id, req.user.id);
    const dep = tour.departures.id(req.params.depId);
    if (!dep) throw new ApiError(404, "DEPARTURE_NOT_FOUND", "Departure not found.");

    const booked = dep.seatsTotal - dep.seatsLeft;
    if (seatsTotal < booked) {
      throw new ApiError(409, "BELOW_BOOKED_FLOOR", `Can't go below ${booked} — travellers already booked those seats.`);
    }
    dep.seatsLeft = seatsTotal - booked;
    dep.seatsTotal = seatsTotal;
    await tour.save();
    ok(res, toDto(tour));
  } catch (err) {
    next(err);
  }
}

async function toggleBlackout(req, res, next) {
  try {
    const tour = await findOwned(req.params.id, req.user.id);
    const dep = tour.departures.id(req.params.depId);
    if (!dep) throw new ApiError(404, "DEPARTURE_NOT_FOUND", "Departure not found.");
    dep.blackout = !dep.blackout;
    await tour.save();
    ok(res, toDto(tour));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createDraft, listMine, getOne, update,
  addPhoto, removePhoto, setCoverPhoto,
  publish, addDeparture, setDepartureSeats, toggleBlackout,
};
