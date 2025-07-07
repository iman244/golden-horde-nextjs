import { useCallback, useState, useRef } from "react";

export function useWebRTC(onIceCandidate?: (candidate: RTCIceCandidate, _username: string, target_user: string) => void) {
  // Map of username -> { peerConnection, stream }
  const peerDataRef = useRef<Map<string, { peerConnection: RTCPeerConnection, stream: MediaStream | null }>>(new Map());
  const [peerConnections, setPeerConnections] = useState<Map<string, { peerConnection: RTCPeerConnection, stream: MediaStream | null }>>(new Map());

  // Create and return a new RTCPeerConnection for a specific user
  const createPeerConnection = useCallback(({username, target_user}:{username: string; target_user: string}) => {
    const peerConnection = new RTCPeerConnection();
    // Track ICE candidates for this peer
    const iceCandidates: string[] = [];
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        iceCandidates.push(event.candidate.candidate);
        onIceCandidate?.(event.candidate, username, target_user);
      }
    };
    // Handle remote audio
    peerConnection.ontrack = (event) => {
      peerDataRef.current.set(target_user, {
        peerConnection,
        stream: event.streams[0],
      });
      setPeerConnections(new Map(peerDataRef.current));
    };
    // Remove peer on disconnect/failed/closed
    peerConnection.onconnectionstatechange = () => {
      if (
        peerConnection.connectionState === "disconnected" ||
        peerConnection.connectionState === "failed" ||
        peerConnection.connectionState === "closed"
      ) {
        peerDataRef.current.delete(target_user);
        setPeerConnections(new Map(peerDataRef.current));
      }
    };
    // Store peer connection (no stream yet)
    peerDataRef.current.set(target_user, { peerConnection, stream: null });
    setPeerConnections(new Map(peerDataRef.current));
    return peerConnection;
  }, [onIceCandidate]);

  // Add local tracks to all peer connections
  const addTracks = useCallback((stream: MediaStream) => {
    if (peerDataRef.current.size > 0) {
      stream.getTracks().forEach((track) => {
        peerDataRef.current.forEach(({ peerConnection }) => {
          peerConnection.addTrack(track, stream);
        });
      });
    }
  }, []);

  // Add tracks to a specific peer connection
  const addTracksToPeer = useCallback((stream: MediaStream, userId: string) => {
    const entry = peerDataRef.current.get(userId);
    if (entry) {
      stream.getTracks().forEach((track) => entry.peerConnection.addTrack(track, stream));
    }
  }, []);

  // Close all peer connections
  const closeAllPeerConnections = useCallback(() => {
    peerDataRef.current.forEach(({ peerConnection }) => {
      peerConnection.close();
    });
    peerDataRef.current = new Map();
    setPeerConnections(new Map());
  }, []);

  return {
    peerConnections,
    peerDataRef,
    createPeerConnection,
    addTracks,
    addTracksToPeer,
    closeAllPeerConnections,
  };
} 