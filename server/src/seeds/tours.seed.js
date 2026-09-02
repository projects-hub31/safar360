// Run with: npm run seed:tours
// Migrates client/src/data/traveler/tours.js's TOURS + TOUR_DETAILS + the
// AVAILABILITY seed into the real Tour collection (CLAUDE.md §9 days 4-7:
// "seed-migrate data/traveler/tours.js"). Can't `require()` that file
// directly — it's an ES module that imports .jpg assets, which only resolve
// through Vite's bundler — so the same rows are transcribed by hand in
// tours.seed.data.js. `img` is a placeholder path; real listing photos
// arrive with the vendor module's upload flow, not this pass.
const connectDB = require("../config/db");
const mongoose = require("mongoose");
const Tour = require("../models/Tour");
const { TOURS, departuresFor } = require("./tours.seed.data");

async function seed() {
  await connectDB();

  for (const t of TOURS) {
    const { groupMax, seatsLeft, ...rest } = t;
    await Tour.findOneAndUpdate(
      { slug: t.slug },
      { ...rest, departures: departuresFor(seatsLeft, groupMax), verified: true, published: true },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
  }

  const count = await Tour.countDocuments();
  console.log(`Tours seeded. ${count} tour(s) now in the collection.`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Tour seed failed:", err);
  process.exit(1);
});
