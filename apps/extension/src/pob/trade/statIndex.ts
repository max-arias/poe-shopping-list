export interface StatIndexEntry {
  id: string;
  text: string;
}

export interface StatIndex {
  categories: Record<string, StatIndexEntry[]>;
}

let cached: Promise<StatIndex> | null = null;

export function loadStatIndex(): Promise<StatIndex> {
  cached ??= fetch(browser.runtime.getURL("/stat-index.json" as never)).then(async (response) => {
    if (!response.ok) throw new Error("Failed to load bundled stat-index.json.");
    const json = (await response.json()) as StatIndex;
    if (!json.categories || typeof json.categories !== "object") {
      throw new Error("Bundled stat-index.json is malformed.");
    }
    return json;
  });
  return cached;
}
