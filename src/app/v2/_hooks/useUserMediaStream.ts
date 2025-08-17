import { useCallback, useRef, useState } from "react";

export type MediaErrorType =
  | "NotAllowedError"
  | "NotFoundError"
  | "NotReadableError"
  | "OverconstrainedError"
  | "SecurityError"
  | "AbortError"
  | string;

/**
 * A hook to manage a user's media stream from navigator.mediaDevices.getUserMedia.
 * It handles requesting the stream, managing its lifecycle, and handling errors.
 *
 * @param constraints The MediaStreamConstraints to use when requesting the stream.
 * @param enabled Whether the stream should be actively requested and maintained.
 * @returns An object containing the stream, any media error, a function to clear the error,
 * and a function to manually get the stream.
 */
export const useUserMediaStream = ({
  constraints,
}: {
  constraints: MediaStreamConstraints;
}) => {
//   log("Hook initialized", { enabled });
  const streamRef = useRef<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<MediaErrorType | null>(null);

  const getStream = useCallback(async () => {
    if (
      streamRef.current &&
      !streamRef.current.getTracks().some((t) => t.readyState === "ended")
    ) {
      return streamRef.current;
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = newStream;
      setMediaError(null);
      return newStream;
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
          type = `Unknown media error: ${err.name}`;
        }
      } else {
        type = "Unknown media error";
      }
      setMediaError(type);
      console.error(`useUserMediaStream Error: ${type}`, err);
      throw err;
    }
  }, [constraints]);


  const clearMediaError = useCallback(() => {
    setMediaError(null);
  }, []);

  return { stream: streamRef.current, mediaError, clearMediaError, getStream };
}; 