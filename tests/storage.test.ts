import { beforeEach, it, expect, vi } from "vitest";
import {
  settings,
  saveSettings,
  records,
  recordRun,
  ranked,
  key,
} from "../src/storage";
import { Engine } from "../src/core";
import chart from "../public/chart.json";
let data: Map<string, string>;
beforeEach(() => {
  data = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => data.set(k, v),
  });
});
it("recovers null, malformed JSON and invalid settings safely", () => {
  for (const bad of ["null", "{broken", "[]"]) {
    data.set(key + ":settings", bad);
    expect(settings().name).toBe("PLAYER");
  }
  data.set(
    key + ":settings",
    JSON.stringify({ volume: 100, offset: -999, music: "yes" }),
  );
  expect(settings().volume).toBe(1);
  expect(settings().offset).toBe(-300);
  expect(settings().music).toBe(true);
});
it("persists settings and result details with chart version and seed", () => {
  const s = settings();
  s.swapped = true;
  saveSettings(s);
  expect(settings().swapped).toBe(true);
  const e = new Engine(chart, 123);
  e.end = "dodge_collision";
  e.score.judge("Great");
  recordRun(e, " Player ");
  expect(records()).toHaveLength(1);
  expect(records()[0]).toMatchObject({
    name: "Player",
    seed: 123,
    match: 70,
    result: "dodge_collision",
    chartVersion: "3",
    rulesetVersion: "4",
  });
});
it("rejects malformed stored records and sorts score ties by survival", () => {
  data.set(
    key + ":records",
    JSON.stringify([null, {}, { name: "bad", total: 1, counts: {} }]),
  );
  expect(records()).toEqual([]);
  const e = new Engine(chart, 2);
  e.end = "dodge_collision";
  e.time = 1500;
  recordRun(e, "A");
  e.time = 1900;
  recordRun(e, "B");
  expect(ranked().map((r) => r.name)).toEqual(["B", "A"]);
});
it("does not interrupt a game when storage access is denied", () => {
  vi.stubGlobal("localStorage", {
    getItem: () => {
      throw Error("denied");
    },
    setItem: () => {
      throw Error("quota");
    },
  });
  expect(() => saveSettings(settings())).not.toThrow();
  const e = new Engine(chart, 1);
  e.end = "match_depleted";
  expect(() => recordRun(e, "A")).not.toThrow();
});
it("migrates absent or invalid keyboard settings to WASD and persists arrows", () => {
  expect(settings().keyboardLayout).toBe("wasd");
  for (const value of [null, "both", "WASD", 17]) {
    data.set(key + ":settings", JSON.stringify({ keyboardLayout: value }));
    expect(settings().keyboardLayout).toBe("wasd");
  }
  const s = settings();
  s.keyboardLayout = "arrows";
  saveSettings(s);
  expect(settings().keyboardLayout).toBe("arrows");
});
it("keeps old records but filters versions before taking the top 100", async () => {
  const { rankedForChart } = await import("../src/storage");
  const e = new Engine(chart, 5);
  e.end = "chart_complete";
  recordRun(e, "current");
  const current = records()[0];
  const old = Array.from({ length: 101 }, (_, i) => ({
    ...current,
    runId: String(i),
    name: "old",
    chartVersion: "3",
    rulesetVersion: "3",
    total: 99999,
  }));
  data.set(key + ":records", JSON.stringify([...old, current]));
  expect(records()).toHaveLength(102);
  expect(rankedForChart(chart).map((r) => r.name)).toEqual(["current"]);
});
