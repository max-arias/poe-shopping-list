import { storage } from "wxt/utils/storage";
import { ref, onMounted, onBeforeUnmount } from "vue";
import { type PurchaseHistoryItem } from "@/types";
import { onMessage } from "../utils/messages";

const purchaseHistoryItem = storage.defineItem<PurchaseHistoryItem[]>("local:purchaseHistory", {
  fallback: [],
});

/** Ensure items read from storage always have an addedAt field. */
function normalizeItem(item: PurchaseHistoryItem): PurchaseHistoryItem {
  return { ...item };
}

export function usePurchaseHistory() {
  const items = ref<PurchaseHistoryItem[]>([]);
  const isLoaded = ref(false);

  onMounted(async () => {
    const stored = await purchaseHistoryItem.getValue();
    items.value = stored.map(normalizeItem);
    isLoaded.value = true;

    const unwatch = purchaseHistoryItem.watch((val) => {
      items.value = (val ?? []).map(normalizeItem);
    });

    // Listen for real-time purchase history additions from content script
    const removeListener = onMessage("purchaseHistoryAdd", (msg) => {
      const normalized = normalizeItem(msg.data as PurchaseHistoryItem);
      // Dedup by listingId: update existing or prepend
      const idx = items.value.findIndex((i) => i.listingId === normalized.listingId);
      if (idx >= 0) {
        items.value[idx] = normalized;
        items.value = [...items.value];
      } else {
        items.value = [normalized, ...items.value];
      }
      // Persist to storage
      purchaseHistoryItem.setValue(items.value);
    });

    onBeforeUnmount(() => {
      unwatch();
      removeListener();
    });
  });

  async function removeItem(id: string) {
    const updated = items.value.filter((i) => i.id !== id);
    await purchaseHistoryItem.setValue(updated);
    items.value = updated;
  }

  async function removeItems(ids: string[]) {
    const idSet = new Set(ids);
    const updated = items.value.filter((i) => !idSet.has(i.id));
    await purchaseHistoryItem.setValue(updated);
    items.value = updated;
  }

  async function renameItem(id: string, name: string) {
    const updated = items.value.map((i) => (i.id === id ? { ...i, name: name.trim() } : i));
    await purchaseHistoryItem.setValue(updated);
    items.value = updated;
  }

  async function changePrice(id: string, priceValue: number, priceCurrency: string) {
    const updated = items.value.map((i) => (i.id === id ? { ...i, priceValue, priceCurrency } : i));
    await purchaseHistoryItem.setValue(updated);
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
