import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
const base = process.env.PUBLIC_SITE_URL;
const manifestPath = process.env.CONTENT_MANIFEST_PATH;
if (!base) throw new Error("Missing protected configuration: PUBLIC_SITE_URL.");
if (!manifestPath) throw new Error("Missing smoke input: CONTENT_MANIFEST_PATH (verified artifact manifest).");
let url;
try { url = new URL(base); } catch { throw new Error("Launch blocker: PUBLIC_SITE_URL must be a valid URL."); }
if (url.protocol !== "https:") throw new Error("Launch blocker: PUBLIC_SITE_URL must use canonical HTTPS.");
if (url.pathname !== "/" || url.search || url.hash) throw new Error("PUBLIC_SITE_URL must be the canonical HTTPS origin root without path, query, or fragment.");

const manifest = (await readFile(manifestPath, "utf8")).trim().split("\n").filter(Boolean);
const entries = manifest.map((line) => {
  const match = line.match(/^([a-f0-9]{64})  (.+)\t(\d+) bytes$/);
  if (!match) throw new Error(`Invalid verified content manifest line: ${line}`);
  return { hash: match[1], path: match[2], size: Number(match[3]) };
});
const rootEntry = entries.find(({ path }) => path === "index.html");
if (!rootEntry) throw new Error("Verified content manifest does not contain dist/index.html.");

async function check(path, expectedStatus) {
  const response = await fetch(new URL(path, url));
  if (response.status !== expectedStatus) throw new Error(`${path}: expected HTTP ${expectedStatus}, received ${response.status}`);
  return response;
}

const root = await check("/", 200);
const html = await root.text();
if (!html.includes("Published Lists") || (!html.includes("No Published Lists are available yet.") && !html.includes("list-card"))) {
  throw new Error("/: expected Catalog content or the truthful empty Catalog state.");
}
const fetched = new Map([["index.html", Buffer.from(html)] ]);
for (const entry of entries) {
  const response = entry.path === "index.html" ? root : await fetch(new URL(`/${entry.path}`, url));
  if (response.status !== 200) throw new Error(`/${entry.path}: expected HTTP 200, received ${response.status}`);
  const body = fetched.get(entry.path) || Buffer.from(await response.arrayBuffer());
  fetched.set(entry.path, body);
  const actualHash = createHash("sha256").update(body).digest("hex");
  if (actualHash !== entry.hash) throw new Error(`/${entry.path}: deployed hash ${actualHash} does not match verified manifest ${entry.hash}.`);
  if (body.byteLength !== entry.size) throw new Error(`/${entry.path}: deployed size ${body.byteLength} does not match verified manifest ${entry.size}.`);
}
await check("/__public-site-smoke-not-found__", 404);
const tradeLinks = [...html.matchAll(/https:\/\/www\.pathofexile\.com\/trade\/search\/[^"'\s<]+/g)].map((match) => match[0]);
for (const link of [...new Set(tradeLinks)]) {
  const trade = new URL(link);
  if (trade.protocol !== "https:" || trade.hostname !== "www.pathofexile.com" || !trade.pathname.startsWith("/trade/search/")) {
    throw new Error(`Invalid official Trade URL contract: ${link}`);
  }
}
console.log(`Smoke check passed for ${url.origin}: HTTPS root, ${entries.length} manifest file hashes, not-found response, and ${tradeLinks.length} Trade URL contract(s).`);
