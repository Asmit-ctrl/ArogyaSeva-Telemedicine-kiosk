const mongoose = require("mongoose");
const Patient = require("../models/Patient");
const Vitals = require("../models/Vitals");

const resolvePatient = async (patientKey) => {
  if (mongoose.Types.ObjectId.isValid(patientKey)) {
    return Patient.findOne({ $or: [{ _id: patientKey }, { patientId: patientKey }] });
  }

  return Patient.findOne({ patientId: patientKey });
};

const createVitals = async (req, res) => {
  try {
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: "patientId is required" });
    }

    const patient = await resolvePatient(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const vitals = await Vitals.create({ ...req.body, patientId: patient._id });
    return res.status(201).json(vitals);
  } catch (error) {
    return res.status(400).json({ message: "Failed to save vitals", error: error.message });
  }
};

const getVitalsByPatient = async (req, res) => {
  try {
    const patient = await resolvePatient(req.params.patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const vitals = await Vitals.find({ patientId: patient._id })
      .sort({ recordedAt: -1 })
      .populate("patientId", "patientId name age gender");

    return res.status(200).json(vitals);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch vitals", error: error.message });
  }
};

module.exports = { createVitals, getVitalsByPatient };
