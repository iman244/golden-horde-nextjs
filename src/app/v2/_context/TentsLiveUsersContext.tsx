"use client";
import { useAuth } from "@/app/context/AuthContext";
import { useSignaling } from "@/app/hooks/useSignaling";
import { TentEventMessage } from "@/app/types";
import React, {
  createContext,
  FC,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface TentsLiveUsersContextType {
  getParticipantsByTentId: (tentId: string | number) => string[];
  wsLatency: number | null;
  isOpen: boolean;
}

const TentsLiveUsersContext = createContext<
  TentsLiveUsersContextType | undefined
>(undefined);

// Type guard for messages with tent_id
function hasTentId(
  msg: TentEventMessage
): msg is Extract<TentEventMessage, { tent_id: string }> {
  return "tent_id" in msg && typeof msg.tent_id === "string";
}

// Helper to add a user to a tent
function addUserToTent(
  prev: { [tentId: string]: string[] },
  tentId: string,
  username: string
) {
  const users = prev[tentId] || [];
  if (!users.includes(username)) {
    return { ...prev, [tentId]: [...users, username] };
  }
  return prev;
}

// Helper to remove a user from a tent
function removeUserFromTent(
  prev: { [tentId: string]: string[] },
  tentId: string,
  username: string
) {
  const users = prev[tentId] || [];
  if (users.includes(username)) {
    return {
      ...prev,
      [tentId]: users.filter((u) => u !== username),
    };
  }
  return prev;
}

const TentsLiveUsersProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { token } = useAuth();
  // Tracks users in each tent by tentId
  const [participantsByTent, setParticipantsByTent] = useState<{
    [tentId: string]: string[];
  }>({});

  // Compose websocket URL if token is available
  const wsUrl = token
    ? `wss://${
        process.env.NEXT_PUBLIC_DJANGO_ADMIN_DOMAIN
      }/ws/tent-events/?token=${encodeURIComponent(token)}`
    : "";

  // Custom signaling hook for websocket events
  const { onSignal, wsLatency, wsReadyState } = useSignaling<TentEventMessage>({
    url: wsUrl,
  });

  useEffect(() => {
    // Handles incoming tent event messages
    const handleTentEvent = (msg: TentEventMessage) => {
      switch (msg.type) {
        case "pong":
          return;
        case "current_tent_users":
          setParticipantsByTent(msg.tents);
          break;
        case "user_joined":
        case "user_left":
          if (hasTentId(msg)) {
            setParticipantsByTent((prev) => {
              if (msg.type === "user_joined") {
                return addUserToTent(prev, msg.tent_id, msg.username);
              } else if (msg.type === "user_left") {
                return removeUserFromTent(prev, msg.tent_id, msg.username);
              }
              return prev;
            });
          }
          break;
        default:
          break;
      }
    };
    const unsubscribe = onSignal(handleTentEvent);
    return () => {
      unsubscribe();
      setParticipantsByTent({});
    };
  }, [onSignal]);

  // Expose participantsByTent, wsLatency, isOpen, and getParticipantsByTentId in context
  const getParticipantsByTentId = (tentId: string | number) =>
    participantsByTent[tentId] || [];

  return (
    <TentsLiveUsersContext.Provider
      value={{ getParticipantsByTentId, wsLatency, isOpen: wsReadyState == 1 }}
    >
      {children}
    </TentsLiveUsersContext.Provider>
  );
};

export default TentsLiveUsersProvider;

export const useTentsLiveUsers = () => {
  const context = useContext(TentsLiveUsersContext);
  if (!context) {
    throw new Error(
      "useTentsLiveUsers must be used within a TentsLiveUsersProvider"
    );
  }
  return context;
};
