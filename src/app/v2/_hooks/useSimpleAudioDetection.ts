import { useCallback, useEffect, useRef, useState } from "react";
import { calculateVolumeDb } from "../_utils/audioUtils";
import { createLogger } from "../_utils/logger";

// Base configuration constants
const AUDIO_CONFIG = {
  fftSize: 2048,
  smoothingTimeConstant: 0.8,
  silenceDelay: 300, // ms delay before marking as not speaking
} as const;

// Simple detection threshold for remote users (fixed, no customization)
const SIMPLE_DETECTION_THRESHOLD = -100; // dB - reasonable threshold for any audio activity

const { task: createTaskLogger } = createLogger("useSimpleAudioDetection");

/**
 * Simple audio detection for remote users
 * - Fixed threshold (-90dB)
 * - No user preferences
 * - Only returns boolean isSpeaking
 * - Lightweight and fast
 */
export const useSimpleAudioDetection = (
  stream: MediaStream | null,
  username: string
) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const silenceTimerRef = useRef<number>(0);

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Simple speaking detection logic
  const handleAudioDetection = useCallback((hasAudio: boolean) => {
    if (hasAudio) {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = 0;
      }
      setIsSpeaking(true);
    } else {
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = window.setTimeout(() => {
          setIsSpeaking(false);
          silenceTimerRef.current = 0;
        }, AUDIO_CONFIG.silenceDelay);
      }
    }
  }, []);

  // Simple detection loop
  const detectAudioActivity = useCallback(() => {
    const analyser = analyserRef.current;

    if (!analyser) {
      return;
    }

    const volumeDb = calculateVolumeDb(analyser);
    const hasAudio = volumeDb > SIMPLE_DETECTION_THRESHOLD;

    handleAudioDetection(hasAudio);
    animationFrameRef.current = requestAnimationFrame(detectAudioActivity);
  }, [handleAudioDetection]);

  useEffect(() => {
    const task = createTaskLogger("calculating audio activity");
    task.step("checking if stream is provided");
    if (!stream) {
      task.step("no stream provided");
      return;
    }

    try {
      // Setup simple audio context
      const context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = AUDIO_CONFIG.fftSize;
      analyser.smoothingTimeConstant = AUDIO_CONFIG.smoothingTimeConstant;

      const sourceNode = context.createMediaStreamSource(stream);
      sourceNode.connect(analyser);

      audioContextRef.current = context;
      analyserRef.current = analyser;
      sourceNodeRef.current = sourceNode;

      task.step(
        `Simple detection started (threshold: ${SIMPLE_DETECTION_THRESHOLD}dB)`
      );

      // Start detection after short delay
      const startTimer = setTimeout(() => {
        detectAudioActivity();
      }, 1000);
      task.end();
      return () => {
        clearTimeout(startTimer);

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        if (sourceNodeRef.current) {
          sourceNodeRef.current.disconnect();
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };
    } catch (error) {
      task.step(`Error in simple detection: ${error}`);
      task.end();
    }
  }, [stream, username, detectAudioActivity]);

  return isSpeaking;
};
