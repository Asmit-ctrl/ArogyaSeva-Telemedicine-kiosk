const mongoose = require("mongoose");
const Patient = require("../models/Patient");

const buildPatientQuery = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ _id: id }, { patientId: id }] };
  }

  return { patientId: id };
};

const registerPatient = async (req, res) => {
  try {
    const patient = await Patient.create(req.body);
    return res.status(201).json(patient);
  } catch (error) {
    return res.status(400).json({ message: "Failed to register patient", error: error.message });
  }
};

const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findOne(buildPatientQuery(req.params.id));

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    return res.status(200).json(patient);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch patient", error: error.message });
  }
};

const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    return res.status(200).json(patients);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch patients", error: error.message });
  }
};

module.exports = {
  registerPatient,
  getPatientById,
  getAllPatients,
};
