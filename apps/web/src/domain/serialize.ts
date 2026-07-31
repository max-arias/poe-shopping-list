import { publishedListSchema, shareableListSchema, type PublishedList, type ShareableList } from "./schemas";

/** Convert a Published List to the sole portable v1 contract, in source order. */
export function serializeShareableList(input: PublishedList): ShareableList {
  const list = publishedListSchema.parse(input);
  return shareableListSchema.parse({
    format: "poe-shopping-list",
    version: 1,
    title: list.title,
    ...(list.overview === undefined ? {} : { overview: list.overview }),
    items: list.items.map((item) => ({
      title: item.title,
      tradeUrl: item.tradeUrl,
      ...(item.quantity === undefined ? {} : { quantity: item.quantity }),
      ...(item.variant === undefined ? {} : { variant: item.variant }),
      ...(item.rationale === undefined ? {} : { note: item.rationale }),
    })),
  });
}
