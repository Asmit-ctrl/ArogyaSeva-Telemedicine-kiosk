const mongoose = require("mongoose");

const generateVitalsId = () => `VIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const vitalsSchema = new mongoose.Schema(
  {
    vitalsId: {
      type: String,
      unique: true,
      default: generateVitalsId,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    heartRate: Number,
    bloodPressure: String,
    temperature: Number,
    oxygenLevel: Number,
    weight: Number,
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model("Vitals", vitalsSchema);
