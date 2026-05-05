<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useUiStore } from "../../stores/ui";
import { useDraftList } from "../../composables/useDraftList";
import { sendMessage } from "../../utils/messages";
import BtnGhost from "../shared/BtnGhost.vue";
import BtnGold from "../shared/BtnGold.vue";

const ui = useUiStore();
const { draft, updateItem, updateCapture, removeItem } = useDraftList();

const item = computed(() => draft.value?.items.find((i) => i.id === ui.editSheetItemId));

const name = ref("");
const tradeUrl = ref("");
const capture = ref(item.value?.capture ?? null);

watch(
  item,
  (newItem) => {
    if (newItem) {
      name.value = newItem.name;
      tradeUrl.value = newItem.tradeUrl ?? "";
      capture.value = newItem.capture;
    }
  },
  { immediate: true },
);
const refreshing = ref(false);
const saving = ref(false);
const confirmingDelete = ref(false);

const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

async function handleSave() {
  if (!item.value || !name.value.trim() || saving.value) return;
  saving.value = true;
  await updateItem(item.value.id, { name: name.value.trim(), tradeUrl: tradeUrl.value.trim() });
  saving.value = false;
  ui.closeEditSheet();
}

async function handleRefresh() {
  if (!item.value || refreshing.value) return;
  refreshing.value = true;
  try {
    const cap = await sendMessage("spCaptureRead");
    if (cap) {
      capture.value = cap;
      await updateCapture(item.value.id, cap);
    }
  } finally {
    refreshing.value = false;
  }
}

async function handleDelete() {
  if (!item.value) return;
  await removeItem(item.value.id);
  ui.closeEditSheet();
}
</script>

<template>
  <div class="absolute inset-0 bg-black/50 flex items-end z-20" @click.self="ui.closeEditSheet()">
    <div
      class="w-full bg-bg border-t-2 border-gold flex flex-col gap-3 p-3.5 pb-3 max-h-[90%] overflow-auto"
      style="box-shadow: 0 -6px 20px rgba(0, 0, 0, 0.25)"
    >
      <!-- Header -->
      <div class="flex items-center">
        <p class="text-[13px] font-semibold text-ink">Edit Item</p>
        <div class="flex-1" />
        <button
          @click="ui.closeEditSheet()"
          class="text-ink-muted text-base cursor-pointer bg-transparent border-0 leading-none"
        >
          ✕
        </button>
      </div>

      <!-- Name field -->
      <div>
        <p class="text-[10px] text-ink-muted uppercase tracking-[0.6px] mb-1">Name</p>
        <input
          v-model="name"
          maxlength="120"
          @keydown.enter="handleSave"
          placeholder="Item name…"
          class="w-full h-9 px-2.5 text-[13px] border border-gold-edge rounded-sm text-ink bg-bg"
          autofocus
        />
      </div>

      <!-- Trade URL field -->
      <div>
        <p class="text-[10px] text-ink-muted uppercase tracking-[0.6px] mb-1">Trade URL</p>
        <input
          v-model="tradeUrl"
          @keydown.enter="handleSave"
          placeholder="https://pathofexile.com/trade/…"
          class="w-full h-9 px-2.5 text-[13px] border border-stroke rounded-sm text-ink bg-bg"
        />
      </div>

      <!-- Price section -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <p class="text-[10px] text-ink-muted uppercase tracking-[0.6px]">Price</p>
          <button
            @click="handleRefresh"
            :disabled="refreshing"
            class="text-[10px] text-gold-ink-str cursor-pointer bg-transparent border-0 disabled:opacity-40"
          >
            {{ refreshing ? "Reading…" : "↻ Refresh from active tab" }}
          </button>
        </div>
        <div
          v-if="capture && capture.aggregates.sampleSize > 0"
          class="border border-stroke rounded-sm p-2.5 grid grid-cols-3 gap-2 bg-surface"
        >
          <div
            v-for="[label, val] in [
              ['MIN', capture.aggregates.min],
              ['MEDIAN', capture.aggregates.median],
              ['AVG', capture.aggregates.avg],
            ]"
            :key="label"
            class="flex flex-col gap-0.5"
          >
            <p class="text-[10px] text-ink-muted">{{ label }}</p>
            <div class="flex items-baseline gap-1">
              <span class="font-mono text-base font-semibold text-gold-ink-str">{{
                fmt(val as number)
              }}</span>
              <span class="text-[10px] text-ink-muted">{{ capture.aggregates.currency }}</span>
            </div>
          </div>
        </div>
        <p
          v-if="capture && capture.aggregates.sampleSize > 0"
          class="text-[10px] text-ink-muted mt-1"
        >
          {{ capture.aggregates.sampleSize }} listings captured · dominant currency:
          {{ capture.aggregates.currency }}
        </p>
        <p v-else class="text-[11px] text-ink-muted">No price data captured.</p>
      </div>

      <!-- Save -->
      <div class="flex gap-2">
        <BtnGhost label="Cancel" :full="true" size="md" @click="ui.closeEditSheet()" />
        <BtnGold label="Save" :disabled="!name.trim() || saving" @click="handleSave" />
      </div>

      <!-- Delete section -->
      <div class="h-px bg-stroke-soft" />
      <div v-if="!confirmingDelete">
        <button
          @click="confirmingDelete = true"
          class="w-full h-8 text-xs font-medium text-[#a8432a] bg-transparent border border-[#a8432a]/40 rounded-sm cursor-pointer hover:bg-[#a8432a]/10"
        >
          🗑 Delete item
        </button>
      </div>
      <div v-else class="flex flex-col gap-2">
        <p class="text-[11px] text-ink-muted text-center">
          Remove "{{ item?.name }}"? This cannot be undone.
        </p>
        <div class="flex gap-2">
          <BtnGhost label="Cancel" :full="true" size="md" @click="confirmingDelete = false" />
          <button
            @click="handleDelete"
            class="flex-1 h-8 text-xs font-semibold bg-[#a8432a] text-white border-0 rounded-sm cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
