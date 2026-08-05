import { z } from "astro/zod";
import {
  shareableListGroupSchema,
  shareableListItemSchema,
  shareableListSchema,
  type ShareableList,
} from "@poe-sl/shareable-list";

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
  variant: nonBlank.optional(),
  rationale: nonBlank.optional(),
}).strict();

export const publishedListGroupSchema = z.object({
  title: nonBlank,
  items: z.array(publishedItemSchema).min(1),
}).strict();

export const applicabilitySchema = z.object({
  game: z.literal("poe1"),
  league: nonBlank.optional(),
  evergreen: z.boolean().optional(),
}).strict().refine(
  (value) => (value.league !== undefined) !== (value.evergreen === true),
  "applicability must specify exactly one league or evergreen",
);

const publishedListMetadataSchema = z.object({
  title: nonBlank,
  overview: nonBlank.optional(),
  category: slug,
  tags: z.array(slug),
  applicability: applicabilitySchema,
}).strict();

export const publishedListSchema = z.union([
  publishedListMetadataSchema.extend({ items: z.array(publishedItemSchema).min(1) }).strict(),
  publishedListMetadataSchema.extend({ groups: z.array(publishedListGroupSchema).min(1) }).strict(),
]);

export { shareableListGroupSchema, shareableListItemSchema, shareableListSchema };

export type PublishedList = z.infer<typeof publishedListSchema>;
export type PublishedItem = z.infer<typeof publishedItemSchema>;
export type PublishedListGroup = z.infer<typeof publishedListGroupSchema>;
export type { ShareableList };
