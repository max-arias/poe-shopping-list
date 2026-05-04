import { GameSchema, DEFAULT_POE1_LEAGUE } from "./game";

export const SettingsSchema = z.object({
  game: GameSchema.default("poe1"),
  league: z.string().default(DEFAULT_POE1_LEAGUE),
  autoCapturePrice: z.boolean().default(true),
  showCaptureUnavailableBanner: z.boolean().default(true),
  openItemsInNewTab: z.boolean().default(false),
  theme: z.enum(["light", "dark", "system"]).default("system"),
});
export type Settings = z.infer<typeof SettingsSchema>;
export const DEFAULT_SETTINGS: Settings = SettingsSchema.parse({});