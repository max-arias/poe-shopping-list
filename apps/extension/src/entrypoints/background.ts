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

  // Must be registered inside defineBackground so it runs only in the real extension
  // context, not during WXT's build-time pre-rendering (fake-browser doesn't implement it)
  chrome.webRequest.onHeadersReceived.addListener(
    (details) => {
      const h = (name: string) =>
        details.responseHeaders?.find((r) => r.name.toLowerCase() === name)?.value;

      const retryAfter = h("retry-after");
      if (retryAfter) {
        retryAfterDeadline = Date.now() + parseInt(retryAfter) * 1000;
        console.log(`[bg] Rate limited — retry after ${retryAfter}s`);
      }

      const rules = h("x-rate-limit-rules")?.split(",").map((r) => r.trim()) ?? ["ip"];
      for (const rule of rules) {
        const limitHeader = h(`x-rate-limit-${rule}`);
        const stateHeader = h(`x-rate-limit-${rule}-state`);
        if (!limitHeader || !stateHeader) continue;

        const limitWindows = limitHeader.split(",");
        const stateWindows = stateHeader.split(",");

        tradeRateLimit[rule] = limitWindows.map((lw, i) => {
          const [maxHits, windowSecs, restrictSecs] = lw.split(":").map(Number);
          const sw = stateWindows[i] ?? "0:0:0";
          const [currentHits, , activeRestrictSecs] = sw.split(":").map(Number);
          return {
            maxHits,
            windowMs: windowSecs * 1000,
            restrictMs: restrictSecs * 1000,
            currentHits,
            activeRestrictMs: activeRestrictSecs * 1000,
          };
        });
      }
    },
    { urls: ["https://www.pathofexile.com/api/trade/*"] },
    ["responseHeaders"],
  );
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

// ── Rate-limit tracker ────────────────────────────────────────────────────────
//
// PoE API uses dynamic rate limiting communicated via response headers:
//   X-Rate-Limit-Rules: ip,account          (comma-delimited rule names)
//   X-Rate-Limit-ip: 150:60:60,300:120:120  (one or more windows: maxHits:windowSecs:restrictSecs)
//   X-Rate-Limit-ip-State: 45:60:0,90:120:0 (mirrors limit — currentHits:windowSecs:activeRestrictSecs)
//   Retry-After: 30                          (seconds to wait; present on 429 responses)
//
// Limits are dynamic and can change. Exceeding limits or excessive 4xx responses
// risks access revocation. We must parse every window of every rule.

interface RateLimitWindow {
  maxHits: number;
  windowMs: number;
  restrictMs: number;
  currentHits: number;
  activeRestrictMs: number;
}

// rule name → all windows for that rule
const tradeRateLimit: Record<string, RateLimitWindow[]> = {};
let retryAfterDeadline = 0; // absolute ms timestamp; 0 = no active restriction

async function waitForRateLimit(): Promise<void> {
  // Hard restriction from Retry-After header (429 response)
  if (retryAfterDeadline > Date.now()) {
    const wait = retryAfterDeadline - Date.now() + 500;
    console.log(`[bg] Rate limit cooldown — waiting ${Math.ceil(wait / 1000)}s`);
    await delay(wait);
    retryAfterDeadline = 0;
    return;
  }

  // Soft throttle: check every window of every rule
  // If usage >75% on any window, space requests at (window / maxHits) × 1.2
  let maxDelayMs = 0;
  for (const [rule, windows] of Object.entries(tradeRateLimit)) {
    for (const w of windows) {
      if (w.maxHits <= 0) continue;
      const usage = w.currentHits / w.maxHits;
      if (usage > 0.75) {
        const needed = Math.ceil((w.windowMs / w.maxHits) * 1.2);
        console.log(
          `[bg] ${rule} window ${w.windowMs / 1000}s at ${Math.round(usage * 100)}% — need ${needed}ms gap`,
        );
        maxDelayMs = Math.max(maxDelayMs, needed);
      }
    }
  }
  if (maxDelayMs > 0) await delay(maxDelayMs);
}

// ── POC helpers ────────────────────────────────────────────────────────────────

async function pocOpenTradeTab(url: string): Promise<{ capture: unknown; tabUrl: string }> {
  await waitForRateLimit();

  const tab = await browser.tabs.create({ url, active: false });
  const tabId = tab.id!;

  await waitForTabComplete(tabId);
  await delay(1500); // let trade XHR results settle

  // If we got rate-limited during page load, wait it out before capturing
  if (retryAfterDeadline > Date.now()) await waitForRateLimit();

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

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
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
