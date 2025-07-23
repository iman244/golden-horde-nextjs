import { useCallback, useRef, useState, useEffect, useMemo } from "react";
import { addLogType } from "./useKeyedLogs";
import { useLocalVAD, VadThresholds } from "./useLocalVAD";

export type MediaErrorType =
  | "NotAllowedError"
  | "NotFoundError"
  | "NotReadableError"
  | "OverconstrainedError"
  | "SecurityError"
  | "AbortError"
  | string;

function hasTrack(senders: RTCRtpSender[], kind: "audio" | "video") {
  //   console.log("hasTrack senders", senders);
  //   console.log(
  //     "senders.some((sender) => sender.track && sender.track.kind === kind)",
  //     senders.some((sender) => sender.track && sender.track.kind === kind)
  //   );
  return senders.some((sender) => sender.track && sender.track.kind === kind);
}

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

// Simple dB threshold - no conversion needed
const createVadThresholds = (thresholdDb: number): VadThresholds => {
  return {
    thresholdDb: Math.max(-100, Math.min(0, thresholdDb)), // Clamp between -120dB and 0dB
  };
};

const useStream = ({
  addLog,
  startStream,
  currentTentId,
}: {
  addLog: addLogType;
  startStream: boolean;
  currentTentId: string | number | null;
}) => {
  const streamRef = useRef<MediaStream>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const updateStream = useCallback((stream: MediaStream) => {
    streamRef.current = stream;
    setStream(stream);
  }, []);

  const [mediaError, setMediaError] = useState<MediaErrorType | null>(null);
  const [isMuted, setIsMuted] = useState(getInitialMuted);
  const [isDeafened, setIsDeafened] = useState(getInitialDeafened);
  const [vadEnabled, setVadEnabled] = useState(getInitialVadEnabled);
  const [vadThreshold, setVadThreshold] = useState(getInitialThreshold);

  // Create a separate stream reference for VAD analysis to avoid feedback loop
  const vadAnalysisStreamRef = useRef<MediaStream | null>(null);

  // Track if we're currently in preview mode to prevent multiple calls
  const isPlayingPreview = useRef(false);

  // Store preview stream to apply same VAD logic
  const previewStreamRef = useRef<MediaStream | null>(null);

  // Create VAD thresholds (memoized for immediate updates)
  const vadThresholds = useMemo(() => {
    return createVadThresholds(vadThreshold);
  }, [vadThreshold]);

  // Use local VAD for user's transmission control (separate from transmission control)
  const { isSpeaking, currentVolume, displayVolume } = useLocalVAD(
    vadAnalysisStreamRef.current,
    "LOCAL_USER",
    vadThresholds
  );

  useEffect(() => {
    console.log("isSpeaking useEffect stream", stream);
    console.log("isSpeaking useEffect isSpeaking", isSpeaking);
  }, [isSpeaking, stream]);

  useEffect(() => {
    console.log("startStream useEffect startStream", startStream);
  }, [startStream]);

  useEffect(() => {
    console.log("currentTentId useEffect currentTentId", currentTentId);
  }, [currentTentId]);

  const getStream = useCallback(async () => {
    if (streamRef.current) {
      return streamRef.current;
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    streamRef.current = stream;
    updateStream(stream);
    return stream;
  }, [updateStream]);

  useEffect(() => {
    if (startStream) {
      getStream();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [startStream, getStream]);

  const toggleVad = useCallback(() => {
    setVadEnabled((prev) => !prev);
  }, []);

  const setVadThresholdValue = useCallback((threshold: number) => {
    // Clamp threshold between -120dB and 0dB
    const clampedThreshold = Math.max(-120, Math.min(0, threshold));
    setVadThreshold(clampedThreshold);
  }, []);

  const toggleMute = useCallback(() => {
    // Prevent toggling during preview mode
    if (isPlayingPreview.current) {
      console.log("Cannot toggle mute during audio preview");
      return;
    }

    setIsMuted((prevMuted) => {
      const newMuted = !prevMuted;

      // If unmuting while deafened, auto-undeafen
      if (!newMuted && isDeafened) {
        setIsDeafened(false);
      }

      return newMuted;
    });
  }, [isDeafened]);

  // Separate refs for preview functionality
  const wasMutedBefore = useRef(false);

  // Separate refs for deafen functionality
  const wasMutedBeforeDeafen = useRef(false);

  const toggleDeafen = useCallback(() => {
    // Prevent toggling during preview mode
    if (isPlayingPreview.current) {
      console.log("Cannot toggle deafen during audio preview");
      return;
    }

    setIsDeafened((prevDeafened) => {
      const newDeafened = !prevDeafened;

      if (newDeafened) {
        // Store current mute state before deafening
        wasMutedBeforeDeafen.current = isMuted;
        // Deafening also mutes
        setIsMuted(true);
      } else {
        // If undeafening, restore previous mute state
        setIsMuted(wasMutedBeforeDeafen.current);
      }

      return newDeafened;
    });
  }, [isMuted]);

  // Centralized track control based on state changes
  useEffect(() => {
    if (!streamRef.current) {
      return; // No stream to control
    }

    const audioTracks = streamRef.current.getAudioTracks();

    // Determine what track.enabled should be based on current state
    let shouldTrackBeEnabled = false;

    if (isMuted || isDeafened) {
      // Manual mute/deafen always results in disabled tracks
      shouldTrackBeEnabled = false;
    } else if (!vadEnabled) {
      // VAD disabled - tracks should always be enabled
      shouldTrackBeEnabled = true;
    } else {
      // VAD enabled and not manually muted - follow speaking detection
      shouldTrackBeEnabled = isSpeaking;
    }

    // Apply the calculated state to all audio tracks
    audioTracks.forEach((track) => {
      track.enabled = shouldTrackBeEnabled;
    });

    // Debug logging in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[LOCAL_USER] Track Control: enabled=${shouldTrackBeEnabled} (muted=${isMuted}, deafened=${isDeafened}, vad=${vadEnabled}, speaking=${isSpeaking})`
      );
    }
  }, [isMuted, isDeafened, vadEnabled, isSpeaking]);

  // Separate track control for preview stream using original states
  useEffect(() => {
    if (!previewStreamRef.current || !isPlayingPreview.current) {
      return; // No preview stream to control
    }

    const previewAudioTracks = previewStreamRef.current.getAudioTracks();

    // Use original states for preview logic, not the forced muted/deafened states
    const originalMuted = wasMutedBefore.current;

    // Determine what preview track.enabled should be based on original state + VAD
    let shouldPreviewBeEnabled = false;

    // if (originalMuted || originalDeafened) {
    //   // If user was originally muted/deafened, preview should be silent
    //   shouldPreviewBeEnabled = false;
    // } else
    if (!vadEnabled) {
      // VAD disabled - preview should always play
      shouldPreviewBeEnabled = true;
    } else {
      // VAD enabled and not originally muted - follow speaking detection
      shouldPreviewBeEnabled = isSpeaking;
    }

    // Apply the calculated state to preview tracks
    previewAudioTracks.forEach((track) => {
      track.enabled = shouldPreviewBeEnabled;
    });

    // Debug logging in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[PREVIEW] Track Control: enabled=${shouldPreviewBeEnabled} (originalMuted=${originalMuted}, vad=${vadEnabled}, speaking=${isSpeaking})`
      );
    }
  }, [vadEnabled, isSpeaking]); // Don't include current muted/deafened states as deps

  // Update VAD analysis stream when main stream changes
  useEffect(() => {
    if (stream) {
      // Clone the stream for analysis to avoid feedback loop
      const clonedStream = stream.clone();
      vadAnalysisStreamRef.current = clonedStream;

      // Ensure analysis stream tracks are always enabled
      clonedStream.getAudioTracks().forEach((track) => {
        track.enabled = true; // Always keep analysis tracks enabled
      });

      console.log(`[LOCAL_USER] Created VAD analysis stream`);
    } else {
      vadAnalysisStreamRef.current = null;
    }

    // Cleanup cloned stream when component unmounts
    return () => {
      if (vadAnalysisStreamRef.current) {
        vadAnalysisStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
        vadAnalysisStreamRef.current = null;
      }
    };
  }, [stream]);

  const addTrack = useCallback(
    async (target_user: string, pc: RTCPeerConnection) => {
      try {
        if (!streamRef.current) {
          const newStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });

          streamRef.current = newStream;
          updateStream(newStream);

          // Immediately apply current mute/deafen state to new stream
          newStream.getAudioTracks().forEach((track) => {
            if (isMuted || isDeafened) {
              track.enabled = false;
            } else if (!vadEnabled) {
              track.enabled = true;
            }
            // If VAD enabled, the centralized useEffect will handle it
          });
        }

        const senders = pc.getSenders();
        const audioTrack = streamRef.current.getAudioTracks()[0];
        // const videoTrack = streamRef.current.getVideoTracks()[0];
        // console.log("audioTrack", audioTrack);
        if (audioTrack && !hasTrack(senders, "audio")) {
          const tracks = streamRef.current.getTracks();
          const retryStream = tracks.some((t) => t.readyState == "ended");
          if (retryStream) {
            const newStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
            streamRef.current = newStream;
            updateStream(newStream);

            // Immediately apply current mute/deafen state to retry stream
            newStream.getAudioTracks().forEach((track) => {
              if (isMuted || isDeafened) {
                track.enabled = false;
              } else if (!vadEnabled) {
                track.enabled = true;
              }
              // If VAD enabled, the centralized useEffect will handle it
            });
          }
          tracks.forEach((t) => pc.addTrack(t, streamRef.current!));
          //   console.log("addTrack tracks", tracks);
          addLog(target_user, `Add Tracks`);
        } else {
          //   console.log("senders", senders);
          addLog(
            target_user,
            `Skipping addTrack: senders already present, track=${JSON.stringify(
              {
                id: senders[0].track?.id,
                kind: senders[0].track?.kind,
                label: senders[0].track?.label,
              },
              null,
              2
            )}`,
            "info"
          );
        }
        setMediaError(null);
      } catch (err) {
        let type: MediaErrorType;
        if (err && typeof err === "object" && "name" in err) {
          if (
            err.name === "NotAllowedError" ||
            err.name === "NotFoundError" ||
            err.name === "NotReadableError" ||
            err.name === "OverconstrainedError" ||
            err.name === "SecurityError" ||
            err.name === "AbortError"
          ) {
            type = err.name;
          } else {
            type = JSON.stringify(err, null, 2);
          }
          console.error("mediaErrorType err.name", err.name);
        } else {
          console.error("mediaErrorType err unknown without name", err);
          type = JSON.stringify(err, null, 2);
        }
        setMediaError(type);
        addLog(target_user, type, "error");
        throw err;
      }
    },
    [addLog, streamRef, isMuted, isDeafened, updateStream, vadEnabled]
  );

  const clearMediaError = useCallback(() => {
    setMediaError(null);
  }, []);

  // Persist state to localStorage when they change
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

  const playLocalUserAudioPreview = useCallback(async () => {
    // Prevent multiple calls and only save states once
    // wasMutedBefore.current = isMuted;
    // wasDeafenedBefore.current = isDeafened;
    if (!isPlayingPreview.current) {
      isPlayingPreview.current = true;
    }

    // console.log("playLocalUserAudio wasMutedBefore.current", wasMutedBefore.current);
    // console.log("playLocalUserAudio wasDeafenedBefore.current", wasDeafenedBefore.current);

    // setIsMuted(true);
    // setIsDeafened(true);

    let clonedStream: MediaStream;
    if (streamRef.current) {
      clonedStream = streamRef.current.clone();
    } else {
      const newStream = await getStream();
      clonedStream = newStream.clone();
    }

    // Store preview stream for VAD control
    previewStreamRef.current = clonedStream;
    return clonedStream;
  }, [getStream]);

  useEffect(() => {
    console.log("isMuted, isDeafened", isMuted, isDeafened);
  }, [isMuted, isDeafened]);

  // Function specifically for local audio preview - only restores states
  const stopLocalUserAudioPreview = useCallback(() => {
    if (isPlayingPreview.current) {
    //   console.log("stopLocalUserAudioPreview wasMutedBefore.current", wasMutedBefore.current);
    //   console.log("stopLocalUserAudioPreview wasDeafenedBefore.current", wasDeafenedBefore.current);
    //   setIsMuted(wasMutedBefore.current);
    //   setIsDeafened(wasDeafenedBefore.current);
      isPlayingPreview.current = false;

      // Clean up preview stream reference
      previewStreamRef.current = null;
    }
  }, []);

  // Function for stream cleanup when leaving tent
//   const stopLocalUserAudio = useCallback(() => {
//     if (streamRef.current && !startStream) {
//       console.log("stopLocalUserAudio streamRef.current", streamRef.current);
//       console.log("stopLocalUserAudio startStream", startStream);
//       streamRef.current.getTracks().forEach((track) => track.stop());
//       streamRef.current = null;
//     }
//     setIsMuted(wasMutedBefore.current);
//     setIsDeafened(wasDeafenedBefore.current);
//   }, [startStream]);

  return {
    stream,
    playLocalUserAudioPreview,
    stopLocalUserAudioPreview,
    addTrack,
    mediaError,
    clearMediaError,
    isMuted,
    toggleMute,
    setIsMuted,
    isDeafened,
    toggleDeafen,
    setIsDeafened,
    vadEnabled,
    toggleVad,
    vadThreshold,
    setVadThreshold: setVadThresholdValue,
    vadThresholds, // Expose current thresholds for debugging
    isSpeaking, // Pass through for visual indicators
    currentVolume, // High-frequency volume for VAD logic
    displayVolume, // Throttled volume for UI display
  };
};

export default useStream;
