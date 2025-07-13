import React, { useMemo } from "react";
import { Tent as TentType } from "@/app/data.types";
import { useTentRTCContext } from "../_context/TentRTCContext";

interface TentRTTProps {
  tent: TentType;
}

const TentRTT: React.FC<TentRTTProps> = ({ tent }) => {
  const { status, wsLatency } = useTentRTCContext();
  const tentStatus = useMemo(() => status(tent.id), [status, tent.id]);

  if (tentStatus !== "Open") return null;

  return (
    <div className="v2-tent-rtt">
      WebSocket State: {tentStatus}
      <br />
      WebSocket RTT: {wsLatency}
    </div>
  );
};

export default TentRTT; 