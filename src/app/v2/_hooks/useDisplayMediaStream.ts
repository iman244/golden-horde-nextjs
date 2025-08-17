import { useCallback, useState } from "react";

export type DisplayMediaErrorType =
  | "NotAllowedError"
  | "NotFoundError"
  | "NotReadableError"
  | "OverconstrainedError"
  | "SecurityError"
  | "AbortError"
  | string;

/**
 * A hook to manage a user's display media stream from navigator.mediaDevices.getDisplayMedia.
 * It handles requesting the stream, managing its lifecycle, and handling errors.
 *
 * @param options The DisplayMediaStreamOptions to use when requesting the stream.
 * @returns An object containing the stream, any media error, a function to clear the error,
 * and a function to manually get the stream.
 */
export const useDisplayMediaStream = ({
    options,
}: {
    options?: DisplayMediaStreamOptions;
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<DisplayMediaErrorType | null>(null);

  const getStream = useCallback(async () => {
    if (
      stream &&
      !stream.getTracks().some((t) => t.readyState === "ended")
    ) {
      return stream;
    }

    try {
      const newStream = await navigator.mediaDevices.getDisplayMedia(options);
      setStream(newStream);
      setMediaError(null);
      return newStream;
    } catch (err) {
      let type: DisplayMediaErrorType;
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
          type = `Unknown display media error: ${err.name}`;
        }
      } else {
        type = "Unknown display media error";
      }
      setMediaError(type);
      console.error(`useShareScreenStream Error: ${type}`, err);
      throw err;
    }
  }, [options, stream]);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, []);

  const clearMediaError = useCallback(() => {
    setMediaError(null);
  }, []);

  return { stream, mediaError, clearMediaError, getStream, stopStream };
}; 