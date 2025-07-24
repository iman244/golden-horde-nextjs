import { createLogger } from "./logger";

const { task: createTaskLogger } = createLogger(
  "calculateTrackEnabledState"
);
/**
 * Determines if a media track should be enabled based on user state.
 * This is the single source of truth for track state logic.
 *
 * @param isMuted - Whether the user is manually muted.
 * @param isDeafened - Whether the user is deafened.
 * @param vadEnabled - Whether VAD is active.
 * @param isSpeaking - Whether the VAD detects speech.
 * @returns {boolean} - True if the track should be enabled, otherwise false.
 */
export const calculateTrackEnabledState = ({
  isMuted,
  isDeafened,
  vadEnabled,
  isSpeaking,
}: {
  isMuted: boolean;
  isDeafened: boolean;
  vadEnabled: boolean;
  isSpeaking: boolean;
}): boolean => {
  const task = createTaskLogger("calculateTrackEnabledState");
  if (isMuted || isDeafened) {
    // Manual mute/deafen always results in disabled tracks
    task.step("Manual mute/deafen always results in disabled tracks", {
      status: "ok",
    });
    task.end();
    return false;
  }
  if (!vadEnabled) {
    // VAD disabled - tracks should always be enabled
    task.step("VAD disabled - tracks should always be enabled", {
      status: "ok",
    });
    task.end();
    return true;
  }
  // VAD enabled and not manually muted - follow speaking detection
  task.step("VAD enabled and not manually muted - follow speaking detection", {
    status: "ok",
  });
  task.end();
  return isSpeaking;
};
