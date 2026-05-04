import { GameSchema } from "./game";
import { ItemKindSchema } from "./item";
import { TradeCaptureSchema } from "./trade";

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

export const DraftSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(80),
  game: GameSchema.default("poe1"),
  league: z.string(),
  createdAt: z.number().int(),
  items: z.array(DraftItemSchema),
  buildUrl: z.string().url().optional(),
  buildCreator: z.string().max(80).optional(),
  associatedUrls: z.array(z.string().url()).optional(),
});
export type Draft = z.infer<typeof DraftSchema>;