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
  const {
    isProcessedStreamReady,
    processedStream,
    mediaError,
    clearMediaError,
    closeStream,
    currentVolume,
    displayVolume,
  } = useProcessedStream({
    voiceState,
    username: "LOCAL_USER",
    startStream,
  });

  const uiIsSpeaking = useSimpleAudioDetection(processedStream, "LOCAL_USER");

  const result = useMemo(
    () => ({
      isAudioStreamReady: isProcessedStreamReady,
      stream: processedStream,
      mediaError,
      clearMediaError,
      isSpeaking: uiIsSpeaking,
      closeStream,
      currentVolume,
      displayVolume,
    }),
    [
      isProcessedStreamReady,
      processedStream,
      mediaError,
      clearMediaError,
      uiIsSpeaking,
      closeStream,
      currentVolume,
      displayVolume,
    ]
  );

  return result;
};

export default useStream;
