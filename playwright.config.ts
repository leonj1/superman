import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./apps/web/e2e",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 1920, height: 1080 },
  },
  webServer: {
    command:
      "VITE_TILE_PROVIDER=offline-fixture VITE_QUALITY_PROFILE=ultra VITE_GOOGLE_MAP_TILES_KEY= pnpm --filter @superman/web build && pnpm --filter @superman/web preview --host 0.0.0.0",
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
});
