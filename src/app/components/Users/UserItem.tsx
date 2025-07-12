import React from "react";
import { PeerConnectionStatus } from "../PeerConnectionStatus";
import type { VoiceChatState } from "../../types/voiceChat";

interface UserItemProps {
  user: string;
  voiceChat: VoiceChatState;
  tentId: number;
}

export function UserItem({ user, voiceChat, tentId }: UserItemProps) {
  const isCurrentUser = user === voiceChat.username;
  const hasPeerConnection = voiceChat.peerConnections.has(user);

  if (hasPeerConnection) {
    return (
      <PeerConnectionStatus
        user={user}
        peerConnection={
          voiceChat.peerConnections.get(user)?.peerConnection || null
        }
      />
    );
  }

  return (
    <div
      style={{
        background: "rgba(31,41,55,0.85)",
        borderRadius: 10,
        padding: "10px 14px",
        fontFamily: "monospace",
        fontSize: 12,
        color: "#fff",
        marginBottom: 8,
        boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)",
        display: "flex",
        flexDirection: "row",
        gap: 6,
      }}
    >
      <span style={{ fontWeight: 700, fontSize: 13 }}>{user}</span>
      {isCurrentUser && (
        <span style={{ color: "yellow", fontWeight: 500 }}>(yourself)</span>
      )}
      {!isCurrentUser && voiceChat.currentTentId === tentId && (
        <span
          style={{
            background: "#fbbf24",
            color: "#111",
            borderRadius: 6,
            padding: "2px 7px",
            fontWeight: 600,
            fontSize: 11,
            marginLeft: 4,
          }}
        >
          Not connected
        </span>
      )}
    </div>
  );
} 