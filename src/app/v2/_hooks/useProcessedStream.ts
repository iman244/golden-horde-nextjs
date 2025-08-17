import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalVAD } from "./useLocalVAD";
import { useStreamTrackController } from "./useStreamTrackController";
import { createLogger } from "../_utils/logger";
import { useUserMediaStream } from "./useUserMediaStream";


export type useProcessedStreamProps = {
  voiceState: {
    isMuted: boolean;
    isDeafened: boolean;
    vadEnabled: boolean;
    vadThreshold: number;
  };
  username?: string;
  startStream?: boolean;
}


const { task: createTaskLogger } = createLogger("useProcessedStream");


export function useProcessedStream(
  { voiceState, username = "LOCAL_USER", startStream = true }: useProcessedStreamProps
) {
    const constraints = useMemo(() => ({ audio: true }), []);

    const {
        mediaError,
        clearMediaError,
        getStream: getAudioStream,
      } = useUserMediaStream({
        constraints,
      });
    

  const { isMuted, isDeafened, vadEnabled, vadThreshold } = voiceState;

  const originalStreamRef = useRef<MediaStream | null>(null);
  const [processedStream, setProcessedStream] = useState<MediaStream | null>(null);
  const [isProcessedStreamReady, setIsProcessedStreamReady] = useState(false);

  useEffect(() => {
    if (processedStream) {
      setIsProcessedStreamReady(true);
    }
  }, [processedStream]);

  const makeStreamReady = useCallback(async () => {
    if (!startStream) return;
    const task = createTaskLogger("making stream ready");
    task.step("Checking if we have a stream", {
      status: "info",
    });
    let originalStream = originalStreamRef.current;

    if (!originalStream) {
      task.step("No original stream found, getting new stream", {
        status: "info",
      });
      try {
        const newStream = await getAudioStream();
        task.step(
          "New stream got from useUserMediaStream, updating original stream",
          {
            status: "ok",
          }
        );
        originalStream = newStream;
        originalStreamRef.current = originalStream;
      } catch (error) {
        task.step("Failed to get audio stream", {
          status: "error",
          error,
        });
        task.end();
        throw error;
      }
      setProcessedStream(originalStream.clone());
      task.step("Processed stream cloned, returning");
      task.end();
      return;
    }
    
    task.step(
      "Original stream is available, creating processed stream",
      {
        status: "info",
      }
    );
    
    // Always create processed stream if we have original stream
    setProcessedStream(originalStream.clone());
    task.step("Processed stream cloned, returning");
    task.end();
  }, [getAudioStream, startStream]);

  const closeStream = useCallback(()=>{
    originalStreamRef.current = null;
    setProcessedStream(null);
  },[])

  // Handle initial setup and cleanup
  useEffect(() => {
    makeStreamReady();

    return closeStream;
  }, [makeStreamReady, closeStream]);

  // Handle startStream changes
  useEffect(() => {
    if (startStream) {
      // Only make stream ready if we don't already have a processed stream
      if (!processedStream) {
        makeStreamReady();
      }
    } else {
      closeStream();
    }
  }, [startStream, processedStream, makeStreamReady, closeStream]);
  
  // VAD analysis
  const { isSpeaking, currentVolume, displayVolume } = useLocalVAD(
    originalStreamRef.current,
    username,
    { thresholdDb: vadThreshold }
  );

  // Apply mute/deafen/VAD logic to the processed stream
  useStreamTrackController({
    stream: processedStream,
    isMuted,
    isDeafened,
    vadEnabled,
    isSpeaking,
  });


  return {
    isProcessedStreamReady,
    processedStream,
    mediaError,
    clearMediaError,
    closeStream,
    currentVolume,
    displayVolume,
  };
} 