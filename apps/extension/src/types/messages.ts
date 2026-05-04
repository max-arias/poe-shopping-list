import type { TradeCapture } from "./trade";
import type { Settings } from "./settings";

export type ExtMsg =
  | { type: "captureRead" }
  | { type: "autoCaptureRead" }
  | { type: "searchBarGet" }
  | { type: "captureStatus"; available: boolean }
  | { type: "open-sidepanel" }
  | { type: "settings:get" }
  | { type: "settings:set"; settings: Partial<Settings> };