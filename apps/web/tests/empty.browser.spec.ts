import { test, expect } from "@playwright/test";

test("production remains a truthful empty catalog", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".list-card")).toHaveCount(0);
  await expect(page.locator("#result-status")).toHaveText("No Published Lists are available yet.");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index,follow");
  await page.locator("#game").selectOption("poe1");
  expect(new URL(page.url()).searchParams.get("game")).toBe("poe1");
  await page.locator("#reset-filters").click();
  await expect(page.locator("#search")).toBeFocused();
  expect(new URL(page.url()).search).toBe("");
  const listRoute = await page.request.get("/lists/not-a-route");
  const filterRoute = await page.request.get("/category/not-a-route");
  expect(listRoute.status()).toBe(404);
  expect(filterRoute.status()).toBe(404);
});
