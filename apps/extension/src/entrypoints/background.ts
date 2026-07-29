import { onMessage, sendMessage, type TradePageInfo } from "../utils/messages";
import { DEFAULT_SETTINGS, SettingsSchema } from "@/types";
import { resetLegacyStorage } from "@/types/storage";

const TRADE_HOME_URL = "https://www.pathofexile.com/trade";

export default defineBackground(() => {
  const reset = () =>
    void resetLegacyStorage((legacy, current) => {
      const currentSettings = SettingsSchema.safeParse(current);
      if (currentSettings.success) return currentSettings.data;
      const legacySettings = SettingsSchema.safeParse(legacy);
      return legacySettings.success ? legacySettings.data : DEFAULT_SETTINGS;
    });
  reset();
  // The action opens the panel on a supported trade page; elsewhere it takes
  // the user to the trade site first.
  // @ts-expect-error — chrome.sidePanel is MV3-only
  chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: false });
  browser.action.onClicked.addListener(async (tab: { id?: number; url?: string }) => {
    if (tab.id && isTradeUrl(tab.url)) {
      // @ts-expect-error — chrome.sidePanel is MV3-only
      await chrome.sidePanel?.open?.({ tabId: tab.id });
    } else if (tab.id) {
      await browser.tabs.update(tab.id, { url: TRADE_HOME_URL });
    } else {
      await browser.tabs.create({ url: TRADE_HOME_URL });
    }
  });

  onMessage("spTradePageInfo", async (): Promise<TradePageInfo> => {
    const tabId = await getActiveTabId();
    if (!tabId) return { supported: false, url: "", title: "" };
    try {
      return await sendMessage("csTradePageInfo", undefined, tabId);
    } catch {
      return { supported: false, url: "", title: "" };
    }
  });

  browser.runtime.onInstalled.addListener(() => {
    reset();
    void initSidePanels();
  });
  browser.runtime.onStartup.addListener(() => {
    reset();
    void initSidePanels();
  });
  browser.tabs.onActivated.addListener(({ tabId }) => void updateSidePanel(tabId));
  browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === "complete") void updateSidePanel(tabId);
  });
});

function isTradeUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.replace(/^www\./, "") === "pathofexile.com" &&
      parsed.pathname.startsWith("/trade/")
    );
  } catch {
    return false;
  }
}

async function getActiveTabId(): Promise<number | undefined> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}

async function initSidePanels(): Promise<void> {
  for (const tab of await browser.tabs.query({})) {
    if (tab.id) await updateSidePanel(tab.id, tab.url);
  }
}

async function updateSidePanel(tabId: number, url?: string): Promise<void> {
  if (url === undefined) {
    try {
      url = (await browser.tabs.get(tabId)).url;
    } catch {
      return;
    }
  }
  try {
    // @ts-expect-error — chrome.sidePanel is MV3-only
    await chrome.sidePanel?.setOptions?.({
      tabId,
      enabled: isTradeUrl(url),
      path: "sidepanel.html",
    });
  } catch {}
}
