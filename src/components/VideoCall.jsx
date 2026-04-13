import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useVideoCall } from "../hooks/useVideoCall";
import { listMediaDevices, setPreferredDevices } from "../services/videoService";
import LargeButton from "./LargeButton";

export default function VideoCall({ consultationId, participantName, onEnd, vitals, endDisabled = false }) {
  const { t } = useTranslation();
  const [muted, setMuted] = useState(false);
  const [showVitals, setShowVitals] = useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState("");
  const [selectedAudio, setSelectedAudio] = useState("");
  const hasConsultation = Boolean(consultationId);
  const { localVideoRef, remoteVideoRef, ready, error, warning, remoteParticipantCount, setMuted: setTrackMuted } =
    useVideoCall({
      active: hasConsultation,
      consultationId,
      participantName
    });

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const devices = await listMediaDevices();
        setVideoDevices(devices.videoInputs);
        setAudioDevices(devices.audioInputs);
        if (devices.videoInputs[0]) {
          setSelectedVideo(devices.videoInputs[0].deviceId);
        }
        if (devices.audioInputs[0]) {
          setSelectedAudio(devices.audioInputs[0].deviceId);
        }
      } catch {
        setVideoDevices([]);
        setAudioDevices([]);
      }
    };

    loadDevices();
  }, []);

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    setTrackMuted(nextMuted);
  };

  return (
    <div className="video-layout">
      <div className="remote-video-shell">
        <div ref={remoteVideoRef} className="remote-video" />
        {!hasConsultation ? <div className="video-overlay">Consultation room is not ready yet.</div> : null}
        {hasConsultation && !ready && !error ? <div className="video-overlay">Connecting consultation room...</div> : null}
        {ready && !error && remoteParticipantCount === 0 ? (
          <div className="video-overlay">Room is ready. Waiting for doctor to join...</div>
        ) : null}
        {error ? <div className="video-overlay video-error">{error}</div> : null}
      </div>

      <div ref={localVideoRef} className="local-video" />

      {showVitals ? (
        <div className="floating-vitals">
          <p>HR: {vitals.heartRate}</p>
          <p>BP: {vitals.bloodPressure}</p>
          <p>Temp: {vitals.temperature}</p>
          <p>SpO2: {vitals.spo2}</p>
        </div>
      ) : null}

      {warning ? <div className="video-warning">{warning}</div> : null}

      <div className="device-toolbar">
        <select
          className="kiosk-input"
          value={selectedVideo}
          onChange={(event) => {
            const value = event.target.value;
            setSelectedVideo(value);
            setPreferredDevices({ videoDeviceId: value });
          }}
        >
          {videoDevices.map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${index + 1}`}
            </option>
          ))}
        </select>

        <select
          className="kiosk-input"
          value={selectedAudio}
          onChange={(event) => {
            const value = event.target.value;
            setSelectedAudio(value);
            setPreferredDevices({ audioDeviceId: value });
          }}
        >
          {audioDevices.map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Microphone ${index + 1}`}
            </option>
          ))}
        </select>
      </div>

      <div className="video-controls">
        <LargeButton title={muted ? t("unmute") : t("mute")} icon="MIC" className="control-mute" onClick={toggleMute} />
        <LargeButton title={t("showVitals")} icon="VTL" className="control-vitals" onClick={() => setShowVitals((s) => !s)} />
        <LargeButton title={t("endCall")} icon="END" className="control-end" onClick={onEnd} disabled={!hasConsultation || endDisabled} />
      </div>
    </div>
  );
}
