export type PeerRole = "offerer" | "answerer" | null;

export interface PeerConnectionStatus {
  connectionState: string;
  iceConnectionState: string;
  signalingState: string;
  localDescription: string;
  remoteDescription: string;
  iceCandidates: string[];
}

export type SignalingMessage =
  | { type: "offer"; sdp: string; user_id?: string }
  | { type: "answer"; sdp: string; user_id?: string }
  | {
      type: "ice-candidate";
      candidate: string;
      sdpMid?: string;
      sdpMLineIndex?: number;
      user_id?: string;
    }
  | { type: "ping"; ts: number; user_id?: string }
  | { type: "pong"; ts: number; user_id?: string }; 