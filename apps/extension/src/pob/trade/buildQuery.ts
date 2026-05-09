import type { ItemKind } from "@/types";
import type { PobPricingFilter } from "@/types/pobPricing";
import type { ParsedPobItemText } from "../itemText";
import { normalizeModText } from "../itemText";
import type { StatIndex } from "./statIndex";

export interface BuiltTradeQuery {
  query: unknown;
  filters: PobPricingFilter[];
}

export function buildItemTradeQuery(
  item: ParsedPobItemText,
  statIndex: StatIndex,
  matchPercent: number,
): BuiltTradeQuery {
  const filters = buildStatFilters(item, statIndex, matchPercent);
  const enabledFilters = filters.filter((filter) => filter.enabled);
  const query: Record<string, unknown> = {
    query: {
      status: { option: "securable" },
      filters: {
        trade_filters: { filters: { sale_type: { option: "priced" } } },
        misc_filters: { filters: { corrupted: { option: item.corrupted ? "true" : "false" } } },
      },
      stats: enabledFilters.length
        ? [{ type: "and", filters: enabledFilters.map(({ id, value }) => ({ id, value })) }]
        : [],
    },
    sort: { price: "asc" },
  };

  if (item.rarity === "Unique") {
    Object.assign(query.query as Record<string, unknown>, { name: item.name, type: item.base });
  } else {
    Object.assign(query.query as Record<string, unknown>, { type: item.base });
    const filtersObj = ((query.query as any).filters.misc_filters.filters ??= {});
    filtersObj.rarity = { option: item.rarity === "Rare" ? "nonunique" : "nonunique" };
  }

  return { query, filters };
}

export function buildGemTradeQuery(gem: {
  name: string;
  level?: number;
  quality?: number;
  variantId?: string;
  skillId?: string;
}): BuiltTradeQuery {
  const filters: PobPricingFilter[] = [];
  const misc: Record<string, unknown> = {};
  if (gem.level) {
    misc.gem_level = { min: gem.level };
    filters.push({
      id: "misc.gem_level",
      label: `Level ${gem.level}+`,
      category: "misc",
      value: { min: gem.level },
      enabled: true,
    });
  }
  if (gem.quality) {
    misc.gem_quality = { min: gem.quality };
    filters.push({
      id: "misc.gem_quality",
      label: `Quality ${gem.quality}+`,
      category: "misc",
      value: { min: gem.quality },
      enabled: true,
    });
  }

  return {
    filters,
    query: {
      query: {
        status: { option: "securable" },
        type: gem.name,
        filters: {
          trade_filters: { filters: { sale_type: { option: "priced" } } },
          type_filters: { filters: { category: { option: inferGemCategory(gem) } } },
          misc_filters: { filters: misc },
        },
        stats: [],
      },
      sort: { price: "asc" },
    },
  };
}

export function withEnabledStatFilters(query: unknown, filters: PobPricingFilter[]): unknown {
  const cloned = JSON.parse(JSON.stringify(query)) as { query?: { stats?: unknown[] } };
  const enabled = filters
    .filter((filter) => filter.enabled && !filter.id.startsWith("misc."))
    .map(({ id, value }) => ({ id, value }));
  if (cloned.query) {
    cloned.query.stats = enabled.length ? [{ type: "and", filters: enabled }] : [];
    const miscFilters = (cloned.query as any).filters?.misc_filters?.filters;
    if (miscFilters) {
      delete miscFilters.gem_level;
      delete miscFilters.gem_quality;
      for (const filter of filters.filter(
        (entry) => entry.enabled && entry.id.startsWith("misc."),
      )) {
        miscFilters[filter.id.slice("misc.".length)] = filter.value;
      }
    }
  }
  return cloned;
}

function buildStatFilters(
  item: ParsedPobItemText,
  statIndex: StatIndex,
  matchPercent: number,
): PobPricingFilter[] {
  const result: PobPricingFilter[] = [];
  const seen = new Set<string>();
  for (const [category, mods] of [
    ["implicit", item.implicits],
    ["explicit", item.explicits],
  ] as const) {
    for (const mod of mods) {
      const entry = findStat(category, mod, statIndex);
      if (!entry || seen.has(entry.id)) continue;
      seen.add(entry.id);
      const numeric = extractFirstNumber(mod);
      result.push({
        id: entry.id,
        label: entry.text,
        category,
        ...(numeric !== null ? { value: { min: Math.floor(numeric * (matchPercent / 100)) } } : {}),
        enabled: category === "implicit" || entry.id.startsWith("pseudo."),
      });
    }
  }
  return result;
}

function findStat(preferredCategory: string, mod: string, statIndex: StatIndex) {
  const normalized = normalizeModText(mod);
  const categories =
    preferredCategory === "implicit"
      ? ["implicit", "enchant", "explicit", "crafted", "fractured", "pseudo"]
      : ["explicit", "fractured", "crafted", "implicit", "enchant", "pseudo"];
  for (const category of categories) {
    const found = statIndex.categories[category]?.find((entry) => entry.text === normalized);
    if (found) return found;
  }
  return undefined;
}

function extractFirstNumber(text: string): number | null {
  const match = text.match(/[+-]?(\d+(?:\.\d+)?)/);
  return match ? Number.parseFloat(match[1]!) : null;
}

function inferGemCategory(gem: { name: string; skillId?: string }): string {
  return /support/i.test(gem.name) || /Support/i.test(gem.skillId ?? "")
    ? "gem.supportgem"
    : "gem.activegem";
}

export function inferKindFromParsed(item: ParsedPobItemText): ItemKind {
  return item.kind;
}
