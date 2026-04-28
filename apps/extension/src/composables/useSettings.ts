import { storage } from "wxt/utils/storage";
import { ref, onMounted, onUnmounted } from "vue";
import { type Settings, DEFAULT_SETTINGS } from "@poe-sl/schema";

const settingsItem = storage.defineItem<Settings>("local:settings:v1", {
  fallback: DEFAULT_SETTINGS,
});

export function useSettings() {
  const settings = ref<Settings>({ ...DEFAULT_SETTINGS });
  const isLoaded = ref(false);

  onMounted(async () => {
    settings.value = await settingsItem.getValue();
    isLoaded.value = true;
    const unwatch = settingsItem.watch((val) => {
      if (val) settings.value = val;
    });
    onUnmounted(unwatch);
  });

  async function updateSettings(patch: Partial<Settings>) {
    const current = await settingsItem.getValue();
    const updated: Settings = { ...current, ...patch };
    await settingsItem.setValue(updated);
    settings.value = updated;
  }

  return { settings, isLoaded, updateSettings };
}
