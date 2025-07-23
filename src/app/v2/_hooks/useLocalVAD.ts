import { useEffect, useRef, useState, useMemo, useCallback } from "react";

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
  const [currentVolume, setCurrentVolume] = useState<number>(-120); // High-frequency volume for VAD logic
  const [displayVolume, setDisplayVolume] = useState<number>(-120); // Throttled volume for UI display



  // Store current thresholds in ref for immediate updates without restarting audio context
  const currentThresholdsRef = useRef<VadThresholds>(thresholds);

  // Helper function for debug logging
  const debugLog = useCallback(
    (message: string) => {
      if (DEBUG_LOGGING) {
        console.log(`[${username}] ${message}`);
      }
    },
    [username]
  );

  // Update thresholds ref when thresholds change (immediate effect)
  useEffect(() => {
    currentThresholdsRef.current = thresholds;
    debugLog(`🎯 Threshold updated immediately: ${thresholds.thresholdDb}dB`);
  }, [thresholds, debugLog]);

  // Create and configure audio context and analyser
  const setupAudioContext = useCallback((): {
    context: AudioContext;
    analyser: AnalyserNode;
  } => {
    const context = new AudioContext();
    const analyser = context.createAnalyser();

    analyser.fftSize = AUDIO_CONFIG.fftSize;
    analyser.smoothingTimeConstant = AUDIO_CONFIG.smoothingTimeConstant;

    debugLog(
      `🎛️ AudioContext created: ${context.sampleRate}Hz, ${analyser.frequencyBinCount} bins`
    );

    return { context, analyser };
  }, [debugLog]);

  // Connect audio stream to analyser
  const connectAudioStream = useCallback(
    (context: AudioContext, analyser: AnalyserNode, stream: MediaStream) => {
      const sourceNode = context.createMediaStreamSource(stream);
      sourceNode.connect(analyser);

      debugLog("🔌 Audio stream connected to analyser");

      return sourceNode;
    },
    [debugLog]
  );

  // Calculate volume in dB from time domain data (proper VAD approach)
  const calculateVolumeDb = (analyser: AnalyserNode): number => {
    const bufferLength = analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);
    
    // Get raw audio amplitude data (time domain)
    analyser.getFloatTimeDomainData(dataArray);
    
    // Calculate RMS (Root Mean Square) - proper way to average audio power
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] * dataArray[i]; // Square each sample
    }
    const rms = Math.sqrt(sum / bufferLength); // Square root of mean
    
    // Convert RMS amplitude to dB using correct formula
    return rms > 0 ? 20 * Math.log10(rms) : -100;
  };

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
    const analyser = analyserRef.current;
    const currentThresholds = currentThresholdsRef.current;

    if (!analyser) {
      return;
    }

    // Calculate volume in dB using time domain analysis
    const volumeDb = calculateVolumeDb(analyser);
    const hasAudio = checkAudioThreshold(volumeDb);

    // Update high-frequency volume for VAD logic
    setCurrentVolume(volumeDb);

    // Throttle display volume updates for UI (10 FPS = 100ms)
    const now = Date.now();
    if (now - lastDisplayUpdateRef.current > 100) {
      setDisplayVolume(volumeDb);
      lastDisplayUpdateRef.current = now;
    }

    // Debug logging every 60 frames (~1 second) to see actual dB values
    frameCountRef.current++;
    if (DEBUG_LOGGING && frameCountRef.current % 60 === 0) {
      debugLog(
        `📊 Simple dB Check: volume=${volumeDb.toFixed(1)}dB, threshold=${
          currentThresholds.thresholdDb
        }dB, speaking=${hasAudio}`
      );
    }

    // Update speaking state
    handleAudioDetection(hasAudio);

    // Schedule next detection
    animationFrameRef.current = requestAnimationFrame(detectAudioActivity);
  }, [debugLog]);



  // Start audio detection
  const startAudioDetection = useCallback(() => {
    const currentThresholds = currentThresholdsRef.current;
    debugLog("🔄 Starting simple dB threshold detection...");
    debugLog(
      `📏 Simple Threshold: ${currentThresholds.thresholdDb}dB (audio > threshold = speaking)`
    );
    debugLog("💡 Watch for debug logs every second showing actual dB values");
    debugLog(
      "⚡ Threshold updates immediately via slider - no restart needed!"
    );

    detectAudioActivity();
  }, [detectAudioActivity, debugLog]);

  // Cleanup function
  const cleanup = useCallback(() => {
    debugLog("🧹 Cleaning up audio analyzer");

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
  }, [debugLog]);

  useEffect(() => {
    if (!stream) {
      debugLog("No stream provided");
      return;
    }

    try {
      // Setup audio pipeline
      const { context, analyser } = setupAudioContext();
      const sourceNode = connectAudioStream(context, analyser, stream);

      // Store references
      audioContextRef.current = context;
      analyserRef.current = analyser;
      sourceNodeRef.current = sourceNode;

      // Start detection after short delay to let pipeline stabilize
      const startTimer = setTimeout(startAudioDetection, 1000);

      return () => {
        clearTimeout(startTimer);
        cleanup();
      };
    } catch (error) {
      debugLog(`Error setting up audio analyzer: ${error}`);
      return cleanup;
    }
  }, [
    stream,
    username,
    cleanup,
    connectAudioStream,
    debugLog,
    setupAudioContext,
    startAudioDetection,
  ]); // Removed customThresholds to prevent restart - using ref for immediate updates

  return { isSpeaking, currentVolume, displayVolume };
};
