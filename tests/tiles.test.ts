import { it, expect } from "vitest";
import { Engine, Zones, Random, Score, COLORS, STEP } from "../src/core";
import { dogMotion } from "../src/dog-motion";
import chart from "../public/chart.json";
function ready() {
  const e = new Engine(chart, 42);
  e.balls = [];
  while (e.time < 1950) {
    e.balls = [];
    e.step();
  }
  return e;
}
it("starts with sixteen independent colors and no clock-driven changes", () => {
  const e = new Engine(chart, 12),
    before = e.zones.zones.map((z) => z.color);
  expect(before).toHaveLength(16);
  expect(new Set(before).size).toBeLessThan(16);
  for (let i = 0; i < 14400; i++) {
    e.balls = [];
    e.end = null;
    e.score.life = 100;
    e.step();
  }
  expect(e.zones.zones.map((z) => z.color)).toEqual(before);
});
it("resolves all sixteen tiles and preserves prior cells inside hairlines", () => {
  const z = new Zones(new Random(1), new Random(2));
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 4; col++)
      expect(z.resolve({ x: col * 25 + 12, y: row * 25 + 12 })).toBe(
        row * 4 + col,
      );
  for (const boundary of [25, 50, 75]) {
    z.resolve({ x: boundary - 1, y: 12 });
    expect(z.resolve({ x: boundary + 0.0625, y: 12 })).toBe(boundary / 25 - 1);
    expect(z.resolve({ x: boundary + 0.0626, y: 12 })).toBe(boundary / 25);
    expect(z.resolve({ x: boundary - 0.0625, y: 12 })).toBe(boundary / 25);
    expect(z.resolve({ x: boundary - 0.0626, y: 12 })).toBe(boundary / 25 - 1);
  }
  z.current = -1;
  expect(z.resolve({ x: 50, y: 50 })).toBe(10);
});
it("doubles after combo rounding without doubling health or combo count", () => {
  const normal = new Score(),
    bonus = new Score();
  normal.combo = bonus.combo = 24;
  normal.judge("Great");
  bonus.judge("Great", true);
  expect(normal.match).toBe(88);
  expect(bonus.match).toBe(176);
  expect(bonus.life).toBe(normal.life);
  expect(bonus.combo).toBe(25);
  bonus.judge("Miss", true);
  expect(bonus.match).toBe(176);
});
it("reads the clicked tile after moving during the former lock window", () => {
  const e = ready(),
    t = e.targets[0];
  const old = e.zones.current;
  e.zones.zones[old].color = (t.color + 1) % 7;
  e.player = { x: 12, y: 12 };
  e.zones.zones[0].color = t.color;
  const unchanged = e.zones.zones.map((z) => ({ ...z }));
  e.tap(t.id, 2000);
  e.step();
  expect(e.score.match).toBe(200);
  expect(e.score.combo).toBe(1);
  expect(e.successAt).toBe(e.time);
  expect(e.zones.zones[0].changed).toBe(e.time);
  expect(e.zones.zones.slice(1)).toEqual(unchanged.slice(1));
});
it("awards normal score on mismatched tiles and misses on ignored matching targets", () => {
  const e = ready(),
    t = e.targets[0];
  e.zones.zones[e.zones.current].color = (t.color + 1) % 7;
  e.tap(t.id, 2000);
  e.step();
  expect(e.score.match).toBe(100);
  expect(e.zones.zones.every((z) => z.changed === -Infinity)).toBe(true);
  const idle = ready();
  idle.zones.zones[idle.zones.current].color = idle.targets[0].color;
  while (idle.time < 2230) {
    idle.balls = [];
    idle.step();
  }
  expect(idle.score.counts.Miss).toBe(1);
  expect(idle.score.counts.Perfect).toBe(0);
});
it("rejects early clicks without recoloring and cannot award one target twice", () => {
  const e = new Engine(chart, 1);
  e.zones.zones[e.zones.current].color = e.targets[0].color;
  e.tap(0, 0);
  e.tap(0, 0);
  e.step();
  expect(e.score.counts.Miss).toBe(1);
  expect(e.score.match).toBe(0);
  expect(e.zones.zones.every((z) => z.changed === -Infinity)).toBe(true);
});
it("same-step consecutive matches use the new color immediately, including repeats", () => {
  const e = ready();
  const rng = new Random(42 ^ 0x4567),
    next = rng.int(7);
  const t = e.targets[0];
  e.zones.zones[e.zones.current].color = t.color;
  const second = { ...t, id: 999, color: next };
  e.targets.push(second);
  e.tap(t.id, 2000);
  e.tap(second.id, 2000);
  e.step();
  expect(e.score.match).toBe(400);
  expect(e.score.combo).toBe(2);
  expect(e.zones.zones[e.zones.current].color).toBe(rng.int(7));
});
it("allows same-color rerolls and continuous repeated color/glyph fades", () => {
  const z = new Zones(new Random(1), new Random(2)),
    expected = new Random(2).int(7);
  z.zones[0].color = expected;
  z.reroll(0, 0);
  expect(z.zones[0].color).toBe(expected);
  const before = z.display(0, 300),
    glyphs = z.glyphs(0, 300);
  z.reroll(0, 300);
  expect(z.display(0, 300)).toEqual(before);
  expect(z.glyphs(0, 300)).toEqual(glyphs);
  expect(z.glyphs(0, 1300).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  expect(z.zones[0].color).toBeGreaterThanOrEqual(0);
});
it("replays bonus clicks and recolors with the same seed", () => {
  const a = ready(),
    b = ready();
  for (const e of [a, b]) {
    e.zones.zones[e.zones.current].color = e.targets[0].color;
    e.tap(0, 2000);
    e.step();
  }
  expect(a).toEqual(b);
});
it("uses a short happy jump only on success and crying only during collision", () => {
  expect(dogMotion(160, 0, null, Infinity)).toEqual({
    kind: "happy",
    lift: 1.2,
  });
  expect(dogMotion(321, 0, null, Infinity).kind).toBe("idle");
  expect(dogMotion(160, 0, "match_depleted", 100).kind).toBe("idle");
  expect(dogMotion(160, 0, "dodge_collision", 100).kind).toBe("cry");
  expect(dogMotion(160, 0, "dodge_collision", 481).kind).toBe("idle");
  expect(dogMotion(160, 0, null, Infinity, true).lift).toBe(0);
});
