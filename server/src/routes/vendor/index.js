const express = require("express");
const requireAuth = require("../../middleware/auth");
const requireRole = require("../../middleware/requireRole");
const subscriptionController = require("../../controllers/vendor/subscription.controller");
const kycController = require("../../controllers/vendor/kyc.controller");
const listingsController = require("../../controllers/vendor/listings.controller");
const ledgerController = require("../../controllers/vendor/ledger.controller");

const router = express.Router();

router.use(requireAuth);

// KYC review is admin-only — mounted before the blanket vendor-role gate
// below, since a sub-admin doing KYC review is never an 'operator'.
router.post("/kyc/documents/:id/review", requireRole("admin"), kycController.review);

// Everything else in this module is the tour-operator's own vendor console
// (module 04 scope — transport/property owners get their own module, 05).
router.use(requireRole("operator"));

router.get("/subscription", subscriptionController.getSubscription);
router.post("/subscription/subscribe", subscriptionController.subscribe);
router.post("/subscription/cancel", subscriptionController.cancel);
router.post("/subscription/simulate-charge-failure", subscriptionController.simulateChargeFailure);
router.post("/subscription/retry", subscriptionController.retryCharge);
router.post("/subscription/exhaust-retries", subscriptionController.exhaustRetries);

router.get("/kyc/documents", kycController.list);
router.post("/kyc/documents", kycController.submit);

router.post("/listings", listingsController.createDraft);
router.get("/listings", listingsController.listMine);
router.get("/listings/:id", listingsController.getOne);
router.patch("/listings/:id", listingsController.update);
router.post("/listings/:id/photos", listingsController.addPhoto);
router.delete("/listings/:id/photos/:photoId", listingsController.removePhoto);
router.post("/listings/:id/photos/:photoId/cover", listingsController.setCoverPhoto);
router.post("/listings/:id/publish", listingsController.publish);
router.post("/listings/:id/departures", listingsController.addDeparture);
router.patch("/listings/:id/departures/:depId", listingsController.setDepartureSeats);
router.post("/listings/:id/departures/:depId/blackout", listingsController.toggleBlackout);

router.get("/ledger", ledgerController.getLedger);
router.post("/ledger/:id/reverse", ledgerController.reverseRow);

module.exports = router;
