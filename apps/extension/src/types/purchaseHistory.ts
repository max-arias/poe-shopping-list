import { z } from 'zod';

export const PurchaseHistoryItemSchema = z.object({
  id: z.string(),
  listingId: z.string(),
  name: z.string(),
  base: z.string().optional(),
  priceValue: z.number(),
  priceCurrency: z.string(),
  searchUrl: z.string(),
  addedAt: z.number().int(),
});
export type PurchaseHistoryItem = z.infer<typeof PurchaseHistoryItemSchema>;
