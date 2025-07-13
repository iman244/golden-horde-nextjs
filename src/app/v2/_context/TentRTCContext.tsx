"use client";
import { LogEntry, useLogs } from "@/app/hooks/useLogs";
import React, {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { useTentSignaling } from "../_hooks/useTentSignaling";
import { WebSocketStatusType } from "../_utils";

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
  const { logs, addLog, clearLogs } = useLogs();
  const [currentTentId, setCurrentTentId] = useState<string | number | null>(
    null
  );

  const { wsLatency, status, closeWebSocket, wsLogs } =
    useTentSignaling(currentTentId);

  const leaveTent = useCallback(async () => {
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

      setCurrentTentId(tentId);
    },
    [addLog, clearLogs, leaveTent, currentTentId]
  );

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
