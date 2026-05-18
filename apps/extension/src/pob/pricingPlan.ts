import type { PobPricingPlanItem } from "@/types/pobPricing";
import { sendMessage } from "@/utils/messages";
import { isRarity, parsePobItemText } from "./itemText";
import type { PobParsedBuild, PobRawEntry } from "./parseXml";
import { buildGemTradeQuery, buildItemTradeQuery } from "./trade/buildQuery";
import { buildTradeUrl, hashQuery } from "./trade/buildUrl";
import type { StatIndex } from "./trade/statIndex";

export interface PobPlanOptions {
  buildUrl: string;
  league: string;
  selectedItemSetIds: Set<string>;
  selectedSkillGroupIds: Set<string>;
  matchPercent: number;
}

export async function buildPricingPlan(
  parsed: PobParsedBuild,
  statIndex: StatIndex,
  options: PobPlanOptions,
): Promise<PobPricingPlanItem[]> {
  const items: PobPricingPlanItem[] = [];
  const seen = new Set<string>();
  for (const entry of parsed.entries) {
    if (!isEntrySelected(entry, options)) continue;
    const built = await buildPlanItem(entry, statIndex, options);
    if (!built || seen.has(built.queryHash)) continue;
    seen.add(built.queryHash);
    items.push(built);
  }
  return items;
}

async function buildPlanItem(
  entry: PobRawEntry,
  statIndex: StatIndex,
  options: PobPlanOptions,
): Promise<PobPricingPlanItem | null> {
  if (entry.type === "gem" && entry.gem) {
    const built = buildGemTradeQuery(entry.gem);
    const queryHash = await hashQuery(built.query);
    return {
      id: entry.id,
      name: entry.gem.name,
      kind: "gem",
      tradeUrl: buildTradeUrl(options.league, built.query),
      tradeQuery: built.query,
      queryHash,
      filters: built.filters,
      source: {
        type: "pob",
        buildUrl: options.buildUrl,
        ...(entry.skillGroupId ? { skillGroupId: entry.skillGroupId } : {}),
        ...(entry.skillGroupName ? { skillGroupName: entry.skillGroupName } : {}),
      },
    };
  }

  if (!entry.itemText) return null;
  const parsed = parsePobItemText(entry.itemText, entry.slot);
  if (!parsed) return null;
  sendMessage("csDebugLog", {
    timestamp: Date.now(),
    level: "warn",
    source: "pob.pricingPlan",
    step: "pob:item:parsed",
    message: "Parsed PoB item text before trade-query generation",
    data: {
      entryId: entry.id,
      entryType: entry.type,
      slot: entry.slot,
      itemSetId: entry.itemSetId,
      itemSetName: entry.itemSetName,
      pobItemId: entry.pobItemId,
      parsed,
      rawItemText: entry.itemText,
    },
  }).catch(() => {});
  const built = buildItemTradeQuery(parsed, statIndex, options.matchPercent);
  const queryHash = await hashQuery(built.query);
  return {
    id: entry.id,
    name: isRarity(parsed.rarity, "Unique") ? parsed.name : `${parsed.name} ${parsed.base}`,
    kind: parsed.kind,
    base: parsed.base,
    tradeUrl: buildTradeUrl(options.league, built.query),
    tradeQuery: built.query,
    queryHash,
    filters: built.filters,
    source: {
      type: "pob",
      buildUrl: options.buildUrl,
      ...(entry.itemSetId ? { itemSetId: entry.itemSetId } : {}),
      ...(entry.itemSetName ? { itemSetName: entry.itemSetName } : {}),
      ...(entry.slot ? { slot: entry.slot } : {}),
      ...(entry.pobItemId ? { pobItemId: entry.pobItemId } : {}),
    },
  };
}

function isEntrySelected(entry: PobRawEntry, options: PobPlanOptions): boolean {
  if (entry.itemSetId && !options.selectedItemSetIds.has(entry.itemSetId)) return false;
  if (entry.skillGroupId && !options.selectedSkillGroupIds.has(entry.skillGroupId)) return false;
  return entry.type !== "gem" || entry.gem?.enabled !== false;
}
