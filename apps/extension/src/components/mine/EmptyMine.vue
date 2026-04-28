<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useDraftList } from "../../composables/useDraftList";
import { useSettings } from "../../composables/useSettings";
import BtnGold from "../shared/BtnGold.vue";
import BtnGhost from "../shared/BtnGhost.vue";

const { createDraft } = useDraftList();
const { settings } = useSettings();

const showForm = ref(false);
const draftName = ref("");
const primaryUrl = ref("");
const extraUrls = ref<string[]>([]);
const creator = ref("");
const creating = ref(false);

const steps = [
  'Name your list (e.g. "RF Jugg")',
  "Open pathofexile.com/trade",
  "Run a search → tap Save This Search",
];

async function getCurrentTabUrl(): Promise<string> {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    return tab?.url ?? "";
  } catch {}
  return "";
}

onMounted(async () => {
  primaryUrl.value = await getCurrentTabUrl();
});

function addExtraUrl() {
  extraUrls.value.push("");
}

function removeExtraUrl(i: number) {
  extraUrls.value.splice(i, 1);
}

// Collect all non-empty valid-looking URLs
const allUrls = computed(() => {
  return [primaryUrl.value, ...extraUrls.value].filter((u) => u.trim() !== "");
});

const mainUrl = computed(() => allUrls.value[0] ?? undefined);
const secondaryUrls = computed(() =>
  allUrls.value.length > 1 ? allUrls.value.slice(1) : undefined,
);

async function handleCreate() {
  if (!draftName.value.trim() || !primaryUrl.value.trim() || creating.value) return;
  creating.value = true;
  await createDraft(
    draftName.value,
    settings.value.league,
    mainUrl.value,
    creator.value.trim() || undefined,
    secondaryUrls.value,
  );
  creating.value = false;
  showForm.value = false;
  draftName.value = "";
  primaryUrl.value = "";
  extraUrls.value = [];
  creator.value = "";
}

function openForm() {
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  draftName.value = "";
  primaryUrl.value = "";
  extraUrls.value = [];
  creator.value = "";
}
</script>

<template>
  <div class="flex-1 flex flex-col items-center text-center px-5 py-8 gap-4 overflow-auto">
    <div
      class="w-14 h-14 rounded-full border-2 border-dashed border-stroke flex items-center justify-center text-2xl"
    >
      🛍
    </div>
    <p class="text-[13px] font-semibold text-ink">Start your first list</p>

    <div class="w-full max-w-[260px] flex flex-col gap-2.5 text-left">
      <div v-for="(step, i) in steps" :key="i" class="flex items-center gap-2.5">
        <div
          class="w-[22px] h-[22px] rounded-full bg-gold-soft text-gold-ink-str text-[11px] font-bold flex items-center justify-center shrink-0"
        >
          {{ i + 1 }}
        </div>
        <p class="text-[11px] text-ink">{{ step }}</p>
      </div>
    </div>

    <!-- Create form -->
    <div v-if="showForm" class="w-full max-w-[280px] flex flex-col gap-2.5 text-left">
      <!-- Name -->
      <div>
        <p class="text-[10px] text-ink-muted uppercase tracking-[0.6px] mb-1">List Name</p>
        <input
          v-model="draftName"
          placeholder='e.g. "RF Jugg"'
          maxlength="80"
          @keydown.escape="closeForm"
          class="w-full h-8 px-2.5 text-xs border border-stroke rounded-sm text-ink placeholder:text-ink-muted bg-bg outline-none focus:border-gold"
          autofocus
        />
      </div>

      <!-- Primary URL (required) -->
      <div>
        <p class="text-[10px] text-ink-muted uppercase tracking-[0.6px] mb-1">Build / Guide URL</p>
        <input
          v-model="primaryUrl"
          placeholder="https://pobb.in/…"
          @keydown.escape="closeForm"
          class="w-full h-8 px-2.5 text-xs border border-stroke rounded-sm text-ink placeholder:text-ink-muted bg-bg outline-none focus:border-gold"
        />
      </div>

      <!-- Extra URLs -->
      <div v-for="(_, i) in extraUrls" :key="i" class="flex gap-1.5 items-center">
        <input
          v-model="extraUrls[i]"
          :placeholder="i === 0 ? 'https://maxroll.gg/…' : 'https://…'"
          @keydown.escape="closeForm"
          class="flex-1 h-8 px-2.5 text-xs border border-stroke rounded-sm text-ink placeholder:text-ink-muted bg-bg outline-none focus:border-gold"
        />
        <button
          @click="removeExtraUrl(i)"
          class="w-6 h-6 flex items-center justify-center text-ink-muted hover:text-ink cursor-pointer bg-transparent border-0 shrink-0 text-base leading-none"
          title="Remove URL"
        >
          ✕
        </button>
      </div>

      <button
        @click="addExtraUrl"
        class="self-start text-[10px] text-gold-ink-str hover:underline cursor-pointer bg-transparent border-0 px-0 py-0"
      >
        + Add another URL
      </button>

      <!-- Creator -->
      <div>
        <p class="text-[10px] text-ink-muted uppercase tracking-[0.6px] mb-1">
          Creator <span class="normal-case text-ink-muted opacity-60">(optional)</span>
        </p>
        <input
          v-model="creator"
          placeholder="Creator name…"
          maxlength="80"
          @keydown.enter="handleCreate"
          @keydown.escape="closeForm"
          class="w-full h-8 px-2.5 text-xs border border-stroke rounded-sm text-ink placeholder:text-ink-muted bg-bg outline-none focus:border-gold"
        />
      </div>

      <!-- Actions -->
      <div class="flex gap-2 mt-0.5">
        <BtnGhost label="Cancel" :full="true" size="sm" @click="closeForm" />
        <BtnGold
          label="Create"
          size="sm"
          :full="true"
          :disabled="!draftName.trim() || !primaryUrl.trim() || creating"
          @click="handleCreate"
        />
      </div>
    </div>

    <BtnGold v-else label="+ Create List" size="md" :full="false" @click="openForm" />

    <p class="text-[10px] text-ink-muted mt-1">Or explore the Trending tab for inspiration.</p>
  </div>
</template>
