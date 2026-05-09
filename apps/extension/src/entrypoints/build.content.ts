import type { PobPricingPlanItem } from "@/types/pobPricing";
import { storage } from "wxt/utils/storage";
import { logDebug } from "../utils/debugLog";
import { injectFab } from "../utils/fab";

const DEFAULT_MATCH_PERCENT = 85;

export default defineContentScript({
  matches: ["https://pobb.in/*", "https://maxroll.gg/*"],

  async main() {
    logDebug("build.content", "main:start", "Build content script started", {
      hostname: location.hostname,
      url: location.href,
    });
    const drafts = (await storage.getItem<import("@/types").Draft[]>("local:drafts")) ?? [];
    const url = window.location.href;

    injectFab(drafts, url);
    if (location.hostname === "pobb.in") {
      await injectPriceBuildButton();
      new MutationObserver(() => void injectPriceBuildButton()).observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  },
});

async function injectPriceBuildButton() {
  if (document.querySelector("[data-poe-sl='price-build']")) return;
  const textarea = findPobTextarea();
  if (!textarea) return;
  const actionRow = findActionRow(textarea);
  if (!actionRow) return;
  logDebug("build.content", "button:inject", "Injecting Price this build button", {
    textareaLength: textarea.value.length,
    actionRowTag: actionRow.tagName,
  });

  const button = document.createElement("button");
  button.type = "button";
  button.dataset.poeSl = "price-build";
  button.textContent = "Price this build";
  button.style.cssText = [
    "background:#c28a2a",
    "color:#140e04",
    "border:0",
    "border-radius:8px",
    "padding:10px 16px",
    "font-weight:700",
    "font-size:14px",
    "cursor:pointer",
    "font-family:inherit",
  ].join(";");
  button.addEventListener("click", () => {
    logDebug(
      "build.content",
      "button:click",
      "Price this build clicked",
      {
        textareaLength: textarea.value.length,
      },
      "info",
    );
    openPricingModal(textarea.value).catch(showErrorModal);
  });
  actionRow.prepend(button);
}

function findPobTextarea(): HTMLTextAreaElement | null {
  return (
    [...document.querySelectorAll("textarea")].find(
      (el) =>
        /Path of Building buildcode/i.test(el.getAttribute("aria-label") ?? "") ||
        (el.value.length > 200 && /^[A-Za-z0-9_-]+$/.test(el.value.trim().slice(0, 80))),
    ) ?? null
  );
}

function findActionRow(textarea: HTMLTextAreaElement): HTMLElement | null {
  const parent = textarea.parentElement;
  return parent?.querySelector("button")?.parentElement ?? parent;
}

async function openPricingModal(code: string) {
  logDebug("build.content", "modal:open:start", "Opening PoB pricing modal", {
    codeLength: code.length,
  });
  const [
    { decodePobXml },
    { parsePobXml },
    { loadStatIndex },
    { buildPricingPlan },
    { buildTradeUrl, hashQuery },
    { withEnabledStatFilters },
    { sendMessage },
  ] = await Promise.all([
    import("@/pob/decode"),
    import("@/pob/parseXml"),
    import("@/pob/trade/statIndex"),
    import("@/pob/pricingPlan"),
    import("@/pob/trade/buildUrl"),
    import("@/pob/trade/buildQuery"),
    import("../utils/messages"),
  ]);
  const { DEFAULT_SETTINGS } = await import("@/types");

  const xml = decodePobXml(code);
  logDebug("build.content", "pob:decoded", "Decoded PoB code to XML", {
    xmlLength: xml.length,
  });
  const parsed = parsePobXml(xml);
  logDebug("build.content", "pob:parsed", "Parsed PoB XML", {
    title: parsed.title,
    itemSetCount: parsed.itemSets.length,
    skillGroupCount: parsed.skillGroups.length,
    entryCount: parsed.entries.length,
  });
  const statIndex = await loadStatIndex();
  logDebug("build.content", "stat-index:loaded", "Loaded bundled stat index");
  const settings =
    (await storage.getItem<typeof DEFAULT_SETTINGS>("local:settings:v1")) ?? DEFAULT_SETTINGS;
  const selectedItemSetIds = new Set(
    parsed.itemSets.filter((set) => set.active).map((set) => set.id),
  );
  if (selectedItemSetIds.size === 0 && parsed.itemSets[0]) {
    selectedItemSetIds.add(parsed.itemSets[0].id);
  }
  const selectedSkillGroupIds = new Set(
    parsed.skillGroups.filter((group) => group.enabled).map((group) => group.id),
  );
  let matchPercent = DEFAULT_MATCH_PERCENT;
  let league = settings.league;
  let included = new Set<string>();
  let expanded = new Set<string>();
  let plan: PobPricingPlanItem[] = [];
  let starting = false;

  const modal = createModal();
  document.body.appendChild(modal.host);

  async function rebuildPlan() {
    logDebug("build.content", "plan:rebuild:start", "Rebuilding pricing plan", {
      league,
      matchPercent,
      selectedItemSetIds: [...selectedItemSetIds],
      selectedSkillGroupIds: [...selectedSkillGroupIds],
    });
    plan = await buildPricingPlan(parsed, statIndex, {
      buildUrl: location.href,
      league,
      selectedItemSetIds,
      selectedSkillGroupIds,
      matchPercent,
    });
    if (included.size === 0) included = new Set(plan.map((item) => item.id));
    if (expanded.size === 0 && plan[0]) expanded = new Set([plan[0].id]);
    logDebug("build.content", "plan:rebuild:complete", "Rebuilt pricing plan", {
      itemCount: plan.length,
      firstItems: plan.slice(0, 5).map((item) => ({
        id: item.id,
        name: item.name,
        kind: item.kind,
        filterCount: item.filters.length,
        queryHash: item.queryHash,
      })),
    });
    render();
  }

  async function rebuildItemUrl(item: PobPricingPlanItem) {
    if (!item.tradeQuery) return;
    const query = withEnabledStatFilters(item.tradeQuery, item.filters);
    item.tradeUrl = buildTradeUrl(league, query);
    item.queryHash = await hashQuery(query);
    logDebug("build.content", "plan:item-url:rebuilt", "Rebuilt trade URL for item", {
      itemId: item.id,
      name: item.name,
      enabledFilterCount: item.filters.filter((filter) => filter.enabled).length,
      queryHash: item.queryHash,
      tradeUrl: item.tradeUrl,
    });
  }

  function render() {
    const equipment = plan.filter((item) => item.kind !== "gem");
    const gems = plan.filter((item) => item.kind === "gem");
    modal.body.innerHTML = `
      <div class="psl-head">
        <div><h2 id="psl-title">Price this build</h2><p>${escapeHtml(parsed.title)} · ${plan.length} searches · ${parsed.itemSets.length} item sets, ${parsed.skillGroups.length} skill groups</p></div>
        <button class="psl-x" data-close aria-label="Close pricing modal">×</button>
      </div>
      <div class="psl-toolbar">
        <label><span>League</span><input data-league value="${escapeHtml(league)}" /></label>
        <label><span>Item match</span><input data-match type="number" min="1" max="100" value="${matchPercent}" /><b>%</b></label>
      </div>
      <div class="psl-sets">
        <div><strong>Item sets</strong><div>${parsed.itemSets.map((set) => `<label><input type="checkbox" data-set="${escapeHtml(set.id)}" ${selectedItemSetIds.has(set.id) ? "checked" : ""}/> ${escapeHtml(set.name)}</label>`).join("")}</div></div>
        <div><strong>Skill groups</strong><div>${parsed.skillGroups.map((group) => `<label><input type="checkbox" data-skill="${escapeHtml(group.id)}" ${selectedSkillGroupIds.has(group.id) ? "checked" : ""}/> ${escapeHtml(group.name)}</label>`).join("")}</div></div>
      </div>
      <div class="psl-list">
        ${equipment.length ? `<section><h3>Equipment</h3>${equipment.map((item) => renderItem(item, included, expanded)).join("")}</section>` : ""}
        ${gems.length ? `<section><h3>Gems</h3>${gems.map((item) => renderItem(item, included, expanded)).join("")}</section>` : ""}
      </div>
      <div class="psl-foot"><span>${included.size} selected</span><div><button data-close>Cancel</button><button class="primary" data-start ${starting ? "disabled" : ""}>${starting ? "Starting…" : "Start pricing"}</button></div></div>
    `;
  }

  modal.body.addEventListener("change", async (event) => {
    const target = event.target as HTMLInputElement;
    if (target.dataset.set) {
      if (target.checked) selectedItemSetIds.add(target.dataset.set);
      else selectedItemSetIds.delete(target.dataset.set);
      included.clear();
      await rebuildPlan();
    } else if (target.dataset.skill) {
      if (target.checked) selectedSkillGroupIds.add(target.dataset.skill);
      else selectedSkillGroupIds.delete(target.dataset.skill);
      included.clear();
      await rebuildPlan();
    } else if (target.dataset.include) {
      if (target.checked) included.add(target.dataset.include);
      else included.delete(target.dataset.include);
      render();
    } else if (target.dataset.match) {
      matchPercent = Math.max(
        1,
        Math.min(100, Number.parseInt(target.value, 10) || DEFAULT_MATCH_PERCENT),
      );
      await rebuildPlan();
    } else if (target.dataset.filter) {
      const item = plan.find((entry) => entry.id === target.dataset.item);
      const filter = item?.filters.find((entry) => entry.id === target.dataset.filter);
      if (item && filter) {
        filter.enabled = target.checked;
        await rebuildItemUrl(item);
        render();
      }
    }
  });

  modal.body.addEventListener("input", async (event) => {
    const target = event.target as HTMLInputElement;
    if (target.dataset.league) league = target.value.trim();
    if (target.dataset.match) {
      matchPercent = Math.max(
        1,
        Math.min(100, Number.parseInt(target.value, 10) || DEFAULT_MATCH_PERCENT),
      );
    }
  });

  modal.body.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-close]")) modal.host.remove();
    const toggle = target.closest<HTMLElement>("[data-toggle-filters]");
    if (toggle?.dataset.toggleFilters) {
      const id = toggle.dataset.toggleFilters;
      if (expanded.has(id)) expanded.delete(id);
      else expanded.add(id);
      logDebug("build.content", "ui:filters-toggle", "Toggled item filters", {
        itemId: id,
        expanded: expanded.has(id),
      });
      render();
      return;
    }
    const openTrade = target.closest<HTMLElement>("[data-open-trade]");
    if (openTrade?.dataset.openTrade) {
      const item = plan.find((entry) => entry.id === openTrade.dataset.openTrade);
      if (item) {
        await rebuildItemUrl(item);
        logDebug(
          "build.content",
          "ui:open-trade",
          "Opening generated trade URL",
          { itemId: item.id, tradeUrl: item.tradeUrl },
          "info",
        );
        window.open(item.tradeUrl, "_blank", "noopener,noreferrer");
      }
      return;
    }
    const copyTrade = target.closest<HTMLElement>("[data-copy-trade]");
    if (copyTrade?.dataset.copyTrade) {
      const item = plan.find((entry) => entry.id === copyTrade.dataset.copyTrade);
      if (item) {
        await rebuildItemUrl(item);
        await navigator.clipboard.writeText(item.tradeUrl);
        logDebug(
          "build.content",
          "ui:copy-trade",
          "Copied generated trade URL",
          { itemId: item.id, tradeUrl: item.tradeUrl },
          "info",
        );
      }
      return;
    }
    if (target.closest("[data-start]")) {
      if (starting) return;
      starting = true;
      render();
      const items = plan.filter((item) => included.has(item.id));
      if (!items.length) {
        starting = false;
        render();
        return;
      }
      await Promise.all(items.map(rebuildItemUrl));
      logDebug(
        "build.content",
        "pricing:start",
        "Sending pricing job to background",
        {
          itemCount: items.length,
          league,
          buildName: parsed.title,
          buildUrl: location.href,
          firstItems: items
            .slice(0, 5)
            .map((item) => ({ id: item.id, name: item.name, queryHash: item.queryHash })),
        },
        "info",
      );
      await sendMessage("csPobPricingStart", {
        buildUrl: location.href,
        buildName: parsed.title,
        league,
        items,
      });
      logDebug(
        "build.content",
        "pricing:start:accepted",
        "Background accepted pricing job",
        undefined,
        "info",
      );
      modal.host.remove();
    }
  });

  await rebuildPlan();
}

