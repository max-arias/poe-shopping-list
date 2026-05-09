import { DEFAULT_SETTINGS, type Draft, type Settings } from "@/types";
import { STORAGE } from "@/types/storage";

export default defineContentScript({
  matches: ["https://www.pathofexile.com/trade/*", "https://pathofexile.com/trade/*"],
  runAt: "document_idle",

  async main() {
    const {
      buildCapture,
      buildSearchFilterSnapshot,
      isCaptureable,
      getSearchBarText,
      extractRowData,
      SELECTORS,
    } = await import("@/trade-dom");
    const { onMessage, sendMessage } = await import("../utils/messages");
    const { logDebug } = await import("../utils/debugLog");
    const { storage } = await import("wxt/utils/storage");
    const { injectFab, resetFabDismissedState } = await import("../utils/fab");

    if (isPricingWorkerTab()) {
      logDebug("trade.content", "worker:start", "Pricing worker tab content script started", {
        url: window.location.href,
      });
      registerPricingCaptureHandler();
      return;
    }

    const drafts = (await storage.getItem<Draft[]>("local:drafts")) ?? [];
    const settingsItem = storage.defineItem<Settings>(STORAGE.settings, {
      fallback: DEFAULT_SETTINGS,
    });
    let fab = (await settingsItem.getValue()).showFloatingActionButton
      ? await injectFab(drafts, window.location.href)
      : undefined;
    let lastTrackedVisitUrl: string | null = null;
    let isFabVisible = true;
    logDebug("trade.content", "main:start", "Trade content script started", {
      url: window.location.href,
      isPricingWorkerTab: isPricingWorkerTab(),
    });

    settingsItem.watch(async (value) => {
      const showFloatingActionButton = value?.showFloatingActionButton !== false;

      if (!showFloatingActionButton) {
        fab?.destroy();
        fab = undefined;
        return;
      }

      resetFabDismissedState();

      if (!fab) {
        fab = await injectFab(drafts, window.location.href);
        fab?.setVisible(isFabVisible);
      }
    });

    injectSaveSearchButton();
    if (!isPricingWorkerTab()) {
      reportStatus();
      trackVisitIfNeeded();
    }
    listenForTravelToHideout();
    installHistoryListeners();

    const container = document.querySelector("#main-content, .resultset, body");
    if (container) {
      let observerTimer: ReturnType<typeof setTimeout>;
      new MutationObserver(() => {
        clearTimeout(observerTimer);
        observerTimer = setTimeout(() => {
          if (!isPricingWorkerTab()) {
            reportStatus();
            trackVisitIfNeeded();
          }
          injectSaveSearchButton();
        }, 200);
      }).observe(container, { childList: true, subtree: true });
    }

    onMessage("csCaptureRead", () => {
      const capture = buildCapture(document, window.location.href);
      logDebug("trade.content", "capture:manual", "Read capture on request", {
        url: window.location.href,
        sampleSize: capture?.aggregates.sampleSize ?? 0,
        median: capture?.aggregates.median,
      });
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

    onMessage("csSearchFiltersRead", () => {
      return buildSearchFilterSnapshot(document, window.location.href);
    });

    registerPricingCaptureHandler();

    function registerPricingCaptureHandler() {
      onMessage("csTradeCaptureWhenReady", async (message) => {
        const expectedUrl = message.data.expectedUrl;
        const deadline = Date.now() + message.data.timeoutMs;
        logDebug("trade.content", "pricing-capture:start", "Worker capture requested", {
          actualUrl: window.location.href,
          expectedUrl,
          timeoutMs: message.data.timeoutMs,
          readyState: document.readyState,
        });
        let lastState = "start";
        while (Date.now() < deadline) {
          if (!sameTradeSearch(window.location.href, expectedUrl)) {
            if (lastState !== "wrong-url") {
              lastState = "wrong-url";
              logDebug(
                "trade.content",
                "pricing-capture:waiting-url",
                "Waiting for expected trade URL",
                {
                  actualUrl: window.location.href,
                  expectedUrl,
                },
              );
            }
            await delay(250);
            continue;
          }
          if (isCaptureable(document)) {
            const capture = buildCapture(document, window.location.href);
            logDebug(
              "trade.content",
              "pricing-capture:ready",
              "Captured worker trade results",
              {
                url: window.location.href,
                sampleSize: capture?.aggregates.sampleSize ?? 0,
                median: capture?.aggregates.median,
              },
              "info",
            );
            return { capture };
          }
          if (document.body.textContent?.match(/rate limit|too many requests/i)) {
            logDebug(
              "trade.content",
              "pricing-capture:blocked",
              "Trade page appears blocked or rate limited",
              {
                url: window.location.href,
              },
              "warn",
            );
            return { capture: null, reason: "blocked" as const };
          }
          if (document.body.textContent?.match(/no results found/i)) {
            logDebug(
              "trade.content",
              "pricing-capture:empty",
              "Trade page returned no results",
              {
                url: window.location.href,
              },
              "info",
            );
            return { capture: null, reason: "empty" as const };
          }
          if (lastState !== "waiting-dom") {
            lastState = "waiting-dom";
            logDebug(
              "trade.content",
              "pricing-capture:waiting-dom",
              "Waiting for trade rows or empty state",
              {
                url: window.location.href,
                bodyTextLength: document.body.textContent?.length ?? 0,
              },
            );
          }
          await delay(250);
        }
        const capture = isCaptureable(document)
          ? buildCapture(document, window.location.href)
          : null;
        logDebug(
          "trade.content",
          "pricing-capture:timeout",
          "Timed out waiting for stable trade results",
          {
            url: window.location.href,
            sampleSize: capture?.aggregates.sampleSize ?? 0,
            readyState: document.readyState,
          },
          "warn",
        );
        return {
          capture,
          reason: "timeout" as const,
        };
      });
    }

    onMessage("csFabVisibilitySet", (message) => {
      isFabVisible = message.data.visible;
      fab?.setVisible(message.data.visible);
    });

    function reportStatus() {
      const available = isCaptureable(document);
      sendMessage("csCaptureStatus", available).catch(() => {});
    }

    function installHistoryListeners() {
      window.addEventListener("poe-sl:locationchange", trackVisitIfNeeded);
      window.addEventListener("popstate", trackVisitIfNeeded);
      window.addEventListener("hashchange", trackVisitIfNeeded);

      const { pushState, replaceState } = window.history;

      window.history.pushState = function (...args) {
        const result = pushState.apply(this, args);
        window.dispatchEvent(new Event("poe-sl:locationchange"));
        return result;
      };

      window.history.replaceState = function (...args) {
        const result = replaceState.apply(this, args);
        window.dispatchEvent(new Event("poe-sl:locationchange"));
        return result;
      };
    }

    function isTradeSearchUrl(url: string): boolean {
      try {
        const parsed = new URL(url);
        const hostname = parsed.hostname.replace(/^www\./, "");
        return hostname === "pathofexile.com" && parsed.pathname.startsWith("/trade/search/");
      } catch {
        return false;
      }
    }

    function sameTradeSearch(actual: string, expected: string): boolean {
      try {
        const a = new URL(actual);
        const e = new URL(expected);
        return (
          a.hostname.replace(/^www\./, "") === e.hostname.replace(/^www\./, "") &&
          a.pathname === e.pathname &&
          a.search === e.search
        );
      } catch {
        return false;
      }
    }

    function isPricingWorkerTab(): boolean {
      return window.location.hash.includes("poe-sl-pricing");
    }

    function delay(ms: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function trackVisitIfNeeded() {
      const url = window.location.href;
      if (!isTradeSearchUrl(url) || url === lastTrackedVisitUrl) {
        return;
      }

      const name = getSearchBarText(document).trim();
      const filters = buildSearchFilterSnapshot(document, url);
      lastTrackedVisitUrl = url;
      sendMessage("csVisitHistoryAdd", {
        id: crypto.randomUUID(),
        url,
        ...(name ? { name } : {}),
        ...(filters ? { filters } : {}),
        addedAt: Date.now(),
      }).catch(() => {});
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
          STORAGE.settings,
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

        const filters = buildSearchFilterSnapshot(document, window.location.href);
        const item: import("@/types").PurchaseHistoryItem = {
          id: crypto.randomUUID(),
          listingId: data.listingId,
          name: data.name,
          ...(data.base ? { base: data.base } : {}),
          priceValue: data.priceValue,
          priceCurrency: data.priceCurrency,
          searchUrl: window.location.href,
          ...(filters ? { filters } : {}),
          addedAt: Date.now(),
        };

        sendMessage("csPurchaseHistoryAdd", item).catch(() => {});
      });
    }
  },
});
