import { storage } from "wxt/utils/storage";
import { ref, onMounted, onBeforeUnmount } from "vue";
import type { RecentPurchase } from "@poe-sl/schema";

const purchasesItem = storage.defineItem<RecentPurchase[]>("local:recentPurchases:v1", {
  fallback: [],
});

export function useRecentPurchases() {
  const purchases = ref<RecentPurchase[]>([]);

  onMounted(async () => {
    purchases.value = await purchasesItem.getValue();
    const unwatch = purchasesItem.watch((val) => {
      purchases.value = val ?? [];
    });
    onBeforeUnmount(unwatch);
  });

  async function removePurchase(id: string) {
    const updated = purchases.value.filter((p) => p.id !== id);
    await purchasesItem.setValue(updated);
    purchases.value = updated;
  }

  async function clearAll() {
    await purchasesItem.setValue([]);
    purchases.value = [];
  }

  return { purchases, removePurchase, clearAll };
}
