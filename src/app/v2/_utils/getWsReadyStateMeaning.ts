export type getWsReadyStateMeaningReturnType =
  | "Connecting"
  | "Open"
  | "Closed"
  | "Closing"
  | "N/A";

// Returns a human-readable meaning for WebSocket readyState
export function getWsReadyStateMeaning(
  state: number | null
): getWsReadyStateMeaningReturnType {
  switch (state) {
    case 0:
      return "Connecting";
    case 1:
      return "Open";
    case 2:
      return "Closing";
    case 3:
      return "Closed";
    case null:
    case undefined:
    default:
      return "N/A";
  }
}
