
export type TentSignalingMessages =
  | { type: "offer"; sdp: string; username: string; target_user: string }
  | { type: "answer"; sdp: string; username: string; target_user: string }
  | {
      type: "ice-candidate";
      candidate: string;
      sdpMid?: string;
      sdpMLineIndex?: number;
      username: string;
      target_user: string;
    }
  | { type: "ping"; ts: number; username: string; target_user?: string }
  | { type: "pong"; ts: number; username: string; target_user?: string }
  | { type: "connect_info"; username: string; other_users: string[] }
  | { type: "user_joined"; tent_id: string; username: string }
  | { type: "user_left"; tent_id: string; username: string }
  | { type: "failed"; username: string; target_user: string }
  | { type: "audio_state_changed"; username: string; isMuted: boolean; isDeafened: boolean }

