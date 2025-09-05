import React from "react";
import { useStreamContext } from "../_context";
import { useUI } from "../_context";

const SharedScreenPreview = () => {
  const { displayStream, toggleShareScreen, isSharingScreen } =
    useStreamContext();
  const { openTab } = useUI();

  if (!isSharingScreen) {
    return (
      <div className="p-2">
        <h3 className="v2-card-title">Share Screen Preview</h3>
        <p className="text-gray-300 text-sm">Share screen stopped</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="v2-card-title m-0">Shared Screen Preview</h3>
        <div className="flex items-center gap-2">
          <button
            className="v2-tent-action-btn v2-tent-action-btn-leave"
            title="Close stream"
            onClick={toggleShareScreen}
          >
            Close stream
          </button>
          <button
            className="v2-tent-logs-btn"
            onClick={() => openTab("RTCDataChannel")}
            title="Back"
          >
            Back
          </button>
        </div>
      </div>
      <div className="w-full aspect-video bg-black/50 border border-white/10 rounded-lg overflow-hidden">
        <video
          ref={(el) => {
            if (el && el.srcObject !== displayStream) {
              el.srcObject = displayStream;
            }
          }}
          autoPlay
        />
      </div>
    </div>
  );
};

export default SharedScreenPreview;
