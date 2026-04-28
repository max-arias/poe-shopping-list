import { defineStore } from "pinia";
import { ref } from "vue";

export type TabId = "mine" | "following" | "trending" | "purchases";
export type PanelView =
  | { type: "tabs" }
  | { type: "detail"; source: "mine"; draftId: string }
  | { type: "detail"; source: "following"; listSlug?: string };

export const useUiStore = defineStore("ui", () => {
  const activeTab = ref<TabId>("mine");
  const currentView = ref<PanelView>({ type: "tabs" });
  const settingsOpen = ref(false);
  const saveModalOpen = ref(false);
  const publishSheetOpen = ref(false);
  const captureUnavailable = ref(false);
  const kebabOpenItemId = ref<string | null>(null);
  const pendingSaveName = ref("");
  const editSheetItemId = ref<string | null>(null);

  function setTab(tab: TabId) {
    activeTab.value = tab;
    currentView.value = { type: "tabs" };
    kebabOpenItemId.value = null;
  }

  function openDetail(source: "mine", draftId: string): void;
  function openDetail(source: "following", listSlug?: string): void;
  function openDetail(source: "mine" | "following", slugOrId?: string) {
    if (source === "mine") {
      currentView.value = { type: "detail", source: "mine", draftId: slugOrId! };
    } else {
      currentView.value = { type: "detail", source: "following", listSlug: slugOrId };
    }
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
    publishSheetOpen,
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
  };
});
