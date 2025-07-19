import React, { FC, useMemo, useState, useEffect } from "react";
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

  const [ping, setPing] = useState<number | null>(null);

  useEffect(() => {
    if (!activeTent || !pc) {
      setPing(null);
      return;
    }
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const stats = await pc.getStats();
        let rtt: number | null = null;
        stats.forEach(report => {
          if (
            (report.type === "candidate-pair" || report.type === "transport") &&
            (report.currentRoundTripTime || report.roundTripTime)
          ) {
            rtt = (report.currentRoundTripTime || report.roundTripTime) * 1000; // ms
          }
        });
        if (isMounted) setPing(rtt);
      } catch {
        if (isMounted) setPing(null);
      }
    }, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeTent, pc]);
  return (
    <div className="flex items-center justify-between">
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
      {activeTent && pc && ping !== null && (
        <span className={"flex items-center gap-1 ml-2"}>
          {/* <WifiSignalIcon status={pc.connectionState === "connected" ? "Open" : pc.connectionState === "connecting" ? "Connecting" : "Closed"} latency={ping !== null ? Math.round(ping) : undefined} _icon={{ size: 16 }} /> */}
          <span
            className={clsx(
              "rounded px-2 py-0.5 text-xs font-mono bg-[#23262e]",
              ping === null ? "text-gray-500" :
              ping <= 80 ? "text-green-600" :
              ping <= 200 ? "text-yellow-500" :
              "text-red-600"
            )}
            style={{ minWidth: 32, textAlign: "center" }}
          >
            {`${Math.round(ping)}ms`}
          </span>
        </span>
      )}
    </div>
  );
};

export default UserStatus;
