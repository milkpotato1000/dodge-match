import { describe, it, expect } from "vitest";
import chart from "../public/chart.json";
import {
  Score,
  grade,
  validateChart,
  Engine,
  Random,
  Zones,
  travel,
  swept,
  direction,
  STEP,
} from "../src/core";
describe("adopted gameplay rules", () => {
  it("validates 247 chart targets and independent maximum score", () => {
    expect(validateChart(chart).targets.at(-1)?.at).toBe(239625);
    const s = new Score();
    for (let i = 0; i < 247; i++) s.judge("Perfect", true);
    expect(s.match).toBe(85550);
    expect(s.total(240000)).toBe(109550);
    expect(s.total(1999) - s.match).toBe(100);
  });
  it.each([
    [0, "Perfect"],
    [60, "Perfect"],
    [-60, "Perfect"],
    [60.001, "Perfect"],
    [65, "Perfect"],
    [-65, "Perfect"],
    [70, "Perfect"],
    [-70, "Perfect"],
    [70.001, "Great"],
    [-70.001, "Great"],
    [120, "Great"],
    [-120, "Great"],
    [120.001, "Good"],
    [200, "Good"],
    [-200, "Good"],
    [200.001, "Miss"],
  ])("grades %s as %s", (ms, g) => expect(grade(Number(ms))).toBe(g));
  it("rejects invalid chart overlaps and metadata", () => {
    expect(() => validateChart({ ...chart, maxScore: 1 })).toThrow();
    expect(() =>
      validateChart({
        ...chart,
        targets: chart.targets.map((t, i) =>
          i === 0 ? { ...t, at: 2001 } : t,
        ),
      }),
    ).toThrow();
  });
  it("tracks separate health, recovery and score combos", () => {
    const s = new Score();
    for (let i = 0; i < 4; i++) s.judge("Great");
    expect(s.life).toBe(68);
    s.judge("Perfect");
    expect(s.life).toBe(74);
    s.judge("Good");
    expect(s.recovery).toBe(0);
    expect(s.combo).toBe(6);
    for (let i = 0; i < 4; i++) s.judge("Miss");
    expect(s.life).toBe(18);
    expect(s.combo).toBe(0);
    s.judge("Good");
    s.judge("Miss");
    expect(s.life).toBe(10);
    s.judge("Miss");
    expect(s.life).toBe(0);
  });
  it("normalizes diagonals and preserves reflected speed", () => {
    expect(Math.hypot(...Object.values(direction(1, 1)))).toBeCloseTo(1);
    const b = { id: 0, x: 98, y: 98, vx: 10, vy: 10, activeAt: 0 };
    travel(b, 0.2);
    expect(b.vx).toBe(-10);
    expect(b.vy).toBe(-10);
    expect(b.x).toBeCloseTo(96.8);
    expect(b.y).toBeCloseTo(96.8);
  });
  it("detects high-speed swept contact and rejects separated paths", () => {
    expect(
      swept(
        { x: 50, y: 50 },
        { x: 50, y: 50 },
        { x: 0, y: 50 },
        { x: 100, y: 50 },
        3.1,
      ),
    ).toBe(true);
    expect(
      swept(
        { x: 50, y: 54 },
        { x: 50, y: 54 },
        { x: 0, y: 50 },
        { x: 100, y: 50 },
        3.1,
      ),
    ).toBe(false);
  });
  it("reflects identically under frame subdivision", () => {
    const a = { id: 0, x: 90, y: 80, vx: 65, vy: 13, activeAt: 0 },
      b = { ...a };
    travel(a, 3);
    for (let i = 0; i < 180; i++) travel(b, 1 / 60);
    expect(b.x).toBeCloseTo(a.x);
    expect(b.y).toBeCloseTo(a.y);
    expect(b.vx).toBe(a.vx);
  });
  it("replays seed, input, balls and targets deterministically", () => {
    const a = new Engine(chart, 1234),
      b = new Engine(chart, 1234);
    for (let i = 0; i < 1200; i++) {
      a.move = b.move = { x: Math.sin(i / 40) > 0 ? 1 : -1, y: 0 };
      a.step();
      b.step();
    }
    expect(a).toEqual(b);
    expect(new Engine(chart, 5678).balls).not.toEqual(
      new Engine(chart, 1234).balls,
    );
  });
  it("exercises a full 240-second chart with collision-free test fixture", () => {
    const e = new Engine(chart, 999);
    for (let i = 0; i < 14400; i++) {
      e.balls = [];
      for (const t of e.targets)
        if (!t.judged && t.locked && Math.abs(e.time - t.at) <= STEP / 2) {
          e.zones.zones[e.zones.resolve(e.player)].color = t.color;
          e.tap(t.id);
        }
      e.step();
    }
    expect(e.end).toBe("chart_complete");
    expect(e.score.counts.Perfect).toBe(247);
    expect(e.score.total(e.time)).toBe(109550);
  });
});
