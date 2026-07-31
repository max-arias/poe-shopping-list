import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const [rootArgument, manifestArgument] = process.argv.slice(2);
if (!rootArgument || !manifestArgument) throw new Error("Usage: node scripts/verify-content-manifest.mjs <dist-directory> <manifest-file>");
const root = resolve(rootArgument);
const expected = (await readFile(resolve(manifestArgument), "utf8")).trim().split("\n").filter(Boolean);
const actual = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (entry.isFile()) actual.push(file);
  }
}
await walk(root);
actual.sort();
const computed = [];
for (const file of actual) {
  computed.push(`${createHash("sha256").update(await readFile(file)).digest("hex")}  ${relative(root, file)}\t${(await stat(file)).size} bytes`);
}
if (computed.join("\n") !== expected.join("\n")) {
  throw new Error("Content manifest verification failed: the downloaded dist differs from the tested production output.");
}
console.log(`Content manifest verified for ${actual.length} file(s).`);
