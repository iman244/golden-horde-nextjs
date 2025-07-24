import { useEffect } from "react";
import { StreamContextType } from "../_context/StreamContext";

const useChangeStreamStates = ({
  stream,
  playLocalUserAudioPreview,
  stopLocalUserAudioPreview,
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
  vadThresholds,
  uiIsSpeaking,
  vadIsSpeaking,
  currentVolume,
  displayVolume,
}: StreamContextType & {
  uiIsSpeaking: boolean;
  vadIsSpeaking: boolean;
}) => {
  const log = false;

  useEffect(() => {
    if (log) console.log("stream changed", stream);
  }, [stream, log]);

  useEffect(() => {
    if (log)
      console.log(
        "playLocalUserAudioPreview changed",
        playLocalUserAudioPreview
      );
  }, [playLocalUserAudioPreview, log]);

  useEffect(() => {
    if (log)
      console.log(
        "stopLocalUserAudioPreview changed",
        stopLocalUserAudioPreview
      );
  }, [stopLocalUserAudioPreview, log]);

  useEffect(() => {
    if (log) console.log("addTrack changed", addTrack);
  }, [addTrack, log]);

  useEffect(() => {
    if (log) console.log("mediaError changed", mediaError);
  }, [mediaError, log]);

  useEffect(() => {
    if (log) console.log("clearMediaError changed", clearMediaError);
  }, [clearMediaError, log]);

  useEffect(() => {
    if (log) console.log("isMuted changed", isMuted);
  }, [isMuted, log]);

  useEffect(() => {
    if (log) console.log("toggleMute changed", toggleMute);
  }, [toggleMute, log]);

  useEffect(() => {
    if (log) console.log("setIsMuted changed", setIsMuted);
  }, [setIsMuted, log]);

  useEffect(() => {
    if (log) console.log("isDeafened changed", isDeafened);
  }, [isDeafened, log]);

  useEffect(() => {
    if (log) console.log("toggleDeafen changed", toggleDeafen);
  }, [toggleDeafen, log]);

  useEffect(() => {
    if (log) console.log("setIsDeafened changed", setIsDeafened);
  }, [setIsDeafened, log]);

  useEffect(() => {
    if (log) console.log("vadEnabled changed", vadEnabled);
  }, [vadEnabled, log]);

  useEffect(() => {
    if (log) console.log("toggleVad changed", toggleVad);
  }, [toggleVad, log]);

  useEffect(() => {
    if (log) console.log("vadThreshold changed", vadThreshold);
  }, [vadThreshold, log]);

  useEffect(() => {
    if (log) console.log("setVadThreshold changed", setVadThreshold);
  }, [setVadThreshold, log]);

  useEffect(() => {
    if (log) console.log("vadThresholds changed", vadThresholds);
  }, [vadThresholds, log]);

  useEffect(() => {
    if (log) console.log("uiIsSpeaking changed", uiIsSpeaking);
  }, [uiIsSpeaking, log]);

  useEffect(() => {
    if (log) console.log("vadIsSpeaking changed", vadIsSpeaking);
  }, [vadIsSpeaking, log]);

  useEffect(() => {
    if (log) console.log("currentVolume changed", currentVolume);
  }, [currentVolume, log]);

  useEffect(() => {
    if (log) console.log("displayVolume changed", displayVolume);
  }, [displayVolume, log]);

  return null;
};

export default useChangeStreamStates;
