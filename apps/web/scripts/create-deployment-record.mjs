import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const output = process.argv[2];
if (!output) throw new Error("Usage: node scripts/create-deployment-record.mjs <output-file>");
const value = (name) => process.env[name] || "unavailable";
const record = {
  sourceSha: value("SOURCE_SHA"), mergedPullRequest: value("MERGED_PR_REFERENCE"),
  artifact: { name: value("ARTIFACT_NAME"), id: value("ARTIFACT_ID"), checksum: value("ARTIFACT_CHECKSUM") },
  contentManifest: process.env.CONTENT_MANIFEST || "unavailable",
  actor: value("DEPLOYMENT_ACTOR"), approver: value("DEPLOYMENT_APPROVER"),
  timestampUtc: process.env.DEPLOYMENT_TIMESTAMP || new Date().toISOString(), runId: value("GITHUB_RUN_ID"),
  siteUrl: value("PUBLIC_SITE_URL"), environment: value("DEPLOYMENT_ENVIRONMENT"), canonicalHost: value("CANONICAL_HOST"),
  toolchain: { node: value("NODE_VERSION"), astro: value("ASTRO_VERSION"), pnpm: value("PNPM_VERSION"), wrangler: value("WRANGLER_VERSION") },
  wranglerOutput: process.env.WRANGLER_DEPLOY_OUTPUT ? await readFile(process.env.WRANGLER_DEPLOY_OUTPUT, "utf8") : "unavailable",
  validationEvidence: { name: value("VALIDATION_EVIDENCE"), runId: value("VALIDATION_RUN_ID"), artifactId: value("VALIDATION_ARTIFACT_ID") },
  manualAccessibilityEvidence: value("MANUAL_ACCESSIBILITY_EVIDENCE"),
  smoke: { status: value("SMOKE_STATUS"), timestampUtc: process.env.SMOKE_TIMESTAMP || "unavailable", details: value("SMOKE_DETAILS") },
};
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(record, null, 2)}\n`);
