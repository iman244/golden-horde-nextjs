"use client";
import React, {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTentSignaling } from "../_hooks/useTentSignaling";
import { createPeerConnection, WebSocketStatusType } from "../_utils";
import { TentSignalingMessages } from "../_types";
import { useAuth } from "@/app/context/AuthContext";
import {
  useRTCDataChannel,
  RTCDataChannelMessageType,
} from "../_hooks/useRTCDataChannel";
import { createLogger } from "../_utils/logger";
import { useTentLogsContext } from "./TentLogsContext";
import { useStreamContext } from "./StreamContext";
import { LogEntry } from "@/app/hooks/useLogs";
import { useTentContext } from "./TentProvider";

type userRTCData = {
  pc: RTCPeerConnection;
  dc?: RTCDataChannel;
  stream?: MediaStream;
  audioState?: { isMuted: boolean; isDeafened: boolean };
};
type connectionsType = Map<string, userRTCData>;

interface TentRTCContextType {
  connections: connectionsType;
  connectionsRef: connectionsType;
  currentTentId: string | number | null;
  joinTent: (tent_id: string | number) => Promise<void>;
  leaveTent: () => Promise<void>;
  wsLogs: LogEntry[]; // Will be handled by TentSignalingContext later
  wsLatency: number | null;
  wsStatus: WebSocketStatusType;
  dcMessages: RTCDataChannelMessageType[];
  senddcMessage: (message: string) => void;
  retryAddTrack: () => Promise<void>;
  reconnectToUser: (target_user: string) => Promise<void>;
  // Audio state getters
  getPeerAudioState: (
    username: string
  ) => { isMuted: boolean; isDeafened: boolean } | null;
  getAllPeerAudioStates: () => Map<
    string,
    { isMuted: boolean; isDeafened: boolean }
  >;
}

const TentRTCContext = createContext<TentRTCContextType | undefined>(undefined);

const { log } = createLogger("TentRTCProvider");

