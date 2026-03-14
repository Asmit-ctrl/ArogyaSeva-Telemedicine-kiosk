import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useVideoCall } from "../hooks/useVideoCall";
import LargeButton from "./LargeButton";

export default function VideoCall({ onEnd, vitals }) {
  const { t } = useTranslation();
  const [muted, setMuted] = useState(false);
  const [showVitals, setShowVitals] = useState(false);
  const { localVideoRef, remoteVideoRef, ready, error, setMuted: setTrackMuted } = useVideoCall(true);

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    setTrackMuted(nextMuted);
  };

  return (
    <div className="video-layout">
      <div className="remote-video-shell">
        <video autoPlay playsInline ref={remoteVideoRef} className="remote-video" />
        {!ready && !error ? <div className="video-overlay">Connecting doctor...</div> : null}
        {error ? <div className="video-overlay video-error">{error}</div> : null}
      </div>

      <video autoPlay muted playsInline ref={localVideoRef} className="local-video" />

      {showVitals ? (
        <div className="floating-vitals">
          <p>HR: {vitals.heartRate}</p>
          <p>BP: {vitals.bloodPressure}</p>
          <p>Temp: {vitals.temperature}</p>
          <p>SpO2: {vitals.spo2}</p>
        </div>
      ) : null}

      <div className="video-controls">
        <LargeButton title={muted ? t("unmute") : t("mute")} icon="MIC" className="control-mute" onClick={toggleMute} />
        <LargeButton title={t("showVitals")} icon="VTL" className="control-vitals" onClick={() => setShowVitals((s) => !s)} />
        <LargeButton title={t("endCall")} icon="END" className="control-end" onClick={onEnd} />
      </div>
    </div>
  );
}
