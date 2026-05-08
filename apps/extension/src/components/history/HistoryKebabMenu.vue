<script setup lang="ts">
import type { PurchaseHistoryItem } from "@/types";
import { usePurchaseHistory } from "../../composables/usePurchaseHistory";
import { useUiStore } from "../../stores/ui";

const { item } = defineProps<{ item: PurchaseHistoryItem }>();

const ui = useUiStore();
const { removeItem } = usePurchaseHistory();

const actions = [
  { label: "✎  Rename", key: "rename" },
  { label: "¤  Change price", key: "changePrice" },
  { sep: true },
  { label: "✕  Delete", key: "delete", danger: true },
] as const;

const emit = defineEmits<{ rename: [id: string]; changePrice: [id: string] }>();

async function handleAction(key: string) {
  ui.closeKebab();
  switch (key) {
    case "rename":
      emit("rename", item.id);
      break;
    case "changePrice":
      emit("changePrice", item.id);
      break;
    case "delete":
      await removeItem(item.id);
      break;
  }
}
</script>

<template>
  <div
    role="menu"
    aria-label="Item actions menu"
    class="absolute right-2 z-10 bg-bg border border-stroke rounded-sm py-1 min-w-[160px] shadow-popover"
    @keydown.escape="ui.closeKebab()"
  >
    <template v-for="action in actions" :key="'sep' in action ? 'sep' : action.key">
      <div v-if="'sep' in action" class="h-px bg-stroke-soft mx-0 my-1" />
      <button
        v-else
        @click="handleAction(action.key)"
        role="menuitem"
        class="w-full text-left px-3 py-1.5 text-xs bg-transparent border-0 cursor-pointer"
        :class="'danger' in action && action.danger ? 'text-destructive' : 'text-ink'"
      >
        {{ action.label }}
      </button>
    </template>
  </div>
</template>
