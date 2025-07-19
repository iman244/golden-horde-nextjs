import React, { FC, useMemo, useState, useEffect } from "react";
import { useTentRTCContext } from "../_context/TentRTCContext";
import clsx from "clsx";
import { useAuth } from "@/app/context/AuthContext";
import { BsThreeDotsVertical } from "react-icons/bs";

const ConnectedUserStatus: FC<{ user: string }> = ({ user }) => {
  const { username } = useAuth();
  const { connections, reconnectToUser } = useTentRTCContext();
  const pc = useMemo(() => connections.get(user)?.pc, [connections, user]);

  const [ping, setPing] = useState<number | null>(null);
  // Context menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  // Ref for the three-dot button
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!pc) {
      setPing(null);
      return;
    }
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const stats = await pc.getStats();
        let rtt: number | null = null;
        stats.forEach((report) => {
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
  }, [pc]);

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = () => setMenuOpen(false);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [menuOpen]);

  //   if (!pc) {
  //     return <UserInTentDisplay user={user} />;
  //   }
  return (
    <div
      className="group flex items-center justify-between transition-colors hover:bg-gray-700/50 rounded-md py-1 px-2"
      style={{ position: "relative" }}
    >
      <div key={user} className="flex items-center gap-2">
        <div className="relative w-8 h-8">
          <div className="rounded-avatar">
            <span className="mt-[2px]">{user.charAt(0).toUpperCase()}</span>
          </div>

          {pc && (
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
      <div className="flex items-center gap-1">
        {ping !== null && (
          <span className={"flex items-center gap-1"}>
            {/* <WifiSignalIcon status={pc.connectionState === "connected" ? "Open" : pc.connectionState === "connecting" ? "Connecting" : "Closed"} latency={ping !== null ? Math.round(ping) : undefined} _icon={{ size: 16 }} /> */}
            <span
              className={clsx(
                "rounded px-2 py-0.5 text-xs font-mono bg-gray-700/50 ",
                ping === null
                  ? "text-gray-500"
                  : ping <= 80
                  ? "text-green-600"
                  : ping <= 200
                  ? "text-yellow-500"
                  : "text-red-600"
              )}
              style={{ minWidth: 32, textAlign: "center" }}
            >
              {`${Math.round(ping)}ms`}
            </span>
          </span>
        )}
        {/* Three-dot menu button */}
        {user != username && (
          <button
            ref={menuButtonRef}
            className="p-1 cursor-pointer rounded-full hover:bg-gray-700 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              const rect = menuButtonRef.current?.getBoundingClientRect();
              setMenuOpen((v) => !v);
              if (rect) {
                setMenuPosition({ x: rect.left, y: rect.bottom + 4 });
              }
            }}
            aria-label="Open menu"
            type="button"
          >
            <BsThreeDotsVertical />
          </button>
        )}
      </div>
      {/* Menu */}
      {user != username && menuOpen && menuPosition && (
        <div
          className="fixed z-[100] bg-gray-800 border border-gray-700 rounded shadow-lg py-1 min-w-[120px]"
          style={{
            top: menuPosition.y - 10,
            left: menuPosition.x - 210,
          }}
          onClick={() => setMenuOpen(false)}
        >
          <button
            className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
            onClick={async () => {
              await reconnectToUser(user);
              setMenuOpen(false);
            }}
          >
            reconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectedUserStatus;
