import { test, expect } from "@playwright/test";
test("v2 displays 240 seconds and 247 targets and renders 96 physical hazards", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("240 SEC", { exact: false })).toBeVisible();
  await expect(page.getByText("247 TARGETS", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "플레이 시작" }).click();
  await page.waitForFunction(() => window.__dodge?.state === "playing");
  expect(await page.evaluate(() => window.__dodge.engine.balls.length)).toBe(9);
  // Visual stress fixture only: does not claim a human survival run.
  await page.evaluate(() => {
    const e = window.__dodge.engine;
    e.time = 165000;
    e.tick = 9900;
    e.nextTarget = e.chart.targets.length;
    e.targets = [];

    e.zones.resolve(e.player);
    e.balls = [];
    for (let i = 0; i < 96; i++) e.addBall(true);
  });
  await page.waitForTimeout(50);
  expect(await page.evaluate(() => window.__dodge.engine.balls.length)).toBe(
    96,
  );
  await page.screenshot({
    path: "docs/verification/difficulty-v2/playing96.png",
  });
});
