const mongoose = require("mongoose");

const generatePatientId = () => `PAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const patientSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      unique: true,
      default: generatePatientId,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      default: 0,
      min: 0,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
    },
    aadhaarId: {
      type: String,
      trim: true,
    },
    village: {
      type: String,
      default: "Walk-in",
      trim: true,
    },
    preferredLanguage: {
      type: String,
      default: "en",
      trim: true,
    },
    chronicConditions: {
      type: [String],
      default: [],
    },
    emergencyContact: {
      type: String,
      trim: true,
    },
    visitCount: {
      type: Number,
      default: 0,
    },
    lastVisitAt: {
      type: Date,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("Patient", patientSchema);
