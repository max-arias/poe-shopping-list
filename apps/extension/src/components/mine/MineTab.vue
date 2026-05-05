<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useDraftList } from "../../composables/useDraftList";
import { useSettings } from "../../composables/useSettings";
import { useUiStore } from "../../stores/ui";
import EmptyMine from "./EmptyMine.vue";
import MineListRow from "./MineListRow.vue";
import BtnGhost from "../shared/BtnGhost.vue";
import BtnAccent from "../shared/BtnAccent.vue";
import { useFocusTrap } from "../../composables/useFocusTrap";

const { drafts, isLoaded, createDraft, deleteDraftById } = useDraftList();
const { settings } = useSettings();
const ui = useUiStore();

const showNewForm = ref(false);
const newName = ref("");
const newPrimaryUrl = ref("");
const newExtraUrls = ref<string[]>([]);
const newCreator = ref("");
const creating = ref(false);
const deletingId = ref<string | null>(null);

const deleteDialogRef = ref<HTMLElement | null>(null);
const { activate, deactivate } = useFocusTrap(deleteDialogRef);
watch(deletingId, (val) => {
  if (val) {
    nextTick(activate);
  } else {
    deactivate();
  }
});

const deletingDraft = computed(() => drafts.value.find((d) => d.id === deletingId.value) ?? null);

const allNewUrls = computed(() =>
  [newPrimaryUrl.value, ...newExtraUrls.value].filter((u) => u.trim() !== ""),
);

function addExtraUrl() {
  newExtraUrls.value.push("");
}

function removeExtraUrl(i: number) {
  newExtraUrls.value.splice(i, 1);
}

async function getCurrentTabUrl(): Promise<string> {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const url = tab?.url ?? "";
    // Trade site URLs aren't build guides — don't auto-fill them
    if (/pathofexile\.com\/trade/.test(url)) return "";
    return url;
  } catch {}
  return "";
}

onMounted(async () => {
  newPrimaryUrl.value = await getCurrentTabUrl();
});

function openNewForm() {
  showNewForm.value = true;
}

function closeNewForm() {
  showNewForm.value = false;
  newName.value = "";
  newPrimaryUrl.value = "";
  newExtraUrls.value = [];
  newCreator.value = "";
}

async function handleCreate() {
  if (!newName.value.trim() || creating.value) return;
  creating.value = true;
  const urls = allNewUrls.value;
  const mainUrl = urls[0] || undefined;
  const secondaryUrls = urls.length > 1 ? urls.slice(1) : undefined;
  const d = await createDraft(
    newName.value,
    settings.value.league,
    mainUrl,
    newCreator.value.trim() || undefined,
    secondaryUrls,
  );
  creating.value = false;
  closeNewForm();
  ui.openDetail(d.id);
}

async function confirmDelete() {
  if (!deletingId.value) return;
  await deleteDraftById(deletingId.value);
  deletingId.value = null;
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 overflow-hidden relative">
    <template v-if="!isLoaded" />
    <EmptyMine v-else-if="drafts.length === 0" />
    <template v-else>
      <div class="flex-1 overflow-auto" @click="deletingId = null">
        <MineListRow v-for="d in drafts" :key="d.id" :draft="d" @delete="deletingId = d.id" />
      </div>

      <!-- Delete confirm overlay -->
      <div
        v-if="deletingId"
        ref="deleteDialogRef"
        role="dialog"
        aria-modal="true"
        class="absolute inset-0 bg-black/50 flex items-center justify-center z-20 px-6"
        @click.self="deletingId = null"
      >
        <div
          class="bg-bg border border-stroke rounded-md p-4 flex flex-col gap-3 w-full max-w-[280px]"
        >
          <p class="text-[13px] font-semibold text-ink">Delete "{{ deletingDraft?.name }}"?</p>
          <p class="text-[11px] text-ink-muted">
            {{ deletingDraft?.items.length ?? 0 }} item{{
              (deletingDraft?.items.length ?? 0) !== 1 ? "s" : ""
            }}
            will be permanently removed. This cannot be undone.
          </p>
          <div class="flex gap-2">
            <BtnGhost label="Cancel" :full="true" size="md" @click="deletingId = null" />
            <button
              @click="confirmDelete"
              aria-label="Delete list"
              class="flex-1 h-8 text-xs font-semibold bg-destructive text-destructive-ink border-0 rounded-sm cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Footer: + New List -->
      <div class="shrink-0 px-3 py-2.5 border-t border-stroke bg-surface">
        <!-- Expanded create form -->
        <div v-if="showNewForm" class="flex flex-col gap-2">
          <!-- Name row -->
          <input
            v-model="newName"
            placeholder='e.g. "RF Jugg"'
            maxlength="80"
            aria-label="List name"
            @keydown.escape="closeNewForm"
            class="w-full h-8 px-2.5 text-xs border border-stroke rounded-sm text-ink placeholder:text-ink-muted bg-bg outline-none focus:border-accent"
            autofocus
          />

          <!-- Primary URL (optional) -->
          <input
            v-model="newPrimaryUrl"
            placeholder="Build / Guide URL (optional)"
            aria-label="Build or guide URL"
            @keydown.escape="closeNewForm"
            class="w-full h-8 px-2.5 text-xs border border-stroke rounded-sm text-ink placeholder:text-ink-muted bg-bg outline-none focus:border-accent"
          />

          <!-- Extra URLs -->
          <div v-for="(_, i) in newExtraUrls" :key="i" class="flex gap-1.5 items-center">
            <input
              v-model="newExtraUrls[i]"
              placeholder="Additional URL…"
              aria-label="Additional URL"
              @keydown.escape="closeNewForm"
              class="flex-1 h-8 px-2.5 text-xs border border-stroke rounded-sm text-ink placeholder:text-ink-muted bg-bg outline-none focus:border-accent"
            />
            <button
              @click="removeExtraUrl(i)"
              class="w-6 h-6 flex items-center justify-center text-ink-muted hover:text-ink cursor-pointer bg-transparent border-0 shrink-0 text-base leading-none"
              title="Remove URL"
            >
              ✕
            </button>
          </div>

          <button
            @click="addExtraUrl"
            class="self-start text-[10px] text-accent-ink-str hover:underline cursor-pointer bg-transparent border-0 px-0 py-0"
          >
            + Add another URL
          </button>

          <!-- Creator -->
          <input
            v-model="newCreator"
            placeholder="Creator name…"
            maxlength="80"
            aria-label="Creator name"
            @keydown.enter="handleCreate"
            @keydown.escape="closeNewForm"
            class="w-full h-8 px-2.5 text-xs border border-stroke rounded-sm text-ink placeholder:text-ink-muted bg-bg outline-none focus:border-accent"
          />

          <!-- Actions -->
          <div class="flex gap-2">
            <BtnGhost label="Cancel" :full="true" size="sm" @click="closeNewForm" />
            <BtnAccent
              label="Create"
              size="sm"
              :full="true"
              :disabled="!newName.trim() || creating"
              @click="handleCreate"
            />
          </div>
        </div>

        <BtnAccent v-else label="+ New List" size="md" @click="openNewForm" />
        <BtnGhost
          v-if="!showNewForm"
          label="↓ Import"
          size="md"
          class="ml-2"
          @click="ui.importSheetOpen = true"
        />
      </div>
    </template>
  </div>
</template>
