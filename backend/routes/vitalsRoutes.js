const express = require("express");
const { createVitals, getVitalsByPatient } = require("../controllers/vitalsController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createVitals);
router.get("/:patientId", protect, getVitalsByPatient);

module.exports = router;
