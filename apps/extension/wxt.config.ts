import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-vue"],

  vite: () => ({
    plugins: [tailwindcss()],
  }),

  manifest: {
    name: "PoE Shopping List",
    description: "Create and manage shopping lists for Path of Exile trade searches. Local-only — no account needed.",
    version: "0.1.0",
    permissions: ["storage", "sidePanel", "tabs"],
    host_permissions: [
      "https://www.pathofexile.com/*",
      "https://pathofexile.com/*",
      "https://pobb.in/*",
      "https://maxroll.gg/*",
      "https://poe.ninja/*",
    ],
    side_panel: {
      default_path: "sidepanel.html",
    },
    action: {},
  },
});
