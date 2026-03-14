const mongoose = require("mongoose");
const Consultation = require("../models/Consultation");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");

const resolvePatient = async (patientKey) => {
  if (mongoose.Types.ObjectId.isValid(patientKey)) {
    return Patient.findOne({ $or: [{ _id: patientKey }, { patientId: patientKey }] });
  }

  return Patient.findOne({ patientId: patientKey });
};

const resolveDoctor = async (doctorKey) => {
  if (mongoose.Types.ObjectId.isValid(doctorKey)) {
    return Doctor.findOne({ $or: [{ _id: doctorKey }, { doctorId: doctorKey }] });
  }

  return Doctor.findOne({ doctorId: doctorKey });
};

const buildConsultationQuery = (consultationKey) => {
  if (mongoose.Types.ObjectId.isValid(consultationKey)) {
    return { $or: [{ _id: consultationKey }, { consultationId: consultationKey }] };
  }

  return { consultationId: consultationKey };
};

const startConsultation = async (req, res) => {
  try {
    const { patientId, doctorId, kioskId, notes } = req.body;

    if (!patientId || !doctorId || !kioskId) {
      return res.status(400).json({ message: "patientId, doctorId and kioskId are required" });
    }

    const patient = await resolvePatient(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const doctor = await resolveDoctor(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const consultation = await Consultation.create({
      patientId: patient._id,
      doctorId: doctor._id,
      kioskId,
      status: "in_progress",
      notes,
    });

    return res.status(201).json(consultation);
  } catch (error) {
    return res.status(400).json({ message: "Failed to start consultation", error: error.message });
  }
};

const endConsultation = async (req, res) => {
  try {
    const { consultationId, notes, status } = req.body;

    if (!consultationId) {
      return res.status(400).json({ message: "consultationId is required" });
    }

    const consultation = await Consultation.findOne(buildConsultationQuery(consultationId));
    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    consultation.status = status || "completed";
    if (typeof notes === "string") {
      consultation.notes = notes;
    }

    await consultation.save();

    return res.status(200).json({ message: "Consultation ended", consultation });
  } catch (error) {
    return res.status(400).json({ message: "Failed to end consultation", error: error.message });
  }
};

const getConsultations = async (req, res) => {
  try {
    const consultations = await Consultation.find()
      .sort({ createdAt: -1 })
      .populate("patientId", "patientId name village")
      .populate("doctorId", "doctorId name specialization");

    return res.status(200).json(consultations);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch consultations", error: error.message });
  }
};

module.exports = {
  startConsultation,
  endConsultation,
  getConsultations,
};
