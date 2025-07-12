import React from "react";

interface PeerConnectionStatsModalProps {
  open: boolean;
  onClose: () => void;
  peerConnection: RTCPeerConnection | null;
}

function getPeerConnectionFields(peerConnection: RTCPeerConnection | null) {
  if (!peerConnection) return {};
  const result: Record<string, unknown> = {};

  // Get all own property names
  Object.getOwnPropertyNames(peerConnection).forEach((key) => {
    try {
      result[key] = (peerConnection as any)[key];
    } catch (e) {
      result[key] = '[unreadable]';
    }
  });

  // Get all prototype property names (methods, etc.)
  Object.getOwnPropertyNames(Object.getPrototypeOf(peerConnection)).forEach((key) => {
    if (!(key in result)) {
      try {
        const value = (peerConnection as any)[key];
        result[key] = typeof value === 'function' ? '[function]' : value;
      } catch (e) {
        result[key] = '[unreadable]';
      }
    }
  });

  return result;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const PeerConnectionStatsModal: React.FC<PeerConnectionStatsModalProps> = ({ open, onClose, peerConnection }) => {
  if (!open) return null;
  if (typeof window === "undefined" || !document.body) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-2xl relative text-white">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-4">PeerConnection Stats Modal</h2>
        <pre className="bg-gray-900 rounded p-2 mt-1 overflow-x-auto text-xs">
          {JSON.stringify(getPeerConnectionFields(peerConnection), null, 2)}
        </pre>
      </div>
    </div>

}; 