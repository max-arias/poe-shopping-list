import { z } from "zod";

export const VisitHistoryItemSchema = z.object({
  id: z.string(),
  url: z.string(),
  name: z.string().optional(),
  addedAt: z.number().int(),
});
export type VisitHistoryItem = z.infer<typeof VisitHistoryItemSchema>;
