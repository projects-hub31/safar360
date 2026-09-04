const express = require("express");
const toursController = require("../../controllers/discover/tours.controller");
const vehiclesController = require("../../controllers/discover/vehicles.controller");
const roomsController = require("../../controllers/discover/rooms.controller");

const router = express.Router();

router.get("/tours", toursController.listTours);
router.get("/tours/slug/:slug", toursController.getTourBySlug);
router.get("/tours/:id", toursController.getTour);

router.get("/vehicles", vehiclesController.list);
router.get("/rooms", roomsController.list);

module.exports = router;
