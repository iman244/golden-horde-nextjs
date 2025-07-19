import { useAuth } from "@/app/context/AuthContext";
import { useSignaling } from "@/app/hooks/useSignaling";
import { useCallback } from "react";
// import { getWebSocketStatus, WebSocketStatusType } from "../_utils";
import { TentSignalingMessages } from "../_types";
import { getWebSocketStatus } from "../_utils";
// type currentTentIdType = string | number | null
export const useTentSignaling = (currentTentId: string | number | null) => {
  const { token } = useAuth();

  const getVoiceChatUrl = useCallback(
    (id: string | number) => {
      if (!token) return "";
      return `wss://${
        process.env.NEXT_PUBLIC_DJANGO_ADMIN_DOMAIN
      }/ws/voice_chat/${id}/?token=${encodeURIComponent(token)}`;
    },
    [token]
  );

  const {
    onSignal,
    sendSignal,
    wsLatency,
    wsReadyState,
    closeWebSocket,
    logs: wsLogs,
  } = useSignaling<TentSignalingMessages>({
    channelId: currentTentId,
    getUrl: getVoiceChatUrl,
    autoReconnect: true,
    reconnectDelay: 2000,
  });

  const wsStatus = getWebSocketStatus(wsReadyState);

  return {
    wsLatency,
    wsStatus,
    closeWebSocket,
    wsLogs,
    onSignal,
    sendSignal,
  };
};
