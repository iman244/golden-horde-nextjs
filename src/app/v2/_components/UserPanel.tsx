import React, { useState, useCallback, useMemo } from "react";
import { useTentRTCContext } from "../_context/TentRTCContext";
import { useAuth } from "../../context/AuthContext";
import clsx from "clsx";
import { FaMicrophone, FaMicrophoneSlash, FaPhone } from "react-icons/fa";
import { LuHeadphoneOff, LuHeadphones, LuMonitorPlay, LuMonitorX } from "react-icons/lu";
import WifiSignalIcon from "./WifiSignalIcon";
import TentStatusText from "./TentStatusText";

import Drawer from "./Drawer";
import LogsContent from "./LogsContent";
import OpenRTCDataChannelButton from "./OpenRTCDataChannelButton";
import RTCDataChannelPanel from "./RTCDataChannelPanel";
import OpenLogsButton from "./OpenLogsButton";
import { Horde } from "@/app/data.types";

interface UserPanelProps {
  tab: "RTCDataChannel" | "Logs";
  openLogs: () => void;
  openRTCDataChannel: () => void;
  selectedHorde: Horde | undefined;
}

const UserPanel: React.FC<UserPanelProps> = ({
  tab,
  openLogs,
  openRTCDataChannel,
  selectedHorde,
}) => {
  const { username } = useAuth();
  const { logsMap, wsLogs, leaveTent, currentTentId, wsStatus, wsLatency, isMuted, isDeafened, toggleDeafen, toggleMute } =
    useTentRTCContext();
  const [shareScreen, setShareScreen] = useState(false);
  const toggleShareScreen = useCallback(
    () => setShareScreen((pre) => !pre),
    []
  );

  const selectedTent = useMemo(
    () => selectedHorde?.tents.find((t) => t.id === currentTentId),
    [selectedHorde, currentTentId]
  );

  if (!username) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full sm:w-100 text-[#929399] p-3">
      <div className="flex flex-col gap-2 bg-[#181a20] p-4 rounded-xl">
        {selectedTent && selectedHorde && (
          <>
            <div className="flex justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex gap-2 items-center">
                  <WifiSignalIcon
                    status={wsStatus}
                    latency={wsLatency}
                    _icon={{ size: 24 }}
                  />
                  <TentStatusText />
                </div>
                <p className="text-gray-400">
                  {selectedTent.name} / {selectedHorde.name}
                </p>
              </div>
              <button
                onClick={async () => {
                  await leaveTent();
                }}
                className="action-container"
              >
                <FaPhone
                  size={16}
                  style={{ transform: "rotate(225deg)", marginTop: "2px" }}
                />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                className={clsx(
                  "imprt-action-container",
                  shareScreen && "active"
                )}
                aria-label="Share Screen"
                onClick={toggleShareScreen}
              >
                {shareScreen ? (
                  <LuMonitorX size={20} />
                ) : (
                  <LuMonitorPlay size={20} />
                )}
              </button>
              <OpenLogsButton
                className={clsx("hidden! sm:flex!", tab === "Logs" && "active")}
                onClick={openLogs}
              />
              <Drawer
                openUI={(onOpen) => (
                  <OpenLogsButton className={"sm:hidden!"} onClick={onOpen} />
                )}
              >
                <LogsContent
                  logs={{
                    ...Object.fromEntries(Array.from(logsMap.entries())),
                    ws: wsLogs,
                  }}
                />
              </Drawer>
              <OpenRTCDataChannelButton
                className={clsx(
                  "hidden! sm:flex!",
                  tab === "RTCDataChannel" && "active"
                )}
                onClick={openRTCDataChannel}
              />
              <Drawer
                openUI={(onOpen) => (
                  <OpenRTCDataChannelButton
                    className={"sm:hidden!"}
                    onClick={onOpen}
                  />
                )}
              >
                <RTCDataChannelPanel />
              </Drawer>
            </div>
            <div className="border-t border-gray-700" />
          </>
        )}
        <div className="flex justify-between">
          <div className="flex gap-2 items-center">
            <div className="rounded-avatar w-9! h-9!">
              {username[0].toUpperCase()}
            </div>
            <span className="text-lg">{username}</span>
          </div>
          <div className="flex gap-1">
            <button className={clsx("action-container", isMuted && "disabled")} onClick={toggleMute}>
              {isMuted ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
            </button>
            <button className={clsx("action-container", isDeafened && "disabled")} onClick={toggleDeafen}>
            {isDeafened ? <LuHeadphoneOff size={20} /> : <LuHeadphones size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPanel;
