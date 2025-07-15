"use client";
import { LogEntry, useLogs } from "@/app/hooks/useLogs";
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
type connectionsType = Map<
  string,
  {
    pc: RTCPeerConnection;
    dc?: RTCDataChannel;
  }
>;

type dcMessagesType = (
  | (MessageEvent & { commType: "comming" })
  | { data: string; commType: "sending"; timeStamp: number }
)[];

interface TentRTCContextType {
  connections: connectionsType;
  currentTentId: string | number | null;
  joinTent: (tent_id: string | number) => Promise<void>;
  leaveTent: () => Promise<void>;
  logs: LogEntry[];
  wsLogs: LogEntry[];
  wsLatency: number | null;
  status: (tentId: string | number) => WebSocketStatusType;
  dcMessages: dcMessagesType;
  senddcMessage: (message: string) => void;
}

const TentRTCContext = createContext<TentRTCContextType | undefined>(undefined);

const TentRTCProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { username } = useAuth();
  const { logs, addLog, clearLogs } = useLogs();
  const [currentTentId, setCurrentTentId] = useState<string | number | null>(
    null
  );

  const connectionsRef = useRef<connectionsType>(new Map());
  const [connections, setConnections] = useState<connectionsType>(new Map());
  const [dcMessages, setDcMessages] = useState<dcMessagesType>([]);

  useEffect(() => {
    console.log("dcMessages", dcMessages);
  }, [dcMessages]);

  const dconmessage = useCallback(
    (ev: MessageEvent<any>) => {
      console.log("ev", ev);
      setDcMessages((pre) => [...pre, { ...ev, commType: "comming" }]);
    },
    [setDcMessages]
  );
  const senddcMessage = useCallback(
    (message: string) => {
      setDcMessages((pre) => [
        ...pre,
        {
          data: message,
          commType: "sending",
          timeStamp: 0,
        },
      ]);
      connectionsRef.current.forEach(({ dc }) => {
        if (dc) {
          dc.send(message);
        }
      });
    },
    [setDcMessages]
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
    connections.forEach((v) => {
      v.pc.close();
    });
    connections.clear();
    setDcMessages([]);
    closeWebSocket();
    setCurrentTentId(null);
  }, [currentTentId, closeWebSocket, connections]);

  const handleCreatingConnections = useCallback(
    async (target_user: string) => {
      const pc = createPeerConnection();
      pc.onicecandidate = (ev) => {
        console.log("pc.onicecandidate", ev);
        if (ev.candidate?.candidate != null && ev.candidate.candidate !== "") {
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
      const dc = pc.createDataChannel(`${username!}_` + target_user);
      dc.onmessage = dconmessage;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      connectionsRef.current.set(target_user, { pc, dc });
      setConnections((pre) => {
        const newMap = new Map(pre);
        newMap.set(target_user, { pc, dc });
        return newMap;
      });
      sendSignal({
        type: "offer",
        sdp: offer.sdp!,
        username: username!,
        target_user,
      });
    },
    [sendSignal, username]
  );

  const handleOffer = useCallback(
    async ({
      from,
      offer,
    }: {
      from: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      const pc = createPeerConnection();
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
        dc.onmessage = dconmessage;
        connectionsRef.current.set(from, { pc, dc });
        setConnections((prev) => {
          const newMap = new Map(prev);
          newMap.set(from, { pc, dc });
          return newMap;
        });
      };
      sendSignal({
        type: "answer",
        sdp: answer.sdp!,
        username: username!,
        target_user: from,
      });
    },
    [sendSignal, username, dconmessage]
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
      console.log(
        "handleAnswer connectionsRef.current",
        connectionsRef.current
      );
      console.log("handleAnswer pc", pc);
      console.log("handleAnswer from", from);
      console.log("handleAnswer answer", answer);
      if (pc == undefined) return;
      console.log("handleAnswer setRemote must had been done");
      await pc.setRemoteDescription(answer);
    },
    []
  );

  const handleUserLeave = useCallback(
    async ({ username }: { username: string }) => {
      connectionsRef.current.get(username)?.pc.close();
      connectionsRef.current.delete(username);
      setConnections(new Map(connectionsRef.current));
    },
    []
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
      if (!pc) return;
      await pc.addIceCandidate(iceCandidate);
    },
    []
  );

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
      unsubscribeRef.current = onSignal(async (msg: TentSignalingMessages) => {
        switch (msg.type) {
          case "connect_info":
            msg.other_users.forEach(async (target_user) => {
              await handleCreatingConnections(target_user);
            });
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
            (async () => await handleUserLeave(msg))();
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
        logs,
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
