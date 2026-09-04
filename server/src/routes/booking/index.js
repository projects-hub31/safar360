const express = require("express");
const bookingController = require("../../controllers/booking/booking.controller");
const requireAuth = require("../../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.post("/lock", bookingController.startLock);
router.post("/checkout", bookingController.checkout);
router.get("/status/:ref", bookingController.getStatus);
router.get("/history", bookingController.history);
router.post("/:ref/cancel", bookingController.cancelBooking);

router.post("/request", bookingController.createRequest);
// The operator side of this flow (accept/decline) is ownership-scoped and
// lives at POST /api/vendor/bookings/:ref/decision (routes/vendor/index.js)
// — see booking.controller.js's own note on why it moved there.

module.exports = router;
