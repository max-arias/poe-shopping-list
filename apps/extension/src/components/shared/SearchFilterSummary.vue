<script setup lang="ts">
import type { SearchFilterSnapshot } from "@/types";
import { useSettings } from "@/composables/useSettings";
import {
  flattenSearchFilterEntries,
  formatCompactSearchFilterEntry,
  getSearchFilterDisplayValues,
  parseSearchFilterMutationLabel,
  type SearchFilterMutationKind,
  summarizeSearchFilters,
} from "@/utils/searchFilters";
import { computed, ref } from "vue";

const props = defineProps<{ filters?: SearchFilterSnapshot | null }>();

const expanded = ref(false);
const { settings } = useSettings();
const summary = computed(() => summarizeSearchFilters(props.filters));
const compactEntries = computed(() =>
  flattenSearchFilterEntries(props.filters).slice(0, 3).map(formatCompactSearchFilterEntry),
);
const remainingCount = computed(() =>
  Math.max(0, flattenSearchFilterEntries(props.filters).length - compactEntries.value.length),
);

function mutationBadgeClass(kind: SearchFilterMutationKind): string {
  return {
    crafted: "bg-[#0877d8] text-white",
    crucible: "bg-[#ff6d4a] text-white",
    enchant: "bg-[#8e55b7] text-white",
    explicit: "bg-[#3a3323] text-[#d7a65d] border border-[#806435]",
    fractured: "bg-[#728190] text-white",
    implicit: "bg-[#726b25] text-white",
    pseudo: "bg-[#3e3e33] text-white",
    scourge: "bg-[#ff6a2a] text-white",
    veiled: "bg-[#5f5142] text-white",
  }[kind];
}
</script>

<template>
  <div
    v-if="settings.displayFilterValues && summary"
    class="mt-1 min-w-0 font-mono text-[10px] leading-4 text-ink-muted"
  >
    <button
      type="button"
      class="flex w-full min-w-0 items-center gap-1 border-0 bg-transparent p-0 text-left font-mono text-[10px] leading-4 text-ink-muted hover:text-ink"
      @click.stop="expanded = !expanded"
      :aria-expanded="expanded"
      title="Toggle captured filter details"
    >
      <span
        class="shrink-0 text-[9px] text-accent-ink-str transition-transform"
        :class="expanded ? 'rotate-90' : ''"
        aria-hidden="true"
      >
        ▶
      </span>
      <span class="min-w-0 flex-1 truncate">
        <span>filters: </span>
        <template v-for="(entry, index) in compactEntries" :key="`${entry.label}-${index}`">
          <span v-if="index > 0">, </span>
          <template v-if="parseSearchFilterMutationLabel(entry.label).kind">
            <span
              class="mr-0.5 rounded-[1px] px-1 py-px text-[8px] font-bold italic uppercase leading-none"
              :class="mutationBadgeClass(parseSearchFilterMutationLabel(entry.label).kind!)"
            >
              {{ parseSearchFilterMutationLabel(entry.label).kind }}
            </span>
            <span>{{ parseSearchFilterMutationLabel(entry.label).text }}</span>
          </template>
          <span v-else>{{ entry.label }}</span>
          <span v-if="entry.values.length" class="text-accent-ink-str font-semibold">
            {{ ` ${entry.values.join(" ")}` }}
          </span>
        </template>
        <span v-if="remainingCount > 0"> +{{ remainingCount }} more</span>
      </span>
    </button>

    <div
      v-if="expanded && filters"
      class="mt-1 rounded-sm border border-stroke-soft bg-surface px-2 py-1.5 text-ink-muted"
    >
      <div v-for="group in filters.groups" :key="group.label" class="mb-1 last:mb-0">
        <div class="text-ink">{{ group.label }}</div>
        <div v-for="entry in group.entries" :key="`${group.label}-${entry.label}`" class="pl-2">
          <template v-if="parseSearchFilterMutationLabel(entry.label).kind">
            <span
              class="mr-1 inline-flex rounded-[1px] px-1 py-px text-[8px] font-bold italic uppercase leading-none"
              :class="mutationBadgeClass(parseSearchFilterMutationLabel(entry.label).kind!)"
            >
              {{ parseSearchFilterMutationLabel(entry.label).kind }}
            </span>
            <span>{{ parseSearchFilterMutationLabel(entry.label).text }}</span>
          </template>
          <span v-else>{{ entry.label }}</span>
          <span v-if="getSearchFilterDisplayValues(entry).length">: </span>
          <span class="text-accent-ink-str font-semibold">
            {{ getSearchFilterDisplayValues(entry).join(" ") }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
