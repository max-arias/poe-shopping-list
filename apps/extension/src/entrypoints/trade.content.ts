export default defineContentScript({
  matches: ["https://www.pathofexile.com/trade/*", "https://pathofexile.com/trade/*"],
  runAt: "document_idle",

  async main() {
    const { buildCapture, isCaptureable, getSearchBarText, SELECTORS } = await import("@/trade-dom");
    const { onMessage, sendMessage } = await import("../utils/messages");
    const { storage } = await import("wxt/utils/storage");
    const { injectFab } = await import("../utils/fab");

    const drafts = (await storage.getItem<any[]>("local:drafts")) ?? [];
    injectFab(drafts, window.location.href);

    injectSaveSearchButton();
    reportStatus();

    const container = document.querySelector("#main-content, .resultset, body");
    if (container) {
      new MutationObserver(() => {
        reportStatus();
        injectSaveSearchButton();
      }).observe(container, { childList: true, subtree: true });
    }

    onMessage("captureRead", () => {
      console.log("[poe-sl] content: captureRead called");
      const capture = buildCapture(document, window.location.href);
      console.log("[poe-sl] content: capture result", capture);
      return capture;
    });

    onMessage("autoCaptureRead", () => {
      console.log("[poe-sl] content: autoCaptureRead called");
      const capture = buildCapture(document, window.location.href);
      console.log("[poe-sl] content: autoCaptureRead result", capture);
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
        chrome.runtime.sendMessage({ type: "save-search" });
      });

      clearBtn.before(btn);
    }
  },
});
