import { useState, useEffect } from "react";
import { useSignaling } from "./useSignaling";
import type { TentEventMessage } from "../types";

export function useTentEvents({ token, onAuthRejected }: { token: string | null; onAuthRejected?: () => void }) {
  const [tentUsersByTent, setTentUsersByTent] = useState<{
    [tentId: string]: string[];
  }>({});
  const wsUrl = token
    ? `wss://${
        process.env.NEXT_PUBLIC_DJANGO_ADMIN_DOMAIN
      }/ws/tent-events/?token=${encodeURIComponent(token)}`
    : "";
  const {
    onSignal: onTentEventSignal,
    wsLatency: onTentEventWsLatency,
    wsReadyState,
    onAuthRejected: onTentEventAuthRejected,
  } = useSignaling<TentEventMessage>({
    url: wsUrl,
  });

  function hasTentId(
    msg: TentEventMessage
  ): msg is Extract<TentEventMessage, { tent_id: string }> {
    return "tent_id" in msg && typeof msg.tent_id === "string";
  }

  useEffect(() => {
    const handleTentEvent = (msg: TentEventMessage) => {
      if (msg.type == "pong") {
        return;
      }
      if (msg.type == "current_tent_users") {
        setTentUsersByTent(msg.tents);
      }
      if (hasTentId(msg)) {
        setTentUsersByTent((prev) => {
          const users = prev[msg.tent_id] || [];
          if (msg.type === "user_joined") {
            if (!users.includes(msg.username)) {
              return { ...prev, [msg.tent_id]: [...users, msg.username] };
            }
          } else if (msg.type === "user_left") {
            if (users.includes(msg.username)) {
              return {
                ...prev,
                [msg.tent_id]: users.filter((u) => u !== msg.username),
              };
            }
          }
          return prev;
        });
      }
    };
    const unsubscribe = onTentEventSignal(handleTentEvent);
    return () => {
      unsubscribe();
      setTentUsersByTent({});
    };
  }, [onTentEventSignal]);

  useEffect(() => {
    if (!onAuthRejected) return;
    const unsubscribeAuth = onTentEventAuthRejected(() => {
      onAuthRejected();
    });
    return unsubscribeAuth;
  }, [onTentEventAuthRejected, onAuthRejected]);

  return {
    tentUsersByTent,
    onTentEventWsLatency,
    onTentEventIsOpen: wsReadyState == 1,
  };
}
