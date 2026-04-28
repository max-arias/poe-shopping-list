import { z } from "zod";

// ── Enums ────────────────────────────────────────────────────────────────────

export const GameSchema = z.enum(["poe1", "poe2"]);
export type Game = z.infer<typeof GameSchema>;

export const POE1_LEAGUES = ["Mirage", "Hardcore Mirage", "Standard", "Hardcore"] as const;
export const POE2_LEAGUES = [
  "Fate of the Vaal",
  "Hardcore Fate of the Vaal",
  "Standard",
  "Hardcore",
] as const;
export const DEFAULT_POE1_LEAGUE = "Mirage";
export const DEFAULT_POE2_LEAGUE = "Fate of the Vaal";

export const ItemKindSchema = z.enum([
  "unique",
  "rare",
  "gem",
  "flask",
  "jewel",
  "cluster",
  "base",
]);
export type ItemKind = z.infer<typeof ItemKindSchema>;

// ── Trade capture ────────────────────────────────────────────────────────────

export const RawListingSchema = z.object({
  listingId: z.string(),
  priceValue: z.number(),
  priceCurrency: z.string(),
});
export type RawListing = z.infer<typeof RawListingSchema>;

export const TradeCaptureSchema = z.object({
  tradeUrl: z.string(),
  samples: z.array(RawListingSchema),
  aggregates: z.object({
    min: z.number(),
    median: z.number(),
    avg: z.number(),
    sampleSize: z.number().int().nonnegative(),
    currency: z.string(),
  }),
  capturedAt: z.number().int(),
});
export type TradeCapture = z.infer<typeof TradeCaptureSchema>;

// ── Draft item ───────────────────────────────────────────────────────────────

export const DraftItemSchema = z.object({
  id: z.string(),
  position: z.number().int(),
  name: z.string().min(1).max(120),
  tradeUrl: z.string(),
  capture: TradeCaptureSchema.nullable(),
  completed: z.boolean().default(false),
  kind: ItemKindSchema.default("unique"),
  base: z.string().optional(),
  addedAt: z.number().int(),
});
export type DraftItem = z.infer<typeof DraftItemSchema>;

// ── Draft list ───────────────────────────────────────────────────────────────

export const DraftSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(80),
  game: GameSchema.default("poe1"),
  league: z.string(),
  createdAt: z.number().int(),
  items: z.array(DraftItemSchema),
  publishedSlug: z.string().optional(),
  buildUrl: z.string().url().optional(),
  buildCreator: z.string().max(80).optional(),
  associatedUrls: z.array(z.string().url()).optional(),
});
export type Draft = z.infer<typeof DraftSchema>;

// ── Recent purchases ─────────────────────────────────────────────────────────

export const RecentPurchaseSchema = z.object({
  id: z.string(),
  itemName: z.string(),
  iconUrl: z.string(),
  priceValue: z.number(),
  priceCurrency: z.string(),
  seller: z.string(),
  tradeUrl: z.string(),
  purchasedAt: z.number().int(),
});
export type RecentPurchase = z.infer<typeof RecentPurchaseSchema>;

// ── Settings ─────────────────────────────────────────────────────────────────

export const SettingsSchema = z.object({
  game: GameSchema.default("poe1"),
  league: z.string().default(DEFAULT_POE1_LEAGUE),
  autoCapturePrice: z.boolean().default(true),
  showCaptureUnavailableBanner: z.boolean().default(true),
  openItemsInNewTab: z.boolean().default(false),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  enableRecentPurchases: z.boolean().default(false),
});
export type Settings = z.infer<typeof SettingsSchema>;
export const DEFAULT_SETTINGS: Settings = SettingsSchema.parse({});

// ── Auth session ─────────────────────────────────────────────────────────────

