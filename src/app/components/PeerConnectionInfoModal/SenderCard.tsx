import React from "react";
import { SenderInfoTab } from "./SenderInfoTab";
import { SenderDetail, SenderTab } from "./types";
import { SenderTabs } from "./SenderTabs";
import { SenderParametersTab } from "./SenderParametersTab";
import { SenderStatsTab } from "./SenderStatsTab";

interface SenderCardProps {
  detail: SenderDetail;
  index: number;
  onExpand: (index: number) => void;
  onTabChange: (index: number, tab: SenderTab) => void;
}

export const SenderCard: React.FC<SenderCardProps> = ({ detail, index, onExpand, onTabChange }) => (
  <div className="border border-gray-600 rounded p-3">
    <div className="flex justify-between items-center mb-2">
      <button
        onClick={() => onExpand(index)}
        className="text-left flex-1 font-medium hover:text-blue-400"
      >
        {detail.expanded ? "▼" : "▶"} Sender {index + 1}
        {detail.info.track && ` - ${detail.info.track.kind}`}
      </button>
    </div>
    {detail.expanded && (
      <div>
        <SenderTabs activeTab={detail.activeTab} onTabChange={(tab) => onTabChange(index, tab)} />
        <div>
          {detail.activeTab === "info" && <SenderInfoTab info={detail.info} />}
          {detail.activeTab === "parameters" && (
            <SenderParametersTab loading={detail.loadingParameters} parameters={detail.parameters} />
          )}
          {detail.activeTab === "stats" && (
            <SenderStatsTab loading={detail.loadingStats} stats={detail.stats} />
          )}
        </div>
      </div>
    )}
  </div>
); 