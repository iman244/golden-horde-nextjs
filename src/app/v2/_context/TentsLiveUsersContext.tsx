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
  useCallback,
  useState,
  useMemo,
} from "react";

interface TentsLiveUsersContextType {
  getParticipantsByTentId: (tentId: string | number) => string[];
  wsLatency: number | null;
  isOpen: boolean;
}

const TentsLiveUsersContext = createContext<
  TentsLiveUsersContextType | undefined
>(undefined);

const TentsLiveUsersProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  // Tracks users in each tent by tentId
  const [participantsByTent, setParticipantsByTent] = useState<{
    [tentId: string]: string[];
  }>({});

  // Compose websocket URL if token is available
  const wsUrl = useMemo(
    () =>
      token
        ? `wss://${
            process.env.NEXT_PUBLIC_DJANGO_ADMIN_DOMAIN
          }/ws/tent-events/?token=${encodeURIComponent(token)}`
        : "",
    [token]
  );

  // Custom signaling hook for websocket events
  const { onSignal, wsLatency, wsReadyState } = useSignaling<TentEventMessage>({
    url: wsUrl,
  });

  // Type guard for messages with tent_id
  const hasTentId = useCallback(
    (
      msg: TentEventMessage
    ): msg is Extract<TentEventMessage, { tent_id: string }> => {
      return "tent_id" in msg && typeof msg.tent_id === "string";
    },
    []
  );

  // Helper to add a user to a tent
  const addUserToTent = useCallback(
    (
      prev: { [tentId: string]: string[] },
      tentId: string,
      username: string
    ) => {
      const users = prev[tentId] || [];
      if (!users.includes(username)) {
        return { ...prev, [tentId]: [...users, username] };
      }
      return prev;
    },
    []
  );

  // Helper to remove a user from a tent
  const removeUserFromTent = useCallback(
    (
      prev: { [tentId: string]: string[] },
      tentId: string,
      username: string
    ) => {
      const users = prev[tentId] || [];
      if (users.includes(username)) {
        return {
          ...prev,
          [tentId]: users.filter((u) => u !== username),
        };
      }
      return prev;
    },
    []
  );

  const handleTentEvent = useCallback(
    (msg: TentEventMessage) => {
      switch (msg.type) {
        case "pong":
          break;
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
    },
    [hasTentId, addUserToTent, removeUserFromTent]
  );

  useEffect(() => {
    const unsubscribe = onSignal(handleTentEvent);
    return () => {
      unsubscribe();
      setParticipantsByTent({});
    };
  }, [onSignal, handleTentEvent]);

  // Expose participantsByTent, wsLatency, isOpen, and getParticipantsByTentId in context
  const getParticipantsByTentId = useCallback(
    (tentId: string | number) => participantsByTent[tentId] || [],
    [participantsByTent]
  );

  // Memoize the context value to prevent unnecessary rerenders
  const contextValue = useMemo(
    () => ({
      getParticipantsByTentId,
      wsLatency,
      isOpen: wsReadyState == 1,
    }),
    [getParticipantsByTentId, wsLatency, wsReadyState]
  );

  return (
    <TentsLiveUsersContext.Provider value={contextValue}>
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
