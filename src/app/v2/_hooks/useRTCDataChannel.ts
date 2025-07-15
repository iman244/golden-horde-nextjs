import { useCallback, useState } from "react";

export type RTCDataChannelSentMessage = {
  type: "sent";
  data: string;
  timeStamp: number;
};

export type RTCDataChannelReceivedMessage = {
  type: "received";
  data: string;
  timeStamp: number;
  eventMessage: MessageEvent;
  from: string;
};

export type RTCDataChannelMessageType =
  | RTCDataChannelSentMessage
  | RTCDataChannelReceivedMessage;

export type RTCDataChannelMessagesType = RTCDataChannelMessageType[];

export function useRTCDataChannel() {
  const [dcMessages, setDcMessages] = useState<RTCDataChannelMessagesType>([]);

  // Handler for incoming messages (to assign to dc.onmessage)
  const getOnMessageHandler = useCallback(
    (from: string) => (ev: MessageEvent<any>) => {
      setDcMessages((prev) => [
        ...prev,
        {
          type: "received",
          data: ev.data,
          timeStamp: ev.timeStamp,
          eventMessage: ev,
          from,
        },
      ]);
    },
    []
  );

  // Call this after sending a message
  const registerSentMessage = useCallback((message: string) => {
    setDcMessages((prev) => [
      ...prev,
      {
        type: "sent",
        data: message,
        timeStamp: Date.now(),
      },
    ]);
  }, []);

  // Optionally, a reset function
  const clearMessages = useCallback(() => {
    setDcMessages([]);
  }, []);

  return {
    dcMessages,
    getOnMessageHandler,
    registerSentMessage,
    clearMessages,
  };
} 