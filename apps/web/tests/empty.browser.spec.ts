import { test, expect } from "@playwright/test";

test("production catalog exposes its sample lists and stable document state", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".list-card")).toHaveCount(3);
  await expect(page.locator(".list-card h2")).toHaveText([
    "SAMPLE MOCK: Defense Upgrades for a Sample League",
    "SAMPLE MOCK: Evergreen Guardian Basics",
    "SAMPLE MOCK: Mercenary League-Start Essentials",
  ]);
  await expect(page.locator(".category-section")).toHaveCount(3);
  await expect(page.locator(".category-heading h2")).toHaveText(["defense", "guardian", "mercenaries"]);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index,follow");
  await page.locator("#game").selectOption("poe1");
  expect(new URL(page.url()).searchParams.get("game")).toBe("poe1");
  await page.locator("#reset-filters").click();
  await expect(page.locator("#search")).toBeFocused();
  expect(new URL(page.url()).search).toBe("");
  await expect(page.locator(".list-card:visible")).toHaveCount(3);
  await expect(page.locator(".category-section:visible")).toHaveCount(3);
  const listRoute = await page.request.get("/lists/not-a-route");
  const filterRoute = await page.request.get("/category/not-a-route");
  expect(listRoute.status()).toBe(404);
  expect(filterRoute.status()).toBe(404);
});
