import { test as base, chromium, type BrowserContext, type Page } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pathToExtension = path.resolve(__dirname, "../../extension/.output/chrome-mv3");

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({}, use) => {
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
 * If chrome.sidePanel.open() doesn't work in the test environment (it may not
 * be supported in Playwright's Chromium), we fall back to opening the sidepanel
 * URL in a new tab. This still exercises the extension's sidepanel code but
 * bypasses the sidepanel API.
 */
export async function openSidepanel(
  page: Page,
  context: BrowserContext,
  extensionId: string,
): Promise<Page> {
  // Check if a sidepanel page is already open
  const existing = context.pages().find((p) => p.url().includes("sidepanel.html"));
  if (existing) return existing;

  // Try clicking the FAB button to trigger csOpenSidepanel → chrome.sidePanel.open()
  const fabBtn = page.getByTestId("poe-sl-fab-btn");
  await fabBtn.waitFor({ state: "visible", timeout: 10_000 });
  await fabBtn.click();

  // Wait for the sidepanel page to appear (chrome.sidePanel.open may create a new page)
  const deadline = Date.now() + 3_000;
  while (Date.now() < deadline) {
    const sp = context.pages().find((p) => p.url().includes("sidepanel.html"));
    if (sp) return sp;
    await page.waitForTimeout(200);
  }

  // Fallback: chrome.sidePanel.open() didn't work — open sidepanel in a new tab.
  // This still tests the extension's sidepanel code, just not the sidepanel API itself.
  const sp = await context.newPage();
  await sp.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  return sp;
}