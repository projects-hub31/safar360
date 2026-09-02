const express = require("express");
const bookingController = require("../../controllers/booking/booking.controller");
const requireAuth = require("../../middleware/auth");
const requireRole = require("../../middleware/requireRole");

const router = express.Router();

router.use(requireAuth);

router.post("/lock", bookingController.startLock);
router.post("/checkout", bookingController.checkout);
router.get("/status/:ref", bookingController.getStatus);
router.get("/history", bookingController.history);
router.post("/:ref/cancel", bookingController.cancelBooking);

router.post("/request", bookingController.createRequest);
router.post("/:ref/operator-decision", requireRole("operator"), bookingController.operatorDecision);

module.exports = router;
