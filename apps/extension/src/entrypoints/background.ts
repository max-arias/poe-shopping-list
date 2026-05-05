import { onMessage, sendMessage } from "../utils/messages";
import type { PurchaseHistoryItem } from "../types";

export default defineBackground(() => {
  // ── Side panel activation ─────────────────────────────────────────────────

  // Let Chrome open the panel automatically on icon click
  // @ts-expect-error — chrome.sidePanel is MV3-only
  chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true });

  // Sync side panel enabled state for all already-open tabs on service worker start
  browser.runtime.onInstalled.addListener(() => initSidePanelForCurrentTabs());
  browser.runtime.onStartup.addListener(() => initSidePanelForCurrentTabs());

  // Enable the side panel only on relevant pages (trade + build guide sites)
  browser.tabs.onActivated.addListener(async ({ tabId }) => {
    try {
      const tab = await browser.tabs.get(tabId);
      await setSidePanelEnabled(tabId, isSidePanelUrl(tab.url));
    } catch {}
  });

  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
      try {
        await setSidePanelEnabled(tabId, isSidePanelUrl(tab.url));
      } catch {}
    }
  });

  // ── Content Script → Service Worker handlers ─────────────────────────────

  // CS reports capture availability → broadcast to sidepanel
  onMessage("csCaptureStatus", (message) => {
    const tabId = message.sender.tab?.id;
    const tabUrl = message.sender.tab?.url;
    if (!tabId || !tabUrl) return;

    sendMessage("captureStatusChanged", {
      tabId,
      tabUrl,
      available: message.data,
    }).catch(() => {}); // sidepanel may not be open — swallow error
  });

  // CS sends purchase history item → persist to storage
  onMessage("csPurchaseHistoryAdd", async (message) => {
    const item = message.data;
    const stored = await browser.storage.local.get("purchaseHistory");
    const current: PurchaseHistoryItem[] = Array.isArray(stored.purchaseHistory)
      ? stored.purchaseHistory
      : [];
    const idx = current.findIndex((i) => i.listingId === item.listingId);
    if (idx >= 0) {
      current[idx] = item;
    } else {
      current.unshift(item);
    }
    await browser.storage.local.set({ purchaseHistory: current });
  });

  // CS requests save-search flow → open sidepanel + trigger save
  onMessage("csSaveSearch", async (message) => {
    const tabId = message.sender.tab?.id;
    if (tabId) {
      // @ts-expect-error — chrome.sidePanel is MV3-only
      await chrome.sidePanel?.open?.({ tabId });
    }
    await browser.storage.local.set({ triggerSaveSearch: Date.now() });
  });

  // CS requests sidepanel open
  onMessage("csOpenSidepanel", async (message) => {
    const tabId = message.sender.tab?.id;
    if (tabId) {
      // @ts-expect-error — chrome.sidePanel is MV3-only
      await chrome.sidePanel?.open?.({ tabId });
    }
  });

  // ── Side Panel → Service Worker handlers (relay to Content Script) ──────

  // SP requests capture data → relay to active tab's CS
  onMessage("spCaptureRead", async () => {
    const tabId = await getActiveTabId();
    if (!tabId) return null;
    return await sendMessage("csCaptureRead", undefined, tabId);
  });

  // SP requests auto-capture data → relay to active tab's CS
  onMessage("spAutoCaptureRead", async () => {
    const tabId = await getActiveTabId();
    if (!tabId) return null;
    return await sendMessage("csAutoCaptureRead", undefined, tabId);
  });

  // SP requests search bar text → relay to active tab's CS
  onMessage("spSearchBarGet", async () => {
    const tabId = await getActiveTabId();
    if (!tabId) return { text: "" };
    return await sendMessage("csSearchBarGet", undefined, tabId);
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function isSidePanelUrl(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes("pathofexile.com/trade") || url.includes("pobb.in/") || url.includes("maxroll.gg/")
  );
}

async function initSidePanelForCurrentTabs(): Promise<void> {
  const tabs = await browser.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) await setSidePanelEnabled(tab.id, isSidePanelUrl(tab.url));
  }
}

async function setSidePanelEnabled(tabId: number, enabled: boolean): Promise<void> {
  try {
    // @ts-expect-error — chrome.sidePanel is MV3-only
    await chrome.sidePanel?.setOptions?.({
      tabId,
      enabled,
      path: "sidepanel.html",
    });
  } catch {}
}

async function getActiveTabId(): Promise<number | undefined> {
  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  return tab?.id;
}
