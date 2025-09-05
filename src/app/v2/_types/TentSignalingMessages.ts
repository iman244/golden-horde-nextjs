
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
  | { type: "user_joined"; username: string }
  | { type: "user_left"; username: string }
  | { type: "failed"; username: string; target_user: string }
  | { type: "syncing_state"; username: string; isMuted: boolean; isDeafened: boolean; isSharingScreen: boolean }
  | { type: "share_screen_started"; username: string; }
  | { type: "share_screen_stopped"; username: string; }
  | { type: "request_share_screen"; username: string; target_user: string }

