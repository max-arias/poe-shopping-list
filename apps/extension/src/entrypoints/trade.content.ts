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
      let observerTimer: ReturnType<typeof setTimeout>;
      new MutationObserver(() => {
        clearTimeout(observerTimer);
        observerTimer = setTimeout(() => {
          reportStatus();
          injectSaveSearchButton();
        }, 200);
      }).observe(container, { childList: true, subtree: true });
    }

    onMessage("csCaptureRead", () => {
      const capture = buildCapture(document, window.location.href);
      return capture;
    });

    onMessage("csAutoCaptureRead", () => {
      const capture = buildCapture(document, window.location.href);
      return capture;
    });

    onMessage("csSearchBarGet", () => {
      const text = getSearchBarText(document);
      return { text };
    });

    function reportStatus() {
      const available = isCaptureable(document);
      sendMessage("csCaptureStatus", available).catch(() => {});
    }

    /** Inject a "Save search" button before the trade site's Clear button.
     *  Disabled when no search results are visible; re-enabled when results appear. */
    function injectSaveSearchButton() {
      const hasResults = isCaptureable(document);
      const existing = document.querySelector(
        "[data-poe-sl='save-search']",
      ) as HTMLButtonElement | null;

      if (existing) {
        existing.disabled = !hasResults;
        applyButtonStateStyle(existing);
        return;
      }

      const clearBtn = document.querySelector(SELECTORS.clearBtn);
      if (!clearBtn?.parentElement) return;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.poeSl = "save-search";
      btn.textContent = "Save search";
      btn.disabled = !hasResults;
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
        "transition:background .15s,color .15s,opacity .15s",
      ].join(";");
      applyButtonStateStyle(btn);

      btn.addEventListener("mouseenter", () => {
        if (btn.disabled) return;
        btn.style.background = "#c28a2a";
        btn.style.color = "#140e04";
      });
      btn.addEventListener("mouseleave", () => {
        if (btn.disabled) return;
        btn.style.background = "transparent";
        btn.style.color = "#c28a2a";
      });

      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        sendMessage("csSaveSearch");
      });

      clearBtn.before(btn);
    }

    /** Apply visual styling that reflects the button's disabled state. */
    function applyButtonStateStyle(btn: HTMLButtonElement) {
      if (btn.disabled) {
        btn.style.opacity = "0.4";
        btn.style.cursor = "not-allowed";
      } else {
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
      }
    }

    /** Listen for clicks on "Travel to Hideout" buttons and send purchase history data. */
    function listenForTravelToHideout() {
      document.addEventListener("click", async (e) => {
        const target = e.target as HTMLElement;
        // Check if the click is on or inside a .direct-btn (Travel to Hideout)
        const travelBtn = target.closest(SELECTORS.travelBtn) as HTMLElement | null;
        if (!travelBtn) return;

        // Check if tracking is enabled
        const settings = await storage.getItem<{ trackPurchaseHistory?: boolean }>(
          "local:settings:v1",
        );
        if (settings?.trackPurchaseHistory === false) {
          return;
        }

        // Walk up to the parent .row[data-id]
        const row = travelBtn.closest(SELECTORS.allRows) as HTMLElement | null;
        if (!row) {
          return;
        }

        const data = extractRowData(row);
        if (!data) {
          return;
        }

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

        sendMessage("csPurchaseHistoryAdd", item).catch(() => {});
      });
    }
  },
});
