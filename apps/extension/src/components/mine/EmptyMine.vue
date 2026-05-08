<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useDraftList } from "../../composables/useDraftList";
import { useSettings } from "../../composables/useSettings";
import BtnAccent from "../shared/BtnAccent.vue";
import BtnGhost from "../shared/BtnGhost.vue";
import Button from "../shared/Button.vue";

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
    const url = tab?.url ?? "";
    // Trade site URLs aren't build guides — don't auto-fill them
    if (/pathofexile\.com\/trade/.test(url)) return "";
    return url;
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

const mainUrl = computed(() => allUrls.value[0] || undefined);
const secondaryUrls = computed(() =>
  allUrls.value.length > 1 ? allUrls.value.slice(1) : undefined,
);

async function handleCreate() {
  if (!draftName.value.trim() || creating.value) return;
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
  <div
    class="flex-1 flex flex-col items-center text-center px-5 py-8 gap-4 overflow-auto"
    data-testid="empty-mine"
  >
    <div
      class="w-14 h-14 rounded-full border-2 border-dashed border-stroke flex items-center justify-center text-2xl"
      aria-label="Shopping list"
    >
      ☰
    </div>
    <p class="text-[13px] font-semibold text-ink">Start your first list</p>

    <div class="w-full max-w-[260px] flex flex-col gap-2.5 text-left">
      <div v-for="(step, i) in steps" :key="i" class="flex items-center gap-2.5">
        <div
          class="w-[22px] h-[22px] rounded-full bg-accent-soft text-accent-ink-str text-[11px] font-bold flex items-center justify-center shrink-0"
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
          aria-label="List name"
          @keydown.escape="closeForm"
          class="w-full h-8 px-2.5 text-xs border border-stroke rounded-sm text-ink placeholder:text-ink-muted bg-bg outline-none focus:border-accent"
          autofocus
        />
      </div>

      <!-- Primary URL (optional) -->
      <div>
        <p class="text-[10px] text-ink-muted uppercase tracking-[0.6px] mb-1">
          Build / Guide URL <span class="normal-case text-ink-muted opacity-60">(optional)</span>
        </p>
        <input
          v-model="primaryUrl"
          placeholder="https://pobb.in/…"
          aria-label="Build or guide URL"
          @keydown.escape="closeForm"
          class="w-full h-8 px-2.5 text-xs border border-stroke rounded-sm text-ink placeholder:text-ink-muted bg-bg outline-none focus:border-accent"
        />
      </div>

      <!-- Extra URLs -->
      <div v-for="(_, i) in extraUrls" :key="i" class="flex gap-1.5 items-center">
        <input
          v-model="extraUrls[i]"
          :placeholder="i === 0 ? 'https://maxroll.gg/…' : 'https://…'"
          aria-label="Additional URL"
          @keydown.escape="closeForm"
          class="flex-1 h-8 px-2.5 text-xs border border-stroke rounded-sm text-ink placeholder:text-ink-muted bg-bg outline-none focus:border-accent"
        />
        <Button variant="plainIcon" size="iconSm" @click="removeExtraUrl(i)" title="Remove URL">
          ✕
        </Button>
      </div>

      <Button variant="link" size="link" @click="addExtraUrl" class="self-start">
        + Add another URL
      </Button>

      <!-- Creator -->
      <div>
        <p class="text-[10px] text-ink-muted uppercase tracking-[0.6px] mb-1">
          Creator <span class="normal-case text-ink-muted opacity-60">(optional)</span>
        </p>
        <input
          v-model="creator"
          placeholder="Creator name…"
          maxlength="80"
          aria-label="Creator name"
          @keydown.enter="handleCreate"
          @keydown.escape="closeForm"
          class="w-full h-8 px-2.5 text-xs border border-stroke rounded-sm text-ink placeholder:text-ink-muted bg-bg outline-none focus:border-accent"
        />
      </div>

      <!-- Actions -->
      <div class="flex gap-2 mt-0.5">
        <BtnGhost label="Cancel" :full="true" size="sm" @click="closeForm" />
        <BtnAccent
          label="Create"
          size="sm"
          :full="true"
          :disabled="!draftName.trim() || creating"
          @click="handleCreate"
        />
      </div>
    </div>

    <BtnAccent
      v-else
      label="+ Create List"
      size="md"
      :full="false"
      data-testid="create-list-btn"
      @click="openForm"
    />

    <p class="text-[10px] text-ink-muted mt-1">Create your first shopping list to get started.</p>
  </div>
</template>
