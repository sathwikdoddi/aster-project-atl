import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";

process.env.ASTER_E2E_STORE ??= path.join(
  os.tmpdir(),
  `aster-admin-e2e-${randomUUID()}.json`,
);
const shared = {
  ASTER_LOCAL_STORE: process.env.ASTER_E2E_STORE,
  PUBLICATION_STORE: "local-demo",
  CONTENT_SOURCE: "published",
};

export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 30_000 },
  use: { baseURL: "http://127.0.0.1:3201", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: [
    {
      command: "npm run dev -- --port 3201",
      url: "http://127.0.0.1:3201",
      env: {
        ...shared,
        ADMIN_MODE: "demo",
        PUBLIC_SITE_URL: "http://127.0.0.1:3200",
      },
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      command: "npm run start --workspace=@aster/web -- --port 3200",
      cwd: path.resolve(__dirname, "../.."),
      url: "http://127.0.0.1:3200",
      env: shared,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
