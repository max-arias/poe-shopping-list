<script setup lang="ts">
import { ref } from "vue";
import { useRecentPurchases } from "../../composables/useRecentPurchases";
import { useDraftList } from "../../composables/useDraftList";
import type { RecentPurchase } from "@poe-sl/schema";

const { purchases, removePurchase, clearAll } = useRecentPurchases();
const { drafts, addItemToDraft } = useDraftList();

const assigningId = ref<string | null>(null);

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatPrice(p: RecentPurchase): string {
  return p.priceCurrency ? `${p.priceValue}× ${p.priceCurrency}` : `${p.priceValue}`;
}

function toggleAssign(id: string) {
  assigningId.value = assigningId.value === id ? null : id;
}

async function assignToList(purchase: RecentPurchase, draftId: string) {
  await addItemToDraft(draftId, purchase.itemName, purchase.tradeUrl, null);
  await removePurchase(purchase.id);
  assigningId.value = null;
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 overflow-hidden" @click.self="assigningId = null">
    <!-- Header -->
    <div
      v-if="purchases.length > 0"
      class="flex items-center justify-between px-3 py-2 border-b border-stroke shrink-0"
    >
      <p class="text-[11px] text-ink-muted">{{ purchases.length }} recent</p>
      <button
        @click="clearAll()"
        class="text-[11px] text-ink-muted cursor-pointer bg-transparent border-0 hover:text-ink"
      >
        Clear all
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="purchases.length === 0" class="flex-1 flex items-center justify-center px-6">
      <p class="text-[12px] text-ink-muted text-center leading-relaxed">
        No recent purchases yet.<br />
        Click <strong class="text-ink">Travel to Hideout</strong> on a listing to track it.
      </p>
    </div>

    <!-- Purchase list -->
    <div v-else class="flex-1 overflow-auto">
      <div v-for="p in purchases" :key="p.id" class="relative border-b border-stroke-soft">
        <!-- Row -->
        <div class="flex items-center gap-2 px-3 py-2.5">
          <!-- Icon -->
          <img v-if="p.iconUrl" :src="p.iconUrl" class="w-6 h-6 object-contain shrink-0" alt="" />
          <div v-else class="w-6 h-6 shrink-0 bg-surface rounded-sm" />

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-[12px] text-ink font-medium truncate">{{ p.itemName }}</p>
            <p class="text-[10px] text-ink-muted truncate">
              {{ formatPrice(p) }} &middot; {{ p.seller }} &middot;
              {{ relativeTime(p.purchasedAt) }}
            </p>
          </div>

          <!-- Assign button -->
          <button
            @click.stop="toggleAssign(p.id)"
            class="text-[10px] px-2 py-1 rounded-sm border cursor-pointer shrink-0 transition-colors"
            :class="
              assigningId === p.id
                ? 'bg-gold-soft border-gold-edge text-gold-ink-str'
                : 'bg-transparent border-stroke text-ink-muted hover:text-ink hover:border-ink-muted'
            "
          >
            + List
          </button>

          <!-- Remove -->
          <button
            @click.stop="removePurchase(p.id)"
            class="text-ink-muted text-[11px] cursor-pointer bg-transparent border-0 leading-none shrink-0 hover:text-ink"
            title="Remove"
          >
            ✕
          </button>
        </div>

        <!-- Draft picker dropdown -->
        <div
          v-if="assigningId === p.id"
          class="absolute right-0 top-full z-10 bg-bg border border-stroke rounded-sm shadow-lg min-w-[160px] max-w-[220px] py-1"
          style="box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18)"
        >
          <div v-if="drafts.length === 0" class="px-3 py-2">
            <p class="text-[11px] text-ink-muted">No lists yet</p>
          </div>
          <button
            v-for="d in drafts"
            :key="d.id"
            @click.stop="assignToList(p, d.id)"
            class="w-full text-left px-3 py-2 text-[12px] text-ink cursor-pointer bg-transparent border-0 hover:bg-surface truncate block"
          >
            {{ d.name }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
