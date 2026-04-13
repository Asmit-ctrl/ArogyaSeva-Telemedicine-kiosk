const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Doctor = require("../models/Doctor");
const Consultation = require("../models/Consultation");
const User = require("../models/User");

const buildDoctorQuery = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ _id: id }, { doctorId: id }] };
  }

  return { doctorId: id };
};

const buildToken = (user) =>
  jwt.sign(
    {
      userId: user._id,
      role: user.role,
      email: user.email,
      profileId: user.profileId,
    },
    process.env.JWT_SECRET || "dev_secret",
    { expiresIn: "1d" }
  );

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

const selfRegisterDoctor = async (req, res) => {
  try {
    const { name, email, password, specialization, licenseNumber, languages, consultationFee } = req.body;

    if (!name || !email || !password || !specialization || !licenseNumber) {
      return res.status(400).json({
        message: "name, email, password, specialization and licenseNumber are required",
      });
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Doctor account already exists" });
    }

    const doctor = await Doctor.create({
      name,
      email: normalizedEmail,
      specialization,
      licenseNumber,
      languages: Array.isArray(languages) && languages.length ? languages : ["en", "hi"],
      consultationFee: consultationFee || 300,
      availability: "available",
    });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "doctor",
      profileId: doctor._id,
    });

    const token = buildToken(user);

    return res.status(201).json({
      message: "Doctor registered successfully",
      token,
      doctor,
    });
  } catch (error) {
    return res.status(400).json({ message: "Failed to self-register doctor", error: error.message });
  }
};

const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase(), role: "doctor" });
    if (!user) {
      return res.status(401).json({ message: "Invalid doctor credentials" });
    }

    const passwordMatched = await bcrypt.compare(password, user.password);
    if (!passwordMatched) {
      return res.status(401).json({ message: "Invalid doctor credentials" });
    }

    const doctor = await Doctor.findById(user.profileId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    return res.status(200).json({
      message: "Doctor login successful",
      token: buildToken(user),
      doctor,
    });
  } catch (error) {
    return res.status(500).json({ message: "Doctor login failed", error: error.message });
  }
};

const getMyQueue = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.profileId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const consultations = await Consultation.find({
      doctorId: doctor._id,
      status: { $in: ["pending", "in_progress"] },
    })
      .sort({ createdAt: 1 })
      .populate("patientId")
      .populate("doctorId");

    return res.status(200).json({
      doctor,
      consultations,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch doctor queue", error: error.message });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.profileId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    return res.status(200).json(doctor);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch doctor profile", error: error.message });
  }
};

const acceptConsultation = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.profileId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const consultation = await Consultation.findOne({
      $or: [{ _id: req.params.consultationId }, { consultationId: req.params.consultationId }],
      doctorId: doctor._id,
    })
      .populate("patientId")
      .populate("doctorId");

    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found for this doctor" });
    }

    consultation.status = "in_progress";
    await consultation.save();

    doctor.availability = "busy";
    await doctor.save();

    return res.status(200).json({
      message: "Consultation accepted",
      consultation,
    });
  } catch (error) {
    return res.status(400).json({ message: "Failed to accept consultation", error: error.message });
  }
};

module.exports = {
  registerDoctor,
  selfRegisterDoctor,
  loginDoctor,
  getDoctors,
  getDoctorById,
  getMyQueue,
  getMyProfile,
  acceptConsultation,
};
