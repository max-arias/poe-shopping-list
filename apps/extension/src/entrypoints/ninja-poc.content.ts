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

async function runPoc() {
  console.log("[POC] === Starting ===");

  const tradeBtns = Array.from(
    document.querySelectorAll<HTMLButtonElement>('button[aria-label="Search on Trade"]'),
  );
  console.log(`[POC] Found ${tradeBtns.length} trade buttons`);

  if (tradeBtns.length === 0) {
    console.warn("[POC] No buttons found");
    return;
  }

  // Only process gear slots (those with a known grid-area) — skip gems/jewels for now
  const gearBtns = tradeBtns.filter((tb) => {
    const slotEl = tb.closest<HTMLElement>('[style*="grid-area"]');
    return !!slotEl?.style?.gridArea;
  });
  console.log(`[POC] Gear buttons: ${gearBtns.length} (skipping ${tradeBtns.length - gearBtns.length} unknown-slot)`);

  const results: { slot: string; url: string }[] = [];

  for (let i = 0; i < gearBtns.length; i++) {
    const btn = gearBtns[i];
    const slotEl = btn.closest<HTMLElement>('[style*="grid-area"]');
    const slot = slotEl?.style?.gridArea ?? "unknown";

    console.log(`[POC] [${i + 1}/${gearBtns.length}] Clicking slot: ${slot}`);
    btn.click();

    const tradeLink = await waitForElement<HTMLAnchorElement>(
      'a[href*="pathofexile.com/trade"][target="_blank"]',
      5000,
    );

    if (!tradeLink) {
      console.warn(`[POC] No trade link appeared for slot ${slot} — skipping`);
      const skipBackdrop = document.querySelector<HTMLElement>('.fixed.inset-0');
      closeModal();
      if (skipBackdrop) await waitForElementRemoved(skipBackdrop, 3000);
      continue;
    }

    const url = tradeLink.href;
    results.push({ slot, url });
    console.log(`[POC] ✓ ${slot}: ${url.slice(0, 80)}...`);

    const backdrop = document.querySelector<HTMLElement>('.fixed.inset-0');
    closeModal();
    if (backdrop) {
      await waitForElementRemoved(backdrop, 5000);
    }
  }

  console.log(`[POC] === URLs collected: ${results.length}. Starting background capture... ===`);

  for (const { slot, url } of results) {
    console.log(`[POC] Opening background tab for: ${slot}`);
    const result = await new Promise<{ capture: unknown; tabUrl: string }>((resolve) => {
      chrome.runtime.sendMessage({ type: "ninja-poc:open-trade-tab", url }, resolve);
    });
    console.log(`[POC] ✓ ${slot} captured:`, result.capture ?? "(no results — expected for dead league)");
    console.log(`[POC]   final URL: ${result.tabUrl}`);
  }

  console.log("[POC] === All items processed ===");
}

function closeModal() {
  // Close ALL stacked modals (Escape-key failures can leave multiple open)
  document.querySelectorAll<HTMLButtonElement>('button[aria-label="Dismiss"]').forEach(b => b.click());
}

function waitForElementRemoved(el: Element, timeout: number): Promise<void> {
  return new Promise((resolve) => {
    if (!el.isConnected) { resolve(); return; }
    const timer = setTimeout(resolve, timeout);
    const observer = new MutationObserver(() => {
      if (!el.isConnected) {
        clearTimeout(timer);
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function waitForElement<T extends Element = Element>(selector: string, timeout: number): Promise<T | null> {
  return new Promise((resolve) => {
    const existing = document.querySelector<T>(selector);
    if (existing) { resolve(existing); return; }

    const timer = setTimeout(() => { observer.disconnect(); resolve(null); }, timeout);
    const observer = new MutationObserver(() => {
      const el = document.querySelector<T>(selector);
      if (el) { clearTimeout(timer); observer.disconnect(); resolve(el); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
}
