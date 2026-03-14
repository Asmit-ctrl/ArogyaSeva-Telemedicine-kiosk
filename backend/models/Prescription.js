const mongoose = require("mongoose");

const generatePrescriptionId = () => `PRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    instructions: { type: String, trim: true },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionId: {
      type: String,
      unique: true,
      default: generatePrescriptionId,
    },
    consultationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultation",
      required: true,
    },
    doctorNotes: {
      type: String,
      trim: true,
    },
    medicines: {
      type: [medicineSchema],
      default: [],
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("Prescription", prescriptionSchema);
