const express = require("express");
const toursController = require("../../controllers/discover/tours.controller");

const router = express.Router();

router.get("/tours", toursController.listTours);
router.get("/tours/:id", toursController.getTour);

module.exports = router;
