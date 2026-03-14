let localStream;

const lowBandwidthConstraints = {
  audio: true,
  video: {
    width: { ideal: 640, max: 960 },
    height: { ideal: 360, max: 540 },
    frameRate: { ideal: 15, max: 20 }
  }
};

export async function initVideo(localVideoRef) {
  localStream = await navigator.mediaDevices.getUserMedia(lowBandwidthConstraints);
  if (localVideoRef?.current) {
    localVideoRef.current.srcObject = localStream;
  }
  return localStream;
}

export function attachMockRemote(remoteVideoRef) {
  if (remoteVideoRef?.current && localStream) {
    remoteVideoRef.current.srcObject = localStream;
  }
}

export function toggleMute(isMuted) {
  if (!localStream) {
    return;
  }
  localStream.getAudioTracks().forEach((track) => {
    track.enabled = !isMuted;
  });
}

export function closeVideo() {
  if (!localStream) {
    return;
  }
  localStream.getTracks().forEach((track) => track.stop());
  localStream = null;
}
