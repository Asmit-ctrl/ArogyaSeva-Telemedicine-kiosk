import Video from "twilio-video";

let localStream;
let activeRoom;
let remoteTrackCleanup = [];
let preferredVideoDeviceId = "";
let preferredAudioDeviceId = "";

const lowBandwidthConstraints = {
  audio: true,
  video: {
    width: { ideal: 640, max: 960 },
    height: { ideal: 360, max: 540 },
    frameRate: { ideal: 15, max: 20 }
  }
};

function clearContainer(container) {
  if (!container) {
    return;
  }

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

function attachMediaElement(track, container) {
  if (!container || !track) {
    return () => {};
  }

  const element = track.attach();
  element.className = container.className;
  clearContainer(container);
  container.appendChild(element);

  return () => {
    track.detach().forEach((detachedElement) => detachedElement.remove());
  };
}

async function attachLocalPreview(localContainerRef) {
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: preferredAudioDeviceId ? { deviceId: { exact: preferredAudioDeviceId } } : lowBandwidthConstraints.audio,
    video: preferredVideoDeviceId
      ? {
          ...lowBandwidthConstraints.video,
          deviceId: { exact: preferredVideoDeviceId }
        }
      : lowBandwidthConstraints.video
  });
  const localVideo = document.createElement("video");
  localVideo.autoplay = true;
  localVideo.muted = true;
  localVideo.playsInline = true;
  localVideo.srcObject = localStream;
  localVideo.className = "local-video-feed";

  clearContainer(localContainerRef?.current);
  if (localContainerRef?.current) {
    localContainerRef.current.appendChild(localVideo);
  }

  return localStream;
}

function bindParticipantTracks(participant, remoteContainer, onRemoteParticipantChange) {
  const attachTrack = (track) => {
    if (track.kind === "video") {
      remoteTrackCleanup.push(attachMediaElement(track, remoteContainer));
    }
  };

  participant.tracks.forEach((publication) => {
    if (publication.track) {
      attachTrack(publication.track);
    }
  });

  participant.on("trackSubscribed", attachTrack);
  participant.on("trackUnsubscribed", (track) => {
    track.detach().forEach((element) => element.remove());
  });

  onRemoteParticipantChange?.(activeRoom?.participants?.size || 0);
}

export async function initPreviewVideo(localContainerRef) {
  await attachLocalPreview(localContainerRef);
}

export async function listMediaDevices() {
  const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
  const devices = await navigator.mediaDevices.enumerateDevices();
  permissionStream.getTracks().forEach((track) => track.stop());
  return {
    videoInputs: devices.filter((device) => device.kind === "videoinput"),
    audioInputs: devices.filter((device) => device.kind === "audioinput")
  };
}

export function setPreferredDevices({ videoDeviceId, audioDeviceId }) {
  if (videoDeviceId !== undefined) {
    preferredVideoDeviceId = videoDeviceId;
  }

  if (audioDeviceId !== undefined) {
    preferredAudioDeviceId = audioDeviceId;
  }
}

export async function connectToRoom({
  token,
  roomName,
  localContainerRef,
  remoteContainerRef,
  onRemoteParticipantChange
}) {
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }

  const localTracks = await Video.createLocalTracks({
    audio: preferredAudioDeviceId ? { deviceId: { exact: preferredAudioDeviceId } } : true,
    video: preferredVideoDeviceId
      ? {
          ...lowBandwidthConstraints.video,
          deviceId: { exact: preferredVideoDeviceId }
        }
      : lowBandwidthConstraints.video
  });

  const previewContainer = localContainerRef?.current;
  clearContainer(previewContainer);
  localTracks
    .filter((track) => track.kind === "video")
    .forEach((track) => {
      const element = track.attach();
      element.className = "local-video-feed";
      previewContainer?.appendChild(element);
    });

  activeRoom = await Video.connect(token, {
    name: roomName,
    tracks: localTracks
  });

  const remoteContainer = remoteContainerRef?.current;
  onRemoteParticipantChange?.(activeRoom.participants.size);

  activeRoom.participants.forEach((participant) => {
    bindParticipantTracks(participant, remoteContainer, onRemoteParticipantChange);
  });

  activeRoom.on("participantConnected", (participant) => {
    bindParticipantTracks(participant, remoteContainer, onRemoteParticipantChange);
    onRemoteParticipantChange?.(activeRoom.participants.size);
  });

  activeRoom.on("participantDisconnected", () => {
    clearContainer(remoteContainer);
    onRemoteParticipantChange?.(activeRoom.participants.size);
  });

  return activeRoom;
}

export function toggleMute(isMuted) {
  if (!activeRoom?.localParticipant) {
    localStream?.getAudioTracks().forEach((track) => {
      track.enabled = !isMuted;
    });
    return;
  }

  activeRoom.localParticipant.audioTracks.forEach((publication) => {
    if (publication.track) {
      publication.track.enable(!isMuted);
    }
  });
}

export function closeVideo() {
  remoteTrackCleanup.forEach((cleanup) => cleanup());
  remoteTrackCleanup = [];

  if (activeRoom) {
    activeRoom.disconnect();
    activeRoom = null;
  }

  if (!localStream) {
    return;
  }

  localStream.getTracks().forEach((track) => track.stop());
  localStream = null;
}
