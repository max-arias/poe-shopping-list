<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useUiStore } from "../../stores/ui";
import { useDraftList } from "../../composables/useDraftList";
import { exportDraft } from "../../composables/useImportExport";
import BtnGhost from "../shared/BtnGhost.vue";
import BtnAccent from "../shared/BtnAccent.vue";
import { useFocusTrap } from "../../composables/useFocusTrap";

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
  <Transition name="sheet-fade" appear>
    <div
      ref="dialogRef"
      class="motion-overlay absolute inset-0 bg-black/50 flex items-end z-20"
      role="dialog"
      aria-modal="true"
      @keydown.escape="ui.closeDetail()"
      @click.self="ui.closeDetail()"
    >
      <div
        class="motion-sheet w-full bg-bg border-t-2 border-accent flex flex-col gap-3 p-3.5 pb-3 max-h-[90%] overflow-auto shadow-panel"
      >
        <div class="flex items-center shrink-0">
          <p class="text-[13px] font-semibold text-ink">Export list</p>
          <div class="flex-1" />
          <button
            @click="ui.closeDetail()"
            class="motion-button text-ink-muted text-base cursor-pointer bg-transparent border-0"
          >
            ✕
          </button>
        </div>

        <p class="text-[11px] text-ink-muted">
          Copy this string and share it. Others can import it to recreate your list.
        </p>

        <textarea
          data-export-textarea
          readonly
          :value="encoded"
          aria-label="Exported list string"
          class="w-full h-24 px-2.5 py-2 text-[11px] font-mono border border-stroke rounded-sm text-ink bg-surface resize-none"
          @click="($event.target as HTMLTextAreaElement).select()"
        />

        <div class="flex gap-2">
          <BtnGhost label="Close" :full="true" size="md" @click="ui.closeDetail()" />
          <BtnAccent
            :label="copied ? 'Copied!' : 'Copy to clipboard'"
            :full="true"
            @click="copyToClipboard"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>
