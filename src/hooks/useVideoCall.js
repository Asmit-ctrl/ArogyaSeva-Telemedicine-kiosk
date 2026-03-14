import { useEffect, useRef, useState } from "react";
import { attachMockRemote, closeVideo, initVideo, toggleMute } from "../services/videoService";

export function useVideoCall(active) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (!active) {
      return;
    }

    let mounted = true;
    initVideo(localVideoRef)
      .then(() => {
        attachMockRemote(remoteVideoRef);
        if (mounted) {
          setReady(true);
          setError("");
        }
      })
      .catch(() => {
        if (mounted) {
          setError("Camera or microphone access denied.");
        }
      });

    return () => {
      mounted = false;
      closeVideo();
      setReady(false);
    };
  }, [active]);

  const setMuted = (muted) => toggleMute(muted);

  return {
    localVideoRef,
    remoteVideoRef,
    ready,
    error,
    setMuted
  };
}
