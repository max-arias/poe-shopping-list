<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useDraftList } from "../../composables/useDraftList";
import { useFocusTrap } from "../../composables/useFocusTrap";
import { useSettings } from "../../composables/useSettings";
import { useUiStore } from "../../stores/ui";
import { sendMessage } from "../../utils/messages";
import BtnAccent from "../shared/BtnAccent.vue";
import BtnGhost from "../shared/BtnGhost.vue";
import Pill from "../shared/Pill.vue";

const ui = useUiStore();
const { draft, addItem } = useDraftList();
const { settings } = useSettings();

const itemName = ref("");
const saving = ref(false);
const capture = ref<import("@/types").TradeCapture | null>(null);
const filters = ref<import("@/types").SearchFilterSnapshot | null>(null);
const loadingCapture = ref(false);

const dialogRef = ref<HTMLElement | null>(null);
const { activate, deactivate } = useFocusTrap(dialogRef);
onMounted(activate);
onBeforeUnmount(deactivate);

onMounted(async () => {
  itemName.value = ui.pendingSaveName;

  if (!itemName.value) {
    try {
      const res = await sendMessage("spSearchBarGet");
      console.log("[poe-sl] modal: spSearchBarGet =", res);
      itemName.value = res?.text ?? "";
    } catch (e) {
      console.error("[poe-sl] modal: spSearchBarGet error:", e);
    }
  }

  if (settings.value.autoCapturePrice) {
    loadingCapture.value = true;
    try {
      const cap = await sendMessage("spCaptureRead");
      console.log("[poe-sl] modal: spCaptureRead =", cap);
      capture.value = cap ?? null;
    } catch (e) {
      console.error("[poe-sl] modal: spCaptureRead error:", e);
      capture.value = null;
    } finally {
      loadingCapture.value = false;
    }
  }

  try {
    filters.value = await sendMessage("spSearchFiltersRead");
  } catch {
    filters.value = null;
  }
});

async function handleSave() {
  if (!itemName.value.trim() || saving.value || !draft.value) return;
  saving.value = true;
  // Determine trade URL: use capture URL or current active tab URL
  let tradeUrl = capture.value?.tradeUrl ?? "";
  if (!tradeUrl) {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      tradeUrl = tab?.url ?? "";
    } catch {}
  }
  await addItem(itemName.value.trim(), tradeUrl, capture.value, filters.value);
  saving.value = false;
  ui.closeSaveModal();
}

const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
</script>

<template>
  <div
    ref="dialogRef"
    class="absolute inset-0 bg-black/50 flex items-end z-20"
    role="dialog"
    aria-modal="true"
    @keydown.escape="ui.closeSaveModal()"
    @click.self="ui.closeSaveModal()"
  >
    <div class="w-full bg-bg border-t-2 border-accent flex flex-col gap-3 p-3.5 pb-3 shadow-panel">
      <!-- Header -->
      <div class="flex items-center">
        <p class="text-[13px] font-semibold text-ink">Save Search</p>
        <div class="flex-1" />
        <button
          @click="ui.closeSaveModal()"
          class="text-ink-muted text-base cursor-pointer bg-transparent border-0 leading-none"
        >
          ✕
        </button>
      </div>

      <!-- Name field -->
      <div>
        <p class="text-[10px] text-ink-muted uppercase tracking-[0.6px] mb-1">Name</p>
        <input
          v-model="itemName"
          maxlength="120"
          @keydown.enter="handleSave"
          placeholder="Item name…"
          aria-label="Item name"
          class="w-full h-9 px-2.5 text-[13px] border border-accent-edge rounded-sm text-ink"
          autofocus
        />
        <p class="text-[10px] text-ink-muted mt-1">
          Auto-filled from trade search bar · tap to edit
        </p>
      </div>

      <!-- Save-to list -->
      <div>
        <p class="text-[10px] text-ink-muted uppercase tracking-[0.6px] mb-1">Save to</p>
        <div
          class="flex items-center gap-1.5 h-9 px-2.5 border border-stroke rounded-sm text-[13px] text-ink"
        >
          <div class="w-2 h-2 rounded-full bg-accent shrink-0" />
          <span class="flex-1 truncate">{{ draft?.name ?? "No active list" }}</span>
          <Pill tone="accent">ACTIVE</Pill>
        </div>
      </div>

      <!-- Price preview -->
      <div v-if="loadingCapture" class="text-[11px] text-ink-muted text-center py-2">
        Reading prices…
      </div>
      <div v-else-if="capture && capture.aggregates.sampleSize > 0">
        <div class="border border-stroke rounded-sm p-2.5 grid grid-cols-3 gap-2 bg-surface">
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
              <span class="font-mono text-base font-semibold text-accent-ink-str">{{
                fmt(val as number)
              }}</span>
              <span class="text-[10px] text-ink-muted">{{ capture.aggregates.currency }}</span>
            </div>
          </div>
        </div>
        <p class="text-[10px] text-ink-muted -mt-1">
          {{ capture.aggregates.sampleSize }} listings captured · dominant currency:
          {{ capture.aggregates.currency }}
        </p>
      </div>
      <p v-else class="text-[10px] text-ink-muted">No price data — saving name only.</p>

      <!-- Actions -->
      <div class="flex gap-2 mt-1">
        <BtnGhost label="Cancel" :full="true" size="md" @click="ui.closeSaveModal()" />
        <BtnAccent
          label="Save"
          :disabled="!itemName.trim() || !draft || saving"
          @click="handleSave"
        />
      </div>
    </div>
  </div>
</template>
