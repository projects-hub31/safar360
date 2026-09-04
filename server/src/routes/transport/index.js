const express = require("express");
const requireAuth = require("../../middleware/auth");
const requireRole = require("../../middleware/requireRole");
const vehiclesController = require("../../controllers/transport/vehicles.controller");
const permitsController = require("../../controllers/transport/permits.controller");
const routesController = require("../../controllers/transport/routes.controller");
const roomsController = require("../../controllers/transport/rooms.controller");
const menuController = require("../../controllers/transport/menu.controller");
const leadsController = require("../../controllers/transport/leads.controller");

const router = express.Router();

router.use(requireAuth);

// --- traveller-facing (any authenticated role) --------------------------
router.post("/leads", leadsController.create);
router.get("/leads/mine", leadsController.listMine);
router.post("/leads/:id/accept", leadsController.accept);
router.post("/rooms/:id/book", roomsController.book);
router.get("/room-bookings/mine", roomsController.myBookings);
router.post("/room-bookings/:ref/cancel", roomsController.cancelBooking);

// --- transport owner ------------------------------------------------------
router.post("/vehicles", requireRole("transport"), vehiclesController.create);
router.get("/vehicles", requireRole("transport"), vehiclesController.listMine);
router.patch("/vehicles/:id", requireRole("transport"), vehiclesController.update);

router.post("/permits", requireRole("transport"), permitsController.create);
router.get("/permits", requireRole("transport"), permitsController.listMine);
router.post("/permits/:id/renew", requireRole("transport"), permitsController.renew);

router.post("/routes", requireRole("transport"), routesController.create);
router.get("/routes", requireRole("transport"), routesController.listMine);

// --- property owner --------------------------------------------------------
router.post("/rooms", requireRole("property"), roomsController.create);
router.get("/rooms", requireRole("property"), roomsController.listMine);
router.patch("/rooms/:id", requireRole("property"), roomsController.setTotal);

router.post("/menu", requireRole("property"), menuController.create);
router.get("/menu", requireRole("property"), menuController.listMine);
router.patch("/menu/:id/toggle", requireRole("property"), menuController.toggle);

// --- shared lead management (transport OR property owner) -----------------
router.get("/leads", requireRole("transport", "property"), leadsController.listOwnerInbox);
router.post("/leads/:id/quote", requireRole("transport", "property"), leadsController.sendQuote);
router.post("/leads/:id/decline", requireRole("transport", "property"), leadsController.decline);
router.post("/leads/:id/withdraw", requireRole("transport", "property"), leadsController.withdraw);

module.exports = router;
