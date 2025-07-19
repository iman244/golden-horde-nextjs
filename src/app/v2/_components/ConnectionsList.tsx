import React from "react";
import { useTentRTCContext } from "../_context/TentRTCContext";
import clsx from "clsx";

const ConnectionsList: React.FC = () => {
  const { connections } = useTentRTCContext();
  return (
    <div className="mb-3 flex gap-2 p-2">
      {Array.from(connections).length === 0 && (
        <div className="text-gray-400">No connection</div>
      )}
      {Array.from(connections).map(([user, { pc }]) => (
        <div key={user} className="relative w-8 h-8">
          {/* Avatar with first letter */}
          <div className="rounded-avatar">
            {user.charAt(0).toUpperCase()}
          </div>
          {/* Status dot in bottom right */}
          <span
            className={clsx(
              "status-dot",
              pc.connectionState === "connected" && "status-dot-connected",
              pc.connectionState === "connecting" && "status-dot-connecting",
              pc.connectionState === "disconnected" && "status-dot-disconnected",
              pc.connectionState !== "connected" &&
                pc.connectionState !== "connecting" &&
                pc.connectionState !== "disconnected" && "status-dot-unknown"
            )}
          />
        </div>
      ))}
    </div>
  );
};

export default ConnectionsList; 