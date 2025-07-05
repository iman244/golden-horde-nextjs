import { useEffect, useRef, useState, useCallback } from "react";
import type { SignalingMessage } from "../types";
import type { LogEntry, LogLevel } from "./useLogs";

const django_domain = "192.168.1.101:8000";

export function useSignaling(tentId: number | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const [wsLogs, setWsLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [wsLatency, setWsLatency] = useState<number | null>(null);
  const signalCallbacks = useRef<((msg: SignalingMessage) => void)[]>([]);

  const addWsLog = (message: string, level: LogLevel = "info") =>
    setWsLogs((logs) => [...logs, { message, level, timestamp: Date.now() }]);

  // Send a signaling message
  const sendSignal = useCallback((msg: SignalingMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
      addWsLog(`[WS] Sent: ${JSON.stringify(msg)}`);
    } else {
      addWsLog(
        `[WS] Tried to send but WebSocket not open: ${JSON.stringify(msg)}`,
        "warning"
      );
    }
  }, []);

  // Register a callback for incoming signaling messages
  const onSignal = useCallback((cb: (msg: SignalingMessage) => void) => {
    signalCallbacks.current.push(cb);
    return () => {
      signalCallbacks.current = signalCallbacks.current.filter(
        (fn) => fn !== cb
      );
    };
  }, []);

  useEffect(() => {
    // Close existing connection if any
    if (wsRef.current) {
      addWsLog("[WS] Closing existing connection");
      wsRef.current.close();
      wsRef.current = null;
      setIsOpen(false);
    }

    // Don't connect if no tentId is provided
    if (!tentId) {
      addWsLog("[WS] No tentId provided, not connecting");
      return;
    }

    // Generate WebSocket URL from tentId
    const wsUrl = `wss://${django_domain}/ws/voice_chat/${tentId}/`;
    addWsLog(`[WS] Connecting to tent ${tentId}: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    let pingInterval: NodeJS.Timeout | null = null;
    let lastPingTimestamp: number | null = null;

    ws.onopen = () => {
      setIsOpen(true);
      addWsLog("[WS] Connection opened");
      addWsLog(`[WS] URL: ${ws.url}`);
      addWsLog(`[WS] Protocol: ${ws.protocol}`);
      addWsLog(`[WS] ReadyState: ${ws.readyState}`);
      // Start ping interval
      pingInterval = setInterval(() => {
        lastPingTimestamp = Date.now();
        ws.send(JSON.stringify({ type: "ping", ts: lastPingTimestamp }));
      }, 5000);
    };

    ws.onclose = (event) => {
      setIsOpen(false);
      addWsLog(
        `[WS] Connection closed (code: ${event.code}, reason: ${event.reason})`,
        "warning"
      );
      if (pingInterval) clearInterval(pingInterval);
    };

    ws.onerror = (event) => {
      addWsLog(
        `[WS] Error event. readyState: ${ws.readyState}, url: ${ws.url}`,
        "error"
      );
      addWsLog(JSON.stringify(event, null, 4), "error");
    };

    ws.onmessage = (event) => {
      try {
        const msg: SignalingMessage = JSON.parse(event.data);
        if (msg.type === "pong" && msg.ts && lastPingTimestamp) {
          setWsLatency(Date.now() - msg.ts);
        }
        if (msg.type !== "pong") {
            console.log("msg", msg)
          addWsLog(`[WS] Received: ${event.data}`);
        }
        signalCallbacks.current.forEach((cb) => cb(msg));
      } catch (error) {
        const errorDetails =
          error instanceof Error ? error.message : String(error);
        addWsLog(
          `[WS] Failed to parse signaling message: ${errorDetails}`,
          "error"
        );
        addWsLog(`[WS] Raw message data: ${event.data}`, "error");
      }
    };

    return () => {
      if (wsRef.current) {
        addWsLog("[WS] Cleanup: Closing WebSocket connection");
        wsRef.current.close();
        wsRef.current = null;
      }
      if (pingInterval) clearInterval(pingInterval);
      // Clear all signal callbacks to prevent leaks
      signalCallbacks.current = [];
    };
  }, [tentId]);

  return { wsLogs, sendSignal, onSignal, isOpen, wsLatency };
}
