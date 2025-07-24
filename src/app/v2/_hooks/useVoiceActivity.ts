import { useRef, useMemo, useEffect } from "react";
import { useLocalVAD } from "./useLocalVAD";
import { useSimpleAudioDetection } from "./useSimpleAudioDetection";
import { createVadThresholds } from "../_utils/audioUtils";

interface UseVoiceActivityProps {
  stream: MediaStream | null;
  vadEnabled: boolean;
  vadThreshold: number;
  user: string;
}

/**
 * Encapsulates all Voice Activity Detection (VAD) logic.
 *
 * @param stream The main audio stream to analyze.
 * @param vadEnabled Whether VAD is currently active.
 * @param vadThreshold The dB level for VAD activation.
 * @param user The identifier for the user (e.g., "LOCAL_USER") for logging.
 * @returns Speaking states, volume levels, and VAD thresholds.
 */
export function useVoiceActivity({
  stream,
  vadThreshold,
  user,
}: UseVoiceActivityProps) {
  const vadAnalysisStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (stream) {
      const clonedStream = stream.clone();
      vadAnalysisStreamRef.current = clonedStream;
      clonedStream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
      console.log(`[${user}] Created VAD analysis stream`);
    } else {
      vadAnalysisStreamRef.current = null;
    }

    return () => {
      if (vadAnalysisStreamRef.current) {
        vadAnalysisStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
        vadAnalysisStreamRef.current = null;
      }
    };
  }, [stream, user]);

  const vadThresholds = useMemo(() => {
    return createVadThresholds(vadThreshold);
  }, [vadThreshold]);

  const {
    isSpeaking: vadIsSpeaking,
    currentVolume,
    displayVolume,
  } = useLocalVAD(vadAnalysisStreamRef.current, user, vadThresholds);

  const uiIsSpeaking = useSimpleAudioDetection(stream, user);

  return {
    vadIsSpeaking,
    uiIsSpeaking,
    currentVolume,
    displayVolume,
    vadThresholds,
  };
} 