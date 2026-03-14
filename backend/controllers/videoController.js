const startVideoSession = async (req, res) => {
  return res.status(200).json({
    message: "Video consultation feature coming soon",
    sessionId: "dummy-session-123",
    status: "simulated-connecting",
    futurePlan: ["WebRTC integration", "Doctor video interface", "Real-time communication"],
  });
};

const getVideoStatus = async (req, res) => {
  return res.status(200).json({
    message: "Video consultation feature coming soon",
    status: "simulated-idle",
  });
};

module.exports = { startVideoSession, getVideoStatus };
