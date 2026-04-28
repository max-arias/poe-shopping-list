<script setup lang="ts">
import { useFollowedLists, WARN_FOLLOWED } from "../../composables/useFollowedLists";
import EmptyFollowing from "./EmptyFollowing.vue";
import FollowedListRow from "./FollowedListRow.vue";

const { followed, atWarningLimit } = useFollowedLists();
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
    <template v-if="followed.length === 0">
      <EmptyFollowing />
    </template>

    <template v-else>
      <div
        v-if="atWarningLimit"
        class="shrink-0 px-3 py-2 bg-warn border-b border-warn-edge text-[11px] text-warn-ink text-center"
      >
        Approaching limit ({{ followed.length }} / 50) — unfollow some lists to make room
      </div>

      <div class="flex-1 overflow-auto">
        <FollowedListRow v-for="list in followed" :key="list.slug" :list="list" />
      </div>
    </template>
  </div>
</template>
