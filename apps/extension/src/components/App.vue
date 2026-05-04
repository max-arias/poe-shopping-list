<script setup lang="ts">
import { computed, watchEffect, watch } from "vue";
import { useUiStore } from "../stores/ui";
import { useSettings } from "../composables/useSettings";
import { useDraftList } from "../composables/useDraftList";
import ChromeBar from "./layout/ChromeBar.vue";
import MineTab from "./mine/MineTab.vue";
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

    <!-- Capture unavailable banner -->
    <CaptureUnavailableBanner v-if="ui.captureUnavailable" />

    <!-- Detail panel -->
    <DetailPanel v-if="ui.currentView.type === 'detail'" />

    <!-- Tabs view -->
    <MineTab v-else />

    <!-- Overlays -->
    <SaveModal v-if="ui.saveModalOpen" />
    <EditItemSheet v-if="ui.editSheetItemId" />
    <ExportSheet v-if="ui.exportSheetOpen" />
    <ImportSheet v-if="ui.importSheetOpen" />
    <SettingsPopover v-if="ui.settingsOpen" />
  </div>
</template>
