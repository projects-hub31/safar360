const express = require("express");
const requireAuth = require("../../middleware/auth");
const requireRole = require("../../middleware/requireRole");
const requireAdminPerm = require("../../middleware/requireAdminPerm");
const configController = require("../../controllers/admin/config.controller");
const ledgerController = require("../../controllers/admin/ledger.controller");
const fraudController = require("../../controllers/admin/fraud.controller");
const disputesController = require("../../controllers/admin/disputes.controller");
const payoutBatchesController = require("../../controllers/admin/payoutBatches.controller");
const auditController = require("../../controllers/admin/audit.controller");

const router = express.Router();

// GET /api/admin/config stays public — every module reads live policy
// (fraud threshold, commission default, etc.) and nothing on it is secret,
// matching its pre-existing, deliberate lack of auth from day 1.
router.get("/config", configController.getConfig);

router.use(requireAuth);

// Traveller-facing: filing a dispute on their own booking — mounted ahead of
// the admin-only gate below, same shape as the vendor module's KYC review
// route ("admin-only mounted before the blanket vendor-role gate").
router.post("/disputes", disputesController.create);

router.use(requireRole("admin"));

router.patch("/config", requireAdminPerm("config"), configController.updateConfig);

router.get("/ledger", requireAdminPerm("finance"), ledgerController.getLedger);
router.post("/ledger/:id/reverse", requireAdminPerm("finance"), ledgerController.reverseRow);

router.get("/fraud", requireAdminPerm("fraud"), fraudController.list);
router.post("/fraud/:id/clear", requireAdminPerm("fraud"), fraudController.clear);
router.post("/fraud/:id/refund", requireAdminPerm("fraud"), fraudController.refund);
router.post("/fraud/:id/ask-id", requireAdminPerm("fraud"), fraudController.askForId);

router.get("/disputes", requireAdminPerm("disputes"), disputesController.list);
router.post("/disputes/:id/resolve", requireAdminPerm("disputes"), disputesController.resolve);

router.get("/payout-batches/candidates", requireAdminPerm("finance"), payoutBatchesController.candidates);
router.get("/payout-batches", requireAdminPerm("finance"), payoutBatchesController.list);
router.post("/payout-batches", requireAdminPerm("finance"), payoutBatchesController.prepare);
router.post("/payout-batches/:id/approve", requireAdminPerm("finance"), payoutBatchesController.approve);

router.get("/audit", requireAdminPerm("audit"), auditController.list);

module.exports = router;
