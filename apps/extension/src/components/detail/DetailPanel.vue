<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import type { ApiListDetail } from "@poe-sl/schema";
import { useUiStore } from "../../stores/ui";
import { useDraftList } from "../../composables/useDraftList";
import { useApi } from "../../composables/useApi";
import { onMessage, sendMessage } from "../../utils/messages";
import type { ChecklistEntry } from "./ChecklistView.vue";
import ChecklistView from "./ChecklistView.vue";
import ItemRow from "../mine/ItemRow.vue";
import KebabMenu from "../mine/KebabMenu.vue";
import BtnGold from "../shared/BtnGold.vue";
import BtnGhost from "../shared/BtnGhost.vue";

const ui = useUiStore();
const { draft, unmarkAll, deleteDraft, updateCapture, setBuildInfo } = useDraftList();
const { getList } = useApi();

const apiDetail = ref<ApiListDetail | null>(null);
const loading = ref(false);
const notFound = ref(false);
const fetchError = ref("");
const showDeleteConfirm = ref(false);
const showUnmarkConfirm = ref(false);
const showLinkBuild = ref(false);
const linkBuildUrl = ref("");
const linkBuildCreator = ref("");
const linkAssociatedUrls = ref<string[]>([]);
const isTradeSearchPage = ref(false);

const view = computed(() => (ui.currentView.type === "detail" ? ui.currentView : null));

const title = computed(() => {
  if (view.value?.source === "mine") return draft.value?.name ?? "My List";
  return apiDetail.value?.list.title ?? "…";
});

const followingEntries = computed<ChecklistEntry[]>(() => {
  if (view.value?.source === "following" && apiDetail.value) {
    return apiDetail.value.items.map((item) => ({
      id: item.id,
      position: item.position,
      name: item.name,
      kind: item.kind,
      base: item.base,
      priceValue: item.pick?.sampleMedian ?? null,
      priceCurrency: item.pick?.pickedPriceCurrency ?? null,
    }));
  }
  return [];
});

let removeCaptureListener: (() => void) | null = null;

onBeforeUnmount(() => {
  removeCaptureListener?.();
});

async function checkTradeSearchPage() {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const url = tab?.url ?? "";
    isTradeSearchPage.value = /pathofexile\.com\/trade2?\/search\//.test(url);
  } catch {
    isTradeSearchPage.value = false;
  }
}

onMounted(async () => {
  if (view.value?.source === "mine") {
    await checkTradeSearchPage();
    removeCaptureListener = onMessage("captureStatus", async (available, sender) => {
      if (!available || !draft.value) return;
      const tabId = sender.tab?.id;
      const tabUrl = sender.tab?.url;
      if (!tabId || !tabUrl) return;
      const match = draft.value.items.find((i) => i.tradeUrl === tabUrl);
      if (!match) return;
      const capture = await sendMessage("captureRead", undefined, tabId);
      if (capture) await updateCapture(match.id, capture);
    });
  }

  if (view.value?.source === "following" && view.value.listSlug) {
    loading.value = true;
    try {
      apiDetail.value = await getList(view.value.listSlug);
    } catch (e: any) {
      if (e?.status === 410 || e?.status === 404) notFound.value = true;
      else fetchError.value = "Failed to load list.";
    } finally {
      loading.value = false;
    }
  }
});

async function openSaveModal() {
  let name = "";
  try {
    const res = await browser.runtime.sendMessage({ type: "search-bar:get" });
    name = res?.text ?? "";
  } catch {}
  ui.openSaveModal(name);
}

async function confirmDelete() {
  await deleteDraft();
  showDeleteConfirm.value = false;
  ui.closeDetail();
}

async function confirmUnmark() {
  await unmarkAll();
  showUnmarkConfirm.value = false;
}

function openLinkBuild() {
  linkBuildUrl.value = draft.value?.buildUrl ?? "";
  linkBuildCreator.value = draft.value?.buildCreator ?? "";
  linkAssociatedUrls.value = draft.value?.associatedUrls ? [...draft.value.associatedUrls] : [];
  showLinkBuild.value = true;
}

