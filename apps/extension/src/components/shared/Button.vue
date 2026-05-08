<script setup lang="ts">
import { computed } from "vue";
import { type ButtonVariants, buttonVariants } from "./buttonStyles";

const {
  label,
  type = "button",
  variant = "accent",
  size = "md",
  full = false,
  disabled = false,
} = defineProps<{
  label?: string;
  type?: "button" | "submit" | "reset";
  variant?: ButtonVariants["variant"];
  size?: ButtonVariants["size"];
  full?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{ click: [event: MouseEvent] }>();
const classes = computed(() => buttonVariants({ variant, size, full }));

function handleClick(event: MouseEvent) {
  if (disabled) return;
  emit("click", event);
}
</script>

<template>
  <button :type="type" :disabled="disabled" :class="classes" @click="handleClick">
    <slot>{{ label }}</slot>
  </button>
</template>
