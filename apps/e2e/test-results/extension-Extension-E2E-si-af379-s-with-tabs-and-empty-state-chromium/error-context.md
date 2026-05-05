# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: extension.spec.ts >> Extension E2E >> sidepanel renders with tabs and empty state
- Location: tests\extension.spec.ts:10:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('chrome-bar-title')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByTestId('chrome-bar-title')

```

# Test source

```ts
  1  | import { test, expect } from "./fixtures.js";
  2  | import path from "node:path";
  3  | import { fileURLToPath } from "node:url";
  4  |
  5  | const __filename = fileURLToPath(import.meta.url);
  6  | const __dirname = path.dirname(__filename);
  7  | const mockTradePagePath = path.resolve(__dirname, "mocks/trade-page.html");
  8  |
  9  | test.describe("Extension E2E", () => {
  10 |   test("sidepanel renders with tabs and empty state", async ({ page, extensionId }) => {
  11 |     await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  12 |
  13 |     // Chrome bar title
> 14 |     await expect(page.getByTestId("chrome-bar-title")).toBeVisible();
     |                                                        ^ Error: expect(locator).toBeVisible() failed
  15 |     await expect(page.getByTestId("chrome-bar-title")).toHaveText("PoE Shopping List");
  16 |
  17 |     // Tab header (single tab — "My Lists")
  18 |     await expect(page.getByTestId("tab-mine")).toBeVisible();
  19 |
  20 |     // Empty-state content in Mine tab
  21 |     await expect(page.getByTestId("empty-mine")).toBeVisible();
  22 |     await expect(page.getByTestId("create-list-btn")).toBeVisible();
  23 |   });
  24 |
  25 |   test("content script injects FAB on mocked trade page", async ({ page, extensionId }) => {
  26 |     // Intercept requests to the trade site and serve our mock HTML
  27 |     await page.route("https://www.pathofexile.com/trade/**", async (route) => {
  28 |       await route.fulfill({
  29 |         status: 200,
  30 |         contentType: "text/html",
  31 |         path: mockTradePagePath,
  32 |       });
  33 |     });
  34 |
  35 |     await page.goto("https://www.pathofexile.com/trade/search/Mirage/test-search-id");
  36 |
  37 |     // The FAB host is injected at fixed position top-right with a data-testid.
  38 |     const fabHost = page.getByTestId("poe-sl-fab-host");
  39 |     await expect(fabHost).toBeVisible({ timeout: 10_000 });
  40 |
  41 |     // The FAB button lives inside the shadow DOM; Playwright pierces it automatically.
  42 |     const fabButton = page.getByTestId("poe-sl-fab-btn");
  43 |     await expect(fabButton).toBeVisible();
  44 |   });
  45 | });
  46 |
```
