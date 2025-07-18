"use client";
import { LogEntry } from "@/app/hooks/useLogs";
import React, {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
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
import { LogsMap, useKeyedLogs } from "@/app/v2/_hooks/useKeyedLogs";
// import useStream from "../_hooks/useStream";

type userRTCData = {
  pc: RTCPeerConnection;
  dc?: RTCDataChannel;
  stream?: MediaStream;
};
type connectionsType = Map<string, userRTCData>;

interface TentRTCContextType {
  connections: connectionsType;
  connectionsRef: connectionsType;
  currentTentId: string | number | null;
  joinTent: (tent_id: string | number) => Promise<void>;
  leaveTent: () => Promise<void>;
  logsMap: LogsMap; // LogsMap is now Map<string, LogEntry[]>
  wsLogs: LogEntry[];
  wsLatency: number | null;
  status: (tentId: string | number) => WebSocketStatusType;
  dcMessages: RTCDataChannelMessageType[];
  senddcMessage: (message: string) => void;
}

const TentRTCContext = createContext<TentRTCContextType | undefined>(undefined);

const TentRTCProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { username } = useAuth();
  const { clearLogs, logsMap, addLog, removeLog } = useKeyedLogs();
  const [currentTentId, setCurrentTentId] = useState<string | number | null>(
    null
  );
  //   const { streamS } = useStream()
  const connectionsRef = useRef<connectionsType>(new Map());
  const [connections, setConnections] = useState<connectionsType>(new Map());

  const updateUserData = useCallback(
    (target_user: string, newData: userRTCData) => {
      connectionsRef.current.set(target_user, newData);
      setConnections((preMap) => {
        const newMap = new Map(preMap);
        newMap.set(target_user, newData);
        return newMap;
      });
    },
    []
  );

  const pendingGeneratedICECandidateMessagesRef = useRef<
    Map<string, Extract<TentSignalingMessages, { type: "ice-candidate" }>[]>
  >(new Map());

  useEffect(() => {
    pendingGeneratedICECandidateMessagesRef.current.clear();
  }, [currentTentId]);

  const streamRef = useRef<MediaStream>(null);
  const addTrack = useCallback(
    async (target_user: string, pc: RTCPeerConnection) => {
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      }
      const tracks = streamRef.current.getTracks();
      tracks.forEach((t) => pc.addTrack(t, streamRef.current!));
      addLog(target_user, "Add Tracks");
      console.log("addTrack tracks", tracks);
    },
    [addLog]
  );

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
          window.alert("dc is not connect");
        }
      });
    },
    [registerSentMessage]
  );

  const { onSignal, sendSignal, wsLatency, status, closeWebSocket, wsLogs } =
    useTentSignaling(currentTentId);

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
    (user: string, pc: RTCPeerConnection) => async (ev: Event) => {
      console.log("onconnectionstatechange ev", ev);
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
    (user: string, pc: RTCPeerConnection) => (ev: Event) => {
      console.log("onsignalingstatechange ev", ev);
      addLog(user, `Signaling state changed: ${pc.signalingState}`, "info");
    },
    [addLog]
  );

  const oniceconnectionstatechange = useCallback(
    (user: string, pc: RTCPeerConnection) => (ev: Event) => {
      console.log("oniceconnectionstatechange ev", ev);
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
        console.log("ontrack ev", ev);
        addLog(target_user, "Track Received");
        updateUserData(target_user, { pc, ...pre, stream: user_stream });
      },
    [updateUserData, addLog]
  );

  // Helper to create and setup a peer connection with event handlers (excluding data channel logic)
  const createAndSetupPeerConnection = useCallback(
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

  const handleCreatingConnections = useCallback(
    async (target_user: string) => {
      addLog(target_user, `Creating connection to ${target_user}`, "info");
      const pc = createAndSetupPeerConnection(target_user);
      const dc = pc.createDataChannel(`${username!}_` + target_user);
      dc.onmessage = getOnMessageHandler(target_user);
      pc.ontrack = ontrack(target_user, pc);
      await addTrack(target_user, pc);
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
      createAndSetupPeerConnection,
      addTrack,
      ontrack,
    ]
  );

  const handleOffer = useCallback(
    async ({
      from,
      offer,
    }: {
      from: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      removeLog(from);
      addLog(from, `Received offer from ${from}`, "info");
      const pc = createAndSetupPeerConnection(from);
      pc.ontrack = ontrack(from, pc);
      try {
        addLog(
          from,
          `Setting remote description (offer): ${JSON.stringify(offer)}`,
          "info"
        );
        await pc.setRemoteDescription(offer);
      } catch (err) {
        addLog(from, `Error setting remote description: ${err}`, "error");
        return;
      }
      try {
        addLog(from, `Calling addTrack for ${from}`, "info");
        await addTrack(from, pc);
      } catch (err) {
        addLog(from, `Error in addTrack: ${err}`, "error");
      }
      let answer;
      try {
        answer = await pc.createAnswer();
        addLog(from, `Created answer SDP: ${JSON.stringify(answer)}`, "info");
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
      createAndSetupPeerConnection,
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
    async ({ username }: { username: string }) => {
      connectionsRef.current.get(username)?.pc.close();
      connectionsRef.current.delete(username);
      setConnections(new Map(connectionsRef.current));
      addLog(username, `${username} left and connection closed`, "info");
    },
    [addLog]
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
              await handleCreatingConnections(target_user);
            });
            break;
          case "failed":
            addLog(msg.username, "Connection Failed, try to reconnecting...");
            await handleCreatingConnections(msg.username);
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
            console.log("user_joined is not handling yet");
            break;
          case "user_left":
            await handleUserLeave(msg);
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
      handleCreatingConnections,
      handleOffer,
      handleAnswer,
      handleUserLeave,
      handleIceCandidateMsg,
    ]
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return (
    <TentRTCContext.Provider
      value={{
        connections,
        connectionsRef: connectionsRef.current,
        logsMap,
        wsLogs,
        joinTent,
        leaveTent,
        wsLatency,
        status,
        currentTentId,
        dcMessages,
        senddcMessage,
      }}
    >
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
