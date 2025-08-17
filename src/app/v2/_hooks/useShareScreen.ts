import { useCallback, useEffect, useState } from "react";
import { createLogger } from "../_utils/logger";
import { useDisplayMediaStream } from "./useDisplayMediaStream";

const { task } = createLogger("useShareScreen");

/**
 * useShareScreen manages share screen state.
 */
export function useShareScreen() {
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [isDisplayMediaStreamReady, setIsDisplayMediaStreamReady] = useState(false);
  const { stream, mediaError, clearMediaError, getStream, stopStream } =
    useDisplayMediaStream({
      options: {
        video: true,
        audio: false,
      },
    });
  // Toggle share screen
  const toggleShareScreen = useCallback(
    () => setIsSharingScreen((prevSharingScreen) => !prevSharingScreen),
    []
  );

  const startShareScreen = useCallback(async () => {
    const { step, end } = task("starting sharing screen");
    try {
      await getStream();
      step("sharing screen started", { status: "ok" });
    } catch (error) {
      step("error starting sharing screen", { status: "error", error });
    } finally {
      end();
    }
  }, [getStream]);

  const stopShareScreen = useCallback(() => {
    const { step, end } = task("stopping sharing screen");
    stopStream();
    setIsDisplayMediaStreamReady(false);
    step("sharing screen stopped", { status: "ok" });
    end();
  }, [stopStream]);

  useEffect(() => {
    if (isSharingScreen) {
      startShareScreen();
    } else {
      stopShareScreen();
    }
  }, [isSharingScreen, startShareScreen, stopShareScreen]);

  return {
    displayStream: stream,
    displayMediaError: mediaError,
    clearDisplayMediaError: clearMediaError,
    isSharingScreen,
    isDisplayMediaStreamReady,
    toggleShareScreen,
  };
}
