// @vitest-environment jsdom
import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import MineTab from "./MineTab.vue";
import SaveModal from "./SaveModal.vue";

const mocks = vi.hoisted(() => ({
  drafts: null as any,
  currentView: { type: "mine" as const },
  registerListId: "list-1",
  createDraft: vi.fn(),
  updateDraftOverview: vi.fn(),
  reorderDraftItems: vi.fn(),
  renameDraft: vi.fn(),
  deleteDraftById: vi.fn(),
  setComplete: vi.fn(),
  addItemToDraft: vi.fn(),
  openDetail: vi.fn(),
  openRegisterModal: vi.fn(),
  closeRegisterModal: vi.fn(),
  sendMessage: vi.fn(),
}));

vi.mock("../../composables/useDraftList", () => ({
  useDraftList: () => ({
    drafts: mocks.drafts,
    isLoaded: ref(true),
    createDraft: mocks.createDraft,
    updateDraftOverview: mocks.updateDraftOverview,
    reorderDraftItems: mocks.reorderDraftItems,
    renameDraft: mocks.renameDraft,
    deleteDraftById: mocks.deleteDraftById,
    setComplete: mocks.setComplete,
    addItemToDraft: mocks.addItemToDraft,
  }),
}));

vi.mock("../../stores/ui", () => ({
  useUiStore: () => ({
    currentView: mocks.currentView,
    registerListId: mocks.registerListId,
    openDetail: mocks.openDetail,
    openRegisterModal: mocks.openRegisterModal,
    closeRegisterModal: mocks.closeRegisterModal,
  }),
}));

vi.mock("../../utils/messages", () => ({ sendMessage: mocks.sendMessage }));

function makeDraft(items: any[] = []) {
  return {
    id: "list-1",
    title: "Upgrade List",
    overview: "Solve resistances first.",
    createdAt: 1,
    items,
  };
}

function makeItem(id: string, title: string, position: number, completed = false) {
  return {
    id,
    position,
    title,
    tradeUrl: `https://www.pathofexile.com/trade/search/Settlers?q=${title}`,
    completed,
    addedAt: 1,
  };
}

function button(wrapper: ReturnType<typeof mount>, label: string) {
  return wrapper.findAll("button").find((candidate) => candidate.text().includes(label))!;
}

describe("side-panel DOM workflows", () => {
  it("creates a List, expands its accordion, and reveals the overview", async () => {
    mocks.drafts = ref([]);
    mocks.createDraft.mockImplementation(async () => {
      const created = makeDraft();
      mocks.drafts.value = [created];
      return created;
    });
    const wrapper = mount(MineTab);

    await button(wrapper, "+ Create List").trigger("click");
    await wrapper.find("input").setValue("Frostblade essentials");
    await wrapper.find("textarea").setValue("Weapon first, then solve resistances.");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(mocks.createDraft).toHaveBeenCalledWith(
      "Frostblade essentials",
      "Weapon first, then solve resistances.",
    );
    expect(wrapper.find('[aria-expanded="true"]').text()).toContain("Upgrade List");
    await wrapper.find("summary").trigger("click");
    expect(wrapper.text()).toContain("Solve resistances first.");
  });

  it("renders completion and reorder controls and persists their actions", async () => {
    const first = makeItem("one", "First item", 0);
    const second = makeItem("two", "Second item", 1);
    mocks.drafts = ref([makeDraft([first, second])]);
    const wrapper = mount(MineTab);
    await button(wrapper, "Upgrade List").trigger("click");

    await wrapper.find('[aria-label="Mark First item complete"]').trigger("click");
    expect(mocks.setComplete).toHaveBeenCalledWith("one", true);
    await wrapper.find('[aria-label="Move Second item earlier"]').trigger("click");
    expect(mocks.reorderDraftItems).toHaveBeenCalledWith("list-1", ["two", "one"]);
  });

  it.each([
    [true, "The Pandemonius", false],
    [false, "", true],
  ])("shows Register Current Trade confirmation state", async (supported, title, disabled) => {
    mocks.drafts = ref([makeDraft()]);
    mocks.sendMessage.mockResolvedValue({
      supported,
      url: supported ? "https://www.pathofexile.com/trade/search/Settlers/test" : "",
      title,
    });
    const wrapper = mount(SaveModal);
    await flushPromises();

    expect(wrapper.text()).toContain(
      supported ? "Add this page as an incomplete List item." : "not a supported trade page",
    );
    const saveButton = button(wrapper, "Save to List");
    expect(saveButton.attributes("disabled")).toBe(disabled ? "" : undefined);
  });
});
