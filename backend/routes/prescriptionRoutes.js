const express = require("express");
const {
  createPrescription,
  getPrescriptionsByPatient,
} = require("../controllers/prescriptionController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createPrescription);
router.get("/:patientId", protect, getPrescriptionsByPatient);

module.exports = router;
