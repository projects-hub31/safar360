const express = require("express");
const { getConfig } = require("../../controllers/admin/config.controller");

const router = express.Router();

// GET /api/admin/config — live policy read. Real write endpoint (super-admin
// only) lands with the admin module's RBAC middleware, later in the plan.
router.get("/config", getConfig);

module.exports = router;
