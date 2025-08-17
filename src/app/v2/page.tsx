"use client";
import React, { useCallback, useMemo, useState } from "react";
import { useHordesQuery } from "../hooks/useHordesQuery";
import TentListItem from "./_components/TentListItem";
import LogsContent from "./_components/LogsContent";
import { useTentRTCContext } from "./_context/TentRTCContext";
import { useTentLogsContext } from "./_context/TentLogsContext";
import Audios from "./_components/Audios";
import MediaErrorModal from "./_components/MediaErrorModal";
import { useAuth } from "../context/AuthContext";
import UserPanel from "./_components/UserPanel";
import RTCDataChannelPanel from "./_components/RTCDataChannelPanel";
import Settings from "./_components/Settings";

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

export type Tab = "RTCDataChannel" | "Logs" | "Settings";

const V2Page = () => {
  const { username } = useAuth();
  const hordes_q = useHordesQuery();
  const hordes = useMemo(() => hordes_q.data?.data || [], [hordes_q]);
  const { wsLogs } = useTentRTCContext();
  const { logsMap } = useTentLogsContext();
  const [tab, setTab] = useState<Tab>("RTCDataChannel");

//   const openRTCDataChannel = useCallback(() => setTab("RTCDataChannel"), []);
//   const openLogs = useCallback(() => setTab("Logs"), []);
  const openTab = useCallback((tab: "RTCDataChannel" | "Logs" | "Settings") => setTab(tab), []);

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

      <UserPanel 
        tab={tab} 
        openTab={openTab}
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
          {tab == "Settings" && <Settings />}
        </div>
      </div>
    </div>
  );
};

export default V2Page;
