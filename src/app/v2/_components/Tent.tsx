import { Tent as TentType } from "@/app/data.types";
import React, { FC, useState } from "react";
import { useTentParticipants } from "../_context/TentParticipantsContext";

const Tent: FC<{ tent: TentType }> = ({ tent }) => {
  const { getParticipantsByTentId } = useTentParticipants();
  const [isConnected, setIsConnected] = useState(false);
  const onTentClick = () => setIsConnected((pre) => !pre);

  return (
    <div
      className={`v2-tent-card${isConnected ? " v2-tent-card-connected" : ""}`}
    >
      <div
        className={`v2-tent-header${
          isConnected ? " v2-tent-header-connected" : ""
        }`}
      >
        <div className="v2-tent-info">
          <span className="v2-tent-emoji">⛺</span>
          <span className="v2-tent-name">{tent.name}</span>
          {isConnected && <span className="v2-tent-status">✓ Connected</span>}
        </div>
        <button
          onClick={() => onTentClick()}
          className={`v2-tent-btn${
            isConnected ? " v2-tent-btn-leave" : " v2-tent-btn-join"
          }`}
          onMouseEnter={(e) => {
            e.currentTarget.classList.add("v2-tent-btn-hover");
          }}
          onMouseLeave={(e) => {
            e.currentTarget.classList.remove("v2-tent-btn-hover");
          }}
        >
          {isConnected ? "Leave" : "Join"}
        </button>
      </div>
      {/* WebSocket RTT */}
      {isConnected && <div className="v2-tent-rtt">WebSocket RTT: N/A</div>}
      {/* Users in Tent */}
      <div>
        {/* <UsersList users={users} voiceChat={voiceChat} tentId={tent.id} /> */}
      </div>
      <div>{JSON.stringify(getParticipantsByTentId(tent.id), null, 2)}</div>
    </div>
  );
};

export default Tent;
