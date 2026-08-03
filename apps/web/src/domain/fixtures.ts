import { publishedListSchema, type PublishedList } from "./schemas";

export type TestOnlyFixtureSource = Record<string, unknown> & { testOnly: true };

/** Raw fixture inputs intentionally cannot satisfy the publishable schema. */
export const validPublishedListSource = {
  testOnly: true,
  title: "Deterministic test list",
  category: "future-category",
  tags: ["future-tag"],
  applicability: { game: "poe1", league: "Test League" },
  items: [
    { title: "First item", tradeUrl: "https://www.pathofexile.com/trade/search/Test?q=first", variant: "Normal", rationale: "First rationale" },
    { title: "Second item", tradeUrl: "https://www.pathofexile.com/trade/search/Test?q=second", variant: "Any" },
  ],
} satisfies TestOnlyFixtureSource;

export const validZeroTagEvergreenListSource = {
  testOnly: true,
  title: "Evergreen deterministic test list",
  overview: "Optional test-only overview",
  category: "future-category",
  tags: [],
  applicability: { game: "poe1", evergreen: true },
  items: [{ title: "Evergreen item", tradeUrl: "https://www.pathofexile.com/trade/search/Standard?q=evergreen" }],
} satisfies TestOnlyFixtureSource;

/** Test-only adapter: remove the marker, then apply the real domain schema. */
export function parseTestFixture(source: TestOnlyFixtureSource): PublishedList {
  if (source.testOnly !== true) throw new Error("fixture source must be marked testOnly");
  const { testOnly: _testOnly, ...publishedData } = source;
  return publishedListSchema.parse(publishedData);
}

export const validPublishedList = parseTestFixture(validPublishedListSource);
export const validZeroTagEvergreenList = parseTestFixture(validZeroTagEvergreenListSource);
