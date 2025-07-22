import React, { useMemo } from "react";
import { useTentRTCContext } from "../_context/TentRTCContext";
import { FiX } from "react-icons/fi";

const errorMessages: Record<string, string> = {
  NotAllowedError: "Microphone access was denied. Please check your browser permissions.",
  NotFoundError: "No microphone was found. Please connect a microphone and try again.",
  NotReadableError: "Your microphone is already in use or not working. Please close other applications that may be using it.",
};

const MediaErrorModal = () => {
  const { mediaError, clearMediaError, retryAddTrack } = useTentRTCContext();

  const errorMessage = useMemo(() => {
    if (!mediaError) return "";
    return errorMessages[mediaError] || `Microphone error: ${mediaError}`;
  }, [mediaError]);

  if (!mediaError) return;

  return (
    <>
      <div className="v2-modal-overlay" onClick={clearMediaError} />
      <div
        className="v2-modal relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-error-title"
      >
        {/* Close icon button top right */}
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-white bg-transparent rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-yellow-400 z-10"
          onClick={clearMediaError}
          aria-label="Close"
          type="button"
        >
          <FiX size={22} />
        </button>
        <p id="media-error-title" className="mb-4 text-center">
          {errorMessage}
        </p>
        <div className="flex flex-col gap-2">
            <button
              className="auth-btn-primary w-full"
              onClick={async () => {
                await retryAddTrack();
              }}
            >
              Retry
            </button>
        </div>
      </div>
    </>
  );
};

export default MediaErrorModal;