function renderItem(
  item: PobPricingPlanItem,
  included: Set<string>,
  expanded: Set<string>,
): string {
  const isExpanded = expanded.has(item.id);
  const enabledCount = item.filters.filter((filter) => filter.enabled).length;
  const slot = item.source.slot ?? item.source.skillGroupName ?? item.kind;
  return `<article class="psl-item ${isExpanded ? "is-expanded" : ""}">
      <div class="psl-row">
        <div class="psl-slot">${escapeHtml(slot)}</div>
        <label class="psl-name"><input type="checkbox" data-include="${escapeHtml(item.id)}" ${included.has(item.id) ? "checked" : ""}/><span>${escapeHtml(item.name)}</span>${item.base ? `<em>${escapeHtml(item.base)}</em>` : ""}</label>
        <div class="psl-actions">
          <button class="trade" data-open-trade="${escapeHtml(item.id)}">Trade ↗</button>
          <button data-copy-trade="${escapeHtml(item.id)}">Copy</button>
          <button data-toggle-filters="${escapeHtml(item.id)}" aria-expanded="${isExpanded}" aria-controls="psl-filters-${escapeHtml(item.id)}">Filters ${isExpanded ? "⌃" : "⌄"}</button>
        </div>
      </div>
      ${
        isExpanded
          ? `<div class="psl-filter-panel" id="psl-filters-${escapeHtml(item.id)}">
        ${
          item.filters.length
            ? item.filters
                .map(
                  (filter) => `<label class="psl-filter">
          <span><input type="checkbox" data-item="${escapeHtml(item.id)}" data-filter="${escapeHtml(filter.id)}" ${filter.enabled ? "checked" : ""}/> ${escapeHtml(filter.label)}</span>
          <span class="psl-filter-values"><small>min</small><input readonly value="${escapeHtml(formatFilterValue(filter.value?.min ?? filter.value?.option))}"/><small>max</small><input readonly value="${escapeHtml(formatFilterValue(filter.value?.max))}"/></span>
        </label>`,
                )
                .join("")
            : `<p class="psl-unmatched"><strong>Not auto-matched</strong> Set manually in trade UI.</p>`
        }
        <div class="psl-filter-note">${enabledCount}/${item.filters.length} filters enabled · query hash ${escapeHtml(item.queryHash.slice(0, 8))}</div>
      </div>`
          : ""
      }
    </article>`;
}

