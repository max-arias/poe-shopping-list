import { defineExtensionMessaging } from "@webext-core/messaging";
import type { TradeCapture } from "@/trade-dom";
import type { PurchaseHistoryItem } from "@/types";

/**
 * Messaging protocol for the PoE Shopping List extension.
 *
 * Architecture: Service Worker is the central hub.
 *   Content Script  ←──→  Service Worker  ←──→  Side Panel
 *
 * - CS → SW channels (prefixed `cs`): content scripts send data/events to the SW
 * - CS handler channels: SW relays requests to content scripts via tabId targeting
 * - SP → SW channels (prefixed `sp`): sidepanel requests data from the SW,
 *   which forwards to the active tab's content script
 * - SW → SP broadcast: `captureStatusChanged` is broadcast from SW to all
 *   extension pages when capture availability changes
 */
interface ProtocolMap {
  // ── Content Script → Service Worker ──────────────────────────────────────
  /** Content script reports capture availability change */
  csCaptureStatus(available: boolean): void;
  /** Content script sends a purchase history item */
  csPurchaseHistoryAdd(item: PurchaseHistoryItem): void;
  /** Content script requests the save-search flow (open sidepanel + trigger save) */
  csSaveSearch(): void;
  /** Content script requests the sidepanel to open */
  csOpenSidepanel(): void;

  // ── Content Script handlers (SW relays to these with tabId) ──────────────
  /** Returns capture data from the content script's DOM */
  csCaptureRead(): TradeCapture | null;
  /** Returns auto-capture data from the content script's DOM */
  csAutoCaptureRead(): TradeCapture | null;
  /** Returns the current search bar text */
  csSearchBarGet(): { text: string };

  // ── Side Panel → Service Worker ──────────────────────────────────────────
  /** Sidepanel requests capture data (SW relays to active tab's CS) */
  spCaptureRead(): TradeCapture | null;
  /** Sidepanel requests auto-capture data (SW relays to active tab's CS) */
  spAutoCaptureRead(): TradeCapture | null;
  /** Sidepanel requests search bar text (SW relays to active tab's CS) */
  spSearchBarGet(): { text: string };

  // ── Service Worker → Side Panel broadcast ───────────────────────────────
  /** SW broadcasts capture availability change to all extension pages */
  captureStatusChanged(data: { tabId: number; tabUrl: string; available: boolean }): void;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
