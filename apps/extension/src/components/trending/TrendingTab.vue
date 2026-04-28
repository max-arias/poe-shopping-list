<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { ApiList, Game } from "@poe-sl/schema";
import { useApi } from "../../composables/useApi";
import TrendingFilters from "./TrendingFilters.vue";
import TrendingCard from "./TrendingCard.vue";

const { getLists } = useApi();

const lists = ref<ApiList[]>([]);
const loading = ref(true);
const error = ref("");
const gameFilter = ref<Game>("poe1");

async function fetch(game: Game) {
  loading.value = true;
  error.value = "";
  try {
    const data = (await getLists({ game })) as { lists?: ApiList[] };
    lists.value = data.lists ?? [];
  } catch {
    error.value = "Failed to load trending lists.";
  } finally {
    loading.value = false;
  }
}

onMounted(() => fetch(gameFilter.value));

function onGameChange(game: Game) {
  gameFilter.value = game;
  fetch(game);
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
    <TrendingFilters :game="gameFilter" @update:game="onGameChange" />

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <p class="text-[12px] text-ink-muted">Loading…</p>
    </div>

    <div v-else-if="error" class="flex-1 flex items-center justify-center px-4">
      <p class="text-[12px] text-[#a8432a] text-center">{{ error }}</p>
    </div>

    <div v-else-if="lists.length === 0" class="flex-1 flex items-center justify-center px-4">
      <p class="text-[12px] text-ink-muted text-center">No lists found.</p>
    </div>

    <div v-else class="flex-1 overflow-auto">
      <TrendingCard v-for="list in lists" :key="list.slug" :list="list" />
    </div>
  </div>
</template>
