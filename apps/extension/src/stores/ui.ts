import { defineStore } from "pinia";
import { ref } from "vue";

export type PanelView = { type: "detail"; draftId: string };

export const useUiStore = defineStore("ui", () => {
  const currentView = ref<PanelView>({ type: "detail", draftId: "" });
  const registerModalOpen = ref(false);
  const registerListId = ref<string | null>(null);
  const registerTitle = ref("");
  const settingsOpen = ref(false);
  const exportSheetOpen = ref(false);
  const importSheetOpen = ref(false);

  function openDetail(draftId: string): void {
    currentView.value = { type: "detail", draftId };
  }

  function closeDetail() {}

  function openRegisterModal(listId: string, title = "") {
    registerListId.value = listId;
    registerTitle.value = title;
    registerModalOpen.value = true;
  }

  function closeRegisterModal() {
    registerModalOpen.value = false;
    registerListId.value = null;
    registerTitle.value = "";
  }

  // Retained as a small shared overlay hook for the existing settings component.
  function toggleSettings() {
    settingsOpen.value = !settingsOpen.value;
  }

  function openImportSheet() {
    importSheetOpen.value = true;
  }

  function openExportSheet() {
    exportSheetOpen.value = true;
  }

  function closeExportSheet() {
    exportSheetOpen.value = false;
  }

  function closeImportSheet() {
    importSheetOpen.value = false;
  }

  return {
    currentView,
    openDetail,
    closeDetail,
    registerModalOpen,
    registerListId,
    registerTitle,
    settingsOpen,
    toggleSettings,
    openRegisterModal,
    closeRegisterModal,
    openExportSheet,
    closeExportSheet,
    openImportSheet,
    closeImportSheet,
    exportSheetOpen,
    importSheetOpen,
  };
});
