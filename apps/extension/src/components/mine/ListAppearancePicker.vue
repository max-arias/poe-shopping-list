<script lang="ts">
export type ListIconOption = {
  id: string;
  label: string;
  src: string;
  category?: string;
};

export type ListColorOption = { value: string; label: string };

/** The only source of the curated List colour palette. */
export const LIST_COLOR_PRESETS: ListColorOption[] = [
  { value: "#e5a83b", label: "Brass" },
  { value: "#d9785f", label: "Terracotta" },
  { value: "#c96b85", label: "Rose" },
  { value: "#b889d6", label: "Lavender" },
  { value: "#7098d1", label: "Cobalt" },
  { value: "#5ca8a0", label: "Teal" },
  { value: "#75a878", label: "Sage" },
  { value: "#b7a66a", label: "Olive" },
  { value: "#a98268", label: "Umber" },
  { value: "#8f98a3", label: "Slate" },
];

export function isSafeListColor(value: string | null | undefined): value is string {
  return Boolean(value && /^#[\da-f]{6}$/i.test(value));
}
</script>

<script setup lang="ts">
import { computed, ref } from "vue";

const props = withDefaults(
  defineProps<{
    icons?: ListIconOption[];
    iconId?: string | null;
    color?: string | null;
  }>(),
  { icons: () => [], iconId: null, color: null },
);

const emit = defineEmits<{
  "select-icon": [value: string];
  "select-color": [value: string];
  clear: [];
}>();

const selectedColor = computed(() => (isSafeListColor(props.color) ? props.color : null));
const customColor = computed(() =>
  selectedColor.value && !LIST_COLOR_PRESETS.some((preset) => preset.value === selectedColor.value)
    ? selectedColor.value
    : null,
);
const customColorInput = ref<HTMLInputElement | null>(null);

function selectIcon(id: string) {
  if (props.iconId === id) emit("clear");
  else emit("select-icon", id);
}

function selectColor(value: string) {
  if (selectedColor.value === value) emit("clear");
  else emit("select-color", value);
}

function activateCustomColor() {
  if (customColor.value) {
    emit("clear");
    return;
  }

  customColorInput.value?.click();
}

function selectCustomColor(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  if (isSafeListColor(value)) emit("select-color", value);
}
</script>

<template>
  <div class="list-appearance-picker">
    <div class="mb-1.5 flex items-baseline justify-between gap-2">
      <span class="text-[12px] font-semibold text-ink">List appearance</span>
      <span class="text-[10px] text-ink-muted">Choose an icon or color</span>
    </div>

    <div class="list-appearance-grid" role="listbox" aria-label="List appearance choices">
      <button
        v-for="icon in props.icons"
        :key="icon.id"
        type="button"
        class="list-appearance-cell list-icon-cell border"
        :class="iconId === icon.id ? 'is-selected' : 'border-stroke-soft bg-bg'"
        role="option"
        :aria-selected="iconId === icon.id"
        :aria-label="`${icon.label}${iconId === icon.id ? ', selected' : ''}`"
        :title="icon.label"
        @click="selectIcon(icon.id)"
      >
        <img :src="icon.src" :alt="icon.label" loading="lazy" />
      </button>

      <button
        v-for="preset in LIST_COLOR_PRESETS"
        :key="preset.value"
        type="button"
        class="list-appearance-cell list-color-cell"
        :class="{ 'is-selected': selectedColor === preset.value }"
        :style="{ '--list-color': preset.value }"
        role="option"
        :aria-selected="selectedColor === preset.value"
        :aria-label="`${preset.label} color${selectedColor === preset.value ? ', selected' : ''}`"
        :title="preset.label"
        @click="selectColor(preset.value)"
      >
        <span aria-hidden="true" />
      </button>

      <button
        type="button"
        class="list-appearance-cell list-color-cell list-custom-color-cell"
        :class="{ 'is-selected': Boolean(customColor) }"
        :style="{ '--list-color': customColor ?? undefined }"
        role="option"
        :aria-selected="Boolean(customColor)"
        :aria-label="`Custom color${customColor ? ', selected' : ''}`"
        title="Custom color"
        @click="activateCustomColor"
      >
        <span aria-hidden="true" />
      </button>

      <button
        type="button"
        class="list-appearance-cell list-appearance-clear-cell"
        :class="{ 'is-selected': !iconId && !selectedColor }"
        role="option"
        :aria-selected="!iconId && !selectedColor"
        aria-label="Clear list appearance"
        title="Clear appearance"
        @click="emit('clear')"
      >
        <span aria-hidden="true">×</span>
        <span>Clear</span>
      </button>
    </div>

    <input
      ref="customColorInput"
      class="list-custom-color-input"
      type="color"
      :value="customColor ?? '#e5a83b'"
      tabindex="-1"
      aria-hidden="true"
      @change="selectCustomColor"
    />
  </div>
</template>
