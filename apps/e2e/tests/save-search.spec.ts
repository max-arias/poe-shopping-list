import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, openSidepanel, setStorage, test, waitForSidepanelReady } from './fixtures.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mockTradePagePath = path.resolve(__dirname, 'mocks/trade-page.html');

const TRADE_URL = 'https://www.pathofexile.com/trade/search/Mirage/test-search-id';

const EMPTY_RESULTS_HTML = `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /></head>
  <body>
    <div class="search-panel">
      <div class="search-bar">
        <div class="search-left"><input placeholder="Search..." /></div>
      </div>
      <button class="clear-btn">Clear</button>
    </div>
    <div class="resultset" infinite-scroll-disabled="true"></div>
  </body>
</html>`;

/** Create a draft object matching the Draft type for use in storage. */
function makeDraft(
  overrides: Partial<{
    id: string;
    name: string;
    game: string;
    league: string;
    createdAt: number;
    items: Array<Record<string, unknown>>;
  }> = {},
) {
  return {
    id: 'test-draft-1',
    name: 'My Build',
    game: 'poe1',
    league: '',
    createdAt: Date.now(),
    items: [],
    ...overrides,
  };
}

/** Route trade URLs to the mock trade page with results. */
async function routeTradeWithResults(page: import('@playwright/test').Page) {
  await page.route('https://www.pathofexile.com/trade/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      path: mockTradePagePath,
    });
  });
}

/** Route trade URLs to an empty results page. */
async function routeTradeEmpty(page: import('@playwright/test').Page) {
  await page.route('https://www.pathofexile.com/trade/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: EMPTY_RESULTS_HTML,
    });
  });
}

