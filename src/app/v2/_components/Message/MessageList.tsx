import React, { useMemo } from "react";
import {
  RTCDataChannelMessageType,
  RTCDataChannelReceivedMessage,
} from "../../_hooks/useRTCDataChannel";
import { useAuth } from "@/app/context/AuthContext";
import { useTentRTCContext } from "../../_context/TentRTCContext";

// Helper function to compute display metadata for each message
function getMessageDisplayMeta(dcMessages: RTCDataChannelMessageType[]) {
  return dcMessages.map((me, index) => {
    const isReceived = me.type === "received";
    let showFromLabel = false;
    let isGroupedWithPrev = false;
    let isFirstInGroup = false;
    let isLastInGroup = false;
    if (isReceived) {
      const prev = dcMessages[index - 1];
      const next = dcMessages[index + 1];
      const from = (me as RTCDataChannelReceivedMessage).from;
      showFromLabel =
        !prev ||
        prev.type !== "received" ||
        (prev as RTCDataChannelReceivedMessage).from !== from;
      isGroupedWithPrev =
        !!prev &&
        prev.type === "received" &&
        (prev as RTCDataChannelReceivedMessage).from === from;
      isFirstInGroup = showFromLabel && index > 0;
      isLastInGroup = !next || next.type !== "received" || (next as RTCDataChannelReceivedMessage).from !== from;
    } else {
      // Sent message grouping logic
      const prev = dcMessages[index - 1];
      const next = dcMessages[index + 1];
      isGroupedWithPrev = !!prev && prev.type === "sent";
      showFromLabel = !prev || prev.type !== "sent";
      isFirstInGroup = showFromLabel && index > 0;
      isLastInGroup = !next || next.type !== "sent";
    }
    return { message: me, showFromLabel, isGroupedWithPrev, isFirstInGroup, isLastInGroup };
  });
}

// Color palette for sender labels
const senderColors = [
  'text-red-400',
  'text-blue-400',
  'text-green-400',
  'text-yellow-400',
  'text-purple-400',
  'text-pink-400',
  'text-indigo-400',
  'text-teal-400',
  'text-orange-400',
  'text-cyan-400',
];

// Hash function to map sender name to a color index
function getSenderColorClass(sender: string) {
  let hash = 0;
  for (let i = 0; i < sender.length; i++) {
    hash = sender.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % senderColors.length;
  return senderColors[idx];
}

const MessageList = () => {
  const { dcMessages } = useTentRTCContext();
  const messageMeta = useMemo(() => getMessageDisplayMeta(dcMessages), [dcMessages]);
  return (
    <div className="flex flex-col flex-1 v2-content rounded-md p-2! overflow-y-auto">
      {dcMessages.length === 0 && (
        <div className="text-gray-400 text-center">No messages yet</div>
      )}
      {messageMeta.map((meta, index) => (
        <MessageItem
          key={index}
          message={meta.message}
          showFromLabel={meta.showFromLabel}
          isGroupedWithPrev={meta.isGroupedWithPrev}
          isFirstInGroup={meta.isFirstInGroup}
          isLastInGroup={meta.isLastInGroup}
        />
      ))}
    </div>
  );
};

export default MessageList;

interface MessageItemProps {
  message: RTCDataChannelMessageType;
  showFromLabel?: boolean;
  isGroupedWithPrev?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, showFromLabel = true, isGroupedWithPrev = false, isFirstInGroup = false, isLastInGroup = false }) => {
  const { username } = useAuth();
  const isReceived = message.type === "received";
  const displayName = isReceived
    ? (message as RTCDataChannelReceivedMessage).from[0].toUpperCase()
    : username![0].toUpperCase();
  const date = new Date(message.timeStamp);
  const hour = date.getHours();
  const minute = date.getMinutes().toString().padStart(2, '0');
  const time = `${hour}:${minute}`;

  // Determine margin class
  const marginClass = isGroupedWithPrev || isFirstInGroup ? 'mb-0.5' : 'mb-2';


  if (isReceived) {
    const from = (message as RTCDataChannelReceivedMessage).from;
    const fromColor = getSenderColorClass(from);
    return (
      <div className={`flex items-end gap-2 ${marginClass}`}>
        <div className="flex-shrink-0 w-8 h-8">
          {isLastInGroup ? (
            <div className="w-8 h-8 rounded-full border border-white/10 bg-white/10 flex items-center justify-center text-yellow-200 font-bold text-lg">
              {displayName}
            </div>
          ) : null}
        </div>
        <div className={`relative bg-white/10 text-white rounded-md px-3 py-2 min-h-[48px] pb-5 flex flex-col max-w-[70vw] sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg 2xl:max-w-xl`}>
          {showFromLabel && <div className={`text-sm mb-1 ${fromColor}`}>{from}</div>}
          <div className="whitespace-pre-line break-words text-base pr-10">
            {message.data}
          </div>
          <div className="absolute bottom-1 right-2 text-xs text-gray-400 min-w-[40px] text-right">
            {time}
          </div>
        </div>
      </div>
    );
  }

  // Sent message
  return (
    <div className={`flex justify-end ${marginClass}`}>
      <div className={`relative bg-yellow-400/10 text-white rounded-md px-3 py-2 text-right ml-auto min-h-[48px] pb-5 flex flex-col max-w-[80vw] sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg 2xl:max-w-xl`}>
        <div className="whitespace-pre-line break-words text-base pr-10">
          {message.data}
        </div>
        <div className="absolute bottom-1 right-2 text-xs text-yellow-400/70 min-w-[40px] text-right">
          {time}
        </div>
      </div>
    </div>
  );
};
