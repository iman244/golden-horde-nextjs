import React from "react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { LuHeadphoneOff, LuHeadphones } from "react-icons/lu";
import { ScreenShareButton } from "./ScreenShareButton";

interface UserInfoBarProps {
  username: string;
  isMuted: boolean;
  isDeafened: boolean;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onToggleScreenShare: () => Promise<void>;
}

export function UserInfoBar({ 
  username, 
  isMuted, 
  isDeafened, 
  isScreenSharing,
  onToggleMute, 
  onToggleDeafen,
  onToggleScreenShare
}: UserInfoBarProps) {
  return (
    <div
      style={{
        marginBottom: "16px",
        padding: "10px 16px",
        background: "rgba(59,130,246,0.1)",
        borderRadius: "6px",
        color: "#3b82f6",
        fontWeight: 600,
        fontFamily: "monospace",
        fontSize: "14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <span>
        Your username:{" "}
        <span style={{ color: "#fff", fontWeight: 700 }}>
          {username}
        </span>
      </span>
      <button
        onClick={onToggleMute}
        style={{
          marginLeft: 16,
          background: isMuted ? "#991b1b" : "#23272b",
          color: isMuted ? "#fff" : "#b0b3b8",
          border: "none",
          borderRadius: 6,
          padding: "4px 10px",
          fontWeight: 600,
          fontSize: 13,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          transition: "background 0.2s",
        }}
        title={isMuted ? "Unmute microphone" : "Mute microphone"}
      >
        {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
        {isMuted ? "Unmute" : "Mute"}
      </button>
      <button
        onClick={onToggleDeafen}
        style={{
          marginLeft: 8,
          background: isDeafened ? "#991b1b" : "#23272b",
          color: isDeafened ? "#fff" : "#b0b3b8",
          border: "none",
          borderRadius: 6,
          padding: "4px 10px",
          fontWeight: 600,
          fontSize: 13,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          transition: "background 0.2s",
        }}
        title={
          isDeafened
            ? "Undeafen (hear others)"
            : "Deafen (mute all incoming audio)"
        }
      >
        {isDeafened ? <LuHeadphoneOff /> : <LuHeadphones />}
        <span
          style={{
            position: "relative",
            display: "inline-block",
            height: 20,
          }}
        >
          {isDeafened ? "Undeafen" : "Deafen"}
        </span>
      </button>
      <ScreenShareButton
        isScreenSharing={isScreenSharing}
        onToggleScreenShare={onToggleScreenShare}
        disabled={!isScreenSharing && isDeafened}
      />
    </div>
  );
} 