import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const [rootArgument, outputArgument] = process.argv.slice(2);
if (!rootArgument || !outputArgument) throw new Error("Usage: node scripts/create-content-manifest.mjs <dist-directory> <output-file>");
const root = resolve(rootArgument);
const files = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.isFile()) files.push(path);
  }
}

await walk(root);
files.sort();
const lines = [];
for (const file of files) {
  const digest = createHash("sha256").update(await readFile(file)).digest("hex");
  lines.push(`${digest}  ${relative(root, file)}\t${(await stat(file)).size} bytes`);
}
await mkdir(resolve(outputArgument, ".."), { recursive: true });
await writeFile(resolve(outputArgument), `${lines.join("\n")}\n`);
console.log(`Content manifest written for ${files.length} file(s).`);
