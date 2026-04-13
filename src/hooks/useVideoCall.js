import { useEffect, useRef, useState } from "react";
import { createVideoSession } from "../services/api";
import { closeVideo, connectToRoom, initPreviewVideo, toggleMute } from "../services/videoService";

export function useVideoCall({ active, consultationId, participantName }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [remoteParticipantCount, setRemoteParticipantCount] = useState(0);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (!active || !consultationId) {
      return;
    }

    let mounted = true;
    const bootSession = async () => {
      try {
        const response = await createVideoSession({
          consultationId,
          participantName,
          participantRole: "kiosk"
        });

        if (!mounted) {
          return;
        }

        const session = response.data;
        if (session.twilioEnabled && session.token) {
          await connectToRoom({
            token: session.token,
            roomName: session.roomName,
            localContainerRef: localVideoRef,
            remoteContainerRef: remoteVideoRef,
            onRemoteParticipantChange: setRemoteParticipantCount
          });
          if (mounted) {
            setWarning("");
          }
        } else {
          await initPreviewVideo(localVideoRef);
          if (mounted) {
            setWarning("Twilio credentials are not configured yet. Local camera preview mode is active.");
            setRemoteParticipantCount(0);
          }
        }

        if (mounted) {
          setReady(true);
          setError("");
        }
      } catch (sessionError) {
        if (mounted) {
          setError(sessionError?.response?.data?.message || "Camera or microphone access denied.");
        }
      }
    };

    bootSession();

    return () => {
      mounted = false;
      closeVideo();
      setReady(false);
      setWarning("");
      setRemoteParticipantCount(0);
    };
  }, [active, consultationId, participantName]);

  const setMuted = (muted) => toggleMute(muted);

  return {
    localVideoRef,
    remoteVideoRef,
    ready,
    error,
    warning,
    remoteParticipantCount,
    setMuted
  };
}
