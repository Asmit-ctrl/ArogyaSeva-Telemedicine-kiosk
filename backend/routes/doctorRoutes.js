const express = require("express");
const {
  registerDoctor,
  selfRegisterDoctor,
  loginDoctor,
  getDoctors,
  getDoctorById,
  getMyQueue,
  getMyProfile,
  acceptConsultation,
} = require("../controllers/doctorController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/self-register", selfRegisterDoctor);
router.post("/login", loginDoctor);
router.post("/register", registerDoctor);
router.get("/me", protect, authorizeRoles("doctor"), getMyProfile);
router.get("/me/queue", protect, authorizeRoles("doctor"), getMyQueue);
router.post("/consultations/:consultationId/accept", protect, authorizeRoles("doctor"), acceptConsultation);
router.get("/", protect, getDoctors);
router.get("/:id", protect, getDoctorById);

module.exports = router;
