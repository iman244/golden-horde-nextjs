export { getWebSocketStatus } from "./getWsReadyStateMeaning";
export type { WebSocketStatusType } from "./getWsReadyStateMeaning";

export { createPeerConnection } from "./createPeerConnection";
export { calculateVolumeDb } from "./audioUtils";
export * from "./calculateTrackEnabledState";

export function getTentButtonLabel(status: string) {
  switch (status) {
    case "Open":
      return "Leave";
    case "Connecting":
      return "Joining";
    case "Closing":
      return "Leaving";
    default:
      return "Join";
  }
}
