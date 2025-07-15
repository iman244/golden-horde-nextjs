import { RTCDataChannelMessageType } from "../_hooks/useRTCDataChannel";

function getMessageDisplayMeta(dcMessages: RTCDataChannelMessageType[]) {
  return dcMessages.map((me, index, array) => {
    const messagesSize = array.length;
    // Determine sender id: 'self' for sent, from for received
    const getSender = (msg: RTCDataChannelMessageType) =>
      msg.type === "received" ? msg.from : "self";
    const sender = getSender(me);

    // Previous and next messages
    const prev = index > 0 ? array[index - 1] : undefined;
    const next = index < messagesSize - 1 ? array[index + 1] : undefined;

    // Grouping logic by sender
    const isGroupedWithPrev = prev ? getSender(prev) === sender : false;
    const isFirstInGroup = !isGroupedWithPrev;
    const isGroupedWithNext = next ? getSender(next) === sender : false;
    const isLastInGroup = !isGroupedWithNext;

    // Show from label for the first message in a group from a sender (only for received)
    const showFromLabel = me.type === "received" && isFirstInGroup;

    return {
      message: me,
      showFromLabel,
      isGroupedWithPrev,
      isFirstInGroup,
      isLastInGroup,
    };
  });
}

export default getMessageDisplayMeta;

