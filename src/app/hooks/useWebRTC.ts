import { useRef, useState, useCallback } from "react";
import type { PeerConnectionStatus } from "../types";

export function useWebRTC(onIceCandidate?: (candidate: RTCIceCandidate) => void) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [pcStatus, setPcStatus] = useState<PeerConnectionStatus>({
    connectionState: "",
    iceConnectionState: "",
    signalingState: "",
    localDescription: "",
    remoteDescription: "",
    iceCandidates: [],
  });

  // Create and return a new RTCPeerConnection
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    // Status updater
    const updatePcStatus = () => {
      setPcStatus({
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState,
        signalingState: pc.signalingState,
        localDescription: pc.localDescription ? pc.localDescription.type : "",
        remoteDescription: pc.remoteDescription ? pc.remoteDescription.type : "",
        iceCandidates: [], // ICE candidates will be managed separately
      });
    };

    updatePcStatus();
    pc.onconnectionstatechange = updatePcStatus;
    pc.oniceconnectionstatechange = updatePcStatus;
    pc.onsignalingstatechange = updatePcStatus;

    // Handle remote audio
    pc.ontrack = (event) => {
      if (audioRef.current) {
        audioRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && onIceCandidate) {
        onIceCandidate(event.candidate);
      }
    };

    return pc;
  }, [onIceCandidate]);

  // Add local tracks to the connection
  const addTracks = useCallback((stream: MediaStream) => {
    const pc = pcRef.current;
    if (pc) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }
  }, []);

  return {
    pcRef,
    audioRef,
    pcStatus,
    createPeerConnection,
    addTracks,
  };
} 