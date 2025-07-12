import type { LogEntry } from '../hooks/useLogs';

// Voice Chat State interface for components
export interface VoiceChatState {
  currentTentId: number | null;
  isConnected: boolean;
  username: string | null;
  isMuted: boolean;
  isDeafened: boolean;
  wsLatency: number | null;
  logs: LogEntry[];
  wsLogs: LogEntry[];
  peerConnections: Map<string, { peerConnection: RTCPeerConnection; stream: MediaStream | null }>;
  toggleMute: () => void;
  toggleDeafen: () => void;
  leaveTent: () => Promise<void>;
  joinTent: (tentId: number) => Promise<(() => void) | undefined>;
} 