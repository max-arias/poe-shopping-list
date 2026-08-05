import {
  ShareableListItemSchema,
  shareableListGroupSchema,
  ShareableListGroupSchema,
  ShareableListSchema,
  type ShareableList,
  type ShareableListItem,
  type ShareableListGroup,
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

export { ShareableListItemSchema, shareableListGroupSchema, ShareableListGroupSchema, ShareableListSchema };
export type { ShareableList, ShareableListItem, ShareableListGroup };

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

export const DraftGroupSchema = z
  .object({
    id: z.string(),
    title: TitleSchema.optional(),
    position: z.number().int(),
    items: z.array(DraftItemSchema),
  })
  .strict();
export type DraftGroup = z.infer<typeof DraftGroupSchema>;

export const DraftSchema = z
  .object({
    id: z.string(),
    title: TitleSchema,
    overview: z.string().optional(),
    createdAt: z.number().int(),
    groups: z.array(DraftGroupSchema),
  })
  .strict();
export type Draft = z.infer<typeof DraftSchema>;
