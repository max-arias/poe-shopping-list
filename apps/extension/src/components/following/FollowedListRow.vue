<script setup lang="ts">
import type { FollowedList } from "@poe-sl/schema";
import { useUiStore } from "../../stores/ui";
import { useFollowedLists } from "../../composables/useFollowedLists";

const { list } = defineProps<{ list: FollowedList }>();

const ui = useUiStore();
const { unfollowList } = useFollowedLists();

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
</script>

<template>
  <div
    class="flex items-center gap-2.5 px-3 py-2.5 border-b border-stroke-soft cursor-pointer"
    @click="ui.openDetail('following', list.slug)"
  >
    <div class="flex-1 min-w-0 flex flex-col gap-0.5">
      <span class="text-[13px] font-medium text-ink truncate">{{ list.title }}</span>
      <div class="flex items-center gap-1.5 text-[10px] text-ink-muted flex-wrap">
        <span>{{ list.authorDisplayName }}</span>
        <span>·</span>
        <span>{{ list.league }}</span>
        <span>·</span>
        <span>Followed {{ formatDate(list.followedAt) }}</span>
      </div>
    </div>
    <button
      @click.stop="unfollowList(list.slug)"
      class="shrink-0 text-[11px] text-ink-muted border border-stroke rounded-sm px-2 py-0.5 bg-transparent cursor-pointer"
    >
      Unfollow
    </button>
  </div>
</template>
