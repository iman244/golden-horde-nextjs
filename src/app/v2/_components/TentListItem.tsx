import React from "react";
import type { Tent } from "@/app/data.types";
import { useTentRTCContext } from "../_context/TentRTCContext";
import { useTentsLiveUsers } from "../_context/TentsLiveUsersContext";
import { HiSpeakerWave } from "react-icons/hi2";
import TentStatusIcon from "./TentStatusIcon";
import UserStatus from "./UserStatus";

interface TentListItemProps {
  tent: Tent;
}

// getStatusIcon function removed (was unused)

const TentListItem: React.FC<TentListItemProps> = ({ tent }) => {
  const { currentTentId, joinTent } = useTentRTCContext();
  const { getParticipantsByTentId } = useTentsLiveUsers();
  const users = getParticipantsByTentId(tent.id);

  const isSelected = tent.id === currentTentId;

  // Only show icon and tooltip if this tent is the current one
  const showStatus = tent.id === currentTentId;

  return (
    <div style={{ marginBottom: 8 }}>
      <button
        className={`v2-tent-list-btn${
          isSelected ? " v2-tent-list-btn-selected" : ""
        }`}
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          padding: "8px 12px",
          background: isSelected ? "#23272f" : "none",
          border: isSelected ? "2px solid #ffe066" : "none",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 16,
          color: isSelected ? "#ffe066" : "#fff",
          marginBottom: 0,
        }}
        onClick={() => joinTent(tent.id)}
      >
        <span style={{ display: "flex", alignItems: "center", marginRight: 8 }}>
          <HiSpeakerWave size={20} />
        </span>
        <span style={{ flex: 1, textAlign: "left" }}>{tent.name}</span>
        {showStatus && <TentStatusIcon />}
      </button>
      {users.length > 0 && (
        <div
          style={{
            padding: "12px 12px 10px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {users.map((username) => (
            <UserStatus
              key={username}
              user={username}
              activeTent={tent.id === currentTentId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TentListItem;
