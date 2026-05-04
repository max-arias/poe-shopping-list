export default defineContentScript({
  matches: ["https://www.pathofexile.com/trade/*", "https://pathofexile.com/trade/*"],
  runAt: "document_idle",

  async main() {
    const { buildCapture, isCaptureable, getSearchBarText } = await import("@/trade-dom");
    const { onMessage, sendMessage } = await import("../utils/messages");
    const { storage } = await import("wxt/utils/storage");
    const { injectFab } = await import("../utils/fab");

    const drafts = (await storage.getItem<any[]>("local:drafts")) ?? [];
    injectFab(drafts, window.location.href);

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
  },
});
