import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.argv[2];
if (!root) throw new Error("Usage: node scripts/check-output.mjs <dist-directory>");

const expectedHtmlRoutes = ["index.html", "crafts/index.html"];
const htmlFiles = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.name.endsWith(".html")) htmlFiles.push(path);
  }
}

await stat(join(root, "index.html"));
await walk(root);
const actualHtmlRoutes = htmlFiles.map((path) => relative(root, path)).sort();
const missingRoutes = expectedHtmlRoutes.filter((route) => !actualHtmlRoutes.includes(route));
const unexpectedRoutes = actualHtmlRoutes.filter((route) => !expectedHtmlRoutes.includes(route));
if (missingRoutes.length > 0 || unexpectedRoutes.length > 0) {
  throw new Error([
    `Expected exactly these canonical HTML routes: ${expectedHtmlRoutes.join(", ")}`,
    missingRoutes.length > 0 ? `Missing: ${missingRoutes.join(", ")}` : "",
    unexpectedRoutes.length > 0 ? `Unexpected: ${unexpectedRoutes.join(", ")}` : "",
    `Found: ${actualHtmlRoutes.length > 0 ? actualHtmlRoutes.join(", ") : "none"}`,
  ].filter(Boolean).join("\n"));
}
console.log(`Output route check passed: ${actualHtmlRoutes.join(", ")}`);
