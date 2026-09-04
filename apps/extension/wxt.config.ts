import nuxtUi from "@nuxt/ui/vite";
import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-vue"],

  vite: () => ({
    // Nuxt UI's standalone-Vue plugin includes the Tailwind Vite plugin.
    // Keep a single Tailwind instance to avoid duplicate processing.
    plugins: [
      nuxtUi({
        router: false,
        colorMode: false,
        ui: { colors: { primary: "amber" } },
      }),
    ],
  }),

  manifest: {
    name: "PoE Shopping List",
    description:
      "Create and manage shopping lists for Path of Exile trade searches. Local-only — no account needed.",
    version: "0.1.0",
    icons: {
      16: "icons/icon16.png",
      32: "icons/icon32.png",
      48: "icons/icon48.png",
      128: "icons/icon128.png",
    },
    permissions: ["storage", "sidePanel"],
    host_permissions: ["https://www.pathofexile.com/trade/*", "https://pathofexile.com/trade/*"],
    side_panel: {
      default_path: "sidepanel.html",
    },
    action: {
      default_icon: {
        16: "icons/icon16.png",
        32: "icons/icon32.png",
        48: "icons/icon48.png",
        128: "icons/icon128.png",
      },
    },
  },
});
