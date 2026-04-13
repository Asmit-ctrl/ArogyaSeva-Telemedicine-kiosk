const mongoose = require("mongoose");

const generateDoctorId = () => `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const doctorSchema = new mongoose.Schema(
  {
    doctorId: {
      type: String,
      unique: true,
      default: generateDoctorId,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    availability: {
      type: String,
      enum: ["available", "busy", "offline"],
      default: "available",
    },
    languages: {
      type: [String],
      default: ["en", "hi"],
    },
    consultationFee: {
      type: Number,
      default: 250,
      min: 0,
    },
    waitTimeMinutes: {
      type: Number,
      default: 5,
      min: 0,
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
    },
    locationTags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("Doctor", doctorSchema);
