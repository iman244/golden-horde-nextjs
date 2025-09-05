"use client";
import React, {
  createContext,
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import useStream from "../_hooks/useStream";
import { useTentLogsContext } from "./TentLogsContext";
import { MediaErrorType } from "../_hooks/useUserMediaStream";
import { useTentContext } from "./TentProvider";
import { createLogger } from "../_utils/logger";
import { useVoiceChatState } from "../_hooks/useVoiceChatState";
import { useShareScreen } from "../_hooks/useShareScreen";

export interface StreamContextType {
  audioStream: MediaStream | null;
  displayStream: MediaStream | null;
  isAudioStreamReady: boolean;
  isDisplayMediaStreamReady: boolean;
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
  isSharingScreen: boolean;
  toggleShareScreen: () => void;
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

  const {
    isSharingScreen,
    toggleShareScreen,
    displayStream,
    isDisplayMediaStreamReady,
  } = useShareScreen();

    useEffect(() => {
      console.log("stream in StreamProvider changed", displayStream);
    }, [displayStream]);
  

  const {
    stream: audioStream,
    isSpeaking,
    mediaError,
    clearMediaError,
    closeStream,
    isAudioStreamReady,
  } = useStream({
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
      if (audioStream) {
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
        audioStream.getTracks().forEach((track) => {
          pc.addTrack(track, audioStream);
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
    [addLog, audioStream, hasTrack]
  );

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      audioStream,
      displayStream,
      isAudioStreamReady,
      isDisplayMediaStreamReady,
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
      isSharingScreen,
      toggleShareScreen,
    }),
    [
      audioStream,
      displayStream,
      isAudioStreamReady,
      isDisplayMediaStreamReady,
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
      isSharingScreen,
      toggleShareScreen,
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
