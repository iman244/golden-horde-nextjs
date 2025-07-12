import { useState, useCallback } from "react";

export type LogLevel = "info" | "warning" | "error";

export interface LogEntry {
  message: string;
  level?: LogLevel;
  timestamp?: number;
}

export function useLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((message: string, level: LogLevel = "info") => {
    setLogs((prev) => [...prev, { message, level, timestamp: Date.now() }]);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return { logs, addLog, clearLogs };
}
