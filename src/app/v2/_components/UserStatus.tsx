import React, { FC, useMemo } from "react";
import { useTentRTCContext } from "../_context/TentRTCContext";
import clsx from "clsx";

const UserStatus: FC<{ user: string; activeTent: boolean }> = ({
  user,
  activeTent,
}) => {
  const { connections } = useTentRTCContext();
  const pc = useMemo(() => {
    if (activeTent) {
      return connections.get(user)?.pc;
    }
  }, [connections, activeTent, user]);
  return (
    <div key={user} className="flex items-center gap-2">
      <div className="relative w-8 h-8">
        <div className="rounded-avatar">
            <span className="mt-[2px]">{user.charAt(0).toUpperCase()}</span>
        </div>
        {activeTent && pc && (
          <span
            className={clsx(
              "status-dot",
              pc.connectionState === "connected" && "status-dot-connected",
              pc.connectionState === "connecting" && "status-dot-connecting",
              pc.connectionState === "disconnected" &&
                "status-dot-disconnected",
              pc.connectionState !== "connected" &&
                pc.connectionState !== "connecting" &&
                pc.connectionState !== "disconnected" &&
                "status-dot-unknown"
            )}
          />
        )}
      </div>
      <span style={{ color: "#fff", fontSize: 14 }}>{user}</span>
    </div>
  );
};

export default UserStatus;
