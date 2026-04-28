import type { Draft } from "@poe-sl/schema";

export function injectFab(drafts: Draft[], url: string) {
  if (sessionStorage.getItem("poe-sl-fab-dismissed")) {
    return;
  }

  // Find matches considering buildUrl and associatedUrls
  const matches = drafts.filter((d) => {
    if (d.buildUrl && url.startsWith(d.buildUrl)) return true;
    if (d.associatedUrls && d.associatedUrls.some((u) => url.startsWith(u))) return true;
    return false;
  });

  // Limit to latest 5
  const latestMatches = matches.slice(0, 5);

  const host = document.createElement("div");
  host.style.cssText =
    "position:fixed;top:20px;right:20px;z-index:2147483647;font-family:ui-sans-serif,system-ui,sans-serif;";
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

    shadow.querySelectorAll(".btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "open-sidepanel" });
      });
    });

    shadow.getElementById("close-btn")!.addEventListener("click", () => {
      sessionStorage.setItem("poe-sl-fab-dismissed", "1");
      host.remove();
    });
  } else {
    // Button mode
    container.innerHTML = `
      <div class="fab-btn-wrapper">
        <button class="fab-btn" title="Open PoE Shopping List">
          <svg viewBox="0 0 24 24">
            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </button>
        <button class="fab-close-btn" title="Dismiss">✕</button>
      </div>
    `;

    shadow.appendChild(style);
    shadow.appendChild(container);

    shadow.querySelector(".fab-btn")!.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "open-sidepanel" });
    });

    shadow.querySelector(".fab-close-btn")!.addEventListener("click", (e) => {
      e.stopPropagation();
      sessionStorage.setItem("poe-sl-fab-dismissed", "1");
      host.remove();
    });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
