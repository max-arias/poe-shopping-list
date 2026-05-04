export default defineContentScript({
  matches: ["https://poe.ninja/*"],

  main() {
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts[1] !== "builds" || parts[3] !== "character") return;

    const btn = document.createElement("button");
    btn.textContent = "POC: Open Trade";
    btn.style.cssText =
      "position:fixed;top:10px;left:10px;z-index:99999;padding:8px 14px;" +
      "background:#c28a2a;color:#000;border:none;border-radius:4px;" +
      "cursor:pointer;font-weight:bold;font-size:13px;font-family:sans-serif;";
    document.body.appendChild(btn);

    btn.addEventListener("click", () => runPoc());
  },
});

// ── Overlay ───────────────────────────────────────────────────────────────────

let overlayStatusEl: HTMLElement | null = null;

function showOverlay(status: string) {
  const el = document.createElement("div");
  el.id = "__poe-sl-overlay";
  el.style.cssText =
    "position:fixed;inset:0;z-index:2147483647;background:rgba(15,15,15,0.88);" +
    "display:flex;flex-direction:column;align-items:center;justify-content:center;" +
    "gap:12px;font-family:sans-serif;";

  const title = document.createElement("div");
  title.textContent = "Poe Shopping List";
  title.style.cssText = "font-size:16px;font-weight:700;color:#c28a2a;letter-spacing:.05em;";

  overlayStatusEl = document.createElement("div");
  overlayStatusEl.textContent = status;
  overlayStatusEl.style.cssText = "font-size:13px;color:#aaa;";

  el.appendChild(title);
  el.appendChild(overlayStatusEl);
  document.documentElement.appendChild(el);
}

function updateOverlay(status: string) {
  if (overlayStatusEl) overlayStatusEl.textContent = status;
}

function hideOverlay() {
  document.getElementById("__poe-sl-overlay")?.remove();
  overlayStatusEl = null;
}

// ── Main loop ─────────────────────────────────────────────────────────────────

async function runPoc() {
  console.log("[POC] === Starting ===");

  const tradeBtns = Array.from(
    document.querySelectorAll<HTMLButtonElement>('button[aria-label="Search on Trade"]'),
  );

  const gearBtns = tradeBtns.filter((tb) => {
    const slotEl = tb.closest<HTMLElement>('[style*="grid-area"]');
    return !!slotEl?.style?.gridArea;
  });

  console.log(`[POC] ${gearBtns.length} gear buttons, ${tradeBtns.length - gearBtns.length} skipped`);

  if (gearBtns.length === 0) {
    console.warn("[POC] No gear buttons found");
    return;
  }

  showOverlay(`Fetching trade links… 0 / ${gearBtns.length}`);

  const results: { slot: string; url: string }[] = [];
  let prevTradeLink: HTMLAnchorElement | null = null;

  for (let i = 0; i < gearBtns.length; i++) {
    const btn = gearBtns[i];
    const slot = btn.closest<HTMLElement>('[style*="grid-area"]')?.style?.gridArea ?? "unknown";

    updateOverlay(`Fetching trade links… ${i} / ${gearBtns.length} — ${slot}`);
    console.log(`[POC] [${i + 1}/${gearBtns.length}] ${slot}`);

    btn.click();

    // Exclude the previous iteration's <a> so we don't resolve with a stale element
    const tradeLink = await waitForElement<HTMLAnchorElement>(
      'a[href*="pathofexile.com/trade"][target="_blank"]',
      5000,
      prevTradeLink,
    );

    if (!tradeLink) {
      console.warn(`[POC] No trade link for ${slot} — skipping`);
      closeModal();
      await delay(300);
      continue;
    }

    results.push({ slot, url: tradeLink.href });
    console.log(`[POC] ✓ ${slot}: ${tradeLink.href.slice(0, 80)}`);

    prevTradeLink = tradeLink;
    closeModal();
    await delay(300);
  }

  console.log(`[POC] === ${results.length} URLs collected. Capturing… ===`);

  for (let i = 0; i < results.length; i++) {
    const { slot, url } = results[i];
    updateOverlay(`Capturing prices… ${i + 1} / ${results.length} — ${slot}`);
    console.log(`[POC] Tab: ${slot}`);

    const result = await new Promise<{ capture: unknown; tabUrl: string }>((resolve) => {
      chrome.runtime.sendMessage({ type: "ninja-poc:open-trade-tab", url }, resolve);
    });

    console.log(`[POC] ✓ ${slot}:`, result.capture ?? "(no results — dead league expected)");
  }

  hideOverlay();
  console.log("[POC] === Done ===");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function closeModal() {
  document.querySelectorAll<HTMLButtonElement>('button[aria-label="Dismiss"]').forEach(b => b.click());
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function waitForElement<T extends Element = Element>(
  selector: string,
  timeout: number,
  exclude?: T | null,
): Promise<T | null> {
  return new Promise((resolve) => {
    const find = () => {
      const el = document.querySelector<T>(selector);
      return el && el !== exclude ? el : null;
    };

    const existing = find();
    if (existing) { resolve(existing); return; }

    const timer = setTimeout(() => { observer.disconnect(); resolve(null); }, timeout);
    const observer = new MutationObserver(() => {
      const el = find();
      if (el) { clearTimeout(timer); observer.disconnect(); resolve(el); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
}
