import type { ItemKind } from "@/types";
import type { PobPricingFilter } from "@/types/pobPricing";
import type { ParsedPobItemText } from "../itemText";
import { isRarity, normalizeModText } from "../itemText";
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
  const statFilters = filters.map(toTradeStatFilter).slice(0, 25);
  const typeFilters: Record<string, unknown> = {};
  const miscFilters: Record<string, unknown> = {
    mirrored: { option: "false" },
    corrupted: { option: item.corrupted ? "true" : "false" },
  };
  const category = inferTradeCategory(item);
  if (category) typeFilters.category = { option: category };

  const query: Record<string, unknown> = {
    query: {
      status: { option: "securable" },
      filters: {
        type_filters: { filters: typeFilters, disabled: false },
        misc_filters: { filters: miscFilters, disabled: false },
      },
      ...(statFilters.length
        ? { stats: [{ type: "and", filters: statFilters, disabled: false }] }
        : {}),
    },
    sort: { price: "asc" },
  };

  if (isRarity(item.rarity, "Unique")) {
    assignUniqueName(query.query as Record<string, unknown>, item);
    assignBaseType(query.query as Record<string, unknown>, item);
  } else {
    assignBaseType(query.query as Record<string, unknown>, item);
    typeFilters.rarity = { option: inferRarityOption(item.rarity) };
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
          type_filters: {
            filters: { category: { option: inferGemCategory(gem) } },
            disabled: false,
          },
          misc_filters: { filters: misc, disabled: false },
        },
      },
      sort: { price: "asc" },
    },
  };
}

export function withEnabledStatFilters(query: unknown, filters: PobPricingFilter[]): unknown {
  const cloned = JSON.parse(JSON.stringify(query)) as { query?: { stats?: unknown[] } };
  const statFilters = filters
    .filter((filter) => !filter.id.startsWith("misc."))
    .map(toTradeStatFilter);
  if (cloned.query) {
    if (statFilters.length) {
      cloned.query.stats = [{ type: "and", filters: statFilters.slice(0, 25), disabled: false }];
    } else {
      delete cloned.query.stats;
    }
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

function toTradeStatFilter(filter: PobPricingFilter): Record<string, unknown> {
  return {
    id: filter.id,
    ...(filter.value ? { value: filter.value } : {}),
    disabled: !filter.enabled,
  };
}

function assignUniqueName(query: Record<string, unknown>, item: ParsedPobItemText): void {
  const name = item.name.trim();
  if (name && name !== "Unknown item") query.name = name;
}

function assignBaseType(query: Record<string, unknown>, item: ParsedPobItemText): void {
  if (!isReliableBaseType(item)) return;
  query.type = item.base;
}

function isReliableBaseType(item: ParsedPobItemText): boolean {
  if (!item.base || item.base === item.name) return false;
  if (item.base === "Unknown item") return false;
  return true;
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
  const normalized = canonicalStatText(mod);
  const categories =
    preferredCategory === "implicit"
      ? ["implicit", "enchant", "explicit", "crafted", "fractured", "pseudo"]
      : ["explicit", "fractured", "crafted", "implicit", "enchant", "pseudo"];
  for (const category of categories) {
    const found = statIndex.categories[category]?.find(
      (entry) => canonicalStatText(entry.text) === normalized,
    );
    if (found) return found;
  }
  return undefined;
}

function inferRarityOption(rarity: string): string {
  if (isRarity(rarity, "Rare")) return "rare";
  if (isRarity(rarity, "Magic")) return "magic";
  return "nonunique";
}

function inferTradeCategory(item: ParsedPobItemText): string | undefined {
  const slot = item.slot ?? "";
  const base = item.base;
  const itemClass = item.itemClass ?? "";
  const fromClass = inferTradeCategoryFromItemClass(itemClass);
  if (fromClass) return fromClass;

  if (/Helmet/i.test(slot)) return "armour.helmet";
  if (/Body Armour|Chest/i.test(slot)) return "armour.chest";
  if (/Gloves/i.test(slot)) return "armour.gloves";
  if (/Boots/i.test(slot)) return "armour.boots";
  if (/Belt/i.test(slot)) return "accessory.belt";
  if (/Amulet/i.test(slot)) return "accessory.amulet";
  if (/Ring/i.test(slot)) return "accessory.ring";
  if (/Flask/i.test(slot) || item.kind === "flask") return "flask";
  if (/Cluster Jewel/i.test(base)) return "jewel.cluster";
  if (/Ghastly|Hypnotic|Murderous|Searching Eye Jewel/i.test(base)) return "jewel.abyss";
  if (/Jewel/i.test(slot) || item.kind === "jewel") return "jewel";
  if (/Bow/i.test(base)) return "weapon.bow";
  if (/Wand/i.test(base)) return "weapon.wand";
  if (/Claw/i.test(base)) return "weapon.claw";
  if (/Sceptre/i.test(base)) return "weapon.sceptre";
  if (/Shield|Buckler|Spirit Shield/i.test(base)) return "armour.shield";
  if (/Quiver/i.test(base)) return "armour.quiver";
  return undefined;
}

function inferTradeCategoryFromItemClass(itemClass: string): string | undefined {
  const normalized = itemClass.trim().toLowerCase().replace(/\s+/g, " ");
  if (!normalized) return undefined;
  if (normalized === "bows") return "weapon.bow";
  if (normalized === "claws") return "weapon.claw";
  if (normalized === "daggers") return "weapon.dagger";
  if (normalized === "rune daggers") return "weapon.runedagger";
  if (normalized === "one hand axes") return "weapon.oneaxe";
  if (normalized === "two hand axes") return "weapon.twoaxe";
  if (normalized === "one hand maces") return "weapon.onemace";
  if (normalized === "two hand maces") return "weapon.twomace";
  if (normalized === "sceptres") return "weapon.sceptre";
  if (normalized === "staves") return "weapon.staff";
  if (normalized === "warstaves") return "weapon.warstaff";
  if (normalized === "one hand swords") return "weapon.onesword";
  if (normalized === "two hand swords") return "weapon.twosword";
  if (normalized === "wands") return "weapon.wand";
  if (normalized === "quivers") return "armour.quiver";
  if (normalized === "shields") return "armour.shield";
  return undefined;
}

function extractFirstNumber(text: string): number | null {
  const match = text.match(/[+-]?(\d+(?:\.\d+)?)/);
  return match ? Number.parseFloat(match[1]!) : null;
}

function canonicalStatText(text: string): string {
  return normalizeModText(text).toLowerCase();
}

function inferGemCategory(gem: { name: string; skillId?: string }): string {
  return /support/i.test(gem.name) || /support/i.test(gem.skillId ?? "")
    ? "gem.supportgem"
    : "gem.activegem";
}

export function inferKindFromParsed(item: ParsedPobItemText): ItemKind {
  return item.kind;
}
