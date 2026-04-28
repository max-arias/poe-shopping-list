import type { ApiListDetail, PublishListBody } from "@poe-sl/schema";

const API_BASE = import.meta.env.VITE_API_BASE ?? "https://api.poe-sl.com";

export function useApi() {
  async function getList(slug: string): Promise<ApiListDetail> {
    const res = await fetch(`${API_BASE}/lists/${slug}`);
    if (res.status === 410) throw Object.assign(new Error("list_deleted"), { status: 410 });
    if (!res.ok) throw Object.assign(new Error(`api_error_${res.status}`), { status: res.status });
    return res.json();
  }

  async function getLists(params: Record<string, string> = {}): Promise<unknown> {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/lists${qs ? `?${qs}` : ""}`);
    if (!res.ok) throw new Error(`api_error_${res.status}`);
    return res.json();
  }

  async function publishList(body: PublishListBody): Promise<{ slug: string }> {
    const res = await fetch(`${API_BASE}/lists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`api_error_${res.status}`);
    return res.json();
  }

  async function lookupBuildLink(
    site: string,
    key: string,
  ): Promise<{
    matches: { slug: string; title: string; game: string; league: string; published_at: number }[];
  }> {
    const res = await fetch(
      `${API_BASE}/build-links/lookup?site=${encodeURIComponent(site)}&key=${encodeURIComponent(key)}`,
    );
    if (!res.ok) throw new Error(`api_error_${res.status}`);
    return res.json();
  }

  return { getList, getLists, publishList, lookupBuildLink };
}
