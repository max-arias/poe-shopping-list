import { z } from "zod";

export const SearchFilterValueSchema = z.object({
  label: z.string(),
  value: z.string(),
});
export type SearchFilterValue = z.infer<typeof SearchFilterValueSchema>;

export const SearchFilterEntrySchema = z.object({
  label: z.string(),
  values: z.array(SearchFilterValueSchema),
});
export type SearchFilterEntry = z.infer<typeof SearchFilterEntrySchema>;

export const SearchFilterGroupSchema = z.object({
  label: z.string(),
  entries: z.array(SearchFilterEntrySchema),
});
export type SearchFilterGroup = z.infer<typeof SearchFilterGroupSchema>;

export const SearchFilterSnapshotSchema = z.object({
  game: z.literal("poe1"),
  tradeUrl: z.string(),
  searchText: z.string().optional(),
  capturedAt: z.number().int(),
  groups: z.array(SearchFilterGroupSchema),
});
export type SearchFilterSnapshot = z.infer<typeof SearchFilterSnapshotSchema>;
