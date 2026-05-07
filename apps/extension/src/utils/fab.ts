import type { Draft } from "@/types";
import { STORAGE } from "@/types/storage";
import { storage } from "wxt/utils/storage";
import { sendMessage } from "./messages";

const DEFAULT_TOP = 96;
const MIN_TOP = 20;
const RIGHT_OFFSET = 20;
const DRAG_THRESHOLD = 6;
const FADE_DURATION_MS = 180;

const fabPositionItem = storage.defineItem<number>(STORAGE.fabPosition, {
  fallback: DEFAULT_TOP,
});

export async function injectFab(drafts: Draft[], url: string) {
  if (sessionStorage.getItem("poe-sl-fab-dismissed")) {
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

  const host = document.createElement("div");
  host.dataset.testid = "poe-sl-fab-host";
  host.style.cssText = `position:fixed;top:${savedTop}px;right:${RIGHT_OFFSET}px;z-index:2147483647;font-family:ui-sans-serif,system-ui,sans-serif;`;
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    @keyframes slide-in {
      from {
        opacity: 0;
        transform: translateX(110%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    .fab-container {
      animation: slide-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

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
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #15110b;
      border: 2px solid #c28a2a;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #c28a2a;
      transition: transform 0.2s, background 0.2s;
      padding: 0;
    }
    .fab-btn-wrapper.dragging .fab-btn {
      transform: none;
    }
    .fab-btn:hover {
      background: #1e1710;
      transform: scale(1.05);
    }
    .fab-btn svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }
    .fab-close-btn {
      background: #15110b;
      border: 1px solid #8a7e66;
      color: #8a7e66;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      cursor: pointer;
      position: absolute;
      top: -8px;
      right: -8px;
      opacity: 0;
      transition: opacity 0.2s, color 0.2s, border-color 0.2s;
    }
    .fab-btn-wrapper:hover .fab-close-btn {
      opacity: 1;
    }
    .fab-close-btn:hover {
      color: #e8dcbe;
      border-color: #e8dcbe;
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
      sessionStorage.setItem("poe-sl-fab-dismissed", "1");
      host.remove();
    });
  } else {
    // Button mode
    container.innerHTML = `
      <div class="fab-btn-wrapper">
        <button class="fab-btn" data-testid="poe-sl-fab-btn" title="Open PoE Shopping List">
          <svg viewBox="0 0 24 24">
            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </button>
        <button class="fab-close-btn" title="Dismiss">✕</button>
      </div>
    `;

    shadow.appendChild(style);
    shadow.appendChild(container);

    const wrapper = shadow.querySelector(".fab-btn-wrapper") as HTMLDivElement;
    const fabButton = shadow.querySelector(".fab-btn") as HTMLButtonElement;
    const closeButton = shadow.querySelector(".fab-close-btn") as HTMLButtonElement;

    setupVerticalDrag(host, wrapper);

    fabButton.addEventListener("click", () => {
      sendMessage("csOpenSidepanel");
    });

    closeButton.addEventListener("click", (e) => {
      e.stopPropagation();
      sessionStorage.setItem("poe-sl-fab-dismissed", "1");
      host.remove();
    });
  }

  setFabVisible(host, true);

  return {
    setVisible(visible: boolean) {
      setFabVisible(host, visible);
    },
  };
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
    const target = event.target as HTMLElement | null;
    if (target?.closest(".fab-close-btn")) {
      return;
    }

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
  host.style.transition = `opacity ${FADE_DURATION_MS}ms ease`;
  host.style.opacity = visible ? "1" : "0";
  host.style.pointerEvents = visible ? "auto" : "none";
}
