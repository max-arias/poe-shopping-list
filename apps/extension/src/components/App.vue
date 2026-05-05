<script setup lang="ts">
import { computed, watchEffect, watch, ref, onMounted, onBeforeUnmount } from "vue";
import { useUiStore } from "../stores/ui";
import { useSettings } from "../composables/useSettings";
import { useDraftList } from "../composables/useDraftList";
import { storage } from "wxt/utils/storage";
import ChromeBar from "./layout/ChromeBar.vue";
import MineTab from "./mine/MineTab.vue";
import HistoryTab from "./history/HistoryTab.vue";
import DetailPanel from "./detail/DetailPanel.vue";
import SaveModal from "./mine/SaveModal.vue";
import EditItemSheet from "./mine/EditItemSheet.vue";
import ExportSheet from "./mine/ExportSheet.vue";
import ImportSheet from "./mine/ImportSheet.vue";
import SettingsPopover from "./settings/SettingsPopover.vue";
import CaptureUnavailableBanner from "./shared/CaptureUnavailableBanner.vue";

const ui = useUiStore();
const { settings } = useSettings();
const { drafts, isLoaded } = useDraftList();

const triggerSaveSearch = storage.defineItem<number>("local:triggerSaveSearch", {
  fallback: 0,
});
const pendingTrigger = ref(0);

watch([isLoaded, pendingTrigger], ([loaded, trigger]) => {
  if (!loaded || !trigger) return;
  pendingTrigger.value = 0;
  triggerSaveSearch.setValue(0); // clear the storage trigger

  if (drafts.value.length > 0) {
    // Open the most recent draft's detail and the save modal
    ui.openDetail(drafts.value[0].id);
    ui.openSaveModal();
  } else {
    // No lists yet — prompt the user to create one
    ui.autoCreateList = true;
  }
});

onMounted(async () => {
  // Pick up a trigger that was set before the sidepanel mounted
  const current = await triggerSaveSearch.getValue();
  if (current) pendingTrigger.value = current;

  const unwatch = triggerSaveSearch.watch((val) => {
    if (val) pendingTrigger.value = val;
  });
  onBeforeUnmount(unwatch);
});

watch(
  isLoaded,
  async (loaded) => {
    if (!loaded) return;
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        const url = tab.url;
        const match = drafts.value.find((d) => {
          if (d.buildUrl && url.startsWith(d.buildUrl)) return true;
          if (d.associatedUrls?.some((u) => url.startsWith(u))) return true;
          return false;
        });
        if (match) ui.openDetail(match.id);
      }
    } catch {}
  },
  { once: true },
);

const resolvedTheme = computed(() => {
  if (settings.value.theme === "dark") return "dark";
  if (settings.value.theme === "light") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
});

watchEffect(() => {
  document.documentElement.setAttribute("data-theme", resolvedTheme.value);
});
</script>

<template>
  <div class="h-full flex flex-col bg-bg text-ink font-sans overflow-hidden relative">
    <!-- Top chrome -->
    <ChromeBar @open-settings="ui.toggleSettings()" />

    <!-- Tab bar -->
    <div v-if="ui.currentView.type === 'tabs'" class="flex border-b border-stroke shrink-0">
      <button
        @click="ui.setTab('mine')"
        class="flex-1 py-1.5 text-[11px] font-semibold uppercase tracking-[0.5px] cursor-pointer bg-transparent border-0 transition-colors"
        :class="
          ui.activeTab === 'mine'
            ? 'text-gold-ink-str border-b-2 border-gold'
            : 'text-ink-muted hover:text-ink'
        "
      >
        My Lists
      </button>
      <button
        @click="ui.setTab('history')"
        class="flex-1 py-1.5 text-[11px] font-semibold uppercase tracking-[0.5px] cursor-pointer bg-transparent border-0 transition-colors"
        :class="
          ui.activeTab === 'history'
            ? 'text-gold-ink-str border-b-2 border-gold'
            : 'text-ink-muted hover:text-ink'
        "
      >
        History
      </button>
    </div>

    <!-- Capture unavailable banner -->
    <CaptureUnavailableBanner v-if="ui.captureUnavailable" />

    <!-- Detail panel -->
    <DetailPanel v-if="ui.currentView.type === 'detail'" />

    <!-- Tabs view -->
    <template v-else>
      <MineTab v-if="ui.activeTab === 'mine'" />
      <HistoryTab v-else />
    </template>

    <!-- Overlays -->
    <SaveModal v-if="ui.saveModalOpen" />
    <EditItemSheet v-if="ui.editSheetItemId" />
    <ExportSheet v-if="ui.exportSheetOpen" />
    <ImportSheet v-if="ui.importSheetOpen" />
    <SettingsPopover v-if="ui.settingsOpen" />
  </div>
</template>
