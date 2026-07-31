import { open, rm, readFile, access, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const execFileAsync = promisify(execFile);
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const productionOutput = resolve(appRoot, "dist");
const fixtureOutput = resolve(appRoot, "dist-test");
const astroCaches = [resolve(appRoot, "node_modules/.astro-production"), resolve(appRoot, "node_modules/.astro-test")];
const contentStore = resolve(appRoot, "node_modules/.astro");
const viteCaches = [resolve(appRoot, "node_modules/.vite-production"), resolve(appRoot, "node_modules/.vite-test")];
const readyFile = resolve(appRoot, ".playwright-build-ready");
const lockFile = resolve(appRoot, ".playwright-build.lock");

const exists = async (path) => access(path).then(() => true, () => false);
const wait = (milliseconds) => new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));

async function acquirePreparationLock() {
  for (let attempt = 0; attempt < 360; attempt += 1) {
    const readyForSession = await readFile(readyFile, "utf8").then((value) => value.trim() === (process.env.PLAYWRIGHT_BUILD_SESSION ?? ""), () => false);
    if (readyForSession && await exists(resolve(productionOutput, "index.html")) && await exists(resolve(fixtureOutput, "index.html"))) return false;
    try {
      const handle = await open(lockFile, "wx");
      await handle.close();
      return true;
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      await wait(500);
    }
  }
  throw new Error("Timed out waiting for the browser build preparation lock");
}

export async function prepareBrowserBuilds() {
  if (!await acquirePreparationLock()) return;
  await rm(readyFile, { force: true });
  try {
    await Promise.all([
      rm(productionOutput, { recursive: true, force: true }),
      rm(fixtureOutput, { recursive: true, force: true }),
      rm(contentStore, { recursive: true, force: true }),
      ...astroCaches.map((cache) => rm(cache, { recursive: true, force: true })),
      ...viteCaches.map((cache) => rm(cache, { recursive: true, force: true })),
    ]);

    await execFileAsync("corepack", ["pnpm", "build"], { cwd: appRoot, env: { ...process.env, POE_WEB_TEST_MODE: "" } });
    const productionHtml = await readFile(resolve(productionOutput, "index.html"), "utf8");
    if (productionHtml.includes("Browser fixture:")) {
      throw new Error("Production browser artifact contains test fixture content");
    }

    await execFileAsync("corepack", ["pnpm", "build:test-fixtures"], { cwd: appRoot, env: { ...process.env, POE_WEB_TEST_MODE: "1" } });
    const productionAfterFixtureBuild = await readFile(resolve(productionOutput, "index.html"), "utf8");
    if (productionAfterFixtureBuild.includes("Browser fixture:")) {
      throw new Error("Fixture build modified the production browser artifact");
    }
    await writeFile(readyFile, `${process.env.PLAYWRIGHT_BUILD_SESSION ?? "standalone"}\n`);
  } finally {
    await rm(lockFile, { force: true });
  }
}

export default async function globalSetup() {
  await prepareBrowserBuilds();
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await prepareBrowserBuilds();
}
