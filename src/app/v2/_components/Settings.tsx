import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  memo,
  useCallback,
} from "react";
import clsx from "clsx";
import { useStreamContext } from "../_context/StreamContext";
import useStream from "../_hooks/useStream";
import { createLogger } from "../_utils/logger";
import { HiMiniSpeakerWave } from "react-icons/hi2";
import { useTentRTCContext } from "../_context/TentRTCContext";
import { useAuth } from "@/app/context/AuthContext";

// Pure helper function - moved outside component for performance
const getSensitivityLabel = (threshold: number): string => {
  if (threshold > -60) return "Very Strict";
  if (threshold > -90) return "Moderate";
  return "Very Sensitive";
};

const { task: createTaskLogger } = createLogger("Settings");

/**
 * Settings component for voice activity detection (VAD) configuration
 * Provides real-time volume monitoring, threshold adjustment, and audio preview functionality
 */
const Settings = () => {
  // Context and state
  const {
    vadEnabled,
    vadThreshold,
    setVadThreshold,
    toggleVad,
    isDeafened,
    setIsDeafened,
    isMuted,
    setIsMuted,
  } = useStreamContext();

  // Local state and refs
  const [playUserAudio, setPlayUserAudio] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const wasMutedBefore = useRef<boolean | null>(null);
  const wasDeafenedBefore = useRef<boolean | null>(null);
  const { username } = useAuth()
  const { connections } = useTentRTCContext();

  const { isSpeaking, stream, closeStream, displayVolume } = useStream({
    voiceState: {
      isDeafened: false,
      isMuted: false,
      vadEnabled,
      vadThreshold,
    },
    startStream: playUserAudio,
  });

  // Effect 1: Manage mute/deafen state during audio preview
  useEffect(() => {
    const task = createTaskLogger(
      "handling mute/deafen side effect of preview audio stream"
    );
    // Store original states only once when starting preview
    if (playUserAudio) {
      task.step("user audio preview is playing");
      if (wasMutedBefore.current === null) {
        task.step(
          `storing the current mute/deafen state in the ref: ${isMuted} ${isDeafened}`,
          {
            status: "ok",
          }
        );
        wasMutedBefore.current = isMuted;
        wasDeafenedBefore.current = isDeafened;
      } else {
        task.step(
          `the current mute/deafen state is already stored in the ref: ${wasMutedBefore.current} ${wasDeafenedBefore.current}`,
          {
            status: "ok",
          }
        );
      }
      task.step(
        "user audio preview is playing, muting and deafening the user",
        {
          status: "ok",
        }
      );
      // Mute and deafen to prevent feedback during preview
      setIsDeafened(true);
      setIsMuted(true);
    } else if (playUserAudio === false) {
      task.step("user audio preview is not playing");
      // Restore original states when stopping preview
      if (
        wasMutedBefore.current !== null &&
        wasMutedBefore.current !== isMuted
      ) {
        task.step("restoring the original mute state", {
          status: "ok",
        });
        setIsMuted(wasMutedBefore.current);
      }
      if (
        wasDeafenedBefore.current !== null &&
        wasDeafenedBefore.current !== isDeafened
      ) {
        task.step("restoring the original deafen state", {
          status: "ok",
        });
        setIsDeafened(wasDeafenedBefore.current);
      }

      // Reset refs for next preview session
      task.step("resetting the refs for next preview session", {
        status: "ok",
      });
      wasMutedBefore.current = null;
      wasDeafenedBefore.current = null;
    }
    task.end();
  }, [playUserAudio, isMuted, isDeafened, setIsDeafened, setIsMuted]);

  const startAudioPreview = useCallback(async () => {
    const task = createTaskLogger("starting audio preview");
    const audioElement = audioRef.current;
    try {
      if (audioElement && stream && audioElement.srcObject !== stream) {
        task.step("setting the stream preview to the audio element");
        audioElement.srcObject = stream;
        await audioElement.play();
      }
    } catch (error) {
      task.step("error starting audio preview", { status: "error", error });
      console.error("Error starting audio preview:", error);
    }
    task.end();
  }, [stream]);

  const stopAudioPreview = useCallback(() => {
    const task = createTaskLogger("stopping audio preview");
    const audioElement = audioRef.current;
    task.step("stopping audio preview");
    closeStream();
    if (audioElement) {
      task.step("stopping audio preview, pausing the audio element");
      audioElement.srcObject = null;
      audioElement.pause();
    }
    task.end();
  }, [closeStream]);

  // Effect 2: Manage audio stream and playback
  useEffect(() => {
    const task = createTaskLogger(
      "handling audio stream side effect of preview audio stream"
    );
    if (!stream) {
      task.step("no stream, skipping");
      task.end();
      return;
    }
    task.step("stream is ready, starting audio preview");

    if (playUserAudio) {
      task.step("user audio preview is playing, starting audio preview");
      startAudioPreview();
    } else if (playUserAudio === false) {
      task.step("user audio preview is not playing, stopping audio preview");
      stopAudioPreview();
    }

    task.end();

    return stopAudioPreview;
  }, [stream, playUserAudio, closeStream, startAudioPreview, stopAudioPreview]);

  // Volume calculations (throttled to reduce re-renders)
  const roundedVolume = useMemo(() => {
    if (playUserAudio) {
      return Math.round(displayVolume);
    }
    return 0;
  }, [displayVolume, playUserAudio]);
  const volumePercentage = useMemo(() => {
    if (playUserAudio) {
      return Math.max(0, Math.min(100, ((roundedVolume + 100) / 100) * 100));
    }
    return 0;
  }, [roundedVolume, playUserAudio]);

  // JSX Components
  const VadToggleSection = useCallback(
    () => (
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Input Sensitivity</span>
          <button
            onClick={toggleVad}
            className={clsx(
              "text-xs px-2 py-1 rounded transition-colors",
              vadEnabled
                ? "bg-yellow-400 text-gray-900"
                : "bg-gray-600 text-gray-300"
            )}
          >
            {vadEnabled ? "AUTO" : "ALWAYS"}
          </button>
        </div>
      </div>
    ),
    [toggleVad, vadEnabled]
  );

  const AudioPreviewSection = useCallback(
    () => (
      <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
            <span className="text-sm text-gray-300 font-medium">
              Audio Preview
            </span>
          </div>
          <button
            className={clsx(
              "px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200",
              playUserAudio
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-yellow-400 text-gray-900 hover:bg-yellow-300"
            )}
            onClick={() => setPlayUserAudio((prev) => !prev)}
          >
            {playUserAudio ? "Stop Preview" : "Start Preview"}
          </button>
        </div>
        {playUserAudio && (
          <div className="mt-3 text-xs text-gray-400 flex items-center gap-2">
            <HiMiniSpeakerWave className="w-4 h-4" />
            <span>Listening to your microphone input</span>
          </div>
        )}
        {playUserAudio && <audio ref={audioRef} autoPlay />}
      </div>
    ),
    [playUserAudio, setPlayUserAudio]
  );

  return (
    <div className="p-4">
      <h3 className="v2-card-title">Voice Settings</h3>

      <VadToggleSection />

      <div className="space-y-4">
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
              isSpeaking
                ? "bg-green-600 text-white"
                : "bg-gray-600 text-gray-300"
            )}
          >
            {isSpeaking ? "TRANSMITTING" : "SILENT"}
          </span>
        </div>

        <div className="relative w-full">
          {/* Volume indicator background */}
          <div className="absolute inset-0 h-2 bg-gray-700 rounded-lg overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-300 transition-all duration-75"
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
            className="relative w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer z-10 volume-slider transform -translate-y-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:bg-yellow-300 [&::-webkit-slider-thumb]:transition-colors [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-yellow-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:hover:bg-yellow-400"
            disabled={!vadEnabled}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>Sensitive (-100dB)</span>
          <span>Strict (0dB)</span>
        </div>

        <div className="text-xs text-gray-400 text-center">
          Lower values = More sensitive • Higher values = Less sensitive
        </div>

        <div className="text-xs text-gray-400">
          Audio louder than {vadThreshold}dB will trigger transmission
        </div>

        <div className="text-xs text-gray-500 text-center">
          Yellow bar shows current volume level in real-time
        </div>
      </div>

      {username == "iman244" && <div
        className="p-2 bg-blue-400 w-fit cursor-pointer"
        onClick={() => {
          connections.forEach((value, key) => {
            console.log(
              `Senders for ${key}`,
              value.pc
                .getSenders()
                .map(
                  (sender) =>
                    `${sender.track?.label} ${sender.track?.readyState}`
                )
            );

            console.log(
              `Receivers for ${key}`,
              value.pc
                .getReceivers()
                .map(
                  (receiver) =>
                    `${receiver.track?.label} ${receiver.track?.readyState}`
                )
            );
          });
        }}
      >
        log the seders and receivers
      </div>}

      <AudioPreviewSection />
    </div>
  );
};

export default memo(Settings);
