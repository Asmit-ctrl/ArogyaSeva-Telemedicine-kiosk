const express = require("express");
const {
  registerPatient,
  getPatientById,
  getAllPatients,
} = require("../controllers/patientController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerPatient);
router.get("/", protect, getAllPatients);
router.get("/:id", protect, getPatientById);

module.exports = router;
