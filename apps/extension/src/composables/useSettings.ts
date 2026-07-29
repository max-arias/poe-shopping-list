import { DEFAULT_SETTINGS, SettingsSchema, type Settings } from "@/types";
import { resetLegacyStorage, STORAGE } from "@/types/storage";
import { ref } from "vue";
import { storage } from "wxt/utils/storage";

const settingsItem = storage.defineItem<Settings>(STORAGE.settings, {
  fallback: DEFAULT_SETTINGS,
});
const settings = ref<Settings>({ ...DEFAULT_SETTINGS });
const isLoaded = ref(false);
let initialized = false;

async function initializeSettings(): Promise<Settings> {
  await resetLegacyStorage((legacy, current) => {
    const currentSettings = SettingsSchema.safeParse(current);
    if (currentSettings.success) return currentSettings.data;
    const legacySettings = SettingsSchema.safeParse(legacy);
    return legacySettings.success ? legacySettings.data : DEFAULT_SETTINGS;
  });
  return SettingsSchema.parse(await settingsItem.getValue());
}

function ensureInitialized() {
  if (initialized) return;
  initialized = true;

  void initializeSettings().then((value) => {
    settings.value = value;
    isLoaded.value = true;
  });

  settingsItem.watch((value) => {
    settings.value = SettingsSchema.parse(value);
    isLoaded.value = true;
  });
}

export function useSettings() {
  ensureInitialized();

  async function updateSettings(patch: Partial<Settings>) {
    const current = await settingsItem.getValue();
    const updated = SettingsSchema.parse({ ...current, ...patch });
    await settingsItem.setValue(updated);
    settings.value = updated;
  }

  return { settings, isLoaded, updateSettings };
}
