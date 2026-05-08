<script setup lang="ts">
type Tone = 'neutral' | 'accent' | 'warn' | 'good';
const { tone = 'neutral' } = defineProps<{ tone?: Tone }>();
</script>

<template>
  <span
    class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.3px] rounded-sm border whitespace-nowrap"
    :class="{
      'bg-block text-ink-muted border-stroke': tone === 'neutral',
      'bg-accent-soft text-accent-ink-str border-accent-edge': tone === 'accent',
      'bg-warn text-warn-ink border-warn-edge': tone === 'warn',
      'bg-good text-good-ink border-good-edge': tone === 'good',
    }"
  >
    <slot />
  </span>
</template>
