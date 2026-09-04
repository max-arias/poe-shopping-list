import { DraftSchema, type Draft, type DraftGroup, type DraftItem } from "@/types";

export type ItemDetails = Pick<DraftItem, "variant" | "note">;
export type DraftAppearance = { iconId?: string; color?: string };

export function validateDrafts(value: unknown): Draft[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const parsed = DraftSchema.safeParse(entry);
    return parsed.success ? [parsed.data] : [];
  });
}

export function replaceDraft(drafts: Draft[], updated: Draft): Draft[] {
  return drafts.map((draft) => (draft.id === updated.id ? updated : draft));
}

export function updateOverview(draft: Draft, overview: string): Draft {
  const trimmed = overview.trim();
  if (trimmed) return { ...draft, overview: trimmed };
  const { overview: _overview, ...withoutOverview } = draft;
  return withoutOverview;
}

/**
 * Apply the draft's mutually exclusive local appearance choice atomically.
 * If both fields are supplied, iconId wins deterministically; callers should
 * provide only one field. Invalid colors are rejected rather than persisted.
 */
export function updateAppearance(draft: Draft, appearance: DraftAppearance): Draft {
  const iconId = appearance.iconId?.trim();
  const rawColor = appearance.color?.trim();
  const color = rawColor?.toLowerCase();

  if (color && !/^#[0-9a-f]{6}$/.test(color)) {
    throw new Error("Draft color must be a #RRGGBB hex color");
  }

  const { iconId: _iconId, color: _color, ...withoutAppearance } = draft;
  if (iconId) return { ...withoutAppearance, iconId };
  if (color) return { ...withoutAppearance, color };
  return withoutAppearance;
}

export function reorderItems(draft: Draft, groupId: string, orderedIds: string[]): Draft | null {
  const group = draft.groups.find((value) => value.id === groupId);
  if (!group || orderedIds.length !== group.items.length) return null;
  const ids = new Set(group.items.map((item) => item.id));
  if (orderedIds.some((id) => !ids.has(id)) || new Set(orderedIds).size !== ids.size) return null;
  const byId = new Map(group.items.map((item) => [item.id, item]));
  const items = orderedIds.map((id, position) => ({ ...byId.get(id)!, position }));
  return {
    ...draft,
    groups: draft.groups.map((value) => (value.id === groupId ? { ...value, items } : value)),
  };
}

function reorder(items: DraftItem[], orderedIds: string[]): DraftItem[] | null {
  if (orderedIds.length !== items.length) return null;
  const byId = new Map(items.map((item) => [item.id, item]));
  if (orderedIds.some((id) => !byId.has(id)) || new Set(orderedIds).size !== items.length)
    return null;
  return orderedIds.map((id, position) => ({ ...byId.get(id)!, position }));
}

export function reorderRootItems(draft: Draft, orderedIds: string[]): Draft | null {
  const items = reorder(draft.items, orderedIds);
  return items ? { ...draft, items } : null;
}

export function createGroup(draft: Draft, groupId: string, title?: string): Draft {
  const trimmed = title?.trim();
  return {
    ...draft,
    groups: [
      ...draft.groups,
      {
        id: groupId,
        ...(trimmed ? { title: trimmed } : {}),
        position: draft.groups.length,
        items: [],
      },
    ],
  };
}

export function removeGroup(draft: Draft, groupId: string): Draft | null {
  const group = draft.groups.find((value) => value.id === groupId);
  if (!group) return null;
  const items = [...draft.items, ...group.items].map((item, position) => ({ ...item, position }));
  return {
    ...draft,
    items,
    groups: draft.groups
      .filter((value) => value.id !== groupId)
      .map((value, position) => ({ ...value, position })),
  };
}

export function updateGroupTitle(draft: Draft, groupId: string, title: string): Draft | null {
  if (!draft.groups.some((group) => group.id === groupId)) return null;
  return {
    ...draft,
    groups: draft.groups.map((group) => {
      if (group.id !== groupId) return group;
      const trimmed = title.trim();
      if (trimmed) return { ...group, title: trimmed };
      const { title: _title, ...withoutTitle } = group;
      return withoutTitle as DraftGroup;
    }),
  };
}

function updateItemInGroup(
  draft: Draft,
  groupId: string,
  itemId: string,
  update: (item: DraftItem) => DraftItem,
): Draft | null {
  const group = draft.groups.find((value) => value.id === groupId);
  if (!group || !group.items.some((item) => item.id === itemId)) return null;
  return {
    ...draft,
    groups: draft.groups.map((value) =>
      value.id === groupId
        ? { ...value, items: value.items.map((item) => (item.id === itemId ? update(item) : item)) }
        : value,
    ),
  };
}

export function updateItem(
  draft: Draft,
  groupId: string,
  itemId: string,
  patch: Partial<Pick<DraftItem, "title" | "tradeUrl" | "variant" | "note" | "completed">>,
): Draft | null {
  return updateItemInGroup(draft, groupId, itemId, (item) => ({ ...item, ...patch }));
}

export function updateRootItem(
  draft: Draft,
  itemId: string,
  patch: Partial<Pick<DraftItem, "title" | "tradeUrl" | "variant" | "note" | "completed">>,
): Draft | null {
  if (!draft.items.some((item) => item.id === itemId)) return null;
  return {
    ...draft,
    items: draft.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
  };
}

export function removeItem(draft: Draft, groupId: string, itemId: string): Draft | null {
  const group = draft.groups.find((value) => value.id === groupId);
  if (!group || !group.items.some((item) => item.id === itemId)) return null;
  return {
    ...draft,
    groups: draft.groups.map((group) =>
      group.id === groupId
        ? {
            ...group,
            items: group.items
              .filter((item) => item.id !== itemId)
              .map((item, position) => ({ ...item, position })),
          }
        : group,
    ),
  };
}

export function removeRootItem(draft: Draft, itemId: string): Draft | null {
  if (!draft.items.some((item) => item.id === itemId)) return null;
  return {
    ...draft,
    items: draft.items
      .filter((item) => item.id !== itemId)
      .map((item, position) => ({ ...item, position })),
  };
}

/** Move an item to a group, or to the root when targetGroupId is null. */
export function moveItem(draft: Draft, itemId: string, targetGroupId: string | null): Draft | null {
  const rootItem = draft.items.find((item) => item.id === itemId);
  const sourceGroup = draft.groups.find((group) => group.items.some((item) => item.id === itemId));
  const item = rootItem ?? sourceGroup?.items.find((value) => value.id === itemId);
  if (
    !item ||
    (targetGroupId !== null && !draft.groups.some((group) => group.id === targetGroupId))
  )
    return null;
  const groups = draft.groups.map((group) => ({
    ...group,
    items: group.items
      .filter((value) => value.id !== itemId)
      .map((value, position) => ({ ...value, position })),
  }));
  const items = draft.items
    .filter((value) => value.id !== itemId)
    .map((value, position) => ({ ...value, position }));
  if (targetGroupId === null)
    return { ...draft, items: [...items, { ...item, position: items.length }], groups };
  return {
    ...draft,
    items,
    groups: groups.map((group) =>
      group.id === targetGroupId
        ? { ...group, items: [...group.items, { ...item, position: group.items.length }] }
        : group,
    ),
  };
}

export function clearCompleted(draft: Draft): Draft {
  return {
    ...draft,
    items: draft.items.map((item) => ({ ...item, completed: false })),
    groups: draft.groups.map((group) => ({
      ...group,
      items: group.items.map((item) => ({ ...item, completed: false })),
    })),
  };
}
