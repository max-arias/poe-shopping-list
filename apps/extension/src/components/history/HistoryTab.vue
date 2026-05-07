<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from "vue";
import { useFocusTrap } from "../../composables/useFocusTrap";
import { usePurchaseHistory } from "../../composables/usePurchaseHistory";
import { useUiStore } from "../../stores/ui";
import HistoryItemRow from "./HistoryItemRow.vue";
import HistoryKebabMenu from "./HistoryKebabMenu.vue";
import BtnGhost from "../shared/BtnGhost.vue";

const { items, isLoaded, removeItems, renameItem, changePrice } = usePurchaseHistory();
const ui = useUiStore();

const selectedIds = ref<Set<string>>(new Set());
const allSelected = computed(
  () => items.value.length > 0 && selectedIds.value.size === items.value.length,
);

function toggleSelect(id: string) {
  const next = new Set(selectedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selectedIds.value = next;
}

function toggleAll() {
  if (allSelected.value) {
    selectedIds.value = new Set();
  } else {
    selectedIds.value = new Set(items.value.map((i) => i.id));
  }
}

async function deleteSelected() {
  await removeItems([...selectedIds.value]);
  selectedIds.value = new Set();
}

// Rename sheet state
const renamingItemId = ref<string | null>(null);
const renameValue = ref("");

function startRename(id: string) {
  const item = items.value.find((i) => i.id === id);
  if (!item) return;
  renamingItemId.value = id;
  renameValue.value = item.name;
  ui.closeKebab();
}

async function confirmRename() {
  if (!renamingItemId.value || !renameValue.value.trim()) return;
  await renameItem(renamingItemId.value, renameValue.value.trim());
  renamingItemId.value = null;
}

// Change price sheet state
const changingPriceItemId = ref<string | null>(null);
const priceValue = ref("");
const priceCurrency = ref("");

function startChangePrice(id: string) {
  const item = items.value.find((i) => i.id === id);
  if (!item) return;
  changingPriceItemId.value = id;
  priceValue.value = String(item.priceValue);
  priceCurrency.value = item.priceCurrency;
  ui.closeKebab();
}

async function confirmChangePrice() {
  if (!changingPriceItemId.value) return;
  const val = Number.parseFloat(priceValue.value);
  if (Number.isNaN(val) || val <= 0) return;
  await changePrice(changingPriceItemId.value, val, priceCurrency.value.trim() || "chaos");
  changingPriceItemId.value = null;
}

const renameDialogRef = ref<HTMLElement | null>(null);
const priceDialogRef = ref<HTMLElement | null>(null);
const renameFocusTrap = useFocusTrap(renameDialogRef);
const priceFocusTrap = useFocusTrap(priceDialogRef);

watch(renamingItemId, async (val) => {
  if (val) {
    await nextTick();
    renameFocusTrap.activate();
  } else {
    renameFocusTrap.deactivate();
  }
});

watch(changingPriceItemId, async (val) => {
  if (val) {
    await nextTick();
    priceFocusTrap.activate();
  } else {
    priceFocusTrap.deactivate();
  }
});
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
    <template v-if="!isLoaded">
      <div class="flex-1 px-3 py-3 space-y-2.5 overflow-hidden">
        <div
          v-for="row in 5"
          :key="row"
          class="h-16 rounded-md border border-stroke-soft bg-surface/70 animate-pulse"
        />
      </div>
    </template>
    <template v-else-if="items.length === 0">
      <div class="flex-1 flex flex-col items-center justify-center gap-3 px-5 text-center">
        <p class="text-[13px] font-semibold text-ink">No purchases yet</p>
        <p class="text-[11px] text-ink-muted max-w-[200px] leading-relaxed">
          Click "Travel to Hideout" on the trade site to start tracking purchases.
        </p>
      </div>
    </template>
    <template v-else>
      <!-- Select all header -->
      <div
        class="flex items-center gap-2.5 px-3 py-2 border-b border-stroke-soft bg-surface shrink-0"
      >
        <input
          type="checkbox"
          :checked="allSelected"
          @change="toggleAll"
          aria-label="Select all items"
          class="w-3.5 h-3.5 shrink-0 accent-accent cursor-pointer"
        />
        <span class="text-[11px] text-ink-muted flex-1">
          {{ selectedIds.size > 0 ? `${selectedIds.size} selected` : `${items.length} items` }}
        </span>
        <button
          v-if="selectedIds.size > 0"
          @click="deleteSelected"
          class="text-[11px] text-destructive hover:underline cursor-pointer bg-transparent border-0 px-0 py-0 font-medium"
        >
          Delete selected
        </button>
      </div>

      <!-- Items list -->
      <div class="flex-1 overflow-auto relative" @click="ui.closeKebab()">
        <div v-for="item in items" :key="item.id" class="relative" @click.stop>
          <HistoryItemRow :item="item" @toggle-select="toggleSelect" />
          <HistoryKebabMenu
            v-if="ui.kebabOpenItemId === item.id"
            :item="item"
            @rename="startRename"
            @change-price="startChangePrice"
          />
        </div>
      </div>
    </template>

    <!-- Rename overlay -->
    <div
      v-if="renamingItemId"
      ref="renameDialogRef"
      class="absolute inset-0 bg-black/50 flex items-center justify-center z-20 px-6"
      role="dialog"
      aria-modal="true"
      @keydown.escape="renamingItemId = null"
      @click.self="renamingItemId = null"
    >
      <div
        class="bg-bg border border-stroke rounded-md p-4 flex flex-col gap-3 w-full max-w-[280px]"
      >
        <p class="text-[13px] font-semibold text-ink">Rename item</p>
        <input
          v-model="renameValue"
          aria-label="New name"
          @keydown.enter="confirmRename"
          @keydown.escape="renamingItemId = null"
          class="w-full h-8 px-2.5 text-xs border border-stroke rounded-sm text-ink bg-bg outline-none focus:border-accent"
          autofocus
        />
        <div class="flex gap-2">
          <BtnGhost label="Cancel" :full="true" size="sm" @click="renamingItemId = null" />
          <button
            @click="confirmRename"
            class="flex-1 h-8 text-xs font-semibold bg-accent text-accent-ink border-0 rounded-sm cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    </div>

    <!-- Change price overlay -->
    <div
      v-if="changingPriceItemId"
      ref="priceDialogRef"
      class="absolute inset-0 bg-black/50 flex items-center justify-center z-20 px-6"
      role="dialog"
      aria-modal="true"
      @keydown.escape="changingPriceItemId = null"
      @click.self="changingPriceItemId = null"
    >
      <div
        class="bg-bg border border-stroke rounded-md p-4 flex flex-col gap-3 w-full max-w-[280px]"
      >
        <p class="text-[13px] font-semibold text-ink">Change price</p>
        <div class="flex gap-2">
          <input
            v-model="priceValue"
            type="number"
            min="0"
            step="0.1"
            aria-label="Price value"
            @keydown.enter="confirmChangePrice"
            @keydown.escape="changingPriceItemId = null"
            class="flex-1 h-8 px-2.5 text-xs border border-stroke rounded-sm text-ink bg-bg outline-none focus:border-accent"
            autofocus
          />
          <input
            v-model="priceCurrency"
            aria-label="Currency"
            @keydown.enter="confirmChangePrice"
            @keydown.escape="changingPriceItemId = null"
            class="w-20 h-8 px-2.5 text-xs border border-stroke rounded-sm text-ink bg-bg outline-none focus:border-accent"
            placeholder="chaos"
          />
        </div>
        <div class="flex gap-2">
          <BtnGhost label="Cancel" :full="true" size="sm" @click="changingPriceItemId = null" />
          <button
            @click="confirmChangePrice"
            class="flex-1 h-8 text-xs font-semibold bg-accent text-accent-ink border-0 rounded-sm cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
