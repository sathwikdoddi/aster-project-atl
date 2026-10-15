import { test, expect } from "@playwright/test";

test("explore timeline, expand a case, and switch to grid", async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "A life is more than",
  );
  await expect(page.getByRole("article")).toHaveCount(3);
  await page
    .getByRole("button", { name: "Expand Jordan Ellis case preview" })
    .click();
  await expect(
    page.getByText("5 sample milestones, including undated memories."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Collapse Jordan Ellis case preview" })
    .click();
  await expect(
    page.getByText("5 sample milestones, including undated memories."),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Grid", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Grid", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("article")).toHaveCount(3);
  await expect(
    page.getByRole("heading", { name: "Undated", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Timeline", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Undated", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(browserErrors).toEqual([]);
});

test("case page includes all categories and interactive dated and undated milestones", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Jordan Ellis", exact: true }).click();
  await expect(page).toHaveURL(/\/cases\/jordan-ellis$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Jordan Ellis",
  );
  await expect(
    page.getByText("This is a fictional demonstration record.", {
      exact: true,
    }),
  ).toBeVisible();
  const storyNav = page.getByRole("navigation", { name: "Story sections" });
  for (const label of [
    "Early life",
    "Passions",
    "Death",
    "Investigation",
    "Legacy",
  ])
    await expect(
      storyNav.getByRole("link", { name: new RegExp(label, "i") }),
    ).toBeVisible();
  await page.getByRole("button", { name: /A gathering to remember/ }).click();
  const detail = page.getByRole("region", { name: "Selected milestone" });
  await expect(detail.getByRole("heading")).toHaveText(
    "A gathering to remember",
  );
  await expect(
    detail.getByText("Date not yet documented", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("partial records show deliberate empty states and unknown stories show the not-found page", async ({
  page,
}) => {
  await page.goto("/cases/sam-rivera");
  await expect(
    page.getByText("This part of the story has not been documented yet.", {
      exact: true,
    }),
  ).toHaveCount(5);
  await expect(
    page.getByText("No milestones have been documented yet.", { exact: true }),
  ).toBeVisible();
  // With streaming enabled, Next.js may send HTTP 200 before rendering not-found UI.
  // The API's deterministic HTTP 404 is checked separately below.
  await page.goto("/cases/does-not-exist");
  await expect(
    page.getByRole("heading", { name: "This story isn’t here yet." }),
  ).toBeVisible();
});

test("API returns the shared mock schema and a stable not-found response", async ({
  request,
}) => {
  const list = await request.get("/api/cases");
  expect(list.status()).toBe(200);
  const payload = await list.json();
  expect(payload.meta).toEqual({
    count: 3,
    schemaVersion: "1.0",
    dataSource: "mock",
  });
  expect(
    payload.data.every((record: { isDemo: boolean }) => record.isDemo),
  ).toBe(true);
  const detail = await request.get("/api/cases/jordan-ellis");
  expect((await detail.json()).data.sections).toHaveLength(5);
  const missing = await request.get("/api/cases/unknown");
  expect(missing.status()).toBe(404);
  expect((await missing.json()).error.code).toBe("CASE_NOT_FOUND");
});
