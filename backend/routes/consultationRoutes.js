const express = require("express");
const {
  startConsultation,
  endConsultation,
  getConsultations,
} = require("../controllers/consultationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/start", protect, startConsultation);
router.post("/end", protect, endConsultation);
router.get("/", protect, getConsultations);

module.exports = router;
