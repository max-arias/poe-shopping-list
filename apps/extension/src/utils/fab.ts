import type { Draft } from "@/types";
import { STORAGE } from "@/types/storage";
import { storage } from "wxt/utils/storage";
import { sendMessage } from "./messages";

const DEFAULT_TOP = 96;
const MIN_TOP = 20;
const RIGHT_OFFSET = 0;
const DRAG_THRESHOLD = 6;
const DISMISSED_KEY = "poe-sl-fab-dismissed";

const fabPositionItem = storage.defineItem<number>(STORAGE.fabPosition, {
  fallback: DEFAULT_TOP,
});

export async function injectFab(drafts: Draft[], url: string) {
  if (sessionStorage.getItem(DISMISSED_KEY)) {
    return;
  }

  // Find matches considering buildUrl and associatedUrls
  const matches = drafts.filter((d) => {
    if (d.buildUrl && url.startsWith(d.buildUrl)) return true;
    if (d.associatedUrls?.some((u) => url.startsWith(u))) return true;
    return false;
  });

  // Limit to latest 5
  const latestMatches = matches.slice(0, 5);

  const savedTop = await fabPositionItem.getValue();
  const extensionIconPath = browser.runtime.getManifest().icons?.[48] ?? "icons/icon48.png";
  const extensionIconUrl = browser.runtime.getURL(extensionIconPath as any);

  const host = document.createElement("div");
  host.dataset.testid = "poe-sl-fab-host";
  host.style.cssText = `position:fixed;top:${savedTop}px;right:${RIGHT_OFFSET}px;z-index:2147483647;font-family:ui-sans-serif,system-ui,sans-serif;`;
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    /* Mini-view Mode (Ribbon) */
    .ribbon {
      padding: 12px 14px;
      background: #15110b;
      border-top: 2px solid #c28a2a;
      border-radius: 4px;
      box-shadow: 0 4px 18px rgba(0,0,0,0.5);
      max-width: 300px;
      min-width: 220px;
    }
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 10px;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #c28a2a;
      flex-shrink: 0;
      margin-top: 3px;
    }
    .label {
      flex: 1;
      font-size: 12px;
      font-weight: 600;
      color: #e8dcbe;
      line-height: 1.4;
    }
    .close {
      flex-shrink: 0;
      background: transparent;
      border: none;
      color: #8a7e66;
      font-size: 16px;
      cursor: pointer;
      line-height: 1;
      padding: 0 2px;
      font-family: inherit;
    }
    .close:hover { color: #e8dcbe; }
    .list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .list-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 6px 8px;
      background: #1e1710;
      border-radius: 3px;
    }
    .name {
      font-size: 12px;
      font-weight: 600;
      color: #c28a2a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }
    .btn {
      flex-shrink: 0;
      padding: 3px 10px;
      font-size: 11px;
      font-weight: 600;
      background: #c28a2a;
      color: #140e04;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-family: inherit;
    }
    .btn:hover { background: #d49a30; }

    /* Button Mode (Small FAB) */
    .fab-btn-wrapper {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
      touch-action: none;
      cursor: grab;
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
    }
    .fab-btn-wrapper.dragging {
      cursor: grabbing;
    }
    .fab-btn {
      width: 48px;
      height: 48px;
      border-radius: 0;
      background: #15110b;
      border: 2px solid #c28a2a;
      border-right: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #c28a2a;
      padding: 0;
    }
    .fab-btn-wrapper.dragging .fab-btn {
    }
    .fab-btn:hover {
      background: #1e1710;
    }
    .fab-btn img {
      width: 24px;
      height: 24px;
      object-fit: contain;
      pointer-events: none;
    }
  `;

  const container = document.createElement("div");
  container.className = "fab-container";

  if (latestMatches.length > 0) {
    // Mini-view mode
    const listItemsHtml = latestMatches
      .map(
        (d, i) => `
      <div class="list-item">
        <span class="name">${escapeHtml(d.name)}</span>
        <button class="btn" data-idx="${i}">View →</button>
      </div>`,
      )
      .join("");

    container.innerHTML = `
      <div class="ribbon">
        <div class="header">
          <div class="dot"></div>
          <div class="label">Shopping lists found for this build</div>
          <button class="close" id="close-btn">✕</button>
        </div>
        <div class="list">${listItemsHtml}</div>
      </div>
    `;

    shadow.appendChild(style);
    shadow.appendChild(container);

    for (const btn of shadow.querySelectorAll(".btn")) {
      btn.addEventListener("click", () => {
        sendMessage("csOpenSidepanel");
      });
    }

    shadow.getElementById("close-btn")?.addEventListener("click", () => {
      sessionStorage.setItem(DISMISSED_KEY, "1");
      host.remove();
    });
  } else {
    // Button mode
    container.innerHTML = `
      <div class="fab-btn-wrapper">
        <button class="fab-btn" data-testid="poe-sl-fab-btn" title="Open PoE Shopping List">
          <img src="${extensionIconUrl}" alt="PoE Shopping List" />
        </button>
      </div>
    `;

    shadow.appendChild(style);
    shadow.appendChild(container);

    const wrapper = shadow.querySelector(".fab-btn-wrapper") as HTMLDivElement;
    const fabButton = shadow.querySelector(".fab-btn") as HTMLButtonElement;

    setupVerticalDrag(host, wrapper);

    fabButton.addEventListener("click", () => {
      sendMessage("csOpenSidepanel");
    });
  }

  setFabVisible(host, true);

  return {
    setVisible(visible: boolean) {
      setFabVisible(host, visible);
    },
    destroy() {
      host.remove();
    },
  };
}

export function resetFabDismissedState() {
  sessionStorage.removeItem(DISMISSED_KEY);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setupVerticalDrag(host: HTMLDivElement, wrapper: HTMLDivElement) {
  let pointerId: number | null = null;
  let startPointerY = 0;
  let startTop = 0;
  let moved = false;
  let suppressClick = false;

  const handlePointerMove = (event: PointerEvent) => {
    if (pointerId !== event.pointerId) {
      return;
    }

    const deltaY = event.clientY - startPointerY;
    if (Math.abs(deltaY) >= DRAG_THRESHOLD) {
      moved = true;
      event.preventDefault();
    }

    host.style.top = `${clampFabTop(startTop + deltaY, host)}px`;
  };

  const cleanupWindowListeners = () => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerUp);
  };

  const handlePointerUp = async (event: PointerEvent) => {
    if (pointerId !== event.pointerId) {
      return;
    }

    cleanupWindowListeners();
    wrapper.classList.remove("dragging");

    if (moved) {
      suppressClick = true;
      setTimeout(() => {
        suppressClick = false;
      }, 0);
      await fabPositionItem.setValue(Number.parseFloat(host.style.top) || DEFAULT_TOP);
    }

    pointerId = null;
  };

  wrapper.addEventListener("pointerdown", (event) => {
    pointerId = event.pointerId;
    startPointerY = event.clientY;
    startTop = Number.parseFloat(host.style.top) || DEFAULT_TOP;
    moved = false;
    wrapper.classList.add("dragging");
    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  });

  wrapper.addEventListener(
    "click",
    (event) => {
      if (!suppressClick) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    },
    true,
  );
}

function clampFabTop(nextTop: number, host: HTMLDivElement) {
  const maxTop = Math.max(MIN_TOP, window.innerHeight - host.offsetHeight - MIN_TOP);
  return Math.min(Math.max(nextTop, MIN_TOP), maxTop);
}

function setFabVisible(host: HTMLDivElement, visible: boolean) {
  host.style.opacity = visible ? "1" : "0";
  host.style.pointerEvents = visible ? "auto" : "none";
}
