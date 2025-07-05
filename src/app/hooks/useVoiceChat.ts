import { useEffect, useState, useCallback } from "react";
import { useWebRTC } from "./useWebRTC";
import { useSignaling } from "./useSignaling";
import type { PeerRole, SignalingMessage } from "../types";
import { useConnectionStats } from "./useConnectionStats";
import { useLogs } from "./useLogs";
import { useMediaStream } from "./useMediaStream";

export function useVoiceChat(wsUrl: string) {
  const { logs, addLog } = useLogs();
  const [role, setRole] = useState<PeerRole>(null);
  const { wsLogs, sendSignal, onSignal, wsLatency } = useSignaling(wsUrl);
  const { error: mediaError, loading: mediaLoading, getMedia, stopMedia } = useMediaStream();

  // ICE candidate handler to be passed to useWebRTC
  const handleIceCandidate = useCallback((candidate: RTCIceCandidate) => {
    if (candidate.candidate != null && candidate.candidate !== "") {
      addLog("ICE candidate gathered: " + candidate.candidate);
      sendSignal({
        type: "ice-candidate",
        candidate: candidate.candidate as string,
        ...(typeof candidate.sdpMid === 'string' ? { sdpMid: candidate.sdpMid } : {}),
        ...(typeof candidate.sdpMLineIndex === 'number' ? { sdpMLineIndex: candidate.sdpMLineIndex } : {}),
      });
      addLog("ICE candidate sent to server.");
    }
  }, [addLog, sendSignal]);

  const { audioRef, pcStatus, createPeerConnection, addTracks, pcRef } = useWebRTC(handleIceCandidate);
  const connectionStats = useConnectionStats(pcRef.current);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let isMounted = true;
    (async () => {
      if (
        navigator.mediaDevices &&
        typeof navigator.mediaDevices.getUserMedia === "function"
      ) {
        const localStream = await getMedia("audio");
        if (!isMounted) return;
        if (localStream) {
          addLog("Microphone access granted. Adding audio tracks to RTCPeerConnection.");
          const pc = createPeerConnection();
          addTracks(localStream);
          addLog("Audio tracks added to RTCPeerConnection.");

          // Extracted handlers for offer, answer, and ICE candidate
          function handleOffer(msg: Extract<SignalingMessage, { type: "offer" }>) {
            setRole("answerer");
            addLog("Role set: answerer");
            addLog("Received offer, setting remote description.");
            pc.setRemoteDescription(
              new RTCSessionDescription({
                type: "offer",
                sdp: msg.sdp,
              })
            )
              .then(() => {
                addLog("Remote description set. Creating answer...");
                return pc.createAnswer();
              })
              .then((answer) => {
                addLog(
                  "Answer created. Setting local description and sending to server."
                );
                return pc.setLocalDescription(answer).then(() => {
                  if (typeof answer.sdp === 'string') {
                    sendSignal({
                      type: "answer",
                      sdp: answer.sdp,
                    });
                    addLog("Answer sent to server.");
                  } else {
                    const errMsg = `Error: answer.sdp is not a string (value: ${String(answer.sdp)})`;
                    addLog(errMsg);
                    throw new Error(errMsg);
                  }
                });
              })
              .catch((err) => {
                addLog("Error during answer creation: " + err);
                console.error(err);
              });
          }

          function handleAnswer(msg: Extract<SignalingMessage, { type: "answer" }>) {
            addLog("Received answer, setting remote description.");
            pc.setRemoteDescription(
              new RTCSessionDescription({
                type: "answer",
                sdp: msg.sdp,
              })
            )
              .then(() => {
                addLog("Remote description set with answer.");
              })
              .catch((err) => {
                addLog("Error setting remote description with answer: " + err);
                console.error(err);
              });
          }

          function handleIceCandidateMsg(msg: Extract<SignalingMessage, { type: "ice-candidate" }>) {
            if (msg.candidate != null && msg.candidate !== "") {
              addLog(
                "Received ICE candidate from server. Adding to RTCPeerConnection."
              );
              pc.addIceCandidate({
                candidate: msg.candidate as string,
                ...(typeof msg.sdpMid === 'string' ? { sdpMid: msg.sdpMid } : {}),
                ...(typeof msg.sdpMLineIndex === 'number' ? { sdpMLineIndex: msg.sdpMLineIndex } : {}),
              })
                .then(() => {
                  addLog("ICE candidate added.");
                })
                .catch((err) => {
                  addLog("Error adding ICE candidate: " + err);
                  console.error(err);
                });
            }
          }

          // Handle incoming signaling messages
          const unsubscribe = onSignal((msg: SignalingMessage) => {
            switch (msg.type) {
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
                addLog("Ignoring answer because this peer is not the offerer.");
                break;
            }
          });

          // Only create and send offer if we are the first peer (offerer)
          // For demo, always create offer on mount
          pc.createOffer().then((offer) => {
            setRole("offerer");
            addLog("Role set: offerer");
            addLog("Created offer, setting local description.");
            return pc.setLocalDescription(offer).then(() => {
              addLog("Local description set with offer. Sending offer to server.");
              if (typeof offer.sdp === 'string') {
                sendSignal({
                  type: "offer",
                  sdp: offer.sdp,
                });
                addLog("Offer sent to server.");
              } else {
                const errMsg = `Error: offer.sdp is not a string (value: ${String(offer.sdp)})`;
                addLog(errMsg);
                throw new Error(errMsg);
              }
            });
          });

          cleanup = () => {
            unsubscribe();
            pc.close();
            stopMedia();
          };
        } else if (mediaError) {
          addLog(`Error accessing microphone: ${mediaError}`);
        }
      } else {
        addLog("getUserMedia is not supported on this device/browser.");
        // Optionally, you can log or handle error signaling here
        console.error("getUserMedia is not supported on this device/browser.");
      }
    })();
    return () => {
      isMounted = false;
      if (cleanup) cleanup();
    };
  }, [wsUrl, createPeerConnection, addTracks, onSignal, sendSignal, addLog, getMedia, stopMedia, mediaError]);

  return { audioRef, logs, wsLogs, role, pcStatus, connectionStats, wsLatency, mediaError, mediaLoading };
} 