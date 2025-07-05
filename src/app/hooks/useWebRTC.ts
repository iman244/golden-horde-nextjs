import { useRef, useCallback, useState } from "react";

export function useWebRTC(onIceCandidate?: (candidate: RTCIceCandidate, _username: string, target_user: string) => void) {
//   const pcRef = useRef<RTCPeerConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const [peerConnections, setPeerConnections] = useState<Map<string, RTCPeerConnection>>(new Map());

  // Create and return a new RTCPeerConnection for a specific user
  const createPeerConnection = useCallback(({username, target_user}:{username: string; target_user: string}) => {
    const pc = new RTCPeerConnection();
    
    // Track ICE candidates for this peer
    const iceCandidates: string[] = [];
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        iceCandidates.push(event.candidate.candidate);
        onIceCandidate?.(event.candidate, username, target_user);
      }
    };

    // Handle remote audio
    pc.ontrack = (event) => {
      if (audioRef.current) {
        audioRef.current.srcObject = event.streams[0];
      }
    };

    // Remove peer on disconnect/failed/closed
    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed" ||
        pc.connectionState === "closed"
      ) {
        peerConnectionsRef.current.delete(target_user);
        setPeerConnections(new Map(peerConnectionsRef.current));
      }
    };

    // Store peer connection
    peerConnectionsRef.current.set(target_user, pc);
    setPeerConnections(new Map(peerConnectionsRef.current))

    return pc;
  }, [onIceCandidate]);

  // Add local tracks to the connection
  const addTracks = useCallback((stream: MediaStream) => {
    if (peerConnectionsRef.current.size > 0) {
      stream.getTracks().forEach((track) => {
        peerConnectionsRef.current.forEach((pc)=>{
            console.log("useWebRTC addTracks pc", pc)
            pc.addTrack(track, stream)
        })
      });
    }
    // const pc = pcRef.current;
    // if (pc) {
    //   stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    // }
  }, []);

  // Add tracks to a specific peer connection
  const addTracksToPeer = useCallback((stream: MediaStream, userId: string) => {
    const pc = peerConnectionsRef.current.get(userId);
    if (pc) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }
  }, []);

  // Close all peer connections
  const closeAllPeerConnections = useCallback(() => {
    peerConnectionsRef.current.forEach((pc) => {
      pc.close();
    });
    peerConnectionsRef.current = new Map();
    setPeerConnections(new Map())
  }, []);

  return {
    audioRef,
    peerConnections,
    peerConnectionsRef,
    createPeerConnection,
    addTracks,
    addTracksToPeer,
    closeAllPeerConnections,
  };
} 