const Tour = require("../../models/Tour");
const ApiError = require("../../utils/ApiError");
const { ok } = require("../../utils/respond");

const DURATION_BUCKETS = {
  "1-3": { $lte: 3 },
  "4-5": { $gte: 4, $lte: 5 },
  "6+": { $gte: 6 },
};

// Sponsored-slot algorithm, CLAUDE.md §6/§7.2: interleave max 2 sponsored per
// 8 organic — only on relevance sort. Any other sort strips the sponsored
// *placement*, not the listing itself (it just sorts in like anything else).
function interleaveSponsored(list) {
  const sponsored = list.filter((t) => t.sponsored);
  const organic = list.filter((t) => !t.sponsored);
  const merged = [];
  let si = 0;
  let oi = 0;
  while (si < sponsored.length || oi < organic.length) {
    const block = organic.slice(oi, oi + 8);
    oi += 8;
    const take = sponsored.slice(si, si + 2);
    si += 2;
    merged.push(...take, ...block);
  }
  return merged;
}

function primaryDeparture(tour) {
  // Blacked-out departures (vendor availability toggle, §6 vendor/
  // availability) are withdrawn from traveller-facing selection — same
  // visibility-gate pattern as an expired permit or unapproved KYC.
  const visible = tour.departures.filter((d) => !d.blackout);
  const upcoming = visible.filter((d) => d.date.getTime() >= Date.now());
  return upcoming.sort((a, b) => a.date - b.date)[0] || visible[0] || null;
}

function toCard(tour) {
  const dep = primaryDeparture(tour);
  return {
    id: tour._id,
    title: tour.title,
    img: tour.img,
    alt: tour.alt,
    region: tour.region,
    days: tour.days,
    price: tour.price,
    rating: tour.rating,
    reviews: tour.reviews,
    operator: tour.operator,
    meta: tour.meta,
    badge: tour.badge,
    sponsored: tour.sponsored,
    verified: tour.verified,
    bookingMode: tour.bookingMode,
    cancellationPolicy: tour.cancellationPolicy,
    seatsLeft: dep ? dep.seatsLeft : 0,
  };
}

async function listTours(req, res, next) {
  try {
    const {
      where, minPrice, maxPrice, region, duration, verifiedOnly, hasAvailability, sort = "relevance",
    } = req.query;

    const filter = { published: true };

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const regions = region ? String(region).split(",").filter(Boolean) : [];
    if (regions.length) filter.region = { $in: regions };

    // Duration is a multi-select of buckets (1-3/4-5/6+ days, CLAUDE.md §6
    // search) — a tour matches if its `days` falls in ANY selected bucket,
    // so this has to be its own top-level $or, not merged into `filter.days`.
    const durations = duration ? String(duration).split(",").filter((d) => DURATION_BUCKETS[d]) : [];
    if (durations.length) {
      filter.$or = durations.map((d) => ({ days: DURATION_BUCKETS[d] }));
    }

    if (verifiedOnly === "true") filter.verified = true;

    if (where && where.trim()) {
      filter.$text = { $search: where.trim() };
    }

    let tours = await Tour.find(filter).lean({ virtuals: false });
    // Re-hydrate departures' `date` as real Date objects when using .lean()
    // — Mongoose already stores them as Dates, .lean() just returns plain
    // objects, so no conversion is actually needed; kept explicit here only
    // because primaryDeparture()/toCard() assume `.getTime()` exists.
    tours = tours.map((t) => ({ ...t, departures: t.departures.map((d) => ({ ...d, date: new Date(d.date) })) }));

    if (hasAvailability === "true") {
      tours = tours.filter((t) => t.departures.some((d) => d.seatsLeft > 0));
    }

    if (sort === "price-asc") tours.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") tours.sort((a, b) => b.price - a.price);
    else if (sort === "rating") tours.sort((a, b) => b.rating - a.rating);
    else if (sort === "soonest") tours.sort((a, b) => a.days - b.days);

    let cards = tours.map(toCard);
    if (sort !== "relevance") cards = cards.map((c) => ({ ...c, sponsored: false }));
    else cards = interleaveSponsored(cards);

    ok(res, cards);
  } catch (err) {
    next(err);
  }
}

function toDetail(tour) {
  return {
    id: tour._id,
    title: tour.title,
    blurb: tour.blurb,
    img: tour.img,
    alt: tour.alt,
    region: tour.region,
    days: tour.days,
    price: tour.price,
    rating: tour.rating,
    reviews: tour.reviews,
    operator: tour.operator,
    meta: tour.meta,
    badge: tour.badge,
    bookingMode: tour.bookingMode,
    cancellationPolicy: tour.cancellationPolicy,
    facts: tour.facts,
    itinerary: tour.itinerary,
    departures: tour.departures.map((d) => ({
      id: d._id,
      date: d.date,
      note: d.note,
      seatsTotal: d.seatsTotal,
      seatsLeft: d.seatsLeft,
    })),
  };
}

async function getTour(req, res, next) {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour || !tour.published) {
      throw new ApiError(404, "TOUR_NOT_FOUND", "This tour doesn't exist or is no longer listed.");
    }
    ok(res, toDetail(tour));
  } catch (err) {
    next(err);
  }
}

// Bridges the client's pre-existing static mock ids (data/traveler/tours.js's
// `TOURS[].id`, e.g. 'hunza') to a real Mongo tour — `Tour.slug` was seeded
// specifically for this (tours.seed.js's own comment: "legacy mock id...kept
// for the seed/demo data only"). Lets already-built Discovery screens keep
// their existing photography/copy while a real booking is placed against the
// real tour/departure ids underneath.
async function getTourBySlug(req, res, next) {
  try {
    const tour = await Tour.findOne({ slug: req.params.slug });
    if (!tour || !tour.published) {
      throw new ApiError(404, "TOUR_NOT_FOUND", "This tour doesn't exist or is no longer listed.");
    }
    ok(res, toDetail(tour));
  } catch (err) {
    next(err);
  }
}

module.exports = { listTours, getTour, getTourBySlug };
