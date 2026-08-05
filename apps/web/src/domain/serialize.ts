import { publishedListSchema, shareableListSchema, type PublishedItem, type PublishedList, type ShareableList } from "./schemas";
import { normalizePublishedListGroups } from "./groups";

/** Convert a Published List to the sole portable v1 contract, in source order. */
export function serializeShareableList(input: PublishedList): ShareableList {
  const list = publishedListSchema.parse(input);
  return shareableListSchema.parse({
    format: "poe-shopping-list",
    version: 1,
    title: list.title,
    ...(list.overview === undefined ? {} : { overview: list.overview }),
    groups: normalizePublishedListGroups(list).map((group) => ({
      ...(group.title === undefined ? {} : { title: group.title }),
      items: group.items.map(toShareableItem),
    })),
  });
}

function toShareableItem(item: PublishedItem) {
  return {
    title: item.title,
    tradeUrl: item.tradeUrl,
    ...(item.variant === undefined ? {} : { variant: item.variant }),
    ...(item.rationale === undefined ? {} : { note: item.rationale }),
  };
}
