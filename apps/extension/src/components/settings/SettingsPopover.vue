<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useFocusTrap } from "../../composables/useFocusTrap";
import { useSettings } from "../../composables/useSettings";
import { useUiStore } from "../../stores/ui";

const ui = useUiStore();
const { settings, updateSettings } = useSettings();
const dialogRef = ref<HTMLElement | null>(null);
const { activate, deactivate } = useFocusTrap(dialogRef);

onMounted(activate);
onBeforeUnmount(deactivate);

function close() {
  ui.toggleSettings();
}
</script>

<template>
  <div class="absolute inset-0 z-30 flex flex-col bg-black/50" @click.self="close">
    <section
      ref="dialogRef"
      class="w-full overflow-auto border-b border-stroke bg-bg shadow-popover"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      @keydown.escape="close"
    >
      <header class="flex items-center border-b border-stroke px-3 py-2.5">
        <h2 id="settings-title" class="flex-1 text-[13px] font-semibold text-ink">Settings</h2>
        <button
          type="button"
          class="text-base leading-none text-ink-muted hover:text-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
          aria-label="Close settings"
          @click="close"
        >
          ✕
        </button>
      </header>

      <div class="divide-y divide-stroke-soft">
        <div class="flex items-center justify-between gap-3 px-3 py-3">
          <div>
            <p class="text-[12px] text-ink">Theme</p>
            <p class="text-[10px] text-ink-muted">Choose the panel appearance.</p>
          </div>
          <select
            :value="settings.theme"
            aria-label="Theme"
            class="h-8 border border-stroke bg-bg px-2 text-[11px] capitalize text-ink outline-none focus:border-accent"
            @change="
              updateSettings({
                theme: ($event.target as HTMLSelectElement).value as 'light' | 'dark' | 'system',
              })
            "
          >
            <option value="system">System</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>

        <div class="flex items-center justify-between gap-3 px-3 py-3">
          <div>
            <p class="text-[12px] text-ink">Open trade links in a new tab</p>
            <p class="text-[10px] text-ink-muted">Otherwise, use the current tab.</p>
          </div>
          <button
            type="button"
            role="switch"
            :aria-checked="settings.openItemsInNewTab"
            aria-label="Open trade links in a new tab"
            class="flex h-5 w-9 shrink-0 items-center rounded-full border px-0.5 focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
            :class="
              settings.openItemsInNewTab
                ? 'border-accent-edge bg-accent'
                : 'border-stroke bg-surface'
            "
            @click="updateSettings({ openItemsInNewTab: !settings.openItemsInNewTab })"
          >
            <span
              class="h-3.5 w-3.5 rounded-full bg-knob transition-transform"
              :class="settings.openItemsInNewTab ? 'translate-x-4' : 'translate-x-0'"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
