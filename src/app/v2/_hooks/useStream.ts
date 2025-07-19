import { useCallback, useRef, useState } from "react";
import { addLogType } from "./useKeyedLogs";

export type MediaErrorType =
  | "NotAllowedError"
  | "NotFoundError"
  | "NotReadableError"
  | "OverconstrainedError"
  | "SecurityError"
  | "AbortError"
  | string;

function hasTrack(senders: RTCRtpSender[], kind: "audio" | "video") {
  console.log("hasTrack senders", senders);
  console.log(
    "senders.some((sender) => sender.track && sender.track.kind === kind)",
    senders.some((sender) => sender.track && sender.track.kind === kind)
  );
  return senders.some((sender) => sender.track && sender.track.kind === kind);
}

const useStream = ({ addLog }: { addLog: addLogType }) => {
  // Removed mediaError state
  const [mediaError, setMediaError] = useState<MediaErrorType | null>(null);

  const streamRef = useRef<MediaStream>(null);
  const addTrack = useCallback(
    async (target_user: string, pc: RTCPeerConnection) => {
      try {
        if (!streamRef.current) {
          streamRef.current = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
        }

        const senders = pc.getSenders();
        const audioTrack = streamRef.current.getAudioTracks()[0];
        // const videoTrack = streamRef.current.getVideoTracks()[0];
        console.log("audioTrack", audioTrack);
        if (audioTrack && !hasTrack(senders, "audio")) {
          const tracks = streamRef.current.getTracks();
          const retryStream = tracks.some((t) => t.readyState == "ended");
          if (retryStream) {
            streamRef.current = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
          }
          tracks.forEach((t) => pc.addTrack(t, streamRef.current!));
          console.log("addTrack tracks", tracks);
          addLog(target_user, `Add Tracks`);
        } else {
          console.log("senders", senders);
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
    [addLog, streamRef]
  );

  const clearMediaError = useCallback(() => {
    setMediaError(null);
  }, []);

  return { addTrack, mediaError, clearMediaError };
};

export default useStream;
