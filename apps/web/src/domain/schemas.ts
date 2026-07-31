import { z } from "astro/zod";

const nonBlank = z.string().min(1).refine((value) => value.trim().length > 0);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be a lowercase slug");

export const tradeUrlSchema = z.string().url().refine((value) => {
  const url = new URL(value);
  return (
    url.protocol === "https:" &&
    url.hostname === "www.pathofexile.com" &&
    url.pathname.startsWith("/trade/search/") &&
    url.pathname.length > "/trade/search/".length &&
    url.username === "" &&
    url.password === "" &&
    url.hash === ""
  );
}, "tradeUrl must be a direct official Path of Exile Trade search URL");

export const publishedItemSchema = z.object({
  title: nonBlank,
  tradeUrl: tradeUrlSchema,
  quantity: z.number().int().positive().optional(),
  variant: nonBlank.optional(),
  rationale: nonBlank.optional(),
}).strict().superRefine((item, context) => {
  if (item.quantity === undefined && item.variant === undefined) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["quantity"], message: "quantity or variant is required" });
  }
});

export const applicabilitySchema = z.object({
  game: z.literal("poe1"),
  league: nonBlank.optional(),
  evergreen: z.boolean().optional(),
}).strict().refine(
  (value) => (value.league !== undefined) !== (value.evergreen === true),
  "applicability must specify exactly one league or evergreen",
);

export const publishedListSchema = z.object({
  title: nonBlank,
  overview: nonBlank.optional(),
  category: slug,
  tags: z.array(slug),
  applicability: applicabilitySchema,
  items: z.array(publishedItemSchema).min(1),
}).strict();

export const shareableListItemSchema = z.object({
  title: nonBlank,
  tradeUrl: z.string().url().refine((value) => value.startsWith("http://") || value.startsWith("https://")),
  quantity: z.number().int().positive().optional(),
  variant: z.string().optional(),
  note: z.string().optional(),
}).strict();

export const shareableListSchema = z.object({
  format: z.literal("poe-shopping-list"),
  version: z.literal(1),
  title: nonBlank,
  overview: z.string().optional(),
  items: z.array(shareableListItemSchema),
}).strict();

export type PublishedList = z.infer<typeof publishedListSchema>;
export type PublishedItem = z.infer<typeof publishedItemSchema>;
export type ShareableList = z.infer<typeof shareableListSchema>;
