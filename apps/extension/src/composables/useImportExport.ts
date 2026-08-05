import { decodeShareableList, encodeShareableList } from "@poe-sl/shareable-list";
import { DraftSchema } from "@/types";
import type { Draft } from "@/types";

/** Serialize only the strict, versioned Shareable List contract. */
export function exportDraft(draft: Draft): string {
  const portable = {
    format: "poe-shopping-list",
    version: 1,
    title: draft.title,
    ...(draft.overview ? { overview: draft.overview } : {}),
    groups: draft.groups
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((group) => ({
      ...(group.title !== undefined ? { title: group.title } : {}),
      items: group.items
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((item) => ({
          title: item.title,
          tradeUrl: item.tradeUrl,
          ...(item.variant !== undefined ? { variant: item.variant } : {}),
          ...(item.note !== undefined ? { note: item.note } : {}),
        })),
    })),
  } as const;
  return encodeShareableList(portable);
}

/** Decode a strict v1 share token into a new independent local Personal Draft. */
export function importDraft(token: string): Draft {
  const portable = decodeShareableList(token);
  const now = Date.now();
  return DraftSchema.parse({
    id: crypto.randomUUID(),
    title: portable.title,
    ...(portable.overview !== undefined ? { overview: portable.overview } : {}),
    createdAt: now,
    groups: portable.groups.map((group, groupPosition) => ({
      id: crypto.randomUUID(),
      position: groupPosition,
      ...(group.title !== undefined ? { title: group.title } : {}),
      items: group.items.map((item, position) => ({
        id: crypto.randomUUID(), position, title: item.title, tradeUrl: item.tradeUrl,
        completed: false,
        ...(item.variant !== undefined ? { variant: item.variant } : {}),
        ...(item.note !== undefined ? { note: item.note } : {}),
        addedAt: now,
      })),
    })),
  });
}
