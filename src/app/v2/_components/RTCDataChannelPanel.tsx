import React, { useCallback, useState, useRef } from "react";
import { useTentRTCContext } from "../_context/TentRTCContext";
import { BiSend } from "react-icons/bi";
import ConnectionsList from "./ConnectionsList";
import MessageList from "./Message/MessageList";

const RTCDataChannelPanel = () => {
  const { senddcMessage } = useTentRTCContext();
  const [m, setM] = useState("");
  const messageListRef = useRef<HTMLDivElement>(null);
  const onChangeM = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setM(event.target.value);
    },
    [setM]
  );
  const sendMessage = useCallback(() => {
    if (m.length > 0) {
      senddcMessage(m);
      setM("");
      // Scroll to bottom after sending
      if (messageListRef.current) {
        console.log("messageListRef.current.scrollHeight", messageListRef.current.scrollHeight)
        messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
      }
    }
  }, [senddcMessage, m]);

  return (
    <div className="flex flex-col flex-1 bg-[#181a20]/90">
      <div className="v2-card-title p-3">RTC Data Channel</div>
      {/* Replace the old connections UI with the new component */}
      <ConnectionsList />

      <MessageList containerRef={messageListRef} />

      <form
        className="flex gap-2 h-[50px] p-2 bg-black/30 rounded-b-md border-t border-white/10"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
      >
        <input
          name="new-message"
          placeholder="Type new message ..."
          className="flex-1 auth-input bg-black/60 border border-yellow-800 text-white"
          value={m}
          autoComplete="off"
          onChange={onChangeM}
        />
        <button type="submit" className="px-2 text-white">
          <BiSend size={20} />
        </button>
      </form>
    </div>
  );
};

export default RTCDataChannelPanel;
