import React, { useMemo } from "react";
import { Tent as TentType } from "@/app/data.types";
import { useTentRTCContext } from "../_context/TentRTCContext";

interface TentInfoProps {
  tent: TentType;
}

const TentInfo: React.FC<TentInfoProps> = ({ tent }) => {
  const { status } = useTentRTCContext();
  const tentStatus = useMemo(() => status(tent.id), [status, tent.id]);

  return (
    <div className="v2-tent-info">
      <span className="v2-tent-emoji">⛺</span>
      <span className="v2-tent-name">{tent.name}</span>
      {tentStatus === "Open" && (
        <span className="v2-tent-status">✓ Connected</span>
      )}
    </div>
  );
};

export default TentInfo; 