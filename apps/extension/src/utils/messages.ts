import { defineExtensionMessaging } from "@webext-core/messaging";
import type { TradeCapture } from "@/trade-dom";
import type { PurchaseHistoryItem } from "@/types";

interface ProtocolMap {
  captureRead: () => TradeCapture | null;
  autoCaptureRead: () => TradeCapture | null;
  searchBarGet: () => { text: string };
  captureStatus: (available: boolean) => void;
  purchaseHistoryAdd: (item: PurchaseHistoryItem) => void;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
