import { z } from 'zod';

export const RawListingSchema = z.object({
  listingId: z.string(),
  priceValue: z.number(),
  priceCurrency: z.string(),
});
export type RawListing = z.infer<typeof RawListingSchema>;

export const TradeCaptureSchema = z.object({
  tradeUrl: z.string(),
  samples: z.array(RawListingSchema),
  aggregates: z.object({
    min: z.number(),
    median: z.number(),
    avg: z.number(),
    sampleSize: z.number().int().nonnegative(),
    currency: z.string(),
  }),
  capturedAt: z.number().int(),
});
export type TradeCapture = z.infer<typeof TradeCaptureSchema>;
