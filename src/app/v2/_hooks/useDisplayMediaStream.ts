import { useCallback, useEffect, useState } from "react";

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
  onended,
}: {
  options?: DisplayMediaStreamOptions;
  onended?: (ev: Event) => void;
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<DisplayMediaErrorType | null>(
    null
  );

  useEffect(()=>{
    console.log("stream in useDisplayMediaStream changed", stream)
  },[stream])

  const getStream = useCallback(async (): Promise<MediaStream | undefined> => {
    try {
      const newStream = await navigator.mediaDevices.getDisplayMedia(options);
      if (onended) {
        newStream.getVideoTracks()[0].onended = onended;
      }

      setStream(newStream);
      setMediaError(null);
      return newStream;
    } catch (err) {
      const error = err as Error;
      const errorType: DisplayMediaErrorType = [
        "NotAllowedError",
        "NotFoundError",
        "NotReadableError",
        "OverconstrainedError",
        "SecurityError",
        "AbortError",
      ].includes(error.name)
        ? (error.name as DisplayMediaErrorType)
        : "UnknownError";

      setMediaError(errorType);
      throw err;
    }
  }, [options, onended]);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const clearMediaError = useCallback(() => {
    setMediaError(null);
  }, []);

  return { stream, mediaError, clearMediaError, getStream, stopStream };
};
