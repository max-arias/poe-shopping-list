export interface StatIndexEntry {
  id: string;
  text: string;
  type?: string;
  option?: unknown;
}

export interface StatIndex {
  categories: Record<string, StatIndexEntry[]>;
  source?: "live" | "bundled";
  fetchedAt?: number;
}

let cached: Promise<StatIndex> | null = null;

export function loadStatIndex(): Promise<StatIndex> {
  cached ??= loadLiveStatIndex().catch(() => loadBundledStatIndex());
  return cached;
}

async function loadLiveStatIndex(): Promise<StatIndex> {
  const { sendMessage } = await import("@/utils/messages");
  const index = await sendMessage("csTradeStatsIndexGet", undefined);
  return assertStatIndex(index, "live");
}

async function loadBundledStatIndex(): Promise<StatIndex> {
  const response = await fetch(browser.runtime.getURL("/stat-index.json" as never));
  if (!response.ok) throw new Error("Failed to load bundled stat-index.json.");
  return assertStatIndex((await response.json()) as StatIndex, "bundled");
}

function assertStatIndex(index: StatIndex, fallbackSource: "live" | "bundled"): StatIndex {
  if (!index.categories || typeof index.categories !== "object") {
    throw new Error("Trade stat index is malformed.");
  }
  return { ...index, source: index.source ?? fallbackSource };
}
