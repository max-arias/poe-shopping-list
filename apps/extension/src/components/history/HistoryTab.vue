<script setup lang="ts">
import { AnimatePresence, motion } from "motion-v";
import { ref, computed, watch, nextTick } from "vue";
import { useFocusTrap } from "../../composables/useFocusTrap";
import { usePurchaseHistory } from "../../composables/usePurchaseHistory";
import { useVisitHistory } from "../../composables/useVisitHistory";
import { useUiStore } from "../../stores/ui";
import HistoryItemRow from "./HistoryItemRow.vue";
import HistoryVisitRow from "./HistoryVisitRow.vue";
import HistoryKebabMenu from "./HistoryKebabMenu.vue";
import BtnGhost from "../shared/BtnGhost.vue";
import {
  buttonMotionProps,
  createSlideMotionProps,
  dialogMotionProps,
  overlayMotionProps,
  skeletonPulseMotionProps,
} from "../../utils/motion";

const { items, isLoaded, removeItems, renameItem, changePrice } = usePurchaseHistory();
const {
  items: visitItems,
  isLoaded: isVisitHistoryLoaded,
  removeItems: removeVisitItems,
} = useVisitHistory();
const ui = useUiStore();

const activeSubtab = ref<"visits" | "purchases">("visits");
const isLoadedAny = computed(() => isLoaded.value && isVisitHistoryLoaded.value);
const visibleItems = computed(() =>
  activeSubtab.value === "visits" ? visitItems.value : items.value,
);

const selectedIds = ref<Set<string>>(new Set());
const allSelected = computed(
  () => visibleItems.value.length > 0 && selectedIds.value.size === visibleItems.value.length,
);

watch(activeSubtab, () => {
  selectedIds.value = new Set();
});

watch(visibleItems, (nextItems) => {
  const nextIds = new Set(nextItems.map((item) => item.id));
  selectedIds.value = new Set([...selectedIds.value].filter((id) => nextIds.has(id)));
});

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
    selectedIds.value = new Set(visibleItems.value.map((i) => i.id));
  }
}

async function deleteSelected() {
  if (activeSubtab.value === "visits") {
    await removeVisitItems([...selectedIds.value]);
  } else {
    await removeItems([...selectedIds.value]);
  }
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

const subviewSlideMotionProps = createSlideMotionProps(8);
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
    <div class="flex border-b border-stroke-soft bg-surface shrink-0 px-2 pt-2">
      <motion.button
        @click="activeSubtab = 'visits'"
        v-bind="buttonMotionProps"
        class="flex-1 rounded-t-md border border-b-0 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.5px] cursor-pointer bg-transparent"
        :class="
          activeSubtab === 'visits'
            ? 'border-stroke bg-bg text-accent-ink-str'
            : 'border-transparent text-ink-muted hover:text-ink'
        "
      >
        Visits ({{ visitItems.length }})
      </motion.button>
      <motion.button
        @click="activeSubtab = 'purchases'"
        v-bind="buttonMotionProps"
        class="flex-1 rounded-t-md border border-b-0 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.5px] cursor-pointer bg-transparent"
        :class="
          activeSubtab === 'purchases'
            ? 'border-stroke bg-bg text-accent-ink-str'
            : 'border-transparent text-ink-muted hover:text-ink'
        "
      >
        Purchases ({{ items.length }})
      </motion.button>
    </div>

    <template v-if="!isLoadedAny">
      <div class="flex-1 px-3 py-3 space-y-2.5 overflow-hidden">
        <motion.div
          v-for="row in 5"
          :key="row"
          v-bind="skeletonPulseMotionProps"
          class="h-16 rounded-md border border-stroke-soft bg-surface/70"
        />
      </div>
    </template>
    <template v-else-if="activeSubtab === 'visits' && visitItems.length === 0">
      <div class="flex-1 flex flex-col items-center justify-center gap-3 px-5 text-center">
        <p class="text-[13px] font-semibold text-ink">No visits yet</p>
        <p class="text-[11px] text-ink-muted max-w-[220px] leading-relaxed">
          Every trade search page you visit will show up here so you can reopen it later.
        </p>
      </div>
    </template>
    <template v-else-if="activeSubtab === 'purchases' && items.length === 0">
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
          {{
            selectedIds.size > 0
              ? `${selectedIds.size} selected`
              : `${visibleItems.length} ${activeSubtab}`
          }}
        </span>
        <motion.button
          v-if="selectedIds.size > 0"
          @click="deleteSelected"
          v-bind="buttonMotionProps"
          class="text-[11px] text-destructive hover:underline cursor-pointer bg-transparent border-0 px-0 py-0 font-medium"
        >
          Delete selected
        </motion.button>
      </div>

      <!-- Items list -->
      <div class="flex-1 overflow-auto relative" @click="ui.closeKebab()">
        <AnimatePresence mode="wait" :initial="false">
          <motion.div
            v-if="activeSubtab === 'visits'"
            key="visits"
            v-bind="subviewSlideMotionProps"
            class="h-full"
          >
            <HistoryVisitRow
              v-for="item in visitItems"
              :key="item.id"
              :item="item"
              @toggle-select="toggleSelect"
            />
          </motion.div>
          <motion.div v-else key="purchases" v-bind="subviewSlideMotionProps" class="h-full">
            <div v-for="item in items" :key="item.id" class="relative" @click.stop>
              <HistoryItemRow :item="item" @toggle-select="toggleSelect" />
              <AnimatePresence>
                <HistoryKebabMenu
                  v-if="ui.kebabOpenItemId === item.id"
                  :item="item"
                  @rename="startRename"
                  @change-price="startChangePrice"
                />
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </template>

    <!-- Rename overlay -->
    <AnimatePresence>
      <motion.div
        v-if="renamingItemId"
        key="rename-item"
        ref="renameDialogRef"
        v-bind="overlayMotionProps"
        class="absolute inset-0 bg-black/50 flex items-center justify-center z-20 px-6"
        role="dialog"
        aria-modal="true"
        @keydown.escape="renamingItemId = null"
        @click.self="renamingItemId = null"
      >
        <motion.div
          v-bind="dialogMotionProps"
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
            <motion.button
              @click="confirmRename"
              v-bind="buttonMotionProps"
              class="flex-1 h-8 text-xs font-semibold bg-accent text-accent-ink border-0 rounded-sm cursor-pointer"
            >
              Save
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>

    <!-- Change price overlay -->
    <AnimatePresence>
      <motion.div
        v-if="changingPriceItemId"
        key="change-price"
        ref="priceDialogRef"
        v-bind="overlayMotionProps"
        class="absolute inset-0 bg-black/50 flex items-center justify-center z-20 px-6"
        role="dialog"
        aria-modal="true"
        @keydown.escape="changingPriceItemId = null"
        @click.self="changingPriceItemId = null"
      >
        <motion.div
          v-bind="dialogMotionProps"
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
            <motion.button
              @click="confirmChangePrice"
              v-bind="buttonMotionProps"
              class="flex-1 h-8 text-xs font-semibold bg-accent text-accent-ink border-0 rounded-sm cursor-pointer"
            >
              Save
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  </div>
</template>
