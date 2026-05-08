import { z } from "zod";
import { SearchFilterSnapshotSchema } from "./searchFilters";

export const VisitHistoryItemSchema = z.object({
  id: z.string(),
  url: z.string(),
  name: z.string().optional(),
  filters: SearchFilterSnapshotSchema.optional(),
  addedAt: z.number().int(),
});
export type VisitHistoryItem = z.infer<typeof VisitHistoryItemSchema>;
