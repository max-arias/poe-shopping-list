import type { PublishedItem, PublishedList } from "./schemas";

export type NormalizedPublishedListGroup = {
  title?: string;
  items: PublishedItem[];
};

/** Return authored content as ordered groups without changing its source order. */
export function normalizePublishedListGroups(list: PublishedList): NormalizedPublishedListGroup[] {
  if ("groups" in list) return list.groups;
  return [{ items: list.items }];
}
