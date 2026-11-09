import { test, expect } from "@playwright/test";
import { rm } from "node:fs/promises";

test.beforeEach(async () => {
  if (process.env.ASTER_E2E_STORE)
    await rm(process.env.ASTER_E2E_STORE, { force: true });
});

test("an owner can save, preview, publish, revise, and unpublish without leaking an unchecked field", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Review Jordan Ellis", exact: true })
    .click();
  await page
    .getByLabel("Public introduction", { exact: false })
    .fill("An approved fictional introduction for the public profile.");
  await page.getByRole("checkbox", { name: /Date of birth/ }).uncheck();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved");
  const before = await page.request.get("http://127.0.0.1:3200/api/cases");
  expect((await before.json()).data).toEqual([]);
  await page
    .getByRole("button", { name: "Publish profile", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Published.");
  const live = await page.request.get(
    "http://127.0.0.1:3200/api/cases/jordan-ellis",
  );
  expect(live.status()).toBe(200);
  const record = (await live.json()).data;
  expect(record.birthDate).toBeNull();
  expect(record.display.birthDate).toBe(false);
  expect(
    record.events.some((entry: { id: string }) => entry.id === "jordan-birth"),
  ).toBe(false);
  const publicPage = await context.newPage();
  await publicPage.goto("http://127.0.0.1:3200/cases/jordan-ellis");
  await expect(publicPage.getByRole("heading", { level: 1 })).toHaveText(
    "Jordan Ellis",
  );
  await expect(
    publicPage.locator("dt").filter({ hasText: /^Born$/ }),
  ).toHaveCount(0);
  await expect(
    publicPage.getByText(
      "An approved fictional introduction for the public profile.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByLabel("Public introduction", { exact: false })
    .fill("A revised introduction that is still a private draft.");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved");
  const unchanged = await page.request.get(
    "http://127.0.0.1:3200/api/cases/jordan-ellis",
  );
  expect((await unchanged.json()).data.summary).toBe(
    "An approved fictional introduction for the public profile.",
  );
  await page
    .getByRole("button", { name: "Published version", exact: true })
    .click();
  await expect(page.locator(".preview-cover")).toContainText(
    "An approved fictional introduction for the public profile.",
  );
  await page
    .getByRole("button", { name: "Publish update", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Published.");
  const updated = await page.request.get(
    "http://127.0.0.1:3200/api/cases/jordan-ellis",
  );
  expect((await updated.json()).data.summary).toBe(
    "A revised introduction that is still a private draft.",
  );
  await page.getByRole("button", { name: "Unpublish", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Unpublished.");
  const gone = await page.request.get(
    "http://127.0.0.1:3200/api/cases/jordan-ellis",
  );
  expect(gone.status()).toBe(404);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("profile search and empty publication states work", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "Search profiles" })
    .fill("no matching person");
  await expect(
    page.getByRole("heading", { name: "No matching profiles." }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Published stories/ }).click();
  await expect(
    page.getByRole("heading", { name: "A place for stories to be shared." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
