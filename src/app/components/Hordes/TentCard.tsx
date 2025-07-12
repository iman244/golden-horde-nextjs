import React from "react";
import { UsersList } from "../Users/UsersList";
import type { Tent } from "../../data.types";
import type { VoiceChatState } from "../../types/voiceChat";

interface TentCardProps {
  tent: Tent;
  currentTentId: number | null;
  users: string[];
  onTentClick: (tentId: number) => void;
  voiceChat: VoiceChatState;
}

export function TentCard({ 
  tent, 
  currentTentId, 
  users, 
  onTentClick, 
  voiceChat 
}: TentCardProps) {
  const isConnected = currentTentId === tent.id;
  
  return (
    <div
      style={{
        marginBottom: "12px",
        padding: "12px",
        background: isConnected
          ? "rgba(68, 255, 68, 0.1)"
          : "rgba(255, 255, 255, 0.03)",
        borderRadius: "6px",
        border: isConnected
          ? "1px solid rgba(68, 255, 68, 0.3)"
          : "1px solid rgba(255, 255, 255, 0.1)",
        transition: "all 0.2s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: isConnected ? "12px" : "0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flex: 1,
          }}
        >
          <span style={{ fontSize: "16px" }}>⛺</span>
          <span
            style={{
              color: "#fff",
              fontWeight: "500",
              fontSize: "14px",
            }}
          >
            {tent.name}
          </span>
          {isConnected && (
            <span
              style={{
                color: "#44ff44",
                fontSize: "12px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              ✓ Connected
            </span>
          )}
        </div>
        <button
          onClick={() => onTentClick(tent.id)}
          style={{
            padding: "8px 16px",
            backgroundColor: isConnected ? "#dc2626" : "#059669",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "600",
            transition: "all 0.2s ease",
            minWidth: "80px",
            textTransform: "capitalize" as const,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {isConnected ? "Leave" : "Join"}
        </button>
      </div>

      {/* WebSocket RTT */}
      {voiceChat.isConnected && isConnected && (
        <div
          style={{
            background: "rgba(59,130,246,0.15)",
            color: "#0ff",
            padding: "8px 16px",
            borderRadius: "6px",
            marginBottom: "12px",
            fontFamily: "monospace",
            fontSize: "13px",
            display: "inline-block",
          }}
        >
          WebSocket RTT:{" "}
          {voiceChat.wsLatency !== null && voiceChat.wsLatency !== undefined
            ? `${voiceChat.wsLatency} ms`
            : "N/A"}
        </div>
      )}

      {/* Users in Tent */}
      <div
        style={{
          marginTop: users.length === 0 ? "0" : "12px",
        }}
      >
        <UsersList users={users} voiceChat={voiceChat} tentId={tent.id} />
      </div>
    </div>
  );
} 