import { useCallback, useRef, useState, useEffect } from "react";
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
//   console.log("hasTrack senders", senders);
//   console.log(
//     "senders.some((sender) => sender.track && sender.track.kind === kind)",
//     senders.some((sender) => sender.track && sender.track.kind === kind)
//   );
  return senders.some((sender) => sender.track && sender.track.kind === kind);
}

const LOCALSTORAGE_MUTED_KEY = "voicechat_isMuted";
const LOCALSTORAGE_DEAFENED_KEY = "voicechat_isDeafened";

const getInitialMuted = () => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(LOCALSTORAGE_MUTED_KEY);
    if (stored !== null) return stored === "true";
  }
  return false;
};
const getInitialDeafened = () => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(LOCALSTORAGE_DEAFENED_KEY);
    if (stored !== null) return stored === "true";
  }
  return false;
};

const useStream = ({ addLog }: { addLog: addLogType }) => {
    const streamRef = useRef<MediaStream>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const updateStream = useCallback((stream: MediaStream) => {
        streamRef.current = stream;
        setStream(stream);

    }, []);

  const [mediaError, setMediaError] = useState<MediaErrorType | null>(null);
  const [isMuted, setIsMuted] = useState(getInitialMuted);
  const [isDeafened, setIsDeafened] = useState(getInitialDeafened);

  const toggleMute = useCallback(() => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      const willUnmute = audioTracks.some((track) => !track.enabled);
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      // After toggling, update isMuted state based on first track
      const firstTrack = streamRef.current.getAudioTracks()[0];
      setIsMuted(firstTrack ? !firstTrack.enabled : false);
      // If currently deafened and user is unmuting, auto-undeafen
      if (isDeafened && willUnmute) {
        setIsDeafened(false);
      }
    } else {
      // No stream: just toggle isMuted state
      setIsMuted((prev) => !prev);
      // If currently deafened and user is unmuting, auto-undeafen
      if (isDeafened) {
        setIsDeafened(false);
      }
    }
  }, [setIsMuted, isDeafened]);

  const wasMutedBeforeDeafen = useRef(false);
  const toggleDeafen = useCallback(() => {
    setIsDeafened((d) => {
      const next = !d;
      if (next) {
        // If deafen is being activated, also mute mic
        wasMutedBeforeDeafen.current = isMuted;
        if (streamRef.current) {
          streamRef.current.getAudioTracks().forEach((track) => {
            if (track.enabled) track.enabled = false;
          });
          // Update isMuted state
          const firstTrack = streamRef.current.getAudioTracks()[0];
          setIsMuted(firstTrack ? !firstTrack.enabled : false);
        } else {
          // No stream: just set muted state
          setIsMuted(true);
        }
      } else {
        // If deafen is being deactivated, unmute if user was not muted before deafen
        if (!wasMutedBeforeDeafen.current) {
          if (streamRef.current) {
            streamRef.current.getAudioTracks().forEach((track) => {
              if (!track.enabled) track.enabled = true;
            });
            // Update isMuted state
            const firstTrack = streamRef.current.getAudioTracks()[0];
            setIsMuted(firstTrack ? !firstTrack.enabled : false);
          } else {
            // No stream: just set unmuted state
            setIsMuted(false);
          }
        }
      }
      return next;
    });
  }, [isMuted]);


  const addTrack = useCallback(
    async (target_user: string, pc: RTCPeerConnection) => {
      try {
        if (!streamRef.current) {

          const newStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });

          streamRef.current = newStream;
          updateStream(newStream);
          // When stream is acquired, set tracks.enabled according to isMuted
          streamRef.current.getAudioTracks().forEach((track) => {
            track.enabled = !isMuted;
          });
        }

        const senders = pc.getSenders();
        const audioTrack = streamRef.current.getAudioTracks()[0];
        // const videoTrack = streamRef.current.getVideoTracks()[0];
        // console.log("audioTrack", audioTrack);
        if (audioTrack && !hasTrack(senders, "audio")) {
          const tracks = streamRef.current.getTracks();
          const retryStream = tracks.some((t) => t.readyState == "ended");
          if (retryStream) {
            const newStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
            streamRef.current = newStream;
            updateStream(newStream);
          }
          if (isMuted) {
            streamRef.current.getAudioTracks().forEach((track) => {
              track.enabled = false;
            });
          }
          tracks.forEach((t) => pc.addTrack(t, streamRef.current!));
        //   console.log("addTrack tracks", tracks);
          addLog(target_user, `Add Tracks`);
        } else {
        //   console.log("senders", senders);
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
    [addLog, streamRef, isMuted]
  );

  const clearMediaError = useCallback(() => {
    setMediaError(null);
  }, []);

  // Persist isMuted and isDeafened to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCALSTORAGE_MUTED_KEY, String(isMuted));
    }
  }, [isMuted]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCALSTORAGE_DEAFENED_KEY, String(isDeafened));
    }
  }, [isDeafened]);

  return {
    stream,
    addTrack,
    mediaError,
    clearMediaError,
    isMuted,
    toggleMute,
    isDeafened,
    toggleDeafen,
  };
};

export default useStream;
