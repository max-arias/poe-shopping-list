<script setup lang="ts">
import { computed } from "vue";
import type { TabId } from "../../stores/ui";

const { activeTab, showPurchases } = defineProps<{
  activeTab: TabId;
  showPurchases?: boolean;
}>();
const emit = defineEmits<{ change: [tab: TabId] }>();

const tabs = computed(() => {
  const base: { key: TabId; label: string; badge?: string }[] = [
    { key: "mine", label: "Mine" },
    { key: "following", label: "Following" },
    { key: "trending", label: "Trending", badge: "🔥" },
  ];
  if (showPurchases) base.push({ key: "purchases", label: "Purchases" });
  return base;
});
</script>

<template>
  <div class="flex border-b border-stroke bg-surface-tab shrink-0">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      :data-testid="`tab-${tab.key}`"
      @click="emit('change', tab.key)"
      class="flex-1 flex items-center justify-center gap-1.5 py-[11px] cursor-pointer bg-transparent border-0 border-b-2 transition-none"
      :class="
        tab.key === activeTab
          ? 'text-[12px] font-semibold text-gold-ink-str border-gold'
          : 'text-[12px] font-normal text-ink-muted border-transparent'
      "
    >
      <span>{{ tab.label }}</span>
      <span
        v-if="tab.badge"
        class="text-[10px] px-1 rounded-[6px] min-w-[14px] text-center"
        :class="
          tab.key === activeTab ? 'bg-gold-soft text-gold-ink-str' : 'bg-block text-ink-muted'
        "
      >
        {{ tab.badge }}
      </span>
    </button>
  </div>
</template>
