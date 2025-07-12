import React from "react";
import { ReceiverDetail, ReceiverTab } from "./types";
import { ReceiverTabs } from "./ReceiverTabs";
import { ReceiverInfoTab } from "./ReceiverInfoTab";
import { ReceiverStatsTab } from "./ReceiverStatsTab";


interface ReceiverCardProps {
  detail: ReceiverDetail;
  index: number;
  onExpand: (index: number) => void;
  onTabChange: (index: number, tab: ReceiverTab) => void;
}

export const ReceiverCard: React.FC<ReceiverCardProps> = ({ detail, index, onExpand, onTabChange }) => (
  <div className="border border-gray-600 rounded p-3">
    <div className="flex justify-between items-center mb-2">
      <button
        onClick={() => onExpand(index)}
        className="text-left flex-1 font-medium hover:text-blue-400"
      >
        {detail.expanded ? "▼" : "▶"} Receiver {index + 1}
        {detail.info.track && ` - ${detail.info.track.kind}`}
      </button>
    </div>
    {detail.expanded && (
      <div>
        <ReceiverTabs activeTab={detail.activeTab} onTabChange={(tab) => onTabChange(index, tab)} />
        <div>
          {detail.activeTab === "info" && <ReceiverInfoTab info={detail.info} />}
          {detail.activeTab === "stats" && (
            <ReceiverStatsTab loading={detail.loadingStats} stats={detail.stats} />
          )}
        </div>
      </div>
    )}
  </div>
); 