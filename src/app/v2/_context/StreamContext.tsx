"use client";
import React, {
  createContext,
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useMemo,
} from "react";
import useStream from "../_hooks/useStream";
import { useTentLogsContext } from "./TentLogsContext";
import { MediaErrorType } from "../_hooks/useUserMediaStream";
import { useTentContext } from "./TentProvider";
import { createLogger } from "../_utils/logger";
import { useVoiceChatState } from "../_hooks/useVoiceChatState";

export interface StreamContextType {
  stream: MediaStream | null;
  isSpeaking: boolean;
  addTrack: (target_user: string, pc: RTCPeerConnection) => Promise<void>;
  mediaError: MediaErrorType | null;
  clearMediaError: () => void;
  isMuted: boolean;
  toggleMute: () => void;
  setIsMuted: Dispatch<SetStateAction<boolean>>;
  isDeafened: boolean;
  toggleDeafen: () => void;
  setIsDeafened: Dispatch<SetStateAction<boolean>>;
  vadEnabled: boolean;
  toggleVad: () => void;
  vadThreshold: number;
  setVadThreshold: (threshold: number) => void;
}

const StreamContext = createContext<StreamContextType | undefined>(undefined);

const { task: createTaskLogger } = createLogger("StreamProvider");

const StreamProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { addLog } = useTentLogsContext();
  const { currentTentId } = useTentContext();

  const {
    isMuted,
    setIsMuted,
    toggleMute,
    isDeafened,
    setIsDeafened,
    toggleDeafen,
    vadEnabled,
    toggleVad,
    vadThreshold,
    setVadThreshold,
  } = useVoiceChatState();

  const { stream, isSpeaking, mediaError, clearMediaError, closeStream } =
    useStream({
      voiceState: {
        isDeafened,
        isMuted,
        vadEnabled,
        vadThreshold,
      },
      startStream: currentTentId !== null,
    });

  const hasTrack = useCallback(
    (senders: RTCRtpSender[], kind: "audio" | "video") => {
      return senders.some(
        (sender) => sender.track && sender.track.kind === kind
      );
    },
    []
  );

  const addTrack = useCallback(
    async (target_user: string, pc: RTCPeerConnection) => {
      const task = createTaskLogger(`Adding track for ${target_user}`);
      if (stream) {
        task.step("Processed stream is ready");
      } else {
        task.step("Failed task: adding track, failed to get processed stream", {
          status: "error",
          error: new Error("Failed to get processed stream"),
        });
        throw new Error("Failed to get processed stream");
      }
      const senders = pc.getSenders();

      task.step("Checking if there was an existing track for audio", {
        status: "info",
      });
      if (!hasTrack(senders, "audio")) {
        task.step("No existing audio track found, adding new track", {
          status: "info",
        });
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
        task.step(`New track added to PeerConnection for ${target_user}`, {
          status: "ok",
        });
        addLog(target_user, `Add Tracks`);
      } else {
        task.step("Track already exists, skipping.", { status: "info" });
        addLog(
          target_user,
          `Skipping addTrack: senders already present`,
          "info"
        );
      }
      task.end();
    },
    [addLog, stream, hasTrack]
  );

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      stream,
      isSpeaking,
      addTrack,
      mediaError,
      clearMediaError,
      isMuted,
      toggleMute,
      setIsMuted,
      isDeafened,
      toggleDeafen,
      setIsDeafened,
      vadEnabled,
      toggleVad,
      vadThreshold,
      setVadThreshold,
      closeStream,
    }),
    [
      stream,
      isSpeaking,
      addTrack,
      mediaError,
      clearMediaError,
      isMuted,
      toggleMute,
      setIsMuted,
      isDeafened,
      toggleDeafen,
      setIsDeafened,
      vadEnabled,
      toggleVad,
      vadThreshold,
      setVadThreshold,
      closeStream,
    ]
  );

  return (
    <StreamContext.Provider value={contextValue}>
      {children}
    </StreamContext.Provider>
  );
};

export default StreamProvider;

export const useStreamContext = () => {
  const context = useContext(StreamContext);
  if (!context) {
    throw new Error("useStreamContext must be used within a StreamProvider");
  }
  return context;
};
