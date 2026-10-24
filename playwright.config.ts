import { defineConfig, devices } from "@playwright/test";

const webServerCommand = process.env.CI
  ? "npm run start -- --hostname 127.0.0.1 --port 3100"
  : "npm run dev -- --hostname 127.0.0.1 --port 3100";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  timeout: 30_000,
  expect: {
    timeout: 7_000,
  },
  reporter: [["list"], ["html", { open: "never" }]],
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1365, height: 900 } } },
    { name: "webkit-home", testMatch: ["home-pro-focus.spec.ts", "pro-insights.spec.ts", "home-sections.spec.ts", "planning-flow.spec.ts", "monthly-outlook.spec.ts", "save-actions.spec.ts"], use: { ...devices["iPhone 13"], deviceScaleFactor: 1 } },
  ],
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
    viewport: { width: 1365, height: 900 },
  },
  webServer: {
    command: webServerCommand,
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
