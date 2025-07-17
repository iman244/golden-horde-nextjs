import { useEffect, useState } from "react";

export function useStream(constraints: MediaStreamConstraints = { audio: true, video: true }) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    navigator.mediaDevices.getUserMedia(constraints)
      .then((mediaStream) => {
        if (isMounted) {
          setStream(mediaStream);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
      setStream((prev) => {
        prev?.getTracks().forEach((track) => track.stop());
        return null;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(constraints)]);

  return { stream, error, loading };
}
