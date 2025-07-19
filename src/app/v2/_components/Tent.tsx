import { Tent as TentType } from "@/app/data.types";
import React, { FC } from "react";
import { useTentsLiveUsers } from "../_context/TentsLiveUsersContext";
import { useTentRTCContext } from "../_context/TentRTCContext";
import TentJoinLeaveButton from "./TentJoinLeaveButton";
import clsx from "clsx";
import TentInfo from "./TentInfo";
import TentRTT from "./TentRTT";
import { getTentButtonLabel } from "../_utils";

const Tent: FC<{ tent: TentType }> = ({ tent }) => {
  const { getParticipantsByTentId } = useTentsLiveUsers();
  const { joinTent, leaveTent, wsStatus} =
    useTentRTCContext();

  const onTentClick = () => {
    if (wsStatus == "Not Connected" || wsStatus == "Closed") {
      joinTent(tent.id);
    } else if (wsStatus == "Open") {
      leaveTent();
    }
  };

  return (
    <div
      className={clsx(
        "v2-tent-card",
        wsStatus == "Open" && "v2-tent-card-connected"
      )}
    >
      <div
        className={clsx(
          "v2-tent-header",
          wsStatus == "Open" && "v2-tent-header-connected"
        )}
      >
        <TentInfo tent={tent} />
        <div className="v2-tent-actions">
          {/* {tentStatus == "Open" && (
            <LogsModal logs={{ system: logs, ws: wsLogs }} />
          )} */}
          <TentJoinLeaveButton
            onClick={onTentClick}
            className={clsx(
                wsStatus == "Open"
                ? "v2-tent-action-btn v2-tent-action-btn-leave"
                : "v2-tent-action-btn"
            )}
          >
            {getTentButtonLabel(wsStatus)}
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
