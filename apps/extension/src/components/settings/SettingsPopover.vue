<script setup lang="ts">
import { computed } from "vue";
import { useSettings } from "../../composables/useSettings";
import { useUiStore } from "../../stores/ui";
import { POE1_LEAGUES, POE2_LEAGUES, DEFAULT_POE1_LEAGUE, DEFAULT_POE2_LEAGUE } from "@/types";

const ui = useUiStore();
const { settings, updateSettings } = useSettings();

const leagueOptions = computed(() =>
  settings.value.game === "poe1" ? POE1_LEAGUES : POE2_LEAGUES,
);

function setGame(g: "poe1" | "poe2") {
  const defaultLeague = g === "poe1" ? DEFAULT_POE1_LEAGUE : DEFAULT_POE2_LEAGUE;
  updateSettings({ game: g, league: defaultLeague });
}
</script>

<template>
  <div class="absolute inset-0 bg-black/50 flex flex-col z-30" @click.self="ui.toggleSettings()">
    <div
      class="w-full bg-bg border-b border-stroke flex flex-col max-h-[90%] overflow-auto"
      style="box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2)"
    >
      <!-- Header -->
      <div class="flex items-center px-3 py-2.5 border-b border-stroke shrink-0">
        <p class="text-[13px] font-semibold text-ink flex-1">Settings</p>
        <button
          @click="ui.toggleSettings()"
          class="text-ink-muted text-base cursor-pointer bg-transparent border-0 leading-none"
        >
          ✕
        </button>
      </div>

      <div class="divide-y divide-stroke-soft">
        <!-- Game -->
        <div class="px-3 py-3 flex items-center justify-between">
          <p class="text-[12px] text-ink">Game</p>
          <div class="flex gap-1">
            <button
              v-for="g in ['poe1', 'poe2']"
              :key="g"
              @click="setGame(g as 'poe1' | 'poe2')"
              class="text-[11px] px-2.5 py-1 rounded-sm border cursor-pointer"
              :class="
                settings.game === g
                  ? 'bg-gold-soft border-gold-edge text-gold-ink-str font-semibold'
                  : 'bg-transparent border-stroke text-ink-muted'
              "
            >
              {{ g === "poe1" ? "PoE 1" : "PoE 2" }}
            </button>
          </div>
        </div>

        <!-- League -->
        <div class="px-3 py-3 flex flex-col gap-1.5">
          <p class="text-[10px] text-ink-muted uppercase tracking-[0.6px]">Current league</p>
          <select
            :value="settings.league"
            @change="updateSettings({ league: ($event.target as HTMLSelectElement).value })"
            class="w-full h-9 px-2.5 text-[13px] border border-stroke rounded-sm text-ink bg-bg cursor-pointer"
          >
            <option v-for="l in leagueOptions" :key="l" :value="l">{{ l }}</option>
          </select>
        </div>

        <!-- Theme -->
        <div class="px-3 py-3 flex items-center justify-between">
          <p class="text-[12px] text-ink">Theme</p>
          <div class="flex gap-1">
            <button
              v-for="t in ['light', 'dark', 'system']"
              :key="t"
              @click="updateSettings({ theme: t as 'light' | 'dark' | 'system' })"
              class="text-[11px] px-2.5 py-1 rounded-sm border cursor-pointer capitalize"
              :class="
                settings.theme === t
                  ? 'bg-gold-soft border-gold-edge text-gold-ink-str font-semibold'
                  : 'bg-transparent border-stroke text-ink-muted'
              "
            >
              {{ t }}
            </button>
          </div>
        </div>

        <!-- Auto capture price -->
        <div class="px-3 py-3 flex items-center justify-between gap-3">
          <div>
            <p class="text-[12px] text-ink">Auto-capture price</p>
            <p class="text-[10px] text-ink-muted">Read prices when saving a search</p>
          </div>
          <button
            @click="updateSettings({ autoCapturePrice: !settings.autoCapturePrice })"
            class="w-9 h-5 rounded-full border cursor-pointer flex items-center px-0.5 transition-colors shrink-0"
            :class="
              settings.autoCapturePrice ? 'bg-gold border-gold-edge' : 'bg-surface border-stroke'
            "
          >
            <div
              class="w-3.5 h-3.5 rounded-full bg-white shadow transition-transform"
              :class="settings.autoCapturePrice ? 'translate-x-4' : 'translate-x-0'"
            />
          </button>
        </div>

        <!-- Open in new tab -->
        <div class="px-3 py-3 flex items-center justify-between gap-3">
          <div>
            <p class="text-[12px] text-ink">Open items in new tab</p>
            <p class="text-[10px] text-ink-muted">vs. current tab</p>
          </div>
          <button
            @click="updateSettings({ openItemsInNewTab: !settings.openItemsInNewTab })"
            class="w-9 h-5 rounded-full border cursor-pointer flex items-center px-0.5 transition-colors shrink-0"
            :class="
              settings.openItemsInNewTab ? 'bg-gold border-gold-edge' : 'bg-surface border-stroke'
            "
          >
            <div
              class="w-3.5 h-3.5 rounded-full bg-white shadow transition-transform"
              :class="settings.openItemsInNewTab ? 'translate-x-4' : 'translate-x-0'"
            />
          </button>
        </div>

        <!-- Track purchase history -->
        <div class="px-3 py-3 flex items-center justify-between gap-3">
          <div>
            <p class="text-[12px] text-ink">Track purchase history</p>
            <p class="text-[10px] text-ink-muted">Log "Travel to Hideout" clicks</p>
          </div>
          <button
            @click="updateSettings({ trackPurchaseHistory: !settings.trackPurchaseHistory })"
            class="w-9 h-5 rounded-full border cursor-pointer flex items-center px-0.5 transition-colors shrink-0"
            :class="
              settings.trackPurchaseHistory
                ? 'bg-gold border-gold-edge'
                : 'bg-surface border-stroke'
            "
          >
            <div
              class="w-3.5 h-3.5 rounded-full bg-white shadow transition-transform"
              :class="settings.trackPurchaseHistory ? 'translate-x-4' : 'translate-x-0'"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
