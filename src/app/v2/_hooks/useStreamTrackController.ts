import { useEffect } from "react";
import { calculateTrackEnabledState } from "../_utils";
import { createLogger } from "../_utils/logger";

const { task: createTaskLogger } = createLogger("useStreamTrackController");

/**
 * A hook to control the enabled state of audio tracks on a MediaStream.
 * This hook centralizes the logic for muting, deafening, and VAD.
 *
 * @param stream The MediaStream to control.
 * @param isMuted Whether the user is muted.
 * @param isDeafened Whether the user is deafened.
 * @param vadEnabled Whether Voice Activity Detection is enabled.
 * @param isSpeaking Whether the user is currently speaking (according to VAD).
 */
export const useStreamTrackController = ({
  stream,
  isMuted,
  isDeafened,
  vadEnabled,
  isSpeaking,
}: {
  stream: MediaStream | null;
  isMuted: boolean;
  isDeafened: boolean;
  vadEnabled: boolean;
  isSpeaking: boolean;
}) => {
  useEffect(() => {
    const task = createTaskLogger("side effect of stream track controller");
    task.step("checking if stream is provided");
    if (!stream) {
      task.step("no stream to control");
      return; // No stream to control
    }
    task.step("getting audio tracks");
    const audioTracks = stream.getAudioTracks();

    const shouldTrackBeEnabled = calculateTrackEnabledState({
      isMuted,
      isDeafened,
      vadEnabled,
      isSpeaking,
    });

    // Apply the calculated state to all audio tracks
    audioTracks.forEach((track) => {
      if (track.enabled !== shouldTrackBeEnabled) {
        track.enabled = shouldTrackBeEnabled;
      }
    });

    task.step(
      `Track Control: enabled=${shouldTrackBeEnabled} (muted=${isMuted}, deafened=${isDeafened}, vad=${vadEnabled}, speaking=${isSpeaking})`
    );
    task.end();
  }, [stream, isMuted, isDeafened, vadEnabled, isSpeaking]);
};
