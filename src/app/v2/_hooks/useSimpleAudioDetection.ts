import { useCallback, useEffect, useRef, useState } from "react";

// Base configuration constants
const AUDIO_CONFIG = {
  fftSize: 2048,
  smoothingTimeConstant: 0.8,
  silenceDelay: 300, // ms delay before marking as not speaking
} as const;

// Simple detection threshold for remote users (fixed, no customization)
const SIMPLE_DETECTION_THRESHOLD = -100; // dB - reasonable threshold for any audio activity

// Optional debug logging
const DEBUG_LOGGING = process.env.NODE_ENV === "development";

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
  const frequencyDataRef = useRef<Float32Array | null>(null);

  const debugLog = useCallback(
    (message: string) => {
      if (DEBUG_LOGGING) {
        console.log(`[${username}] ${message}`);
      }
    },
    [username]
  );

  // Simple volume calculation (same as complex version)
  const calculateVolumeDb = (frequencyData: Float32Array): number => {
    let sum = 0;
    let count = 0;

    for (let i = 0; i < frequencyData.length; i++) {
      const dbValue = frequencyData[i];
      if (isFinite(dbValue)) {
        sum += dbValue;
        count++;
      }
    }

    return count > 0 ? sum / count : -100;
  };

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
    const frequencyData = frequencyDataRef.current;

    if (!analyser || !frequencyData) {
      return;
    }

    analyser.getFloatFrequencyData(frequencyData);
    const volumeDb = calculateVolumeDb(frequencyData);
    const hasAudio = volumeDb > SIMPLE_DETECTION_THRESHOLD;

    handleAudioDetection(hasAudio);
    animationFrameRef.current = requestAnimationFrame(detectAudioActivity);
  }, [handleAudioDetection]);

  useEffect(() => {
    if (!stream) {
      debugLog("No stream provided");
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
      frequencyDataRef.current = new Float32Array(analyser.frequencyBinCount);

      debugLog(
        `🔄 Simple detection started (threshold: ${SIMPLE_DETECTION_THRESHOLD}dB)`
      );

      // Start detection after short delay
      const startTimer = setTimeout(() => {
        detectAudioActivity();
      }, 1000);

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

        debugLog("🧹 Simple detection cleaned up");
      };
    } catch (error) {
      debugLog(`Error in simple detection: ${error}`);
    }
  }, [stream, username, debugLog, detectAudioActivity]);

  return isSpeaking;
};
