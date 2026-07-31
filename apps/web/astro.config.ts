import { defineConfig } from "astro/config";
import { validateContentDirectory } from "./src/domain/validate-content";

const testMode = process.env.POE_WEB_TEST_MODE === "1";

export default defineConfig({
  output: "static",
  outDir: "./dist",
  cacheDir: testMode ? "./node_modules/.astro-test" : "./node_modules/.astro-production",
  vite: { cacheDir: testMode ? "./node_modules/.vite-test" : "./node_modules/.vite-production" },
  build: { format: "directory" },
  integrations: [{
    name: "published-list-validation",
    hooks: {
      "astro:build:setup": async () => {
        await validateContentDirectory();
      },
    },
  }],
});
