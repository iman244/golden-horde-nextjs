import React from "react";
import type { Horde } from "../../data.types";
import type { VoiceChatState } from "../../types/voiceChat";
import { HordeCard } from "./HordeCard";

interface HordesListProps {
  hordes: Horde[];
  currentTentId: number | null;
  tentUsersByTent: Record<string, string[]>;
  onTentClick: (tentId: number) => void;
  voiceChat: VoiceChatState;
}

export function HordesList({ 
  hordes, 
  currentTentId, 
  tentUsersByTent, 
  onTentClick, 
  voiceChat 
}: HordesListProps) {
  return (
    <div style={{ marginBottom: "32px" }}>
      {hordes.map((horde) => (
        <HordeCard
          key={horde.id}
          horde={horde}
          currentTentId={currentTentId}
          tentUsersByTent={tentUsersByTent}
          onTentClick={onTentClick}
          voiceChat={voiceChat}
        />
      ))}
    </div>
  );
} 