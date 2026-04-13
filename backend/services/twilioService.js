const twilio = require("twilio");

const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

const isTwilioConfigured = () =>
  Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_API_KEY && process.env.TWILIO_API_SECRET);

const sanitizeIdentity = (value) =>
  String(value || "participant")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .slice(0, 120);

const buildVideoToken = ({ identity, roomName }) => {
  if (!isTwilioConfigured()) {
    return null;
  }

  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET,
    {
      identity: sanitizeIdentity(identity),
      ttl: Number(process.env.TWILIO_TOKEN_TTL_SECONDS || 3600),
    }
  );

  token.addGrant(new VideoGrant({ room: roomName }));
  return token.toJwt();
};

module.exports = {
  buildVideoToken,
  isTwilioConfigured,
  sanitizeIdentity,
};
