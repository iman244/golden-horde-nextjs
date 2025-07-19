import { useEffect, useRef, useState, useCallback } from "react";
import { useLogs } from "./useLogs";

// Generic options for useSignaling
interface UseSignalingOptions {
  url?: string;
  channelId?: string | number | null;
  getUrl?: (channelId: string | number) => string;
  /**
   * Optional callback invoked when the WebSocket connection closes.
   * Receives the CloseEvent as its argument.
   */
  onClose?: (event: CloseEvent) => void;
  /**
   * If true, automatically reconnect on close.
   */
  autoReconnect?: boolean;
  /**
   * Delay in ms before attempting to reconnect (default: 1000).
   */
  reconnectDelay?: number;
}

type MessageWithType = { type: string };
type MessageWithTypeAndTs = { type: string; ts: number };
export function useSignaling<T extends MessageWithType>(
  options: UseSignalingOptions
) {
  const { url, channelId, getUrl, onClose, autoReconnect, reconnectDelay } = options;
  const wsRef = useRef<WebSocket | null>(null);
  //   const [wsLogs, setWsLogs] = useState<LogEntry[]>([]);
  const { logs, addLog, clearLogs } = useLogs();
  const [wsLatency, setWsLatency] = useState<number | null>(null);
  const signalCallbacks = useRef<((msg: T) => void)[]>([]);
  const authRejectedCallbacks = useRef<(() => void)[]>([]);
  const [wsReadyState, setWsReadyState] = useState<number | null>(null);
  const [connectionKey, setConnectionKey] = useState(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(()=>{
    console.log("channelId", channelId)
    console.log("connectionKey", connectionKey)
  },[
    channelId, connectionKey
  ])

  // Send a signaling message
  const sendSignal = useCallback(
    (msg: T) => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
        addLog(`WebSocket: Sent message (type: ${msg.type})`);
      } else {
        addLog(
          `WebSocket: Attempted to send message (type: ${msg.type}) but connection is not open`,
          "warning"
        );
      }
    },
    [addLog]
  );

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
      authRejectedCallbacks.current = authRejectedCallbacks.current.filter(
        (fn) => fn !== cb
      );
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
    return typeof msg === "object" && msg !== null && "type" in msg;
  }

  useEffect(() => {
    // Close existing connection if any
    if (wsRef.current) {
      addLog("WebSocket: Closing previous connection");
      wsRef.current.close();
      setWsReadyState(wsRef.current.readyState);
      wsRef.current = null;
    }

    // Determine the WebSocket URL
    let wsUrl: string | null = null;
    if (url) {
      wsUrl = url;
    } else if (getUrl && channelId !== undefined && channelId !== null) {
      wsUrl = getUrl(channelId);
    }

    if (!wsUrl) {
      addLog(
        "WebSocket: No valid signaling server URL provided, not connecting"
      );
      setWsReadyState(null);
      return;
    }
    clearLogs()
    const ws = new WebSocket(wsUrl);
    addLog("WebSocket: Connecting to signaling server");
    wsRef.current = ws;
    setWsReadyState(ws.readyState);

    let pingInterval: ReturnType<typeof setInterval> | null = null;
    let lastPingTimestamp: number | null = null;

    ws.onopen = () => {
      setWsReadyState(ws.readyState);
      addLog("WebSocket: Connection established");
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      function ping() {
        lastPingTimestamp = Date.now();
        ws.send(JSON.stringify({ type: "ping", ts: lastPingTimestamp }));
        // No ping log
      }
      pingInterval = setInterval(() => {
        ping();
      }, 5000);
      ping();
    };

    ws.onclose = (event) => {
      setWsReadyState(ws.readyState);
      if (event.code === 4001 || event.reason === "auth_failed") {
        addLog("WebSocket: Authentication failed", "warning");
      } else {
        addLog(
          `WebSocket: Disconnected (code: ${event.code}, reason: ${
            event.reason || "no reason provided"
          })`,
          "warning"
        );
      }
      authRejectedCallbacks.current.forEach((cb) => cb());
      if (pingInterval) clearInterval(pingInterval);
      clearLogs();
      if (typeof onClose === "function") {
        onClose(event);
      }
      if (autoReconnect) {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          setConnectionKey((k) => k + 1);
          reconnectTimeoutRef.current = null;
        }, reconnectDelay ?? 1000);
      }
    };

    ws.onerror = () => {
      setWsReadyState(ws.readyState);
      addLog("WebSocket: Error occurred", "error");
    };

    ws.onmessage = (event) => {
      try {
        const msg: T = JSON.parse(event.data);
        if (
          isMessageWithTypeAndTs(msg) &&
          msg.type === "pong" &&
          lastPingTimestamp
        ) {
          setWsLatency(Date.now() - msg.ts);
          // No pong log
        }
        if (isMessageWithType(msg) && msg.type !== "pong") {
          addLog(`WebSocket: Received message (type: ${msg.type})`);
        }
        signalCallbacks.current.forEach((cb) => cb(msg));
      } catch (error) {
        const errorDetails =
          error instanceof Error ? error.message : String(error);
        addLog(
          `WebSocket: Failed to parse incoming message: ${errorDetails}`,
          "error"
        );
        addLog(`WebSocket: Raw message data: ${event.data}`, "error");
      }
    };

    return () => {
      if (wsRef.current) {
        addLog("[WS] Cleanup: Closing WebSocket connection");
        wsRef.current.close();
        setWsReadyState(wsRef.current.readyState); // Set to CLOSING (2)
        wsRef.current = null;
      }
      if (pingInterval) clearInterval(pingInterval);
      setWsReadyState(null);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      // Do not clear all signal callbacks globally here; each component should unsubscribe its own callback.
    };
  }, [url, channelId, addLog, getUrl, clearLogs, onClose, autoReconnect, reconnectDelay, connectionKey]);
  
  // Function to close the WebSocket and update ready state
  const closeWebSocket = useCallback(() => {
    if (wsRef.current) {
      addLog("WebSocket: Manual disconnect initiated");
      wsRef.current.close();
      setWsReadyState(wsRef.current.readyState);
      wsRef.current = null;

    }
  }, [addLog]);

  return {
    logs,
    sendSignal,
    onSignal,
    wsLatency,
    onAuthRejected,
    wsReadyState,
    closeWebSocket,
  };
}
