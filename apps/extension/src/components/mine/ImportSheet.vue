<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useDraftList } from "../../composables/useDraftList";
import { useFocusTrap } from "../../composables/useFocusTrap";
import { importDraft } from "../../composables/useImportExport";
import { useUiStore } from "../../stores/ui";

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
      class="w-full bg-bg border-t-2 border-accent flex flex-col gap-3 p-3.5 pb-3 max-h-[90%] overflow-auto"
    >
      <div class="flex items-center shrink-0">
        <p class="text-[13px] font-semibold text-ink">Import list</p>
        <div class="flex-1" />
        <button
          @click="ui.closeImportSheet()"
          class="text-ink-muted text-base cursor-pointer bg-transparent border-0"
          aria-label="Close import list"
        >
          ✕
        </button>
      </div>

      <p class="text-[11px] text-ink-muted">
        Paste a share code into the extension to import a list.
      </p>

      <UTextarea
        v-model="input"
        placeholder="Paste share code here…"
        aria-label="List share code"
        class="w-full"
        :rows="4"
        @keydown.enter.ctrl="handleImport"
      />

      <p v-if="error" class="text-[11px] text-destructive">{{ error }}</p>

      <div class="import-actions flex gap-2">
        <UButton
          label="Cancel"
          color="neutral"
          variant="outline"
          block
          size="md"
          @click="ui.closeImportSheet()"
        />
        <UButton
          label="Import"
          color="primary"
          block
          :disabled="!input.trim() || importing"
          @click="handleImport"
        />
      </div>
    </div>
  </div>
</template>
