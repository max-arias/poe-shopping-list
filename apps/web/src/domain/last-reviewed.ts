import { execFileSync } from "node:child_process";
import { relative, resolve } from "node:path";

export type GitTimestampLookup = (sourceFile: string) => string | Date | undefined;

/**
 * Git history is the publication record for a source file. The file must have
 * a commit; an absent history value is an error rather than a current-time
 * fallback. The lookup is injectable so callers can supply deterministic Git
 * history without depending on wall-clock time.
 */
export function deriveLastReviewed(getGitTimestamp: () => string | Date | undefined): string {
  const value = getGitTimestamp();
  if (value === undefined) throw new Error("Git history did not provide lastReviewed");
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Git history did not provide a valid timestamp");
  return date.toISOString();
}

/** Read the latest committed timestamp for one source file. */
export function gitLastReviewed(sourceFile: string, projectRoot: string): string {
  let output: string;
  try {
    output = execFileSync(
      "git",
      ["log", "-1", "--format=%cI", "--", relative(projectRoot, resolve(sourceFile))],
      { cwd: projectRoot, encoding: "utf8" },
    );
  } catch {
    throw new Error(`Git history lookup failed for ${sourceFile}`);
  }
  return deriveLastReviewed(() => output.trim() || undefined);
}

export type PublishedListRecord<T> = {
  sourceFile: string;
  data: T;
  lastReviewed: string;
};

export function createPublishedListRecord<T>(
  sourceFile: string,
  data: T,
  getGitTimestamp: GitTimestampLookup,
): PublishedListRecord<T> {
  return {
    sourceFile,
    data,
    lastReviewed: deriveLastReviewed(() => getGitTimestamp(sourceFile)),
  };
}
