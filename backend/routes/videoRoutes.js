const express = require("express");
const { startVideoSession, getVideoStatus } = require("../controllers/videoController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/start", protect, startVideoSession);
router.get("/status", protect, getVideoStatus);

module.exports = router;
