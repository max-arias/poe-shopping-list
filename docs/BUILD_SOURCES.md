# Build Sources

Where to scrape build listings from (name, creator, URL). These feed the catalog so users can find and follow a build without providing their own PoB code.

Canonical reference: [PoE Wiki — List of community websites](https://www.poewiki.net/wiki/List_of_Path_of_Exile_community_websites)

---

## Source Comparison

| Site            | Type                  | API?                | Name              | Creator       | URL pattern                                        |
| --------------- | --------------------- | ------------------- | ----------------- | ------------- | -------------------------------------------------- |
| poe.ninja       | Ladder characters     | **Unofficial JSON** | character name    | account name  | `/poe1/builds/<league>/character/<account>/<char>` |
| maxroll.gg      | Editorial guides      | No — HTML           | guide title       | author        | `/poe/build-guides/<slug>`                         |
| mobalytics.gg   | Editorial + community | No — HTML           | guide/build title | author        | `/poe/builds/<slug>`                               |
| poe-vault.com   | Editorial guides      | No — HTML           | guide title       | author        | `/guides/<slug>`                                   |
| pobarchives.com | Community PoB archive | No — HTML           | build title       | uploader      | `/builds/<id>`                                     |
| poebuilds.cc    | Curated per-patch     | No — HTML           | guide title       | author        | `/poe/<slug>`                                      |
| poebuilds.net   | Build guides          | No — HTML           | guide title       | author        | unknown                                            |
| PoE Forums      | Community threads     | GGG public API      | thread title      | forum account | `/forum/view-thread/<id>`                          |

---

## 1. poe.ninja

**Type:** Top ladder characters — real builds played by real players, pulled from the official PoE ladder API.

**Endpoint:**

```
GET https://poe.ninja/api/data/getbuildoverview?overview=<league>&type=<class>&language=en
```

Response is JSON with an array of character entries. Each has:

- `name` — character name
- `account` — account name (= creator)
- Direct URL pattern: `https://poe.ninja/poe1/builds/<league>/character/<account>/<name>`

**Pros:** Structured JSON, no scraping, data is already curated by ladder rank.  
**Cons:** These are individual player characters, not "guides." No author-written descriptions.

**What to scrape:** Nothing — call the API, extract `name` + `account` + construct URL.

---

## 2. maxroll.gg

**Type:** Editorial build guides written by known PoE content creators.

**Listing page:** `https://maxroll.gg/poe/category/build-guides`

Each card on the listing page contains:

- Guide title
- Author name
- Ascendancy / tags
- Link to the guide page (`/poe/build-guides/<slug>`)

**Pros:** High quality, creator names are well-known, users actively look for these guides.  
**Cons:** No API — must scrape HTML. Layout changes will break the scraper. No ToS for scraping.

**What to scrape:** Listing page HTML → card elements → title, author, href.

---

## 3. pobarchives.com

**Type:** Community-uploaded PoB builds, 7300+ entries, daily updated.

**Listing page:** `https://pobarchives.com/builds`

Supports query params: `?author=<name>`, `?mainSkill=<skill>`, `?arch=<type>`, `?sort=dps` etc.

Each listing entry has:

- Build title
- Author/uploader name
- Link to build page (`/builds/<id>`)

**Pros:** Huge catalog, good filters, includes actual PoB codes (so we could also decode them).  
**Cons:** No API — HTML scraping only. Community quality varies.

**What to scrape:** Listing page HTML → build cards → title, author, href.

---

## 4. mobalytics.gg

**Type:** Editorial guides + community-submitted builds. Two distinct sections:

- Creator builds: `https://mobalytics.gg/poe/creator-builds` — by known content creators
- Community builds: `https://mobalytics.gg/poe/community-builds` — user-submitted with PoB import
- General builds list: `https://mobalytics.gg/poe/builds`

Each card has: build title, author/creator name, ascendancy, link.

**Pros:** Large catalog, separates editorial from community, known creators listed.  
**Cons:** No API, HTML only. Mobalytics is primarily a gaming analytics company — may have stricter ToS.

**What to scrape:** Listing pages → build cards → title, author, href.

---

## 5. poe-vault.com

**Type:** Editorial guides by known community veterans (Ghazzy, Velyna, PathofEvening, etc.).

**Listing pages:**

- All builds: `https://www.poe-vault.com/guides/builds-for-path-of-exile`
- Per-author hubs: `https://www.poe-vault.com/guides/ghazzy-guide-hub` etc.

Each guide has: title, author, patch version, link.

**Pros:** High-reputation authors, well-organized by author hub.  
**Cons:** No API, HTML only. Smaller catalog than maxroll/mobalytics.

**What to scrape:** Builds listing page → guide cards → title, author, href.

---

## 6. poebuilds.cc

**Type:** Curated collection of builds per patch, primarily YouTuber builds.

**Listing page:** `https://www.poebuilds.cc/poe/`

**Pros:** Clean, patch-organized.  
**Cons:** Smaller catalog, no API, HTML only.

**What to scrape:** Listing page → title, author, href.

---

## 7. poebuilds.net

**Type:** Build guides site (separate from poebuilds.cc).

**Listing page:** `https://www.poebuilds.net/`

Low priority — catalog size and quality unclear.

---

## 8. PoE Official Forums

**Type:** Community build threads in the class-specific build subforums.

**Subforums:** `/forum/view-forum/50` (Shadow), `/forum/view-forum/53` (Witch), etc.

GGG exposes a public forum API:

```
GET https://www.pathofexile.com/api/forum/view-forum/<id>?page=<n>
```

Returns thread list with: title, author, thread ID, reply count, last post date.

**URL pattern:** `https://www.pathofexile.com/forum/view-thread/<id>`

**Pros:** Officially public API (rate-limited), massive catalog, community-maintained.  
**Cons:** Thread quality varies wildly. Many threads are outdated. No structured tags/ascendancy.

**What to scrape:** Forum API → thread title + author + thread ID → construct URL.

Existing scraper reference: https://github.com/patrickmackow/poe-build-list

---

## Recommended Priority

**Tier 1 — implement first:**

- **poe.ninja** — JSON API, zero scraping, always-fresh ladder data
- **maxroll.gg** — top editorial quality, users actively follow these guides

**Tier 2 — add later:**

- **mobalytics.gg** — large catalog, creator + community split is useful
- **poe-vault.com** — respected author names (Ghazzy etc.), small but high-signal
- **PoE Forums** — official public API, huge catalog; needs quality filtering (reply count, date)

**Tier 3 — low priority:**

- **pobarchives.com** — valuable if we decode PoB codes; otherwise just another HTML source
- **poebuilds.cc / poebuilds.net** — small, no unique angle

---

## Ingestion Architecture

Two patterns depending on source:

### Pattern A — API pull (poe.ninja)

```
Cloudflare Worker (scheduled) → GET poe.ninja API → transform → upsert D1
```

Run nightly per active league. Filter: `level >= 90` to avoid noise.

### Pattern B — HTML scrape (maxroll, pobarchives)

```
Cloudflare Worker (scheduled) → fetch listing page → parse HTML → upsert D1
```

Use CSS selectors on the listing page cards. Store raw HTML hash to detect changes and skip re-processing.

Both patterns store the same normalized row:

```ts
{
  source: "poe.ninja" | "maxroll" | "pobarchives",
  name: string,       // build/character name
  creator: string,    // account/author name
  url: string,        // canonical link to the build
  league: string,
  ascendancy?: string,
  tags?: string[],
  fetchedAt: timestamp
}
```

---

## Open Questions

1. **Refresh cadence** — poe.ninja ladder changes daily; maxroll guides are stable for months. Different TTLs?
2. **Dedup** — same maxroll guide can appear under multiple slugs (redirects). Deduplicate on canonical URL?
3. **ToS risk** — maxroll/pobarchives don't publish scraping policies. Consider reaching out or adding a `robots.txt` check before scraping.
4. **pobarchives PoB codes** — each entry has the raw PoB code available. Worth storing so we can skip user paste entirely?
