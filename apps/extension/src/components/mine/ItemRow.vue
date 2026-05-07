<script setup lang="ts">
import { AnimatePresence, motion } from "motion-v";
import type { DraftItem } from "@/types";
import { useUiStore } from "../../stores/ui";
import { useDraftList } from "../../composables/useDraftList";
import { useSettings } from "../../composables/useSettings";
import {
  buttonMotionProps,
  checkToggleMotionProps,
  checkmarkMotionProps,
  rowMotionTransition,
  subtleButtonMotionProps,
} from "../../utils/motion";

const { item } = defineProps<{ item: DraftItem }>();

const ui = useUiStore();
const { setComplete } = useDraftList();
const { settings } = useSettings();

const formatPrice = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

async function openTrade(url: string) {
  if (settings.value.openItemsInNewTab) {
    browser.tabs.create({ url });
  } else {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) browser.tabs.update(tab.id, { url });
  }
}
</script>

<template>
  <motion.div
    class="flex items-center gap-2.5 px-3 py-2.5 border-b border-stroke-soft"
    :animate="
      item.completed
        ? { opacity: 0.6, backgroundColor: 'var(--poe-accent-soft)' }
        : { opacity: 1, backgroundColor: 'rgba(0, 0, 0, 0)' }
    "
    :transition="rowMotionTransition"
  >
    <!-- Checkbox -->
    <motion.button
      @click="setComplete(item.id, !item.completed)"
      v-bind="checkToggleMotionProps"
      role="checkbox"
      :aria-checked="item.completed"
      aria-label="Mark as acquired"
      class="w-3.5 h-3.5 shrink-0 rounded-sm border border-stroke flex items-center justify-center bg-transparent cursor-pointer"
      :class="item.completed ? 'bg-accent border-accent-edge' : ''"
    >
      <AnimatePresence>
        <motion.span
          v-if="item.completed"
          key="check"
          v-bind="checkmarkMotionProps"
          class="text-accent-ink text-[10px] font-bold leading-none"
        >
          ✓
        </motion.span>
      </AnimatePresence>
    </motion.button>

    <!-- Name -->
    <div class="flex-1 min-w-0">
      <motion.button
        v-if="item.tradeUrl"
        @click.stop="openTrade(item.tradeUrl!)"
        v-bind="buttonMotionProps"
        :aria-label="item.name"
        class="text-[13px] font-medium text-ink truncate hover:underline cursor-pointer text-left bg-transparent border-0 p-0 min-w-0 w-full"
        :class="item.completed ? 'line-through' : ''"
      >
        {{ item.name }}
      </motion.button>
      <span
        v-else
        class="text-[13px] font-medium text-ink truncate block"
        :class="item.completed ? 'line-through' : ''"
      >
        {{ item.name }}
      </span>
    </div>

    <!-- Price -->
    <span v-if="item.capture" class="font-mono text-xs font-semibold text-accent-ink-str shrink-0">
      ~{{ formatPrice(item.capture.aggregates.median) }}
      <span class="opacity-70 text-[10px]">{{ item.capture.aggregates.currency }}</span>
    </span>

    <!-- Kebab -->
    <motion.button
      @click.stop="ui.toggleKebab(item.id)"
      v-bind="subtleButtonMotionProps"
      aria-label="Item actions"
      class="text-ink-muted text-sm cursor-pointer bg-transparent border-0 px-0.5 leading-none shrink-0"
    >
      ⋯
    </motion.button>
  </motion.div>
</template>
