const mongoose = require("mongoose");

const kioskDeviceSchema = new mongoose.Schema(
  {
    kioskId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["online", "offline", "maintenance"],
      default: "online",
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("KioskDevice", kioskDeviceSchema);
