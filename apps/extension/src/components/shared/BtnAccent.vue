<script setup lang="ts">
const {
  label,
  size = "md",
  full = true,
  disabled = false,
} = defineProps<{
  label?: string;
  size?: "sm" | "md" | "lg";
  full?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{ click: [] }>();
</script>

<template>
  <button
    :disabled="disabled"
    @click="!disabled && emit('click')"
    class="flex items-center justify-center px-3.5 uppercase tracking-[0.4px] font-semibold rounded-sm border border-accent-edge bg-accent text-accent-ink cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
    :class="{
      'w-full': full,
      'h-7 text-[11px]': size === 'sm',
      'h-9 text-xs': size === 'md',
      'h-11 text-sm': size === 'lg',
    }"
    style="
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.15),
        0 1px 0 rgba(0, 0, 0, 0.3);
    "
  >
    <slot>{{ label }}</slot>
  </button>
</template>