test.describe('Save Search flow', () => {
  test('Save search button is disabled when no search results', async ({ page }) => {
    await routeTradeEmpty(page);
    await page.goto(TRADE_URL);

    const saveBtn = page.locator("[data-poe-sl='save-search']");
    await expect(saveBtn).toBeVisible({ timeout: 10_000 });
    await expect(saveBtn).toBeDisabled();
  });

  test('Save search button is enabled when search results are present', async ({ page }) => {
    await routeTradeWithResults(page);
    await page.goto(TRADE_URL);

    const saveBtn = page.locator("[data-poe-sl='save-search']");
    await expect(saveBtn).toBeVisible({ timeout: 10_000 });
    await expect(saveBtn).toBeEnabled();
  });

  test('Clicking Save search with no lists opens Choose List modal', async ({ page, context }) => {
    await routeTradeWithResults(page);
    await page.goto(TRADE_URL);

    // Open sidepanel via the FAB button (realistic flow)
    const sp = await openSidepanel(page, context);
    await waitForSidepanelReady(sp);

    // Click Save search button on the trade page
    const saveBtn = page.locator("[data-poe-sl='save-search']");
    await expect(saveBtn).toBeVisible({ timeout: 10_000 });
    await saveBtn.click();

    // Assert the ChooseListModal appears in the sidepanel
    await expect(sp.getByText('Save to List')).toBeVisible({ timeout: 10_000 });
    // When no drafts exist the label reads "Create a new list"
    await expect(sp.getByText('Create a new list')).toBeVisible();
  });

  test('Choose List modal shows existing lists when drafts exist', async ({ page, context }) => {
    await routeTradeWithResults(page);
    await page.goto(TRADE_URL);

    // Open sidepanel via the FAB button
    const sp = await openSidepanel(page, context);
    await waitForSidepanelReady(sp);

    // Create a draft in storage via the service worker
    await setStorage(context, 'local:drafts', [makeDraft()]);

    // Wait for the draft to appear in the MineTab (storage watcher should pick it up)
    await expect(sp.getByText('My Build')).toBeVisible({ timeout: 10_000 });

    // Click Save search button on the trade page
    const saveBtn = page.locator("[data-poe-sl='save-search']");
    await expect(saveBtn).toBeVisible({ timeout: 10_000 });
    await saveBtn.click();

    // Assert ChooseListModal shows the existing draft
    await expect(sp.getByText('Save to List')).toBeVisible({ timeout: 10_000 });
    await expect(sp.getByRole('button', { name: 'My Build' })).toBeVisible({ timeout: 10_000 });
  });

  test('Choosing a list from Choose List modal opens Save modal', async ({ page, context }) => {
    await routeTradeWithResults(page);
    await page.goto(TRADE_URL);

    // Open sidepanel via the FAB button
    const sp = await openSidepanel(page, context);
    await waitForSidepanelReady(sp);

    // Create a draft in storage via the service worker
    await setStorage(context, 'local:drafts', [makeDraft()]);

    // Wait for the draft to appear
    await expect(sp.getByText('My Build')).toBeVisible({ timeout: 10_000 });

    // Click Save search button on the trade page
    const saveBtn = page.locator("[data-poe-sl='save-search']");
    await expect(saveBtn).toBeVisible({ timeout: 10_000 });
    await saveBtn.click();

    // Wait for ChooseListModal to appear
    await expect(sp.getByText('Save to List')).toBeVisible({ timeout: 10_000 });

    // Click the draft row in the modal (button)
    await sp
      .getByRole('dialog')
      .filter({ hasText: 'Save to List' })
      .getByRole('button', { name: 'My Build' })
      .click({ force: true });

    // Assert SaveModal appears
    await expect(sp.getByText('Save Search')).toBeVisible({ timeout: 10_000 });
    // The name input should be visible (it is auto-populated from search bar)
    await expect(sp.getByPlaceholder('Item name…')).toBeVisible();
  });

  test('Creating a new list from Choose List modal opens Save modal', async ({ page, context }) => {
    await routeTradeWithResults(page);
    await page.goto(TRADE_URL);

    // Open sidepanel (no drafts exist)
    const sp = await openSidepanel(page, context);
    await waitForSidepanelReady(sp);

    // Click Save search button on the trade page
    const saveBtn = page.locator("[data-poe-sl='save-search']");
    await expect(saveBtn).toBeVisible({ timeout: 10_000 });
    await saveBtn.click();

    // Wait for ChooseListModal to appear
    await expect(sp.getByText('Save to List')).toBeVisible({ timeout: 10_000 });

    // Click "+ New List" button
    const newListBtn = sp
      .getByRole('dialog')
      .filter({ hasText: 'Save to List' })
      .getByRole('button', { name: '+ New List' });
    await expect(newListBtn).toBeVisible();
    await newListBtn.click();

    // Type a name for the new list
    const nameInput = sp.getByPlaceholder('e.g. "RF Jugg"');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('My New Build');

    // Click "Create & Save"
    const createSaveBtn = sp.getByText('Create & Save');
    await expect(createSaveBtn).toBeEnabled();
    await createSaveBtn.click();

    // Assert SaveModal appears
    await expect(sp.getByText('Save Search')).toBeVisible({ timeout: 10_000 });
    await expect(sp.getByPlaceholder('Item name…')).toBeVisible();
  });

  test('Save search button click with active draft opens Save modal directly', async ({
    page,
    context,
  }) => {
    await routeTradeWithResults(page);
    await page.goto(TRADE_URL);

    // Open sidepanel via the FAB button
    const sp = await openSidepanel(page, context);
    await waitForSidepanelReady(sp);

    // Create a draft in storage via the service worker
    await setStorage(context, 'local:drafts', [makeDraft()]);

    // Wait for the draft to appear in the MineTab list
    await expect(sp.getByText('My Build')).toBeVisible({ timeout: 10_000 });

    // Click the draft row to open detail view
    await sp.getByText('My Build').click();

    // Wait for the detail panel to show the "Save This Search" button
    await expect(sp.getByRole('button', { name: 'Save This Search' })).toBeVisible({
      timeout: 5_000,
    });

    // Click Save search button on the trade page
    const saveBtn = page.locator("[data-poe-sl='save-search']");
    await expect(saveBtn).toBeVisible({ timeout: 10_000 });
    await saveBtn.click();

    // Assert the SaveModal opens directly (no ChooseListModal)
    await expect(sp.getByText('Save Search')).toBeVisible({ timeout: 10_000 });
    await expect(sp.getByPlaceholder('Item name…')).toBeVisible();

    // The ChooseListModal should NOT have appeared
    await expect(sp.getByText('Save to List')).not.toBeVisible();
  });
});
