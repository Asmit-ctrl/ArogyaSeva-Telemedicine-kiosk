const mongoose = require("mongoose");
const Doctor = require("../models/Doctor");

const buildDoctorQuery = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ _id: id }, { doctorId: id }] };
  }

  return { doctorId: id };
};

const registerDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);
    return res.status(201).json(doctor);
  } catch (error) {
    return res.status(400).json({ message: "Failed to register doctor", error: error.message });
  }
};

const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ createdAt: -1 });
    return res.status(200).json(doctors);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch doctors", error: error.message });
  }
};

const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findOne(buildDoctorQuery(req.params.id));

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    return res.status(200).json(doctor);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch doctor", error: error.message });
  }
};

module.exports = { registerDoctor, getDoctors, getDoctorById };
