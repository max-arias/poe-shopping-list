import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createPublishedListRecord, deriveLastReviewed } from "./last-reviewed";
import { serializeShareableList } from "./serialize";
import { publishedListSchema, shareableListSchema } from "./schemas";
import { taxonomy } from "./taxonomy";
import { collectSourceFiles, ContentValidationError, validateContentDirectory, validatePublishedList } from "./validate-content";
import { parseTestFixture, validPublishedList, validPublishedListSource, validZeroTagEvergreenList } from "./fixtures";

const references = { categories: ["future-category"], tags: ["future-tag", "another-tag"] };
const publishablePath = resolve("src/content/lists");

function expectInvalid(patch: Record<string, unknown>, fieldPath: string) {
  try {
    validatePublishedList({ ...validPublishedList, ...patch }, references, "fixtures/invalid.json");
    throw new Error("expected validation to fail");
  } catch (error) {
    expect(error).toBeInstanceOf(ContentValidationError);
    expect((error as ContentValidationError).fieldPath).toBe(fieldPath);
    expect((error as Error).message).toContain("fixtures/invalid.json");
  }
}

describe("Published List contract", () => {
  it("accepts the deterministic fixture and preserves item order", () => {
    expect(() => publishedListSchema.parse(validPublishedList)).not.toThrow();
    expect(validatePublishedList(validPublishedList, references).items.map((i) => i.title)).toEqual(["First item", "Second item"]);
    expect(validatePublishedList(validZeroTagEvergreenList, references).overview).toBe("Optional test-only overview");
    expect(validZeroTagEvergreenList.tags).toEqual([]);
    expect(validatePublishedList({ ...validPublishedList, tags: ["future-tag", "another-tag"] }, references).tags).toHaveLength(2);
  });

  it.each([
    ["unknown category", { category: "unknown" }, "category"],
    ["unknown tag", { tags: ["unknown"] }, "tags.0"],
    ["missing applicability", { applicability: undefined }, "applicability"],
    ["malformed URL", { items: [{ ...validPublishedList.items[0], tradeUrl: "https://example.com/trade" }] }, "items.0.tradeUrl"],
    ["empty items", { items: [] }, "items"],
    ["empty title", { title: "  " }, "title"],
    ["empty variant", { items: [{ ...validPublishedList.items[0], variant: " " }] }, "items.0.variant"],
    ["empty rationale", { items: [{ ...validPublishedList.items[0], rationale: " " }] }, "items.0.rationale"],
    ["duplicate trade URL", { items: [validPublishedList.items[0], validPublishedList.items[0]] }, "items.1.tradeUrl"],
    ["invalid category slug", { category: "Not A Slug" }, "category"],
    ["price field", { price: 10 }, "price"],
    ["cache field", { cache: {} }, "cache"],
    ["query field", { query: "x" }, "query"],
    ["author timestamp", { lastReviewed: "2026-01-01T00:00:00.000Z" }, "lastReviewed"],
  ])("rejects %s", (_, patch, fieldPath) => {
    expectInvalid(patch, fieldPath);
  });

  it("accepts identical item titles when Trade URLs differ", () => {
    const items = [
      validPublishedList.items[0],
      { ...validPublishedList.items[1], title: validPublishedList.items[0].title },
    ];
    expect(validatePublishedList({ ...validPublishedList, items }, references).items.map((item) => item.title)).toEqual([
      "First item",
      "First item",
    ]);
  });

  it("requires exactly one league or evergreen applicability", () => {
    expect(() => publishedListSchema.parse({ ...validPublishedList, applicability: { game: "poe1" } })).toThrow();
    expect(() => publishedListSchema.parse({ ...validPublishedList, applicability: { game: "poe1", league: "X", evergreen: true } })).toThrow();
  });

  it("exports only strict Shareable List v1 fields and source order", () => {
    const result = serializeShareableList({ ...validPublishedList, category: "future-category", tags: [] });
    expect(result).toEqual({ format: "poe-shopping-list", version: 1, title: validPublishedList.title, items: [
      { title: "First item", tradeUrl: validPublishedList.items[0].tradeUrl, variant: "Normal", note: "First rationale" },
      { title: "Second item", tradeUrl: validPublishedList.items[1].tradeUrl, variant: "Any" },
    ] });
    expect(() => shareableListSchema.parse({ ...result, category: "secret" })).toThrow();
    expect(() => shareableListSchema.parse({ format: "poe-shopping-list", version: 1, title: "Variant only", items: [{ title: "Item", tradeUrl: validPublishedList.items[0].tradeUrl, variant: "Any" }] })).not.toThrow();
  });

  it("derives timestamps only from injected Git history", () => {
    expect(deriveLastReviewed(() => "2025-01-02T03:04:05.000Z")).toBe("2025-01-02T03:04:05.000Z");
    expect(() => deriveLastReviewed(() => "not-a-date")).toThrow();
    expect(() => createPublishedListRecord("content/lists/one.md", validPublishedList, () => undefined)).toThrow();
    expect(createPublishedListRecord("content/lists/one.md", validPublishedList, (file) => file === "content/lists/one.md" ? "2025-01-02T03:04:05.000Z" : undefined).lastReviewed).toBe("2025-01-02T03:04:05.000Z");
  });

  it("keeps fixtures outside the collectable content path", () => {
    expect(resolve("src/domain/fixtures.ts").startsWith(`${publishablePath}/`)).toBe(false);
    expect(resolve("src/domain/contracts.test.ts").startsWith(`${publishablePath}/`)).toBe(false);
    expect(taxonomy.categories).toEqual(["mercenaries", "guardian", "defense"]);
    expect(taxonomy.tags).toEqual(["league-start", "defense", "budget"]);
  });

  it("rejects a copied raw test fixture at the collection boundary", async () => {
    const copiedDirectory = await mkdtemp("/tmp/poe-web-fixture-copy-");
    const copiedSource = resolve(copiedDirectory, "copied-fixture.json");
    await writeFile(copiedSource, JSON.stringify(validPublishedListSource));
    try {
      await expect(validateContentDirectory(copiedDirectory, references, () => "2025-01-02T03:04:05.000Z"))
        .rejects.toMatchObject({ sourceFile: copiedSource, fieldPath: "testOnly" });
    } finally {
      await rm(copiedDirectory, { recursive: true, force: true });
    }
    expect(parseTestFixture(validPublishedListSource).title).toBe(validPublishedList.title);
  });

  it("accepts a present empty directory without requesting Git history and rejects a missing one", async () => {
    let calls = 0;
    const empty = await import("node:fs/promises").then(({ mkdtemp }) => mkdtemp("/tmp/poe-web-empty-"));
    expect(await validateContentDirectory(empty, references, () => { calls += 1; return undefined; })).toEqual([]);
    expect(calls).toBe(0);
    await expect(validateContentDirectory(`${empty}-missing`, references)).rejects.toThrow("directory is missing");
    const collected = await collectSourceFiles(publishablePath);
    expect(collected.some((file) => file.includes("fixtures") || file.includes("contracts.test"))).toBe(false);
  });
});
