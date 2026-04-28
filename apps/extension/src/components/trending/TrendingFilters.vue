<script setup lang="ts">
import type { Game } from "@poe-sl/schema";

const props = defineProps<{ game: Game }>();
const emit = defineEmits<{ "update:game": [Game] }>();
</script>

<template>
  <div class="shrink-0 flex items-center gap-1.5 px-3 py-2 border-b border-stroke-soft">
    <button
      v-for="g in ['poe1', 'poe2'] as Game[]"
      :key="g"
      @click="emit('update:game', g)"
      class="text-[11px] px-2.5 py-1 rounded-sm border cursor-pointer"
      :class="
        props.game === g
          ? 'bg-gold-soft border-gold-edge text-gold-ink-str font-semibold'
          : 'bg-transparent border-stroke text-ink-muted'
      "
    >
      {{ g === "poe1" ? "PoE 1" : "PoE 2" }}
    </button>
  </div>
</template>
