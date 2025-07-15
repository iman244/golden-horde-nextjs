"use client";
import React, { useState } from "react";
import { useHordesQuery } from "../hooks/useHordesQuery";
import TentListItem from "./_components/TentListItem";
import Drawer from "./_components/Drawer";
import RTCDataChannelPanel from "./_components/RTCDataChannelPanel";


const V2Page = () => {
  const hordes_q = useHordesQuery();
  const hordes = hordes_q.data?.data || [];

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

      {/* Drawer Toggle Bar: Only show when closed and on mobile */}
      {/* {isMobile && currentTent && !drawerOpen && (
        <TentDrawerToggleBar  />
      )} */}
      {/* Drawer Panel: Only show when open and on mobile, or always on desktop */}
      {/* {currentTent && (
        <TentDrawerPanel tent={currentTent} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      )} */}
      <Drawer>
        <RTCDataChannelPanel />
      </Drawer>

    </div>
  );
};

export default V2Page;