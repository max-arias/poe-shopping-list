import { defineExtensionMessaging } from "@webext-core/messaging";
import type { TradeCapture } from "@poe-sl/trade-dom";

interface ProtocolMap {
  captureRead: () => TradeCapture | null;
  autoCaptureRead: () => TradeCapture | null;
  searchBarGet: () => { text: string };
  captureStatus: (available: boolean) => void;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
