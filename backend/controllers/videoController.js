const Consultation = require("../models/Consultation");
const { buildLookup } = require("../utils/entityResolvers");
const { buildVideoToken, isTwilioConfigured, sanitizeIdentity } = require("../services/twilioService");

const startVideoSession = async (req, res) => {
  try {
    const { consultationId, participantName, participantRole } = req.body;

    if (!consultationId) {
      return res.status(400).json({ message: "consultationId is required" });
    }

    const consultation = await Consultation.findOne(buildLookup("consultationId", consultationId)).populate(
      "patientId doctorId"
    );
    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    const identity = sanitizeIdentity(
      participantName ||
        `${participantRole || "kiosk"}-${consultation.consultationId}-${consultation.patientId?.patientId || "guest"}`
    );

    return res.status(200).json({
      consultationId: consultation.consultationId,
      roomName: consultation.roomName,
      identity,
      twilioEnabled: isTwilioConfigured(),
      token: buildVideoToken({
        identity,
        roomName: consultation.roomName,
      }),
      assignedDoctor: consultation.doctorId
        ? {
            doctorId: consultation.doctorId.doctorId,
            name: consultation.doctorId.name,
            specialization: consultation.doctorId.specialization,
          }
        : null,
      status: consultation.status,
    });
  } catch (error) {
    return res.status(400).json({ message: "Failed to start video session", error: error.message });
  }
};

const getVideoStatus = async (req, res) => {
  return res.status(200).json({
    status: isTwilioConfigured() ? "ready" : "configuration-required",
    twilioEnabled: isTwilioConfigured(),
  });
};

module.exports = { startVideoSession, getVideoStatus };
