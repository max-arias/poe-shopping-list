<script setup lang="ts">
import type { ApiList } from "@poe-sl/schema";
import { useUiStore } from "../../stores/ui";
import { useFollowedLists } from "../../composables/useFollowedLists";

const { list } = defineProps<{ list: ApiList }>();

const ui = useUiStore();
const { isFollowing, followList, unfollowList, atMaxLimit } = useFollowedLists();

const following = isFollowing(list.slug);

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function toggleFollow() {
  if (following.value) {
    await unfollowList(list.slug);
  } else {
    await followList({
      slug: list.slug,
      title: list.title,
      game: list.game,
      league: list.league,
      authorDisplayName: list.authorDisplayName,
      updatedAt: list.updatedAt,
    });
  }
}
</script>

<template>
  <div class="border-b border-stroke-soft px-3 py-2.5">
    <div class="flex items-start gap-2">
      <div class="flex-1 min-w-0 cursor-pointer" @click="ui.openDetail('following', list.slug)">
        <p class="text-[13px] font-medium text-ink truncate">{{ list.title }}</p>
        <div class="flex items-center gap-1.5 text-[10px] text-ink-muted mt-0.5 flex-wrap">
          <span>{{ list.authorDisplayName }}</span>
          <span>·</span>
          <span>{{ list.league }}</span>
          <template v-if="list.ascendancy">
            <span>·</span>
            <span>{{ list.ascendancy }}</span>
          </template>
          <span>·</span>
          <span>{{ formatDate(list.publishedAt) }}</span>
        </div>
      </div>
      <button
        @click="toggleFollow"
        :disabled="!following.value && atMaxLimit"
        class="shrink-0 text-[11px] border rounded-sm px-2 py-0.5 bg-transparent cursor-pointer disabled:opacity-40"
        :class="
          following.value ? 'border-gold-edge text-gold-ink-str' : 'border-stroke text-ink-muted'
        "
      >
        {{ following.value ? "✓ Following" : "Follow" }}
      </button>
    </div>
  </div>
</template>
