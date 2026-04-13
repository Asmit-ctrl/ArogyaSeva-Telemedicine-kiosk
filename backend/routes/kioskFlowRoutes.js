const express = require("express");
const {
  upsertPatient,
  runKioskTriage,
  getPatientRecords,
  getConsultation,
  completeConsultation,
  assistantChat,
} = require("../controllers/kioskFlowController");

const router = express.Router();

router.post("/intake", upsertPatient);
router.post("/triage", runKioskTriage);
router.post("/assistant/chat", assistantChat);
router.get("/patients/:patientId/records", getPatientRecords);
router.get("/consultations/:consultationId", getConsultation);
router.post("/consultations/:consultationId/complete", completeConsultation);

module.exports = router;
