import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const root = process.argv[2];
if (!root) throw new Error("Usage: node scripts/check-output.mjs <dist-directory>");

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
if (htmlFiles.length !== 1 || !htmlFiles[0].endsWith("/index.html")) {
  throw new Error(`Expected exactly one canonical HTML route, found ${htmlFiles.join(", ")}`);
}
console.log(`Output route check passed: ${htmlFiles[0]}`);