async function saveLinkBuild() {
  const extras = linkAssociatedUrls.value.filter((u) => u.trim() !== "");
  await setBuildInfo(
    linkBuildUrl.value,
    linkBuildCreator.value,
    extras.length > 0 ? extras : undefined,
  );
  showLinkBuild.value = false;
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
    <!-- Header -->
    <div class="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-stroke">
      <button
        @click="ui.closeDetail()"
        class="text-ink-muted text-base cursor-pointer bg-transparent border-0 leading-none px-0.5"
      >
        ←
      </button>
      <p class="text-[13px] font-semibold text-ink flex-1 truncate">{{ title }}</p>
    </div>

    <!-- Mine detail -->
    <template v-if="view?.source === 'mine'">
      <div class="flex-1 overflow-auto relative" @click="ui.closeKebab()">
        <div v-for="item in draft?.items ?? []" :key="item.id" class="relative" @click.stop>
          <ItemRow :item="item" />
          <KebabMenu v-if="ui.kebabOpenItemId === item.id" :item="item" />
        </div>

        <div
          v-if="(draft?.items ?? []).length === 0"
          class="flex flex-col items-center gap-3 py-8 text-center px-5"
        >
          <p class="text-[12px] text-ink-muted">No items yet.</p>
          <p class="text-[11px] text-ink-muted max-w-[200px] leading-relaxed">
            Go to pathofexile.com/trade, run a search, then tap <strong>Save This Search</strong>.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="shrink-0 px-3 py-2.5 border-t border-stroke bg-surface flex flex-col gap-2">
        <BtnGold label="Save This Search" :disabled="!isTradeSearchPage" @click="openSaveModal" />
        <div class="flex gap-2">
          <BtnGhost label="⋯ More" :full="true" @click="showUnmarkConfirm = true" />
          <BtnGhost
            label="Publish ▸"
            :full="true"
            :gold="true"
            :disabled="!draft?.items?.length"
            @click="ui.publishSheetOpen = true"
          />
        </div>
      </div>

      <!-- Unmark confirm -->
      <div
        v-if="showUnmarkConfirm"
        class="absolute inset-0 bg-black/50 flex items-center justify-center z-20 px-6"
        @click.self="showUnmarkConfirm = false"
      >
        <div
          class="bg-bg border border-stroke rounded-md p-4 flex flex-col gap-3 w-full max-w-[280px]"
        >
          <p class="text-[13px] font-semibold text-ink">More options</p>
          <BtnGhost
            label="↻ Unmark all items"
            :full="true"
            size="md"
            @click="
              showUnmarkConfirm = false;
              confirmUnmark();
            "
          />
          <BtnGhost
            label="🔗 Link build URL"
            :full="true"
            size="md"
            @click="
              showUnmarkConfirm = false;
              openLinkBuild();
            "
          />
          <BtnGhost
            label="🗑 Delete this list"
            :full="true"
            size="md"
            @click="
              showUnmarkConfirm = false;
              showDeleteConfirm = true;
            "
          />
          <BtnGhost label="Cancel" :full="true" size="md" @click="showUnmarkConfirm = false" />
        </div>
      </div>

      <!-- Delete confirm -->
      <div
        v-if="showDeleteConfirm"
        class="absolute inset-0 bg-black/50 flex items-center justify-center z-20 px-6"
        @click.self="showDeleteConfirm = false"
      >
        <div
          class="bg-bg border border-stroke rounded-md p-4 flex flex-col gap-3 w-full max-w-[280px]"
        >
          <p class="text-[13px] font-semibold text-ink">Delete "{{ draft?.name }}"?</p>
          <p class="text-[11px] text-ink-muted">
            {{ draft?.items.length ?? 0 }} item{{ (draft?.items.length ?? 0) !== 1 ? "s" : "" }}
            will be permanently removed. This cannot be undone.
          </p>
          <div class="flex gap-2">
            <BtnGhost label="Cancel" :full="true" size="md" @click="showDeleteConfirm = false" />
            <button
              @click="confirmDelete"
              class="flex-1 h-8 text-xs font-semibold bg-[#a8432a] text-white border-0 rounded-sm cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Link build overlay -->
      <div
        v-if="showLinkBuild"
        class="absolute inset-0 bg-black/50 flex items-center justify-center z-20 px-6"
        @click.self="showLinkBuild = false"
      >
        <div
          class="bg-bg border border-stroke rounded-md p-4 flex flex-col gap-3 w-full max-w-[280px]"
        >
          <p class="text-[13px] font-semibold text-ink">Link build URL</p>
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] text-ink-muted uppercase tracking-wide">Build URL</label>
            <input
              v-model="linkBuildUrl"
              type="url"
              placeholder="pobb.in/… or maxroll.gg/…"
              class="h-8 px-2 text-[12px] bg-bg border border-stroke rounded-sm text-ink outline-none focus:border-gold w-full"
            />
          </div>

          <!-- Associated / secondary URLs -->
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] text-ink-muted uppercase tracking-wide"
              >Additional URLs</label
            >
            <div v-for="(_, i) in linkAssociatedUrls" :key="i" class="flex gap-1.5 items-center">
              <input
                v-model="linkAssociatedUrls[i]"
                type="url"
                placeholder="https://…"
                class="flex-1 h-8 px-2 text-[12px] bg-bg border border-stroke rounded-sm text-ink outline-none focus:border-gold"
              />
              <button
                @click="linkAssociatedUrls.splice(i, 1)"
                class="w-6 h-6 flex items-center justify-center text-ink-muted hover:text-ink cursor-pointer bg-transparent border-0 shrink-0 text-base leading-none"
              >
                ✕
              </button>
            </div>
            <button
              @click="linkAssociatedUrls.push('')"
              class="self-start text-[10px] text-gold-ink-str hover:underline cursor-pointer bg-transparent border-0 px-0 py-0"
            >
              + Add another URL
            </button>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] text-ink-muted uppercase tracking-wide">Creator</label>
            <input
              v-model="linkBuildCreator"
              type="text"
              placeholder="@creator"
              class="h-8 px-2 text-[12px] bg-bg border border-stroke rounded-sm text-ink outline-none focus:border-gold w-full"
            />
          </div>
          <div class="flex gap-2">
            <BtnGhost label="Cancel" :full="true" size="md" @click="showLinkBuild = false" />
            <BtnGhost
              v-if="draft?.buildUrl"
              label="Remove"
              :full="true"
              size="md"
              @click="
                setBuildInfo('', '', undefined);
                showLinkBuild = false;
              "
            />
            <button
              @click="saveLinkBuild"
              class="flex-1 h-8 text-xs font-semibold bg-gold text-gold-ink border-0 rounded-sm cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Following detail -->
    <template v-else>
      <!-- Loading -->
      <div v-if="loading" class="flex-1 flex items-center justify-center">
        <p class="text-[12px] text-ink-muted">Loading…</p>
      </div>

      <!-- Not found -->
      <div
        v-else-if="notFound"
        class="flex-1 flex flex-col items-center justify-center gap-2 px-4 text-center"
      >
        <p class="text-[13px] font-semibold text-ink">List not found</p>
        <p class="text-[11px] text-ink-muted">This list may have been deleted.</p>
        <BtnGhost label="← Back" @click="ui.closeDetail()" />
      </div>

      <!-- Error -->
      <div v-else-if="fetchError" class="flex-1 flex items-center justify-center px-4">
        <p class="text-[12px] text-[#a8432a] text-center">{{ fetchError }}</p>
      </div>

      <!-- Checklist -->
      <ChecklistView v-else :items="followingEntries" :readonly="true" />
    </template>
  </div>
</template>
