import type { SearchFilterEntry, SearchFilterSnapshot } from "@/types";

export type SearchFilterMutationKind =
  | "crafted"
  | "crucible"
  | "enchant"
  | "explicit"
  | "fractured"
  | "implicit"
  | "pseudo"
  | "scourge"
  | "veiled";

const MUTATION_KINDS: SearchFilterMutationKind[] = [
  "implicit",
  "pseudo",
  "explicit",
  "fractured",
  "scourge",
  "crafted",
  "crucible",
  "enchant",
  "veiled",
];

export function flattenSearchFilterEntries(
  snapshot?: SearchFilterSnapshot | null,
): SearchFilterEntry[] {
  return snapshot?.groups.flatMap((group) => group.entries) ?? [];
}

export function formatSearchFilterEntry(entry: SearchFilterEntry): string {
  const rendered = entry.values
    .map((value) => value.value)
    .filter(Boolean)
    .join(" ");
  return rendered ? `${entry.label}: ${rendered}` : entry.label;
}

export function getSearchFilterDisplayValues(entry: SearchFilterEntry): string[] {
  return entry.values.map((value) => value.value).filter(Boolean);
}

export function parseSearchFilterMutationLabel(label: string): {
  kind: SearchFilterMutationKind | null;
  text: string;
} {
  const trimmed = label.trim();
  const lower = trimmed.toLowerCase();
  const kind = MUTATION_KINDS.find((candidate) => lower.startsWith(candidate));
  if (!kind) return { kind: null, text: trimmed };

  return {
    kind,
    text: trimmed.slice(kind.length).trim(),
  };
}

export function summarizeSearchFilters(
  snapshot?: SearchFilterSnapshot | null,
  limit = 3,
): string | null {
  const entries = flattenSearchFilterEntries(snapshot);
  if (entries.length === 0) return null;

  const visible = entries.slice(0, limit).map(formatCompactEntry);
  const remaining = entries.length - visible.length;
  return `filters: ${visible.join(", ")}${remaining > 0 ? ` +${remaining} more` : ""}`;
}

export function formatCompactSearchFilterEntry(entry: SearchFilterEntry): {
  label: string;
  values: string[];
} {
  const range = entry.values.find((value) => value.label === "range")?.value;
  const value = entry.values.find((item) => item.label === "value")?.value;
  const other = entry.values
    .filter((item) => item.label !== "range" && item.label !== "value")
    .map((item) => item.value)
    .filter(Boolean);
  return {
    label: entry.label,
    values: [value, range, ...other].filter((item): item is string => Boolean(item)),
  };
}

function formatCompactEntry(entry: SearchFilterEntry): string {
  const compact = formatCompactSearchFilterEntry(entry);
  return [compact.label, ...compact.values].join(" ");
}
