const express = require("express");
const adminConfigRoutes = require("./admin/config.routes");
const identityRoutes = require("./identity");
const discoverRoutes = require("./discover");
const bookingRoutes = require("./booking");
const webhookRoutes = require("./webhooks");
const vendorRoutes = require("./vendor");

const router = express.Router();

// Every module mounts its own routes/<module>/*.routes.js here as it's built —
// this file stays the one place that wires the module tree together.
router.use("/admin", adminConfigRoutes);
router.use("/identity", identityRoutes);
router.use("/discover", discoverRoutes);
router.use("/booking", bookingRoutes);
router.use("/webhooks", webhookRoutes);
router.use("/vendor", vendorRoutes);

module.exports = router;
