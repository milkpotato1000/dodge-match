import { test, expect } from "@playwright/test";
test("setup, live keyboard and target input, pause, resume and local result", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("button", { name: "플레이 시작" })).toBeVisible();
  await page.screenshot({ path: "docs/verification/first-playable/setup.png" });
  await page.locator("#name").fill("PLAYTEST");
  await page.getByRole("button", { name: "플레이 시작" }).click();
  await page.waitForFunction(() => window.__dodge?.state === "playing");
  const before = await page.evaluate(() => window.__dodge.engine.player.x);
  await page.keyboard.down("a");
  await page.waitForTimeout(120);
  await page.keyboard.up("a");
  expect(
    await page.evaluate(() => window.__dodge.engine.player.x),
  ).toBeLessThan(before);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "PAUSED." })).toBeVisible();
  const frozen = await page.evaluate(() => window.__dodge.engine.time);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.__dodge.engine.time)).toBe(frozen);
  await page.getByRole("button", { name: "계속하기" }).click();
  await page.waitForFunction(() => window.__dodge?.state === "playing");
  await page.screenshot({
    path: "docs/verification/first-playable/playing.png",
  });
  // Deliberately click a visible target early using actual canvas coordinates.
  const p = await page.evaluate(() => {
    const d = window.__dodge,
      t = d.engine.targets.find((t) => !t.judged),
      c = document.querySelector("canvas").getBoundingClientRect();
    return t
      ? {
          x: c.left + ((828 + t.x * 7.44) * c.width) / 1600,
          y: c.top + ((120 + t.y * 7.44) * c.height) / 900,
        }
      : null;
  });
  if (p) await page.mouse.click(p.x, p.y);
  // Isolate result UI with a deterministic collision fixture; no product bypass exists.
  await page.evaluate(() => {
    const e = window.__dodge.engine;
    e.balls = [
      { id: 999, x: e.player.x, y: e.player.y, vx: 18, vy: 0, activeAt: 0 },
    ];
  });
  await expect(page.getByRole("heading", { name: "GAME OVER." })).toBeVisible();
  await expect(
    page.getByText("야구공과 충돌했어요.", { exact: false }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/verification/first-playable/result.png",
  });
  await page.getByRole("button", { name: "로컬 기록 →" }).click();
  await expect(
    page.getByRole("cell", { name: "PLAYTEST", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "로컬 기록 보기" }).click();
  await expect(
    page.getByRole("cell", { name: "PLAYTEST", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("swapped layout persists and portrait blocks start", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "MATCH / DODGE", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "MATCH / DODGE", exact: true }),
  ).toHaveClass("selected");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByText("가로로 돌려주세요")).toBeVisible();
  await page.screenshot({
    path: "docs/verification/first-playable/portrait.png",
  });
});
test("failed preload exposes retry instead of false completion", async ({
  page,
}) => {
  await page.route("**/chart.json", (route) => route.abort());
  await page.goto("/");
  await expect(page.getByRole("button", { name: "RETRY" })).toBeVisible();
  await expect(page.locator("#load-label")).toContainText("LOAD FAILED");
});
test("mobile landscape supports simultaneous D-pad and Match touches", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByRole("button", { name: "플레이 시작" }).click();
  await page.waitForFunction(() => window.__dodge?.state === "playing");
  const point = await page.evaluate(() => {
    const c = document.querySelector("canvas").getBoundingClientRect(),
      d = window.__dodge,
      t = d.engine.targets.find((t) => !t.judged);
    return {
      pad: { x: c.left + 106, y: c.bottom - 72 },
      target: {
        x: c.left + ((828 + t.x * 7.44) * c.width) / 1600,
        y: c.top + ((120 + t.y * 7.44) * c.height) / 900,
      },
      before: d.engine.player.x,
    };
  });
  const session = await context.newCDPSession(page);
  const move = { ...point.pad, id: 1, radiusX: 4, radiusY: 4 };
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [move],
  });
  await page.waitForTimeout(80);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [move, { ...point.target, id: 2, radiusX: 4, radiusY: 4 }],
  });
  await page.waitForTimeout(80);
  expect(
    await page.evaluate(() => window.__dodge.engine.player.x),
  ).toBeGreaterThan(point.before);
  expect(
    await page.evaluate(() => window.__dodge.engine.score.counts.Miss),
  ).toBe(1);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.screenshot({
    path: "docs/verification/first-playable/mobile.png",
  });
  await context.close();
});
test("sixteen-tile scene renders after accelerated verified chart fixture", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "플레이 시작" }).click();
  await page.waitForFunction(() => window.__dodge?.state === "playing");
  await page.evaluate(() => {
    const e = window.__dodge.engine;
    while (e.time < 51000 && !e.end) {
      e.balls = [];
      for (const t of e.targets)
        if (!t.judged && t.locked && Math.abs(e.time - t.at) < 10) e.tap(t.id);
      e.step();
    }
    e.zones.reroll(2, e.time);
  });
  await page.waitForTimeout(50);
  await page.screenshot({
    path: "docs/verification/tile-match-v3/sixteen-tile.png",
  });
  expect(
    await page.evaluate(() => window.__dodge.engine.zones.zones.length),
  ).toBe(16);
  await page.keyboard.press("Escape");
});
