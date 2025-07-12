import React from "react";
import type { VoiceChatState } from "../../types/voiceChat";
import { UserItem } from "./UserItem";

interface UsersListProps {
  users: string[];
  voiceChat: VoiceChatState;
  tentId: number;
}

export function UsersList({ users, voiceChat, tentId }: UsersListProps) {
  return (
    <div>
      {users.map((user) => (
        <UserItem
          key={user}
          user={user}
          voiceChat={voiceChat}
          tentId={tentId}
        />
      ))}
    </div>
  );
} 