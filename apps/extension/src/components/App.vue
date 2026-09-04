<script setup lang="ts">
import { poeListIconOptions } from "../assets/poe/list-icons";
import { useUiStore } from "../stores/ui";
import ExportSheet from "./mine/ExportSheet.vue";
import ImportSheet from "./mine/ImportSheet.vue";
import MineTab from "./mine/MineTab.vue";
import SaveModal from "./mine/SaveModal.vue";
import SettingsPopover from "./settings/SettingsPopover.vue";

const ui = useUiStore();
</script>

<template>
  <UApp>
    <div class="relative flex h-full flex-col overflow-hidden bg-bg font-sans text-ink">
      <MineTab :list-icons="poeListIconOptions" />

      <!-- Overlays -->
      <SettingsPopover v-if="ui.settingsOpen" key="settings-popover" />
      <ExportSheet v-if="ui.exportSheetOpen" key="export-sheet" />
      <ImportSheet v-if="ui.importSheetOpen" key="import-sheet" />
      <SaveModal v-if="ui.registerModalOpen" key="register-modal" />
    </div>
  </UApp>
</template>
