export default defineBackground(() => {
  // ── Side panel activation ─────────────────────────────────────────────────

  // Let Chrome open the panel automatically on icon click — avoids user gesture issues with sidePanel.open()
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

  // Open sidepanel on request from content script ribbon (synchronous — preserves user gesture)
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "open-sidepanel" && sender.tab?.id) {
      // @ts-expect-error
      chrome.sidePanel?.open({ tabId: sender.tab.id });
      return;
    }

    // POC: open a trade URL in a background tab, wait for load, return capture, close
    if (msg.type === "ninja-poc:open-trade-tab") {
      pocOpenTradeTab(msg.url).then(sendResponse);
      return true; // keep message channel open for async response
    }
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
    // @ts-expect-error
    await chrome.sidePanel?.setOptions?.({ tabId, enabled, path: "sidepanel.html" });
  } catch {}
}

// ── POC helpers ────────────────────────────────────────────────────────────────

async function pocOpenTradeTab(url: string): Promise<{ capture: unknown; tabUrl: string }> {
  const tab = await browser.tabs.create({ url, active: false });
  const tabId = tab.id!;

  await waitForTabComplete(tabId);
  await new Promise((r) => setTimeout(r, 1000)); // wait for trade XHR results

  let capture: unknown = null;
  try {
    const { sendMessage } = await import("../utils/messages");
    capture = await sendMessage("autoCaptureRead", undefined, tabId);
  } catch (e) {
    console.log("[bg] autoCaptureRead failed:", e);
  }

  const finalTab = await browser.tabs.get(tabId).catch(() => null);
  const tabUrl = finalTab?.url ?? url;
  await browser.tabs.remove(tabId).catch(() => {});

  console.log("[bg] pocOpenTradeTab done:", { tabUrl, capture });
  return { capture, tabUrl };
}

function waitForTabComplete(tabId: number, timeoutMs = 30_000): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    const listener = (id: number, info: browser.tabs.TabChangeInfo) => {
      if (id === tabId && info.status === "complete") {
        clearTimeout(timer);
        browser.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    browser.tabs.onUpdated.addListener(listener);
  });
}
