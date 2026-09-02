const mongoose = require("mongoose");

// The soft-lock as a Mongo TTL key (CLAUDE.md §3/§4: "a Redis TTL key
// design... not a timestamp field polled on read"). Redis isn't provisioned
// (§9's day-1 decision), so this collection with an `expireAfterSeconds: 0`
// index on `expiresAt` is the fallback — MongoDB's background TTL monitor
// deletes the doc once it elapses, same "auto-expiring key" behaviour, no
// cron/poll needed. `lock.service.js` additionally re-checks `expiresAt`
// itself on every read, since Mongo's TTL sweep runs on its own ~60s cycle
// and isn't instant.
const lockSchema = new mongoose.Schema(
  {
    tour: { type: mongoose.Schema.Types.ObjectId, ref: "Tour", required: true, index: true },
    departureId: { type: mongoose.Schema.Types.ObjectId, required: true },
    departureDate: { type: Date, required: true },
    seats: { type: Number, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Snapshot fields — a lock must reprice/re-describe consistently through
    // checkout even if the tour document changes underneath it.
    title: String,
    price: Number,
    cancellationPolicy: { type: String, enum: ["flexible", "standard", "strict"], default: "standard" },

    extended: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

lockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Lock", lockSchema);
