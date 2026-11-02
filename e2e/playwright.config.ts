import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium-mobile",
      testIgnore: "**/pwa.spec.ts",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "chromium-pwa",
      testMatch: "**/pwa.spec.ts",
      use: { ...devices["Pixel 7"], baseURL: "http://localhost:4173" },
    },
  ],
  webServer: [
    {
      command: "docker compose up --build",
      cwd: "..",
      url: "http://localhost:5173",
      reuseExistingServer: true,
      timeout: 300_000,
    },
    {
      command: "pnpm --filter bis-frontend build && pnpm --filter bis-frontend preview --port 4173 --strictPort",
      cwd: "..",
      url: "http://localhost:4173",
      reuseExistingServer: true,
      timeout: 300_000,
    },
  ],
});
