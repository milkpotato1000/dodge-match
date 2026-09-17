import { test, expect } from "@playwright/test";

test("matching tile doubles combo score, reuses loading jump, and collision uses original crying image", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "플레이 시작" }).click();
  await page.waitForFunction(() => window.__dodge?.state === "playing");
  // Stop automatic frames while preparing precise timing; input still uses the actual canvas.
  const point = await page.evaluate(() => {
    const d = window.__dodge,
      e = d.engine;
    d.game.loop.sleep();
    e.balls = [];
    e.tick = 120;
    e.time = 2000;
    e.player = { x: 37.5, y: 37.5 };
    e.zones.resolve(e.player);
    const t = e.targets[0];
    e.zones.zones[e.zones.current].color = t.color;
    d.scene.draw();
    const c = document.querySelector("canvas").getBoundingClientRect();
    return {
      x: c.left + ((828 + t.x * 7.44) * c.width) / 1600,
      y: c.top + ((120 + t.y * 7.44) * c.height) / 900,
    };
  });
  await page.mouse.click(point.x, point.y);
  const matched = await page.evaluate(() => {
    const d = window.__dodge,
      e = d.engine;
    e.step();
    d.scene.draw();
    const snapshot = {
      score: e.score.match,
      combo: e.score.combo,
      changed: e.zones.zones[e.zones.current].changed,
      successAt: e.successAt,
      count: e.zones.zones.length,
      texture: d.scene.dog.texture.key,
      frame: d.scene.dog.frame.name,
    };
    // Waking Phaser may immediately advance multiple fixed steps; snapshot before it.
    d.game.loop.wake();
    return snapshot;
  });
  expect(matched).toMatchObject({
    score: 200,
    combo: 1,
    count: 16,
    texture: "dog-loading",
    frame: "happy",
  });
  expect(matched.changed).toBe(matched.successAt);
  await page.screenshot({
    path: "docs/verification/tile-match-v3/success.png",
  });
  await page.waitForFunction(
    () => window.__dodge.scene.dog.texture.key === "dog",
  );
  expect(await page.evaluate(() => window.__dodge.scene.dog.texture.key)).toBe(
    "dog",
  );
  await page.evaluate(() => {
    const e = window.__dodge.engine;
    e.balls = [
      { id: 999, x: e.player.x, y: e.player.y, vx: 18, vy: 0, activeAt: 0 },
    ];
  });
  await page.waitForFunction(() => window.__dodge.state === "ending");
  expect(await page.evaluate(() => window.__dodge.scene.dog.texture.key)).toBe(
    "dog-cry",
  );
  await page.screenshot({
    path: "docs/verification/tile-match-v3/collision.png",
  });
  await expect(page.getByRole("heading", { name: "GAME OVER." })).toBeVisible();
  expect(await page.evaluate(() => window.__dodge.scene.dog.texture.key)).toBe(
    "dog",
  );
  expect(errors).toEqual([]);
});

test("match depletion never shows the crying sprite", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "플레이 시작" }).click();
  await page.waitForFunction(() => window.__dodge?.state === "playing");
  await page.evaluate(() => {
    const e = window.__dodge.engine;
    e.balls = [];
    e.score.life = 1;
    e.tap(e.targets[0].id);
  });
  await expect(page.getByRole("heading", { name: "GAME OVER." })).toBeVisible();
  expect(
    await page.evaluate(() => ({
      end: window.__dodge.engine.end,
      texture: window.__dodge.scene.dog.texture.key,
    })),
  ).toEqual({ end: "match_depleted", texture: "dog" });
});
