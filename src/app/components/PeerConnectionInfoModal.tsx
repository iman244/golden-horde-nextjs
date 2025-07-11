import React, { useEffect } from "react";

interface PeerConnectionInfoModalProps {
  open: boolean;
  onClose: () => void;
  peerConnection: RTCPeerConnection | null;
}

export const PeerConnectionInfoModal: React.FC<
  PeerConnectionInfoModalProps
> = ({ open, onClose, peerConnection }) => {
  useEffect(() => {
    console.log("peerConnection", peerConnection);
  }, [peerConnection]);
  
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md relative text-white">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-4">PeerConnection Info</h2>
        {peerConnection ? (
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold">Connection State:</span>{" "}
              {peerConnection.connectionState}
            </div>
            <div>
              <span className="font-semibold">Signaling State:</span>{" "}
              {peerConnection.signalingState}
            </div>
            <div>
              <span className="font-semibold">Configuration:</span>
              <pre className="bg-gray-900 rounded p-2 mt-1 overflow-x-auto text-xs">
                {JSON.stringify(peerConnection.getConfiguration(), null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div>No peer connection available.</div>
        )}
      </div>
    </div>
  );
};
