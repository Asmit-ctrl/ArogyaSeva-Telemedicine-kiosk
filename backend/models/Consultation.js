const mongoose = require("mongoose");

const generateConsultationId = () => `CON-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const consultationSchema = new mongoose.Schema(
  {
    consultationId: {
      type: String,
      unique: true,
      default: generateConsultationId,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
    kioskId: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "cancelled", "redirected"],
      default: "pending",
    },
    notes: {
      type: String,
      trim: true,
    },
    symptoms: {
      chiefComplaint: { type: String, trim: true },
      durationDays: Number,
      severity: {
        type: String,
        enum: ["low", "moderate", "high", "critical"],
        default: "moderate",
      },
      history: { type: String, trim: true },
      preferredLanguage: { type: String, trim: true },
    },
    triage: {
      urgency: { type: String, trim: true },
      specialty: { type: String, trim: true },
      summary: { type: String, trim: true },
      riskAlerts: { type: [String], default: [] },
      recommendedActions: { type: [String], default: [] },
      hospitalRedirect: { type: Boolean, default: false },
      followUpDays: Number,
      confidence: Number,
    },
    vitalsSnapshot: {
      heartRate: Number,
      bloodPressure: String,
      temperature: Number,
      oxygenLevel: Number,
      glucoseLevel: Number,
      weight: Number,
      heightCm: Number,
      bmi: Number,
      ecgSummary: String,
      assistantName: String,
    },
    queueNumber: {
      type: String,
      trim: true,
    },
    estimatedWaitMinutes: {
      type: Number,
      default: 0,
    },
    roomName: {
      type: String,
      trim: true,
    },
    pricing: {
      consultationFee: Number,
      subsidyApplied: Boolean,
      currency: {
        type: String,
        default: "INR",
      },
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "waived"],
      default: "pending",
    },
    pharmacyOptions: {
      type: [
        {
          name: String,
          mode: String,
          eta: String,
        },
      ],
      default: [],
    },
    followUpPlan: {
      reminderChannel: String,
      dueInDays: Number,
      chronicCare: Boolean,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("Consultation", consultationSchema);
