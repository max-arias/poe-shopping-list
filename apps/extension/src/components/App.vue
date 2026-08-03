<script setup lang="ts">
import { useUiStore } from "../stores/ui";
import ExportSheet from "./mine/ExportSheet.vue";
import ImportSheet from "./mine/ImportSheet.vue";
import MineTab from "./mine/MineTab.vue";
import SaveModal from "./mine/SaveModal.vue";

const ui = useUiStore();
</script>

<template>
  <div
    class="h-full flex flex-col bg-bg text-ink font-sans overflow-hidden relative"
    data-theme="fieldguide"
  >
    <MineTab />

    <!-- Overlays -->
    <ExportSheet v-if="ui.exportSheetOpen" key="export-sheet" />
    <ImportSheet v-if="ui.importSheetOpen" key="import-sheet" />
    <SaveModal v-if="ui.registerModalOpen" key="register-modal" />
  </div>
</template>
