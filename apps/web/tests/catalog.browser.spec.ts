import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("authored catalog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("uses URL-backed taxonomy filters and includes RF Essentials", async ({ page }) => {
    await page.locator("#search").fill("RF Essentials");
    expect(new URL(page.url()).search).toBe("");
    await page.locator("#game").selectOption("poe1");
    await page.locator("#league").selectOption("evergreen");
    await page.locator('[data-filter-menu="category"] input[value="righteous-fire"]').check();
    await page.locator('[data-filter-menu="tag"] input[value="righteous-fire"]').check();
    await expect(page.locator(".list-card:visible h2")).toHaveText("RF Essentials");

    const url = new URL(page.url());
    expect(url.searchParams.get("game")).toBe("poe1");
    expect(url.searchParams.get("league")).toBe("evergreen");
    expect(url.searchParams.getAll("category")).toEqual(["righteous-fire"]);
    expect(url.searchParams.getAll("tag")).toEqual(["righteous-fire"]);
  });

  test("groups authored cards and hides empty groups while filtering", async ({ page }) => {
    const sections = page.locator(".category-section");
    await expect(sections).not.toHaveCount(0);
    await page.locator("#search").fill("RF Essentials");
    await expect(sections.filter({ hasText: "righteous-fire" })).toBeVisible();
    await expect(page.locator(".category-section:visible").filter({ hasNotText: "righteous-fire" })).toHaveCount(0);
  });

  test("category headings toggle the existing category filter", async ({ page }) => {
    const heading = page.getByRole("button", { name: "Filter by category: righteous-fire" });
    await heading.click();
    await expect(heading).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('[data-filter-summary="category"]')).toHaveText("righteous-fire");
    expect(new URL(page.url()).searchParams.getAll("category")).toEqual(["righteous-fire"]);
    await expect(page.locator(".list-card:visible h2")).toHaveText("RF Essentials");

    await page.getByRole("button", { name: "Remove category: righteous-fire" }).click();
    await expect(page.locator('[data-filter-summary="category"]')).toHaveText("All categories");
    expect(new URL(page.url()).search).toBe("");
    await expect(page.locator(".list-card:visible")).not.toHaveCount(0);
  });

  test("preserves authored overview and ordered item expansion", async ({ page }) => {
    const card = page.locator(".list-card").filter({ hasText: "Master's Red Arc Ignite Elementalist" });
    await expect(card).toBeVisible();
    await expect(card.locator(".item-title")).toHaveCount(8);
    await expect(card.locator(".item-title:visible")).toHaveCount(3);
    await expect(card.locator(".remaining-items")).toBeHidden();
    const disclosure = card.locator(".remaining-collapse");
    await expect(disclosure.locator(".remaining-summary")).toHaveText("");
    await expect(disclosure.locator("> .remaining-items")).toHaveCount(1);
    const arrowBox = await disclosure.locator(".remaining-summary").boundingBox();
    const firstItemBox = await card.locator(".initial-items .list-item").first().boundingBox();
    expect(arrowBox).not.toBeNull();
    expect(firstItemBox).not.toBeNull();
    expect(arrowBox!.height).toBeGreaterThan(0);
    expect(arrowBox!.y + arrowBox!.height).toBeLessThanOrEqual(firstItemBox!.y);
    await disclosure.locator(".remaining-summary").click();
    await expect(disclosure).toHaveAttribute("open", "");
    await expect(card.locator(".remaining-items")).toBeVisible();
    await expect(card.locator(".item-title:visible")).toHaveCount(8);
    await expect(card.locator(".item-title:visible").nth(3)).toContainText("Boneflesh Marble Amulet");
  });

  test("uses official Trade links and Shareable v1 actions", async ({ page }) => {
    const card = page.locator(".list-card").filter({ hasText: "RF Essentials" });
    await expect(card.locator('a[target="_blank"]')).toHaveCount(1);
    await expect(card.locator('a[target="_blank"]').first()).toHaveAttribute("href", /^https:\/\/www\.pathofexile\.com\/trade\/search\//);

    const downloadPromise = page.waitForEvent("download");
    await card.locator("[data-download]").click();
    const download = await downloadPromise;
    const exported = JSON.parse(await readFile((await download.path())! as string, "utf8"));
    expect(exported).toMatchObject({ format: "poe-shopping-list", version: 1, title: "RF Essentials" });
    expect(download.suggestedFilename()).toBe("rf-essentials-shareable-list-v1.json");

    await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: (text: string) => { (window as unknown as { copied: string }).copied = text; return Promise.resolve(); },
    } }));
    await card.locator("[data-copy]").click();
    await expect(page.locator("#action-feedback")).toContainText("copied as Shareable List v1 JSON");
    expect(JSON.parse((await page.evaluate(() => (window as unknown as { copied: string }).copied))!)).toMatchObject({ title: "RF Essentials" });
  });

  test("runs a limited axe scan", async ({ page }) => {
    const results = await new AxeBuilder({ page }).include("main").analyze();
    expect(results.violations).toEqual([]);
  });
});
