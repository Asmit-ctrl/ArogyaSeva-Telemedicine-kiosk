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
      required: true,
      min: 0,
    },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female", "other"],
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
    },
    village: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("Patient", patientSchema);
