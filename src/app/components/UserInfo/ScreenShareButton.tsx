import React, { useCallback } from "react";
import { FaDesktop, FaStop } from "react-icons/fa";

interface ScreenShareButtonProps {
  isScreenSharing: boolean;
  onToggleScreenShare: () => Promise<void>;
  disabled?: boolean;
}

export function ScreenShareButton({ 
  isScreenSharing, 
  onToggleScreenShare, 
  disabled = false 
}: ScreenShareButtonProps) {
    const onToggleScreenShareLocal = useCallback(async ()=>{
        const MediaStream = await navigator.mediaDevices.getDisplayMedia()
        console.log("MediaStream", MediaStream)
    },[])
  return (
    <button
      onClick={onToggleScreenShareLocal}
    //   onClick={onToggleScreenShare}
      disabled={disabled}
      style={{
        marginLeft: 8,
        background: isScreenSharing ? "#991b1b" : "#23272b",
        color: isScreenSharing ? "#fff" : "#b0b3b8",
        border: "none",
        borderRadius: 6,
        padding: "4px 10px",
        fontWeight: 600,
        fontSize: 13,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        transition: "background 0.2s",
        opacity: disabled ? 0.5 : 1,
      }}
      title={
        isScreenSharing 
          ? "Stop screen sharing" 
          : "Start screen sharing"
      }
    >
      {isScreenSharing ? <FaStop /> : <FaDesktop />}
      {isScreenSharing ? "Stop Share" : "Share Screen"}
    </button>
  );
} 