const mongoose = require("mongoose");
const Consultation = require("../models/Consultation");
const Patient = require("../models/Patient");
const Prescription = require("../models/Prescription");

const resolvePatient = async (patientKey) => {
  if (mongoose.Types.ObjectId.isValid(patientKey)) {
    return Patient.findOne({ $or: [{ _id: patientKey }, { patientId: patientKey }] });
  }

  return Patient.findOne({ patientId: patientKey });
};

const buildConsultationQuery = (consultationKey) => {
  if (mongoose.Types.ObjectId.isValid(consultationKey)) {
    return { $or: [{ _id: consultationKey }, { consultationId: consultationKey }] };
  }

  return { consultationId: consultationKey };
};

const createPrescription = async (req, res) => {
  try {
    const { consultationId, doctorNotes, medicines } = req.body;

    if (!consultationId) {
      return res.status(400).json({ message: "consultationId is required" });
    }

    const consultation = await Consultation.findOne(buildConsultationQuery(consultationId));
    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    const prescription = await Prescription.create({
      consultationId: consultation._id,
      doctorNotes,
      medicines,
    });

    return res.status(201).json(prescription);
  } catch (error) {
    return res.status(400).json({ message: "Failed to create prescription", error: error.message });
  }
};

const getPrescriptionsByPatient = async (req, res) => {
  try {
    const patient = await resolvePatient(req.params.patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const consultations = await Consultation.find({ patientId: patient._id }).select("_id");
    const consultationIds = consultations.map((item) => item._id);

    const prescriptions = await Prescription.find({ consultationId: { $in: consultationIds } })
      .sort({ createdAt: -1 })
      .populate({
        path: "consultationId",
        select: "consultationId patientId doctorId status createdAt",
        populate: [
          { path: "doctorId", select: "doctorId name specialization" },
          { path: "patientId", select: "patientId name village" },
        ],
      });

    return res.status(200).json(prescriptions);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch prescriptions", error: error.message });
  }
};

module.exports = {
  createPrescription,
  getPrescriptionsByPatient,
};
