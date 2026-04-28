<script setup lang="ts">
import { ref, computed } from "vue";
import { useUiStore } from "../../stores/ui";
import { useDraftList } from "../../composables/useDraftList";
import { useSettings } from "../../composables/useSettings";
import { useApi } from "../../composables/useApi";
import BtnGhost from "../shared/BtnGhost.vue";
import BtnGold from "../shared/BtnGold.vue";

const ui = useUiStore();
const { draft } = useDraftList();
const { settings } = useSettings();
const { publishList } = useApi();

const listTitle = ref(draft.value?.name ?? "");
const league = ref(settings.value.league);
const sourceUrl = ref("");
const publishing = ref(false);
const publishedSlug = ref<string | null>(null);
const error = ref("");

const pricedCount = computed(
  () =>
    draft.value?.items.filter((i) => i.capture && i.capture.aggregates.sampleSize > 0).length ?? 0,
);
const totalItems = computed(() => draft.value?.items.length ?? 0);

async function handlePublish() {
  if (publishing.value || !draft.value) return;
  publishing.value = true;
  error.value = "";
  try {
    const result = await publishList({
      game: draft.value.game,
      league: league.value,
      title: listTitle.value,
      sourceUrl: sourceUrl.value || undefined,
      items: draft.value.items.map((item) => ({
        position: item.position,
        kind: item.kind,
        name: item.name,
        base: item.base,
        tradeQueryJson: { url: item.tradeUrl },
        pick: item.capture
          ? {
              pickedPriceValue: item.capture.aggregates.median,
              pickedPriceCurrency: item.capture.aggregates.currency,
              sampleMin: item.capture.aggregates.min,
              sampleMedian: item.capture.aggregates.median,
              sampleAvg: item.capture.aggregates.avg,
              sampleSize: item.capture.aggregates.sampleSize,
              rawSamples: item.capture.samples.map((s) => ({
                value: s.priceValue,
                currency: s.priceCurrency,
              })),
              capturedAt: item.capture.capturedAt,
            }
          : undefined,
      })),
    });
    publishedSlug.value = result.slug;
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : "publish_failed";
  } finally {
    publishing.value = false;
  }
}

async function copySlug() {
  if (!publishedSlug.value) return;
  await navigator.clipboard.writeText(`https://poe-sl.com/lists/${publishedSlug.value}`);
}
</script>

<template>
  <!-- Backdrop -->
  <div
    class="absolute inset-0 bg-black/50 flex items-end z-20"
    @click.self="ui.publishSheetOpen = false"
  >
    <!-- Sheet -->
    <div
      class="w-full bg-bg border-t-2 border-gold flex flex-col gap-3 p-3.5 pb-3 max-h-[90%] overflow-auto"
      style="box-shadow: 0 -6px 20px rgba(0, 0, 0, 0.25)"
    >
      <div class="flex items-center shrink-0">
        <p class="text-[13px] font-semibold text-ink">Publish list</p>
        <div class="flex-1" />
        <button
          @click="ui.publishSheetOpen = false"
          class="text-ink-muted text-base cursor-pointer bg-transparent border-0"
        >
          ✕
        </button>
      </div>

      <!-- Published success state -->
      <template v-if="publishedSlug">
        <div class="flex flex-col items-center gap-3 py-4 text-center">
          <div
            class="w-14 h-14 rounded-full bg-gold-soft border-2 border-gold text-gold-ink-str text-2xl font-bold flex items-center justify-center"
          >
            ✓
          </div>
          <div>
            <p class="text-[14px] font-semibold text-ink">List published</p>
            <p class="text-[11px] text-ink-muted mt-1">Share the URL with anyone</p>
          </div>
          <div
            class="w-full border border-gold-edge bg-surface rounded-sm px-3 py-2 flex items-center gap-2"
          >
            <span class="font-mono text-xs flex-1 truncate text-ink"
              >poe-sl.com/lists/{{ publishedSlug }}</span
            >
            <BtnGhost label="Copy" :gold="true" @click="copySlug" />
          </div>
          <BtnGold label="Done" @click="ui.publishSheetOpen = false" />
        </div>
      </template>

      <!-- Publish form -->
      <template v-else>
        <div>
          <p class="text-[10px] text-ink-muted uppercase tracking-[0.6px] mb-1">Title</p>
          <input
            v-model="listTitle"
            maxlength="120"
            class="w-full h-9 px-2.5 text-[13px] border border-stroke rounded-sm text-ink"
          />
        </div>
        <div>
          <p class="text-[10px] text-ink-muted uppercase tracking-[0.6px] mb-1">League</p>
          <input
            v-model="league"
            maxlength="60"
            class="w-full h-9 px-2.5 text-[13px] border border-stroke rounded-sm text-ink"
          />
        </div>
        <div>
          <p class="text-[10px] text-ink-muted uppercase tracking-[0.6px] mb-1">
            Build URL (optional)
          </p>
          <input
            v-model="sourceUrl"
            placeholder="pobb.in/… or maxroll.gg/…"
            class="w-full h-9 px-2.5 text-[12px] border border-dashed border-stroke rounded-sm text-ink placeholder:text-ink-muted"
          />
        </div>

        <!-- Summary -->
        <div
          class="flex flex-col gap-1.5 p-2.5 bg-surface border border-stroke-soft rounded-sm text-xs"
        >
          <div class="flex justify-between">
            <span class="text-ink-muted">Items</span><span class="text-ink">{{ totalItems }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-ink-muted">Priced</span
            ><span class="text-ink">{{ pricedCount }} of {{ totalItems }}</span>
          </div>
        </div>

        <p v-if="error" class="text-[11px] text-[#a8432a]">{{ error }}</p>

        <div class="flex gap-2">
          <BtnGhost label="Cancel" :full="true" size="md" @click="ui.publishSheetOpen = false" />
          <BtnGold
            label="Publish"
            :disabled="publishing || !listTitle.trim()"
            @click="handlePublish"
          />
        </div>
        <p class="text-[10px] text-ink-muted text-center">Lists are immutable once published.</p>
      </template>
    </div>
  </div>
</template>
