import { storage } from "wxt/utils/storage";
import { ref } from "vue";
import type { PurchaseHistoryItem } from "@/types";

const purchaseHistoryItem = storage.defineItem<PurchaseHistoryItem[]>("local:purchaseHistory", {
  fallback: [],
});

/** Ensure items read from storage always have an addedAt field. */
function normalizeItem(item: PurchaseHistoryItem): PurchaseHistoryItem {
  return { ...item };
}

/**
 * Convert a stored value that might be an object-with-numeric-keys
 * (from a Vue reactive proxy serialization bug) back into a proper array.
 */
function toArray(val: unknown): PurchaseHistoryItem[] {
  if (Array.isArray(val)) return val.map(normalizeItem);
  if (val && typeof val === "object") {
    // Handle object-with-numeric-keys (e.g. {"0": {...}})
    const obj = val as Record<string, unknown>;
    const keys = Object.keys(obj).sort((a, b) => Number(a) - Number(b));
    if (keys.length > 0 && keys.every((k) => /^\d+$/.test(k))) {
      return keys.map((k) => normalizeItem(obj[k] as PurchaseHistoryItem));
    }
  }
  return [];
}

/** Strip Vue reactivity before writing to storage. */
function toPlain<T>(val: T[]): T[] {
  return JSON.parse(JSON.stringify(val));
}

const items = ref<PurchaseHistoryItem[]>([]);
const isLoaded = ref(false);
let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  initialized = true;

  void purchaseHistoryItem.getValue().then(async (stored) => {
    items.value = toArray(stored);
    isLoaded.value = true;

    if (!Array.isArray(stored) && stored != null) {
      await purchaseHistoryItem.setValue(toPlain(items.value));
    }
  });

  purchaseHistoryItem.watch((val) => {
    items.value = toArray(val);
    isLoaded.value = true;
  });
}

export function usePurchaseHistory() {
  ensureInitialized();

  async function removeItem(id: string) {
    const updated = items.value.filter((i) => i.id !== id);
    await purchaseHistoryItem.setValue(toPlain(updated));
    items.value = updated;
  }

  async function removeItems(ids: string[]) {
    const idSet = new Set(ids);
    const updated = items.value.filter((i) => !idSet.has(i.id));
    await purchaseHistoryItem.setValue(toPlain(updated));
    items.value = updated;
  }

  async function renameItem(id: string, name: string) {
    const updated = items.value.map((i) => (i.id === id ? { ...i, name: name.trim() } : i));
    await purchaseHistoryItem.setValue(toPlain(updated));
    items.value = updated;
  }

  async function changePrice(id: string, priceValue: number, priceCurrency: string) {
    const updated = items.value.map((i) => (i.id === id ? { ...i, priceValue, priceCurrency } : i));
    await purchaseHistoryItem.setValue(toPlain(updated));
    items.value = updated;
  }

  async function clearAll() {
    await purchaseHistoryItem.setValue([]);
    items.value = [];
  }

  return {
    items,
    isLoaded,
    removeItem,
    removeItems,
    renameItem,
    changePrice,
    clearAll,
  };
}
