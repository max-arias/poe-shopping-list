import type { ItemKind } from "@/types";

export interface ParsedPobItemText {
  rarity: string;
  name: string;
  base: string;
  slot?: string;
  itemClass?: string;
  kind: ItemKind;
  implicits: string[];
  explicits: string[];
  corrupted: boolean;
  defenses: Record<string, number>;
}

const IGNORED_PREFIXES = [
  "Requires",
  "Item Level",
  "Unique ID",
  "Radius",
  "Limited to",
  "Item Class",
  "Quality",
  "Sockets",
  "LevelReq",
];
const IGNORED_PREFIXES_LOWER = IGNORED_PREFIXES.map((prefix) => prefix.toLowerCase());

export function parsePobItemText(text: string, slot?: string): ParsedPobItemText | null {
  const lines = text
    .replace(/\^x[0-9a-fA-F]{6}/g, "")
    .replace(/\^\d/g, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rarityIndex = lines.findIndex((line) => /^rarity\s*:/i.test(line));
  if (rarityIndex < 0) return null;
  const rarity = normalizeRarity(
    lines[rarityIndex]?.replace(/^rarity\s*:/i, "").trim() || "Normal",
  );
  const name = lines[rarityIndex + 1] ?? "Unknown item";
  const hasSeparateBaseLine =
    isRarity(rarity, "Rare") || isRarity(rarity, "Unique") || isRarity(rarity, "Magic");
  const base = hasSeparateBaseLine ? (lines[rarityIndex + 2] ?? name) : name;

  const implicits: string[] = [];
  const explicits: string[] = [];
  const defenses: Record<string, number> = {};
  let corrupted = false;
  let itemClass: string | undefined;
  let implicitLinesRemaining = 0;

  for (const line of lines.slice(rarityIndex + (hasSeparateBaseLine ? 3 : 2))) {
    if (line === "--------") continue;
    if (/^corrupted$/i.test(line)) {
      corrupted = true;
      continue;
    }
    const itemClassMatch = line.match(/^item\s+class\s*:\s*(.+)$/i);
    if (itemClassMatch) {
      itemClass = itemClassMatch[1]!.trim();
      continue;
    }
    const implicitMatch = line.match(/^Implicits:\s*(\d+)/i);
    if (implicitMatch) {
      implicitLinesRemaining = Number.parseInt(implicitMatch[1] ?? "0", 10);
      continue;
    }
    const defenseMatch = line.match(/^(Armour|Evasion|Energy Shield|Ward):\s*(\d+)/i);
    if (defenseMatch) {
      defenses[defenseMatch[1]!.toLowerCase()] = Number.parseInt(defenseMatch[2]!, 10);
      continue;
    }
    const lowerLine = line.toLowerCase();
    if (IGNORED_PREFIXES_LOWER.some((prefix) => lowerLine.startsWith(prefix))) continue;
    if (/^\{.*\}$/.test(line)) continue;
    if (/^\w+:\s*$/.test(line)) continue;

    if (implicitLinesRemaining > 0) {
      implicits.push(line);
      implicitLinesRemaining -= 1;
    } else if (!/^rarity\s*:/i.test(line)) {
      explicits.push(line);
    }
  }

  return {
    rarity,
    name,
    base,
    ...(slot ? { slot } : {}),
    ...(itemClass ? { itemClass } : {}),
    kind: inferKind(rarity, base, slot),
    implicits,
    explicits,
    corrupted,
    defenses,
  };
}

function inferKind(rarity: string, base: string, slot?: string): ItemKind {
  if (/Flask/i.test(slot ?? base)) return "flask";
  if (/Cluster Jewel/i.test(base)) return "cluster";
  if (/Jewel/i.test(slot ?? base)) return "jewel";
  if (isRarity(rarity, "Unique")) return "unique";
  if (isRarity(rarity, "Rare")) return "rare";
  return "base";
}

export function isRarity(rarity: string, expected: string): boolean {
  return rarity.trim().toLowerCase() === expected.trim().toLowerCase();
}

function normalizeRarity(rarity: string): string {
  const normalized = rarity.trim().toLowerCase();
  if (normalized === "unique") return "Unique";
  if (normalized === "rare") return "Rare";
  if (normalized === "magic") return "Magic";
  if (normalized === "normal") return "Normal";
  return rarity.trim();
}

export function normalizeModText(text: string): string {
  return text
    .replace(/[+-]?\d+(?:\.\d+)?/g, "#")
    .replace(/\s+/g, " ")
    .trim();
}
