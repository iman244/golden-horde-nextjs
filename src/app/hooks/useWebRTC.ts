import { useCallback, useState, useRef } from "react";

export function useWebRTC(
  onIceCandidate?: (
    candidate: RTCIceCandidate,
    _username: string,
    target_user: string
  ) => void
) {
  // Map of username -> { peerConnection, stream }
  const peerDataRef = useRef<
    Map<
      string,
      { peerConnection: RTCPeerConnection; stream: MediaStream | null }
    >
  >(new Map());
  const [peerConnections, setPeerConnections] = useState<
    Map<
      string,
      { peerConnection: RTCPeerConnection; stream: MediaStream | null }
    >
  >(new Map());

  // Create and return a new RTCPeerConnection for a specific user
  const createPeerConnection = useCallback(
    ({ username, target_user }: { username: string; target_user: string }) => {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "turn:194.60.231.201:3478?transport=udp",
              "turn:194.60.231.201:3478?transport=tcp",
              "turn:194.60.231.201:5349?transport=udp",
              "turn:194.60.231.201:5349?transport=tcp",
            ],
            username: "iman244",
            credential: "qwer123456",
          },
          {
            urls: ["stun:194.60.231.201:3478", "stun:194.60.231.201:5349"],
          },
        ],
      });
      // Track ICE candidates for this peer
      const iceCandidates: string[] = [];
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          iceCandidates.push(event.candidate.candidate);
          onIceCandidate?.(event.candidate, username, target_user);
          // Log each ICE candidate for STUN/TURN diagnostics
          const cand = event.candidate;
          // Try to parse candidateType and relay protocol
          const candidateStr = cand.candidate || "";
          // Example: candidate:842163049 1 udp 1677729535 192.168.1.2 56143 typ srflx raddr 0.0.0.0 rport 0 generation 0 ufrag ... network-cost 999
          const typeMatch = candidateStr.match(/ typ ([a-z]+)/);
          const protocolMatch = candidateStr.match(/ (udp|tcp) /);
          const addressMatch = candidateStr.match(
            / ([0-9]{1,3}(?:\.[0-9]{1,3}){3}) ([0-9]{1,5})/
          );
          const candidateType = typeMatch ? typeMatch[1] : undefined;
          const protocol = protocolMatch ? protocolMatch[1] : undefined;
          const address = addressMatch ? addressMatch[1] : undefined;
          const port = addressMatch ? addressMatch[2] : undefined;
          console.log("[ICE] Candidate gathered:", {
            candidateType,
            protocol,
            address,
            port,
            raw: candidateStr,
          });
          if (candidateType === "relay") {
            console.log("[ICE] Relay (TURN) candidate found:", candidateStr);
          }
        }
      };
      // After ICE gathering, check if any relay (TURN) candidates were found
      peerConnection.onicegatheringstatechange = () => {
        if (peerConnection.iceGatheringState === "complete") {
          const foundRelay = iceCandidates.some((c) => / typ relay /.test(c));
          if (!foundRelay) {
            console.warn(
              "[ICE] No relay (TURN) candidates were gathered. TURN server may be misconfigured or unreachable."
            );
          } else {
            console.log(
              "[ICE] At least one relay (TURN) candidate was gathered."
            );
          }
          // Special log for STUN (srflx) candidates
          const foundSrflx = iceCandidates.some((c) => / typ srflx /.test(c));
          if (!foundSrflx) {
            console.warn(
              "[ICE] No srflx (STUN) candidates were gathered. STUN server may be misconfigured, unreachable, or your network does not require NAT traversal."
            );
          } else {
            console.log(
              "[ICE] At least one srflx (STUN) candidate was gathered."
            );
          }
          // Explanation: host candidates are local network addresses (e.g., 192.168.x.x, 10.x.x.x, 127.0.0.1). These are only usable for peers on the same local network and do not require STUN or TURN.
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
      // Remove peer on closed (connectionstatechange)
      peerConnection.onconnectionstatechange = () => {
        console.log("ICE connection state:", peerConnection.iceConnectionState);
        if (peerConnection.connectionState === "closed") {
          peerDataRef.current.delete(target_user);
          setPeerConnections(new Map(peerDataRef.current));
        }
        // Log candidate-pair stats if the connection failed
        if (peerConnection.connectionState === "failed") {
          peerConnection.getStats().then((stats) => {
            stats.forEach((report) => {
              if (report.type === "candidate-pair") {
                if (report.state === "failed") {
                  console.error("Failed candidate pair:", report);
                  // Try to log local/remote candidate details for NAT/firewall/UDP/port diagnosis
                  const local = stats.get(report.localCandidateId);
                  const remote = stats.get(report.remoteCandidateId);
                  if (local && remote) {
                    console.error("[ICE Debug] Local candidate:", local);
                    console.error("[ICE Debug] Remote candidate:", remote);
                    /*
                    Common ICE failure causes:
                    - candidateType: 'relay' (TURN) vs 'srflx' (STUN) vs 'host'
                    - protocol: 'udp' vs 'tcp'
                    - port: blocked or unreachable
                    - address: private vs public IP
                    - networkType: 'vpn', 'wifi', 'ethernet', etc.
                    Use these logs to check if only host candidates are present (no relay), or if UDP is blocked, or if the address/port is unreachable.
                  */
                  }
                } else {
                  console.log("Candidate pair:", report);
                }
              }
            });
          });
        }
      };

      peerConnection.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", peerConnection.iceConnectionState);
      };

      peerConnection.onconnectionstatechange = () => {
        console.log("Connection state:", peerConnection.connectionState);
      };

      // Log ICE candidate errors for debugging
      peerConnection.addEventListener("icecandidateerror", (event) => {
        console.error("ICE Candidate Error:", event);
      });

      // Store peer connection (no stream yet)
      peerDataRef.current.set(target_user, { peerConnection, stream: null });
      setPeerConnections(new Map(peerDataRef.current));
      return peerConnection;
    },
    [onIceCandidate]
  );

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
      stream
        .getTracks()
        .forEach((track) => entry.peerConnection.addTrack(track, stream));
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
