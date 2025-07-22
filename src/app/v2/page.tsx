"use client";
import React, { useCallback, useMemo, useState } from "react";
import { useHordesQuery } from "../hooks/useHordesQuery";
import TentListItem from "./_components/TentListItem";
import LogsContent from "./_components/LogsContent";
import { useTentRTCContext } from "./_context/TentRTCContext";
import Audios from "./_components/Audios";
import MediaErrorModal from "./_components/MediaErrorModal";
import { useAuth } from "../context/AuthContext";
import UserPanel from "./_components/UserPanel";
import RTCDataChannelPanel from "./_components/RTCDataChannelPanel";

// [+] dot sabz
// [+] mute
// [+] defean
// [+] leave tent (disconnect)
// [+] tool panel in bottom left
// [+] signal strength at the end of users
// [+] reconnect to tent
// [+/-] reconnect to user

// disconnect from tent
// share screen
// scroll chat on new message
// max height for rtc datachannel
// show mute or deafened of other userss
// user left and join, connecting to websocket is not reliable
// echo cancallation
// noise cancellation
// gain control
// volume control
// audio settings
// audio output
// audio input
// audio device
// audio device list


const V2Page = () => {
  const { username } = useAuth();
  const hordes_q = useHordesQuery();
  const hordes = useMemo(() => hordes_q.data?.data || [], [hordes_q]);
  const { logsMap, wsLogs } = useTentRTCContext();
  const [tab, setTab] = useState<"RTCDataChannel" | "Logs">("RTCDataChannel");

  const openRTCDataChannel = useCallback(() => setTab("RTCDataChannel"), []);
  const openLogs = useCallback(() => setTab("Logs"), []);

  // State for selected horde
  const [selectedHordeId, setSelectedHordeId] = useState(hordes[0]?.id || null);
  const selectedHorde = useMemo(
    () => hordes_q.data?.data.find((v) => v.id == selectedHordeId),
    [hordes_q, selectedHordeId]
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

      <UserPanel 
        tab={tab} 
        openLogs={openLogs} 
        openRTCDataChannel={openRTCDataChannel}
        selectedHorde={selectedHorde}
      />
      <div className="flex-1 hidden sm:flex flex-col max-h-[100dvh] overflow-y-hidden">
        <div className="flex-1 flex flex-col h-full">
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
