<script setup lang="ts">
import Button from "./Button.vue";

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
  <Button
    variant="accent"
    :label="label"
    :size="size"
    :full="full"
    :disabled="disabled"
    @click="!disabled && emit('click')"
  >
    <slot>{{ label }}</slot>
  </Button>
</template>
