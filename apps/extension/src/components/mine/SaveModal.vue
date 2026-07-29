<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useDraftList } from "../../composables/useDraftList";
import { useUiStore } from "../../stores/ui";
import { sendMessage, type TradePageInfo } from "../../utils/messages";
import BtnAccent from "../shared/BtnAccent.vue";
import BtnGhost from "../shared/BtnGhost.vue";

const ui = useUiStore();
const { drafts, addItemToDraft } = useDraftList();
const title = ref("");
const page = ref<TradePageInfo | null>(null);
const loading = ref(true);
const loadError = ref(false);
const saving = ref(false);
const list = computed(() => drafts.value.find((draft) => draft.id === ui.registerListId) ?? null);

onMounted(async () => {
  try {
    page.value = await sendMessage("spTradePageInfo");
    title.value = page.value.title;
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
});

async function handleSave() {
  if (
    !list.value ||
    !page.value?.supported ||
    !page.value.url ||
    !title.value.trim() ||
    saving.value
  )
    return;
  saving.value = true;
  try {
    const item = await addItemToDraft(list.value.id, title.value.trim(), page.value.url);
    if (item) ui.closeRegisterModal();
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div
    class="absolute inset-0 z-20 flex items-end bg-black/50"
    role="dialog"
    aria-modal="true"
    aria-labelledby="register-title"
    @keydown.escape="ui.closeRegisterModal()"
    @click.self="ui.closeRegisterModal()"
  >
    <form
      class="w-full space-y-3 border-t-2 border-accent bg-bg p-3.5"
      @submit.prevent="handleSave"
    >
      <p class="text-[10px] uppercase tracking-[0.12em] text-accent-ink-str">
        Register current trade
      </p>
      <h2 id="register-title" class="text-[16px] font-semibold text-ink">
        Save this trade to {{ list?.title }}
      </h2>
      <p v-if="loading" class="text-[11px] leading-relaxed text-ink-muted">
        Checking the current page…
      </p>
      <p
        v-else-if="loadError || !page?.supported"
        class="border border-stroke bg-surface px-2.5 py-2 text-[11px] leading-relaxed text-ink-muted"
      >
        This page is not a supported trade page. Open a supported trade page to register it.
      </p>
      <template v-else>
        <p class="text-[11px] leading-relaxed text-ink-muted">
          Add this page as an incomplete List item. Nothing is captured or priced automatically.
        </p>
        <div
          class="break-all border border-stroke bg-surface px-2.5 py-2 font-mono text-[10px] text-ink-muted"
          :title="page.url"
        >
          {{ page.url }}
        </div>
        <label class="block text-[10px] uppercase tracking-[0.06em] text-ink-muted"
          >List Item title<input
            v-model="title"
            maxlength="120"
            autofocus
            class="mt-1 h-9 w-full border border-accent-edge bg-surface px-2.5 text-[13px] text-ink outline-none focus:border-accent"
        /></label>
      </template>
      <div class="flex gap-2">
        <BtnGhost label="Cancel" :full="true" size="md" @click="ui.closeRegisterModal" /><BtnAccent
          label="Save to List"
          :full="true"
          size="md"
          :disabled="loading || loadError || !page?.supported || !title.trim() || saving"
          @click="handleSave"
        />
      </div>
    </form>
  </div>
</template>
