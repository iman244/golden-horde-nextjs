"use client";
import React, { useEffect, useState } from "react";
import { useHordesQuery } from "../hooks/useHordesQuery";
import TentListItem from "./_components/TentListItem";
import { useTentRTCContext } from "./_context/TentRTCContext";
import Drawer from "./_components/Drawer";
import RTCPeerConnectionPanel from "./_components/RTCPeerConnectionPanel";

const V2Page = () => {
  const hordes_q = useHordesQuery();
  const hordes = hordes_q.data?.data || [];

  // State for selected horde
  const [selectedHordeId, setSelectedHordeId] = useState(hordes[0]?.id || null);
  const selectedHorde =
    hordes.find((h) => h.id === selectedHordeId) || hordes[0] || undefined;

    const [m, setM] = useState('')
  // Use currentTentId from context
  const { currentTentId, connections } = useTentRTCContext();

  useEffect(() => {
    // console.log("connections", connections)
  }, [connections]);

  // Drawer state for mobile
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Helper: is mobile (match Tailwind's sm breakpoint)
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 640;
  // Find the current tent
  const currentTent = selectedHorde?.tents.find(
    (tent) => tent.id === currentTentId
  );

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
        <RTCPeerConnectionPanel />
      </Drawer>

    </div>
  );
};

export default V2Page;

// {Array.from(connections).map(([user, { pc, dc }]) => (
//   <div key={user}>
//     <p>{user}</p>
//     <div className="flex flex-col gap-2">
//       <span>connectionState: {pc.connectionState}</span>
//       <span>signalingState: {pc.signalingState}</span>
//       <span>local: {pc.localDescription?.type}</span>
//       <span>remote: {pc.remoteDescription?.type}</span>
//       <input value={m} onChange={(e) => setM(e.target.value)} />
//       <button onClick={()=> {
//         console.log("m", m)
//         console.log("dc", dc)
//         dc?.send(m)
//       }} >send</button>
//     </div>
//   </div>
// ))}