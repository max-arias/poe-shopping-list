// Must be set before Playwright launches Chromium.
// Enables Playwright to attach to pages created by chrome.sidePanel.open(),
// making the sidepanel accessible via context.pages().
// See: https://github.com/microsoft/playwright/issues/26693
process.env.PW_CHROMIUM_ATTACH_TO_OTHER = "1";

import path from "node:path";
import { fileURLToPath } from "node:url";
import { type BrowserContext, type Page, test as base, chromium } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pathToExtension = path.resolve(__dirname, "../../extension/.output/chrome-mv3");

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  // Playwright fixture callbacks require an object destructuring pattern.
  context: async ({ browserName: _browserName }, use) => {
    const context = await chromium.launchPersistentContext("", {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent("serviceworker");
    }
    const extensionId = serviceWorker.url().split("/")[2];
    await use(extensionId);
  },
});

export const expect = test.expect;

/**
 * Set a value in chrome.storage.local via the extension's service worker.
 * This is more reliable than using page.evaluate() on an extension page,
 * because the service worker always has full chrome.* API access.
 *
 * IMPORTANT: wxt/storage uses keys like "local:drafts" but stores them
 * in chrome.storage.local under just "drafts" (the part after the colon).
 * So pass the wxt-style key (e.g. "local:drafts") and this function
 * will strip the area prefix automatically.
 */
export async function setStorage(
  context: BrowserContext,
  key: string,
  value: unknown,
): Promise<void> {
  const [sw] = context.serviceWorkers();
  if (!sw) throw new Error("No service worker found");

  // wxt/storage stores "local:drafts" as just "drafts" in chrome.storage.local
  const storageKey = key.includes(":") ? key.split(":").slice(1).join(":") : key;

  await sw.evaluate(
    ({ k, v }) =>
      new Promise<void>((resolve) => {
        chrome.storage.local.set({ [k]: v }, resolve);
      }),
    { k: storageKey, v: value },
  );
}

/**
 * Open the sidepanel by clicking the FAB button on the trade page.
 * This triggers the real csOpenSidepanel → service worker → chrome.sidePanel.open() flow.
 *
 * Requires PW_CHROMIUM_ATTACH_TO_OTHER=1 (set at the top of this file) so that
 * Playwright attaches to the sidepanel page created by chrome.sidePanel.open().
 */
export async function openSidepanel(page: Page, context: BrowserContext): Promise<Page> {
  // Record pages that already exist so we can detect the new one
  const pagesBefore = new Set(context.pages());

  // Click the FAB button to trigger csOpenSidepanel → chrome.sidePanel.open()
  const fabBtn = page.getByTestId("poe-sl-fab-btn");
  await fabBtn.waitFor({ state: "visible", timeout: 10_000 });
  await fabBtn.click();

  // Wait for the sidepanel page to appear in context.pages().
  // PW_CHROMIUM_ATTACH_TO_OTHER=1 (set at top of file) makes sidepanel
  // pages created by chrome.sidePanel.open() visible to Playwright.
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const newPages = context.pages().filter((p) => !pagesBefore.has(p));
    if (newPages.length > 0) {
      const sp = newPages[0];
      // Wait for the sidepanel to finish initial navigation
      await sp.waitForLoadState("domcontentloaded");
      return sp;
    }
    await page.waitForTimeout(200);
  }

  throw new Error(
    "Sidepanel page did not appear after clicking the FAB button. " +
      "Ensure PW_CHROMIUM_ATTACH_TO_OTHER=1 is set and chrome.sidePanel.open() is working.",
  );
}

export async function waitForSidepanelReady(sp: Page): Promise<void> {
  await base.expect(sp.getByRole("tab", { name: "My Lists" })).toBeVisible({ timeout: 10_000 });
}

export async function closeSidepanel(sp: Page): Promise<void> {
  await sp.close();
}
