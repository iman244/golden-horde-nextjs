import { useCallback, useEffect, useMemo, useRef } from "react";
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
  const processedStreamRef = useRef<MediaStream | null>(null);

  const mekeStreamReady = useCallback(async () => {
    if (!startStream) return;
    const task = createTaskLogger("making stream ready");
    task.step("Checking if we have a stream", {
      status: "info",
    });
    let originalStream = originalStreamRef.current;
    let processedStream = processedStreamRef.current;

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
      processedStream = originalStream.clone();
      processedStreamRef.current = processedStream;
      task.step("Processed stream cloned, returning");
      task.end();
      return processedStream;
    }
    task.step(
      "Original stream is available, checking if we have a processed stream",
      {
        status: "info",
      }
    );
    if (processedStream) {
      task.step("Processed stream is available, skipping update", {
        status: "ok",
      });
      task.end();
      return processedStream;
    } else {
      task.step("No processed stream found, cloning original stream", {
        status: "info",
      });
      processedStream = originalStream.clone();
      processedStreamRef.current = processedStream;
      task.step("Processed stream cloned, returning");
      task.end();
      return processedStream;
    }
  }, [getAudioStream, startStream]);

  const closeStream = useCallback(()=>{
    originalStreamRef.current = null;
    processedStreamRef.current = null;
  },[])

  useEffect(() => {
    mekeStreamReady();

    return closeStream;
  }, [mekeStreamReady, startStream, closeStream]);
  
  // VAD analysis
  const { isSpeaking, currentVolume, displayVolume } = useLocalVAD(
    originalStreamRef.current,
    username,
    { thresholdDb: vadThreshold }
  );

  // Apply mute/deafen/VAD logic to the processed stream
  useStreamTrackController({
    stream: processedStreamRef.current,
    isMuted,
    isDeafened,
    vadEnabled,
    isSpeaking,
  });


  return {
    processedStream: processedStreamRef.current,
    mediaError,
    clearMediaError,
    closeStream,
    currentVolume,
    displayVolume,
  };
} 