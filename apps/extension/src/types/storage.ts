import { storage } from "wxt/utils/storage";

export const STORAGE = {
  drafts: "local:drafts:v1",
  settings: "local:settings:v2",
  resetMarker: "local:reset:v1",
} as const;

export const LEGACY_STORAGE_KEYS = [
  "local:drafts",
  "local:purchaseHistory",
  "local:visitHistory",
  "local:triggerSaveSearch",
  "local:pricingJobs:v1",
  "local:fabPosition:v1",
  "local:settings:v1",
  "local:poeSlDebugLogs:v1",
  "local:poeTradeStatsIndex:v1",
] as const;

export async function resetLegacyStorage(
  migrateSettings: (legacy: unknown, current: unknown) => unknown,
): Promise<void> {
  if (await storage.getItem<boolean>(STORAGE.resetMarker)) return;

  const [legacySettings, currentSettings] = await Promise.all([
    storage.getItem<unknown>("local:settings:v1"),
    storage.getItem<unknown>(STORAGE.settings),
  ]);
  await storage.setItem(STORAGE.settings, migrateSettings(legacySettings, currentSettings));
  await Promise.all(LEGACY_STORAGE_KEYS.map((key) => storage.removeItem(key)));
  await storage.setItem(STORAGE.resetMarker, true);
}
