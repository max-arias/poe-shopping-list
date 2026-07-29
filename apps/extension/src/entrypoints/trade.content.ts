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
        title: document.title,
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
