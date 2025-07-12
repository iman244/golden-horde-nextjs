import React from "react";
import { SenderTab } from "./types";

interface SenderTabsProps {
  activeTab: SenderTab;
  onTabChange: (tab: SenderTab) => void;
}

export const SenderTabs: React.FC<SenderTabsProps> = ({ activeTab, onTabChange }) => (
  <div className="flex space-x-2 mb-2">
    <button
      onClick={() => onTabChange("info")}
      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
        activeTab === "info"
          ? "bg-blue-600 text-white"
          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
      }`}
    >
      Info
    </button>
    <button
      onClick={() => onTabChange("parameters")}
      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
        activeTab === "parameters"
          ? "bg-green-600 text-white"
          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
      }`}
    >
      Parameters
    </button>
    <button
      onClick={() => onTabChange("stats")}
      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
        activeTab === "stats"
          ? "bg-purple-600 text-white"
          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
      }`}
    >
      Stats
    </button>
  </div>
); 