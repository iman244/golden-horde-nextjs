import { useState, useCallback, useRef } from "react";
import { useWebRTC } from "./useWebRTC";
import { useSignaling } from "./useSignaling";
import type { VoiceChatSignalingMessage } from "../types";
import { useLogs } from "./useLogs";
import { useMediaStream } from "./useMediaStream";

export function useVoiceChat(token: string | null) {
  const { logs, addLog } = useLogs();
  const [currentTentId, setCurrentTentId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [otherUsers, setOtherUsers] = useState<string[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const toggleScreenShare = async () => setIsScreenSharing((pre) => !pre);
  const {
    stream,
    error: mediaError,
    loading: mediaLoading,
    getMedia,
    stopMedia,
  } = useMediaStream();

  // Mute state and toggle function
  const [isMuted, setIsMuted] = useState(false);
  const toggleMute = useCallback(() => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      // After toggling, update isMuted state based on first track
      const firstTrack = stream.getAudioTracks()[0];
      setIsMuted(firstTrack ? !firstTrack.enabled : false);
    }
  }, [stream]);

  // Deafen state and toggle function
  const [isDeafened, setIsDeafened] = useState(false);
  const wasMutedBeforeDeafen = useRef(false);
  const toggleDeafen = useCallback(() => {
    setIsDeafened((d) => {
      const next = !d;
      if (next) {
        // If deafen is being activated, also mute mic
        if (stream) {
          wasMutedBeforeDeafen.current = isMuted;
          stream.getAudioTracks().forEach((track) => {
            if (track.enabled) track.enabled = false;
          });
          // Update isMuted state
          const firstTrack = stream.getAudioTracks()[0];
          setIsMuted(firstTrack ? !firstTrack.enabled : false);
        }
      } else {
        // If deafen is being deactivated, unmute if user was not muted before deafen
        if (stream && !wasMutedBeforeDeafen.current) {
          stream.getAudioTracks().forEach((track) => {
            if (!track.enabled) track.enabled = true;
          });
          // Update isMuted state
          const firstTrack = stream.getAudioTracks()[0];
          setIsMuted(firstTrack ? !firstTrack.enabled : false);
        }
      }
      return next;
    });
  }, [stream, isMuted]);

  const getVoiceChatUrl = useCallback(
    (id: string | number) => {
      if (!token) return "";
      return `wss://${
        process.env.NEXT_PUBLIC_DJANGO_ADMIN_DOMAIN
      }/ws/voice_chat/${id}/?token=${encodeURIComponent(token)}`;
    },
    [token]
  );

  // Initialize signaling when tentId changes
  const {
    logs: wsLogs,
    sendSignal,
    onSignal,
    wsLatency,
  } = useSignaling<VoiceChatSignalingMessage>({
    channelId: currentTentId,
    getUrl: getVoiceChatUrl,
  });

  // ICE candidate handler to be passed to useWebRTC
  const handleIceCandidate = useCallback(
    (candidate: RTCIceCandidate, _username: string, target_user: string) => {
      if (candidate.candidate != null && candidate.candidate !== "") {
        addLog(
          `ICE candidate gathered for peer ${target_user}: ${candidate.candidate}`
        );
        sendSignal({
          type: "ice-candidate",
          candidate: candidate.candidate as string,
          ...(typeof candidate.sdpMid === "string"
            ? { sdpMid: candidate.sdpMid }
            : {}),
          ...(typeof candidate.sdpMLineIndex === "number"
            ? { sdpMLineIndex: candidate.sdpMLineIndex }
            : {}),
          username: _username,
          target_user: target_user ?? "undefined",
        });
        addLog("ICE candidate sent to server.");
      }
    },
    [addLog, sendSignal]
  );

  const {
    peerConnections,
    peerDataRef,
    createPeerConnection,
    addTracks,
    addTracksToPeer,
    closeAllPeerConnections,
  } = useWebRTC(handleIceCandidate);

  // Helper to handle connect_info message
  const handleConnectInfo = useCallback(
    (
      msg: Extract<VoiceChatSignalingMessage, { type: "connect_info" }>,
      localStream: MediaStream | null
    ) => {
      setUsername(msg.username);
      setOtherUsers(Array.isArray(msg.other_users) ? msg.other_users : []);
      addLog(`Your user name: ${msg.username}`);
      addLog(`Other users in tent: ${(msg.other_users || []).join(", ")}`);
      console.log("peerDataRef", peerDataRef);
      // For each other user, create a peer connection and send offer
      if (msg.username) {
        msg.other_users.forEach((target_user) => {
          if (target_user !== msg.username) {
            let peerConnEntry = peerDataRef.current.get(target_user);
            if (!peerConnEntry) {
              createPeerConnection({
                username: msg.username,
                target_user,
              });
              if (localStream) {
                addTracksToPeer(localStream, target_user);
              }
              peerConnEntry = peerDataRef.current.get(target_user);
            }
            if (peerConnEntry) {
              console.log("we are creating offer");
              peerConnEntry.peerConnection
                .createOffer()
                .then((offer) => {
                  peerConnEntry!.peerConnection
                    .setLocalDescription(offer)
                    .then(() => {
                      sendSignal({
                        type: "offer",
                        sdp: offer.sdp!,
                        username: msg.username,
                        target_user,
                      });
                      addLog(`Offer sent to ${target_user}`);
                    })
                    .catch((err) => {
                      console.log("we are setLocalDescription", err);
                    });
                })
                .catch((err) => {
                  console.log("we are in createOffer error", err);
                });
            }
          }
        });
      }
    },
    [
      setUsername,
      setOtherUsers,
      addLog,
      createPeerConnection,
      addTracksToPeer,
      sendSignal,
      peerDataRef,
    ]
  );

  // Helper to handle user_join and user_left
  const handleUserJoinLeave = useCallback(
    (
      msg: Extract<
        VoiceChatSignalingMessage,
        { type: "user_join" | "user_left" }
      >
    ) => {
      // You can add any local state update or logging here if needed
      addLog(
        `User ${msg.username} ${
          msg.type === "user_join" ? "joined" : "left"
        } tent ${msg.tent_id}`
      );
      // If you want to close peer connection on user_left for current tent, do it here
      if (
        msg.type === "user_left" &&
        currentTentId !== null &&
        msg.tent_id === String(currentTentId)
      ) {
        const entry = peerConnections.get(msg.username);
        if (entry && entry.peerConnection) {
          entry.peerConnection.close();
        }
      }
    },
    [addLog, currentTentId, peerConnections]
  );

  // Leave current tent
  const leaveTent = useCallback(async () => {
    if (currentTentId === null) {
      addLog("Not connected to any tent");
      return;
    }

    addLog(`Leaving tent ${currentTentId}...`);

    // Close all peer connections
    closeAllPeerConnections();

    // Stop media stream
    stopMedia();

    // Reset states
    setCurrentTentId(null);
    setIsConnected(false);
    setUsername(null);
    setOtherUsers([]);

    addLog(`Successfully left tent ${currentTentId}`);
  }, [
    currentTentId,
    stopMedia,
    addLog,
    closeAllPeerConnections,
    setUsername,
    setOtherUsers,
  ]);

  // Join a specific tent
  const joinTent = useCallback(
    async (tentId: number) => {
      if (currentTentId === tentId) {
        addLog(`Already connected to tent ${tentId}`);
        return;
      }

      // Leave current tent if connected
      if (currentTentId !== null) {
        await leaveTent();
      }

      addLog(`Joining tent ${tentId}...`);

      let cleanup: (() => void) | undefined;
      let isMounted = true;

      try {
        if (
          navigator.mediaDevices &&
          typeof navigator.mediaDevices.getUserMedia === "function"
        ) {
          const localStream = await getMedia("audio");
          if (!isMounted) return;
          if (localStream) {
            addLog(
              "Microphone access granted. Adding audio tracks to RTCPeerConnection."
            );

            // Create initial peer connection (for first peer)
            addTracks(localStream);
            addLog("Audio tracks added to RTCPeerConnection.");

            // Extracted handlers for offer, answer, and ICE candidate
            function handleOffer(
              msg: Extract<VoiceChatSignalingMessage, { type: "offer" }>
            ) {
              try {
                const target_user = msg.username;
                addLog(
                  `Received offer from ${target_user}, setting remote description.`
                );

                let peerConnEntry = peerDataRef.current.get(target_user);
                if (!peerConnEntry) {
                  createPeerConnection({
                    username: msg.target_user,
                    target_user,
                  });
                  if (localStream) {
                    addTracksToPeer(localStream, target_user);
                  }
                  peerConnEntry = peerDataRef.current.get(target_user);
                }

                if (!peerConnEntry) {
                  addLog(
                    `Error: Failed to create peer connection for ${target_user}`
                  );
                  return;
                }

                addLog("Role set: answerer");

                peerConnEntry.peerConnection
                  .setRemoteDescription(
                    new RTCSessionDescription({
                      type: "offer",
                      sdp: msg.sdp,
                    })
                  )
                  .then(() => {
                    addLog("Remote description set. Creating answer...");
                    return peerConnEntry!.peerConnection.createAnswer();
                  })
                  .then((answer: RTCSessionDescriptionInit) => {
                    addLog(
                      "Answer created. Setting local description and sending to server."
                    );
                    return peerConnEntry!.peerConnection
                      .setLocalDescription(answer)
                      .then(() => {
                        if (typeof answer.sdp === "string") {
                          sendSignal({
                            type: "answer",
                            sdp: answer.sdp,
                            username: msg.target_user,
                            target_user,
                          });
                          addLog("Answer sent to server.");
                        } else {
                          const errMsg = `Error: answer.sdp is not a string (value: ${String(
                            answer.sdp
                          )})`;
                          addLog(errMsg);
                          throw new Error(errMsg);
                        }
                      });
                  })
                  .catch((err: Error) => {
                    addLog("Error during answer creation: " + err);
                  });
              } catch (error) {
                addLog("Error handleOffer catch error: " + error);
              }
            }

            function handleAnswer(
              msg: Extract<VoiceChatSignalingMessage, { type: "answer" }>
            ) {
              const target_user = msg.username || "unknown";
              addLog(
                `Received answer from ${target_user}, setting remote description.`
              );
              const peerConnEntry = peerDataRef.current.get(target_user);
              if (peerConnEntry) {
                peerConnEntry.peerConnection
                  .setRemoteDescription(
                    new RTCSessionDescription({
                      type: "answer",
                      sdp: msg.sdp,
                    })
                  )
                  .then(() => {
                    addLog("Remote description set with answer.");
                  })
                  .catch((err: Error) => {
                    addLog(
                      "Error setting remote description with answer: " + err
                    );
                  });
              }
            }

            function handleIceCandidateMsg(
              msg: Extract<VoiceChatSignalingMessage, { type: "ice-candidate" }>
            ) {
              const target_user = msg.username || "unknown";
              if (msg.candidate != null && msg.candidate !== "") {
                addLog(
                  `Received ICE candidate from ${target_user}. Adding to RTCPeerConnection.`
                );

                const peerConnEntry = peerDataRef.current.get(target_user);
                if (peerConnEntry) {
                  peerConnEntry.peerConnection
                    .addIceCandidate({
                      candidate: msg.candidate as string,
                      ...(typeof msg.sdpMid === "string"
                        ? { sdpMid: msg.sdpMid }
                        : {}),
                      ...(typeof msg.sdpMLineIndex === "number"
                        ? { sdpMLineIndex: msg.sdpMLineIndex }
                        : {}),
                    })
                    .then(() => {
                      addLog("ICE candidate added.");
                    })
                    .catch((err: Error) => {
                      addLog("Error adding ICE candidate: " + err);
                    });
                }
              }
            }

            // Handle incoming signaling messages
            const unsubscribe = onSignal((msg: VoiceChatSignalingMessage) => {
              switch (msg.type) {
                case "connect_info":
                  handleConnectInfo(msg, localStream);
                  break;
                case "offer":
                  handleOffer(msg);
                  break;
                case "answer":
                  handleAnswer(msg);
                  break;
                case "ice-candidate":
                  handleIceCandidateMsg(msg);
                  break;
                case "user_join":
                case "user_left":
                  handleUserJoinLeave(msg);
                  break;
                case "ping":
                case "pong":
                  break;
                default:
                  addLog(
                    "Ignoring answer because this peer is not the offerer."
                  );
                  break;
              }
            });

            cleanup = () => {
              if (unsubscribe) unsubscribe();
              closeAllPeerConnections();
              stopMedia();
            };

            // Set connection state
            setIsConnected(true);
            // Set tent ID to trigger signaling connection
            setCurrentTentId(tentId);
            addLog(`Successfully joined tent ${tentId}`);
          } else if (mediaError) {
            addLog(`Error accessing microphone: ${mediaError}`);
          }
        } else {
          addLog("getUserMedia is not supported on this device/browser.");
        }
      } catch (error) {
        addLog(`Error joining tent ${tentId}: ${error}`);
        setIsConnected(false);
        setCurrentTentId(null);
      }

      return () => {
        isMounted = false;
        if (cleanup) cleanup();
      };
    },
    [
      currentTentId,
      createPeerConnection,
      addTracks,
      addTracksToPeer,
      closeAllPeerConnections,
      addLog,
      getMedia,
      stopMedia,
      mediaError,
      sendSignal,
      onSignal,
      handleConnectInfo,
      handleUserJoinLeave,
      leaveTent,
      peerDataRef,
    ]
  );

  return {
    logs,
    wsLogs,
    wsLatency,
    mediaError,
    mediaLoading,
    currentTentId,
    isConnected,
    peerConnections,
    peerDataRef,
    joinTent,
    leaveTent,
    username,
    otherUsers,
    isMuted,
    toggleMute,
    isDeafened,
    toggleDeafen,
    isScreenSharing,
    toggleScreenShare,
  };
}
