<script setup lang="ts">
import Button from "./Button.vue";

const {
  label,
  size = "sm",
  full = false,
  accent = false,
  disabled = false,
} = defineProps<{
  label?: string;
  size?: "sm" | "md";
  full?: boolean;
  accent?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{ click: [] }>();
</script>

<template>
  <Button
    :variant="accent ? 'ghostAccent' : 'ghost'"
    :label="label"
    :size="size"
    :full="full"
    :disabled="disabled"
    @click="!disabled && emit('click')"
  >
    <slot>{{ label }}</slot>
  </Button>
</template>
