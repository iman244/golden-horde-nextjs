import React, { FC, useMemo, useState, useEffect } from "react";
import { useTentRTCContext } from "../_context/TentRTCContext";
import clsx from "clsx";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaMicrophoneSlash } from "react-icons/fa";
import { LuHeadphoneOff, LuMonitorPlay } from "react-icons/lu";
import { useSimpleAudioDetection } from "../_hooks/useSimpleAudioDetection";
import { useUI } from "../_context";

const SameTentUser: FC<{ user: string }> = ({ user }) => {
  const { connections, reconnectToUser, getPeerMediaState } =
    useTentRTCContext();
  const { openShareScreenTab } = useUI();

  const pc = useMemo(() => connections.get(user)?.pc, [connections, user]);
  const stream = useMemo(
    () => connections.get(user)?.stream || null,
    [connections, user]
  );
  const isSharingScreen = useMemo(() => connections.get(user)?.state.isSharingScreen || false, [connections, user]);
  const isSpeaking = useSimpleAudioDetection(stream, user);

  // Get audio state for the remote user
  const audioState = getPeerMediaState(user);

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

  return (
    <div
      className="group flex items-center justify-between transition-colors hover:bg-gray-700/50 rounded-md py-1 px-2"
      style={{ position: "relative" }}
    >
      <div key={user} className="flex items-center gap-2">
        <div className="relative w-8 h-8">
          <div className={clsx("rounded-avatar", isSpeaking && "speaking")}>
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
      <div className="items-center gap-1 flex">
        {ping !== null && (
          <span
            className={
              "hidden group-hover:flex items-center gap-1 mr-2 transition-opacity"
            }
          >
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
        {/* Audio state icons */}
        <div className="flex items-center gap-2">
          {audioState?.isMuted && (
            <FaMicrophoneSlash
              className="text-gray-400"
              size={16}
              title="Muted"
            />
          )}
          {audioState?.isDeafened && (
            <LuHeadphoneOff
              className="text-gray-400"
              size={16}
              title="Deafened"
            />
          )}
        </div>
        {isSharingScreen && (
          <LuMonitorPlay
            className="text-gray-400 cursor-pointer hover:text-gray-200"
            size={16}
            title="Sharing Screen"
            onClick={() => openShareScreenTab(user)}
          />
        )}
        {/* Three-dot menu button */}
        <button
          ref={menuButtonRef}
          className="cursor-pointer rounded-full focus:outline-none hidden group-hover:block transition-opacity"
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
          <BsThreeDotsVertical size={16} />
        </button>
      </div>
      {/* Menu */}
      {menuOpen && menuPosition && (
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

export default SameTentUser;
