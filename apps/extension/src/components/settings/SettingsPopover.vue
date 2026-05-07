<script setup lang="ts">
import { motion } from "motion-v";
import { ref, onMounted } from "vue";
import { useFocusTrap } from "../../composables/useFocusTrap";
import { useSettings } from "../../composables/useSettings";
import { useUiStore } from "../../stores/ui";
import { POE1_LEAGUES, DEFAULT_SETTINGS } from "@/types";
import {
  buttonMotionProps,
  overlayMotionProps,
  popoverMotionProps,
  subtleButtonMotionProps,
  toggleKnobMotionProps,
} from "../../utils/motion";

const ui = useUiStore();
const { settings, updateSettings } = useSettings();

const dialogRef = ref<HTMLElement | null>(null);
const { activate: activateFocusTrap } = useFocusTrap(dialogRef);

onMounted(() => {
  activateFocusTrap();
});

function toggleShowFloatingActionButton() {
  updateSettings({
    showFloatingActionButton: !settings.value.showFloatingActionButton,
  });
}

function resetShowFloatingActionButton() {
  updateSettings({
    showFloatingActionButton: DEFAULT_SETTINGS.showFloatingActionButton,
  });
}
</script>

<template>
  <motion.div
    v-bind="overlayMotionProps"
    class="absolute inset-0 bg-black/50 flex flex-col z-30"
    @click.self="ui.toggleSettings()"
  >
    <motion.div
      ref="dialogRef"
      v-bind="popoverMotionProps"
      class="w-full bg-bg border-b border-stroke flex flex-col max-h-[90%] overflow-auto shadow-popover"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      @keydown.escape="ui.toggleSettings()"
    >
      <!-- Header -->
      <div class="flex items-center px-3 py-2.5 border-b border-stroke shrink-0">
        <p class="text-[13px] font-semibold text-ink flex-1">Settings</p>
        <motion.button
          @click="ui.toggleSettings()"
          v-bind="subtleButtonMotionProps"
          class="text-ink-muted text-base cursor-pointer bg-transparent border-0 leading-none"
        >
          ✕
        </motion.button>
      </div>

      <div class="divide-y divide-stroke-soft">
        <!-- League -->
        <div class="px-3 py-3 flex flex-col gap-1.5">
          <p class="text-[10px] text-ink-muted uppercase tracking-[0.6px]">Current league</p>
          <select
            :value="settings.league"
            @change="updateSettings({ league: ($event.target as HTMLSelectElement).value })"
            aria-label="Current league"
            class="w-full h-9 px-2.5 text-[13px] border border-stroke rounded-sm text-ink bg-bg cursor-pointer"
          >
            <option v-for="l in POE1_LEAGUES" :key="l" :value="l">{{ l }}</option>
          </select>
        </div>

        <!-- Theme -->
        <div class="px-3 py-3 flex items-center justify-between">
          <p class="text-[12px] text-ink">Theme</p>
          <div class="flex gap-1">
            <motion.button
              v-for="t in ['light', 'dark', 'system']"
              :key="t"
              @click="updateSettings({ theme: t as 'light' | 'dark' | 'system' })"
              v-bind="buttonMotionProps"
              class="text-[11px] px-2.5 py-1 rounded-sm border cursor-pointer capitalize"
              :class="
                settings.theme === t
                  ? 'bg-accent-soft border-accent-edge text-accent-ink-str font-semibold'
                  : 'bg-transparent border-stroke text-ink-muted'
              "
            >
              {{ t }}
            </motion.button>
          </div>
        </div>

        <!-- Auto capture price -->
        <div class="px-3 py-3 flex items-center justify-between gap-3">
          <div>
            <p class="text-[12px] text-ink">Auto-capture price</p>
            <p class="text-[10px] text-ink-muted">Read prices when saving a search</p>
          </div>
          <motion.button
            @click="updateSettings({ autoCapturePrice: !settings.autoCapturePrice })"
            v-bind="subtleButtonMotionProps"
            role="switch"
            :aria-checked="settings.autoCapturePrice"
            aria-label="Auto-capture price"
            class="w-9 h-5 rounded-full border cursor-pointer flex items-center px-0.5 shrink-0"
            :class="
              settings.autoCapturePrice
                ? 'bg-accent border-accent-edge'
                : 'bg-surface border-stroke'
            "
          >
            <motion.div
              v-bind="toggleKnobMotionProps"
              class="w-3.5 h-3.5 rounded-full bg-knob shadow-sm"
              :style="{ marginLeft: settings.autoCapturePrice ? '16px' : '0px' }"
            />
          </motion.button>
        </div>

        <!-- Show floating action button -->
        <div class="px-3 py-3 flex items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2">
              <p class="text-[12px] text-ink">Show floating action button</p>
              <motion.button
                type="button"
                v-bind="subtleButtonMotionProps"
                class="text-[10px] text-accent underline underline-offset-2 cursor-pointer"
                @click="resetShowFloatingActionButton"
              >
                Reset
              </motion.button>
            </div>
            <p class="text-[10px] text-ink-muted">Show the trade-page FAB shortcut</p>
          </div>
          <motion.button
            @click="toggleShowFloatingActionButton"
            v-bind="subtleButtonMotionProps"
            role="switch"
            :aria-checked="settings.showFloatingActionButton"
            aria-label="Show floating action button"
            class="w-9 h-5 rounded-full border cursor-pointer flex items-center px-0.5 shrink-0"
            :class="
              settings.showFloatingActionButton
                ? 'bg-accent border-accent-edge'
                : 'bg-surface border-stroke'
            "
          >
            <motion.div
              v-bind="toggleKnobMotionProps"
              class="w-3.5 h-3.5 rounded-full bg-knob shadow-sm"
              :style="{ marginLeft: settings.showFloatingActionButton ? '16px' : '0px' }"
            />
          </motion.button>
        </div>

        <!-- Open in new tab -->
        <div class="px-3 py-3 flex items-center justify-between gap-3">
          <div>
            <p class="text-[12px] text-ink">Open items in new tab</p>
            <p class="text-[10px] text-ink-muted">vs. current tab</p>
          </div>
          <motion.button
            @click="updateSettings({ openItemsInNewTab: !settings.openItemsInNewTab })"
            v-bind="subtleButtonMotionProps"
            role="switch"
            :aria-checked="settings.openItemsInNewTab"
            aria-label="Open items in new tab"
            class="w-9 h-5 rounded-full border cursor-pointer flex items-center px-0.5 shrink-0"
            :class="
              settings.openItemsInNewTab
                ? 'bg-accent border-accent-edge'
                : 'bg-surface border-stroke'
            "
          >
            <motion.div
              v-bind="toggleKnobMotionProps"
              class="w-3.5 h-3.5 rounded-full bg-knob shadow-sm"
              :style="{ marginLeft: settings.openItemsInNewTab ? '16px' : '0px' }"
            />
          </motion.button>
        </div>

        <!-- Track purchase history -->
        <div class="px-3 py-3 flex items-center justify-between gap-3">
          <div>
            <p class="text-[12px] text-ink">Track purchase history</p>
            <p class="text-[10px] text-ink-muted">Log "Travel to Hideout" clicks</p>
          </div>
          <motion.button
            @click="updateSettings({ trackPurchaseHistory: !settings.trackPurchaseHistory })"
            v-bind="subtleButtonMotionProps"
            role="switch"
            :aria-checked="settings.trackPurchaseHistory"
            aria-label="Track purchase history"
            class="w-9 h-5 rounded-full border cursor-pointer flex items-center px-0.5 shrink-0"
            :class="
              settings.trackPurchaseHistory
                ? 'bg-accent border-accent-edge'
                : 'bg-surface border-stroke'
            "
          >
            <motion.div
              v-bind="toggleKnobMotionProps"
              class="w-3.5 h-3.5 rounded-full bg-knob shadow-sm"
              :style="{ marginLeft: settings.trackPurchaseHistory ? '16px' : '0px' }"
            />
          </motion.button>
        </div>
      </div>
    </motion.div>
  </motion.div>
</template>
