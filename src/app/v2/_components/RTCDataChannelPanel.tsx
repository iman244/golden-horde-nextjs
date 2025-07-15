import React, { useCallback, useState } from "react";
import { useTentRTCContext } from "../_context/TentRTCContext";
import { BiSend } from "react-icons/bi";
import ConnectionsList from "./ConnectionsList";
import MessageList from "./Message/MessageList";

const RTCDataChannelPanel = () => {
  const { senddcMessage } = useTentRTCContext();
  const [m, setM] = useState("");
  const onChangeM = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setM(event.target.value);
    },
    [setM]
  );
  const sendMessage = useCallback(() => {
    senddcMessage(m);
    setM("");
  }, [senddcMessage, m]);

  return (
    <div className="p-3 flex flex-col h-[60vh] max-w-xl mx-auto bg-[#181a20]/90">
      <div className="v2-card-title">RTC Data Channel</div>
      {/* Replace the old connections UI with the new component */}
      <ConnectionsList />

      <MessageList />

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
