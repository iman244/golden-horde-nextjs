import { Tent as TentType } from "@/app/data.types";
import React, { FC, useMemo } from "react";
import { useTentParticipants } from "../_context/TentParticipantsContext";
import { useTentCommunication } from "../_context/TentCommunicationContext";

const Tent: FC<{ tent: TentType }> = ({ tent }) => {
  const { getParticipantsByTentId } = useTentParticipants();
  const { joinTent, leaveTent, wsLatency, status } = useTentCommunication();
  const tentStatus = useMemo(() => status(tent.id), [status, tent.id]);
  const onTentClick = () => {
    console.log("tentStatus", tentStatus);
    if (tentStatus == "N/A" || tentStatus == "Closed") {
      joinTent(tent.id);
    } else if (tentStatus == "Open") {
      leaveTent();
    }
  };

  function getTentButtonLabel(status: string) {
    switch (status) {
      case "Open":
        return "Leave";
      case "Connecting":
        return "Joining";
      case "Closing":
        return "Leaving";
      default:
        return "Join";
    }
  }

  return (
    <div
      className={`v2-tent-card${
        tentStatus == "Open" ? " v2-tent-card-connected" : ""
      }`}
    >
      <div
        className={`v2-tent-header${
          tentStatus == "Open" ? " v2-tent-header-connected" : ""
        }`}
      >
        <div className="v2-tent-info">
          <span className="v2-tent-emoji">⛺</span>
          <span className="v2-tent-name">{tent.name}</span>
          {tentStatus == "Open" && (
            <span className="v2-tent-status">✓ Connected</span>
          )}
        </div>
        <button
          onClick={onTentClick}
          className={`v2-tent-btn${
            tentStatus == "Open" ? " v2-tent-btn-leave" : " v2-tent-btn-join"
          }`}
          onMouseEnter={(e) => {
            e.currentTarget.classList.add("v2-tent-btn-hover");
          }}
          onMouseLeave={(e) => {
            e.currentTarget.classList.remove("v2-tent-btn-hover");
          }}
        >
          {getTentButtonLabel(tentStatus)}
        </button>
      </div>
      {/* WebSocket RTT */}

      {tentStatus == "Open" && (
        <div className="v2-tent-rtt">
          WebSocket State: {tentStatus}
          <br />
          WebSocket RTT: {wsLatency}
        </div>
      )}

      {/* Users in Tent */}
      <div>
        {/* <UsersList users={users} voiceChat={voiceChat} tentId={tent.id} /> */}
      </div>
      <div>{JSON.stringify(getParticipantsByTentId(tent.id), null, 2)}</div>
    </div>
  );
};

export default Tent;
