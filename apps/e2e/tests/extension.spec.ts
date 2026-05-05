import { test, expect } from "./fixtures.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mockTradePagePath = path.resolve(__dirname, "mocks/trade-page.html");

test.describe("Extension E2E", () => {
  test("sidepanel renders with tabs and empty state", async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);

    // Chrome bar title
    await expect(page.getByTestId("chrome-bar-title")).toBeVisible();
    await expect(page.getByTestId("chrome-bar-title")).toHaveText("PoE Shopping List");

    // Empty-state content in Mine tab
    await expect(page.getByTestId("empty-mine")).toBeVisible();
    await expect(page.getByTestId("create-list-btn")).toBeVisible();
  });

  test("content script injects FAB on mocked trade page", async ({ page, extensionId }) => {
    // Intercept requests to the trade site and serve our mock HTML
    await page.route("https://www.pathofexile.com/trade/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        path: mockTradePagePath,
      });
    });

    await page.goto("https://www.pathofexile.com/trade/search/Mirage/test-search-id");

    // The FAB host is injected at fixed position top-right with a data-testid.
    const fabHost = page.getByTestId("poe-sl-fab-host");
    await expect(fabHost).toBeVisible({ timeout: 10_000 });

    // The FAB button lives inside the shadow DOM; Playwright pierces it automatically.
    const fabButton = page.getByTestId("poe-sl-fab-btn");
    await expect(fabButton).toBeVisible();
  });
});