export const AuthSessionSchema = z.object({
  token: z.string(),
  poeAccountId: z.string(),
  displayName: z.string(),
  exp: z.number().int(),
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;

// ── Followed list ────────────────────────────────────────────────────────────

export const FollowedListSchema = z.object({
  slug: z.string(),
  title: z.string(),
  game: GameSchema,
  league: z.string(),
  authorDisplayName: z.string(),
  followedAt: z.number().int(),
  updatedAt: z.number().int(),
  cachedItems: z.array(z.unknown()).optional(),
  cachedAt: z.number().int().optional(),
});
export type FollowedList = z.infer<typeof FollowedListSchema>;

// ── API types ────────────────────────────────────────────────────────────────

export const ApiPickSchema = z.object({
  listingUrl: z.string().nullable(),
  pickedPriceValue: z.number(),
  pickedPriceCurrency: z.string(),
  sampleMin: z.number(),
  sampleMedian: z.number(),
  sampleAvg: z.number(),
  sampleSize: z.number().int(),
  capturedAt: z.number().int(),
});
export type ApiPick = z.infer<typeof ApiPickSchema>;

export const ApiListItemSchema = z.object({
  id: z.number().int(),
  position: z.number().int(),
  kind: ItemKindSchema,
  name: z.string(),
  base: z.string().nullable(),
  tradeQueryJson: z.unknown(),
  pick: ApiPickSchema.nullable(),
});
export type ApiListItem = z.infer<typeof ApiListItemSchema>;

export const ApiListSchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  authorDisplayName: z.string(),
  game: GameSchema,
  league: z.string(),
  title: z.string(),
  ascendancy: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  publishedAt: z.number().int(),
  updatedAt: z.number().int(),
});
export type ApiList = z.infer<typeof ApiListSchema>;

export const ApiListDetailSchema = z.object({
  list: ApiListSchema,
  items: z.array(ApiListItemSchema),
});
export type ApiListDetail = z.infer<typeof ApiListDetailSchema>;

// ── Publish request body ─────────────────────────────────────────────────────

export const PublishItemSchema = z.object({
  position: z.number().int(),
  kind: ItemKindSchema,
  name: z.string().min(1).max(120),
  base: z.string().optional(),
  tradeQueryJson: z.unknown(),
  pick: z
    .object({
      listingUrl: z.string().optional(),
      pickedPriceValue: z.number(),
      pickedPriceCurrency: z.string(),
      sampleMin: z.number(),
      sampleMedian: z.number(),
      sampleAvg: z.number(),
      sampleSize: z.number().int().nonnegative(),
      rawSamples: z
        .array(z.object({ value: z.number(), currency: z.string() }))
        .max(50)
        .optional(),
      capturedAt: z.number().int(),
    })
    .optional(),
});

export const PublishListBodySchema = z.object({
  game: GameSchema,
  league: z.string().min(1).max(60),
  title: z.string().min(3).max(120),
  ascendancy: z.string().optional(),
  pobHash: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  buildLinks: z
    .array(
      z.object({ site: z.enum(["pobb", "maxroll", "poeninja", "poedb"]), externalKey: z.string() }),
    )
    .optional(),
  items: z.array(PublishItemSchema).max(100),
});
export type PublishListBody = z.infer<typeof PublishListBodySchema>;

// ── Extension message types ──────────────────────────────────────────────────

export type ExtMsg =
  | { type: "draft:get" }
  | { type: "draft:new"; name: string; league: string }
  | { type: "draft:add-search"; name: string; tradeUrl: string; capture: TradeCapture | null }
  | { type: "draft:update-search"; itemId: string; capture: TradeCapture }
  | { type: "draft:set-complete"; itemId: string; completed: boolean }
  | { type: "draft:rename-item"; itemId: string; name: string }
  | { type: "draft:delete-item"; itemId: string }
  | { type: "draft:unmark-all" }
  | { type: "draft:delete-list" }
  | { type: "capture:read" }
  | { type: "capture:result"; capture: TradeCapture | null }
  | { type: "capture:status"; available: boolean }
  | { type: "search-bar:get" }
  | { type: "auth:get" }
  | { type: "auth:login" }
  | { type: "auth:logout" }
  | { type: "follow:get" }
  | {
      type: "follow:add";
      slug: string;
      title: string;
      game: Game;
      league: string;
      authorDisplayName: string;
      updatedAt: number;
    }
  | { type: "follow:remove"; slug: string }
  | { type: "settings:get" }
  | { type: "settings:set"; settings: Partial<Settings> }
  | { type: "build-link:lookup"; site: string; key: string };

// ── Storage keys ─────────────────────────────────────────────────────────────

export const STORAGE = {
  drafts: "local:drafts",
  followed: "local:followed:v1",
  auth: "local:auth:v1",
  settings: "local:settings:v1",
  recentPurchases: "local:recentPurchases:v1",
} as const;
