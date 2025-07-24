import { useCallback, useRef } from "react";
import { useStreamTrackController } from "./useStreamTrackController";

/**
 * A hook to manage the local user's audio preview functionality.
 * It handles the creation of a preview stream, and its lifecycle.
 *
 * @param mainStream The main audio stream of the user.
 * @param getStream A function to get the main stream if it doesn't exist.
 * @param vadEnabled Whether Voice Activity Detection is enabled.
 * @param vadIsSpeaking Whether the user is currently speaking (according to VAD).
 * @returns An object with functions to start and stop the audio preview.
 */
export const useAudioPreview = ({
  mainStream,
  getStream,
  vadEnabled,
  vadIsSpeaking,
}: {
  mainStream: MediaStream | null;
  getStream: () => Promise<MediaStream>;
  vadEnabled: boolean;
  vadIsSpeaking: boolean;
}) => {
  const isPlayingPreview = useRef(false);
  const previewStreamRef = useRef<MediaStream | null>(null);

  // Use the track controller for the preview stream.
  // Mute/Deafen are always false for a local preview.
  useStreamTrackController({
    stream: previewStreamRef.current,
    isMuted: false,
    isDeafened: false,
    vadEnabled,
    isSpeaking: vadIsSpeaking,
  });

  const playLocalUserAudioPreview = useCallback(async () => {
    if (isPlayingPreview.current) {
      // If already playing, don't do anything.
      if (previewStreamRef.current) {
        return previewStreamRef.current;
      }
    }
    isPlayingPreview.current = true;

    let clonedStream: MediaStream;
    if (mainStream) {
      clonedStream = mainStream.clone();
    } else {
      // If the main stream isn't available yet, get it.
      const newStream = await getStream();
      clonedStream = newStream.clone();
    }

    // Store preview stream for VAD control and return it.
    previewStreamRef.current = clonedStream;
    return clonedStream;
  }, [mainStream, getStream]);

  const stopLocalUserAudioPreview = useCallback(() => {
    if (isPlayingPreview.current) {
      isPlayingPreview.current = false;
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach((track) => track.stop());
        previewStreamRef.current = null;
      }
    }
  }, []);

  return {
    playLocalUserAudioPreview,
    stopLocalUserAudioPreview,
  };
}; 