import { sendMessage } from "./messages";

export type DebugLogLevel = "debug" | "info" | "warn" | "error";

export interface DebugLogEntry {
  timestamp: number;
  level: DebugLogLevel;
  source: string;
  step: string;
  message: string;
  url?: string;
  data?: unknown;
}

export function logDebug(
  source: string,
  step: string,
  message: string,
  data?: unknown,
  level: DebugLogLevel = "debug",
): void {
  const entry: DebugLogEntry = {
    timestamp: Date.now(),
    level,
    source,
    step,
    message,
    ...(typeof location !== "undefined" ? { url: location.href } : {}),
    ...(data === undefined ? {} : { data: sanitizeForLog(data) }),
  };

  sendMessage("csDebugLog", entry).catch(() => {
    // If the service worker is unavailable, still leave a local breadcrumb.
    console[level === "error" ? "error" : level === "warn" ? "warn" : "debug"]("[poe-sl]", entry);
  });
}

function sanitizeForLog(value: unknown): unknown {
  try {
    return JSON.parse(
      JSON.stringify(value, (_key, entry) => {
        if (typeof entry === "string" && entry.length > 600) {
          return `${entry.slice(0, 600)}… (${entry.length} chars)`;
        }
        return entry;
      }),
    );
  } catch {
    return String(value);
  }
}
