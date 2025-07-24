import { LogEntry, LogLevel } from "@/app/types";
import { useState, useCallback, useMemo } from "react";

export type LogsMap = Map<string, LogEntry[]>;
export type addLogType =  (key: string, message: string, level?: LogLevel) => void

export function useKeyedLogs() {
  const [logsMap, setLogsMap] = useState<LogsMap>(new Map());

  const addLog: addLogType = useCallback((key: string, message: string, level: LogLevel = "info") => {
    setLogsMap((prev) => {
      const newMap = new Map(prev);
      const prevLogs = newMap.get(key) || [];
      newMap.set(key, [...prevLogs, { message, level, timestamp: Date.now() }]);
      return newMap;
    });
  }, []);


  const removeLog = useCallback((key: string) => {
    setLogsMap((prev) => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  }, []);

  const clearLogs = useCallback(() => setLogsMap(new Map()), []);

  const logsArray = useMemo(() => Array.from(logsMap.values()).flat(), [logsMap]);

  return { logsMap, logsArray, addLog, removeLog, clearLogs };
} 