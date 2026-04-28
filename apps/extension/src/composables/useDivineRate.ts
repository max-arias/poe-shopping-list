import { ref, watch } from "vue";
import { useSettings } from "./useSettings";

const cachedRate = ref<number | null>(null);
let cachedLeague = "";

export function useDivineRate() {
  const { settings } = useSettings();

  async function fetchRate(league: string) {
    if (cachedRate.value !== null && cachedLeague === league) return;
    try {
      const res = await fetch(
        `https://poe.ninja/api/data/currencyoverview?league=${encodeURIComponent(league)}&type=Currency`,
      );
      if (!res.ok) return;
      const data = await res.json();
      const divine = (data.lines as any[])?.find((l) => l.currencyTypeName === "Divine Orb");
      if (divine?.chaosEquivalent) {
        cachedRate.value = divine.chaosEquivalent;
        cachedLeague = league;
      }
    } catch {}
  }

  watch(
    () => settings.value.league,
    (league) => fetchRate(league),
    { immediate: true },
  );

  return { divineRate: cachedRate };
}
