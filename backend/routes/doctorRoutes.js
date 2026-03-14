const express = require("express");
const {
  registerDoctor,
  getDoctors,
  getDoctorById,
} = require("../controllers/doctorController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerDoctor);
router.get("/", protect, getDoctors);
router.get("/:id", protect, getDoctorById);

module.exports = router;
