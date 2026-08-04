import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { outputFolder: "test-results/playwright-report", open: "never" }], ["list"]],
  outputDir: "test-results/artifacts",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:45673",
    // Local verification may point at an already-installed Chrome. CI keeps
    // Playwright's bundled Chromium when this opt-in variable is unset.
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } }
      : {}),
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },
  webServer: {
    command: "node_modules/.bin/astro build && node_modules/.bin/astro preview --host 127.0.0.1 --port 45673",
    url: "http://127.0.0.1:45673/",
    cwd: ".",
    timeout: 120_000,
    reuseExistingServer: false,
    stdout: "pipe",
    stderr: "pipe",
  },
});
