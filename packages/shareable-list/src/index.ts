import { Gunzip, gzipSync } from "fflate";
import { z } from "zod";

export const MAX_ITEMS = 500;
export const MAX_GROUPS = 100;
export const MAX_COMPRESSED_BYTES = 256 * 1024;
export const MAX_DECOMPRESSED_BYTES = 1024 * 1024;
export const SHAREABLE_LIST_PREFIX = "psl1.";

const titleSchema = z.string().min(1).refine((value) => value.trim().length > 0);
const tradeUrlSchema = z
  .string()
  .url()
  .refine((value) => value.startsWith("http://") || value.startsWith("https://"), "tradeUrl must be an HTTP(S) URL");

export const shareableListItemSchema = z
  .object({
    title: titleSchema,
    tradeUrl: tradeUrlSchema,
    variant: z.string().optional(),
    note: z.string().optional(),
  })
  .strict();

export const shareableListGroupSchema = z
  .object({
    title: titleSchema.optional(),
    items: z.array(shareableListItemSchema).max(MAX_ITEMS),
  })
  .strict();

export const shareableListSchema = z
  .object({
    format: z.literal("poe-shopping-list"),
    version: z.literal(1),
    title: titleSchema,
    overview: z.string().optional(),
    groups: z.array(shareableListGroupSchema).max(MAX_GROUPS).refine(
      (groups) => groups.reduce((count, group) => count + group.items.length, 0) <= MAX_ITEMS,
      `A list may contain at most ${MAX_ITEMS} items`,
    ),
  })
  .strict();

export type ShareableListItem = z.infer<typeof shareableListItemSchema>;
export type ShareableListGroup = z.infer<typeof shareableListGroupSchema>;
export type ShareableList = z.infer<typeof shareableListSchema>;
// Uppercase aliases keep the schema names familiar to existing TypeScript consumers.
export const ShareableListItemSchema = shareableListItemSchema;
export const ShareableListGroupSchema = shareableListGroupSchema;
export const ShareableListSchema = shareableListSchema;

export class ShareableListTransportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShareableListTransportError";
  }
}

const ASCII_TRIM = /^[\t\n\v\f\r ]+|[\t\n\v\f\r ]+$/g;

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
  if (value.length % 4 === 1 || !/^[A-Za-z0-9_-]*$/.test(value)) {
    throw new ShareableListTransportError("Invalid canonical base64url payload");
  }
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (value.length % 4)) % 4);
  let decoded: string;
  try {
    decoded = atob(padded);
  } catch {
    throw new ShareableListTransportError("Invalid base64url payload");
  }
  const bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
  if (base64UrlEncode(bytes) !== value) throw new ShareableListTransportError("Non-canonical base64url payload");
  return bytes;
}

function decodeGzip(bytes: Uint8Array): Uint8Array {
  if (bytes.length > MAX_COMPRESSED_BYTES) throw new ShareableListTransportError("Compressed payload is too large");
  const chunks: Uint8Array[] = [];
  let size = 0;
  let extraMember = false;
  try {
    const gunzip = new Gunzip((chunk, final) => {
      size += chunk.byteLength;
      if (size > MAX_DECOMPRESSED_BYTES) throw new ShareableListTransportError("Decompressed payload is too large");
      if (chunk.byteLength) chunks.push(chunk);
      if (final && size === 0) chunks.push(new Uint8Array());
    });
    gunzip.onmember = (offset) => {
      if (offset !== 0) extraMember = true;
    };
    gunzip.push(bytes, true);
  } catch (error) {
    if (error instanceof ShareableListTransportError) throw error;
    throw new ShareableListTransportError("Invalid or corrupt gzip payload");
  }
  if (extraMember) throw new ShareableListTransportError("Trailing gzip member is not allowed");
  const output = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  if (bytes.length < 18 || readUint32(bytes, bytes.length - 8) !== crc32(output) || readUint32(bytes, bytes.length - 4) !== (output.length >>> 0)) {
    throw new ShareableListTransportError("Invalid gzip checksum or footer");
  }
  return output;
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function encodeShareableList(input: ShareableList): string {
  const list = shareableListSchema.parse(input);
  const json = JSON.stringify(list);
  const compressed = gzipSync(new TextEncoder().encode(json), { level: 6, mem: 8, mtime: 0 });
  if (compressed.length > MAX_COMPRESSED_BYTES) throw new ShareableListTransportError("Compressed payload is too large");
  return SHAREABLE_LIST_PREFIX + base64UrlEncode(compressed);
}

export function decodeShareableList(token: string): ShareableList {
  if (typeof token !== "string") throw new ShareableListTransportError("Payload must be a string");
  const normalized = token.replace(ASCII_TRIM, "");
  if (!normalized.startsWith(SHAREABLE_LIST_PREFIX)) throw new ShareableListTransportError("Invalid payload prefix");
  const compressed = base64UrlDecode(normalized.slice(SHAREABLE_LIST_PREFIX.length));
  const jsonBytes = decodeGzip(compressed);
  let json: string;
  try {
    json = new TextDecoder("utf-8", { fatal: true }).decode(jsonBytes);
  } catch {
    throw new ShareableListTransportError("Payload is not valid UTF-8");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new ShareableListTransportError("Payload is not valid JSON");
  }
  return shareableListSchema.parse(parsed);
}
