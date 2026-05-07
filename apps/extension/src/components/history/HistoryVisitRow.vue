<script setup lang="ts">
import type { VisitHistoryItem } from "@/types";

const { item } = defineProps<{ item: VisitHistoryItem }>();
const emit = defineEmits<{ "toggle-select": [id: string] }>();

const timestampFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const formattedTimestamp = timestampFormatter.format(item.addedAt);

async function openVisit(url: string) {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    await browser.tabs.update(tab.id, { url });
  }
}
</script>

<template>
  <div class="flex items-center gap-2.5 px-3 py-2.5 border-b border-stroke-soft">
    <input
      type="checkbox"
      class="w-3.5 h-3.5 shrink-0 accent-accent cursor-pointer"
      aria-label="Toggle select visit"
      @change="emit('toggle-select', item.id)"
    />

    <div class="flex-1 min-w-0">
      <p class="text-[10px] text-ink-muted mb-0.5">
        {{ formattedTimestamp }}
      </p>
      <button
        @click.stop="openVisit(item.url)"
        class="w-full min-w-0 cursor-pointer border-0 bg-transparent p-0 text-left"
        :title="item.url"
      >
        <span
          v-if="item.name"
          class="block truncate text-[13px] font-medium text-ink hover:underline"
        >
          {{ item.name }}
        </span>
        <span class="block truncate text-[11px] text-ink-muted hover:text-ink">
          {{ item.url }}
        </span>
      </button>
    </div>
  </div>
</template>
