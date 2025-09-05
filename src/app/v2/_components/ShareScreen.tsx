import React, { useMemo } from "react";
import { useUI } from "../_context";
import { useTentRTCContext } from "../_context/TentRTCContext";

const ShareScreen = () => {
  const { shareScreenedUser, openTab } = useUI();
  const { requestShareScreen, getShareScreenStream, getShareScreenStatus } =
    useTentRTCContext();

  const displayStream = useMemo(
    () => getShareScreenStream(shareScreenedUser!),
    [getShareScreenStream, shareScreenedUser]
  );

  const shareScreenStatus = useMemo(
    () => getShareScreenStatus(shareScreenedUser!),
    [getShareScreenStatus, shareScreenedUser]
  );

  // Basic guard if no user is selected
  if (!shareScreenedUser) {
    return (
      <div className="p-2">
        <h3 className="v2-card-title">Share Screen</h3>
        <p className="text-gray-300 text-sm">No user selected for screen sharing.</p>
      </div>
    );
  }

  if (displayStream) {
    return (
      <div className="p-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="v2-card-title m-0">Sharing: <span className="text-white">{shareScreenedUser}</span></h3>
          <div className="flex items-center gap-2">
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
            className="w-full h-full object-contain bg-black"
            ref={(el) => {
              if (el && el.srcObject !== displayStream) {
                el.srcObject = displayStream as unknown as MediaStream;
              }
            }}
            autoPlay
            muted
            playsInline
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="v2-card-title m-0">Share Screen</h3>
        <button
          className="v2-tent-logs-btn"
          onClick={() => openTab("RTCDataChannel")}
        >
          Back
        </button>
      </div>

      {!shareScreenStatus ? (
        <div className="bg-red-500/10 text-red-300 border border-red-500/30 rounded-md p-3 text-sm">
          {shareScreenedUser} has closed their stream.
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <p className="text-gray-300 text-sm m-0">
            Request to watch <span className="text-white font-medium">{shareScreenedUser}</span>{"'s"} screen.
          </p>
          <button
            className="v2-tent-action-btn"
            onClick={() => requestShareScreen(shareScreenedUser!)}
          >
            Watch
          </button>
        </div>
      )}
    </div>
  );
};

export default ShareScreen;
