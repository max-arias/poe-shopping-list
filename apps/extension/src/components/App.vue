<script setup lang="ts">
import { computed, watchEffect, watch } from "vue";
import { useUiStore } from "../stores/ui";
import { useSettings } from "../composables/useSettings";
import { useDraftList } from "../composables/useDraftList";
import ChromeBar from "./layout/ChromeBar.vue";
import TabBar from "./layout/TabBar.vue";
import MineTab from "./mine/MineTab.vue";
import FollowingTab from "./following/FollowingTab.vue";
import TrendingTab from "./trending/TrendingTab.vue";
import RecentPurchasesTab from "./purchases/RecentPurchasesTab.vue";
import DetailPanel from "./detail/DetailPanel.vue";
import SaveModal from "./mine/SaveModal.vue";
import PublishSheet from "./mine/PublishSheet.vue";
import EditItemSheet from "./mine/EditItemSheet.vue";
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
        if (match) ui.openDetail("mine", match.id);
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
    <template v-else>
      <TabBar
        :active-tab="ui.activeTab"
        :show-purchases="settings.enableRecentPurchases"
        @change="ui.setTab($event)"
      />

      <MineTab v-if="ui.activeTab === 'mine'" />
      <FollowingTab v-else-if="ui.activeTab === 'following'" />
      <TrendingTab v-else-if="ui.activeTab === 'trending'" />
      <RecentPurchasesTab v-else-if="ui.activeTab === 'purchases'" />
    </template>

    <!-- Overlays -->
    <SaveModal v-if="ui.saveModalOpen" />
    <PublishSheet v-if="ui.publishSheetOpen" />
    <EditItemSheet v-if="ui.editSheetItemId" />
    <SettingsPopover v-if="ui.settingsOpen" />
  </div>
</template>
