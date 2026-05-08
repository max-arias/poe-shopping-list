<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useDraftList } from "../../composables/useDraftList";
import { useFocusTrap } from "../../composables/useFocusTrap";
import { importDraft } from "../../composables/useImportExport";
import { useUiStore } from "../../stores/ui";
import BtnAccent from "../shared/BtnAccent.vue";
import BtnGhost from "../shared/BtnGhost.vue";

const ui = useUiStore();
const { addDraft } = useDraftList();

const input = ref("");
const error = ref("");
const importing = ref(false);

const dialogRef = ref<HTMLElement | null>(null);
const { activate, deactivate } = useFocusTrap(dialogRef);
onMounted(activate);
onBeforeUnmount(deactivate);

async function handleImport() {
  if (!input.value.trim() || importing.value) return;
  error.value = "";
  importing.value = true;

  try {
    const draft = importDraft(input.value.trim());
    await addDraft(draft);
    input.value = "";
    ui.closeImportSheet();
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : "Failed to import list";
  } finally {
    importing.value = false;
  }
}
</script>

<template>
  <div
    ref="dialogRef"
    class="absolute inset-0 bg-black/50 flex items-end z-20"
    role="dialog"
    aria-modal="true"
    @keydown.escape="ui.closeImportSheet()"
    @click.self="ui.closeImportSheet()"
  >
    <div
      class="w-full bg-bg border-t-2 border-accent flex flex-col gap-3 p-3.5 pb-3 max-h-[90%] overflow-auto shadow-panel"
    >
      <div class="flex items-center shrink-0">
        <p class="text-[13px] font-semibold text-ink">Import list</p>
        <div class="flex-1" />
        <button
          @click="ui.closeImportSheet()"
          class="text-ink-muted text-base cursor-pointer bg-transparent border-0"
        >
          ✕
        </button>
      </div>

      <p class="text-[11px] text-ink-muted">
        Paste the exported string from another user to import their list.
      </p>

      <textarea
        v-model="input"
        placeholder="Paste exported list string here…"
        aria-label="Import list string"
        class="w-full h-24 px-2.5 py-2 text-[11px] font-mono border border-stroke rounded-sm text-ink bg-bg resize-none placeholder:text-ink-muted"
        @keydown.enter.ctrl="handleImport"
      />

      <p v-if="error" class="text-[11px] text-destructive">{{ error }}</p>

      <div class="flex gap-2">
        <BtnGhost label="Cancel" :full="true" size="md" @click="ui.closeImportSheet()" />
        <BtnAccent
          label="Import"
          :full="true"
          :disabled="!input.trim() || importing"
          @click="handleImport"
        />
      </div>
    </div>
  </div>
</template>
