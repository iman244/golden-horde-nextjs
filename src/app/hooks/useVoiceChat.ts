import { useState, useCallback } from "react";
import { useWebRTC } from "./useWebRTC";
import { useSignaling } from "./useSignaling";
import type { VoiceChatSignalingMessage } from "../types";
import { useLogs } from "./useLogs";
import { useMediaStream } from "./useMediaStream";

export function useVoiceChat() {
  const { logs, addLog } = useLogs();
  const [currentTentId, setCurrentTentId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [otherUsers, setOtherUsers] = useState<string[]>([]);

  const {
    error: mediaError,
    loading: mediaLoading,
    getMedia,
    stopMedia,
  } = useMediaStream();

  const getVoiceChatUrl = useCallback((id: string | number) => `wss://${process.env.NEXT_PUBLIC_DJANGO_ADMIN_DOMAIN}/ws/voice_chat/${id}/`,[])

  // Initialize signaling when tentId changes
  const { wsLogs, sendSignal, onSignal, wsLatency } = useSignaling<VoiceChatSignalingMessage>({
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
    [addLog, sendSignal, username]
  );

  const {
    peerConnections,
    peerDataRef,
    createPeerConnection,
    addTracks,
    addTracksToPeer,
    closeAllPeerConnections,
  } = useWebRTC(handleIceCandidate);

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
                    return peerConnEntry!.peerConnection.setLocalDescription(answer).then(() => {
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
                  setUsername(msg.username);
                  setOtherUsers(
                    Array.isArray(msg.other_users) ? msg.other_users : []
                  );
                  addLog(`Your user name: ${msg.username}`);
                  addLog(
                    `Other users in tent: ${(msg.other_users || []).join(", ")}`
                  );
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
                          peerConnEntry.peerConnection.createOffer().then((offer) => {
                            peerConnEntry!.peerConnection.setLocalDescription(offer).then(() => {
                              sendSignal({
                                type: "offer",
                                sdp: offer.sdp!,
                                username: msg.username,
                                target_user,
                              });
                              addLog(`Offer sent to ${target_user}`);
                            });
                          });
                        }
                      }
                    });
                  }
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
                case "ping":
                case "pong":
                  // Ignore ping/pong messages for logging and signaling
                  break;
                default:
                  addLog(
                    "Ignoring answer because this peer is not the offerer."
                  );
                  break;
              }
            });

            // Only create and send offer if we are the first peer (offerer)
            // For demo, always create offer on mount
            // pc.createOffer().then((offer) => {
            //   setRole("offerer");
            //   addLog("Role set: offerer");
            //   addLog("Created offer, setting local description.");
            //   return pc.setLocalDescription(offer).then(() => {
            //     addLog(
            //       "Local description set with offer. Sending offer to server."
            //     );
            //     if (typeof offer.sdp === "string") {
            //       sendSignal({
            //         type: "offer",
            //         sdp: offer.sdp,
            //         username: username ?? "",
            //         target_user: "peer1", // This will be updated by the server
            //       });
            //       addLog("Offer sent to server.");
            //     } else {
            //       const errMsg = `Error: offer.sdp is not a string (value: ${String(
            //         offer.sdp
            //       )})`;
            //       addLog(errMsg);
            //       throw new Error(errMsg);
            //     }
            //   });
            // });

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
      setUsername,
      setOtherUsers,
      username,
    ]
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
  };
}
