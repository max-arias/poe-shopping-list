import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { validateContentDirectory } from "./src/domain/validate-content";

export default defineConfig({
  output: "static",
  outDir: "./dist",
  cacheDir: "./node_modules/.astro-production",
  vite: {
    cacheDir: "./node_modules/.vite-production",
    plugins: [tailwindcss() as any],
  },
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
