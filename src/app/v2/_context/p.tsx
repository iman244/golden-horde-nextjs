"use client";
import { LogEntry, useLogs } from "@/app/hooks/useLogs";
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

interface TentRTCContextType {
  currentTentId: string | number | null;
  joinTent: (tent_id: string | number) => Promise<void>;
  leaveTent: () => Promise<void>;
  logs: LogEntry[];
  wsLogs: LogEntry[];
  wsLatency: number | null;
  status: (tentId: string | number) => WebSocketStatusType;
}

const TentRTCContext = createContext<TentRTCContextType | undefined>(undefined);

const TentRTCProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { username } = useAuth();
  const { logs, addLog, clearLogs } = useLogs();
  const [currentTentId, setCurrentTentId] = useState<string | number | null>(
    null
  );

  const [connections, setConnections] = useState<
    Map<
      string,
      {
        pc: RTCPeerConnection;
        dc?: RTCDataChannel;
      }
    >
  >(new Map());
  const connectionsRef = useRef<
    Map<
      string,
      {
        pc: RTCPeerConnection;
        dc?: RTCDataChannel;
      }
    >
  >(new Map());

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
    closeWebSocket();
    setCurrentTentId(null);
  }, [currentTentId, closeWebSocket]);

  const joinTent = useCallback(
    async (tentId: string | number) => {
      if (currentTentId === tentId) {
        addLog(`Already connected to tent ${tentId}`);
        return;
      }
      clearLogs();

      // Leave current tent if connected
      if (currentTentId !== null) {
        await leaveTent();
      }

      addLog(`Joining tent ${tentId}...`);

      // Unsubscribe previous if any
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      unsubscribeRef.current = onSignal((msg: TentSignalingMessages) => {
        switch (msg.type) {
          case "connect_info":
            msg.other_users.forEach(async (target_user) => {
              const pc = createPeerConnection();
              pc.onicecandidate = (ev) => {
                console.log("pc.onicecandidate", ev);
                if (
                  ev.candidate?.candidate != null &&
                  ev.candidate.candidate !== ""
                ) {
                  sendSignal({
                    type: "ice-candidate",
                    username: username!,
                    target_user,
                    candidate: ev.candidate?.candidate,
                    sdpMid: ev.candidate.sdpMid!,
                    sdpMLineIndex: ev.candidate.sdpMLineIndex!,
                  });
                }
              };
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              const dc = pc.createDataChannel(`${username!}_` + "target_user");
              //   setConnections((pre) => {
              //     const newMap = new Map(pre);
              //     newMap.set(target_user, { pc, dc });
              //     return newMap;
              //   });
              connectionsRef.current.set(target_user, { pc, dc });
              setConnections(new Map(connectionsRef.current))
              sendSignal({
                type: "offer",
                sdp: offer.sdp!,
                username: username!,
                target_user,
              });
            });
            break;
          case "offer":
            (async () => {
              const pc = createPeerConnection();
              await pc.setRemoteDescription({
                type: msg.type,
                sdp: msg.sdp,
              });
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              //   setConnections((prev) => {
              //     const newMap = new Map(prev);
              //     newMap.set(msg.username, { pc });
              //     return newMap;
              //   });
              connectionsRef.current.set(msg.username, { pc });
              pc.ondatachannel = (event: RTCDataChannelEvent) => {
                const dc = event.channel;
                // setConnections((prev) => {
                //   const newMap = new Map(prev);
                //   newMap.set(msg.username, { pc, dc });
                //   return newMap;
                // });
                connectionsRef.current.set(msg.username, { pc, dc });
              };
              sendSignal({
                type: "answer",
                sdp: answer.sdp!,
                username: username!,
                target_user: msg.username,
              });
            })();
            break;
          case "answer":
            (async () => {
              const pc = connectionsRef.current.get(msg.username)?.pc;
              if (!pc) return;
              await pc.setRemoteDescription({
                type: "answer",
                sdp: msg.sdp!,
              });
            })();
            break;
          case "ice-candidate":
            // handleIceCandidateMsg(msg);
            console.log("ice-candidate is not handling yet", msg);
            break;
          case "user_joined":
          case "user_left":
            // handleUserJoinLeave(msg);
            console.log("user_joined, user_left is not handling yet", msg);
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
      clearLogs,
      leaveTent,
      currentTentId,
      onSignal,
      sendSignal,
      username,
      connectionsRef,
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
        logs,
        wsLogs,
        joinTent,
        leaveTent,
        wsLatency,
        status,
        currentTentId,
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
