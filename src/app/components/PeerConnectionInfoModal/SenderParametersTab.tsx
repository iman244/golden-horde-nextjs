import React from "react";

export const SenderParametersTab: React.FC<{ loading: boolean; parameters?: Record<string, unknown> }> = ({ loading, parameters }) => (
  <div>
    <span className="font-semibold text-xs">Parameters:</span>
    {loading ? (
      <div className="text-xs text-gray-400 mt-1">Loading...</div>
    ) : parameters ? (
      <pre className="bg-gray-900 rounded p-2 mt-1 overflow-x-auto text-xs">
        {JSON.stringify(parameters, null, 2)}
      </pre>
    ) : (
      <div className="text-xs text-gray-400 mt-1">No parameters available.</div>
    )}
  </div>
); 