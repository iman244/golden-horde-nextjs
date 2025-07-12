import React from "react";
import { RTCStatsReport } from "../../utils";

export const SenderStatsTab: React.FC<{ loading: boolean; stats?: RTCStatsReport[] }> = ({ loading, stats }) => (
  <div>
    <span className="font-semibold text-xs">Stats:</span>
    {loading ? (
      <div className="text-xs text-gray-400 mt-1">Loading...</div>
    ) : stats ? (
      <pre className="bg-gray-900 rounded p-2 mt-1 overflow-x-auto text-xs">
        {JSON.stringify(stats, null, 2)}
      </pre>
    ) : (
      <div className="text-xs text-gray-400 mt-1">No stats available.</div>
    )}
  </div>
); 