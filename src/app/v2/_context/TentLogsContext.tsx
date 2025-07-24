"use client";
import React, {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { LogEntry, LogLevel } from "@/app/types";

export type LogsMap = Map<string, LogEntry[]>;
export type addLogType = (key: string, message: string, level?: LogLevel) => void;

interface TentLogsContextType {
  logsMap: LogsMap;
  addLog: addLogType;
  removeLog: (key: string) => void;
  clearLogs: () => void;
}

const TentLogsContext = createContext<TentLogsContextType | undefined>(undefined);

const TentLogsProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [logsMap, setLogsMap] = useState<LogsMap>(new Map());

  const addLog: addLogType = useCallback(
    (key: string, message: string, level: LogLevel = "info") => {
      setLogsMap((prev) => {
        const newMap = new Map(prev);
        const prevLogs = newMap.get(key) || [];
        newMap.set(key, [
          ...prevLogs,
          { message, level, timestamp: Date.now() },
        ]);
        return newMap;
      });
    },
    []
  );

  const removeLog = useCallback((key: string) => {
    setLogsMap((prev) => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  }, []);

  const clearLogs = useCallback(() => setLogsMap(new Map()), []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      logsMap,
      addLog,
      removeLog,
      clearLogs,
    }),
    [logsMap, addLog, removeLog, clearLogs]
  );

  return (
    <TentLogsContext.Provider value={contextValue}>
      {children}
    </TentLogsContext.Provider>
  );
};

export default TentLogsProvider;

export const useTentLogsContext = () => {
  const context = useContext(TentLogsContext);
  if (!context) {
    throw new Error("useTentLogsContext must be used within a TentLogsProvider");
  }
  return context;
}; 