const TentRTCProvider: FC<{ children: ReactNode }> = ({ children }) => {
  log("TentRTCProvider initialized");
  const { username } = useAuth();
  const { clearLogs, addLog, removeLog } = useTentLogsContext();
  const { currentTentId, setCurrentTentId } = useTentContext();

  const connectionsRef = useRef<connectionsType>(new Map());
  const [connections, setConnections] = useState<connectionsType>(new Map());

  const pendingGeneratedICECandidateMessagesRef = useRef<
    Map<string, Extract<TentSignalingMessages, { type: "ice-candidate" }>[]>
  >(new Map());

  // Store pending audio states for users we don't have connections with yet
  const pendingAudioStatesRef = useRef<
    Map<string, { isMuted: boolean; isDeafened: boolean }>
  >(new Map());

  useEffect(() => {
    pendingGeneratedICECandidateMessagesRef.current.clear();
    pendingAudioStatesRef.current.clear();
  }, [currentTentId]);

  const updateUserData = useCallback(
    (target_user: string, newData: userRTCData) => {
      // Check for pending audio state and apply it
      const pendingAudioState = pendingAudioStatesRef.current.get(target_user);
      if (pendingAudioState && !newData.audioState) {
        newData = { ...newData, audioState: pendingAudioState };
        pendingAudioStatesRef.current.delete(target_user);
        addLog(
          target_user,
          `Applied pending audio state: muted=${pendingAudioState.isMuted}, deafened=${pendingAudioState.isDeafened}`,
          "info"
        );
      }

      connectionsRef.current.set(target_user, newData);
      setConnections((preMap) => {
        const newMap = new Map(preMap);
        newMap.set(target_user, newData);
        return newMap;
      });
    },
    [addLog]
  );

  const { addTrack, isMuted, isDeafened } = useStreamContext();

  const {
    dcMessages,
    getOnMessageHandler,
    registerSentMessage,
    clearMessages,
  } = useRTCDataChannel();

  const senddcMessage = useCallback(
    (message: string) => {
      registerSentMessage(message);
      connectionsRef.current.forEach(({ dc }) => {
        if (dc && dc.readyState == "open") {
          dc.send(message);
        } else {
          console.warn("Data channel is not connected");
        }
      });
    },
    [registerSentMessage]
  );

  const { onSignal, sendSignal, wsLatency, wsStatus, closeWebSocket, wsLogs } =
    useTentSignaling(currentTentId);

  // Broadcast audio state changes to all peers
  useEffect(() => {
    sendSignal({
      type: "audio_state_changed",
      username: username!,
      isMuted,
      isDeafened,
    });
  }, [isMuted, isDeafened, sendSignal, username]);

  // Ref to store unsubscribe function
  const unsubscribeRef = React.useRef<(() => void) | null>(null);

  const leaveTent = useCallback(async () => {
    // Unsubscribe from onSignal if subscribed
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (currentTentId === null) {
      //   addLog("Not connected to any tent");
      return;
    }
    connectionsRef.current.forEach((v) => {
      v.pc.close();
    });
    connectionsRef.current = new Map();
    setConnections(new Map(connectionsRef.current));
    clearMessages();
    closeWebSocket();
    setCurrentTentId(null);
  }, [currentTentId, closeWebSocket, clearMessages]);

  const onconnectionstatechange = useCallback(
    (user: string, pc: RTCPeerConnection) => async () => {
      //   console.log("onconnectionstatechange ev", ev);
      const { connectionState } = pc;
      addLog(
        user,
        `Connection state changed: ${connectionState}`,
        connectionState == "failed" || connectionState == "disconnected"
          ? "error"
          : "info"
      );
      if (connectionState == "failed") {
        sendSignal({
          type: "failed",
          username: username!,
          target_user: user,
        });
      }
    },
    [addLog, sendSignal, username]
  );

  const onsignalingstatechange = useCallback(
    // @ts-ignore
    (user: string, pc: RTCPeerConnection) => () => {
      addLog(user, `Signaling state changed: ${pc.signalingState}`, "info");
    },
    [addLog]
  );

  const oniceconnectionstatechange = useCallback(
    // @ts-ignore
    (user: string, pc: RTCPeerConnection) => () => {
      addLog(
        user,
        `ICE connection state changed: ${pc.iceConnectionState}`,
        "info"
      );
    },
    [addLog]
  );

  const onicecandidateerror = useCallback(
    (user: string) => (ev: RTCPeerConnectionIceErrorEvent) => {
      //   console.log("onicecandidateerror ev", ev);
      addLog(
        user,
        `ICE candidate error: code=${ev.errorCode}, text=${ev.errorText}, url=${ev.url}, address=${ev.address}, port=${ev.port}`,
        "error"
      );
    },
    [addLog]
  );

  const onicecandidate = useCallback(
    (target_user: string, pc: RTCPeerConnection) =>
      (ev: RTCPeerConnectionIceEvent) => {
        if (ev.candidate?.candidate != null && ev.candidate.candidate !== "") {
          const candidateMessage: Extract<
            TentSignalingMessages,
            { type: "ice-candidate" }
          > = {
            type: "ice-candidate",
            username: username!,
            target_user,
            candidate: ev.candidate?.candidate,
            sdpMid: ev.candidate.sdpMid!,
            sdpMLineIndex: ev.candidate.sdpMLineIndex!,
          };
          const candidateType = ev.candidate.candidate.split(" ")[7];
          if (pc.localDescription && pc.remoteDescription) {
            addLog(
              target_user,
              `Sending ICE candidate to ${target_user} (type: ${candidateType})`,
              "info"
            );
            sendSignal(candidateMessage);
          } else {
            addLog(
              target_user,
              `added to queue: Sending ICE candidate to ${target_user} (type: ${candidateType})`,
              "info"
            );
            const pre =
              pendingGeneratedICECandidateMessagesRef.current.get(
                target_user
              ) || [];
            pendingGeneratedICECandidateMessagesRef.current.set(target_user, [
              ...pre,
              candidateMessage,
            ]);
          }
        }
      },
    [addLog, sendSignal, username]
  );

  const sendIceCandidates = useCallback(
    (target_user: string) => {
      pendingGeneratedICECandidateMessagesRef.current
        .get(target_user)
        ?.forEach((m) => {
          const candidateType = m.candidate.split(" ")[7];
          addLog(
            target_user,
            `Sending ICE candidate to ${target_user} (type: ${candidateType})`,
            "info"
          );
          sendSignal(m);
        });
      pendingGeneratedICECandidateMessagesRef.current.set(target_user, []);
    },
    [addLog, sendSignal]
  );

  const ontrack = useCallback(
    (target_user: string, pc: RTCPeerConnection) =>
      async (ev: RTCTrackEvent) => {
        const pre = connectionsRef.current.get(target_user);
        const user_stream = ev.streams[0];
        // console.log("ontrack ev", ev);
        addLog(target_user, "Track Received");
        updateUserData(target_user, { pc, ...pre, stream: user_stream });
      },
    [updateUserData, addLog]
  );

  // Helper to create and setup a peer connection with event handlers (excluding data channel logic)
  const createPeerConnectionWithHandlers = useCallback(
    (target_user: string) => {
      const pc = createPeerConnection();
      pc.onicecandidate = onicecandidate(target_user, pc);
      pc.onconnectionstatechange = onconnectionstatechange(target_user, pc);
      pc.onsignalingstatechange = onsignalingstatechange(target_user, pc);
      pc.oniceconnectionstatechange = oniceconnectionstatechange(
        target_user,
        pc
      );
      pc.onicecandidateerror = onicecandidateerror(target_user);
      return pc;
    },
    [
      onicecandidate,
      onconnectionstatechange,
      onsignalingstatechange,
      oniceconnectionstatechange,
      onicecandidateerror,
    ]
  );

  // Utility to wait for signalingState to become 'stable'
  const waitForStable: (pc: RTCPeerConnection) => Promise<void> = useCallback(
    async (pc) => {
      return new Promise((resolve) => {
        if (pc.signalingState === "stable") {
          resolve();
          return;
        }
        const handler = () => {
          if (pc.signalingState === "stable") {
            pc.removeEventListener("signalingstatechange", handler);
            resolve();
          }
        };
        pc.addEventListener("signalingstatechange", handler);
      });
    },
    []
  );

  const negotiateConnection = useCallback(
    async (target_user: string) => {
      let pc = connectionsRef.current.get(target_user)?.pc;
      let dc = connectionsRef.current.get(target_user)?.dc;
      if (!pc) {
        addLog(target_user, `Creating connection to ${target_user}`, "info");
        pc = createPeerConnectionWithHandlers(target_user);
      } else {
        addLog(target_user, `starting renegotiation with ${target_user}`);
      }
      // Only create a new data channel if one does not exist
      if (!dc) {
        dc = pc.createDataChannel(`${username!}_` + target_user);
        dc.onmessage = getOnMessageHandler(target_user);
      }
      pc.ontrack = ontrack(target_user, pc);
      try {
        addLog(target_user, `Calling addTrack for ${target_user}`, "info");
        await addTrack(target_user, pc);
        // console.log("negotiateConnection pc.getSenders()", pc.getSenders());
      } catch (err) {
        console.error(
          target_user,
          `Error in negotiateConnection addTrack: ${err}`
        );
        addLog(target_user, `Error in addTrack: ${err}`, "error");
        const pre = connectionsRef.current.get(target_user);
        updateUserData(target_user, { ...pre, pc, dc });
        return;
      }
      // Wait for signalingState to be stable before creating an offer
      if (pc.signalingState !== "stable") {
        addLog(
          target_user,
          `Waiting for signalingState to become stable before creating offer`,
          "info"
        );
        await waitForStable(pc);
      }
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const preD = connectionsRef.current.get(target_user);
      updateUserData(target_user, { ...preD, pc, dc });
      addLog(target_user, `Sending offer to ${target_user}`, "info");
      sendSignal({
        type: "offer",
        sdp: offer.sdp!,
        username: username!,
        target_user,
      });
    },
    [
      updateUserData,
      sendSignal,
      username,
      getOnMessageHandler,
      addLog,
      createPeerConnectionWithHandlers,
      waitForStable,
      addTrack,
      ontrack,
    ]
  );

  const reconnectToUser = useCallback(
    async (target_user: string) => await negotiateConnection(target_user),
    [negotiateConnection]
  );

  const handleOffer = useCallback(
    async ({
      from,
      offer,
    }: {
      from: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      addLog(from, `Received offer from ${from}`, "info");
      let pc = connectionsRef.current.get(from)?.pc;
      if (!pc) {
        removeLog(from);
        pc = createPeerConnectionWithHandlers(from);
      } else {
        addLog(from, `${from} start renegotiation`);
      }
      pc.ontrack = ontrack(from, pc);
      try {
        addLog(from, `Setting remote description (offer)`, "info");
        await pc.setRemoteDescription(offer);
      } catch (err) {
        addLog(from, `Error setting remote description: ${err}`, "error");
        return;
      }
      try {
        addLog(from, `Calling addTrack for ${from}`, "info");
        await addTrack(from, pc);
      } catch (err) {
        console.error(from, `Error in handleOffer addTrack: ${err}`);
        addLog(from, `Error in addTrack: ${err}`, "error");
        const pre = connectionsRef.current.get(from);
        updateUserData(from, { ...pre, pc });
      }

      let answer;
      try {
        answer = await pc.createAnswer();
        addLog(
          from,
          `Created answer SDP: ${answer.sdp?.slice(0, 100)}...`,
          "info"
        );
        await pc.setLocalDescription(answer);
      } catch (err) {
        addLog(from, `Error creating or setting answer: ${err}`, "error");
        return;
      }
      const preD = connectionsRef.current.get(from);
      updateUserData(from, { ...preD, pc });
      pc.ondatachannel = (event: RTCDataChannelEvent) => {
        const dc = event.channel;
        dc.onmessage = getOnMessageHandler(from);
        const preD = connectionsRef.current.get(from);
        updateUserData(from, { ...preD, pc, dc });
        addLog(from, `Data channel established with ${from}`, "info");
      };
      addLog(from, `Sending answer to ${from}`, "info");
      sendSignal({
        type: "answer",
        sdp: answer.sdp!,
        username: username!,
        target_user: from,
      });
      sendIceCandidates(from);
    },
    [
      updateUserData,
      sendSignal,
      username,
      getOnMessageHandler,
      addLog,
      removeLog,
      sendIceCandidates,
      createPeerConnectionWithHandlers,
      ontrack,
      addTrack,
    ]
  );

  const handleAnswer = useCallback(
    async ({
      from,
      answer,
    }: {
      from: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      const pc = connectionsRef.current.get(from)?.pc;
      if (pc == undefined) {
        addLog(
          from,
          `No peer connection found for ${from} when handling answer`,
          "warning"
        );
        return;
      }
      await pc.setRemoteDescription(answer);
      addLog(from, `Received answer from ${from}`, "info");

      sendIceCandidates(from);
    },
    [addLog, sendIceCandidates]
  );

  const handleUserLeave = useCallback(
    async ({ user }: { user: string }) => {
      if (user !== username) {
        connectionsRef.current.get(user)?.pc.close();
        connectionsRef.current.delete(user);
        // Clean up pending audio state
        pendingAudioStatesRef.current.delete(user);
        setConnections(new Map(connectionsRef.current));
        addLog(user, `${user} left and connection closed`, "info");
      }
    },
    [addLog, username]
  );

  const handleIceCandidateMsg = useCallback(
    async ({
      from,
      iceCandidate,
    }: {
      from: string;
      iceCandidate: RTCIceCandidateInit;
    }) => {
      const pc = connectionsRef.current.get(from)?.pc;
      const candidateType = iceCandidate.candidate
        ? iceCandidate.candidate.split(" ")[7]
        : "unknown";
      if (!pc) {
        // const pre = pendingICECandidatesRef.current.get(from) || [];
        // pendingICECandidatesRef.current.set(from, [...pre, iceCandidate]);
        addLog(
          from,
          `No peer connection found for ${from} when adding ICE candidate (type: ${candidateType}), added to pending`,
          "warning"
        );
        return;
      }
      pc.addIceCandidate(iceCandidate)
        .then(() => {
          addLog(
            from,
            `Added ICE candidate from ${from} (type: ${candidateType})`,
            "info"
          );
        })
        .catch((reason) => {
          addLog(
            from,
            `error adding ICE candidate from ${from} (type: ${candidateType}): ${JSON.stringify(
              reason,
              null,
              2
            )}`,
            "error"
          );
        });
    },
    [addLog]
  );

  const joinTent = useCallback(
    async (tentId: string | number) => {
      if (currentTentId === tentId) {
        return;
      }
      clearLogs();

      // Leave current tent if connected
      if (currentTentId !== null) {
        console.log("joinTent leaveTent currentTentId !== null was");
        await leaveTent();
      }

      // Unsubscribe previous if any
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      unsubscribeRef.current = onSignal(async (msg: TentSignalingMessages) => {
        switch (msg.type) {
          case "connect_info":
            msg.other_users.forEach(async (target_user) => {
              removeLog(target_user);
              await negotiateConnection(target_user);
            });
            // Send current audio state to all existing users after connections are initiated
            if (msg.other_users.length > 0) {
              setTimeout(() => {
                sendSignal({
                  type: "audio_state_changed",
                  username: username!,
                  isMuted,
                  isDeafened,
                });
              }, 100); // Small delay to ensure connections are being established
            }
            break;
          case "failed":
            addLog(msg.username, "Connection Failed, try to reconnecting...");
            await negotiateConnection(msg.username);
            break;
          case "offer":
            await handleOffer({
              offer: { type: "offer", sdp: msg.sdp! },
              from: msg.username,
            });
            break;
          case "answer":
            await handleAnswer({
              from: msg.username,
              answer: {
                type: "answer",
                sdp: msg.sdp!,
              },
            });
            break;
          case "ice-candidate":
            await handleIceCandidateMsg({
              from: msg.username,
              iceCandidate: {
                candidate: msg.candidate,
                sdpMid: msg.sdpMid,
                sdpMLineIndex: msg.sdpMLineIndex,
              },
            });
            break;
          case "user_joined":
            // Send current audio state to newly joined user
            setTimeout(() => {
              sendSignal({
                type: "audio_state_changed",
                username: username!,
                isMuted,
                isDeafened,
              });
            }, 100); // Small delay to ensure the new user is ready to receive
            break;
          case "user_left":
            await handleUserLeave({ user: msg.username });
            break;
          case "audio_state_changed":
            // Update the connection's audioState
            const existingConnection = connectionsRef.current.get(msg.username);
            if (existingConnection) {
              updateUserData(msg.username, {
                ...existingConnection,
                audioState: {
                  isMuted: msg.isMuted,
                  isDeafened: msg.isDeafened,
                },
              });
              addLog(
                msg.username,
                `Audio state updated: muted=${msg.isMuted}, deafened=${msg.isDeafened}`,
                "info"
              );
            } else if (msg.username !== username) {
              // Store audio state for when connection is created
              pendingAudioStatesRef.current.set(msg.username, {
                isMuted: msg.isMuted,
                isDeafened: msg.isDeafened,
              });

              addLog(
                msg.username,
                `Audio state stored (pending connection): muted=${msg.isMuted}, deafened=${msg.isDeafened}`,
                "info"
              );
            }
            break;
          case "ping":
          case "pong":
            break;
          default:
            console.log("default is not handling yet", msg);
            break;
        }
      });

      setCurrentTentId(tentId);
    },
    [
      addLog,
      removeLog,
      clearLogs,
      leaveTent,
      currentTentId,
      onSignal,
      negotiateConnection,
      handleOffer,
      handleAnswer,
      handleUserLeave,
      handleIceCandidateMsg,
      updateUserData,
      isDeafened,
      isMuted,
      sendSignal,
      username,
    ]
  );

  const retryAddTrack = useCallback(async () => {
    console.log("retryAddTrack is running");
    console.log("connectionsRef", connectionsRef.current);
    for (const [target_user, { pc }] of connectionsRef.current.entries()) {
      if (!pc) {
        addLog(
          target_user,
          "No peer connection found for retrying addTrack",
          "error"
        );
        continue;
      }
      try {
        addLog(target_user, "Retrying addTrack...", "info");
        await addTrack(target_user, pc);
        addLog(target_user, "addTrack retry succeeded", "info");
        await negotiateConnection(target_user);
      } catch (err) {
        addLog(target_user, `addTrack retry failed: ${err}`, "error");
      }
    }
  }, [addTrack, addLog, negotiateConnection]);

  // Audio state getter functions
  const getPeerAudioState = useCallback(
    (username: string) => {
      return connections.get(username)?.audioState || null;
    },
    [connections]
  );

  const getAllPeerAudioStates = useCallback(() => {
    const audioStates = new Map<
      string,
      { isMuted: boolean; isDeafened: boolean }
    >();
    connections.forEach((connection, username) => {
      if (connection.audioState) {
        audioStates.set(username, connection.audioState);
      }
    });
    return audioStates;
  }, [connections]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue: TentRTCContextType = useMemo(
    () => ({
      connections,
      connectionsRef: connectionsRef.current,
      wsLogs,
      reconnectToUser,
      joinTent,
      leaveTent,
      wsLatency,
      wsStatus,
      currentTentId,
      dcMessages,
      senddcMessage,
      retryAddTrack,
      getPeerAudioState,
      getAllPeerAudioStates,
    }),
    [
      connections,
      wsLogs,
      reconnectToUser,
      joinTent,
      leaveTent,
      wsLatency,
      wsStatus,
      currentTentId,
      dcMessages,
      senddcMessage,
      retryAddTrack,
      getPeerAudioState,
      getAllPeerAudioStates,
    ]
  );

  return (
    <TentRTCContext.Provider value={contextValue}>
      {children}
    </TentRTCContext.Provider>
  );
};

export default TentRTCProvider;

export const useTentRTCContext = () => {
  const context = useContext(TentRTCContext);
  if (!context) {
    throw new Error("useTentRTCContext must be used within a TentRTCProvider");
  }
  return context;
};
