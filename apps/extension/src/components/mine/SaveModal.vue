<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useUiStore } from "../../stores/ui";
import { useDraftList } from "../../composables/useDraftList";
import { useSettings } from "../../composables/useSettings";
import { sendMessage } from "../../utils/messages";
import Pill from "../shared/Pill.vue";
import BtnGhost from "../shared/BtnGhost.vue";
import BtnGold from "../shared/BtnGold.vue";

const ui = useUiStore();
const { draft, addItem } = useDraftList();
const { settings } = useSettings();

const itemName = ref("");
const saving = ref(false);
const capture = ref<import("@poe-sl/schema").TradeCapture | null>(null);
const loadingCapture = ref(false);

async function getActiveTabId(): Promise<number | undefined> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}

onMounted(async () => {
  itemName.value = ui.pendingSaveName;

  const tabId = await getActiveTabId();
  console.log("[poe-sl] modal: active tabId =", tabId);

  if (!itemName.value) {
    try {
      const res = await sendMessage("searchBarGet", undefined, tabId);
      console.log("[poe-sl] modal: searchBarGet =", res);
      itemName.value = res?.text ?? "";
    } catch (e) {
      console.error("[poe-sl] modal: searchBarGet error:", e);
    }
  }

  if (settings.value.autoCapturePrice) {
    loadingCapture.value = true;
    try {
      const cap = await sendMessage("captureRead", undefined, tabId);
      console.log("[poe-sl] modal: captureRead =", cap);
      capture.value = cap ?? null;
    } catch (e) {
      console.error("[poe-sl] modal: captureRead error:", e);
      capture.value = null;
    } finally {
      loadingCapture.value = false;
    }
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
  await addItem(itemName.value.trim(), tradeUrl, capture.value);
  saving.value = false;
  ui.closeSaveModal();
}

const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
</script>

<template>
  <!-- Backdrop -->
  <div class="absolute inset-0 bg-black/50 flex items-end z-20" @click.self="ui.closeSaveModal()">
    <!-- Sheet -->
    <div
      class="w-full bg-bg border-t-2 border-gold flex flex-col gap-3 p-3.5 pb-3"
      style="box-shadow: 0 -6px 20px rgba(0, 0, 0, 0.25)"
    >
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
          class="w-full h-9 px-2.5 text-[13px] border border-gold-edge rounded-sm text-ink"
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
          <div class="w-2 h-2 rounded-full bg-gold shrink-0" />
          <span class="flex-1 truncate">{{ draft?.name ?? "No active list" }}</span>
          <Pill tone="gold">ACTIVE</Pill>
        </div>
      </div>

      <!-- Price preview -->
      <div v-if="loadingCapture" class="text-[11px] text-ink-muted text-center py-2">
        Reading prices…
      </div>
      <div
        v-else-if="capture && capture.aggregates.sampleSize > 0"
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
        class="text-[10px] text-ink-muted -mt-1"
      >
        {{ capture.aggregates.sampleSize }} listings captured · dominant currency:
        {{ capture.aggregates.currency }}
      </p>
      <p v-else-if="!loadingCapture" class="text-[10px] text-ink-muted">
        No price data — saving name only.
      </p>

      <!-- Actions -->
      <div class="flex gap-2 mt-1">
        <BtnGhost label="Cancel" :full="true" size="md" @click="ui.closeSaveModal()" />
        <BtnGold
          label="Save"
          :disabled="!itemName.trim() || !draft || saving"
          @click="handleSave"
        />
      </div>
    </div>
  </div>
</template>
