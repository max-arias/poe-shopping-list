import { describe, expect, it } from "vitest";
import { DraftSchema } from "@/types";
import { exportDraft, importDraft } from "./useImportExport";

const minimal = {
  format: "poe-shopping-list",
  version: 1,
  title: "Essentials",
  items: [{ title: "A unique", tradeUrl: "https://www.pathofexile.com/trade/search/Settlers?q=A" }],
};

const full = {
  ...minimal,
  overview: "Prioritize this list.",
  items: [
    {
      ...minimal.items[0],
      variant: "Corrupted",
      note: "Buy this first",
    },
  ],
};

describe("v1 shareable lists", () => {
  it("imports the minimal contract", () => {
    const draft = importDraft(JSON.stringify(minimal));
    expect(() => DraftSchema.parse(draft)).not.toThrow();
    expect(draft.title).toBe(minimal.title);
    expect(draft.overview).toBeUndefined();
    expect(draft.items).toHaveLength(1);
    expect(draft.items[0]).toMatchObject({ title: "A unique", completed: false, position: 0 });
  });

  it("accepts portable title and item-title boundaries as local drafts", () => {
    const input = {
      ...minimal,
      title: "L".repeat(500),
      items: [{ ...minimal.items[0], title: "I".repeat(500) }],
    };
    const draft = importDraft(JSON.stringify(input));
    expect(() => DraftSchema.parse(draft)).not.toThrow();
    expect(draft.title).toBe(input.title);
    expect(draft.items[0].title).toBe(input.items[0].title);
  });

  it("imports and exports all supported fields", () => {
    const draft = importDraft(JSON.stringify(full));
    expect(JSON.parse(exportDraft(draft))).toEqual(full);
  });

  it("exports only the portable contract, excluding local fields", () => {
    const draft = {
      ...importDraft(JSON.stringify(full)),
      id: "local-draft",
      createdAt: 123,
      items: [
        {
          ...importDraft(JSON.stringify(full)).items[0],
          id: "local-item",
          addedAt: 456,
          completed: true,
        },
      ],
    };
    expect(JSON.parse(exportDraft(draft))).toEqual(full);
  });

  it.each([
    "not json",
    JSON.stringify({ ...minimal, format: "other" }),
    JSON.stringify({ ...minimal, version: 2 }),
    JSON.stringify({ ...minimal, extra: true }),
    JSON.stringify({ ...minimal, title: undefined }),
    JSON.stringify({ ...minimal, items: [{ title: "Missing URL" }] }),
    JSON.stringify({
      ...minimal,
      items: [{ title: "Bad URL", tradeUrl: "ftp://example.com/item" }],
    }),
    JSON.stringify({
      ...minimal,
      items: [{ title: "Unknown field", tradeUrl: minimal.items[0].tradeUrl, completed: false }],
    }),
    JSON.stringify({ ...minimal, title: "   " }),
    JSON.stringify({ ...minimal, items: [{ ...minimal.items[0], title: "\t  " }] }),
  ])("rejects invalid input", (input) => {
    expect(() => importDraft(input)).toThrow();
  });

  it("creates independent incomplete drafts on every import", () => {
    const first = importDraft(JSON.stringify(full));
    const second = importDraft(JSON.stringify(full));
    expect(second.id).not.toBe(first.id);
    expect(second.createdAt).toBeTypeOf("number");
    expect(second.items[0].id).not.toBe(first.items[0].id);
    expect(first.items.every((item) => !item.completed)).toBe(true);
    expect(second.items.every((item) => !item.completed)).toBe(true);
  });
});
