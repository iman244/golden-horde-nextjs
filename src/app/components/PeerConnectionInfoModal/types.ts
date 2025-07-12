import { RTCStatsReport } from "../../utils";

export type SenderTab = "info" | "parameters" | "stats";
export type ReceiverTab = "info" | "stats";

export interface SenderDetail {
  sender: RTCRtpSender;
  info: any;
  parameters?: Record<string, unknown>;
  stats?: RTCStatsReport[];
  expanded: boolean;
  loadingStats: boolean;
  loadingParameters: boolean;
  activeTab: SenderTab;
  fetchedParameters: boolean;
  fetchedStats: boolean;
}

export interface ReceiverDetail {
  receiver: RTCRtpReceiver;
  info: any;
  stats?: RTCStatsReport[];
  expanded: boolean;
  loadingStats: boolean;
  activeTab: ReceiverTab;
  fetchedStats: boolean;
} 