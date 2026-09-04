const express = require("express");
const adminRoutes = require("./admin");
const identityRoutes = require("./identity");
const discoverRoutes = require("./discover");
const bookingRoutes = require("./booking");
const groupRoutes = require("./booking/group.routes");
const webhookRoutes = require("./webhooks");
const vendorRoutes = require("./vendor");
const transportRoutes = require("./transport");

const router = express.Router();

// Every module mounts its own routes/<module>/*.routes.js here as it's built —
// this file stays the one place that wires the module tree together.
router.use("/admin", adminRoutes);
router.use("/identity", identityRoutes);
router.use("/discover", discoverRoutes);
// Mounted at the more specific path FIRST — group-split's participant
// endpoints must stay reachable with no auth (§3), so they can't live behind
// bookingRoutes' blanket `router.use(requireAuth)` below.
router.use("/booking/group", groupRoutes);
router.use("/booking", bookingRoutes);
router.use("/webhooks", webhookRoutes);
router.use("/vendor", vendorRoutes);
router.use("/transport", transportRoutes);

module.exports = router;