function createModal() {
  const host = document.createElement("div");
  host.setAttribute("role", "dialog");
  host.setAttribute("aria-modal", "true");
  host.setAttribute("aria-labelledby", "psl-title");
  host.style.cssText =
    "position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;font-family:ui-sans-serif,system-ui,sans-serif;";
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
    :host{color-scheme:dark}.wrap{width:min(1070px,calc(100vw - 48px));max-height:88vh;background:#151316;color:#c4b8a8;border:1px solid #3a3430;border-radius:2px;box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;flex-direction:column;overflow:hidden;font:13px/1.35 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.psl-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;background:#1a1714;border-bottom:1px solid #3a3430}.psl-head h2{margin:0;color:#d4956a;font-size:19px;letter-spacing:.1px}.psl-head p{margin:5px 0 0;color:#8c7b6a;font-size:12px}.psl-x{width:32px;height:32px;background:#0d0b0e;color:#8c7b6a;border:1px solid #504840;border-radius:2px;font-size:22px;cursor:pointer}.body{overflow:auto}.psl-toolbar{display:flex;gap:14px;align-items:end;padding:12px 20px;background:#111013;border-bottom:1px solid #2a2520}.psl-toolbar label{display:flex;align-items:center;gap:7px;color:#8c7b6a;font-size:10px;text-transform:uppercase;letter-spacing:.6px}.psl-toolbar input{height:30px;background:#1a1714;color:#c4b8a8;border:1px solid #3a3430;border-radius:2px;padding:0 9px;font:600 12px ui-monospace,SFMono-Regular,Menlo,monospace}.psl-toolbar [data-match]{width:58px}.psl-toolbar b{font-size:12px;color:#8c7b6a}.psl-sets{display:grid;grid-template-columns:1fr 1fr;gap:18px;padding:12px 20px;border-bottom:1px solid #2a2520;background:#151316}.psl-sets strong{display:block;margin-bottom:8px;color:#d4956a;font-size:10px;text-transform:uppercase;letter-spacing:.7px}.psl-sets div div{display:flex;flex-wrap:wrap;gap:6px 12px}.psl-sets label{color:#c4b8a8;font-size:12px}.psl-list{padding:12px 20px 4px}.psl-list section{margin-bottom:18px}.psl-list h3{margin:0 0 9px;color:#d4956a;font-size:17px}.psl-item{border-top:1px solid #2a2520}.psl-row{min-height:47px;display:grid;grid-template-columns:120px minmax(0,1fr) auto;gap:0;align-items:center}.psl-slot{color:#aa9e82;font-size:11px;text-transform:uppercase;letter-spacing:.45px}.psl-name{min-width:0;display:flex;align-items:center;gap:10px;color:#c4b8a8;font-weight:700}.psl-name span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.psl-name em{color:#aa9e82;font-size:12px;font-weight:400;font-style:italic}.psl-name input,.psl-filter input[type=checkbox],.psl-sets input{accent-color:#af6025}.psl-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.psl-actions button,.psl-foot button{height:31px;border:1px solid #504840;border-radius:2px;background:#151316;color:#c4b8a8;padding:0 12px;font-size:12px;cursor:pointer}.psl-actions .trade,.psl-foot .primary{background:#af6025;border-color:#7a3f15;color:#ffffff;font-weight:800}.psl-foot button:disabled{opacity:.55;cursor:wait}.psl-filter-panel{margin:0 8px 10px 26px;padding:9px 0 3px;border-top:1px dashed #3a3430;background:#111013}.psl-filter{min-height:40px;display:grid;grid-template-columns:minmax(240px,1fr) auto;gap:14px;align-items:center;padding:0 10px;color:#8c7b6a}.psl-filter:nth-child(odd){background:#141215}.psl-filter-values{display:grid;grid-template-columns:auto 60px auto 60px;gap:6px;align-items:center}.psl-filter-values small{color:#8c7b6a;font-size:10px}.psl-filter-values input{height:26px;background:#1a1714;color:#c4b8a8;border:1px solid #2a2520;border-radius:2px;padding:0 8px;font:600 12px ui-monospace,SFMono-Regular,Menlo,monospace}.psl-filter-note,.psl-unmatched{margin:8px 10px 0;color:#8c7b6a;font-size:11px}.psl-unmatched strong{display:block;color:#d4956a}.psl-foot{position:sticky;bottom:0;display:flex;align-items:center;justify-content:space-between;padding:13px 20px;background:#1a1714;border-top:1px solid #3a3430}.psl-foot span{color:#8c7b6a;font:600 12px ui-monospace,SFMono-Regular,Menlo,monospace}.psl-foot div{display:flex;gap:10px}@media(max-width:760px){.psl-row{grid-template-columns:84px minmax(0,1fr)}.psl-actions{grid-column:2}.psl-filter{grid-template-columns:1fr}.psl-filter-values{justify-content:start}}`;
  const body = document.createElement("div");
  body.className = "wrap body";
  shadow.append(style, body);
  return { host, body };
}

function showErrorModal(error: unknown) {
  alert(error instanceof Error ? error.message : String(error));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatFilterValue(value: string | number | undefined): string {
  if (value === undefined || value === "") return "—";
  return String(value);
}
