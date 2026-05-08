<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useFocusTrap } from "../../composables/useFocusTrap";
import { useUiStore } from "../../stores/ui";
import { useDraftList } from "../../composables/useDraftList";
import { onMessage, sendMessage } from "../../utils/messages";
import ItemRow from "../mine/ItemRow.vue";
import KebabMenu from "../mine/KebabMenu.vue";
import BtnAccent from "../shared/BtnAccent.vue";
import BtnGhost from "../shared/BtnGhost.vue";
import Button from "../shared/Button.vue";

const ui = useUiStore();
const { draft, unmarkAll, deleteDraft, updateCapture, setBuildInfo } = useDraftList();

const showDeleteConfirm = ref(false);
const showUnmarkConfirm = ref(false);
const showLinkBuild = ref(false);
const linkBuildUrl = ref("");
const linkBuildCreator = ref("");
const linkAssociatedUrls = ref<string[]>([]);
const isTradeSearchPage = ref(false);

const unmarkDialogRef = ref<HTMLElement | null>(null);
const deleteDialogRef = ref<HTMLElement | null>(null);
const linkDialogRef = ref<HTMLElement | null>(null);
const unmarkFocusTrap = useFocusTrap(unmarkDialogRef);
const deleteFocusTrap = useFocusTrap(deleteDialogRef);
const linkFocusTrap = useFocusTrap(linkDialogRef);

let removeCaptureListener: (() => void) | null = null;

onBeforeUnmount(() => {
  removeCaptureListener?.();
});

watch(showUnmarkConfirm, async (val) => {
  if (val) {
    await nextTick();
    unmarkFocusTrap.activate();
  } else {
    unmarkFocusTrap.deactivate();
  }
});

watch(showDeleteConfirm, async (val) => {
  if (val) {
    await nextTick();
    deleteFocusTrap.activate();
  } else {
    deleteFocusTrap.deactivate();
  }
});

watch(showLinkBuild, async (val) => {
  if (val) {
    await nextTick();
    linkFocusTrap.activate();
  } else {
    linkFocusTrap.deactivate();
  }
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
  await checkTradeSearchPage();
  removeCaptureListener = onMessage("captureStatusChanged", async (message) => {
    const { tabUrl, available } = message.data;
    if (!available || !draft.value) return;
    const match = draft.value.items.find((i) => i.tradeUrl === tabUrl);
    if (!match) return;
    const capture = await sendMessage("spCaptureRead");
    if (capture) await updateCapture(match.id, capture);
  });
});

async function openSaveModal() {
  let name = "";
  try {
    const res = await sendMessage("spSearchBarGet");
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
      <Button
        variant="plainIcon"
        size="link"
        @click="ui.closeDetail()"
        class="text-base leading-none px-0.5"
        aria-label="Back"
      >
        ←
      </Button>
      <p class="text-[13px] font-semibold text-ink flex-1 truncate">
        {{ draft?.name ?? "My List" }}
      </p>
      <Button
        variant="icon"
        size="iconMd"
        @click="ui.toggleSettings()"
        title="Settings"
        aria-label="Settings"
      >
        ⚙
      </Button>
    </div>

    <!-- Items -->
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
      <BtnAccent label="Save This Search" :disabled="!isTradeSearchPage" @click="openSaveModal" />
      <div class="flex gap-2">
        <BtnGhost
          label="⋯ More"
          :full="true"
          aria-label="More options"
          @click="showUnmarkConfirm = true"
        />
      </div>
    </div>

    <!-- Unmark confirm -->
    <div
      v-if="showUnmarkConfirm"
      key="unmark-confirm"
      ref="unmarkDialogRef"
      class="absolute inset-0 bg-black/50 flex items-center justify-center z-20 px-6"
      role="dialog"
      aria-modal="true"
      @keydown.escape="showUnmarkConfirm = false"
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
          label="↗ Link build URL"
          :full="true"
          size="md"
          @click="
            showUnmarkConfirm = false;
            openLinkBuild();
          "
        />
        <BtnGhost
          label="✕ Delete this list"
          :full="true"
          size="md"
          class="text-destructive"
          @click="
            showUnmarkConfirm = false;
            showDeleteConfirm = true;
          "
        />
        <BtnGhost
          label="↑ Export list"
          :full="true"
          size="md"
          @click="
            showUnmarkConfirm = false;
            ui.openExportSheet();
          "
        />
        <BtnGhost
          label="↓ Import list"
          :full="true"
          size="md"
          @click="
            showUnmarkConfirm = false;
            ui.openImportSheet();
          "
        />
        <BtnGhost label="Cancel" :full="true" size="md" @click="showUnmarkConfirm = false" />
      </div>
    </div>

    <!-- Delete confirm -->
    <div
      v-if="showDeleteConfirm"
      key="delete-confirm"
      ref="deleteDialogRef"
      class="absolute inset-0 bg-black/50 flex items-center justify-center z-20 px-6"
      role="dialog"
      aria-modal="true"
      @keydown.escape="showDeleteConfirm = false"
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
          <Button variant="destructive" :full="true" size="md" @click="confirmDelete">
            Delete
          </Button>
        </div>
      </div>
    </div>

    <!-- Link build overlay -->
    <div
      v-if="showLinkBuild"
      key="link-build"
      ref="linkDialogRef"
      class="absolute inset-0 bg-black/50 flex items-center justify-center z-20 px-6"
      role="dialog"
      aria-modal="true"
      @keydown.escape="showLinkBuild = false"
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
            aria-label="Build URL"
            class="h-8 px-2 text-[12px] bg-bg border border-stroke rounded-sm text-ink outline-none focus:border-accent w-full"
          />
        </div>

        <!-- Associated / secondary URLs -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] text-ink-muted uppercase tracking-wide">Additional URLs</label>
          <div v-for="(_, i) in linkAssociatedUrls" :key="i" class="flex gap-1.5 items-center">
            <input
              v-model="linkAssociatedUrls[i]"
              type="url"
              placeholder="https://…"
              aria-label="Additional URL"
              class="flex-1 h-8 px-2 text-[12px] bg-bg border border-stroke rounded-sm text-ink outline-none focus:border-accent"
            />
            <Button
              variant="plainIcon"
              size="iconSm"
              @click="linkAssociatedUrls.splice(i, 1)"
              aria-label="Remove URL"
            >
              ✕
            </Button>
          </div>
          <Button
            variant="link"
            size="link"
            @click="linkAssociatedUrls.push('')"
            class="self-start"
          >
            + Add another URL
          </Button>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] text-ink-muted uppercase tracking-wide">Creator</label>
          <input
            v-model="linkBuildCreator"
            type="text"
            placeholder="@creator"
            aria-label="Creator name"
            class="h-8 px-2 text-[12px] bg-bg border border-stroke rounded-sm text-ink outline-none focus:border-accent w-full"
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
          <BtnAccent label="Save" :full="true" size="md" @click="saveLinkBuild" />
        </div>
      </div>
    </div>
  </div>
</template>
