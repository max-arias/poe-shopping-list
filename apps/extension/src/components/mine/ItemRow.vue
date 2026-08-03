<script setup lang="ts">
import { ref, watch } from "vue";
import type { DraftItem } from "@/types";
import { useSettings } from "../../composables/useSettings";

const props = defineProps<{
  item: DraftItem;
  isFirst: boolean;
  isLast: boolean;
  editMode: boolean;
}>();
const emit = defineEmits<{
  toggle: [completed: boolean];
  move: [direction: "earlier" | "later"];
  dragStart: [];
  dragEnd: [];
  drop: [];
  update: [patch: { title?: string; tradeUrl?: string }];
  remove: [];
}>();
const { settings } = useSettings();
const editTitle = ref(props.item.title);
const editTradeUrl = ref(props.item.tradeUrl);

watch(
  () => props.item,
  (item) => {
    editTitle.value = item.title;
    editTradeUrl.value = item.tradeUrl;
  },
);

async function toggle() {
  emit("toggle", !props.item.completed);
}

async function openTrade() {
  if (!props.item.tradeUrl) return;
  if (settings.value.openItemsInNewTab) {
    await browser.tabs.create({ url: props.item.tradeUrl });
  } else {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) await browser.tabs.update(tab.id, { url: props.item.tradeUrl });
  }
}

function saveEdit() {
  const title = editTitle.value.trim();
  const tradeUrl = editTradeUrl.value.trim();
  if (!title) {
    editTitle.value = props.item.title;
    return;
  }
  if (title !== props.item.title || tradeUrl !== props.item.tradeUrl) {
    emit("update", { title, tradeUrl });
  }
}

function startDrag(event: DragEvent) {
  event.dataTransfer?.setData("text/plain", props.item.id);
  event.dataTransfer?.setDragImage(event.currentTarget as HTMLElement, 12, 12);
  emit("dragStart");
}
</script>

<template>
  <div
    class="item-row flex min-h-12 items-center gap-2 border-b border-stroke-soft py-2"
    @dragover.prevent
    @drop.prevent="emit('drop')"
  >
    <button
      type="button"
      class="flex h-7 w-6 shrink-0 cursor-grab items-center justify-center bg-transparent text-sm text-ink-muted active:cursor-grabbing focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
      draggable="true"
      aria-label="Drag to reorder item"
      @dragstart="startDrag"
      @dragend="emit('dragEnd')"
    >
      ⠿
    </button>
    <div
      class="sr-only focus-within:not-sr-only flex shrink-0 gap-0.5"
      aria-label="Keyboard reorder controls"
    >
      <button
        type="button"
        class="flex h-7 w-6 items-center justify-center bg-transparent text-sm text-ink-muted hover:bg-surface-hover disabled:opacity-30 focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
        :disabled="isFirst"
        :aria-label="`Move ${item.title} earlier`"
        @click="emit('move', 'earlier')"
      >
        ↑
      </button>
      <button
        type="button"
        class="flex h-7 w-6 items-center justify-center bg-transparent text-sm text-ink-muted hover:bg-surface-hover disabled:opacity-30 focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
        :disabled="isLast"
        :aria-label="`Move ${item.title} later`"
        @click="emit('move', 'later')"
      >
        ↓
      </button>
    </div>
    <button
      type="button"
      role="checkbox"
      :aria-checked="item.completed"
      class="checkbox checkbox-sm shrink-0 border-[#8aa08f] bg-white text-[10px] text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
      :class="item.completed ? 'border-accent bg-accent' : ''"
      :aria-label="item.completed ? `Mark ${item.title} incomplete` : `Mark ${item.title} complete`"
      @click="toggle"
    >
      <span v-if="item.completed" aria-hidden="true">✓</span>
    </button>
    <template v-if="editMode">
      <div class="min-w-0 flex-1 space-y-1">
        <input
          v-model="editTitle"
          type="text"
          maxlength="120"
          aria-label="Item title"
          class="h-8 w-full border border-stroke bg-bg px-2 text-[12px] text-ink outline-none focus:border-accent"
          @blur="saveEdit"
          @keydown.enter.prevent="saveEdit"
        />
        <input
          v-model="editTradeUrl"
          type="url"
          aria-label="Trade URL"
          placeholder="Trade URL"
          class="h-7 w-full border border-stroke bg-bg px-2 text-[10px] text-ink outline-none focus:border-accent"
          @blur="saveEdit"
          @keydown.enter.prevent="saveEdit"
        />
      </div>
      <button
        type="button"
        class="shrink-0 bg-transparent px-1 text-[10px] text-ink-muted underline hover:text-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
        aria-label="Remove item"
        @click="emit('remove')"
      >
        Remove
      </button>
    </template>
    <button
      v-else
      type="button"
      class="link link-hover min-w-0 flex-1 truncate bg-transparent p-0 text-left text-[13px] font-normal text-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
      :class="item.completed ? 'opacity-60 line-through' : ''"
      :aria-label="`Open ${item.title} trade search`"
      @click="openTrade"
    >
      {{ item.title }}
    </button>
  </div>
</template>
