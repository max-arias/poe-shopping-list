import { closeSidepanel, expect, openSidepanel, test, waitForSidepanelReady } from './fixtures.js';

const mockTradePagePath = decodeURIComponent(
  new URL('./mocks/trade-page.html', import.meta.url).pathname,
).replace(/^\//, '');

const TRADE_URL = 'https://www.pathofexile.com/trade/search/Mirage/test-search-id';

async function loadMockTradePage(page: import('@playwright/test').Page) {
  await page.route('https://www.pathofexile.com/trade/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      path: mockTradePagePath,
    });
  });

  await page.goto(TRADE_URL);
}

test.describe('Extension E2E', () => {
  test('sidepanel renders with tabs and empty state', async ({ page, context }) => {
    await loadMockTradePage(page);

    // Open sidepanel via the FAB button (realistic flow)
    const sp = await openSidepanel(page, context);

    await waitForSidepanelReady(sp);

    // Empty-state content in Mine tab
    await expect(sp.getByTestId('empty-mine')).toBeVisible();
    await expect(sp.getByTestId('create-list-btn')).toBeVisible();
  });

  test('History tab defaults to Visits and shows current page', async ({ page, context }) => {
    await loadMockTradePage(page);

    const sp = await openSidepanel(page, context);

    await sp.getByRole('tab', { name: 'History' }).click();
    await expect(sp.getByRole('button', { name: /^Visits \(/ })).toBeVisible();
    await expect(sp.getByText(TRADE_URL)).toBeVisible({ timeout: 10_000 });
  });

  test('FAB opens the sidepanel and restores dragged position', async ({ page, context }) => {
    await loadMockTradePage(page);

    const fabHost = page.getByTestId('poe-sl-fab-host');
    await expect(fabHost).toBeVisible({ timeout: 10_000 });
    const fabButton = page.getByTestId('poe-sl-fab-btn');
    await expect(fabButton).toBeVisible();

    const initialBox = await fabHost.boundingBox();
    expect(initialBox).not.toBeNull();
    if (!initialBox) throw new Error('FAB host bounding box not found');

    const sp = await openSidepanel(page, context);
    await waitForSidepanelReady(sp);
    await expect
      .poll(async () => await fabHost.evaluate((el) => getComputedStyle(el).opacity))
      .toBe('0');

    await closeSidepanel(sp);
    await expect
      .poll(async () => await fabHost.evaluate((el) => getComputedStyle(el).opacity))
      .toBe('1');

    await page.mouse.move(
      initialBox.x + initialBox.width / 2,
      initialBox.y + initialBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      initialBox.x + initialBox.width / 2,
      initialBox.y + initialBox.height / 2 + 120,
    );
    await page.mouse.up();

    await expect(fabHost).toBeVisible();
    const draggedTop = await fabHost.evaluate((el) => getComputedStyle(el).top);
    expect(draggedTop).not.toBe(`${Math.round(initialBox.y)}px`);

    await page.reload();
    const restoredHost = page.getByTestId('poe-sl-fab-host');
    await expect(restoredHost).toBeVisible({ timeout: 10_000 });
    const restoredTop = await restoredHost.evaluate((el) => getComputedStyle(el).top);
    expect(restoredTop).toBe(draggedTop);
  });
});
