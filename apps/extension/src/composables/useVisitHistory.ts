import type { VisitHistoryItem } from '@/types';
import { ref } from 'vue';
import { storage } from 'wxt/utils/storage';

const visitHistoryItem = storage.defineItem<VisitHistoryItem[]>('local:visitHistory', {
  fallback: [],
});

function normalizeItem(item: VisitHistoryItem): VisitHistoryItem {
  return { ...item };
}

function toArray(val: unknown): VisitHistoryItem[] {
  if (Array.isArray(val)) return val.map(normalizeItem);
  if (val && typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    const keys = Object.keys(obj).sort((a, b) => Number(a) - Number(b));
    if (keys.length > 0 && keys.every((k) => /^\d+$/.test(k))) {
      return keys.map((k) => normalizeItem(obj[k] as VisitHistoryItem));
    }
  }
  return [];
}

function toPlain<T>(val: T[]): T[] {
  return JSON.parse(JSON.stringify(val));
}

const items = ref<VisitHistoryItem[]>([]);
const isLoaded = ref(false);
let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  initialized = true;

  void visitHistoryItem.getValue().then(async (stored) => {
    items.value = toArray(stored);
    isLoaded.value = true;

    if (!Array.isArray(stored) && stored != null) {
      await visitHistoryItem.setValue(toPlain(items.value));
    }
  });

  visitHistoryItem.watch((val) => {
    items.value = toArray(val);
    isLoaded.value = true;
  });
}

export function useVisitHistory() {
  ensureInitialized();

  async function removeItem(id: string) {
    const updated = items.value.filter((i) => i.id !== id);
    await visitHistoryItem.setValue(toPlain(updated));
    items.value = updated;
  }

  async function removeItems(ids: string[]) {
    const idSet = new Set(ids);
    const updated = items.value.filter((i) => !idSet.has(i.id));
    await visitHistoryItem.setValue(toPlain(updated));
    items.value = updated;
  }

  async function clearAll() {
    await visitHistoryItem.setValue([]);
    items.value = [];
  }

  return {
    items,
    isLoaded,
    removeItem,
    removeItems,
    clearAll,
  };
}
