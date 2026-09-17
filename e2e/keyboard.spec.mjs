import { test, expect } from "@playwright/test";
test("AC-30: persisted exclusive keys, physical codes, focus and pause resets", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const selected = (layout) =>
    page.getByRole("button", {
      name: layout === "wasd" ? "WASD" : "방향키 ↑ ↓ ← →",
      exact: true,
    });
  await expect(selected("wasd")).toHaveAttribute("aria-pressed", "true");
  await selected("arrows").click();
  await page.reload();
  await expect(selected("arrows")).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({
    path: "docs/verification/keyboard-layout/setup.png",
  });
  await page.getByRole("button", { name: "플레이 시작" }).click();
  await page.waitForFunction(() => window.__dodge?.state === "playing");
  await page.evaluate(() => (window.__dodge.engine.balls = []));
  const point = () =>
    page.evaluate(() => ({ ...window.__dodge.engine.player }));
  const before = await point();
  await page.keyboard.down("d");
  await page.waitForTimeout(80);
  await page.keyboard.up("d");
  expect(await point()).toEqual(before);
  const prevented = await page.evaluate(() => {
    const e = new KeyboardEvent("keydown", {
      code: "ArrowRight",
      key: "ArrowRight",
      bubbles: true,
      cancelable: true,
    });
    document.body.dispatchEvent(e);
    return e.defaultPrevented;
  });
  expect(prevented).toBe(true);
  await page.waitForTimeout(80);
  expect((await point()).x).toBeGreaterThan(before.x);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "PAUSED." })).toBeVisible();
  expect(await page.evaluate(() => window.__dodge.engine.move)).toEqual({
    x: 0,
    y: 0,
  });
  await selected("wasd").click();
  expect(await page.evaluate(() => window.__dodge.engine.move)).toEqual({
    x: 0,
    y: 0,
  });
  await page.screenshot({
    path: "docs/verification/keyboard-layout/paused.png",
  });
  await page.getByRole("button", { name: "계속하기" }).click();
  await page.waitForFunction(() => window.__dodge?.state === "playing");
  const stationary = await point();
  await page.waitForTimeout(80);
  expect(await point()).toEqual(stationary);
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(80);
  await page.keyboard.up("ArrowRight");
  expect(await point()).toEqual(stationary);
  // Physical KeyD must work with a Korean key value, and keyup releases by code.
  await page.evaluate(() =>
    document.body.dispatchEvent(
      new KeyboardEvent("keydown", {
        code: "KeyD",
        key: "ㅇ",
        bubbles: true,
        cancelable: true,
      }),
    ),
  );
  await page.waitForTimeout(80);
  expect((await point()).x).toBeGreaterThan(stationary.x);
  await page.evaluate(() =>
    document.body.dispatchEvent(
      new KeyboardEvent("keyup", { code: "KeyD", key: "D", bubbles: true }),
    ),
  );
  await page.evaluate(() => {
    const el = document.createElement("input");
    el.id = "focus-fixture";
    document.body.append(el);
    el.focus();
  });
  const editing = await point();
  await page.keyboard.down("a");
  await page.waitForTimeout(80);
  await page.keyboard.up("a");
  expect(await point()).toEqual(editing);
  await page.evaluate(() => document.getElementById("focus-fixture").remove());
  await page.keyboard.down("a");
  await page.waitForTimeout(40);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  expect(await page.evaluate(() => window.__dodge.engine.move)).toEqual({
    x: 0,
    y: 0,
  });
  await expect(selected("wasd")).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.up("a");
  expect(errors).toEqual([]);
});
