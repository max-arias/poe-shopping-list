import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-vue"],

  vite: () => ({
    plugins: [tailwindcss()],
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
