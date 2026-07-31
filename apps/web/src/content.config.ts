import { defineCollection } from "astro:content";
import { glob, type Loader } from "astro/loaders";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { publishedListSchema } from "./domain/schemas";
import { taxonomy } from "./domain/taxonomy";
import { validatePublishedList } from "./domain/validate-content";

const testMode = process.env.POE_WEB_TEST_MODE === "1";

/**
 * Test cards live outside src/content/lists and are only loaded when the
 * explicit test-mode environment variable is present. The raw marker is
 * removed only here, after proving it is present; production uses the normal
 * glob loader and never sees these files.
 */
const testFixtureLoader: Loader = {
  name: "poe-sl-test-fixtures",
  schema: publishedListSchema,
  async load({ store, parseData }) {
    const directory = fileURLToPath(new URL("../tests/fixtures/content/", import.meta.url));
    const files = (await readdir(directory)).filter((file) => file.endsWith(".json")).sort();
    for (const file of files) {
      const filePath = `${directory}${file}`;
      const raw = JSON.parse(await readFile(filePath, "utf8")) as Record<string, unknown>;
      if (raw.testOnly !== true) throw new Error(`${filePath}:testOnly: test fixture marker is required`);
      const { testOnly: _testOnly, ...data } = raw;
      validatePublishedList(data, taxonomy, filePath);
      const id = file.replace(/\.json$/, "");
      store.set({ id, data: await parseData({ id, data, filePath }) });
    }
  },
};

const lists = defineCollection({
  loader: testMode
    ? testFixtureLoader
    : glob({ pattern: "**/*.{md,mdx,json,yaml,yml}", base: "./src/content/lists" }),
  schema: publishedListSchema,
});

export const collections = { lists };
