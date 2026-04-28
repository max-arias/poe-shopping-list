export default defineContentScript({
  matches: ["https://www.pathofexile.com/trade/*", "https://pathofexile.com/trade/*"],
  runAt: "document_idle",

  async main() {
    const { buildCapture, isCaptureable, getSearchBarText } = await import("@poe-sl/trade-dom");
    const { onMessage, sendMessage } = await import("../utils/messages");
    const { storage } = await import("wxt/utils/storage");
    const { injectFab } = await import("../utils/fab");

    const drafts = (await storage.getItem<any[]>("local:drafts")) ?? [];
    injectFab(drafts, window.location.href);

    const settings = await storage.getItem<any>("local:settings:v1");
    if (settings?.enableRecentPurchases) {
      document.addEventListener("click", (e) => {
        const btn = (e.target as Element).closest(".direct-btn");
        if (!btn) return;
        const row = btn.closest(".row[data-id]") as HTMLElement | null;
        if (!row) return;

        const id = row.dataset.id ?? crypto.randomUUID();
        const itemName = row.querySelector(".itemName .lc")?.textContent?.trim() ?? "Unknown";
        const iconUrl = (row.querySelector(".icon img") as HTMLImageElement)?.src ?? "";
        const priceSpan = row.querySelector("[data-field='price']");
        const priceValue =
          parseFloat(priceSpan?.querySelector("span")?.textContent?.trim() ?? "0") || 0;
        const priceCurrency =
          (priceSpan?.querySelector(".currency-text img") as HTMLImageElement)?.alt ??
          priceSpan?.querySelector(".currency-text span:last-child")?.textContent?.trim() ??
          "";
        const seller =
          row.querySelector(".character-name .profile-link a")?.textContent?.trim() ?? "";

        const purchase = {
          id,
          itemName,
          iconUrl,
          priceValue,
          priceCurrency,
          seller,
          tradeUrl: window.location.href,
          purchasedAt: Date.now(),
        };

        storage.getItem<any[]>("local:recentPurchases:v1").then((existing) => {
          const list = existing ?? [];
          const updated = [purchase, ...list.filter((p) => p.id !== id)].slice(0, 50);
          storage.setItem("local:recentPurchases:v1", updated);
        });
      });
    }

    reportStatus();

    const container = document.querySelector("#main-content, .resultset, body");
    if (container) {
      new MutationObserver(reportStatus).observe(container, { childList: true, subtree: true });
    }

    onMessage("captureRead", () => {
      console.log("[poe-sl] content: captureRead called");
      const capture = buildCapture(document, window.location.href);
      console.log("[poe-sl] content: capture result", capture);
      return capture;
    });

    onMessage("searchBarGet", () => {
      const text = getSearchBarText(document);
      console.log("[poe-sl] content: searchBarGet =", JSON.stringify(text));
      return { text };
    });

    function reportStatus() {
      const available = isCaptureable(document);
      sendMessage("captureStatus", available).catch(() => {});
    }
  },
});
