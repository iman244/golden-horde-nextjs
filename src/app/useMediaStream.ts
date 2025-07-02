import { useState, useCallback } from "react";

export type MediaType = "audio" | "video" | "both";

export function useMediaStream() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getMedia = useCallback(async (type: MediaType = "audio") => {
    setLoading(true);
    setError(null);
    try {
      let constraints: MediaStreamConstraints;
      if (type === "audio") constraints = { audio: true };
      else if (type === "video") constraints = { video: true };
      else constraints = { audio: true, video: true };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setLoading(false);
      return mediaStream;
    } catch (err: unknown) {
      let message = "Failed to get media stream";
      function isErrorWithMessage(e: unknown): e is { message: string } {
        return (
          typeof e === "object" &&
          e !== null &&
          "message" in e &&
          typeof (e as { message: unknown }).message === "string"
        );
      }
      if (isErrorWithMessage(err)) {
        message = err.message;
      }
      setError(message);
      setLoading(false);
      return null;
    }
  }, []);

  const stopMedia = useCallback(() => {
    setStream((current) => {
      if (current) {
        current.getTracks().forEach((track) => track.stop());
      }
      return null;
    });
  }, []);

  return { stream, error, loading, getMedia, stopMedia };
} 