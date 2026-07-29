import { z } from "zod";

const TitleSchema = z
  .string()
  .min(1)
  .refine((value) => value.trim().length > 0);

const TradeUrlSchema = z
  .string()
  .url()
  .refine(
    (value) => value.startsWith("http://") || value.startsWith("https://"),
    "tradeUrl must be an HTTP(S) URL",
  );

export const ShareableListItemSchema = z
  .object({
    title: TitleSchema,
    tradeUrl: TradeUrlSchema,
    quantity: z.number().int().positive().optional(),
    variant: z.string().optional(),
    note: z.string().optional(),
  })
  .strict();
export type ShareableListItem = z.infer<typeof ShareableListItemSchema>;

export const ShareableListSchema = z
  .object({
    format: z.literal("poe-shopping-list"),
    version: z.literal(1),
    title: TitleSchema,
    overview: z.string().optional(),
    items: z.array(ShareableListItemSchema),
  })
  .strict();
export type ShareableList = z.infer<typeof ShareableListSchema>;

export const DraftItemSchema = z
  .object({
    id: z.string(),
    position: z.number().int(),
    title: TitleSchema,
    tradeUrl: TradeUrlSchema,
    quantity: z.number().int().positive().optional(),
    variant: z.string().optional(),
    note: z.string().optional(),
    completed: z.boolean(),
    addedAt: z.number().int(),
  })
  .strict();
export type DraftItem = z.infer<typeof DraftItemSchema>;

export const DraftSchema = z
  .object({
    id: z.string(),
    title: TitleSchema,
    overview: z.string().optional(),
    createdAt: z.number().int(),
    items: z.array(DraftItemSchema),
  })
  .strict();
export type Draft = z.infer<typeof DraftSchema>;
