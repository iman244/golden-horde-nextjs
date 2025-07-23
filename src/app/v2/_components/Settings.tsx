import React, { useEffect, useState, useRef, useMemo, memo, useCallback } from "react";
import { useTentRTCContext } from "../_context/TentRTCContext";
import clsx from "clsx";

// Pure helper function - moved outside component for performance
const getSensitivityLabel = (threshold: number): string => {
  if (threshold > -60) return "Very Strict";
  if (threshold > -90) return "Moderate";
  return "Very Sensitive";
};

/**
 * Settings component for voice activity detection (VAD) configuration
 * Provides real-time volume monitoring, threshold adjustment, and audio preview functionality
 */
const Settings = () => {
  // Context and state
  const {
    playLocalUserAudioPreview,
    stopLocalUserAudioPreview,
    vadEnabled,
    vadThreshold,
    setVadThreshold,
    toggleVad,
    displayVolume,
    isDeafened,
    setIsDeafened,
    isMuted,
    setIsMuted,
  } = useTentRTCContext();

  // Local state and refs
  const [playUserAudio, setPlayUserAudio] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const wasMutedBefore = useRef<boolean | null>(null);
  const wasDeafenedBefore = useRef<boolean | null>(null);

  // Effect 1: Manage mute/deafen state during audio preview
  useEffect(() => {
    // Store original states only once when starting preview
    if (wasMutedBefore.current === null) {
      wasMutedBefore.current = isMuted;
      wasDeafenedBefore.current = isDeafened;
    }

    if (playUserAudio) {
      // Mute and deafen to prevent feedback during preview
      setIsDeafened(true);
      setIsMuted(true);
    } else if (playUserAudio === false) {
      // Restore original states when stopping preview
      if (wasMutedBefore.current !== null) {
        setIsMuted(wasMutedBefore.current);
      }
      if (wasDeafenedBefore.current !== null) {
        setIsDeafened(wasDeafenedBefore.current);
      }

      // Reset refs for next preview session
      wasMutedBefore.current = null;
      wasDeafenedBefore.current = null;
    }
  }, [playUserAudio, isMuted, isDeafened, setIsDeafened, setIsMuted]);

  // Effect 2: Manage audio stream and playback
  useEffect(() => {
    const audioElement = audioRef.current;

    const startAudioPreview = async () => {
      try {
        const stream = await playLocalUserAudioPreview();
        
        if (audioElement && stream && audioElement.srcObject !== stream) {
          audioElement.srcObject = stream;
          await audioElement.play();
        }
      } catch (error) {
        console.error("Error starting audio preview:", error);
      }
    };

    const stopAudioPreview = () => {
      stopLocalUserAudioPreview();
      if (audioElement) {
        audioElement.srcObject = null;
        audioElement.pause();
      }
    };

    if (playUserAudio) {
      startAudioPreview();
    } else if (playUserAudio === false) {
      stopAudioPreview();
    }

    return stopAudioPreview;
  }, [playUserAudio, playLocalUserAudioPreview, stopLocalUserAudioPreview]);

  // Volume calculations (throttled to reduce re-renders)
  const roundedVolume = useMemo(() => Math.round(displayVolume), [displayVolume]);
  const volumePercentage = useMemo(() => {
    return Math.max(0, Math.min(100, ((roundedVolume + 100) / 100) * 100));
  }, [roundedVolume]);

  // Computed values
  const isTransmitting = roundedVolume > vadThreshold;

  // JSX Components
  const VadToggleSection = useCallback(() => (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Input Sensitivity</span>
        <button
          onClick={toggleVad}
          className={clsx(
            "text-xs px-2 py-1 rounded transition-colors",
            vadEnabled
              ? "bg-green-600 text-white"
              : "bg-gray-600 text-gray-300"
          )}
        >
          {vadEnabled ? "AUTO" : "ALWAYS"}
        </button>
      </div>
    </div>
  ), [toggleVad, vadEnabled]);

  const AudioPreviewSection = useCallback(() => (
    <div className="flex justify-between items-center">
      <button
        className="text-xs text-gray-400"
        onClick={() => setPlayUserAudio((prev) => !prev)}
      >
        {playUserAudio ? "Stop User Audio" : "Play User Audio"}
      </button>
      {playUserAudio && <audio ref={audioRef} autoPlay />}
    </div>
  ), [playUserAudio, setPlayUserAudio]);

  return (
    <div className="flex flex-col gap-2 flex-1 bg-[#181a20]">
      <VadToggleSection />
      <div className="bg-[#0f1015] p-3 rounded-lg border border-gray-700">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">
              Threshold: {vadThreshold}dB
            </span>
            <span className="text-xs text-gray-500">
              {getSensitivityLabel(vadThreshold)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">
              Current Volume: {roundedVolume}dB
            </span>
                          <span
                className={clsx(
                  "text-xs px-2 py-1 rounded",
                  isTransmitting
                    ? "bg-green-600 text-white"
                    : "bg-gray-600 text-gray-300"
                )}
              >
                {isTransmitting ? "TRANSMITTING" : "SILENT"}
              </span>
          </div>
          <div className="relative w-full">
            {/* Volume indicator background */}
            <div className="absolute inset-0 h-2 bg-gray-700 rounded-lg overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-75"
                style={{
                  width: `${volumePercentage}%`,
                  opacity: vadEnabled ? 0.6 : 0.3,
                }}
              />
            </div>

            {/* Threshold slider */}
            <input
              type="range"
              min="-100"
              max="0"
              step="1"
              value={vadThreshold}
              onChange={(e) => setVadThreshold(parseInt(e.target.value))}
              className="relative w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer z-10 volume-slider"
              disabled={!vadEnabled}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Sensitive (-100dB)</span>
            <span>Strict (0dB)</span>
          </div>
          <div className="text-xs text-gray-400 text-center mt-1">
            Lower values = More sensitive • Higher values = Less sensitive
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Audio louder than {vadThreshold}dB will trigger transmission
          </div>
          <div className="text-xs text-gray-500 text-center mt-1">
            Blue bar shows current volume level in real-time
          </div>
        </div>
      </div>
      <AudioPreviewSection />
    </div>
  );
};

export default memo(Settings);
