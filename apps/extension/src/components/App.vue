<script setup lang="ts">
import { computed, watchEffect, watch, ref, onMounted, onBeforeUnmount } from "vue";
import { useUiStore } from "../stores/ui";
import { useSettings } from "../composables/useSettings";
import { useDraftList } from "../composables/useDraftList";
import { storage } from "wxt/utils/storage";
import { sendMessage } from "../utils/messages";
import MineTab from "./mine/MineTab.vue";
import HistoryTab from "./history/HistoryTab.vue";
import DetailPanel from "./detail/DetailPanel.vue";
import SaveModal from "./mine/SaveModal.vue";
import ChooseListModal from "./mine/ChooseListModal.vue";
import EditItemSheet from "./mine/EditItemSheet.vue";
import ExportSheet from "./mine/ExportSheet.vue";
import ImportSheet from "./mine/ImportSheet.vue";
import SettingsPopover from "./settings/SettingsPopover.vue";
import CaptureUnavailableBanner from "./shared/CaptureUnavailableBanner.vue";
import Button from "./shared/Button.vue";

const ui = useUiStore();
const { settings } = useSettings();
const { drafts, isLoaded } = useDraftList();

const triggerSaveSearch = storage.defineItem<number>("local:triggerSaveSearch", {
  fallback: 0,
});
const pendingTrigger = ref(0);
let sidepanelVisibilityPort: ReturnType<typeof browser.runtime.connect> | null = null;

async function reportSidepanelVisibility(open: boolean) {
  await sendMessage("spSidepanelVisibilitySet", { open }).catch(() => {});

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return;
  }

  sidepanelVisibilityPort?.postMessage({ tabId: tab.id, open });
}

watch([isLoaded, pendingTrigger], ([loaded, trigger]) => {
  if (!loaded || !trigger) return;
  pendingTrigger.value = 0;
  triggerSaveSearch.setValue(0); // clear the storage trigger

  if (drafts.value.length > 0 && ui.currentView.type === "detail") {
    // A draft is already open — save directly to it
    ui.openSaveModal();
  } else {
    // No draft open or no lists yet — let the user choose or create one
    ui.openChooseListModal();
  }
});

onMounted(async () => {
  sidepanelVisibilityPort = browser.runtime.connect({ name: "poe-sl-sidepanel-visibility" });
  void reportSidepanelVisibility(true);

  // Pick up a trigger that was set before the sidepanel mounted
  const current = await triggerSaveSearch.getValue();
  if (current) pendingTrigger.value = current;

  const unwatch = triggerSaveSearch.watch((val) => {
    if (val) pendingTrigger.value = val;
  });

  onBeforeUnmount(() => {
    void reportSidepanelVisibility(false);
    sidepanelVisibilityPort?.disconnect();
    sidepanelVisibilityPort = null;
    unwatch();
  });
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
    <!-- Tab bar -->
    <div
      v-if="ui.currentView.type === 'tabs'"
      class="flex items-center gap-2 border-b border-stroke shrink-0 px-2"
    >
      <div role="tablist" class="flex flex-1">
        <Button
          variant="tab"
          size="tab"
          @click="ui.setTab('mine')"
          role="tab"
          :aria-selected="ui.activeTab === 'mine'"
          class="flex-1"
          :class="
            ui.activeTab === 'mine'
              ? 'text-accent-ink-str border-b-2 border-accent'
              : 'text-ink-muted hover:text-ink'
          "
        >
          My Lists
        </Button>
        <Button
          variant="tab"
          size="tab"
          @click="ui.setTab('history')"
          role="tab"
          :aria-selected="ui.activeTab === 'history'"
          class="flex-1"
          :class="
            ui.activeTab === 'history'
              ? 'text-accent-ink-str border-b-2 border-accent'
              : 'text-ink-muted hover:text-ink'
          "
        >
          History
        </Button>
      </div>
      <Button
        variant="icon"
        size="iconMd"
        @click="ui.toggleSettings()"
        title="Settings"
        aria-label="Settings"
      >
        ⚙
      </Button>
    </div>

    <!-- Capture unavailable banner -->
    <div v-if="ui.captureUnavailable" key="capture-banner">
      <CaptureUnavailableBanner />
    </div>

    <div
      v-if="ui.currentView.type === 'detail'"
      key="detail"
      class="flex-1 min-h-0 flex flex-col overflow-hidden"
    >
      <DetailPanel />
    </div>

    <div v-else key="tabs" role="tabpanel" class="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div
        v-if="ui.activeTab === 'mine'"
        key="mine"
        class="flex-1 min-h-0 flex flex-col overflow-hidden"
      >
        <MineTab />
      </div>
      <div v-else key="history" class="flex-1 min-h-0 flex flex-col overflow-hidden">
        <HistoryTab />
      </div>
    </div>

    <!-- Overlays -->
    <SaveModal v-if="ui.saveModalOpen" key="save-modal" />
    <ChooseListModal v-if="ui.chooseListModalOpen" key="choose-list-modal" />
    <EditItemSheet v-if="ui.editSheetItemId" key="edit-item-sheet" />
    <ExportSheet v-if="ui.exportSheetOpen" key="export-sheet" />
    <ImportSheet v-if="ui.importSheetOpen" key="import-sheet" />
    <SettingsPopover v-if="ui.settingsOpen" key="settings-popover" />
  </div>
</template>
