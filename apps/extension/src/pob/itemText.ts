import type { ItemKind } from "@/types";

export interface ParsedPobItemText {
  rarity: string;
  name: string;
  base: string;
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

export function parsePobItemText(text: string, slot?: string): ParsedPobItemText | null {
  const lines = text
    .replace(/\^x[0-9a-fA-F]{6}/g, "")
    .replace(/\^\d/g, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rarityIndex = lines.findIndex((line) => line.startsWith("Rarity:"));
  if (rarityIndex < 0) return null;
  const rarity = lines[rarityIndex]?.replace("Rarity:", "").trim() || "Normal";
  const name = lines[rarityIndex + 1] ?? "Unknown item";
  const base = rarity === "Rare" || rarity === "Unique" ? (lines[rarityIndex + 2] ?? name) : name;

  const implicits: string[] = [];
  const explicits: string[] = [];
  const defenses: Record<string, number> = {};
  let corrupted = false;
  let implicitLinesRemaining = 0;

  for (const line of lines.slice(rarityIndex + 2)) {
    if (line === "--------") continue;
    if (line === "Corrupted") {
      corrupted = true;
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
    if (IGNORED_PREFIXES.some((prefix) => line.startsWith(prefix))) continue;
    if (/^\{.*\}$/.test(line)) continue;
    if (/^\w+:\s*$/.test(line)) continue;

    if (implicitLinesRemaining > 0) {
      implicits.push(line);
      implicitLinesRemaining -= 1;
    } else if (!line.startsWith("Rarity:")) {
      explicits.push(line);
    }
  }

  return {
    rarity,
    name,
    base,
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
  if (rarity === "Unique") return "unique";
  if (rarity === "Rare") return "rare";
  return "base";
}

export function normalizeModText(text: string): string {
  return text
    .replace(/[+-]?\d+(?:\.\d+)?/g, "#")
    .replace(/\s+/g, " ")
    .trim();
}
