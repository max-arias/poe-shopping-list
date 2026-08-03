import { DraftSchema, ShareableListSchema } from "@/types";
import type { Draft } from "@/types";

/** Serialize only the strict, versioned Shareable List contract. */
export function exportDraft(draft: Draft): string {
  const portable = ShareableListSchema.parse({
    format: "poe-shopping-list",
    version: 1,
    title: draft.title,
    ...(draft.overview ? { overview: draft.overview } : {}),
    items: draft.items.map((item) => ({
      title: item.title,
      tradeUrl: item.tradeUrl,
      ...(item.variant !== undefined ? { variant: item.variant } : {}),
      ...(item.note !== undefined ? { note: item.note } : {}),
    })),
  });
  return JSON.stringify(portable);
}

/** Parse strict v1 JSON into a new independent local Personal Draft. */
export function importDraft(json: string): Draft {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Invalid import: not valid JSON");
  }

  const portable = ShareableListSchema.parse(parsed);
  const now = Date.now();
  return DraftSchema.parse({
    id: crypto.randomUUID(),
    title: portable.title,
    ...(portable.overview !== undefined ? { overview: portable.overview } : {}),
    createdAt: now,
    items: portable.items.map((item, position) => ({
      id: crypto.randomUUID(),
      position,
      title: item.title,
      tradeUrl: item.tradeUrl,
      completed: false,
      ...(item.variant !== undefined ? { variant: item.variant } : {}),
      ...(item.note !== undefined ? { note: item.note } : {}),
      addedAt: now,
    })),
  });
}
