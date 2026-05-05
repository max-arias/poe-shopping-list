import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { DraftSchema } from "@/types";
import type { Draft } from "@/types";

/**
 * Export a draft list as a compressed, URL-safe string.
 * The string can be shared and imported by another user.
 */
export function exportDraft(draft: Draft): string {
  // Strip transient fields — only keep what's needed to recreate the list
  const portable = {
    n: draft.name,
    g: draft.game,
    l: draft.league,
    i: draft.items.map((item) => ({
      n: item.name,
      k: item.kind,
      u: item.tradeUrl,
      b: item.base,
    })),
    ...(draft.buildUrl ? { bu: draft.buildUrl } : {}),
    ...(draft.buildCreator ? { bc: draft.buildCreator } : {}),
    ...(draft.associatedUrls?.length ? { au: draft.associatedUrls } : {}),
  };
  const json = JSON.stringify(portable);
  return compressToEncodedURIComponent(json);
}

/**
 * Import a draft list from a compressed string.
 * Returns the parsed Draft (with a new ID and timestamps) or throws on invalid data.
 */
export function importDraft(encoded: string): Draft {
  const json = decompressFromEncodedURIComponent(encoded);
  if (!json) throw new Error("Invalid import string: decompression failed");

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Invalid import string: not valid JSON");
  }

  // Reconstruct a full Draft from the portable format
  const portable = parsed as Record<string, unknown>;

  const draft: Draft = {
    id: crypto.randomUUID(),
    name: String(portable.n ?? ""),
    game: String(portable.g ?? "poe1"),
    league: String(portable.l ?? ""),
    createdAt: Date.now(),
    items: Array.isArray(portable.i)
      ? (portable.i as Array<Record<string, unknown>>).map((item, pos) => ({
          id: crypto.randomUUID(),
          position: pos,
          name: String(item.n ?? ""),
          tradeUrl: String(item.u ?? ""),
          capture: null,
          completed: false,
          kind: String(item.k ?? "unique"),
          base: item.b ? String(item.b) : undefined,
          addedAt: Date.now(),
        }))
      : [],
    ...(portable.bu ? { buildUrl: String(portable.bu) } : {}),
    ...(portable.bc ? { buildCreator: String(portable.bc) } : {}),
    ...(Array.isArray(portable.au) ? { associatedUrls: portable.au as string[] } : {}),
  };

  // Validate with Zod
  return DraftSchema.parse(draft);
}
