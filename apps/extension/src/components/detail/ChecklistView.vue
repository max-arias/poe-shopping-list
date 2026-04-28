<script lang="ts">
export interface ChecklistEntry {
  id: string | number;
  position: number;
  name: string;
  kind: string;
  base?: string | null;
  priceValue?: number | null;
  priceCurrency?: string | null;
  completed?: boolean;
  tradeUrl?: string;
}
</script>

<script setup lang="ts">
import { useSettings } from "../../composables/useSettings";

const { items, readonly = false } = defineProps<{
  items: ChecklistEntry[];
  readonly?: boolean;
}>();

const emit = defineEmits<{ toggle: [id: string | number] }>();

const { settings } = useSettings();
const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

async function openTrade(url: string) {
  if (settings.value.openItemsInNewTab) {
    browser.tabs.create({ url });
  } else {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) browser.tabs.update(tab.id, { url });
  }
}
</script>

<template>
  <div class="flex-1 overflow-auto">
    <div
      v-for="item in items"
      :key="item.id"
      class="flex items-center gap-2.5 px-3 py-2.5 border-b border-stroke-soft"
      :class="item.completed ? 'opacity-60' : ''"
    >
      <!-- Checkbox -->
      <button
        v-if="!readonly"
        @click="emit('toggle', item.id)"
        class="w-3.5 h-3.5 shrink-0 rounded-sm border border-stroke flex items-center justify-center bg-transparent cursor-pointer"
        :class="item.completed ? 'bg-gold border-gold-edge' : ''"
      >
        <span v-if="item.completed" class="text-gold-ink text-[10px] font-bold leading-none"
          >✓</span
        >
      </button>
      <div v-else class="w-3.5 h-3.5 shrink-0 rounded-sm border border-stroke-soft" />

      <!-- Name + base -->
      <div class="flex-1 min-w-0 flex flex-col gap-0.5">
        <button
          v-if="item.tradeUrl"
          @click="openTrade(item.tradeUrl!)"
          class="text-[13px] font-medium text-ink truncate hover:underline cursor-pointer text-left bg-transparent border-0 p-0 min-w-0"
          :class="item.completed ? 'line-through' : ''"
        >
          {{ item.name }}
        </button>
        <span
          v-else
          class="text-[13px] font-medium text-ink truncate"
          :class="item.completed ? 'line-through' : ''"
        >
          {{ item.name }}
        </span>
        <span v-if="item.base" class="text-[10px] text-ink-muted truncate">{{ item.base }}</span>
      </div>

      <!-- Price -->
      <div v-if="item.priceValue != null" class="flex flex-col items-end gap-0.5 shrink-0">
        <span class="font-mono text-xs font-semibold text-gold-ink-str">
          {{ fmt(item.priceValue) }}
          <span class="opacity-70 text-[10px]">{{ item.priceCurrency }}</span>
        </span>
      </div>
    </div>

    <div v-if="items.length === 0" class="flex items-center justify-center py-10">
      <p class="text-[12px] text-ink-muted">No items in this list.</p>
    </div>
  </div>
</template>
