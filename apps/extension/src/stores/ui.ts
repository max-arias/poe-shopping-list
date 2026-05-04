import { defineStore } from "pinia";
import { ref } from "vue";

export type TabId = "mine";
export type PanelView = { type: "tabs" } | { type: "detail"; draftId: string };

export const useUiStore = defineStore("ui", () => {
  const activeTab = ref<TabId>("mine");
  const currentView = ref<PanelView>({ type: "tabs" });
  const settingsOpen = ref(false);
  const saveModalOpen = ref(false);
  const captureUnavailable = ref(false);
  const kebabOpenItemId = ref<string | null>(null);
  const pendingSaveName = ref("");
  const editSheetItemId = ref<string | null>(null);
  const exportSheetOpen = ref(false);
  const importSheetOpen = ref(false);

  function setTab(tab: TabId) {
    activeTab.value = tab;
    currentView.value = { type: "tabs" };
    kebabOpenItemId.value = null;
  }

  function openDetail(draftId: string): void {
    currentView.value = { type: "detail", draftId };
  }

  function closeDetail() {
    currentView.value = { type: "tabs" };
  }

  function toggleSettings() {
    settingsOpen.value = !settingsOpen.value;
  }

  function openSaveModal(prefillName = "") {
    pendingSaveName.value = prefillName;
    saveModalOpen.value = true;
  }

  function closeSaveModal() {
    saveModalOpen.value = false;
    pendingSaveName.value = "";
  }

  function openEditSheet(itemId: string) {
    editSheetItemId.value = itemId;
    kebabOpenItemId.value = null;
  }

  function closeEditSheet() {
    editSheetItemId.value = null;
  }

  function toggleKebab(itemId: string) {
    kebabOpenItemId.value = kebabOpenItemId.value === itemId ? null : itemId;
  }

  function closeKebab() {
    kebabOpenItemId.value = null;
  }

  return {
    activeTab,
    currentView,
    settingsOpen,
    saveModalOpen,
    captureUnavailable,
    kebabOpenItemId,
    pendingSaveName,
    setTab,
    openDetail,
    closeDetail,
    toggleSettings,
    openSaveModal,
    closeSaveModal,
    editSheetItemId,
    openEditSheet,
    closeEditSheet,
    toggleKebab,
    closeKebab,
    exportSheetOpen,
    importSheetOpen,
  };
});
