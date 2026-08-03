import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const shareable = {
  format: "poe-shopping-list",
  version: 1,
  title: "Browser fixture: Mercenary essentials",
  overview: "Deterministic browser-only overview.",
  items: [
    { title: "First ordered recommendation", tradeUrl: "https://www.pathofexile.com/trade/search/BrowserTest?q=first", variant: "Corrupted", note: "The first deterministic rationale." },
    { title: "Second ordered recommendation", tradeUrl: "https://www.pathofexile.com/trade/search/BrowserTest?q=second", variant: "Any" },
    { title: "Third ordered recommendation", tradeUrl: "https://www.pathofexile.com/trade/search/BrowserTest?q=third", variant: "Any" },
    { title: "Fourth ordered recommendation", tradeUrl: "https://www.pathofexile.com/trade/search/BrowserTest?q=fourth", variant: "Any", note: "A later item revealed by expansion." },
  ],
};

test.describe("populated test-only catalog", () => {
  test.beforeEach(async ({ page }) => {
    // This project serves the explicit fixture build, whose loader supplies
    // only the deterministic files under tests/fixtures/content.
    await page.goto("/");
  });

  test("uses URL-backed taxonomy filters and local-only search", async ({ page }) => {
    await page.locator("#search").fill("Mercenary");
    expect(new URL(page.url()).search).toBe("");
    await page.locator("#game").selectOption("poe1");
    await page.locator("#league").selectOption("Browser Test League");
    await page.locator('[data-filter-menu="category"] input[value="mercenaries"]').check();
    await page.locator('[data-filter-menu="category"] input[value="guardian"]').check();
    await page.locator('[data-filter-menu="tag"] input[value="league-start"]').check();
    await page.locator('[data-filter-menu="tag"] input[value="defense"]').check();
    const url = new URL(page.url());
    expect(url.searchParams.get("game")).toBe("poe1");
    expect(url.searchParams.get("league")).toBe("Browser Test League");
    expect(url.searchParams.getAll("category")).toEqual(["mercenaries", "guardian"]);
    expect(url.searchParams.getAll("tag")).toEqual(["league-start", "defense"]);
    await expect(page.locator(".list-card:visible")).toHaveCount(1);
    await expect(page.locator(".list-card:visible h2")).toHaveText("Browser fixture: Mercenary essentials");
  });

  test("clickable taxonomy badges configure filters and preserve selected taxonomy", async ({ page }) => {
    const mercenary = page.locator(".list-card").filter({ hasText: "Mercenary essentials" });
    await mercenary.getByRole("button", { name: "Filter by game: Path of Exile 1" }).click();
    await mercenary.getByRole("button", { name: "Filter by league: Browser Test League" }).click();
    await mercenary.getByRole("button", { name: "Filter by tag: league-start" }).click();
    await mercenary.getByRole("button", { name: "Filter by category: mercenaries" }).click();
    await mercenary.getByRole("button", { name: "Filter by tag: defense" }).click();

    const url = new URL(page.url());
    expect(url.searchParams.get("game")).toBe("poe1");
    expect(url.searchParams.get("league")).toBe("Browser Test League");
    expect(url.searchParams.getAll("category")).toEqual(["mercenaries"]);
    expect(url.searchParams.getAll("tag")).toEqual(["league-start", "defense"]);
    await expect(page.locator(".list-card:visible")).toHaveCount(1);
    await expect(page.locator(".list-card:visible h2")).toHaveText("Browser fixture: Mercenary essentials");
    await expect(page.locator("#search")).toHaveValue("");
  });

  test("preserves optional overview, ordering, variants, and expansion", async ({ page }) => {
    const mercenary = page.locator(".list-card").filter({ hasText: "Mercenary essentials" });
    await expect(mercenary.locator(".list-overview")).toHaveText("Deterministic browser-only overview.");
    await expect(mercenary.locator(".item-title")).toHaveCount(4);
    await expect(mercenary.locator(".item-title").nth(0)).toContainText("First ordered recommendation");
    await expect(mercenary.locator(".item-variant").nth(0)).toHaveText("Corrupted");
    await expect(mercenary.locator(".item-rationale").first()).toContainText("Why");
    await expect(mercenary.locator(".remaining-items")).toBeHidden();
    await mercenary.locator("[data-expand]").click();
    await expect(mercenary.locator(".remaining-items")).toBeVisible();
    await expect(mercenary.locator(".item-title").nth(3)).toContainText("Fourth ordered recommendation");

    const evergreen = page.locator(".list-card").filter({ hasText: "Evergreen guardian" });
    await expect(evergreen.locator(".list-overview")).toHaveCount(0);
    await expect(evergreen).toContainText("Evergreen");
  });

  test("uses official external Trade links and exact Shareable v1 actions", async ({ page }) => {
    const card = page.locator(".list-card").filter({ hasText: "Mercenary essentials" });
    await expect(card.locator('a[target="_blank"]')).toHaveCount(4);
    await expect(card.locator('a[target="_blank"]').first()).toHaveAttribute("href", /^https:\/\/www\.pathofexile\.com\/trade\/search\//);

    const downloadPromise = page.waitForEvent("download");
    await card.locator("[data-download]").click();
    const download = await downloadPromise;
    expect(await readFile((await download.path())! as string, "utf8")).toBe(`${JSON.stringify(shareable, null, 2)}\n`);
    expect(download.suggestedFilename()).toBe("browser-fixture-mercenary-essentials-shareable-list-v1.json");

    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
        writeText: (text: string) => { (window as unknown as { copied: string }).copied = text; return Promise.resolve(); },
      } });
    });
    await card.locator("[data-copy]").click();
    await expect(page.locator("#action-feedback")).toBeVisible();
    await expect(page.locator("#action-feedback")).toContainText("copied as Shareable List v1 JSON");
    expect(await page.evaluate(() => (window as unknown as { copied: string }).copied)).toBe(`${JSON.stringify(shareable, null, 2)}\n`);

    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
        writeText: () => Promise.reject(new Error("clipboard denied")),
      } });
    });
    await card.locator("[data-copy]").click();
    const feedback = page.locator("#action-feedback");
    await expect(feedback).toBeVisible();
    await expect(feedback).toHaveText("Copy failed for Browser fixture: Mercenary essentials.");
    await expect(feedback).toHaveAttribute("role", "status");
    await expect(feedback).toHaveAttribute("aria-live", "polite");
  });

  test("runs a limited axe scan (axe)", async ({ page }) => {
    const results = await new AxeBuilder({ page }).include("main").analyze();
    expect(results.violations).toEqual([]);
  });
});
