const mongoose = require("mongoose");

const departureSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    note: String,
    seatsTotal: { type: Number, required: true },
    seatsLeft: { type: Number, required: true },
    blackout: { type: Boolean, default: false }, // vendor availability toggle, §6 vendor/availability
  },
  { _id: true }
);

const photoSchema = new mongoose.Schema(
  { fileRef: { type: String, required: true }, cover: { type: Boolean, default: false } },
  { _id: true }
);

const factSchema = new mongoose.Schema({ k: String, v: String }, { _id: false });
const dayPlanSchema = new mongoose.Schema({ n: String, t: String, b: String }, { _id: false });

// Mirrors client/src/data/traveler/tours.js's TOURS + TOUR_DETAILS shape
// (CLAUDE.md §6 "01 · Discovery" / §3 "Booking mode & cancellation policy —
// per listing, not global") — the real collection the seed script migrates
// that mock data into.
const tourSchema = new mongoose.Schema(
  {
    slug: { type: String, unique: true, sparse: true, index: true }, // legacy mock id (e.g. 'hunza'), kept for the seed/demo data only
    title: { type: String, required: true },
    blurb: String,
    img: String,
    alt: String,
    region: { type: String, required: true, index: true },
    days: { type: Number, required: true }, // trip duration in days
    price: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    operator: { type: String, required: true }, // display name, copied from the owning vendor's User.name at creation time
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }, // real vendor link, added with the vendor backend pass — null on legacy/seed tours
    meta: String,
    badge: String,
    sponsored: { type: Boolean, default: false },
    verified: { type: Boolean, default: true },
    bookingMode: { type: String, enum: ["instant", "request"], default: "instant" },
    cancellationPolicy: { type: String, enum: ["flexible", "standard", "strict"], default: "standard" },
    facts: [factSchema],
    itinerary: [dayPlanSchema],
    departures: [departureSchema],
    photos: [photoSchema],
    // `status` is the vendor-facing lifecycle value; `published` is kept in
    // sync by the controller that changes it (discover's query already
    // filters on `published` — kept as the one boolean it reads rather than
    // rewriting that query to compare against `status` everywhere).
    status: { type: String, enum: ["draft", "published", "unpublished"], default: "published" },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

tourSchema.index({ title: "text", meta: "text", region: "text" });

module.exports = mongoose.model("Tour", tourSchema);
