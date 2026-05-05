export default defineContentScript({
  matches: ["https://www.pathofexile.com/trade/*", "https://pathofexile.com/trade/*"],
  runAt: "document_idle",

  async main() {
    const { buildCapture, isCaptureable, getSearchBarText, extractRowData, SELECTORS } =
      await import("@/trade-dom");
    const { onMessage, sendMessage } = await import("../utils/messages");
    const { storage } = await import("wxt/utils/storage");
    const { injectFab } = await import("../utils/fab");

    const drafts = (await storage.getItem<any[]>("local:drafts")) ?? [];
    injectFab(drafts, window.location.href);

    injectSaveSearchButton();
    reportStatus();
    listenForTravelToHideout();

    const container = document.querySelector("#main-content, .resultset, body");
    if (container) {
      new MutationObserver(() => {
        reportStatus();
        injectSaveSearchButton();
      }).observe(container, { childList: true, subtree: true });
    }

    onMessage("csCaptureRead", () => {
      console.log("[poe-sl] content: csCaptureRead called");
      const capture = buildCapture(document, window.location.href);
      console.log("[poe-sl] content: csCaptureRead result", capture);
      return capture;
    });

    onMessage("csAutoCaptureRead", () => {
      console.log("[poe-sl] content: csAutoCaptureRead called");
      const capture = buildCapture(document, window.location.href);
      console.log("[poe-sl] content: csAutoCaptureRead result", capture);
      return capture;
    });

    onMessage("csSearchBarGet", () => {
      const text = getSearchBarText(document);
      console.log("[poe-sl] content: csSearchBarGet =", JSON.stringify(text));
      return { text };
    });

    function reportStatus() {
      const available = isCaptureable(document);
      sendMessage("csCaptureStatus", available).catch(() => {});
    }

    /** Inject a "Save search" button before the trade site's Clear button. */
    function injectSaveSearchButton() {
      if (document.querySelector("[data-poe-sl='save-search']")) return;

      const clearBtn = document.querySelector(SELECTORS.clearBtn);
      if (!clearBtn?.parentElement) return;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.poeSl = "save-search";
      btn.textContent = "Save search";
      btn.style.cssText = [
        "background:transparent",
        "border:1px solid #7f6e4e",
        "color:#c28a2a",
        "padding:6px 14px",
        "font-size:13px",
        "font-weight:600",
        "cursor:pointer",
        "border-radius:2px",
        "margin-right:8px",
        "font-family:inherit",
        "transition:background .15s,color .15s",
      ].join(";");

      btn.addEventListener("mouseenter", () => {
        btn.style.background = "#c28a2a";
        btn.style.color = "#140e04";
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.background = "transparent";
        btn.style.color = "#c28a2a";
      });

      btn.addEventListener("click", () => {
        sendMessage("csSaveSearch");
      });

      clearBtn.before(btn);
    }

    /** Listen for clicks on "Travel to Hideout" buttons and send purchase history data. */
    function listenForTravelToHideout() {
      document.addEventListener("click", async (e) => {
        const target = e.target as HTMLElement;
        // Check if the click is on or inside a .direct-btn (Travel to Hideout)
        const travelBtn = target.closest(SELECTORS.travelBtn) as HTMLElement | null;
        if (!travelBtn) return;

        console.log("[poe-sl] Travel to Hideout button clicked");

        // Check if tracking is enabled
        const settings = await storage.getItem<{ trackPurchaseHistory?: boolean }>(
          "local:settings:v1",
        );
        if (settings?.trackPurchaseHistory === false) {
          console.log("[poe-sl] Purchase history tracking disabled, skipping");
          return;
        }

        // Walk up to the parent .row[data-id]
        const row = travelBtn.closest(SELECTORS.allRows) as HTMLElement | null;
        if (!row) {
          console.log("[poe-sl] Could not find parent row for travel button");
          return;
        }

        const data = extractRowData(row);
        if (!data) {
          console.log("[poe-sl] Could not extract row data");
          return;
        }

        console.log("[poe-sl] Extracted row data:", data);

        const item: import("@/types").PurchaseHistoryItem = {
          id: crypto.randomUUID(),
          listingId: data.listingId,
          name: data.name,
          ...(data.base ? { base: data.base } : {}),
          priceValue: data.priceValue,
          priceCurrency: data.priceCurrency,
          searchUrl: window.location.href,
          addedAt: Date.now(),
        };

        console.log("[poe-sl] Sending csPurchaseHistoryAdd message:", item);
        sendMessage("csPurchaseHistoryAdd", item).catch(() => {});
      });
    }
  },
});
