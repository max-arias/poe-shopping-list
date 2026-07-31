import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const root = process.argv[2];
if (!root) throw new Error("Usage: node scripts/check-links.mjs <dist-directory>");

const htmlFiles = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.name.endsWith(".html")) htmlFiles.push(path);
  }
}

await walk(root);
for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const value = match[1];
    if (value.startsWith("#") || value.startsWith("mailto:")) continue;
    if (value.startsWith("/")) {
      const path = value.split(/[?#]/, 1)[0];
      if (path === "/_astro/" || path.startsWith("/_astro/")) continue;
      if (path !== "/") throw new Error(`${file}: unexpected internal route ${value}`);
      continue;
    }
    if (!value.startsWith("https://www.pathofexile.com/trade/search/")) {
      throw new Error(`${file}: unexpected external link ${value}`);
    }
  }
}
console.log(`Link check passed for ${htmlFiles.length} HTML file(s); external Trade links were checked without network access.`);
