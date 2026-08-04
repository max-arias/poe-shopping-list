import { describe, expect, it } from "vitest";
import { decodeShareableList, encodeShareableList } from "@poe-sl/shareable-list";
import { DraftSchema } from "@/types";
import { exportDraft, importDraft } from "./useImportExport";

const minimal = {
  format: "poe-shopping-list" as const,
  version: 1 as const,
  title: "Essentials",
  items: [{ title: "A unique", tradeUrl: "https://www.pathofexile.com/trade/search/Settlers?q=A" }],
};

const full = {
  ...minimal,
  overview: "Prioritize this list.",
  items: [{ ...minimal.items[0], variant: "Corrupted", note: "Buy this first" }],
};

const gzipToken = async (value: unknown) => {
  const stream = new CompressionStream("gzip");
  const writer = stream.writable.getWriter();
  const encoded = new TextEncoder().encode(JSON.stringify(value));
  await writer.write(encoded);
  await writer.close();
  const bytes = new Uint8Array(await new Response(stream.readable).arrayBuffer());
  const base64 = btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
  return `psl1.${base64}`;
};

describe("v1 shareable list transport", () => {
  it("imports the minimal contract into a valid incomplete Draft", () => {
    const draft = importDraft(encodeShareableList(minimal));
    expect(() => DraftSchema.parse(draft)).not.toThrow();
    expect(draft.title).toBe(minimal.title);
    expect(draft.overview).toBeUndefined();
    expect(draft.items[0]).toMatchObject({ title: "A unique", completed: false, position: 0 });
  });

  it("preserves the Draft title boundaries supported locally", () => {
    const input = {
      ...minimal,
      title: "L".repeat(500),
      items: [{ ...minimal.items[0], title: "I".repeat(500) }],
    };
    const draft = importDraft(encodeShareableList(input));
    expect(draft.title).toBe(input.title);
    expect(draft.items[0].title).toBe(input.items[0].title);
  });

  it("exports a psl1 token and roundtrips Unicode", () => {
    const draft = importDraft(encodeShareableList({ ...full, title: "買い物 🛒" }));
    const token = exportDraft(draft);
    expect(token.startsWith("psl1.")).toBe(true);
    expect(decodeShareableList(token)).toEqual({ ...full, title: "買い物 🛒" });
  });

  it("preserves order, strips local fields, and resets completion", () => {
    const draft = importDraft(encodeShareableList(full));
    const exported = exportDraft({
      ...draft,
      id: "local-draft",
      createdAt: 123,
      items: draft.items.map((item, position) => ({ ...item, id: `local-${position}`, addedAt: 456, completed: true })),
    });
    expect(decodeShareableList(exported)).toEqual(full);
    const imported = importDraft(exported);
    expect(imported.items.map((item) => item.position)).toEqual([0]);
    expect(imported.items.every((item) => !item.completed)).toBe(true);
  });

  it("rejects malformed and corrupt tokens, but not legacy JSON", () => {
    expect(() => importDraft(JSON.stringify(minimal))).toThrow();
    expect(() => importDraft("psl1.not-valid")).toThrow();
    const token = encodeShareableList(minimal);
    expect(() => importDraft(`${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`)).toThrow();
  });

  it("rejects strict schema violations after decoding", async () => {
    const token = await gzipToken({ ...minimal, extra: true });
    expect(() => importDraft(token)).toThrow();
  });

  it("rejects lists with 501 items", async () => {
    const items = Array.from({ length: 501 }, (_, index) => ({ title: `Item ${index}`, tradeUrl: "https://example.com/item" }));
    const token = await gzipToken({ ...minimal, items });
    expect(() => importDraft(token)).toThrow();
  });

  it("creates independent incomplete drafts on every import", () => {
    const token = encodeShareableList(full);
    const first = importDraft(token);
    const second = importDraft(token);
    expect(second.id).not.toBe(first.id);
    expect(second.createdAt).toBeTypeOf("number");
    expect(second.items[0].id).not.toBe(first.items[0].id);
    expect(first.items.every((item) => !item.completed)).toBe(true);
    expect(second.items.every((item) => !item.completed)).toBe(true);
    expect(() => DraftSchema.parse(first)).not.toThrow();
  });
});
