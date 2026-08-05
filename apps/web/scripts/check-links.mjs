import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const root = process.argv[2];
if (!root) throw new Error("Usage: node scripts/check-links.mjs <dist-directory>");

const permittedInternalRoutes = ["/", "/crafts/"];
const permittedGoogleFontOrigins = ["https://fonts.googleapis.com", "https://fonts.gstatic.com"];
const permittedCuratedExternalUrls = [
  "https://pohx.net/crafts/",
  "https://mobalytics.gg/poe/builds/cws-chieftain-emiracles#c81bc723-60d4-42bc-acf2-59b5ed7b2fe1-anytime-upgrades-9",
  "https://pobb.in/8BVHxIIdtPg8",
];
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
      if (!permittedInternalRoutes.includes(path)) {
        throw new Error(`${file}: unexpected internal route ${value}; permitted internal routes: ${permittedInternalRoutes.join(", ")}`);
      }
      continue;
    }
    const isGoogleFontPreconnect = permittedGoogleFontOrigins.includes(value);
    const isGoogleFontStylesheet = value.startsWith("https://fonts.googleapis.com/css2?");
    const isOfficialTradeSearch = value.startsWith("https://www.pathofexile.com/trade/search/");
    const isPermittedCuratedExternalUrl = permittedCuratedExternalUrls.includes(value);
    const isShareableJsonDataUrl = value.startsWith("data:application/json;charset=utf-8,");
    if (!isGoogleFontPreconnect && !isGoogleFontStylesheet && !isOfficialTradeSearch && !isPermittedCuratedExternalUrl && !isShareableJsonDataUrl) {
      throw new Error(`${file}: unexpected external link ${value}`);
    }
  }
}
console.log(`Link check passed for ${htmlFiles.length} HTML file(s); official Trade and approved Google Fonts links were checked without network access.`);
