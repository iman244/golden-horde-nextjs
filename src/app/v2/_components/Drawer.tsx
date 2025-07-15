import clsx from "clsx";
import React, { FC, ReactNode, useCallback, useState } from "react";
import { CgChevronUp } from "react-icons/cg";

interface DrawerProps {
  children: ReactNode;
  openUI?: (onOpen: () => void) => ReactNode;
}

const Drawer: FC<DrawerProps> = ({ children, openUI }) => {
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = useCallback(() => setIsOpen(true), []);
  const onClose = useCallback(() => setIsOpen(false), []);
  return (
    <>
      {/* Drawer Toggle Bar: Only show when closed and on mobile */}
      {!isOpen && (
        openUI ? (
          openUI(onOpen)
        ) : (
          <div
            className="v2-main-panel__drawer-toggle-bar block sm:hidden"
            onClick={onOpen}
          >
            <button
              className="v2-main-panel__drawer-toggle-btn"
              aria-label="Open Drawer"
            >
              <CgChevronUp />
            </button>
          </div>
        )
      )}
      {/* Drawer Panel: Only show when open and on mobile, or always on desktop */}
      <div
        className={clsx(
          "v2-main-panel flex flex-col sm:static sm:flex-1 z-50",
          isOpen
            ? "v2-main-panel--drawer-open"
            : "v2-main-panel--drawer-closed",
          "sm:v2-main-panel--drawer-open",
          isOpen ? "block" : "hidden",
          "sm:block"
        )}
      >
        {/* Drawer close button for mobile (down arrow, top right) */}
        <button
          className="absolute right-4 top-4 z-50 block sm:hidden bg-yellow-400 text-gray-900 rounded-full p-2 shadow-lg"
          onClick={onClose}
          aria-label="Close Drawer"
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
        <div className="flex-1 w-full">{children}</div>
      </div>
    </>
  );
};

export default Drawer;
