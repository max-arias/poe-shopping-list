import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-vue"],

  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@poe-sl/schema": resolve(__dirname, "../../packages/schema/src"),
        "@poe-sl/trade-dom": resolve(__dirname, "../../packages/trade-dom/src"),
      },
    },
  }),

  manifest: {
    name: "PoE Shopping List",
    description:
      "Save trade searches, share build shopping lists, and follow curated lists from build guides.",
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
    // Empty action object so the toolbar icon is present and clickable
    action: {},
  },
});
