"use client";
import React, { useCallback, useState } from "react";
import { useHordesQuery } from "../hooks/useHordesQuery";
import TentListItem from "./_components/TentListItem";
import Drawer from "./_components/Drawer";
import RTCDataChannelPanel from "./_components/RTCDataChannelPanel";
import { BiSolidMessageDetail } from "react-icons/bi";
import { FaTools } from "react-icons/fa";
import LogsContent from "./_components/LogsContent";
import { useTentRTCContext } from "./_context/TentRTCContext";
import clsx from "clsx";
import Audios from "./_components/Audios";
import MediaErrorModal from "./_components/MediaErrorModal";

const V2Page = () => {
  const hordes_q = useHordesQuery();
  const hordes = hordes_q.data?.data || [];
  const { logsMap, wsLogs } = useTentRTCContext();
  const [tab, setTab] = useState<"RTCDataChannel" | "Logs">("RTCDataChannel");

  const openRTCDataChannel = useCallback(() => setTab("RTCDataChannel"), []);
  const openLogs = useCallback(() => setTab("Logs"), []);

  // State for selected horde
  const [selectedHordeId, setSelectedHordeId] = useState(hordes[0]?.id || null);
  const selectedHorde =
    hordes.find((h) => h.id === selectedHordeId) || hordes[0] || undefined;

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
      <div className="v2-main-panel__drawer-toggle-bar block sm:hidden p-2 items-center gap-4">
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
      </div>
      <div className="flex-1 hidden sm:flex flex-col">
        <div className="p-2 flex items-center justify-center gap-4">
          <button
            className={clsx(
              "p-3 rounded-full border  border-yellow-200 cursor-pointer",
              tab == "Logs" ? "bg-yellow-400 text-black" : "text-yellow-400"
            )}
            aria-label="Open Drawer"
            onClick={openLogs}
          >
            <FaTools size={20} />
          </button>
          <button
            className={clsx(
              "p-3 rounded-full border  border-yellow-200 cursor-pointer",
              tab == "RTCDataChannel"
                ? "bg-yellow-400 text-black"
                : "text-yellow-400"
            )}
            aria-label="Open Drawer"
            onClick={openRTCDataChannel}
          >
            <BiSolidMessageDetail size={20} />
          </button>
        </div>
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
