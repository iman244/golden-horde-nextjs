import { Tent as TentType } from "@/app/data.types";
import React, { FC, useMemo } from "react";
import { useTentParticipants } from "../_context/TentParticipantsContext";
import { useTentRTCContext } from "../_context/TentRTCContext";
import LogsModal from "./LogsModal";
import TentJoinLeaveButton from "./TentJoinLeaveButton";
import clsx from "clsx";
import TentInfo from "./TentInfo";
import TentRTT from "./TentRTT";
import { getTentButtonLabel } from "../_utils";

const Tent: FC<{ tent: TentType }> = ({ tent }) => {
  const { getParticipantsByTentId } = useTentParticipants();
  const { joinTent, leaveTent, status, logs, wsLogs } =
    useTentRTCContext();
  const tentStatus = useMemo(() => status(tent.id), [status, tent.id]);

  const onTentClick = () => {
    if (tentStatus == "N/A" || tentStatus == "Closed") {
      joinTent(tent.id);
    } else if (tentStatus == "Open") {
      leaveTent();
    }
  };

  return (
    <div
      className={clsx(
        "v2-tent-card",
        tentStatus == "Open" && "v2-tent-card-connected"
      )}
    >
      <div
        className={clsx(
          "v2-tent-header",
          tentStatus == "Open" && "v2-tent-header-connected"
        )}
      >
        <TentInfo tent={tent} />
        <div className="v2-tent-actions">
          {tentStatus == "Open" && (
            <LogsModal logs={{ system: logs, ws: wsLogs }} />
          )}
          <TentJoinLeaveButton
            onClick={onTentClick}
            className={clsx(
              tentStatus == "Open"
                ? "v2-tent-action-btn v2-tent-action-btn-leave"
                : "v2-tent-action-btn"
            )}
          >
            {getTentButtonLabel(tentStatus)}
          </TentJoinLeaveButton>
        </div>
      </div>
      {/* WebSocket RTT */}
      <TentRTT tent={tent} />

      {/* Users in Tent */}
      <div>
        {/* <UsersList users={users} voiceChat={voiceChat} tentId={tent.id} /> */}
      </div>
      <div>{JSON.stringify(getParticipantsByTentId(tent.id), null, 2)}</div>
    </div>
  );
};

export default Tent;
