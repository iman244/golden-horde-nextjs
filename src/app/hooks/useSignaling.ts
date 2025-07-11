import { useEffect, useRef, useState, useCallback } from "react";
import type { LogEntry, LogLevel } from "./useLogs";

// Generic options for useSignaling
interface UseSignalingOptions {
  url?: string;
  channelId?: string | number | null;
  getUrl?: (channelId: string | number) => string;
}

type MessageWithType = { type: string };
type MessageWithTypeAndTs = { type: string; ts: number };
export function useSignaling<T extends MessageWithType>(options: UseSignalingOptions) {
  const { url, channelId, getUrl } = options;
  const wsRef = useRef<WebSocket | null>(null);
  const [wsLogs, setWsLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [wsLatency, setWsLatency] = useState<number | null>(null);
  const signalCallbacks = useRef<((msg: T) => void)[]>([]);
  const authRejectedCallbacks = useRef<(() => void)[]>([]);

  const addWsLog = useCallback((message: string, level: LogLevel = "info") =>
    setWsLogs((logs) => [...logs, { message, level, timestamp: Date.now() }]),
  []);

  // Send a signaling message
  const sendSignal = useCallback((msg: T) => {
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
  }, [addWsLog]);

  // Register a callback for incoming signaling messages
  const onSignal = useCallback((cb: (msg: T) => void) => {
    signalCallbacks.current.push(cb);
    return () => {
      signalCallbacks.current = signalCallbacks.current.filter(
        (fn) => fn !== cb
      );
    };
  }, []);

  /**
   * Register a callback for authentication/token rejection (code 4001 or reason 'auth_failed').
   * Returns an unsubscribe function.
   */
  const onAuthRejected = useCallback((cb: () => void) => {
    authRejectedCallbacks.current.push(cb);
    return () => {
      authRejectedCallbacks.current = authRejectedCallbacks.current.filter((fn) => fn !== cb);
    };
  }, []);

  function isMessageWithTypeAndTs(msg: unknown): msg is MessageWithTypeAndTs {
    return (
      typeof msg === "object" &&
      msg !== null &&
      "type" in msg &&
      "ts" in msg &&
      typeof (msg as MessageWithTypeAndTs).ts === "number"
    );
  }

  function isMessageWithType(msg: unknown): msg is MessageWithType {
    return (
      typeof msg === "object" &&
      msg !== null &&
      "type" in msg
    );
  }

  useEffect(() => {
    // Close existing connection if any
    if (wsRef.current) {
      addWsLog("[WS] Closing existing connection");
      wsRef.current.close();
      wsRef.current = null;
      setIsOpen(false);
    }

    // Determine the WebSocket URL
    let wsUrl: string | null = null;
    if (url) {
      wsUrl = url;
    } else if (getUrl && channelId !== undefined && channelId !== null) {
      wsUrl = getUrl(channelId);
    }

    if (!wsUrl) {
      addWsLog("[WS] No valid WebSocket URL provided, not connecting");
      return;
    }

    addWsLog(`[WS] Connecting: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    let pingInterval: ReturnType<typeof setInterval> | null = null;
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
      // Handle authentication/token rejection (code 4001 or reason 'auth_failed')
      // See RFC 6455: https://datatracker.ietf.org/doc/html/rfc6455#section-7.4.2
      console.log("event onclose", event)
      authRejectedCallbacks.current.forEach((cb) => cb());
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
        const msg: T = JSON.parse(event.data);
        if (isMessageWithTypeAndTs(msg) && msg.type === "pong" && lastPingTimestamp) {
          setWsLatency(Date.now() - msg.ts);
        }
        if (isMessageWithType(msg) && msg.type !== "pong") {
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
      // Do not clear all signal callbacks globally here; each component should unsubscribe its own callback.
    };
  }, [url, channelId, addWsLog, getUrl]);
//   url, channelId, getUrl, addWsLog

  return { wsLogs, sendSignal, onSignal, isOpen, wsLatency, onAuthRejected };
}
