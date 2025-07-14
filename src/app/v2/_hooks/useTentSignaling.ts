import { useAuth } from "@/app/context/AuthContext";
import { useSignaling } from "@/app/hooks/useSignaling";
import { useCallback } from "react";
import { getWebSocketStatus, WebSocketStatusType } from "../_utils";
import { TentSignalingMessages } from "../_types";

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

  const { onSignal, sendSignal, wsLatency, wsReadyState, closeWebSocket, logs: wsLogs } =
    useSignaling<TentSignalingMessages>({
      channelId: currentTentId,
      getUrl: getVoiceChatUrl,
    });

  const status = useCallback((tentId: string | number): WebSocketStatusType => {
    if (currentTentId !== tentId) {
      return "N/A";
    }
    return getWebSocketStatus(wsReadyState);
  }, [currentTentId, wsReadyState]);

  return {
    wsLatency,
    status,
    closeWebSocket,
    wsLogs,
    onSignal,
    sendSignal
  };
};
