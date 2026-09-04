const Tour = require("../../models/Tour");
const Booking = require("../../models/Booking");
const LedgerRow = require("../../models/LedgerRow");
const User = require("../../models/User");
const { ok } = require("../../utils/respond");

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TRAILING_MONTHS = 6;

// GET /api/vendor/analytics — CLAUDE.md §6 vendor/analytics: real KPIs +
// bookings-by-month, no vanity metrics. Traffic-source breakdown is
// deliberately NOT part of this response — there's no referral/campaign
// click-tracking backend yet (that lands with §9 days 12-13's referral
// module), so the client keeps that one section honestly labeled as
// illustrative rather than this endpoint inventing numbers it can't back.
async function getAnalytics(req, res, next) {
  try {
    const [vendor, tours] = await Promise.all([
      User.findById(req.user.id),
      Tour.find({ ownerId: req.user.id }).select("_id"),
    ]);
    const tourIds = tours.map((t) => t._id);

    const since = new Date();
    since.setDate(1);
    since.setHours(0, 0, 0, 0);
    since.setMonth(since.getMonth() - (TRAILING_MONTHS - 1));

    const [bookingsCount, acceptedCount, autoDeclinedCount, ledgerRows, monthlyRows] = await Promise.all([
      Booking.countDocuments({ tour: { $in: tourIds }, status: "confirmed" }),
      Booking.countDocuments({ tour: { $in: tourIds }, requestState: "accepted" }),
      Booking.countDocuments({ tour: { $in: tourIds }, requestState: "declined", autoDeclined: true }),
      LedgerRow.find({ party: vendor.name }),
      Booking.aggregate([
        { $match: { tour: { $in: tourIds }, status: "confirmed", createdAt: { $gte: since } } },
        { $group: { _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } }, count: { $sum: 1 } } },
      ]),
    ]);

    // Net earned: a reversed row clawed back an already-accrued commission
    // (§3 ledger), so it counts negative here rather than being dropped —
    // the same "netted against the next payout" framing Payouts.jsx shows.
    const netEarned = ledgerRows.reduce((n, r) => n + (r.state === "reversed" ? -r.net : r.net), 0);

    const acceptedOrTimedOut = acceptedCount + autoDeclinedCount;
    const acceptanceRate = acceptedOrTimedOut > 0 ? Math.round((acceptedCount / acceptedOrTimedOut) * 100) : null;

    const monthlyMap = new Map(monthlyRows.map((r) => [`${r._id.y}-${r._id.m}`, r.count]));
    const monthly = [];
    const cursor = new Date(since);
    for (let i = 0; i < TRAILING_MONTHS; i += 1) {
      const key = `${cursor.getFullYear()}-${cursor.getMonth() + 1}`;
      monthly.push({ label: MONTH_LABELS[cursor.getMonth()], bookings: monthlyMap.get(key) || 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    ok(res, { bookingsCount, netEarned, acceptanceRate, monthly });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAnalytics };
