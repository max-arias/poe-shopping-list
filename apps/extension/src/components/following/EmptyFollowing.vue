<script setup lang="ts">
import { useUiStore } from "../../stores/ui";
import BtnGold from "../shared/BtnGold.vue";
const ui = useUiStore();
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
    <div
      class="w-12 h-12 rounded-full bg-surface border border-stroke flex items-center justify-center text-xl"
    >
      ⭐
    </div>
    <div>
      <p class="text-[13px] font-semibold text-ink">No followed lists</p>
      <p class="text-[11px] text-ink-muted mt-1 max-w-[200px] leading-relaxed">
        Browse Trending to find builds shared by other players.
      </p>
    </div>
    <BtnGold label="Browse Trending" @click="ui.setTab('trending')" />
  </div>
</template>
