import { storage } from "wxt/utils/storage";
import { ref, computed, onMounted, onUnmounted } from "vue";
import { type FollowedList, type Game } from "@poe-sl/schema";

const MAX_FOLLOWED = 50;
export const WARN_FOLLOWED = 45;

const followedStorage = storage.defineItem<FollowedList[]>("local:followed:v1", {
  fallback: [],
});

export function useFollowedLists() {
  const followed = ref<FollowedList[]>([]);
  const isLoaded = ref(false);

  onMounted(async () => {
    followed.value = (await followedStorage.getValue()) ?? [];
    isLoaded.value = true;
    const unwatch = followedStorage.watch((val) => {
      followed.value = val ?? [];
    });
    onUnmounted(unwatch);
  });

  const atWarningLimit = computed(() => followed.value.length >= WARN_FOLLOWED);
  const atMaxLimit = computed(() => followed.value.length >= MAX_FOLLOWED);

  async function followList(params: {
    slug: string;
    title: string;
    game: Game;
    league: string;
    authorDisplayName: string;
    updatedAt: number;
  }): Promise<boolean> {
    if (atMaxLimit.value) return false;
    const current = (await followedStorage.getValue()) ?? [];
    if (current.some((f) => f.slug === params.slug)) return true;
    const updated: FollowedList[] = [...current, { ...params, followedAt: Date.now() }];
    await followedStorage.setValue(updated);
    followed.value = updated;
    return true;
  }

  async function unfollowList(slug: string) {
    const current = (await followedStorage.getValue()) ?? [];
    const updated = current.filter((f) => f.slug !== slug);
    await followedStorage.setValue(updated);
    followed.value = updated;
  }

  function isFollowing(slug: string) {
    return computed(() => followed.value.some((f) => f.slug === slug));
  }

  return {
    followed,
    isLoaded,
    atWarningLimit,
    atMaxLimit,
    followList,
    unfollowList,
    isFollowing,
  };
}
