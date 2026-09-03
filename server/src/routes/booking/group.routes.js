const express = require("express");
const requireAuth = require("../../middleware/auth");
const groupController = require("../../controllers/booking/group.controller");

// Mounted at /api/booking/group, BEFORE the requireAuth-blanketed
// /api/booking router (routes/index.js) — a group-split participant has no
// account at all by design (§3: "a participant with no account at all can
// still pay their share through the guest pay-link"), so most of this
// router must stay reachable with no token. Only starting a split needs a
// signed-in organizer, applied per-route rather than as a blanket
// `router.use`, same pattern routes/vendor/index.js uses for its one
// admin-only route ahead of its own operator-only blanket.
const router = express.Router();

router.post("/start", requireAuth, groupController.start);
router.get("/:id", groupController.getStatus);
router.post("/:id/participants/:index/pay", groupController.payShare);

module.exports = router;
