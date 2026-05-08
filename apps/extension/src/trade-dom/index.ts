export { SELECTORS } from "./selectors.js";
import { SELECTORS } from "./selectors.js";

// ── Public types ─────────────────────────────────────────────────────────────

export interface RawListing {
  listingId: string;
  priceValue: number;
  priceCurrency: string;
}

export interface TradeAggregates {
  min: number;
  median: number;
  avg: number;
  sampleSize: number;
  currency: string;
}

export interface TradeCapture {
  tradeUrl: string;
  samples: RawListing[];
  aggregates: TradeAggregates;
  capturedAt: number;
}

export interface SearchFilterValue {
  label: string;
  value: string;
}

export interface SearchFilterEntry {
  label: string;
  values: SearchFilterValue[];
}

export interface SearchFilterGroup {
  label: string;
  entries: SearchFilterEntry[];
}

export interface SearchFilterSnapshot {
  game: "poe1";
  tradeUrl: string;
  searchText?: string;
  capturedAt: number;
  groups: SearchFilterGroup[];
}

export interface RowData {
  listingId: string;
  name: string;
  base: string;
  priceValue: number;
  priceCurrency: string;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns true when at least one priced result row is present in the DOM.
 * Used to decide whether to show the "capture unavailable" banner (F15).
 */
export function isCaptureable(root: Document | Element): boolean {
  return root.querySelectorAll(SELECTORS.allRows).length > 0;
}

/**
 * Reads every visible result row and returns a flat array of raw listings.
 * Rows without a numeric price (e.g. negotiable listings) are silently skipped.
 */
export function extractSamples(root: Document | Element): RawListing[] {
  const listings: RawListing[] = [];

  const rows = root.querySelectorAll(SELECTORS.allRows);
  console.log(
    "[poe-sl] extractSamples: rows found =",
    rows.length,
    "| selector =",
    SELECTORS.allRows,
  );

  for (const row of rows) {
    const listingId = (row as HTMLElement).dataset.id;
    if (!listingId) continue;

    const priceWrapper = row.querySelector(SELECTORS.priceWrapper);
    if (!priceWrapper) {
      console.log(
        "[poe-sl] row",
        listingId,
        "— no priceWrapper (selector:",
        SELECTORS.priceWrapper,
        ")",
      );
      continue;
    }

    console.log("[poe-sl] row", listingId, "— priceWrapper innerHTML:", priceWrapper.innerHTML);

    let priceValue: number | null = null;
    for (const span of priceWrapper.querySelectorAll("span")) {
      const text = span.textContent?.trim() ?? "";
      console.log(
        "[poe-sl]   span text:",
        JSON.stringify(text),
        "| matches numeric:",
        SELECTORS.priceAmountRe.test(text),
      );
      if (SELECTORS.priceAmountRe.test(text)) {
        priceValue = Number.parseFloat(text);
        break;
      }
    }
    // Targeted fallback: price value lives in the span immediately after a <br>
    if (priceValue === null) {
      const directSpan = priceWrapper.querySelector("br + span");
      const t = directSpan?.textContent?.trim() ?? "";
      console.log("[poe-sl]   br+span fallback text:", JSON.stringify(t));
      if (SELECTORS.priceAmountRe.test(t)) priceValue = Number.parseFloat(t);
    }
    if (priceValue === null) {
      console.log("[poe-sl]   → no numeric price found, skipping row", listingId);
      continue;
    }

    const img = priceWrapper.querySelector(SELECTORS.currencyImg);
    const currencySpanEl = priceWrapper.querySelector(SELECTORS.currencySpan);
    const priceCurrency =
      img?.getAttribute("alt") ?? currencySpanEl?.textContent?.trim() ?? "chaos";
    console.log("[poe-sl]   → price =", priceValue, priceCurrency);

    listings.push({ listingId, priceValue, priceCurrency });
  }

  return listings;
}

/**
 * Builds a full TradeCapture from the current document state.
 * Computes aggregates using only the dominant currency's samples;
 * minority-currency samples are kept in `samples` for reference.
 */
export function buildCapture(root: Document, tradeUrl: string): TradeCapture {
  const samples = extractSamples(root);
  const capturedAt = Date.now();

  if (samples.length === 0) {
    return {
      tradeUrl,
      samples: [],
      aggregates: { min: 0, median: 0, avg: 0, sampleSize: 0, currency: "chaos" },
      capturedAt,
    };
  }

  const dominant = getDominantCurrency(samples);
  const values = samples
    .filter((s) => s.priceCurrency === dominant)
    .map((s) => s.priceValue)
    .sort((a, b) => a - b);

  const sampleSize = values.length;
  const min = values[0] ?? 0;
  const avg = values.reduce((a, b) => a + b, 0) / sampleSize;
  const mid = Math.floor(sampleSize / 2);
  const median =
    sampleSize % 2 === 0 ? ((values[mid - 1] ?? 0) + (values[mid] ?? 0)) / 2 : (values[mid] ?? 0);

  return {
    tradeUrl,
    samples,
    aggregates: {
      min,
      median: +median.toFixed(2),
      avg: +avg.toFixed(2),
      sampleSize,
      currency: dominant,
    },
    capturedAt,
  };
}

/**
 * Reads the trade search bar text from the page, returning empty string when
 * not found. Used to pre-fill the "Save Search" modal name field.
 */
export function getSearchBarText(root: Document): string {
  for (const selector of SELECTORS.searchBarInputs) {
    const el = root.querySelector(selector) as HTMLInputElement | null;
    console.log(
      "[poe-sl] getSearchBarText: selector",
      JSON.stringify(selector),
      "→ el =",
      el,
      "| value =",
      el?.value,
    );
    if (el?.value) return el.value.trim();
  }
  console.log("[poe-sl] getSearchBarText: no match found");
  return "";
}

export function buildSearchFilterSnapshot(
  root: Document,
  tradeUrl: string,
): SearchFilterSnapshot | null {
  const groups = extractSearchFilterGroups(root);
  if (groups.length === 0) return null;

  const searchText = getSearchBarText(root);
  return {
    game: "poe1",
    tradeUrl,
    ...(searchText ? { searchText } : {}),
    capturedAt: Date.now(),
    groups,
  };
}

function extractSearchFilterGroups(root: Document): SearchFilterGroup[] {
  const groups: SearchFilterGroup[] = [];
  const searchText = getSearchBarText(root);
  if (searchText) {
    groups.push({
      label: "Search",
      entries: [{ label: "Query", values: [{ label: "Query", value: searchText }] }],
    });
  }

  for (const groupEl of root.querySelectorAll(".search-advanced .filter-group")) {
    const group = groupEl as HTMLElement;
    const label = cleanText(
      group.querySelector(":scope > .filter-group-header .filter-title")?.textContent ?? "",
    );
    if (!label || label.toLowerCase() === "trade filters") continue;

    const body = group.querySelector(":scope > .filter-group-body");
    if (!body) continue;

    const entries: SearchFilterEntry[] = [];
    const headerEntry = extractFilterEntry(
      group.querySelector(":scope > .filter-group-header .filter") as HTMLElement | null,
    );
    if (headerEntry) entries.push(headerEntry);

    for (const filterEl of body.querySelectorAll(":scope > .filter")) {
      const entry = extractFilterEntry(filterEl as HTMLElement);
      if (entry) entries.push(entry);
    }

    if (entries.length > 0) groups.push({ label, entries });
  }

  return groups;
}

function extractFilterEntry(filter: HTMLElement | null): SearchFilterEntry | null {
  if (!filter) return null;
  if (!isEnabledFilter(filter)) return null;

  const titleEl = filter.querySelector(":scope > .filter-body > .filter-title");
  const rawLabel = cleanText(titleEl?.textContent ?? "");
  const label = rawLabel.replace(/\s*\?\s*$/, "");
  if (!label || /^\+\s*Add Stat Filter/i.test(label)) return null;

  const values: SearchFilterValue[] = [];
  const selected = extractSelectedText(filter);
  if (selected && !isDefaultValue(selected)) {
    values.push({ label: "value", value: selected });
  }

  const socketValues = extractSocketValues(filter);
  values.push(...socketValues);

  const range = extractRange(filter);
  if (range) values.push({ label: "range", value: range });

  const textInput = [...filter.querySelectorAll("input[type='text']")]
    .map((input) => (input as HTMLInputElement).value.trim())
    .find(Boolean);
  if (textInput && !isDefaultValue(textInput)) values.push({ label: "value", value: textInput });

  const weight = (
    filter.querySelector("input[placeholder='weight']") as HTMLInputElement | null
  )?.value.trim();
  if (weight) values.push({ label: "weight", value: `weight ${weight}` });

  if (values.length === 0 && filter.querySelector(".mutate-type")) {
    values.push({ label: "value", value: "exists" });
  }

  if (values.length === 0) return null;
  return { label, values };
}

function isEnabledFilter(filter: HTMLElement): boolean {
  const toggle = filter.querySelector(
    ":scope > .input-group-btn > .toggle-btn",
  ) as HTMLElement | null;
  return !toggle || !toggle.classList.contains("off");
}

function extractSelectedText(filter: HTMLElement): string | null {
  const selected = filter.querySelector(".multiselect__option--selected span");
  const selectedText = cleanText(selected?.textContent ?? "");
  if (selectedText) return selectedText;

  const tags = filter.querySelectorAll(".multiselect__tag span, .multiselect__single");
  const texts = [...tags].map((el) => cleanText(el.textContent ?? "")).filter(Boolean);
  if (texts.length > 0) return texts.join(", ");

  return null;
}

function extractRange(filter: HTMLElement): string | null {
  const min = [...filter.querySelectorAll("input[placeholder='min']")]
    .map((input) => (input as HTMLInputElement).value.trim())
    .find(Boolean);
  const max = [...filter.querySelectorAll("input[placeholder='max']")]
    .map((input) => (input as HTMLInputElement).value.trim())
    .find(Boolean);

  if (min && max) return `${min}-${max}`;
  if (min) return `${min}+`;
  if (max) return `≤${max}`;
  return null;
}

function extractSocketValues(filter: HTMLElement): SearchFilterValue[] {
  const sockets = [
    ["R", ".socket.str"],
    ["G", ".socket.dex"],
    ["B", ".socket.int"],
    ["W", ".socket.gen"],
  ] as const;

  return sockets.flatMap(([label, selector]) => {
    const value = (filter.querySelector(selector) as HTMLInputElement | null)?.value.trim();
    return value ? [{ label, value: `${label}${value}` }] : [];
  });
}

function isDefaultValue(value: string): boolean {
  return ["any", "any time", "buyout or fixed price", "chaos orb equivalent"].includes(
    value.toLowerCase(),
  );
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

// ── Internals ─────────────────────────────────────────────────────────────────

function getDominantCurrency(samples: RawListing[]): string {
  const counts = new Map<string, number>();
  for (const s of samples) {
    counts.set(s.priceCurrency, (counts.get(s.priceCurrency) ?? 0) + 1);
  }

  let best = "chaos";
  let bestCount = 0;
  for (const [currency, count] of counts) {
    if (count > bestCount || (count === bestCount && tieBreak(currency, best))) {
      best = currency;
      bestCount = count;
    }
  }
  return best;
}

// chaos > divine > alphabetical
const CURRENCY_PRIORITY: Record<string, number> = { chaos: 0, divine: 1 };
function tieBreak(a: string, b: string): boolean {
  const pa = CURRENCY_PRIORITY[a] ?? 99;
  const pb = CURRENCY_PRIORITY[b] ?? 99;
  if (pa !== pb) return pa < pb;
  return a < b;
}

/**
 * Extracts item data from a single trade result row element.
 * Returns null if the row cannot be parsed (missing id, name, or price).
 */
export function extractRowData(row: Element): RowData | null {
  const listingId = (row as HTMLElement).dataset.id;
  if (!listingId) return null;

  // Item name: first .itemName .lc inside the row
  const nameEl = row.querySelector(SELECTORS.itemName);
  const name = nameEl?.textContent?.trim() ?? "";
  if (!name) return null;

  // Base type: .itemName.typeLine .lc
  const baseEl = row.querySelector(SELECTORS.itemBase);
  const base = baseEl?.textContent?.trim() ?? "";

  // Price extraction (same logic as extractSamples for a single row)
  const priceWrapper = row.querySelector(SELECTORS.priceWrapper);
  if (!priceWrapper) return null;

  let priceValue: number | null = null;
  for (const span of priceWrapper.querySelectorAll("span")) {
    const text = span.textContent?.trim() ?? "";
    if (SELECTORS.priceAmountRe.test(text)) {
      priceValue = Number.parseFloat(text);
      break;
    }
  }
  if (priceValue === null) {
    const directSpan = priceWrapper.querySelector("br + span");
    const t = directSpan?.textContent?.trim() ?? "";
    if (SELECTORS.priceAmountRe.test(t)) priceValue = Number.parseFloat(t);
  }
  if (priceValue === null) return null;

  const img = priceWrapper.querySelector(SELECTORS.currencyImg);
  const currencySpanEl = priceWrapper.querySelector(SELECTORS.currencySpan);
  const priceCurrency = img?.getAttribute("alt") ?? currencySpanEl?.textContent?.trim() ?? "chaos";

  return { listingId, name, base, priceValue, priceCurrency };
}
