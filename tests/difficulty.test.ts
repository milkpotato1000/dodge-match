import { it, expect } from "vitest";
import { Engine, PLAYER_SPEED, STEP } from "../src/core";
import chart from "../public/chart.json";
it("triples starting and scheduled baseball counts and raises speeds by 30 percent", () => {
  const e = new Engine(chart, 123);
  expect(e.balls).toHaveLength(9);
  const rows = [
    [0, 9, 23.4],
    [30000, 18, 28.6],
    [60000, 30, 36.4],
    [90000, 45, 46.8],
    [120000, 66, 59.8],
    [150000, 84, 75.4],
    [165000, 96, 84.5],
    [240000, 96, 84.5],
    [250000, 96, 84.5],
  ];
  for (const [time, count, speed] of rows) {
    e.time = time;
    expect(e.difficulty().count).toBe(count);
    expect(e.difficulty().speed).toBeCloseTo(speed);
  }
  e.time = 15000;
  expect(e.difficulty().count).toBe(13);
  expect(e.difficulty().speed).toBeCloseTo(26);
});
it.each([
  { x: 1, y: 0 },
  { x: 1, y: 1 },
])("moves at 63U/s with input %s", (move) => {
  const e = new Engine(chart, 1);
  e.balls = [];
  e.move = move;
  const p = { ...e.player };
  e.step();
  expect(PLAYER_SPEED).toBe(63);
  expect(
    Math.hypot(e.player.x - p.x, e.player.y - p.y) / (STEP / 1000),
  ).toBeCloseTo(63);
});
it("fills 96 hazards under increased spawn demand without exceeding the cap", () => {
  const e = new Engine(chart, 1);
  e.time = 165000;
  e.tick = 9900;
  e.player = { x: 50, y: 50 };
  for (let i = 0; i < 600; i++) {
    e.end = null;
    e.score.life = 100;
    const lastId = Math.max(...e.balls.map((b) => b.id));
    e.step();
    expect(e.balls.length).toBeLessThanOrEqual(96);
    for (const b of e.balls.filter((b) => b.id > lastId))
      expect(
        Math.hypot(b.x - e.player.x, b.y - e.player.y),
      ).toBeGreaterThanOrEqual(15);
  }
  expect(e.balls).toHaveLength(96);
});
