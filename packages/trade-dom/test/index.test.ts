import { describe, it, expect } from "vitest";
import { JSDOM } from "jsdom";
import { extractSamples, buildCapture, isCaptureable, getSearchBarText } from "../src/index.js";

// ── Fixture helpers ───────────────────────────────────────────────────────────

function makeRow(id: string, price: number, currency: string): string {
  return `
    <div class="row" data-id="${id}">
      <div data-field="price">
        <span>${price}</span>
        <span class="currency-text"><img alt="${currency}" /></span>
      </div>
    </div>`;
}

function makeDoc(rows: string[], searchBarValue = ""): Document {
  const html = `
    <html><body>
      <div class="resultset">${rows.join("")}</div>
      <input class="search-filter-text" type="text" value="${searchBarValue}" />
    </body></html>`;
  return new JSDOM(html).window.document;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("isCaptureable", () => {
  it("returns true when rows exist", () => {
    const doc = makeDoc([makeRow("a", 10, "chaos")]);
    expect(isCaptureable(doc)).toBe(true);
  });

  it("returns false when no rows", () => {
    const doc = makeDoc([]);
    expect(isCaptureable(doc)).toBe(false);
  });
});

describe("extractSamples", () => {
  it("parses price and currency from rows", () => {
    const doc = makeDoc([makeRow("id1", 14, "chaos"), makeRow("id2", 1.8, "divine")]);
    const samples = extractSamples(doc);
    expect(samples).toHaveLength(2);
    expect(samples[0]).toEqual({ listingId: "id1", priceValue: 14, priceCurrency: "chaos" });
    expect(samples[1]).toEqual({ listingId: "id2", priceValue: 1.8, priceCurrency: "divine" });
  });

  it("skips rows with no data-id", () => {
    const html = `
      <html><body><div class="resultset">
        <div class="row"><div data-field="price"><span>10</span><span class="currency-text"><img alt="chaos"/></span></div></div>
      </div></body></html>`;
    const doc = new JSDOM(html).window.document;
    expect(extractSamples(doc)).toHaveLength(0);
  });
});

describe("buildCapture", () => {
  it("computes correct aggregates for same-currency samples", () => {
    const doc = makeDoc([
      makeRow("a", 10, "chaos"),
      makeRow("b", 20, "chaos"),
      makeRow("c", 30, "chaos"),
    ]);
    const capture = buildCapture(doc, "https://pathofexile.com/trade/search/test");
    expect(capture.aggregates.currency).toBe("chaos");
    expect(capture.aggregates.sampleSize).toBe(3);
    expect(capture.aggregates.min).toBe(10);
    expect(capture.aggregates.median).toBe(20);
    expect(capture.aggregates.avg).toBe(20);
  });

  it("picks chaos as dominant over divine when tied", () => {
    const doc = makeDoc([makeRow("a", 10, "chaos"), makeRow("b", 2, "divine")]);
    const capture = buildCapture(doc, "https://example.com");
    expect(capture.aggregates.currency).toBe("chaos");
  });

  it("returns sampleSize 0 when no rows", () => {
    const doc = makeDoc([]);
    const capture = buildCapture(doc, "https://example.com");
    expect(capture.aggregates.sampleSize).toBe(0);
  });
});

describe("getSearchBarText", () => {
  it("reads value from search-filter-text input", () => {
    const doc = makeDoc([], "Crown of Eyes · +1 phys spell");
    expect(getSearchBarText(doc)).toBe("Crown of Eyes · +1 phys spell");
  });

  it("returns empty string when input absent", () => {
    const doc = new JSDOM("<html><body></body></html>").window.document;
    expect(getSearchBarText(doc)).toBe("");
  });
});
