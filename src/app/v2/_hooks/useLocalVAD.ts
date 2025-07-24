import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { calculateVolumeDb } from "../_utils/audioUtils";
import { createLogger } from "../_utils/logger";

// Base configuration constants
const AUDIO_CONFIG = {
  fftSize: 2048,
  smoothingTimeConstant: 0.8,
  silenceDelay: 300, // ms delay before marking as not speaking
} as const;

// Optional debug logging
const DEBUG_LOGGING = process.env.NODE_ENV === "development";

// Simple dB threshold interface
export interface VadThresholds {
  thresholdDb: number; // Simple: if audio dB > threshold → speaking
}

const { task: createTaskLogger } = createLogger("useLocalVAD");

/**
 * Local VAD (Voice Activity Detection) for user's own microphone
 * - Customizable thresholds via user preferences
 * - Returns both isSpeaking and currentVolume
 * - Used for controlling transmission of user's audio
 * - Real-time volume monitoring for UI feedback
 */
export const useLocalVAD = (
  stream: MediaStream | null,
  username: string,
  customThresholds?: VadThresholds
) => {
  // Use custom thresholds or fallback to defaults (memoized for immediate updates)
  const thresholds = useMemo(() => {
    return (
      customThresholds || {
        thresholdDb: -90, // Default threshold
      }
    );
  }, [customThresholds]);

  // Refs for Web Audio API objects
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const silenceTimerRef = useRef<number>(0);
  const lastDisplayUpdateRef = useRef<number>(0); // For throttling display volume updates

  // Audio detection state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const currentVolumeRef = useRef<number>(-100); // High-frequency volume for VAD logic
  const [displayVolume, setDisplayVolume] = useState<number>(-100); // Throttled volume for UI display

  // Store current thresholds in ref for immediate updates without restarting audio context
  const currentThresholdsRef = useRef<VadThresholds>(thresholds);

  // Update thresholds ref when thresholds change (immediate effect)
  useEffect(() => {
    currentThresholdsRef.current = thresholds;
  }, [thresholds]);

  // Create and configure audio context and analyser
  const setupAudioContext = useCallback((): {
    context: AudioContext;
    analyser: AnalyserNode;
  } => {
    const context = new AudioContext();
    const analyser = context.createAnalyser();

    analyser.fftSize = AUDIO_CONFIG.fftSize;
    analyser.smoothingTimeConstant = AUDIO_CONFIG.smoothingTimeConstant;

    return { context, analyser };
  }, []);

  // Connect audio stream to analyser
  const connectAudioStream = useCallback(
    (context: AudioContext, analyser: AnalyserNode, stream: MediaStream) => {
      const sourceNode = context.createMediaStreamSource(stream);
      sourceNode.connect(analyser);
      return sourceNode;
    },
    []
  );

  // Simple dB threshold check - no more complex confidence scoring
  const checkAudioThreshold = (volume: number): boolean => {
    const currentThresholds = currentThresholdsRef.current;

    // Simple logic: if current volume > threshold → speaking
    return volume > currentThresholds.thresholdDb;
  };

  // Handle audio detection result
  const handleAudioDetection = (hasAudio: boolean) => {
    if (hasAudio) {
      // Clear silence timer and mark as speaking
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = 0;
      }
      setIsSpeaking(true);
    } else {
      // Start silence timer if not already running
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = window.setTimeout(() => {
          setIsSpeaking(false);
          silenceTimerRef.current = 0;
        }, AUDIO_CONFIG.silenceDelay);
      }
    }
  };

  // Main audio detection loop
  const detectAudioActivity = useCallback(() => {
    const task = createTaskLogger("detecting audio activity");
    const analyser = analyserRef.current;
    const currentThresholds = currentThresholdsRef.current;
    task.step("checking if analyser is provided");
    if (!analyser) {
      task.step("no analyser, breaking");
      task.end();
      return;
    }

    // Calculate volume in dB using time domain analysis
    const volumeDb = calculateVolumeDb(analyser);
    const hasAudio = checkAudioThreshold(volumeDb);

    // Update high-frequency volume for VAD logic
    currentVolumeRef.current = volumeDb;

    // Throttle display volume updates for UI (10 FPS = 100ms)
    const now = Date.now();
    if (now - lastDisplayUpdateRef.current > 100) {
      setDisplayVolume(volumeDb);
      lastDisplayUpdateRef.current = now;
    }

    // Debug logging every 60 frames (~1 second) to see actual dB values
    frameCountRef.current++;
    if (DEBUG_LOGGING && frameCountRef.current % 60 === 0) {
      task.step(
        `📊 Simple dB Check: volume=${volumeDb.toFixed(1)}dB, threshold=${
          currentThresholds.thresholdDb
        }dB, speaking=${hasAudio}`
      );
    }

    // Update speaking state
    handleAudioDetection(hasAudio);

    // Schedule next detection
    animationFrameRef.current = requestAnimationFrame(detectAudioActivity);
    task.end();
  }, []);

  // Start audio detection
  const startAudioDetection = useCallback(() => {
    detectAudioActivity();
  }, [detectAudioActivity]);

  // Cleanup function
  const cleanup = useCallback(() => {
    const task = createTaskLogger("cleaning up audio analyzer");
    task.step("🧹 Cleaning up audio analyzer");

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
    frameCountRef.current = 0;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = 0;
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    task.end();
  }, []);

  useEffect(() => {
    const task = createTaskLogger("no stream provided");
    task.step("checking if stream is provided");
    if (!stream) {
      task.step("No stream provided");
      return;
    }
    task.step("stream is provided, setting up audio pipeline");
    try {
      // Setup audio pipeline
      const { context, analyser } = setupAudioContext();
      const sourceNode = connectAudioStream(context, analyser, stream);

      // Store references
      audioContextRef.current = context;
      analyserRef.current = analyser;
      sourceNodeRef.current = sourceNode;
      task.step("audio pipeline set up, starting detection");
      // Start detection after short delay to let pipeline stabilize
      const startTimer = setTimeout(startAudioDetection, 1000);
      task.end();
      return () => {
        clearTimeout(startTimer);
        cleanup();
      };
    } catch (error) {
      task.step(`Error setting up audio analyzer: ${error}`, {
        status: "error",
        error,
      });
      task.end();
      return cleanup;
    }
  }, [
    stream,
    username,
    cleanup,
    connectAudioStream,
    setupAudioContext,
    startAudioDetection,
  ]); // Removed customThresholds to prevent restart - using ref for immediate updates

  return { isSpeaking, currentVolume: currentVolumeRef.current, displayVolume };
};
