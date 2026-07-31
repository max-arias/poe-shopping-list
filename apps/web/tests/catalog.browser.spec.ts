import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const shareable = {
  format: "poe-shopping-list",
  version: 1,
  title: "Browser fixture: Mercenary essentials",
  overview: "Deterministic browser-only overview.",
  items: [
    { title: "First ordered recommendation", tradeUrl: "https://www.pathofexile.com/trade/search/BrowserTest?q=first", quantity: 2, variant: "Corrupted", note: "The first deterministic rationale." },
    { title: "Second ordered recommendation", tradeUrl: "https://www.pathofexile.com/trade/search/BrowserTest?q=second", quantity: 1 },
    { title: "Third ordered recommendation", tradeUrl: "https://www.pathofexile.com/trade/search/BrowserTest?q=third", variant: "Any" },
    { title: "Fourth ordered recommendation", tradeUrl: "https://www.pathofexile.com/trade/search/BrowserTest?q=fourth", quantity: 3, note: "A later item revealed by expansion." },
  ],
};

test.describe("populated test-only catalog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Production taxonomy is intentionally empty. In explicit fixture mode,
    // seed the controls with the same taxonomy resolved by the test loader.
    await page.evaluate(() => {
      for (const [id, values] of [["category", ["mercenaries", "guardian"]], ["tag", ["league-start", "defense"]]] as const) {
        const select = document.querySelector<HTMLSelectElement>(`#${id}`)!;
        select.replaceChildren(...values.map((value) => new Option(value, value)));
        select.disabled = false;
      }
    });
  });

  test("uses URL-backed taxonomy filters and local-only search", async ({ page }) => {
    await page.locator("#search").fill("Mercenary");
    expect(new URL(page.url()).search).toBe("");
    await page.locator("#game").selectOption("poe1");
    await page.locator("#league").selectOption("Browser Test League");
    await page.locator("#category").selectOption(["mercenaries", "guardian"]);
    await page.locator("#tag").selectOption(["league-start", "defense"]);
    const url = new URL(page.url());
    expect(url.searchParams.get("game")).toBe("poe1");
    expect(url.searchParams.get("league")).toBe("Browser Test League");
    expect(url.searchParams.getAll("category")).toEqual(["mercenaries", "guardian"]);
    expect(url.searchParams.getAll("tag")).toEqual(["league-start", "defense"]);
    await expect(page.locator(".list-card:visible")).toHaveCount(1);
    await expect(page.locator(".list-card:visible h2")).toHaveText("Browser fixture: Mercenary essentials");
  });

  test("preserves optional overview, ordering, quantities, variants, and expansion", async ({ page }) => {
    const mercenary = page.locator(".list-card").filter({ hasText: "Mercenary essentials" });
    await expect(mercenary.locator(".list-overview")).toHaveText("Deterministic browser-only overview.");
    await expect(mercenary.locator(".item-title")).toHaveCount(4);
    await expect(mercenary.locator(".item-title").nth(0)).toContainText("First ordered recommendation");
    await expect(mercenary.locator(".item-variant").nth(0)).toHaveText("×2 · Corrupted");
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
