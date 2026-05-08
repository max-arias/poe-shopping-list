/**
 * Versioned trade page selectors.
 * Update this object when the trade site DOM changes — no logic needs touching.
 */
export const SELECTORS = {
  /** Every priced result row (excludes .row-total and .row.controls). */
  allRows: '.resultset .row[data-id]',
  /** Price wrapper element inside a row. */
  priceWrapper: '[data-field="price"]',
  /** RegExp that matches a bare numeric price string, e.g. "14" or "1.8". */
  priceAmountRe: /^\d+(\.\d+)?$/,
  /** Currency icon with an alt attribute. */
  currencyImg: '.currency-text img[alt]',
  /** Currency name as text span (trade site may use span instead of img). */
  currencySpan: '.currency-text span',
  /** Trade search-bar input (tried in order, first match wins). */
  searchBarInputs: [
    '.search-panel .search-bar .search-left input',
    '#searchPanel .search-bar input[type="text"]',
    '.search-bar-input',
    'input.search-filter-text',
  ],
  /** Clear button in the search panel controls area. */
  clearBtn: '.search-panel .clear-btn',
  /** "Travel to Hideout" button inside a result row. */
  travelBtn: '.direct-btn',
  /** Item name element inside a row's popup. */
  itemName: '.itemName .lc',
  /** Item base type element inside a row's popup. */
  itemBase: '.itemName.typeLine .lc',
} as const;
