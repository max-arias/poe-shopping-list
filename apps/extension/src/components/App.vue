<script setup lang="ts">
import { computed, watchEffect } from "vue";
import { useSettings } from "../composables/useSettings";
import { useUiStore } from "../stores/ui";
import ExportSheet from "./mine/ExportSheet.vue";
import ImportSheet from "./mine/ImportSheet.vue";
import MineTab from "./mine/MineTab.vue";
import SaveModal from "./mine/SaveModal.vue";

const ui = useUiStore();
const { settings } = useSettings();
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
    <MineTab />

    <!-- Overlays -->
    <ExportSheet v-if="ui.exportSheetOpen" key="export-sheet" />
    <ImportSheet v-if="ui.importSheetOpen" key="import-sheet" />
    <SaveModal v-if="ui.registerModalOpen" key="register-modal" />
  </div>
</template>
