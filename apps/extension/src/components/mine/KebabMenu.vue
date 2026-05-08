<script setup lang="ts">
import type { DraftItem } from '@/types';
import { useDraftList } from '../../composables/useDraftList';
import { useUiStore } from '../../stores/ui';

const { item } = defineProps<{ item: DraftItem }>();

const ui = useUiStore();
const { removeItem, setComplete } = useDraftList();

const actions = [
  { label: '↗  Open search', key: 'open' },
  { label: '⎘  Copy URL', key: 'copy' },
  { label: '✎  Edit', key: 'edit' },
  { label: item.completed ? '○  Unmark' : '✓  Mark as acquired', key: 'toggle' },
  { sep: true },
  { label: '✕  Remove', key: 'delete', danger: true },
] as const;

async function handleAction(key: string) {
  ui.closeKebab();
  switch (key) {
    case 'open':
      window.open(item.tradeUrl, '_blank');
      break;
    case 'copy':
      await navigator.clipboard.writeText(item.tradeUrl);
      break;
    case 'toggle':
      await setComplete(item.id, !item.completed);
      break;
    case 'edit':
      ui.openEditSheet(item.id);
      break;
    case 'delete':
      await removeItem(item.id);
      break;
  }
}
</script>

<template>
  <div
    class="absolute right-2 z-10 bg-bg border border-stroke rounded-sm py-1 min-w-[160px] shadow-popover"
    style="box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18)"
    role="menu"
    aria-label="Item actions menu"
    @keydown.escape="ui.closeKebab()"
  >
    <template v-for="action in actions" :key="'sep' in action ? 'sep' : action.key">
      <div v-if="'sep' in action" class="h-px bg-stroke-soft mx-0 my-1" />
      <button
        v-else
        role="menuitem"
        @click="handleAction(action.key)"
        class="w-full text-left px-3 py-1.5 text-xs bg-transparent border-0 cursor-pointer"
        :class="'danger' in action && action.danger ? 'text-destructive' : 'text-ink'"
      >
        {{ action.label }}
      </button>
    </template>
  </div>
</template>
