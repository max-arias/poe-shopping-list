<script setup lang="ts">
const {
  label,
  size = "sm",
  full = false,
  gold = false,
  disabled = false,
} = defineProps<{
  label?: string;
  size?: "sm" | "md";
  full?: boolean;
  gold?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{ click: [] }>();
</script>

<template>
  <button
    :disabled="disabled"
    @click="!disabled && emit('click')"
    class="inline-flex items-center justify-center gap-1.5 px-2.5 rounded-sm bg-transparent cursor-pointer select-none"
    :class="{
      'w-full': full,
      'h-[26px] text-[11px]': size === 'sm',
      'h-8 text-xs': size === 'md',
      'border border-dashed border-stroke text-ink': !gold,
      'border border-solid border-gold-edge text-gold-ink-str font-semibold': gold,
      'opacity-50 cursor-not-allowed': disabled,
    }"
  >
    <slot>{{ label }}</slot>
  </button>
</template>
