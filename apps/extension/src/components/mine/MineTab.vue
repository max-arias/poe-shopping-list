<script setup lang="ts">
import { computed, ref } from "vue";
import { useDraftList } from "../../composables/useDraftList";
import { useUiStore } from "../../stores/ui";
import BtnAccent from "../shared/BtnAccent.vue";
import BtnGhost from "../shared/BtnGhost.vue";
import Button from "../shared/Button.vue";
import ImportSheet from "./ImportSheet.vue";
import ExportSheet from "./ExportSheet.vue";
import ItemRow from "./ItemRow.vue";

const {
  drafts,
  isLoaded,
  createDraft,
  updateDraftOverview,
  reorderDraftItems,
  renameDraft,
  deleteDraftById,
  setComplete,
  updateItem,
  removeItem,
} = useDraftList();
const ui = useUiStore();

const expandedId = ref<string | null>(null);
const form = ref<"create" | "rename" | null>(null);
const formListId = ref<string | null>(null);
const title = ref("");
const overview = ref("");
const deleteId = ref<string | null>(null);
const saving = ref(false);
const editingListId = ref<string | null>(null);
const draggedItemId = ref<string | null>(null);

const expanded = computed(
  () => drafts.value.find((draft) => draft.id === expandedId.value) ?? null,
);

function selectList(id: string) {
  expandedId.value = expandedId.value === id ? null : id;
  if (expandedId.value !== id) editingListId.value = null;
  if (expandedId.value) ui.openDetail(expandedId.value);
}

function toggleEditItems(listId: string) {
  editingListId.value = editingListId.value === listId ? null : listId;
  ui.openDetail(listId);
}

function openCreate() {
  form.value = "create";
  formListId.value = null;
  title.value = "";
  overview.value = "";
}

function openRename(draft: (typeof drafts.value)[number]) {
  form.value = "rename";
  formListId.value = draft.id;
  title.value = draft.title;
  overview.value = draft.overview ?? "";
}

function closeForm() {
  form.value = null;
  formListId.value = null;
  title.value = "";
  overview.value = "";
}

async function saveForm() {
  if (!title.value.trim() || saving.value) return;
  saving.value = true;
  if (form.value === "create") {
    const created = await createDraft(title.value, overview.value);
    expandedId.value = created.id;
    ui.openDetail(created.id);
  } else if (formListId.value) {
    ui.openDetail(formListId.value);
    await renameDraft(title.value);
    await updateDraftOverview(formListId.value, overview.value);
  }
  saving.value = false;
  closeForm();
}

async function confirmDelete() {
  if (!deleteId.value) return;
  await deleteDraftById(deleteId.value);
  if (expandedId.value === deleteId.value) expandedId.value = null;
  deleteId.value = null;
}

async function toggleItem(listId: string, itemId: string, complete: boolean) {
  ui.openDetail(listId);
  await setComplete(itemId, complete);
}

