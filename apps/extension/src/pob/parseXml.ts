export interface PobItemSetSummary {
  id: string;
  name: string;
  active: boolean;
}

export interface PobSkillGroupSummary {
  id: string;
  name: string;
  enabled: boolean;
}

export interface PobRawEntry {
  id: string;
  type: "item" | "gem";
  label: string;
  slot?: string;
  itemSetId?: string;
  itemSetName?: string;
  skillGroupId?: string;
  skillGroupName?: string;
  pobItemId?: string;
  itemText?: string;
  gem?: {
    name: string;
    level?: number;
    quality?: number;
    variantId?: string;
    skillId?: string;
    enabled: boolean;
  };
}

export interface PobParsedBuild {
  title: string;
  itemSets: PobItemSetSummary[];
  skillGroups: PobSkillGroupSummary[];
  entries: PobRawEntry[];
}

const EQUIPMENT_SLOTS = new Set([
  "Weapon 1",
  "Weapon 2",
  "Weapon 1 Swap",
  "Weapon 2 Swap",
  "Helmet",
  "Body Armour",
  "Gloves",
  "Boots",
  "Belt",
  "Amulet",
  "Ring 1",
  "Ring 2",
  "Flask 1",
  "Flask 2",
  "Flask 3",
  "Flask 4",
  "Flask 5",
]);

export function parsePobXml(xml: string): PobParsedBuild {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) throw new Error("Decoded PoB XML is malformed.");

  const root = doc.documentElement;
  if (!["PathOfBuilding", "PathOfBuilding2"].includes(root.tagName)) {
    throw new Error("Unsupported PoB XML root.");
  }
  const buildEl = doc.querySelector("Build");
  const targetVersion = buildEl?.getAttribute("targetVersion");
  if (targetVersion && targetVersion !== "3_0") {
    throw new Error("Only PoE1 Path of Building exports are supported.");
  }

  const title =
    buildEl?.getAttribute("title") ||
    buildEl?.getAttribute("className") ||
    doc.querySelector("Build > PlayerStat[stat='FullDPS']")?.getAttribute("value") ||
    "PoB build";

  const itemTexts = new Map<string, string>();
  for (const item of doc.querySelectorAll("Items > Item[id]")) {
    const id = item.getAttribute("id");
    if (id) itemTexts.set(id, item.textContent ?? "");
  }

  const itemsRoot = doc.querySelector("Items");
  const activeItemSetId = itemsRoot?.getAttribute("activeItemSet") ?? undefined;
  const itemSets: PobItemSetSummary[] = [];
  const entries: PobRawEntry[] = [];

  for (const itemSet of doc.querySelectorAll("Items > ItemSet[id]")) {
    const itemSetId = itemSet.getAttribute("id") ?? "0";
    const itemSetName =
      itemSet.getAttribute("title") || itemSet.getAttribute("name") || `Item Set ${itemSetId}`;
    itemSets.push({ id: itemSetId, name: itemSetName, active: itemSetId === activeItemSetId });

    for (const slot of itemSet.querySelectorAll("Slot[itemId]")) {
      const slotName = slot.getAttribute("name") ?? "Unknown";
      if (!EQUIPMENT_SLOTS.has(slotName)) continue;
      const pobItemId = slot.getAttribute("itemId") ?? undefined;
      if (!pobItemId || pobItemId === "0") continue;
      const itemText = itemTexts.get(pobItemId);
      if (!itemText?.trim()) continue;
      entries.push({
        id: `item:${itemSetId}:${slotName}:${pobItemId}`,
        type: "item",
        label: slotName,
        slot: slotName,
        itemSetId,
        itemSetName,
        pobItemId,
        itemText,
      });
    }
  }

  for (const socket of doc.querySelectorAll("Tree Spec Socket[itemId]")) {
    const pobItemId = socket.getAttribute("itemId") ?? undefined;
    if (!pobItemId || pobItemId === "0") continue;
    const itemText = itemTexts.get(pobItemId);
    if (!itemText?.trim()) continue;
    entries.push({
      id: `jewel:${pobItemId}`,
      type: "item",
      label: "Passive tree jewel",
      slot: "Jewel",
      pobItemId,
      itemText,
    });
  }

  const skillGroups: PobSkillGroupSummary[] = [];
  for (const [index, skill] of [...doc.querySelectorAll("Skills > Skill")].entries()) {
    const skillGroupId = skill.getAttribute("id") || String(index + 1);
    const gems = [...skill.querySelectorAll("Gem")];
    const firstGemName = gems.find((gem) => getGemName(gem))
      ? getGemName(gems.find((gem) => getGemName(gem))!)
      : undefined;
    const skillGroupName =
      skill.getAttribute("label") ||
      skill.getAttribute("name") ||
      firstGemName ||
      `Skill Group ${skillGroupId}`;
    const enabled = !isFalse(skill.getAttribute("enabled"));
    skillGroups.push({ id: skillGroupId, name: skillGroupName, enabled });

    for (const [gemIndex, gem] of gems.entries()) {
      const name = getGemName(gem);
      if (!name) continue;
      entries.push({
        id: `gem:${skillGroupId}:${gemIndex}:${name}`,
        type: "gem",
        label: name,
        skillGroupId,
        skillGroupName,
        gem: {
          name,
          level: parseOptionalInt(gem.getAttribute("level")),
          quality: parseOptionalInt(gem.getAttribute("quality")),
          variantId: gem.getAttribute("variantId") ?? undefined,
          skillId: gem.getAttribute("skillId") ?? undefined,
          enabled: enabled && !isFalse(gem.getAttribute("enabled")),
        },
      });
    }
  }

  return { title, itemSets, skillGroups, entries };
}

function getGemName(gem: Element): string {
  return (
    gem.getAttribute("nameSpec") || gem.getAttribute("name") || gem.getAttribute("skillId") || ""
  );
}

function parseOptionalInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isFalse(value: string | null): boolean {
  return value === "false" || value === "False" || value === "0";
}
