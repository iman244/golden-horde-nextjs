import React from "react";
import { useTentRTCContext } from "../_context/TentRTCContext";
import clsx from "clsx";

const ConnectionsList: React.FC = () => {
  const { connections } = useTentRTCContext();
  return (
    <div className="mb-3 flex gap-2">
      {Array.from(connections).length === 0 && (
        <div className="text-gray-400">No connection</div>
      )}
      {Array.from(connections).map(([user, { pc }]) => (
        <div key={user} className="relative w-8 h-8">
          {/* Avatar with first letter */}
          <div className="w-8 h-8 rounded-full border-2 border-yellow-400 bg-[#23272f] flex items-center justify-center font-bold text-yellow-400 text-base">
            {user.charAt(0).toUpperCase()}
          </div>
          {/* Status dot in bottom right */}
          <span
            className={clsx(
              "absolute w-3 h-3 rounded-full border-2 border-[#23272f] bottom-0 right-0",
              pc.connectionState === "connected" && "bg-green-400",
              pc.connectionState === "connecting" && "bg-yellow-400",
              pc.connectionState === "disconnected" && "bg-red-400",
              pc.connectionState !== "connected" &&
                pc.connectionState !== "connecting" &&
                pc.connectionState !== "disconnected" && "bg-gray-400"
            )}
          />
        </div>
      ))}
    </div>
  );
};

export default ConnectionsList; 