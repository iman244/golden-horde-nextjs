import { useEffect, useRef, useState } from 'react';

// Configuration constants
const AUDIO_CONFIG = {
  fftSize: 2048,
  smoothingTimeConstant: 0.8,
  lowVolumeThreshold: 1.5,
  highVolumeThreshold: 4,
  confidenceThreshold: 4,
  historyLength: 10,
  silenceDelay: 300,
} as const;

// Optional debug logging
const DEBUG_LOGGING = process.env.NODE_ENV === 'development';

export const useAudioAnalyzer = (stream: MediaStream | null, username: string) => {
  // Refs for Web Audio API objects
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const silenceTimerRef = useRef<number>(0);

  // Audio detection state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Audio analysis data arrays
  const frequencyDataRef = useRef<Uint8Array | null>(null);
  const timeDataRef = useRef<Uint8Array | null>(null);
  const volumeHistoryRef = useRef<number[]>(new Array(AUDIO_CONFIG.historyLength).fill(0));
  const historyIndexRef = useRef<number>(0);

  // Helper function for debug logging
  const debugLog = (message: string) => {
    if (DEBUG_LOGGING) {
      console.log(`[${username}] ${message}`);
    }
  };

  // Create and configure audio context and analyser
  const setupAudioContext = (): { context: AudioContext; analyser: AnalyserNode } => {
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    
    analyser.fftSize = AUDIO_CONFIG.fftSize;
    analyser.smoothingTimeConstant = AUDIO_CONFIG.smoothingTimeConstant;
    
    debugLog(`🎛️ AudioContext created: ${context.sampleRate}Hz, ${analyser.frequencyBinCount} bins`);
    
    return { context, analyser };
  };

  // Connect audio stream to analyser
  const connectAudioStream = (context: AudioContext, analyser: AnalyserNode, stream: MediaStream) => {
    const sourceNode = context.createMediaStreamSource(stream);
    sourceNode.connect(analyser);
    
    debugLog('🔌 Audio stream connected to analyser');
    
    return sourceNode;
  };

  // Calculate volume from time domain data
  const calculateVolume = (timeData: Uint8Array): number => {
    let sum = 0;
    for (let i = 0; i < timeData.length; i++) {
      const sample = (timeData[i] - 128) / 128;
      sum += sample * sample;
    }
    return Math.sqrt(sum / timeData.length) * 100;
  };

  // Update volume history and calculate confidence score
  const updateVolumeHistory = (volume: number): number => {
    const history = volumeHistoryRef.current;
    const historyIndex = historyIndexRef.current;
    
    // Add current volume to circular buffer
    history[historyIndex] = volume;
    historyIndexRef.current = (historyIndex + 1) % history.length;
    
    // Calculate confidence score
    let audioFrames = 0;
    for (const vol of history) {
      if (vol > AUDIO_CONFIG.lowVolumeThreshold) {
        audioFrames++;
        // Bonus for strong audio
        if (vol > AUDIO_CONFIG.highVolumeThreshold) {
          audioFrames += 0.5;
        }
      }
    }
    
    return audioFrames;
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
  const detectAudioActivity = () => {
    const analyser = analyserRef.current;
    const frequencyData = frequencyDataRef.current;
    const timeData = timeDataRef.current;
    
    if (!analyser || !frequencyData || !timeData) {
      return;
    }

    // Get current audio data
    analyser.getByteFrequencyData(frequencyData);
    analyser.getByteTimeDomainData(timeData);
    
    // Calculate volume and confidence
    const volume = calculateVolume(timeData);
    const audioFrames = updateVolumeHistory(volume);
    const hasAudio = audioFrames >= AUDIO_CONFIG.confidenceThreshold;
    
    // Update speaking state
    handleAudioDetection(hasAudio);
    
    // Schedule next detection
    animationFrameRef.current = requestAnimationFrame(detectAudioActivity);
  };

  // Initialize data arrays
  const initializeDataArrays = (analyser: AnalyserNode) => {
    frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount);
    timeDataRef.current = new Uint8Array(analyser.frequencyBinCount);
  };

  // Start audio detection
  const startAudioDetection = () => {
    debugLog('🔄 Starting audio activity detection...');
    debugLog(`📏 Confidence: ${AUDIO_CONFIG.confidenceThreshold}/${AUDIO_CONFIG.historyLength} frames, Thresholds: ${AUDIO_CONFIG.lowVolumeThreshold}%/${AUDIO_CONFIG.highVolumeThreshold}%`);
    
    detectAudioActivity();
  };

  // Cleanup function
  const cleanup = () => {
    debugLog('🧹 Cleaning up audio analyzer');
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
    
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
    frequencyDataRef.current = null;
    timeDataRef.current = null;
  };

  useEffect(() => {
    if (!stream) {
      debugLog('No stream provided');
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
      
      // Initialize detection
      initializeDataArrays(analyser);
      
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
  }, [stream, username]);

  return isSpeaking;
}; 