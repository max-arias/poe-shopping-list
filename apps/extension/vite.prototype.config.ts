import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig(async () => {
  const { default: nuxtUi } = await import("@nuxt/ui/vite");

  return {
    plugins: [vue(), nuxtUi({ router: false })],
    build: {
      outDir: ".prototype-dist",
      rollupOptions: {
        input: {
          prototype: fileURLToPath(new URL("./index.html", import.meta.url)),
        },
      },
    },
    resolve: {
      alias: [
        { find: /^@\//, replacement: `${src}/` },
        {
          find: "wxt/utils/storage",
          replacement: fileURLToPath(new URL("./prototype/mock-storage.ts", import.meta.url)),
        },
        {
          // SaveModal imports the production messages module by a relative path.
          // Mock the package it imports instead of relying on that resolved path
          // being seen by Vite's alias pass.
          find: "@webext-core/messaging",
          replacement: fileURLToPath(
            new URL("./prototype/mock-messaging-package.ts", import.meta.url),
          ),
        },
      ],
    },
  };
});
