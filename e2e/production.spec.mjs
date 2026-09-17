import { test, expect } from "@playwright/test";
test("production build boots and reloads offline after cache installation", async ({
  browser,
}) => {
  const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    }),
    page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:4173/");
  await expect(page.getByRole("button", { name: "플레이 시작" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "WASD", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "방향키 ↑ ↓ ← →", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "방향키 ↑ ↓ ← →", exact: true })
    .click();
  await page.getByRole("button", { name: "WASD", exact: true }).click();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  expect(await page.evaluate(() => window.__dodge)).toBeUndefined();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("button", { name: "플레이 시작" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "WASD", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "플레이 시작" }).click();
  await page.waitForTimeout(3500);
  await expect(page.locator("#overlay")).toBeHidden();
  expect(errors).toEqual([]);
  await page.screenshot({
    path: "docs/verification/first-playable/offline.png",
  });
  await context.close();
});
