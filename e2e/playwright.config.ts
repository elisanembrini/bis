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
    { name: "chromium-mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "docker compose up --build",
    cwd: "..",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 300_000,
  },
});
