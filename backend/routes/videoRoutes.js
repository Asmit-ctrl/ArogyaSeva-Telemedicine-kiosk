const express = require("express");
const { startVideoSession, getVideoStatus } = require("../controllers/videoController");

const router = express.Router();

router.post("/start", startVideoSession);
router.get("/status", getVideoStatus);

module.exports = router;
