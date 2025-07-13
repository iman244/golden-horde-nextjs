import { useAuth } from "@/app/context/AuthContext";
import { useSignaling } from "@/app/hooks/useSignaling";
import { VoiceChatSignalingMessage } from "@/app/types";
import { useCallback } from "react";
import { getWebSocketStatus, WebSocketStatusType } from "../_utils";

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

  const { wsLatency, wsReadyState, closeWebSocket, logs: wsLogs } =
    useSignaling<VoiceChatSignalingMessage>({
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
  };
};
