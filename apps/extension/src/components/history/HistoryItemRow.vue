<script setup lang="ts">
import type { PurchaseHistoryItem } from "@/types";
import { useUiStore } from "../../stores/ui";
import { usePurchaseHistory } from "../../composables/usePurchaseHistory";
import { useSettings } from "../../composables/useSettings";

const { item } = defineProps<{ item: PurchaseHistoryItem }>();
const emit = defineEmits<{ "toggle-select": [id: string] }>();

const ui = useUiStore();
const { removeItem } = usePurchaseHistory();
const { settings } = useSettings();

const formatPrice = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

async function openSearch(url: string) {
  if (settings.value.openItemsInNewTab) {
    browser.tabs.create({ url });
  } else {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) browser.tabs.update(tab.id, { url });
  }
}
</script>

<template>
  <div class="motion-row flex items-center gap-2.5 px-3 py-2.5 border-b border-stroke-soft">
    <!-- Checkbox for mass selection -->
    <input
      type="checkbox"
      class="w-3.5 h-3.5 shrink-0 accent-accent cursor-pointer"
      aria-label="Toggle select item"
      @change="emit('toggle-select', item.id)"
    />

    <!-- Name + base -->
    <div class="flex-1 min-w-0">
      <button
        @click.stop="openSearch(item.searchUrl)"
        class="motion-button text-[13px] font-medium text-ink truncate hover:underline cursor-pointer text-left bg-transparent border-0 p-0 min-w-0 w-full block"
      >
        {{ item.name }}
      </button>
      <span v-if="item.base" class="text-[10px] text-ink-muted block truncate">
        {{ item.base }}
      </span>
    </div>

    <!-- Price -->
    <span class="font-mono text-xs font-semibold text-accent-ink-str shrink-0">
      {{ formatPrice(item.priceValue) }}
      <span class="opacity-70 text-[10px]">{{ item.priceCurrency }}</span>
    </span>

    <!-- Kebab -->
    <button
      @click.stop="ui.toggleKebab(item.id)"
      class="text-ink-muted text-sm cursor-pointer bg-transparent border-0 px-0.5 leading-none shrink-0"
    >
      ⋯
    </button>
  </div>
</template>
