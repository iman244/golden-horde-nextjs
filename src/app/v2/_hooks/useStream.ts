import { useCallback, useRef, useState } from "react";
import { addLogType } from "./useKeyedLogs";

const useStream = ({ addLog }: { addLog: addLogType }) => {
  const [mediaError, setMediaError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream>(null);
  const addTrack = useCallback(
    async (target_user: string, pc: RTCPeerConnection) => {
      try {
        if (!streamRef.current) {
          streamRef.current = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
        }
        const tracks = streamRef.current.getTracks();
        tracks.forEach((t) => pc.addTrack(t, streamRef.current!));
        addLog(target_user, "Add Tracks");
      } catch (err) {
        let message: string;
        if (err && typeof err === "object" && "name" in err) {
          switch (err.name) {
            case "NotAllowedError":
              message = "Microphone permission denied by user.";
              break;
            case "NotFoundError":
              message = "No microphone found.";
              break;
            case "NotReadableError":
              message = "Microphone is already in use or not working.";
              break;
            default:
              message = `getUserMedia error: ${err.name}`;
          }
        } else {
          message = `Unknown getUserMedia error: ${err}`;
        }
        addLog(target_user, message, "error");
        setMediaError(message);

        throw err; // rethrow if you want to handle it further up
      }
    },
    [addLog, streamRef]
  );

  const clearMediaError = useCallback(() => {
    setMediaError(null);
  }, []);

  return { addTrack, mediaError, clearMediaError };
};

export default useStream;
