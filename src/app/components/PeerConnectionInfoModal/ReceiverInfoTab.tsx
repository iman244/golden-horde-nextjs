import React from "react";

export const ReceiverInfoTab: React.FC<{ info: any }> = ({ info }) => (
  <div>
    <span className="font-semibold text-xs">Basic Info:</span>
    <pre className="bg-gray-900 rounded p-2 mt-1 overflow-x-auto text-xs">
      {JSON.stringify(info, null, 2)}
    </pre>
  </div>
); 