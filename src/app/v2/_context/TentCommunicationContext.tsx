import { useAuth } from "@/app/context/AuthContext";
import { LogEntry, useLogs } from "@/app/hooks/useLogs";
import { useSignaling } from "@/app/hooks/useSignaling";
import { VoiceChatSignalingMessage } from "@/app/types";
import React, {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getWsReadyStateMeaning, getWsReadyStateMeaningReturnType } from "../_utils";

interface TentCommunicationContextType {
  joinTent: (tent_id: string | number) => Promise<void>;
  leaveTent: () => Promise<void>;
  logs: LogEntry[];
  wsLatency: number | null;
  status: (tentId: string | number) => getWsReadyStateMeaningReturnType
}

const TentCommunicationContext = createContext<
  TentCommunicationContextType | undefined
>(undefined);

// function createPeerConnection() {
//   const rtcConfiguration = {
//     iceServers: [
//       {
//         urls: [
//           "turn:194.60.231.201:3478?transport=udp",
//           "turn:194.60.231.201:3478?transport=tcp",
//           "turn:194.60.231.201:5349?transport=udp",
//           "turn:194.60.231.201:5349?transport=tcp",
//         ],
//         username: "iman244",
//         credential: "qwer123456",
//       },
//       {
//         urls: ["stun:194.60.231.201:3478", "stun:194.60.231.201:5349"],
//       },
//     ],
//   };

//   const peerConnection = new RTCPeerConnection(rtcConfiguration);

//   return peerConnection;
// }

const TentCommunicationProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { logs, addLog, clearLogs } = useLogs();
  const { token } = useAuth();
  const [currentTentId, setCurrentTentId] = useState<string | number | null>(
    null
  );

  useEffect(() => {
    clearLogs();
  }, [clearLogs, currentTentId]);

  const getVoiceChatUrl = useCallback(
    (id: string | number) => {
      if (!token) return "";
      return `wss://${
        process.env.NEXT_PUBLIC_DJANGO_ADMIN_DOMAIN
      }/ws/voice_chat/${id}/?token=${encodeURIComponent(token)}`;
    },
    [token]
  );

  const { wsLatency, wsReadyState, closeWebSocket } =
    useSignaling<VoiceChatSignalingMessage>({
      channelId: currentTentId,
      getUrl: getVoiceChatUrl,
    });

  useEffect(() => {}, []);

  const leaveTent = useCallback(async () => {
    if (currentTentId === null) {
      //   addLog("Not connected to any tent");
      return;
    }
    closeWebSocket()
    setCurrentTentId(null);
  }, [currentTentId, closeWebSocket]);

  const joinTent = useCallback(
    async (tentId: string | number) => {
      if (currentTentId === tentId) {
        addLog(`Already connected to tent ${tentId}`);
        return;
      }

      // Leave current tent if connected
      if (currentTentId !== null) {
        await leaveTent();
      }
      setCurrentTentId(tentId);
    },
    [addLog, leaveTent, currentTentId]
  );

  const status = useCallback((tentId: string | number)=> {
    if(currentTentId != tentId) {
        return "N/A" as const
    }
    return getWsReadyStateMeaning(wsReadyState)
  }, [currentTentId, wsReadyState])

  return (
    <TentCommunicationContext.Provider
      value={{ logs, joinTent, leaveTent, wsLatency, status }}
    >
      {children}
    </TentCommunicationContext.Provider>
  );
};

export default TentCommunicationProvider;

export const useTentCommunication = () => {
    const context = useContext(TentCommunicationContext);
    if (!context) {
      throw new Error(
        "useTentCommunication must be used within an TentCommunicationProvider"
      );
    }
    return context;
  };
  