import React from "react";
import { Tent as TentType } from "@/app/data.types";
import { useTentRTCContext } from "../_context/TentRTCContext";

interface TentRTTProps {
  tent: TentType;
}

const TentRTT: React.FC<TentRTTProps> = () => {
  const { wsStatus, wsLatency } = useTentRTCContext();

  if (wsStatus !== "Open") return null;

  return (
    <div className="v2-tent-rtt">
      WebSocket State: {wsStatus}
      <br />
      WebSocket RTT: {wsLatency}
    </div>
  );
};

export default TentRTT; 