import { test, expect } from "@playwright/test";

test("authored catalog exposes stable document state", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".list-card")).not.toHaveCount(0);
  await expect(page.locator(".list-card h2")).toContainText(["RF Essentials"]);
  await expect(page.locator(".category-section")).not.toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index,follow");
  await page.locator("#game").selectOption("poe1");
  expect(new URL(page.url()).searchParams.get("game")).toBe("poe1");
  await page.locator("#reset-filters").click();
  await expect(page.locator("#search")).toBeFocused();
  expect(new URL(page.url()).search).toBe("");
  await expect(page.locator(".list-card:visible")).not.toHaveCount(0);
  await expect(page.locator(".category-section:visible")).not.toHaveCount(0);
  const listRoute = await page.request.get("/lists/not-a-route");
  const filterRoute = await page.request.get("/category/not-a-route");
  expect(listRoute.status()).toBe(404);
  expect(filterRoute.status()).toBe(404);
});
