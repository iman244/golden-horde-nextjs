// Re-export existing types from hooks
export type { LogEntry, LogLevel } from './hooks/useLogs';

export interface PeerConnectionStatus {
  connectionState: string;
  iceConnectionState: string;
  signalingState: string;
  localDescription: string;
  remoteDescription: string;
  iceCandidates: string[];
}

export interface PeerInfo {
  userId: string;
  connectionState: string;
  iceConnectionState: string;
  signalingState: string;
  localDescription: string;
  remoteDescription: string;
  iceCandidates: string[];
  connectionStats?: {
    bitrate?: number;
    rtt?: number;
    packetsLost?: number;
    jitter?: number;
  };
}

export interface MultiPeerStatus {
  totalPeers: number;
  connectedPeers: number;
  peers: PeerInfo[];
}

export type VoiceChatSignalingMessage =
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
  | { type: "user_join"; tent_id: string; username: string }
  | { type: "user_left"; tent_id: string; username: string };

export type TentEventMessage =
  | { type: "current_tent_users"; tents: { [tentId: string]: string[] } }
  | { type: "user_joined"; tent_id: string; username: string }
  | { type: "user_left"; tent_id: string; username: string }
  | { type: "ping"; ts: number }
  | { type: "pong"; ts: number };
