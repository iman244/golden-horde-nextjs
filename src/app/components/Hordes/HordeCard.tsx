import React from "react";
import type { Horde } from "../../data.types";
import type { VoiceChatState } from "../../types/voiceChat";
import { TentCard } from "./TentCard";

interface HordeCardProps {
  horde: Horde;
  currentTentId: number | null;
  tentUsersByTent: Record<string, string[]>;
  onTentClick: (tentId: number) => void;
  voiceChat: VoiceChatState;
}

export function HordeCard({ 
  horde, 
  currentTentId, 
  tentUsersByTent, 
  onTentClick, 
  voiceChat 
}: HordeCardProps) {
  return (
    <div
      style={{
        marginBottom: "24px",
        padding: "16px",
        background: "rgba(255, 255, 255, 0.05)",
        borderRadius: "8px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <h3
        style={{
          margin: "0 0 12px 0",
          fontSize: "18px",
          fontWeight: "600",
          color: "#ffd700",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        🏰 {horde.name}
      </h3>
      <div style={{ marginLeft: "8px" }}>
        {horde.tents.map((tent) => (
          <TentCard
            key={tent.id}
            tent={tent}
            currentTentId={currentTentId}
            users={tentUsersByTent[tent.id] || []}
            onTentClick={onTentClick}
            voiceChat={voiceChat}
          />
        ))}
      </div>
    </div>
  );
} 