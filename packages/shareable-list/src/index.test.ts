import { gzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import {
  MAX_COMPRESSED_BYTES,
  MAX_DECOMPRESSED_BYTES,
  decodeShareableList,
  encodeShareableList,
  type ShareableList,
} from "./index";

const list: ShareableList = {
  format: "poe-shopping-list",
  version: 1,
  title: "Résumé 🛒",
  overview: "Unicode works",
  items: [{ title: "Épée", tradeUrl: "https://example.com/trade/1", variant: "高", note: "✓" }],
};

const toToken = (bytes: Uint8Array) => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `psl1.${btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "")}`;
};
const tokenFor = (value: unknown) => toToken(gzipSync(new TextEncoder().encode(JSON.stringify(value)), { mtime: 0, level: 6, mem: 8 }));

describe("shareable list transport", () => {
  it("roundtrips regular and Unicode lists", () => expect(decodeShareableList(encodeShareableList(list))).toEqual(list));
  it("decodes a frozen v1 token", () => expect(decodeShareableList(tokenFor(list))).toEqual(list));
  it("accepts only surrounding ASCII whitespace", () => expect(decodeShareableList(` \n${encodeShareableList(list)}\t`)).toEqual(list));
  it.each(["x", "psl2.abc", "psl1.a=b", "psl1.a.b", "psl1.a"])("rejects invalid token %s", (token) => expect(() => decodeShareableList(token)).toThrow());
  it("rejects corruption, truncation, footer changes, and trailing data", () => {
    const encoded = encodeShareableList(list);
    const bytes = Uint8Array.from(atob(encoded.slice(5).replaceAll("-", "+").replaceAll("_", "/") + "=="), (x) => x.charCodeAt(0));
    for (const changed of [bytes.slice(0, -1), Uint8Array.from(bytes, (x, i) => i === bytes.length - 1 ? x ^ 1 : x), new Uint8Array([...bytes, 0])]) {
      const b64 = btoa(String.fromCharCode(...changed)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
      expect(() => decodeShareableList(`psl1.${b64}`)).toThrow();
    }
  });
  it("rejects unknown fields and bad schemas", () => {
    expect(() => decodeShareableList(tokenFor({ ...list, extra: true }))).toThrow();
    expect(() => decodeShareableList(tokenFor({ ...list, items: [{ ...list.items[0], extra: true }] }))).toThrow();
  });
  it("rejects invalid UTF-8 instead of replacing it", () => {
    expect(() => decodeShareableList(toToken(gzipSync(Uint8Array.from([0xc3, 0x28]), { mtime: 0 })))).toThrow();
  });
  it("allows 500 items but rejects 501", () => {
    const items = Array.from({ length: 500 }, (_, i) => ({ title: `Item ${i}`, tradeUrl: "https://example.com/trade/1" }));
    expect(decodeShareableList(encodeShareableList({ ...list, items }))).toMatchObject({ items });
    expect(() => encodeShareableList({ ...list, items: [...items, items[0]] })).toThrow();
  });
  it("enforces compressed and decompressed bounds", () => {
    const huge = { ...list, overview: "x".repeat(MAX_DECOMPRESSED_BYTES) };
    expect(() => decodeShareableList(tokenFor(huge))).toThrow();
    expect(() => decodeShareableList(toToken(new Uint8Array(MAX_COMPRESSED_BYTES + 1)))).toThrow();
  });
});
