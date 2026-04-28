<script setup lang="ts">
import { computed } from "vue";
import type { Draft } from "@poe-sl/schema";
import { useDivineRate } from "../../composables/useDivineRate";
import { useUiStore } from "../../stores/ui";

const props = defineProps<{ draft: Draft }>();
const emit = defineEmits<{ delete: [] }>();

const { divineRate } = useDivineRate();
const ui = useUiStore();

const estimate = computed(() => {
  const items = props.draft.items.filter((i) => i.capture && i.capture.aggregates.sampleSize > 0);
  if (!items.length) return null;

  const counts = new Map<string, number>();
  for (const i of items)
    counts.set(
      i.capture!.aggregates.currency,
      (counts.get(i.capture!.aggregates.currency) ?? 0) + 1,
    );
  const dominant = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!dominant) return null;

  const sum = items
    .filter((i) => i.capture!.aggregates.currency === dominant)
    .reduce((acc, i) => acc + i.capture!.aggregates.median, 0);
  return { value: Math.round(sum * 10) / 10, currency: dominant };
});

const divineEquivalent = computed(() => {
  if (!estimate.value || estimate.value.currency !== "chaos") return null;
  if (!divineRate.value) return null;
  return (estimate.value.value / divineRate.value).toFixed(1);
});
</script>

<template>
  <div
    class="flex items-center gap-2.5 px-3 py-2.5 border-b border-stroke-soft hover:bg-surface-hover"
  >
    <div
      class="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
      @click="ui.openDetail('mine', draft.id)"
    >
      <div class="w-2 h-2 rounded-full bg-gold shrink-0" />
      <div class="flex-1 min-w-0">
        <p class="text-[13px] font-semibold text-ink truncate">{{ draft.name }}</p>
        <p class="text-[10px] text-ink-muted mt-0.5">
          {{ draft.items.length }} item{{ draft.items.length !== 1 ? "s" : "" }}
          <span v-if="estimate">
            · ~{{ estimate.value }} {{ estimate.currency
            }}<span v-if="divineEquivalent"> (~{{ divineEquivalent }} div)</span>
          </span>
        </p>
        <p v-if="draft.buildCreator" class="text-[10px] text-ink-muted mt-0.5 truncate">
          by {{ draft.buildCreator }}<span v-if="draft.buildUrl"> · {{ draft.buildUrl }}</span>
        </p>
      </div>
      <span class="text-ink-muted text-sm shrink-0">›</span>
    </div>
    <button
      @click.stop="emit('delete')"
      class="shrink-0 w-7 h-7 flex items-center justify-center text-ink-muted text-base cursor-pointer bg-transparent border-0 leading-none hover:text-ink"
      title="Delete list"
    >
      ⋯
    </button>
  </div>
</template>
