<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useDraftList } from "../../composables/useDraftList";
import { useFocusTrap } from "../../composables/useFocusTrap";
import { exportDraft } from "../../composables/useImportExport";
import { useUiStore } from "../../stores/ui";

const ui = useUiStore();
const { draft } = useDraftList();

const encoded = computed(() => (draft.value ? exportDraft(draft.value) : ""));
const copied = ref(false);

const dialogRef = ref<HTMLElement | null>(null);
const { activate, deactivate } = useFocusTrap(dialogRef);
onMounted(activate);
onBeforeUnmount(deactivate);

async function copyToClipboard() {
  if (!encoded.value) return;
  try {
    await navigator.clipboard.writeText(encoded.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    // Fallback: select the textarea
    const el = document.querySelector<HTMLTextAreaElement>("[data-export-textarea]");
    el?.select();
  }
}
</script>

<template>
  <div
    ref="dialogRef"
    class="absolute inset-0 bg-black/50 flex items-end z-20"
    role="dialog"
    aria-modal="true"
    @keydown.escape="ui.closeExportSheet()"
    @click.self="ui.closeExportSheet()"
  >
    <div
      class="w-full bg-bg border-t-2 border-accent flex flex-col gap-3 p-3.5 pb-3 max-h-[90%] overflow-auto"
    >
      <div class="flex items-center shrink-0">
        <p class="text-[13px] font-semibold text-ink">Export list</p>
        <div class="flex-1" />
        <button
          @click="ui.closeExportSheet()"
          class="text-ink-muted text-base cursor-pointer bg-transparent border-0"
          aria-label="Close export list"
        >
          ✕
        </button>
      </div>

      <p class="text-[11px] text-ink-muted">
        Copy this share code and send it. Recipients can paste it into the extension to recreate
        your list.
      </p>

      <UTextarea
        data-export-textarea
        readonly
        :value="encoded"
        aria-label="List share code"
        class="w-full"
        :rows="4"
        @click="($event.target as HTMLTextAreaElement).select()"
      />

      <div class="flex gap-2">
        <UButton
          label="Cancel"
          color="neutral"
          variant="outline"
          block
          size="md"
          @click="ui.closeExportSheet()"
        />
        <UButton
          :label="copied ? 'Copied!' : 'Copy to clipboard'"
          color="primary"
          block
          @click="copyToClipboard"
        />
      </div>
    </div>
  </div>
</template>
