<script setup lang="ts">
import { computed, ref } from "vue";
import { useDraftList } from "../../composables/useDraftList";
import { useUiStore } from "../../stores/ui";
import ItemRow from "./ItemRow.vue";
import OverviewMarkdown from "./OverviewMarkdown.vue";

const {
  drafts,
  isLoaded,
  createDraft,
  updateDraftOverview,
  reorderDraftItems,
  reorderRootDraftItems,
  createGroup,
  removeGroup,
  renameGroup,
  moveItemById,
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
const notesDraft = ref("");
const notesSaving = ref(false);
const draggedItemId = ref<string | null>(null);
const newGroupTitle = ref("");

const expanded = computed(
  () => drafts.value.find((draft) => draft.id === expandedId.value) ?? null,
);

function selectList(id: string) {
  expandedId.value = expandedId.value === id ? null : id;
  if (expandedId.value !== id) editingListId.value = null;
  if (expandedId.value) ui.openDetail(expandedId.value);
}

function toggleEditItems(listId: string) {
  if (editingListId.value === listId) {
    void finishEditingList(listId);
    return;
  }
  const draft = drafts.value.find((value) => value.id === listId);
  if (!draft) return;
  notesDraft.value = draft.overview ?? "";
  editingListId.value = listId;
  ui.openDetail(listId);
}

async function saveNotes(listId: string) {
  if (notesSaving.value) return;
  notesSaving.value = true;
  ui.openDetail(listId);
  try {
    await updateDraftOverview(listId, notesDraft.value);
  } finally {
    notesSaving.value = false;
  }
}

async function finishEditingList(listId: string) {
  await saveNotes(listId);
  editingListId.value = null;
}

function groupTargets(draft: (typeof drafts.value)[number]) {
  return draft.groups
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((group) => ({ id: group.id, label: group.title || "Unnamed group" }));
}

async function addGroup(draftId: string) {
  const name = newGroupTitle.value.trim();
  if (!name) return;
  await createGroup(draftId, name);
  newGroupTitle.value = "";
}

async function deleteGroup(draftId: string, groupId: string) {
  await removeGroup(draftId, groupId);
}

function openCreate() {
  form.value = "create";
  formListId.value = null;
  title.value = "";
  overview.value = "";
}

function closeFooterMenu(event: Event) {
  const menu = (event.currentTarget as HTMLElement).closest("details");
  if (menu) menu.open = false;
}

function openImportFromMenu(event: Event) {
  closeFooterMenu(event);
  ui.openImportSheet();
}

function openSettingsFromMenu(event: Event) {
  closeFooterMenu(event);
  ui.toggleSettings();
}

function openRename(draft: (typeof drafts.value)[number]) {
  form.value = "rename";
  formListId.value = draft.id;
  title.value = draft.title;
  overview.value = draft.overview ?? "";
}

function listActions(draft: (typeof drafts.value)[number]) {
  return [
    [
      { label: "Rename list", onSelect: () => openRename(draft) },
      {
        label: "Export JSON",
        onSelect: () => {
          ui.openExportSheet();
          ui.openDetail(draft.id);
        },
      },
      {
        label: "Delete list",
        color: "error" as const,
        onSelect: () => {
          deleteId.value = draft.id;
        },
      },
    ],
  ];
}

function closeForm() {
  form.value = null;
  formListId.value = null;
  title.value = "";
  overview.value = "";
}

function handleFormOpen(open: boolean) {
  if (!open) closeForm();
}

function handleDeleteOpen(open: boolean) {
  if (!open) deleteId.value = null;
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
  const group = list.groups.find((candidate) => candidate.items.some((item) => item.id === itemId));
  if (!group) return;
  const items = group.items.slice().sort((a, b) => a.position - b.position);
  const index = items.findIndex((item) => item.id === itemId);
  const nextIndex = direction === "earlier" ? index - 1 : index + 1;
  if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return;
  [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
  await reorderDraftItems(
    listId,
    group.id,
    items.map((item) => item.id),
  );
}

async function moveRootItem(listId: string, itemId: string, direction: "earlier" | "later") {
  const list = drafts.value.find((draft) => draft.id === listId);
  if (!list) return;
  const items = list.items.slice().sort((a, b) => a.position - b.position);
  const index = items.findIndex((item) => item.id === itemId);
  const nextIndex = direction === "earlier" ? index - 1 : index + 1;
  if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return;
  [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
  await reorderRootDraftItems(
    listId,
    items.map((item) => item.id),
  );
}

async function dropRootItem(listId: string, targetItemId: string) {
  const sourceItemId = draggedItemId.value;
  draggedItemId.value = null;
  if (!sourceItemId || sourceItemId === targetItemId) return;
  const list = drafts.value.find((draft) => draft.id === listId);
  if (!list) return;
  const items = list.items.slice().sort((a, b) => a.position - b.position);
  const sourceIndex = items.findIndex((item) => item.id === sourceItemId);
  const targetIndex = items.findIndex((item) => item.id === targetItemId);
  if (sourceIndex < 0 || targetIndex < 0) return;
  const [source] = items.splice(sourceIndex, 1);
  items.splice(targetIndex, 0, source);
  await reorderRootDraftItems(
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
  const group = list.groups.find((candidate) =>
    candidate.items.some((item) => item.id === sourceItemId),
  );
  if (!group) return;
  const items = group.items.slice().sort((a, b) => a.position - b.position);
  const sourceIndex = items.findIndex((item) => item.id === sourceItemId);
  if (sourceIndex < 0) return;
  const [source] = items.splice(sourceIndex, 1);
  const targetIndex = items.findIndex((item) => item.id === targetItemId);
  if (targetIndex < 0) return;
  items.splice(targetIndex, 0, source);
  await reorderDraftItems(
    listId,
    group.id,
    items.map((item) => item.id),
  );
}

async function editGroup(listId: string, groupId: string, title: string) {
  if (title.trim()) await renameGroup(listId, groupId, title);
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

async function moveItemTo(listId: string, itemId: string, groupId: string | null) {
  await moveItemById(listId, itemId, groupId);
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
    <main
      class="mine-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-2.5"
      aria-label="Shopping lists"
      :aria-busy="!isLoaded"
    >
      <div v-if="!isLoaded" class="trade-bench-loading" aria-label="Loading lists">
        <div v-for="row in 4" :key="row" class="trade-bench-skeleton-row">
          <span class="trade-bench-skeleton-dot" aria-hidden="true" />
          <span class="trade-bench-skeleton-line" aria-hidden="true" />
          <span class="trade-bench-skeleton-menu" aria-hidden="true" />
        </div>
      </div>
      <div
        v-else-if="drafts.length === 0"
        class="flex h-full flex-col items-center justify-center gap-3 px-5 text-center"
      >
        <p class="text-[13px] font-semibold text-ink">No Lists yet</p>
        <p class="max-w-[240px] text-[11px] leading-relaxed text-ink-muted">
          Create a List for your next upgrade path, or import a Shareable List from another player.
        </p>
        <UButton label="+ Create List" color="primary" size="md" @click="openCreate" />
      </div>
      <div v-else class="border-t border-stroke" role="list" aria-label="Your Lists">
        <section v-for="draft in drafts" :key="draft.id" class="list-accordion" role="listitem">
          <div class="list-title-row relative">
            <button
              type="button"
              class="list-title-band flex min-h-12 w-full items-center gap-2 border-b border-line px-2 pr-10 text-left transition-colors hover:bg-surface-hover focus-visible:z-10 focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
              :class="expandedId === draft.id ? 'bg-accent-soft' : ''"
              :aria-expanded="expandedId === draft.id"
              :aria-controls="`list-content-${draft.id}`"
              @click="selectList(draft.id)"
            >
              <span class="min-w-0 flex-1 truncate text-[14px] font-normal text-ink">{{
                draft.title
              }}</span>
            </button>
            <UDropdownMenu
              class="absolute right-2 top-1/2 -translate-y-1/2"
              :items="listActions(draft)"
              :content="{ align: 'end' }"
            >
              <UButton
                icon="i-lucide-more-horizontal"
                color="neutral"
                variant="ghost"
                size="xs"
                :aria-label="`${draft.title} list actions`"
                @click.stop
              />
            </UDropdownMenu>
          </div>

          <div
            v-if="expandedId === draft.id"
            :id="`list-content-${draft.id}`"
            class="list-detail border-b border-accent bg-surface"
          >
            <div
              v-if="editingListId === draft.id"
              class="notes-editor border-b border-line px-2 py-2"
            >
              <div class="mb-1.5 flex items-baseline justify-between gap-2">
                <label :for="`notes-editor-${draft.id}`" class="text-[12px] font-semibold text-ink">
                  Notes
                </label>
                <span class="flex items-center gap-2 text-[10px] text-ink-muted">
                  <span v-if="notesSaving" aria-live="polite" class="notes-saving-status"
                    >Saving…</span
                  >
                  <span>Markdown supported</span>
                </span>
              </div>
              <textarea
                :id="`notes-editor-${draft.id}`"
                v-model="notesDraft"
                class="notes-editor-input w-full resize-y border border-stroke bg-bg px-2 py-1.5 text-[11px] leading-relaxed text-ink outline-none focus:border-accent"
                rows="3"
                aria-label="List notes"
                placeholder="Add notes for this list…"
              />
            </div>
            <UCollapsible
              v-else-if="draft.overview?.trim()"
              :default-open="true"
              class="overview-collapse border-b border-line px-2 py-2"
            >
              <UButton
                color="neutral"
                variant="ghost"
                class="w-full justify-between px-0 text-[12px] font-semibold"
                trailing-icon="i-lucide-chevron-down"
                >Notes</UButton
              >
              <template #content>
                <OverviewMarkdown :value="draft.overview ?? ''" />
              </template>
            </UCollapsible>

            <div role="region" aria-label="List sections">
              <div v-if="draft.items.length" class="root-items px-2">
                <ItemRow
                  v-for="(item, itemIndex) in draft.items
                    .slice()
                    .sort((a, b) => a.position - b.position)"
                  :key="item.id"
                  :item="item"
                  :is-first="itemIndex === 0"
                  :is-last="itemIndex === draft.items.length - 1"
                  :edit-mode="editingListId === draft.id"
                  :current-group-id="null"
                  :move-targets="groupTargets(draft)"
                  @toggle="toggleItem(draft.id, item.id, $event)"
                  @move="moveRootItem(draft.id, item.id, $event)"
                  @drag-start="draggedItemId = item.id"
                  @drag-end="draggedItemId = null"
                  @drop="dropRootItem(draft.id, item.id)"
                  @update="editItem(draft.id, item.id, $event)"
                  @remove="deleteItem(draft.id, item.id)"
                  @move-to="moveItemTo(draft.id, item.id, $event)"
                />
              </div>
              <div
                v-if="editingListId === draft.id"
                class="group-add-row flex gap-1.5 border-b border-stroke-soft px-2 py-2"
              >
                <input
                  v-model="newGroupTitle"
                  type="text"
                  maxlength="80"
                  placeholder="New group name"
                  aria-label="New group name"
                  class="h-7 min-w-0 flex-1 border border-stroke bg-bg px-2 text-[11px] text-ink outline-none focus:border-accent"
                  @keydown.enter.prevent="addGroup(draft.id)"
                />
                <UButton
                  label="Add group"
                  color="neutral"
                  variant="outline"
                  size="xs"
                  :disabled="!newGroupTitle.trim()"
                  @click="addGroup(draft.id)"
                />
              </div>
              <UCollapsible
                v-for="(group, groupIndex) in draft.groups
                  .slice()
                  .sort((a, b) => a.position - b.position)"
                :key="group.id"
                class="group-collapse border-b border-stroke-soft px-2 last:border-0"
                :default-open="editingListId === draft.id || groupIndex === 0"
              >
                <UButton
                  color="neutral"
                  variant="ghost"
                  class="w-full justify-between px-0 text-left text-[11px] font-semibold"
                  trailing-icon="i-lucide-chevron-down"
                  >{{ group.title || "Unnamed group" }}</UButton
                >
                <template #content>
                  <div>
                    <div v-if="editingListId === draft.id" class="mb-1.5 flex items-center gap-1">
                      <input
                        :value="group.title ?? ''"
                        type="text"
                        maxlength="80"
                        aria-label="Group name"
                        class="h-7 min-w-0 flex-1 border border-stroke bg-bg px-2 text-[10px] text-ink outline-none focus:border-accent"
                        @change="
                          editGroup(draft.id, group.id, ($event.target as HTMLInputElement).value)
                        "
                      />
                      <button
                        type="button"
                        class="group-remove-button"
                        :aria-label="`Remove ${group.title || 'group'}`"
                        @click="deleteGroup(draft.id, group.id)"
                      >
                        ×
                      </button>
                    </div>
                    <ItemRow
                      v-for="(item, itemIndex) in group.items
                        .slice()
                        .sort((a, b) => a.position - b.position)"
                      :key="item.id"
                      :item="item"
                      :is-first="itemIndex === 0"
                      :is-last="itemIndex === group.items.length - 1"
                      :edit-mode="editingListId === draft.id"
                      :current-group-id="group.id"
                      :move-targets="groupTargets(draft).filter((target) => target.id !== group.id)"
                      @toggle="toggleItem(draft.id, item.id, $event)"
                      @move="moveItem(draft.id, item.id, $event)"
                      @drag-start="draggedItemId = item.id"
                      @drag-end="draggedItemId = null"
                      @drop="dropItem(draft.id, item.id)"
                      @update="editItem(draft.id, item.id, $event)"
                      @remove="deleteItem(draft.id, item.id)"
                      @move-to="moveItemTo(draft.id, item.id, $event)"
                    />
                    <p v-if="!group.items.length" class="py-3 text-[11px] text-ink-muted">
                      No items in this section yet.
                    </p>
                  </div>
                </template>
              </UCollapsible>
            </div>

            <p
              v-if="!draft.items.length && !draft.groups.length"
              class="empty-draft px-2 py-5 text-center text-[11px] text-ink-muted"
            >
              No items saved yet. Register a trade to start this list.
            </p>

            <div class="list-action-row flex gap-2 px-2 py-3">
              <UButton
                class="list-register-button"
                label="＋ Register Current Trade"
                color="primary"
                variant="outline"
                size="sm"
                @click="ui.openRegisterModal(draft.id)"
              />
              <UButton
                class="list-edit-button"
                :label="editingListId === draft.id ? 'Done' : 'Edit list'"
                color="neutral"
                variant="ghost"
                size="sm"
                :loading="editingListId === draft.id && notesSaving"
                :disabled="editingListId === draft.id && notesSaving"
                @click="toggleEditItems(draft.id)"
              />
            </div>
          </div>
        </section>
      </div>
    </main>

    <footer class="flex shrink-0 gap-2 border-t border-stroke bg-surface px-2 py-2.5">
      <UButton class="flex-1" label="+ New List" color="primary" size="md" @click="openCreate" />
      <UDropdownMenu
        :items="[
          [
            { label: 'Import', onSelect: openImportFromMenu },
            { label: 'Settings', onSelect: openSettingsFromMenu },
          ],
        ]"
      >
        <UButton label="Menu" color="neutral" variant="ghost" size="md" />
      </UDropdownMenu>
    </footer>

    <UModal
      v-if="form"
      :open="true"
      :title="form === 'create' ? 'Create List' : 'Edit List'"
      :ui="{ content: 'bg-surface text-ink', header: 'bg-surface', body: 'bg-surface' }"
      @update:open="handleFormOpen"
    >
      <template #body>
        <form class="space-y-3" @submit.prevent="saveForm">
          <UFormField label="List title"
            ><UInput v-model="title" maxlength="80" autofocus class="w-full"
          /></UFormField>
          <UFormField label="Notes"
            ><UTextarea v-model="overview" :rows="3" autoresize class="w-full"
          /></UFormField>
          <div class="flex gap-2 pt-1">
            <UButton
              label="Cancel"
              color="neutral"
              variant="outline"
              block
              size="md"
              @click="closeForm"
            /><UButton
              label="Save"
              color="primary"
              block
              size="md"
              type="submit"
              :disabled="!title.trim() || saving"
            />
          </div>
        </form>
      </template>
    </UModal>

    <UModal
      v-if="deleteId"
      :open="true"
      title="Delete this List?"
      :ui="{ content: 'bg-surface text-ink', header: 'bg-surface', body: 'bg-surface' }"
      @update:open="handleDeleteOpen"
    >
      <template #body>
        <div class="space-y-3">
          <p class="text-[11px] text-ink-muted">
            This removes the local List and cannot be undone.
          </p>
          <div class="flex gap-2">
            <UButton
              label="Cancel"
              color="neutral"
              variant="outline"
              block
              size="md"
              @click="deleteId = null"
            /><UButton label="Delete" color="error" block size="md" @click="confirmDelete" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
