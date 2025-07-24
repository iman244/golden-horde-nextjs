import { useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook for Web Audio API gain control
 * Provides smooth audio transitions for VAD without affecting manual mute/deafen logic
 */
export const useAudioGainControl = (
  inputStream: MediaStream | null,
  enabled: boolean = false
) => {
  // Web Audio API components
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const processedStreamRef = useRef<MediaStream | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
    
    if (destinationRef.current) {
      destinationRef.current.disconnect();
      destinationRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    processedStreamRef.current = null;
  }, []);

  // Setup Web Audio pipeline
  useEffect(() => {
    if (!inputStream || !enabled) {
      // Clean up if disabled or no stream
      cleanup();
      return;
    }

    try {
      // Create Web Audio context and nodes
      const audioContext = new AudioContext();
      const gainNode = audioContext.createGain();
      const sourceNode = audioContext.createMediaStreamSource(inputStream);
      const destination = audioContext.createMediaStreamDestination();
      
      // Resume AudioContext if needed (browser autoplay policy)
      if (audioContext.state === 'suspended') {
        console.log('[AudioGainControl] Resuming suspended AudioContext...');
        audioContext.resume().then(() => {
          console.log('[AudioGainControl] AudioContext resumed, state:', audioContext.state);
        });
      }

      // Connect pipeline: source -> gain -> destination
      sourceNode.connect(gainNode);
      gainNode.connect(destination);

      // Start with zero gain (will be controlled externally)
      gainNode.gain.value = 0;

      // Store references
      audioContextRef.current = audioContext;
      gainNodeRef.current = gainNode;
      sourceNodeRef.current = sourceNode;
      destinationRef.current = destination;
      processedStreamRef.current = destination.stream;


      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).testProcessedStream = destination.stream;
    } catch (error) {
      console.warn('[AudioGainControl] Failed to create Web Audio pipeline:', error);
      cleanup();
    }

    return cleanup;
  }, [inputStream, enabled, cleanup]);

  // Function to smoothly set gain
  const setGain = useCallback((targetGain: number, fadeTimeMs: number = 50) => {
    if (!gainNodeRef.current || !audioContextRef.current) {
      console.log('[AudioGainControl] setGain called but no gain node or audio context');
      return;
    }

    const gainNode = gainNodeRef.current;
    const audioContext = audioContextRef.current;
    const now = audioContext.currentTime;
    const fadeTime = fadeTimeMs / 1000; // Convert to seconds

    // Clamp gain between 0 and 1
    const clampedGain = Math.max(0, Math.min(1, targetGain));

    try {
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(clampedGain, now + fadeTime);
    } catch (error) {
      console.warn('[AudioGainControl] Failed to set gain:', error);
    }
  }, []);

  // Get current gain value
  const getCurrentGain = useCallback(() => {
    return gainNodeRef.current?.gain.value ?? 0;
  }, []);

  return {
    processedStream: processedStreamRef.current,
    setGain,
    getCurrentGain,
    isReady: !!gainNodeRef.current,
  };
}; 