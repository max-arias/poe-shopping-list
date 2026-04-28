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
  chrome.runtime.onMessage.addListener((msg, sender) => {
    if (msg.type === "open-sidepanel" && sender.tab?.id) {
      // @ts-expect-error
      chrome.sidePanel?.open({ tabId: sender.tab.id });
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
