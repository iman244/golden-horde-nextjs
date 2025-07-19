"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useHordesQuery } from "../hooks/useHordesQuery";
import TentListItem from "./_components/TentListItem";
import Drawer from "./_components/Drawer";
import RTCDataChannelPanel from "./_components/RTCDataChannelPanel";
import { FaMicrophone, FaPhone } from "react-icons/fa";
import LogsContent from "./_components/LogsContent";
import { useTentRTCContext } from "./_context/TentRTCContext";
import clsx from "clsx";
import Audios from "./_components/Audios";
import MediaErrorModal from "./_components/MediaErrorModal";
import TentStatusIcon from "./_components/TentStatusIcon";
import TentStatusText from "./_components/TentStatusText";
import { useAuth } from "../context/AuthContext";
import { LuHeadphones, LuMonitorPlay, LuMonitorX } from "react-icons/lu";
import OpenRTCDataChannelButton from "./_components/OpenRTCDataChannelButton";
import OpenLogsButton from "./_components/OpenLogsButton";

// dot sabz
// mute
// defean
// [+] leave tent (disconnect)
// [+] tool panel in bottom left
// signal strength at the end of users
// share screen
// reconnect to user
// [+] reconnect to tent
// scroll chat on new message

const V2Page = () => {
  const { username } = useAuth();
  const hordes_q = useHordesQuery();
  const hordes = useMemo(() => hordes_q.data?.data || [], [hordes_q]);
  const { logsMap, wsLogs, currentTentId, leaveTent } = useTentRTCContext();
  const [tab, setTab] = useState<"RTCDataChannel" | "Logs">("RTCDataChannel");
  const [shareScreen, setShareScreen] = useState(false);
  const toggleShareScreen = useCallback(
    () => setShareScreen((pre) => !pre),
    [setShareScreen]
  );

  const openRTCDataChannel = useCallback(() => setTab("RTCDataChannel"), []);
  const openLogs = useCallback(() => setTab("Logs"), []);

  useEffect(() => {
    console.log("V2Page currentTentId", currentTentId);
  }, [currentTentId]);

  // State for selected horde
  const [selectedHordeId, setSelectedHordeId] = useState(hordes[0]?.id || null);
  const selectedHorde = useMemo(
    () => hordes_q.data?.data.find((v) => v.id == selectedHordeId),
    [hordes_q, selectedHordeId]
  );
  const selectedTent = useMemo(
    () =>
      hordes_q.data?.data
        .find((v) => v.id == selectedHordeId)
        ?.tents.find((t) => t.id === currentTentId),
    [hordes_q, selectedHordeId, currentTentId]
  );

  if (!username) {
    return;
  }

  return (
    <div className="v2-page-bg relative">
      {/* Sidebar: Hordes */}
      <div className="w-20 flex flex-col items-center py-4 space-y-2 bg-black/30 border-r border-white/10 backdrop-blur-lg">
        {hordes.map((horde) => (
          <button
            key={horde.id}
            className={`v2-horde-btn${
              horde.id === selectedHordeId ? " v2-horde-btn-selected" : ""
            }`}
            onClick={() => setSelectedHordeId(horde.id)}
            title={horde.name}
          >
            {horde.name[0].toUpperCase()}
          </button>
        ))}
        {/* <button
          onClick={() => {
            console.log("connections", connections);
            console.log("connectionsRef", connectionsRef);
          }}
        >
          log
        </button> */}
      </div>

      {/* Channel List: Tents */}
      <div className="v2-channel-list">
        <div className="px-4 mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
          {selectedHorde ? selectedHorde.name : "No Horde Selected"}
        </div>
        <div className="flex-1 space-y-1 px-2">
          {selectedHorde?.tents.map((tent) => (
            <TentListItem key={tent.id} tent={tent} />
          ))}
        </div>
      </div>

      <Audios />
      <MediaErrorModal />

      {/* Drawer Toggle Bar: Only show when closed and on mobile */}
      {/* {isMobile && currentTent && !drawerOpen && (
        <TentDrawerToggleBar  />
      )} */}
      {/* Drawer Panel: Only show when open and on mobile, or always on desktop */}
      {/* {currentTent && (
        <TentDrawerPanel tent={currentTent} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      )} */}
      {/* <div
        className={clsx(
          "v2-main-panel__drawer-toggle-bar block sm:hidden p-2 items-center gap-4 h-[70px] transition-all",
          currentTentId ? "bottom-[0]!" : "bottom-[-70px]!"
        )}
      >
        <Drawer
          openUI={(onOpen) => (
            <button
              className="text-yellow-400 p-3 rounded-full border border-yellow-200"
              aria-label="Open Drawer"
              onClick={onOpen}
            >
              <FaTools size={20} />
            </button>
          )}
        >
          <LogsContent
            logs={{
              ...Object.fromEntries(Array.from(logsMap.entries())),
              ws: wsLogs,
            }}
          />
        </Drawer>
        <Drawer
          openUI={(onOpen) => (
            <button
              className="text-yellow-400 p-3 rounded-full border border-yellow-200"
              aria-label="Open Drawer"
              onClick={onOpen}
            >
              <BiSolidMessageDetail size={20} />
            </button>
          )}
        >
          <RTCDataChannelPanel />
        </Drawer>
      </div> */}

      <div className=" fixed bottom-0 left-0 w-full sm:w-100 text-[#929399] p-3 ">
        <div className="flex flex-col gap-2 bg-[#181a20] p-4 rounded-xl">
          {selectedTent && selectedHorde && (
            <>
              <div className="flex justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex gap-2 items-center">
                    <TentStatusIcon _icon={{ size: 24 }} />
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
                  className={clsx(
                    "hidden! sm:flex!",
                    tab === "Logs" && "active"
                  )}
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
              <button className="action-container">
                <FaMicrophone size={20} />
              </button>
              <button className="action-container">
                <LuHeadphones size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 hidden sm:flex flex-col">
        <div className="flex-1 flex flex-col">
          {tab == "Logs" && (
            <LogsContent
              logs={{
                ...Object.fromEntries(Array.from(logsMap.entries())),
                ws: wsLogs,
              }}
            />
          )}
          {tab == "RTCDataChannel" && <RTCDataChannelPanel />}
        </div>
      </div>
    </div>
  );
};

export default V2Page;
