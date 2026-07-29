import { z } from "zod";
export const SettingsSchema = z.object({
  openItemsInNewTab: z.boolean().default(false),
  theme: z.enum(["light", "dark", "system"]).default("system"),
});
export type Settings = z.infer<typeof SettingsSchema>;
export const DEFAULT_SETTINGS: Settings = SettingsSchema.parse({});
