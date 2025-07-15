import React, { useCallback, useState } from "react";
import { useTentRTCContext } from "../_context/TentRTCContext";
import { useAuth } from "@/app/context/AuthContext";

const RTCPeerConnectionPanel = () => {
  const { username } = useAuth();
  const { dcMessages, senddcMessage, connections } = useTentRTCContext();
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
    <div className="flex flex-col h-[60vh]">
      <div>
        {Array.from(connections).length == 0 && (
          <div className="text-white">no connection</div>
        )}
        {Array.from(connections).map(([user, { pc }]) => (
          <div key={user} className="text-white">
            <p>user: {user}</p>
            <p>pc.connectionState: {pc.connectionState}</p>
            <p>pc.signalingState: {pc.signalingState}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 flex-1 bg-gray-600 text-white">
        {dcMessages.map((me, index) => (
          <div key={index}>
            <div>
              {me.commType == "comming"
                ? me.origin
                : username![0].toUpperCase()}
            </div>
            <div>{JSON.stringify(me.data, null, 2)}</div>
            <div>{me.timeStamp}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 h-[50px] p-2 bg-gray-800">
        <input
          name="new-message"
          placeholder="type new message ..."
          className="flex-1 border border-yellow-800 text-white"
          value={m}
          onChange={onChangeM}
        />
        <button onClick={sendMessage} className="text-white">
          send
        </button>
      </div>
    </div>
  );
};

export default RTCPeerConnectionPanel;
