"use client";
import { LogEntry } from "@/app/hooks/useLogs";
import React, {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
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

type connectionsType = Map<
  string,
  {
    pc: RTCPeerConnection;
    dc?: RTCDataChannel;
  }
>;

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
  //   const { logs, addLog, clearLogs } = useLogs();
  const { clearLogs, logsMap, addLog, removeLog } = useKeyedLogs();
  const [currentTentId, setCurrentTentId] = useState<string | number | null>(
    null
  );

  const connectionsRef = useRef<connectionsType>(new Map());
  const [connections, setConnections] = useState<connectionsType>(new Map());
  //   const pendingICECandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(
  //     new Map()
  //   );
  const pendingGeneratedICECandidateMessagesRef = useRef<
    Map<string, Extract<TentSignalingMessages, { type: "ice-candidate" }>[]>
  >(new Map());

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

  const onconnectionstatechange = useCallback(
    (user: string, pc: RTCPeerConnection) => async (ev: Event) => {
      console.log("onconnectionstatechange ev", ev);
      addLog(user, `Connection state changed: ${pc.connectionState}`, "info");
      //   if (pc.connectionState == "failed") {
      //     addLog(
      //       user,
      //       `for user: ${user} must send failed message ${pc.connectionState}`,
      //       "info"
      //     );
      //     sendSignal({
      //       type: "failed",
      //       username: username!,
      //       target_user: user,
      //     });
      //   }
    },
    [addLog]
  );

  const onsignalingstatechange = useCallback(
    (user: string, pc: RTCPeerConnection) => (ev: Event) => {
      console.log("onsignalingstatechange ev", ev);
      addLog(user, `Signaling state changed: ${pc.signalingState}`, "info");
      //   if(pc.signalingState == 'stable' && pc.localDescription && pc.remoteDescription) {
      //     console.log("pc.localDescription", pc.localDescription)
      //     console.log("pc.remoteDescription", pc.remoteDescription)
      // pendingGeneratedICECandidateMessagesRef.current.get(user)?.forEach((m)=>{
      //     const candidateType = m.candidate.split(" ")[7];
      //     addLog(
      //         user,
      //         `Sending queued message: ICE candidate to ${user} (type: ${candidateType})`,
      //         "info"
      //       );
      //     sendSignal(m)
      // })
      //   }
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
      console.log("onicecandidateerror ev", ev);
      addLog(
        user,
        `ICE candidate error: code=${ev.errorCode}, text=${ev.errorText}, url=${ev.url}, address=${ev.address}, port=${ev.port}`,
        "error"
      );
    },
    [addLog]
  );

  const onicecandidate = useCallback((target_user: string, pc: RTCPeerConnection) => (ev: RTCPeerConnectionIceEvent) => {
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
  },[addLog, sendSignal, username])

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
    },
    [addLog, sendSignal]
  );

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

  const handleCreatingConnections = useCallback(
    async (target_user: string) => {
      removeLog(target_user);
      addLog(target_user, `Creating connection to ${target_user}`, "info");
      const pc = createPeerConnection();
      // Attach event handlers
      pc.onconnectionstatechange = onconnectionstatechange(target_user, pc);
      pc.onsignalingstatechange = onsignalingstatechange(target_user, pc);
      pc.oniceconnectionstatechange = oniceconnectionstatechange(
        target_user,
        pc
      );
      pc.onicecandidateerror = onicecandidateerror(target_user);
      pc.onicecandidate = onicecandidate(target_user, pc)
      const dc = pc.createDataChannel(`${username!}_` + target_user);
      dc.onmessage = getOnMessageHandler(target_user);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      connectionsRef.current.set(target_user, { pc, dc });
      setConnections((pre) => {
        const newMap = new Map(pre);
        newMap.set(target_user, { pc, dc });
        return newMap;
      });
      addLog(target_user, `Sending offer to ${target_user}`, "info");
      sendSignal({
        type: "offer",
        sdp: offer.sdp!,
        username: username!,
        target_user,
      });
    },
    [
      sendSignal,
      username,
      getOnMessageHandler,
      addLog,
      removeLog,
      onconnectionstatechange,
      oniceconnectionstatechange,
      onicecandidateerror,
      onsignalingstatechange,
      onicecandidate
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
      const pc = createPeerConnection();
      // Attach event handlers
      pc.onicecandidate = onicecandidate(from, pc)
      pc.onconnectionstatechange = onconnectionstatechange(from, pc);
      pc.onsignalingstatechange = onsignalingstatechange(from, pc);
      pc.oniceconnectionstatechange = oniceconnectionstatechange(from, pc);
      pc.onicecandidateerror = onicecandidateerror(from);
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      connectionsRef.current.set(from, { pc });
      setConnections((prev) => {
        const newMap = new Map(prev);
        newMap.set(from, { pc });
        return newMap;
      });
      pc.ondatachannel = (event: RTCDataChannelEvent) => {
        const dc = event.channel;
        dc.onmessage = getOnMessageHandler(from);
        connectionsRef.current.set(from, { pc, dc });
        setConnections((prev) => {
          const newMap = new Map(prev);
          newMap.set(from, { pc, dc });
          return newMap;
        });
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

      //   pendingICECandidatesRef.current.get(from)?.forEach((iceCandidate) => {
      //     const candidateType = iceCandidate.candidate
      //       ? iceCandidate.candidate.split(" ")[7]
      //       : "unknown";
      //     pc.addIceCandidate(iceCandidate)
      //       .then(() => {
      //         addLog(
      //           from,
      //           `Added pending ICE candidate from ${from} (type: ${candidateType})`,
      //           "info"
      //         );
      //       })
      //       .catch((reason) => {
      //         addLog(
      //           from,
      //           `error adding pending ICE candidate from ${from} (type: ${candidateType}): ${JSON.stringify(
      //             reason,
      //             null,
      //             2
      //           )}`,
      //           "error"
      //         );
      //       })
      //       .finally(() => {
      //         pendingICECandidatesRef.current.set(from, []);
      //       });
      //   });
    },
    [
      sendSignal,
      username,
      getOnMessageHandler,
      addLog,
      removeLog,
      onconnectionstatechange,
      onicecandidateerror,
      oniceconnectionstatechange,
      onsignalingstatechange,
      sendIceCandidates,
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
              await handleCreatingConnections(target_user);
            });
            break;
          //   case "failed":
          //     await handleCreatingConnections(msg.username);
          //     break;
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
