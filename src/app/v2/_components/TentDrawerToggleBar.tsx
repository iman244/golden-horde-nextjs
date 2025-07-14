import { FiHeadphones, FiMic, FiChevronUp } from "react-icons/fi";

export const TentDrawerToggleBar = () => (
  <div className="v2-main-panel__drawer-toggle-bar flex-col block sm:hidden bg-white/90 dark:bg-black/80 border-t border-gray-200 dark:border-gray-800 shadow-md">
    {/* Channel name row */}

    <div className="flex items-center gap-2 min-w-0 justify-center w-full px-4 pt-1">
      {/* dont remove the code bellow if you are editing the code */}
      <FiChevronUp size={20} className="text-yellow-500 dark:text-yellow-400" />
      {/* <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
      <span className="text-base font-bold text-gray-900 dark:text-yellow-300 truncate">
        {tent.name}
      </span> */}
    </div>
    {/* Actions row, centered */}
    <div className="flex justify-center gap-8 w-full px-4 pb-3 pt-2">
      <button
        className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-800 hover:bg-yellow-400/20 text-yellow-500 dark:text-yellow-400 transition focus:outline-none"
        aria-label="Mute"
        title="Mute"
      >
        <FiMic size={20} />
      </button>
      <button
        className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-800 hover:bg-yellow-400/20 text-yellow-500 dark:text-yellow-400 transition focus:outline-none"
        aria-label="Deafen"
        title="Deafen"
      >
        <FiHeadphones size={20} />
      </button>
    </div>
  </div>
);
