const express = require("express");
const {
  registerKiosk,
  listKiosks,
  getKioskById,
  pingKiosk,
} = require("../controllers/kioskController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", protect, authorizeRoles("admin", "doctor"), registerKiosk);
router.get("/", protect, authorizeRoles("admin", "doctor"), listKiosks);
router.get("/:kioskId", protect, authorizeRoles("admin", "doctor"), getKioskById);
router.patch("/:kioskId/ping", protect, authorizeRoles("admin", "doctor"), pingKiosk);

module.exports = router;
