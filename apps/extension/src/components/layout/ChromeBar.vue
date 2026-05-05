<script setup lang="ts">
import { useSettings } from "../../composables/useSettings";

const { settings } = useSettings();
const emit = defineEmits<{ openSettings: [] }>();
</script>

<template>
  <div class="h-8 bg-chrome border-b border-frame flex items-center px-2 gap-2 shrink-0">
    <div class="w-3.5 h-3.5 rounded-sm bg-accent border border-accent-edge shrink-0" />
    <span class="font-semibold text-ink text-xs tracking-[0.2px]" data-testid="chrome-bar-title"
      >PoE Shopping List</span
    >
    <div class="flex-1" />
    <span
      class="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.3px] bg-accent-soft text-accent-ink-str border border-accent-edge rounded-sm"
    >
      {{ settings.league || "No league" }}
    </span>
    <button
      @click="emit('openSettings')"
      class="w-[22px] h-[22px] flex items-center justify-center text-ink-muted text-sm cursor-pointer bg-transparent border-0 rounded-sm hover:bg-block"
      title="Settings"
    >
      ⚙
    </button>
  </div>
</template>
