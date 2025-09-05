import { useCallback, useEffect, useMemo, useState } from "react";
import { createLogger } from "../_utils/logger";
import { useDisplayMediaStream } from "./useDisplayMediaStream";

const { task } = createLogger("useShareScreen");

/**
 * useShareScreen manages share screen state.
 */
export function useShareScreen() {
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [isDisplayMediaStreamReady, setIsDisplayMediaStreamReady] =
    useState(false);

  const options = useMemo(
    () => ({
      video: true,
      audio: false,
    }),
    []
  );

  const onended = useCallback(() => setIsSharingScreen(false), []);
  const { stream, mediaError, clearMediaError, getStream, stopStream } =
    useDisplayMediaStream({
      options,
      onended,
    });

  useEffect(() => {
    console.log("stream in useShareScreen changed", stream);
  }, [stream]);

  const isStreamActive = useCallback(
    (mediaStream: MediaStream | null): boolean => {
      return (
        mediaStream?.getTracks().some((track) => track.readyState === "live") ??
        false
      );
    },
    []
  );

  // Toggle share screen
  const toggleShareScreen = useCallback(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert("Screen sharing is not supported on this device or browser.");
      return;
    }
    setIsSharingScreen((prevSharingScreen) => !prevSharingScreen);
  }, []);

  const startShareScreen = useCallback(async () => {
    const { step, end } = task("starting sharing screen");
    try {
      step("starting sharing screen", { status: "ok" });
      const stream = await getStream();
      if (!stream) {
        throw new Error("Failed to get display media stream");
      }
      step("sharing screen started", { status: "ok" });
    } catch (error) {
      step("error starting sharing screen", { status: "error", error });
      throw error;
    } finally {
      end();
    }
  }, [getStream]);

  useEffect(() => {
    const { step, end } = task("checking stream");
    if (isStreamActive(stream)) {
      setIsDisplayMediaStreamReady(true);
      step("stream is active", { status: "ok" });
    } else {
      setIsDisplayMediaStreamReady(false);
      step("stream is not active", { status: "error" });
    }
    end();
  }, [stream, isStreamActive]);

  const stopShareScreen = useCallback(() => {
    const { step, end } = task("stopping sharing screen");
    stopStream();
    step("sharing screen stopped", { status: "ok" });
    end();
  }, [stopStream]);

  useEffect(() => {
    console.log("isSharingScreen", isSharingScreen);
    console.log("isDisplayMediaStreamReady", isDisplayMediaStreamReady);
    if (isSharingScreen && !isDisplayMediaStreamReady) {
      console.log("Starting share screen");
      startShareScreen()
        .then(() => {
          setIsDisplayMediaStreamReady(true);
        })
        .catch(() => {
          console.log("start share screen failed");
          setIsDisplayMediaStreamReady(false);
        });
    }
    if (!isSharingScreen && isDisplayMediaStreamReady) {
      console.log("Stopping share screen");
      stopShareScreen();
    }
  }, [
    isSharingScreen,
    isDisplayMediaStreamReady,
    startShareScreen,
    stopShareScreen,
  ]);

  return {
    displayStream: stream,
    displayMediaError: mediaError,
    clearDisplayMediaError: clearMediaError,
    isSharingScreen,
    isDisplayMediaStreamReady,
    toggleShareScreen,
  };
}
