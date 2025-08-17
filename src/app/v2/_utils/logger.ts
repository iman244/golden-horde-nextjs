/**
 * Centralized configuration for enabling/disabling logs for specific hooks/modules.
 * Set a key to `true` to enable logging for that module during development.
 */
const LOG_CONFIG: { [key: string]: boolean } = {
  useStream: true,
  useVoiceActivity: false,
  useUserMediaStream: true,
  useStreamTrackController: false,
  useAudioPreview: false,
  TentRTCProvider: false,
  Settings: false,
  useProcessedStream: true,
};

type LogStatus = "ok" | "error" | "info";

const STATUS_ICONS: { [key in LogStatus]: string } = {
  ok: "✅",
  error: "❌",
  info: "ℹ️",
};

/**
 * Creates a namespaced logger that is active only in development and if enabled in LOG_CONFIG.
 *
 * @param name The name of the hook or module. Must match a key in LOG_CONFIG.
 * @returns A logging object with `log` and `task` methods.
 *
 * Note: If you use the `task` method, you MUST call `end()` when the task is finished to close the console group.
 */
export const createLogger = (name: string) => {
  const isEnabled =
    process.env.NODE_ENV === "development" && LOG_CONFIG[name] === true;

  let openTask = null as null | { title: string; ended: boolean };

  const log = (...args: unknown[]) => {
    if (!isEnabled) return;
    if (openTask && !openTask.ended) {
      console.warn(
        `%c[${name}] Logger: Previous task group (\"${openTask.title}\") was not ended. Auto-ending it now.`,
        "color: orange; font-weight: bold;"
      );
      console.groupEnd();
      openTask.ended = true;
    }
    console.log(`%c[${name}]`, "color: #71717a; font-weight: bold;", ...args);
  };

  const task = (title: string) => {
    if (!isEnabled) return { step: () => {}, end: () => {} };

    if (openTask && !openTask.ended) {
      console.warn(
        `%c[${name}] Logger: Previous task group (\"${openTask.title}\") was not ended. Auto-ending it now.`,
        "color: orange; font-weight: bold;"
      );
      console.groupEnd();
      openTask.ended = true;
    }

    console.group(`%c[${name}] -- ${title} --`, "color: #71717a; font-weight: bold;");
    let stepCounter = 0;
    openTask = { title, ended: false };

    const step = (
      message: string,
      options?: { status?: LogStatus; error?: unknown }
    ) => {
      stepCounter++;
      const status = options?.status ?? "info";
      const icon = STATUS_ICONS[status];

      console.log(
        `%c[${name}]`,
        "color: #71717a; font-weight: bold;",
        `${icon} (${stepCounter}) ${message}`
      );

      if (options?.error) {
        console.error(options.error);
      }
    };

    const end = () => {
      if (!openTask || openTask.ended) return;
      console.groupEnd();
      openTask.ended = true;
    };

    return { step, end };
  };

  // Return a no-op object if logging is disabled
  if (!isEnabled) {
    return {
      log: () => {},
      task: () => ({ step: () => {}, end: () => {} }),
    };
  }

  return { log, task };
}; 