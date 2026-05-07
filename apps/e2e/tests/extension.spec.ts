import { test, expect, openSidepanel, closeSidepanel } from "./fixtures.js";

const mockTradePagePath = decodeURIComponent(
  new URL("./mocks/trade-page.html", import.meta.url).pathname,
).replace(/^\//, "");

async function loadMockTradePage(page: import("@playwright/test").Page) {
  await page.route("https://www.pathofexile.com/trade/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      path: mockTradePagePath,
    });
  });

  await page.goto("https://www.pathofexile.com/trade/search/Mirage/test-search-id");
}

test.describe("Extension E2E", () => {
  test("sidepanel renders with tabs and empty state", async ({ page, context }) => {
    await loadMockTradePage(page);

    // Open sidepanel via the FAB button (realistic flow)
    const sp = await openSidepanel(page, context);

    // Chrome bar title
    await expect(sp.getByTestId("chrome-bar-title")).toBeVisible();
    await expect(sp.getByTestId("chrome-bar-title")).toHaveText("PoE Shopping List");

    // Empty-state content in Mine tab
    await expect(sp.getByTestId("empty-mine")).toBeVisible();
    await expect(sp.getByTestId("create-list-btn")).toBeVisible();
  });

  test("FAB opens the sidepanel and restores dragged position", async ({ page, context }) => {
    await loadMockTradePage(page);

    const fabHost = page.getByTestId("poe-sl-fab-host");
    await expect(fabHost).toBeVisible({ timeout: 10_000 });
    const fabButton = page.getByTestId("poe-sl-fab-btn");
    await expect(fabButton).toBeVisible();

    const initialBox = await fabHost.boundingBox();
    expect(initialBox).not.toBeNull();

    const sp = await openSidepanel(page, context);
    await expect(sp.getByTestId("chrome-bar-title")).toBeVisible();
    await expect
      .poll(async () => await fabHost.evaluate((el) => getComputedStyle(el).opacity))
      .toBe("0");

    await closeSidepanel(sp);
    await expect
      .poll(async () => await fabHost.evaluate((el) => getComputedStyle(el).opacity))
      .toBe("1");

    await page.mouse.move(
      initialBox!.x + initialBox!.width / 2,
      initialBox!.y + initialBox!.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      initialBox!.x + initialBox!.width / 2,
      initialBox!.y + initialBox!.height / 2 + 120,
    );
    await page.mouse.up();

    await expect(fabHost).toBeVisible();
    const draggedTop = await fabHost.evaluate((el) => getComputedStyle(el).top);
    expect(draggedTop).not.toBe(`${Math.round(initialBox!.y)}px`);

    await page.reload();
    const restoredHost = page.getByTestId("poe-sl-fab-host");
    await expect(restoredHost).toBeVisible({ timeout: 10_000 });
    const restoredTop = await restoredHost.evaluate((el) => getComputedStyle(el).top);
    expect(restoredTop).toBe(draggedTop);
  });
});
