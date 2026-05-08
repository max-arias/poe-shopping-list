import { DEFAULT_SETTINGS, type Settings } from "@/types";
import { ref } from "vue";
import { storage } from "wxt/utils/storage";

const settingsItem = storage.defineItem<Settings>("local:settings:v1", {
  fallback: DEFAULT_SETTINGS,
});

const settings = ref<Settings>({ ...DEFAULT_SETTINGS });
const isLoaded = ref(false);
let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  initialized = true;

  void settingsItem.getValue().then((value) => {
    settings.value = value;
    isLoaded.value = true;
  });

  settingsItem.watch((val) => {
    if (val) settings.value = val;
    isLoaded.value = true;
  });
}

export function useSettings() {
  ensureInitialized();

  async function updateSettings(patch: Partial<Settings>) {
    const current = await settingsItem.getValue();
    const updated: Settings = { ...current, ...patch };
    await settingsItem.setValue(updated);
    settings.value = updated;
  }

  return { settings, isLoaded, updateSettings };
}
