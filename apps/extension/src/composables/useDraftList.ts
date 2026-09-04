import { DraftSchema, type Draft, type DraftItem } from "@/types";
import { computed, ref } from "vue";
import { storage } from "wxt/utils/storage";
import { STORAGE } from "@/types/storage";
import { useUiStore } from "../stores/ui";
import * as ops from "../domain/drafts";

const draftsItem = storage.defineItem<Draft[]>(STORAGE.drafts, { fallback: [] });
const drafts = ref<Draft[]>([]);
const isLoaded = ref(false);
let initialized = false;
let writeQueue: Promise<void> = Promise.resolve();

type DraftUpdate<T = void> = {
  drafts: Draft[];
  result?: T;
};

function ensureInitialized() {
  if (initialized) return;
  initialized = true;
  void draftsItem.getValue().then((stored) => {
    drafts.value = ops.validateDrafts(stored);
    isLoaded.value = true;
  });
  draftsItem.watch((value) => {
    drafts.value = ops.validateDrafts(value);
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

  async function enqueueWrite<T>(update: (current: Draft[]) => DraftUpdate<T>): Promise<T | void> {
    const operation = writeQueue
      .catch(() => undefined)
      .then(async () => {
        const current = ops.validateDrafts(drafts.value);
        const { drafts: updated, result } = update(current);
        const validated = DraftSchema.array().parse(updated);
        await draftsItem.setValue(validated);
        drafts.value = validated;
        return result;
      });
    // A failed operation must not reject the queue's tail and block later writes.
    writeQueue = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  }

  async function saveDraft(update: (current: Draft[]) => Draft[]) {
    await enqueueWrite((current) => ({ drafts: update(current) }));
  }
  async function createDraft(title: string, overview?: string) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) throw new Error("Draft title must not be empty");
    const created: Draft = {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      ...(overview?.trim() ? { overview: overview.trim() } : {}),
      createdAt: Date.now(),
      items: [],
      groups: [],
    };
    await enqueueWrite((current) => ({ drafts: [...current, created] }));
    return created;
  }
  async function addDraft(importedDraft: Draft) {
    const validated = DraftSchema.parse(importedDraft);
    await enqueueWrite((current) => ({ drafts: [...current, validated] }));
    return validated;
  }
  async function updateDraftOverview(draftId: string, overview: string) {
    return (
      (await enqueueWrite((current) => {
        const target = current.find((value) => value.id === draftId);
        return target
          ? { drafts: ops.replaceDraft(current, ops.updateOverview(target, overview)) }
          : { drafts: current, result: false };
      })) ?? true
    );
  }
  async function reorderDraftItems(draftId: string, groupId: string, ids: string[]) {
    return (await enqueueWrite((current) => {
      const target = current.find((value) => value.id === draftId);
      const updated = target && ops.reorderItems(target, groupId, ids);
      return updated
        ? { drafts: ops.replaceDraft(current, updated), result: true }
        : { drafts: current, result: false };
    })) as boolean;
  }
  async function reorderRootDraftItems(draftId: string, ids: string[]) {
    return (await enqueueWrite((current) => {
      const target = current.find((value) => value.id === draftId);
      const updated = target && ops.reorderRootItems(target, ids);
      return updated
        ? { drafts: ops.replaceDraft(current, updated), result: true }
        : { drafts: current, result: false };
    })) as boolean;
  }
  async function createGroup(draftId: string, title?: string) {
    return (
      (await enqueueWrite((current) => {
        const target = current.find((value) => value.id === draftId);
        if (!target) return { drafts: current, result: null };
        const group = {
          id: crypto.randomUUID(),
          position: target.groups.length,
          ...(title?.trim() ? { title: title.trim() } : {}),
          items: [],
        };
        return {
          drafts: ops.replaceDraft(current, { ...target, groups: [...target.groups, group] }),
          result: group,
        };
      })) ?? null
    );
  }
  async function removeGroup(draftId: string, groupId: string) {
    return (await enqueueWrite((current) => {
      const target = current.find((value) => value.id === draftId);
      const updated = target && ops.removeGroup(target, groupId);
      return updated
        ? { drafts: ops.replaceDraft(current, updated), result: true }
        : { drafts: current, result: false };
    })) as boolean;
  }
  async function renameGroup(draftId: string, groupId: string, title: string) {
    return (await enqueueWrite((current) => {
      const target = current.find((value) => value.id === draftId);
      const updated = target && ops.updateGroupTitle(target, groupId, title);
      return updated
        ? { drafts: ops.replaceDraft(current, updated), result: true }
        : { drafts: current, result: false };
    })) as boolean;
  }
  async function renameDraft(title: string) {
    if (draft.value) {
      const draftId = draft.value.id;
      await saveDraft((current) => {
        const target = current.find((value) => value.id === draftId);
        return target ? ops.replaceDraft(current, { ...target, title: title.trim() }) : current;
      });
    }
  }
  async function deleteDraft() {
    if (draft.value) await deleteDraftById(draft.value.id);
  }
  async function deleteDraftById(id: string) {
    await enqueueWrite((current) => ({ drafts: current.filter((value) => value.id !== id) }));
  }
  type ItemDetails = Pick<DraftItem, "variant" | "note">;
  async function addItemToDraft(
    draftId: string,
    title: string,
    tradeUrl: string,
    details: ItemDetails = {},
    groupId?: string,
  ) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) throw new Error("Item title must not be empty");
    const itemId = crypto.randomUUID();
    const result = await enqueueWrite((current) => {
      const latest = current.find((value) => value.id === draftId);
      if (!latest) return { drafts: current, result: null };
      const item: DraftItem = {
        id: itemId,
        position: groupId
          ? (latest.groups.find((group) => group.id === groupId)?.items.length ?? 0)
          : latest.items.length,
        title: trimmedTitle,
        tradeUrl,
        ...details,
        completed: false,
        addedAt: Date.now(),
      };
      if (groupId && !latest.groups.some((group) => group.id === groupId))
        return { drafts: current, result: null };
      const latestGroups = groupId
        ? latest.groups.map((group) =>
            group.id === groupId ? { ...group, items: [...group.items, item] } : group,
          )
        : latest.groups;
      return {
        drafts: ops.replaceDraft(
          current,
          groupId
            ? { ...latest, groups: latestGroups }
            : { ...latest, items: [...latest.items, item] },
        ),
        result: item,
      };
    });
    return result ?? null;
  }
  async function addItem(title: string, tradeUrl: string, details: ItemDetails = {}) {
    return draft.value ? addItemToDraft(draft.value.id, title, tradeUrl, details) : null;
  }

  async function mutateItem(
    draftId: string,
    itemId: string,
    patch: Partial<Pick<DraftItem, "title" | "tradeUrl" | "variant" | "note" | "completed">>,
    groupId?: string,
  ) {
    return (await enqueueWrite((current) => {
      const target = current.find((value) => value.id === draftId);
      const group = target?.groups.find((value) =>
        groupId ? value.id === groupId : value.items.some((item) => item.id === itemId),
      );
      const updated =
        target && (groupId || group)
          ? ops.updateItem(target, groupId ?? group!.id, itemId, patch)
          : target && ops.updateRootItem(target, itemId, patch);
      return updated
        ? { drafts: ops.replaceDraft(current, updated), result: true }
        : { drafts: current, result: false };
    })) as boolean;
  }
  // The optional draft/group arguments make mutations safe for rewritten callers; old UI calls remain valid.
  async function removeItem(itemId: string, draftId = draft.value?.id, groupId?: string) {
    return draftId ? mutateRemove(draftId, itemId, groupId) : false;
  }
  async function mutateRemove(draftId: string, itemId: string, groupId?: string) {
    return (await enqueueWrite((current) => {
      const target = current.find((value) => value.id === draftId);
      const group = target?.groups.find((value) =>
        groupId ? value.id === groupId : value.items.some((item) => item.id === itemId),
      );
      const updated =
        target && (groupId || group)
          ? ops.removeItem(target, groupId ?? group!.id, itemId)
          : target && ops.removeRootItem(target, itemId);
      return updated
        ? { drafts: ops.replaceDraft(current, updated), result: true }
        : { drafts: current, result: false };
    })) as boolean;
  }
  async function setComplete(
    itemId: string,
    completed: boolean,
    draftId = draft.value?.id,
    groupId?: string,
  ) {
    return draftId ? mutateItem(draftId, itemId, { completed }, groupId) : false;
  }
  async function renameItem(
    itemId: string,
    title: string,
    draftId = draft.value?.id,
    groupId?: string,
  ) {
    return draftId ? mutateItem(draftId, itemId, { title: title.trim() }, groupId) : false;
  }
  async function updateItem(
    itemId: string,
    patch: Partial<Pick<DraftItem, "title" | "tradeUrl" | "variant" | "note">>,
    draftId = draft.value?.id,
    groupId?: string,
  ) {
    return draftId ? mutateItem(draftId, itemId, patch, groupId) : false;
  }
  async function unmarkAll() {
    if (draft.value) {
      const draftId = draft.value.id;
      await saveDraft((current) => {
        const target = current.find((value) => value.id === draftId);
        return target ? ops.replaceDraft(current, ops.clearCompleted(target)) : current;
      });
    }
  }
  // Explicit-ID adapters for consumers that do not use the currently open detail view.
  const removeItemById = (draftId: string, groupId: string, itemId: string) =>
    mutateRemove(draftId, itemId, groupId);
  const setCompleteById = (draftId: string, groupId: string, itemId: string, completed: boolean) =>
    mutateItem(draftId, itemId, { completed }, groupId);
  const renameItemById = (draftId: string, groupId: string, itemId: string, title: string) =>
    mutateItem(draftId, itemId, { title: title.trim() }, groupId);
  const updateItemById = (
    draftId: string,
    groupId: string,
    itemId: string,
    patch: Partial<Pick<DraftItem, "title" | "tradeUrl" | "variant" | "note">>,
  ) => mutateItem(draftId, itemId, patch, groupId);
  const removeRootItemById = (draftId: string, itemId: string) => mutateRemove(draftId, itemId);
  const setRootItemCompleteById = (draftId: string, itemId: string, completed: boolean) =>
    mutateItem(draftId, itemId, { completed });
  const renameRootItemById = (draftId: string, itemId: string, title: string) =>
    mutateItem(draftId, itemId, { title: title.trim() });
  const updateRootItemById = (
    draftId: string,
    itemId: string,
    patch: Partial<Pick<DraftItem, "title" | "tradeUrl" | "variant" | "note">>,
  ) => mutateItem(draftId, itemId, patch);
  const moveItemById = (draftId: string, itemId: string, targetGroupId: string | null) =>
    enqueueWrite((current) => {
      const target = current.find((value) => value.id === draftId);
      const updated = target && ops.moveItem(target, itemId, targetGroupId);
      return updated
        ? { drafts: ops.replaceDraft(current, updated), result: true }
        : { drafts: current, result: false };
    }).then((result) => Boolean(result));

  return {
    drafts,
    draft,
    isLoaded,
    createDraft,
    addDraft,
    updateDraftOverview,
    reorderDraftItems,
    reorderRootDraftItems,
    createGroup,
    removeGroup,
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
    removeItemById,
    setCompleteById,
    renameItemById,
    updateItemById,
    removeRootItemById,
    setRootItemCompleteById,
    renameRootItemById,
    updateRootItemById,
    moveItemById,
  };
}
