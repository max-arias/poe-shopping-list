import type { Draft } from "@/types";
import { storage } from "wxt/utils/storage";
import { injectFab } from "../utils/fab";

export default defineContentScript({
  matches: ["https://pobb.in/*", "https://maxroll.gg/*"],

  async main() {
    const drafts = (await storage.getItem<Draft[]>("local:drafts")) ?? [];
    const url = window.location.href;

    injectFab(drafts, url);
  },
});
