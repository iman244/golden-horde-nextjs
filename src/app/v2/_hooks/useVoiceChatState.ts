import { useCallback, useState, useRef, useEffect } from "react";

/**
 * Hook for managing voice chat state: mute, deafen, VAD enabled, and VAD threshold.
 * All state is persisted to localStorage and exposes setters/toggles.
 */
const LOCALSTORAGE_MUTED_KEY = "voicechat_isMuted";
const LOCALSTORAGE_DEAFENED_KEY = "voicechat_isDeafened";
const LOCALSTORAGE_VAD_ENABLED_KEY = "voicechat_vadEnabled";
const LOCALSTORAGE_VAD_THRESHOLD_KEY = "voicechat_vadThreshold";

const getInitialMuted = () => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(LOCALSTORAGE_MUTED_KEY);
    if (stored !== null) return stored === "true";
  }
  return false;
};
const getInitialDeafened = () => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(LOCALSTORAGE_DEAFENED_KEY);
    if (stored !== null) return stored === "true";
  }
  return false;
};
const getInitialVadEnabled = () => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(LOCALSTORAGE_VAD_ENABLED_KEY);
    if (stored !== null) return stored === "true";
  }
  return true; // Default to enabled
};
const getInitialThreshold = () => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(LOCALSTORAGE_VAD_THRESHOLD_KEY);
    if (stored !== null) return parseInt(stored, 10);
  }
  return -90; // Default to -90dB threshold
};

/**
 * useVoiceChatState manages mute, deafen, VAD enabled, and VAD threshold state with persistence.
 */
export function useVoiceChatState() {
  const [isMuted, setIsMutedState] = useState(getInitialMuted);
  const [isDeafened, setIsDeafenedState] = useState(getInitialDeafened);
  const [vadEnabled, setVadEnabledState] = useState(getInitialVadEnabled);
  const [vadThreshold, setVadThresholdState] = useState(getInitialThreshold);

  // For restoring mute state after undeafening
  const wasMutedBeforeDeafen = useRef(false);

  // Persist state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCALSTORAGE_MUTED_KEY, String(isMuted));
    }
  }, [isMuted]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCALSTORAGE_DEAFENED_KEY, String(isDeafened));
    }
  }, [isDeafened]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCALSTORAGE_VAD_ENABLED_KEY, String(vadEnabled));
    }
  }, [vadEnabled]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        LOCALSTORAGE_VAD_THRESHOLD_KEY,
        String(vadThreshold)
      );
    }
  }, [vadThreshold]);

  // Toggle mute, with undeafen logic
  const toggleMute = useCallback(() => {
    setIsMutedState((prevMuted) => {
      const newMuted = !prevMuted;
      // If unmuting while deafened, auto-undeafen
      if (!newMuted && isDeafened) {
        setIsDeafenedState(false);
      }
      return newMuted;
    });
  }, [isDeafened]);

  // Toggle deafen, with mute/restore logic
  const toggleDeafen = useCallback(() => {
    setIsDeafenedState((prevDeafened) => {
      const newDeafened = !prevDeafened;
      if (newDeafened) {
        // Store current mute state before deafening
        wasMutedBeforeDeafen.current = isMuted;
        // Deafening also mutes
        setIsMutedState(true);
      } else {
        // If undeafening, restore previous mute state
        setIsMutedState(wasMutedBeforeDeafen.current);
      }
      return newDeafened;
    });
  }, [isMuted]);

  // Toggle VAD enabled
  const toggleVad = useCallback(() => {
    setVadEnabledState((prev) => !prev);
  }, []);

  // Clamp VAD threshold between -120 and 0 dB
  const setVadThreshold = useCallback((threshold: number) => {
    const clamped = Math.max(-120, Math.min(0, threshold));
    setVadThresholdState(clamped);
  }, []);

  return {
    isMuted,
    setIsMuted: setIsMutedState,
    toggleMute,
    isDeafened,
    setIsDeafened: setIsDeafenedState,
    toggleDeafen,
    vadEnabled,
    setVadEnabled: setVadEnabledState,
    toggleVad,
    vadThreshold,
    setVadThreshold,
  };
} 