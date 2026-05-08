<script setup lang="ts">
import { computed } from 'vue';
import { useDivineRate } from '../../composables/useDivineRate';
import { useDraftList } from '../../composables/useDraftList';
import BtnGhost from '../shared/BtnGhost.vue';

const { draft } = useDraftList();
const { divineRate } = useDivineRate();
const emit = defineEmits<{ switch: [] }>();

const estimate = computed(() => {
  const items = draft.value?.items ?? [];
  const priced = items.flatMap((i) =>
    i.capture && i.capture.aggregates.sampleSize > 0 ? [i.capture.aggregates] : [],
  );
  if (!priced.length) return null;

  // Tally currencies
  const counts = new Map<string, number>();
  for (const i of priced) counts.set(i.currency, (counts.get(i.currency) ?? 0) + 1);
  const dominant = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!dominant) return null;

  const sum = priced.filter((i) => i.currency === dominant).reduce((acc, i) => acc + i.median, 0);
  return { value: Math.round(sum * 10) / 10, currency: dominant };
});

const divineEquivalent = computed(() => {
  if (!estimate.value || estimate.value.currency !== 'chaos') return null;
  if (!divineRate.value) return null;
  return (estimate.value.value / divineRate.value).toFixed(1);
});
</script>

<template>
  <div
    v-if="draft"
    class="flex items-center gap-2.5 px-3.5 py-3 border-b border-stroke-soft bg-surface shrink-0"
  >
    <div class="w-2 h-2 rounded-full bg-accent shrink-0" />
    <div class="flex-1 min-w-0">
      <p class="text-[13px] font-semibold text-ink truncate">{{ draft.name }}</p>
      <p class="text-[10px] text-ink-muted mt-0.5">
        Active draft · {{ draft.items.length }} item{{ draft.items.length !== 1 ? "s" : "" }}
        <span v-if="estimate">
          · ~{{ estimate.value }} {{ estimate.currency
          }}<span v-if="divineEquivalent"> (~{{ divineEquivalent }} div)</span>
        </span>
      </p>
    </div>
    <BtnGhost label="Switch" @click="emit('switch')" />
  </div>
</template>
