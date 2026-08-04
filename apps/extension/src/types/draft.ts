import {
  ShareableListItemSchema,
  ShareableListSchema,
  type ShareableList,
  type ShareableListItem,
} from "@poe-sl/shareable-list";
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

export { ShareableListItemSchema, ShareableListSchema };
export type { ShareableList, ShareableListItem };

export const DraftItemSchema = z
  .object({
    id: z.string(),
    position: z.number().int(),
    title: TitleSchema,
    tradeUrl: TradeUrlSchema,
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
