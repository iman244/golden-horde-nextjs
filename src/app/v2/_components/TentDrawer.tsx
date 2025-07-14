import React, { useState } from "react";
import { Tent as TentType } from "@/app/data.types";
import Tent from "./Tent";

interface DrawerPanelProps {
  tent: TentType;
  open: boolean;
  onClose: () => void;
}

export const TentDrawerPanel: React.FC<DrawerPanelProps> = ({
  tent,
  open,
  onClose,
}) => {
  // Helper: is mobile (match Tailwind's sm breakpoint)
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 640;
  return (
    <div
      className={`v2-main-panel v2-content flex flex-col sm:static sm:flex-1 ${
        open ? "v2-main-panel--drawer-open" : "v2-main-panel--drawer-closed"
      } sm:translate-y-0`}
      style={{ display: open || !isMobile ? "flex" : "none" }}
    >
      {/* Drawer close button for mobile (down arrow, top right) */}
      <button
        className="absolute right-4 top-4 z-50 block sm:hidden bg-yellow-400 text-gray-900 rounded-full p-2 shadow-lg"
        onClick={onClose}
        aria-label="Close Main Panel"
      >
        {/* Down arrow SVG */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="feather feather-chevron-down"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      {/* Metallica Info and Controls */}
      <div className="flex items-center gap-4 p-4 border-b border-white/10 bg-black/40 rounded-t-2xl">
        {/* Metallica Info */}
        <div className="flex-1">
          <div className="text-lg font-bold text-yellow-400">Metallica</div>
          <div className="text-xs text-gray-300">
            Legendary heavy metal band formed in 1981. Known for hits like
            &quot;Enter Sandman&quot; and &quot;Master of Puppets&quot;.
          </div>
        </div>
        {/* Controls */}
        <div className="flex gap-2">
          <button
            className="bg-white/10 hover:bg-yellow-400/20 text-yellow-400 hover:text-yellow-600 rounded-full p-2 transition"
            aria-label="Mute"
          >
            {/* Mute icon (microphone off) */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 9v6a3 3 0 0 0 6 0v-1" />
              <path d="M19 13v-2a7 7 0 0 0-14 0v2" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          </button>
          <button
            className="bg-white/10 hover:bg-yellow-400/20 text-yellow-400 hover:text-yellow-600 rounded-full p-2 transition"
            aria-label="Deafen"
          >
            {/* Deafen icon (headphones off) */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2z" />
              <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          </button>
        </div>
      </div>
      <Tent tent={tent} />
    </div>
  );
};


interface DrawerProps {
    tent: TentType;
  }

// interface ToggleBarProps {
//     tent: TentType;
//     onOpen: () => void;
//   }

// For compatibility, keep the default export as a wrapper with state
const TentDrawer: React.FC<DrawerProps> = ({ tent }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <>
      {/* {!drawerOpen && (
        <TentDrawerToggleBar tent={tent} onOpen={() => setDrawerOpen(true)} />
      )} */}
      <TentDrawerPanel
        tent={tent}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
};

export default TentDrawer;
