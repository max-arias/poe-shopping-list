import { DraftSchema, type Draft, type DraftItem } from "@/types";
import { computed, ref } from "vue";
import { storage } from "wxt/utils/storage";
import { STORAGE } from "@/types/storage";
import { useUiStore } from "../stores/ui";

const draftsItem = storage.defineItem<Draft[]>(STORAGE.drafts, { fallback: [] });
function validStoredDrafts(value: unknown): Draft[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const result = DraftSchema.safeParse(entry);
    return result.success ? [result.data] : [];
  });
}
const drafts = ref<Draft[]>([]);
const isLoaded = ref(false);
let initialized = false;
function ensureInitialized() {
  if (initialized) return;
  initialized = true;
  void draftsItem.getValue().then((stored) => {
    drafts.value = validStoredDrafts(stored);
    isLoaded.value = true;
  });
  draftsItem.watch((value) => {
    drafts.value = validStoredDrafts(value);
    isLoaded.value = true;
  });
}

export function useDraftList() {
  ensureInitialized();
  const ui = useUiStore();
  const draft = computed<Draft | null>(() =>
    ui.currentView.type === "detail"
      ? (drafts.value.find((value) => value.id === ui.currentView.draftId) ?? null)
      : null,
  );
  async function saveAll(updated: Draft[]) {
    const validated = DraftSchema.array().parse(updated);
    await draftsItem.setValue(validated);
    drafts.value = validated;
  }
  async function saveDraft(updated: Draft) {
    await saveAll(drafts.value.map((value) => (value.id === updated.id ? updated : value)));
  }
  async function createDraft(title: string, overview?: string) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) throw new Error("Draft title must not be empty");
    const created: Draft = {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      ...(overview?.trim() ? { overview: overview.trim() } : {}),
      createdAt: Date.now(),
      groups: [{ id: crypto.randomUUID(), position: 0, items: [] }],
    };
    await saveAll([...drafts.value, created]);
    return created;
  }
  async function addDraft(importedDraft: Draft) {
    const validated = DraftSchema.parse(importedDraft);
    await saveAll([...drafts.value, validated]);
    return validated;
  }
  async function updateDraftOverview(draftId: string, overview: string) {
    const target = drafts.value.find((value) => value.id === draftId);
    if (!target) return false;
    const trimmedOverview = overview.trim();
    const updated = { ...target };
    if (trimmedOverview) updated.overview = trimmedOverview;
    else delete updated.overview;
    await saveDraft(updated);
    return true;
  }
  async function reorderDraftItems(draftId: string, groupId: string, orderedItemIds: string[]) {
    const target = drafts.value.find((value) => value.id === draftId);
    const group = target?.groups.find((value) => value.id === groupId);
    if (!target || !group || !Array.isArray(orderedItemIds) || orderedItemIds.length !== group.items.length)
      return false;

    const itemIds = new Set(group.items.map((item) => item.id));
    const isCompletePermutation =
      orderedItemIds.every((id) => itemIds.has(id)) &&
      new Set(orderedItemIds).size === itemIds.size;
    if (!isCompletePermutation) return false;

    const itemsById = new Map(group.items.map((item) => [item.id, item]));
    const items = orderedItemIds.map((id, position) => ({ ...itemsById.get(id)!, position }));
    await saveDraft({ ...target, groups: target.groups.map((value) => value.id === groupId ? { ...value, items } : value) });
    return true;
  }
  async function renameGroup(draftId: string, groupId: string, title: string) {
    const target = drafts.value.find((value) => value.id === draftId);
    const group = target?.groups.find((value) => value.id === groupId);
    if (!target || !group) return false;
    const trimmed = title.trim();
    const updatedGroup = trimmed ? { ...group, title: trimmed } : (() => { const { title: _, ...rest } = group; return rest; })();
    await saveDraft({ ...target, groups: target.groups.map((value) => value.id === groupId ? updatedGroup : value) });
    return true;
  }
  async function renameDraft(title: string) {
    if (draft.value) await saveDraft({ ...draft.value, title: title.trim() });
  }
  async function deleteDraft() {
    if (draft.value) await deleteDraftById(draft.value.id);
  }
  async function deleteDraftById(id: string) {
    await saveAll(drafts.value.filter((value) => value.id !== id));
  }
  type ItemDetails = Pick<DraftItem, "variant" | "note">;
  async function addItemToDraft(
    draftId: string,
    title: string,
    tradeUrl: string,
    details: ItemDetails = {},
  ) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) throw new Error("Item title must not be empty");
    const target = drafts.value.find((value) => value.id === draftId);
    if (!target) return null;
    const item: DraftItem = {
      id: crypto.randomUUID(),
      position: target.groups[0]?.items.length ?? 0,
      title: trimmedTitle,
      tradeUrl,
      ...details,
      completed: false,
      addedAt: Date.now(),
    };
    await saveAll(
      drafts.value.map((value) =>
        value.id === draftId ? { ...value, groups: value.groups.length ? value.groups.map((group, index) => index === 0 ? { ...group, items: [...group.items, item] } : group) : [{ id: crypto.randomUUID(), position: 0, items: [item] }] } : value,
      ),
    );
    return item;
  }
  async function addItem(title: string, tradeUrl: string, details: ItemDetails = {}) {
    return draft.value ? addItemToDraft(draft.value.id, title, tradeUrl, details) : null;
  }
  async function removeItem(itemId: string) {
    if (draft.value)
      await saveDraft({
        ...draft.value,
        groups: draft.value.groups.map((group) => ({ ...group, items: group.items
          .filter((item) => item.id !== itemId)
          .map((item, position) => ({ ...item, position })) })),
      });
  }
  async function setComplete(itemId: string, completed: boolean) {
    if (draft.value)
      await saveDraft({
        ...draft.value,
        groups: draft.value.groups.map((group) => ({ ...group, items: group.items.map((item) => item.id === itemId ? { ...item, completed } : item) })),
      });
  }
  async function renameItem(itemId: string, title: string) {
    if (draft.value)
      await saveDraft({
        ...draft.value,
        groups: draft.value.groups.map((group) => ({ ...group, items: group.items.map((item) => item.id === itemId ? { ...item, title: title.trim() } : item) })),
      });
  }
  async function updateItem(
    itemId: string,
    patch: Partial<Pick<DraftItem, "title" | "tradeUrl" | "variant" | "note">>,
  ) {
    if (draft.value)
      await saveDraft({
        ...draft.value,
        groups: draft.value.groups.map((group) => ({ ...group, items: group.items.map((item) => item.id === itemId ? { ...item, ...patch } : item) })),
      });
  }
  async function unmarkAll() {
    if (draft.value)
      await saveDraft({
        ...draft.value,
        groups: draft.value.groups.map((group) => ({ ...group, items: group.items.map((item) => ({ ...item, completed: false })) })),
      });
  }
  return {
    drafts,
    draft,
    isLoaded,
    createDraft,
    addDraft,
    updateDraftOverview,
    reorderDraftItems,
    renameGroup,
    renameDraft,
    deleteDraft,
    deleteDraftById,
    addItem,
    addItemToDraft,
    removeItem,
    setComplete,
    renameItem,
    updateItem,
    unmarkAll,
  };
}
