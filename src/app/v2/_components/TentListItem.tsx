import React from "react";
import type { Tent } from "@/app/data.types";
import { useTentRTCContext } from "../_context/TentRTCContext";
import { useTentsLiveUsers } from "../_context/TentsLiveUsersContext";
import { HiSpeakerWave } from "react-icons/hi2";
import { BiWifi, BiWifi0, BiWifi1, BiWifi2, BiWifiOff } from "react-icons/bi";

interface TentListItemProps {
  tent: Tent;
}

// getStatusIcon function removed (was unused)

const TentListItem: React.FC<TentListItemProps> = ({ tent }) => {
  const { currentTentId, joinTent, status, wsLatency } = useTentRTCContext();
  const { getParticipantsByTentId } = useTentsLiveUsers();
  const users = getParticipantsByTentId(tent.id);
  const isSelected = tent.id === currentTentId;
  const tentStatus = status(tent.id);

  // Only show icon and tooltip if this tent is the current one
  const showStatus = tent.id === currentTentId;
  let icon = null;
  let tooltip = undefined;
  if (showStatus) {
    if (
      tentStatus === "Open" &&
      wsLatency !== null &&
      wsLatency !== undefined
    ) {
      if (wsLatency <= 50) {
        icon = (
          <BiWifi style={{ color: "#22c55e" }} title={`${wsLatency} ms`} />
        );
        tooltip = `${wsLatency} ms`;
      } else if (wsLatency <= 100) {
        icon = (
          <BiWifi2 style={{ color: "#a3e635" }} title={`${wsLatency} ms`} />
        );
        tooltip = `${wsLatency} ms`;
      } else if (wsLatency <= 200) {
        icon = (
          <BiWifi1 style={{ color: "#facc15" }} title={`${wsLatency} ms`} />
        );
        tooltip = `${wsLatency} ms`;
      } else {
        icon = (
          <BiWifi0 style={{ color: "#ef4444" }} title={`${wsLatency} ms`} />
        );
        tooltip = `${wsLatency} ms`;
      }
    } else if (tentStatus === "Open") {
      icon = <BiWifiOff style={{ color: "#6b7280" }} title="No Signal" />;
      tooltip = "No Signal";
    } else if (tentStatus === "Connecting") {
      icon = (
        <span style={{ color: "#facc15", fontSize: 13, fontWeight: 600 }}>
          Connecting...
        </span>
      );
      tooltip = undefined;
    } else {
      icon = <BiWifiOff style={{ color: "#6b7280" }} title="Not Connected" />;
      tooltip = "Not Connected";
    }
  }

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
        {showStatus && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginLeft: 8,
            }}
            title={tooltip}
          >
            {icon}
          </span>
        )}
      </button>
      {users.length > 0 && (
        <div style={{ padding: "12px 12px 10px 24px", display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {users.map((username) => (
            <div
              key={username}
              style={{ display: "flex", alignItems: "center" }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "#444",
                  color: "#ffe066",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  marginRight: 8,
                  fontSize: 14,
                }}
              >
                {username.charAt(0).toUpperCase()}
              </div>
              <span style={{ color: "#fff", fontSize: 14 }}>{username}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TentListItem;
