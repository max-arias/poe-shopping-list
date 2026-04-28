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
        priceValue = parseFloat(text);
        break;
      }
    }
    // Targeted fallback: price value lives in the span immediately after a <br>
    if (priceValue === null) {
      const directSpan = priceWrapper.querySelector("br + span");
      const t = directSpan?.textContent?.trim() ?? "";
      console.log("[poe-sl]   br+span fallback text:", JSON.stringify(t));
      if (SELECTORS.priceAmountRe.test(t)) priceValue = parseFloat(t);
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
  const min = values[0]!;
  const avg = values.reduce((a, b) => a + b, 0) / sampleSize;
  const mid = Math.floor(sampleSize / 2);
  const median = sampleSize % 2 === 0 ? (values[mid - 1]! + values[mid]!) / 2 : values[mid]!;

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
