import type { Draft, DraftItem, ItemKind, TradeCapture } from "@/types";
import { computed, ref } from "vue";
import { storage } from "wxt/utils/storage";
import { useUiStore } from "../stores/ui";

const draftsItem = storage.defineItem<Draft[]>("local:drafts", {
  fallback: [],
});

/** Ensure a draft read from storage always has an `items` array. */
function normalizeDraft(d: Draft): Draft {
  return Array.isArray(d.items) ? d : { ...d, items: [] };
}

const drafts = ref<Draft[]>([]);
const isLoaded = ref(false);
let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  initialized = true;

  void draftsItem.getValue().then((stored) => {
    drafts.value = stored.map(normalizeDraft);
    isLoaded.value = true;
  });

  draftsItem.watch((val) => {
    drafts.value = (val ?? []).map(normalizeDraft);
    isLoaded.value = true;
  });
}

export function useDraftList() {
  ensureInitialized();
  const ui = useUiStore();

  const draft = computed<Draft | null>(() => {
    const v = ui.currentView;
    if (v.type !== "detail") return null;
    return drafts.value.find((d) => d.id === v.draftId) ?? null;
  });

  async function saveAll(updated: Draft[]) {
    await draftsItem.setValue(updated);
    drafts.value = updated;
  }

  async function saveDraft(updated: Draft) {
    await saveAll(drafts.value.map((d) => (d.id === updated.id ? updated : d)));
  }

  async function createDraft(
    name: string,
    league = "",
    buildUrl?: string,
    buildCreator?: string,
    associatedUrls?: string[],
  ) {
    const d: Draft = {
      id: crypto.randomUUID(),
      name: name.trim(),
      game: "poe1",
      league,
      createdAt: Date.now(),
      items: [],
      ...(buildUrl ? { buildUrl } : {}),
      ...(buildCreator ? { buildCreator: buildCreator.trim() } : {}),
      ...(associatedUrls && associatedUrls.length > 0 ? { associatedUrls } : {}),
    };
    await saveAll([...drafts.value, d]);
    return d;
  }

  async function addDraft(importedDraft: Draft) {
    const normalized = normalizeDraft(importedDraft);
    await saveAll([...drafts.value, normalized]);
    return normalized;
  }

  async function renameDraft(name: string) {
    if (!draft.value) return;
    await saveDraft({ ...draft.value, name: name.trim() });
  }

  async function deleteDraft() {
    if (!draft.value) return;
    const id = draft.value.id;
    await saveAll(drafts.value.filter((d) => d.id !== id));
  }

  async function deleteDraftById(id: string) {
    await saveAll(drafts.value.filter((d) => d.id !== id));
  }

  async function addItemToDraft(
    draftId: string,
    name: string,
    tradeUrl: string,
    capture: TradeCapture | null,
    kind: ItemKind = "unique",
  ) {
    const target = drafts.value.find((d) => d.id === draftId);
    if (!target) return null;
    const item: DraftItem = {
      id: crypto.randomUUID(),
      position: target.items.length,
      name,
      tradeUrl,
      capture,
      completed: false,
      kind,
      addedAt: Date.now(),
    };
    await saveAll(
      drafts.value.map((d) => (d.id === draftId ? { ...d, items: [...d.items, item] } : d)),
    );
    return item;
  }

  async function addItem(
    name: string,
    tradeUrl: string,
    capture: TradeCapture | null,
    kind: ItemKind = "unique",
  ) {
    if (!draft.value) return null;
    return addItemToDraft(draft.value.id, name, tradeUrl, capture, kind);
  }

  async function removeItem(itemId: string) {
    if (!draft.value) return;
    const items = draft.value.items
      .filter((i) => i.id !== itemId)
      .map((i, pos) => ({ ...i, position: pos }));
    await saveDraft({ ...draft.value, items });
  }

  async function setComplete(itemId: string, completed: boolean) {
    if (!draft.value) return;
    await saveDraft({
      ...draft.value,
      items: draft.value.items.map((i) => (i.id === itemId ? { ...i, completed } : i)),
    });
  }

  async function renameItem(itemId: string, name: string) {
    if (!draft.value) return;
    await saveDraft({
      ...draft.value,
      items: draft.value.items.map((i) => (i.id === itemId ? { ...i, name: name.trim() } : i)),
    });
  }

  async function updateItem(itemId: string, patch: Partial<Pick<DraftItem, "name" | "tradeUrl">>) {
    if (!draft.value) return;
    await saveDraft({
      ...draft.value,
      items: draft.value.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
    });
  }

  async function updateCapture(itemId: string, capture: TradeCapture) {
    if (!draft.value) return;
    await saveDraft({
      ...draft.value,
      items: draft.value.items.map((i) => (i.id === itemId ? { ...i, capture } : i)),
    });
  }

  async function unmarkAll() {
    if (!draft.value) return;
    await saveDraft({
      ...draft.value,
      items: draft.value.items.map((i) => ({ ...i, completed: false, capture: null })),
    });
  }

  async function setBuildInfo(buildUrl: string, buildCreator: string, associatedUrls?: string[]) {
    if (!draft.value) return;
    await saveDraft({
      ...draft.value,
      buildUrl: buildUrl.trim() || undefined,
      buildCreator: buildCreator.trim() || undefined,
      associatedUrls: associatedUrls && associatedUrls.length > 0 ? associatedUrls : undefined,
    });
  }

  return {
    drafts,
    draft,
    isLoaded,
    createDraft,
    addDraft,
    renameDraft,
    deleteDraft,
    deleteDraftById,
    addItem,
    addItemToDraft,
    removeItem,
    setComplete,
    renameItem,
    updateItem,
    updateCapture,
    unmarkAll,
    setBuildInfo,
  };
}
