import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { taxonomy } from "./taxonomy";
import { publishedListSchema, type PublishedList } from "./schemas";
import { createPublishedListRecord, gitLastReviewed, type PublishedListRecord, type GitTimestampLookup } from "./last-reviewed";

export const webProjectRoot = fileURLToPath(new URL("../..", import.meta.url));
export const contentDirectory = fileURLToPath(new URL("../content/lists/", import.meta.url));

export class ContentValidationError extends Error {
  constructor(public readonly sourceFile: string, public readonly fieldPath: string, message: string) {
    super(`${sourceFile}${fieldPath ? `:${fieldPath}` : ""}: ${message}`);
    this.name = "ContentValidationError";
  }
}

type TaxonomyReferences = { categories: readonly string[]; tags: readonly string[] };

export function validatePublishedList(
  value: unknown,
  references: TaxonomyReferences = taxonomy,
  sourceFile = "<fixture>",
): PublishedList {
  const parsed = publishedListSchema.safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const fieldPath = issue.code === "unrecognized_keys" ? issue.keys[0] ?? "" : issue.path.join(".");
    throw new ContentValidationError(sourceFile, fieldPath, issue.message);
  }
  const list = parsed.data;
  if (!references.categories.includes(list.category)) {
    throw new ContentValidationError(sourceFile, "category", `unknown category '${list.category}'`);
  }
  for (const [index, tag] of list.tags.entries()) {
    if (!references.tags.includes(tag)) {
      throw new ContentValidationError(sourceFile, `tags.${index}`, `unknown tag '${tag}'`);
    }
  }
  const groups = "groups" in list ? list.groups : [{ title: list.title, items: list.items }];
  for (const [groupIndex, group] of groups.entries()) {
    const seenUrls = new Set<string>();
    for (const [itemIndex, item] of group.items.entries()) {
      if (seenUrls.has(item.tradeUrl)) {
        const path = "groups" in list ? `groups.${groupIndex}.items.${itemIndex}.tradeUrl` : `items.${itemIndex}.tradeUrl`;
        throw new ContentValidationError(sourceFile, path, "duplicate trade URL");
      }
      seenUrls.add(item.tradeUrl);
    }
  }
  return list;
}

export async function validateContentDirectory(
  directory = contentDirectory,
  references: TaxonomyReferences = taxonomy,
  getGitTimestamp: GitTimestampLookup = (sourceFile) => gitLastReviewed(sourceFile, webProjectRoot),
): Promise<PublishedListRecord<PublishedList>[]> {
  const files = await collectSourceFiles(directory);
  const records: PublishedListRecord<PublishedList>[] = [];
  for (const sourceFile of files) {
    try {
      const value = await readSource(sourceFile);
      const data = validatePublishedList(value, references, sourceFile);
      records.push(createPublishedListRecord(sourceFile, data, getGitTimestamp));
    } catch (error) {
      if (error instanceof ContentValidationError) throw error;
      throw new ContentValidationError(sourceFile, "", error instanceof Error ? error.message : String(error));
    }
  }
  return records;
}

async function readSource(sourceFile: string): Promise<unknown> {
  const source = await readFile(sourceFile, "utf8");
  if (sourceFile.endsWith(".json")) return JSON.parse(source);
  const frontmatter = source.match(/^---\n([\s\S]*?)\n---(?:\n|$)/)?.[1];
  if (frontmatter === undefined && (sourceFile.endsWith(".md") || sourceFile.endsWith(".mdx"))) {
    throw new Error("missing YAML frontmatter");
  }
  return parseYaml(frontmatter ?? source);
}

export async function collectSourceFiles(directory: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
    if (code === "ENOENT") throw new Error(`Published List directory is missing: ${directory}`);
    throw new Error(`Published List directory is unreadable: ${directory}`);
  }
  const files: string[] = [];
  for (const entry of entries) {
    const sourceFile = `${directory}/${entry.name}`;
    if (entry.isSymbolicLink()) throw new Error(`Cannot safely recurse through symlink ${sourceFile}`);
    if (entry.isDirectory()) files.push(...await collectSourceFiles(sourceFile));
    else if (/\.(md|mdx|json|ya?ml)$/.test(entry.name)) files.push(sourceFile);
  }
  return files.sort();
}

async function main() {
  await validateContentDirectory();
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