async function moveItem(listId: string, itemId: string, direction: "earlier" | "later") {
  const list = drafts.value.find((draft) => draft.id === listId);
  if (!list) return;
  const items = list.items.slice().sort((a, b) => a.position - b.position);
  const index = items.findIndex((item) => item.id === itemId);
  const nextIndex = direction === "earlier" ? index - 1 : index + 1;
  if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return;
  [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
  await reorderDraftItems(
    listId,
    items.map((item) => item.id),
  );
}

async function dropItem(listId: string, targetItemId: string) {
  const sourceItemId = draggedItemId.value;
  draggedItemId.value = null;
  if (!sourceItemId || sourceItemId === targetItemId) return;
  const list = drafts.value.find((draft) => draft.id === listId);
  if (!list) return;
  const items = list.items.slice().sort((a, b) => a.position - b.position);
  const sourceIndex = items.findIndex((item) => item.id === sourceItemId);
  if (sourceIndex < 0) return;
  const [source] = items.splice(sourceIndex, 1);
  const targetIndex = items.findIndex((item) => item.id === targetItemId);
  if (targetIndex < 0) return;
  items.splice(targetIndex, 0, source);
  await reorderDraftItems(
    listId,
    items.map((item) => item.id),
  );
}

async function editItem(
  listId: string,
  itemId: string,
  patch: { title?: string; tradeUrl?: string },
) {
  ui.openDetail(listId);
  await updateItem(itemId, patch);
}

async function deleteItem(listId: string, itemId: string) {
  ui.openDetail(listId);
  await removeItem(itemId);
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
    <header class="flex shrink-0 items-center gap-2 border-b border-stroke bg-chrome px-3 py-2.5">
      <span class="h-3 w-3 border border-accent bg-accent" aria-hidden="true" />
      <h1 class="family-display flex-1 text-[15px] font-normal tracking-tight text-ink">
        Field Guide
      </h1>
      <span class="font-sans text-[9px] uppercase tracking-[0.14em] text-ink-muted"
        >local notes</span
      >
    </header>

    <main class="min-h-0 flex-1 overflow-auto px-3 py-3" aria-label="Shopping lists">
      <div v-if="!isLoaded" class="space-y-2" aria-label="Loading lists">
        <div v-for="row in 4" :key="row" class="h-12 border border-stroke-soft bg-surface/70" />
      </div>
      <div
        v-else-if="drafts.length === 0"
        class="flex h-full flex-col items-center justify-center gap-3 px-5 text-center"
      >
        <p class="text-[13px] font-semibold text-ink">No Lists yet</p>
        <p class="max-w-[240px] text-[11px] leading-relaxed text-ink-muted">
          Create a List for your next upgrade path, or import a Shareable List from another player.
        </p>
        <BtnAccent label="+ Create List" :full="false" size="md" @click="openCreate" />
        <BtnGhost label="↓ Import" size="md" @click="ui.openImportSheet()" />
      </div>
      <div v-else class="border-t border-stroke" role="list" aria-label="Your Lists">
        <section v-for="draft in drafts" :key="draft.id" role="listitem">
          <button
            type="button"
            class="flex min-h-12 w-full items-center gap-2 border-b border-stroke px-1 text-left transition-colors hover:bg-surface-hover focus-visible:z-10 focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
            :class="expandedId === draft.id ? 'bg-accent-soft border-accent-edge' : ''"
            :aria-expanded="expandedId === draft.id"
            :aria-controls="`list-content-${draft.id}`"
            @click="selectList(draft.id)"
          >
            <span class="font-sans text-[10px] text-accent" aria-hidden="true">§</span>
            <span class="min-w-0 flex-1 truncate text-[14px] font-normal text-ink">{{
              draft.title
            }}</span>
            <span class="font-sans text-[10px] text-ink-muted">{{ draft.items.length }}</span>
            <span class="text-lg leading-none text-accent-ink-str" aria-hidden="true">{{
              expandedId === draft.id ? "⌄" : "›"
            }}</span>
          </button>

          <div
            v-if="expandedId === draft.id"
            :id="`list-content-${draft.id}`"
            class="border-b border-accent-edge bg-white pl-3"
          >
            <details class="border-b border-stroke-soft py-3 pr-2" open>
              <summary
                class="cursor-pointer text-[12px] font-semibold text-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
              >
                Field note
              </summary>
              <p v-if="draft.overview" class="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
                {{ draft.overview }}
              </p>
              <p v-else class="mt-1.5 text-[11px] text-ink-muted">No overview added.</p>
            </details>

            <div v-if="draft.items.length" class="pr-2" role="region" aria-label="List items">
              <ItemRow
                v-for="(item, itemIndex) in draft.items
                  .slice()
                  .sort((a, b) => a.position - b.position)"
                :key="item.id"
                :item="item"
                :is-first="itemIndex === 0"
                :is-last="itemIndex === draft.items.length - 1"
                :edit-mode="editingListId === draft.id"
                @toggle="toggleItem(draft.id, item.id, $event)"
                @move="moveItem(draft.id, item.id, $event)"
                @drag-start="draggedItemId = item.id"
                @drag-end="draggedItemId = null"
                @drop="dropItem(draft.id, item.id)"
                @update="editItem(draft.id, item.id, $event)"
                @remove="deleteItem(draft.id, item.id)"
              />
            </div>
            <p v-else class="py-5 pr-2 text-center text-[11px] text-ink-muted">
              No items in this List yet.
            </p>

            <div class="grid gap-2 py-3 pr-2">
              <BtnGhost
                :label="editingListId === draft.id ? 'Done editing' : 'Edit items'"
                size="sm"
                @click="toggleEditItems(draft.id)"
              />
              <button
                type="button"
                class="h-9 border border-accent-edge bg-accent-soft text-[10px] font-semibold uppercase tracking-[0.06em] text-accent-ink-str hover:bg-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
                @click="ui.openRegisterModal(draft.id)"
              >
                ＋ Register Current Trade
              </button>
              <div class="flex gap-2">
                <BtnGhost label="List actions" :full="true" size="sm" @click="openRename(draft)" />
                <BtnGhost
                  label="Export"
                  size="sm"
                  @click="
                    ui.openExportSheet();
                    ui.openDetail(draft.id);
                  "
                />
              </div>
              <div class="flex gap-2">
                <BtnGhost label="Rename" :full="true" size="sm" @click="openRename(draft)" />
                <Button variant="destructive" :full="true" size="sm" @click="deleteId = draft.id"
                  >Delete</Button
                >
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <footer class="flex shrink-0 gap-2 border-t border-stroke bg-surface px-3 py-2.5">
      <BtnAccent class="flex-1" label="+ New List" size="md" @click="openCreate" />
      <BtnGhost label="↓ Import" size="md" @click="ui.openImportSheet()" />
    </footer>

    <div
      v-if="form"
      class="absolute inset-0 z-20 flex items-end bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="list-form-title"
      @click.self="closeForm"
      @keydown.escape="closeForm"
    >
      <form
        class="w-full space-y-3 border-t-2 border-accent bg-bg p-3.5"
        @submit.prevent="saveForm"
      >
        <h2 id="list-form-title" class="text-[13px] font-semibold text-ink">
          {{ form === "create" ? "Create List" : "Edit List" }}
        </h2>
        <label class="block text-[10px] uppercase tracking-[0.06em] text-ink-muted"
          >List title<input
            v-model="title"
            maxlength="80"
            autofocus
            class="mt-1 h-9 w-full border border-stroke bg-bg px-2.5 text-[13px] text-ink outline-none focus:border-accent"
        /></label>
        <label class="block text-[10px] uppercase tracking-[0.06em] text-ink-muted"
          >Overview
          <textarea
            v-model="overview"
            rows="3"
            class="mt-1 w-full resize-none border border-stroke bg-bg px-2.5 py-2 text-[12px] text-ink outline-none focus:border-accent"
          />
        </label>
        <div class="flex gap-2">
          <BtnGhost label="Cancel" :full="true" size="md" @click="closeForm" /><BtnAccent
            label="Save"
            :full="true"
            size="md"
            :disabled="!title.trim() || saving"
            @click="saveForm"
          />
        </div>
      </form>
    </div>

    <div
      v-if="deleteId"
      class="absolute inset-0 z-20 flex items-center justify-center bg-black/50 px-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-title"
      @click.self="deleteId = null"
      @keydown.escape="deleteId = null"
    >
      <div class="w-full max-w-[280px] space-y-3 border border-stroke bg-bg p-4">
        <h2 id="delete-title" class="text-[13px] font-semibold text-ink">Delete this List?</h2>
        <p class="text-[11px] text-ink-muted">This removes the local List and cannot be undone.</p>
        <div class="flex gap-2">
          <BtnGhost label="Cancel" :full="true" size="md" @click="deleteId = null" /><Button
            variant="destructive"
            :full="true"
            size="md"
            @click="confirmDelete"
            >Delete</Button
          >
        </div>
      </div>
    </div>
  </div>
</template>
