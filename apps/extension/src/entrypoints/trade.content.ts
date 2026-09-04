import type { TradePageInfo } from "../utils/messages";

export default defineContentScript({
  matches: ["https://www.pathofexile.com/trade/*", "https://pathofexile.com/trade/*"],
  runAt: "document_idle",

  async main() {
    const { onMessage } = await import("../utils/messages");
    onMessage(
      "csTradePageInfo",
      (): TradePageInfo => ({
        supported: isSupportedTradeSearch(window.location.href),
        url: window.location.href,
        itemName: extractItemName(),
      }),
    );
  },
});

function isSupportedTradeSearch(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.replace(/^www\./, "") === "pathofexile.com" &&
      parsed.pathname.startsWith("/trade/search/")
    );
  } catch {
    return false;
  }
}

function extractItemName(): string {
  try {
    const searchInputSelectors = [
      "#search-typeahead",
      ".search-input input",
      'input[name="q"]',
      'input[type="search"]',
      'input[placeholder*="Search" i]',
    ];

    for (const selector of searchInputSelectors) {
      for (const candidate of document.querySelectorAll(selector)) {
        const input =
          candidate instanceof HTMLInputElement ? candidate : candidate.querySelector("input");
        if (!input || !isVisible(input)) continue;
        const value = input.value.trim();
        if (value) return value;
      }
    }

    for (const result of document.querySelectorAll(".search-results .item-result, .item-result")) {
      if (!isVisible(result)) continue;
      const name = readResultName(result);
      if (name) return name;
    }
  } catch {
    // Fall through to the document title if the page DOM is incomplete.
  }

  // Keep the document-title fallback for pages whose search controls have not
  // rendered yet. The protocol requires a usable item name, so never return
  // an empty string here.
  return document.title.trim() || "Path of Exile trade search";
}

function readResultName(result: Element): string {
  for (const selector of ['[data-field="name"]', ".item-name", ".stacked-name"]) {
    const value = result.querySelector(selector)?.textContent?.trim();
    if (value) return value;
  }
  return result.querySelector("img[alt]")?.getAttribute("alt")?.trim() ?? "";
}

function isVisible(element: Element): boolean {
  if (!(element instanceof HTMLElement) || element.hidden) return false;
  const style = window.getComputedStyle(element);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.visibility !== "collapse" &&
    element.getClientRects().length > 0
  );
}
