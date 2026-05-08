<script setup lang="ts">
import { motion } from "motion-v";
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useUiStore } from "../../stores/ui";
import { useDraftList } from "../../composables/useDraftList";
import { useSettings } from "../../composables/useSettings";
import BtnGhost from "../shared/BtnGhost.vue";
import BtnAccent from "../shared/BtnAccent.vue";
import { useFocusTrap } from "../../composables/useFocusTrap";
import {
  buttonMotionProps,
  overlayMotionProps,
  sheetMotionProps,
  subtleButtonMotionProps,
} from "../../utils/motion";

const ui = useUiStore();
const { drafts, createDraft } = useDraftList();
const { settings } = useSettings();

const showCreateForm = ref(false);
const newName = ref("");
const creating = ref(false);

const dialogRef = ref<HTMLElement | null>(null);
const { activate, deactivate } = useFocusTrap(dialogRef);
onMounted(activate);
onBeforeUnmount(deactivate);

function selectDraft(draftId: string) {
  ui.openDetail(draftId);
  ui.closeChooseListModal();
  ui.openSaveModal();
}

async function handleCreate() {
  if (!newName.value.trim() || creating.value) return;
  creating.value = true;
  const d = await createDraft(newName.value, settings.value.league);
  creating.value = false;
  ui.openDetail(d.id);
  ui.closeChooseListModal();
  ui.openSaveModal();
}

function closeForm() {
  showCreateForm.value = false;
  newName.value = "";
}
</script>

<template>
  <motion.div
    ref="dialogRef"
    v-bind="overlayMotionProps"
    class="absolute inset-0 bg-black/50 flex items-end z-30"
    role="dialog"
    aria-modal="true"
    @keydown.escape="ui.closeChooseListModal()"
    @click.self="ui.closeChooseListModal()"
  >
    <motion.div
      v-bind="sheetMotionProps"
      class="w-full bg-bg border-t-2 border-accent flex flex-col gap-3 p-3.5 pb-3 shadow-panel"
    >
      <!-- Header -->
      <div class="flex items-center">
        <p class="text-[13px] font-semibold text-ink">Save to List</p>
        <div class="flex-1" />
        <motion.button
          @click="ui.closeChooseListModal()"
          v-bind="subtleButtonMotionProps"
          class="text-ink-muted text-base cursor-pointer bg-transparent border-0 leading-none"
        >
          ✕
        </motion.button>
      </div>

      <!-- Existing lists -->
      <div v-if="drafts.length > 0" class="flex flex-col gap-1.5 max-h-40 overflow-auto">
        <p class="text-[10px] text-ink-muted uppercase tracking-[0.6px]">Choose a list</p>
        <motion.button
          v-for="d in drafts"
          :key="d.id"
          @click="selectDraft(d.id)"
          v-bind="buttonMotionProps"
          class="flex items-center gap-2 h-9 px-2.5 border border-stroke rounded-sm text-[13px] text-ink bg-transparent cursor-pointer hover:bg-accent-soft text-left"
        >
          <div class="w-2 h-2 rounded-full bg-accent shrink-0" />
          <span class="flex-1 truncate">{{ d.name }}</span>
          <span class="text-[10px] text-ink-muted">
            {{ d.items.length }} item{{ d.items.length !== 1 ? "s" : "" }}
          </span>
        </motion.button>
      </div>

      <!-- Create new list -->
      <div class="flex flex-col gap-2">
        <p class="text-[10px] text-ink-muted uppercase tracking-[0.6px]">
          {{ drafts.length > 0 ? "Or create a new list" : "Create a new list" }}
        </p>

        <div>
          <div v-if="showCreateForm" class="flex flex-col gap-2">
              <input
                v-model="newName"
                placeholder='e.g. "RF Jugg"'
                maxlength="80"
                aria-label="List name"
                @keydown.enter="handleCreate"
                @keydown.escape="closeForm"
                class="w-full h-9 px-2.5 text-[13px] border border-accent-edge rounded-sm text-ink placeholder:text-ink-muted bg-bg outline-none focus:border-accent"
                autofocus
              />
              <div class="flex gap-2">
                <BtnGhost label="Cancel" :full="true" size="md" @click="closeForm" />
                <BtnAccent
                  label="Create & Save"
                  :disabled="!newName.trim() || creating"
                  @click="handleCreate"
                />
              </div>
          </div>
          <div v-else>
              <BtnGhost
                label="+ New List"
                :accent="true"
                :full="true"
                size="md"
                @click="showCreateForm = true"
              />
          </div>
        </div>
      </div>
    </motion.div>
  </motion.div>
</template>
