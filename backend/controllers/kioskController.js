const KioskDevice = require("../models/KioskDevice");

const registerKiosk = async (req, res) => {
  try {
    const { kioskId, name, location, status } = req.body;

    if (!kioskId) {
      return res.status(400).json({ message: "kioskId is required" });
    }

    const kiosk = await KioskDevice.findOneAndUpdate(
      { kioskId },
      {
        kioskId,
        name,
        location,
        status: status || "online",
        lastSeen: new Date(),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json(kiosk);
  } catch (error) {
    return res.status(400).json({ message: "Failed to register kiosk", error: error.message });
  }
};

const listKiosks = async (req, res) => {
  try {
    const kiosks = await KioskDevice.find().sort({ lastSeen: -1 });
    return res.status(200).json(kiosks);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch kiosks", error: error.message });
  }
};

const getKioskById = async (req, res) => {
  try {
    const kiosk = await KioskDevice.findOne({ kioskId: req.params.kioskId });

    if (!kiosk) {
      return res.status(404).json({ message: "Kiosk not found" });
    }

    return res.status(200).json(kiosk);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch kiosk", error: error.message });
  }
};

const pingKiosk = async (req, res) => {
  try {
    const { status } = req.body;

    const kiosk = await KioskDevice.findOneAndUpdate(
      { kioskId: req.params.kioskId },
      {
        lastSeen: new Date(),
        ...(status ? { status } : {}),
      },
      { new: true }
    );

    if (!kiosk) {
      return res.status(404).json({ message: "Kiosk not found" });
    }

    return res.status(200).json({ message: "Kiosk heartbeat updated", kiosk });
  } catch (error) {
    return res.status(400).json({ message: "Failed to update kiosk heartbeat", error: error.message });
  }
};

module.exports = {
  registerKiosk,
  listKiosks,
  getKioskById,
  pingKiosk,
};
