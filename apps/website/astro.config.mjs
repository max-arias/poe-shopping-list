import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(import.meta.url), "../../../");

export default defineConfig({
  output: "static",
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@poe-sl/schema": resolve(root, "packages/schema/src/index.ts"),
      },
    },
  },
});
