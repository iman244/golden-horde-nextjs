import { useMemo } from "react";
import {
  useProcessedStream,
  useProcessedStreamProps,
} from "./useProcessedStream";
import { useSimpleAudioDetection } from "./useSimpleAudioDetection";

type useStreamProps = {
  startStream?: boolean;
  voiceState: useProcessedStreamProps["voiceState"];
};

const useStream = ({ voiceState, startStream }: useStreamProps) => {
  const { processedStream, mediaError, clearMediaError, closeStream, currentVolume, displayVolume } = useProcessedStream({
    voiceState,
    username: "LOCAL_USER",
    startStream,
  });

  const uiIsSpeaking = useSimpleAudioDetection(processedStream, "LOCAL_USER");

  //   const { playLocalUserAudioPreview, stopLocalUserAudioPreview } =
  //     useAudioPreview({
  //       mainStream: stream,
  //       getStream,
  //       vadEnabled,
  //       vadIsSpeaking,
  //     });

  // Memoize callback functions to prevent unnecessary re-renders

  //   const addTrack = useCallback(
  //     async (target_user: string, pc: RTCPeerConnection) => {},
  //     []
  //   );
  // const currentVolume = useMemo(() => 0, []);
  // const displayVolume = useMemo(() => 0, []);
  //   const clearMediaError = useCallback(() => {}, []);

  // Memoize the return object to prevent unnecessary re-renders
  //   useChangeStreamStates({
  //         stream: processedStream,
  //     addTrack,
  //     mediaError,
  //     clearMediaError,
  //     isMuted,
  //     toggleMute,
  //     setIsMuted,
  //     isDeafened,
  //     toggleDeafen,
  //     setIsDeafened,
  //     vadEnabled,
  //     toggleVad,
  //     vadThreshold,
  //     setVadThreshold,
  //     uiIsSpeaking,
  //   });
  const result = useMemo(
    () => ({
      stream: processedStream,
      mediaError,
      clearMediaError,
      isSpeaking: uiIsSpeaking,
      closeStream,
      currentVolume,
      displayVolume,
    }),
    [processedStream, mediaError, clearMediaError, uiIsSpeaking, closeStream, currentVolume, displayVolume]
  );

  return result;
};

export default useStream;
