import type { KeyboardLayout } from "./keyboard";
import type { Engine } from "./core";
export type Settings = {
  name: string;
  swapped: boolean;
  keyboardLayout: KeyboardLayout;
  music: boolean;
  volume: number;
  sfx: number;
  vibration: boolean;
  reduced: boolean;
  offset: number;
};
export const defaults: Settings = {
  name: "PLAYER",
  swapped: false,
  keyboardLayout: "wasd",
  music: true,
  volume: 0.25,
  sfx: 0.4,
  vibration: false,
  reduced: false,
  offset: 0,
};
export type RecordEntry = {
  runId: string;
  playerId: string;
  name: string;
  total: number;
  dodge: number;
  match: number;
  survival: number;
  seed: number;
  result: string;
  counts: Record<string, number>;
  maxCombo: number;
  maxRecovery: number;
  maxMiss: number;
  chartId: string;
  chartVersion: string;
  rulesetVersion: string;
  createdAt: string;
};
export const key = "dodge-match-v1";
export let storageUnavailable = false;
function read<T>(suffix: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key + suffix);
    return value ? JSON.parse(value) : fallback;
  } catch {
    storageUnavailable = true;
    return fallback;
  }
}
function write(suffix: string, value: unknown) {
  try {
    localStorage.setItem(key + suffix, JSON.stringify(value));
  } catch {
    storageUnavailable = true;
  }
}
export function settings(): Settings {
  const raw = read<unknown>(":settings", {}),
    s = raw && typeof raw === "object" ? (raw as Partial<Settings>) : {};
  const bounded = (v: unknown, def: number, min: number, max: number) =>
    typeof v === "number" && Number.isFinite(v)
      ? Math.max(min, Math.min(max, v))
      : def;
  return {
    name: typeof s.name === "string" ? s.name.slice(0, 16) : defaults.name,
    swapped: s.swapped === true,
    keyboardLayout: s.keyboardLayout === "arrows" ? "arrows" : "wasd",
    music: typeof s.music === "boolean" ? s.music : defaults.music,
    volume: bounded(s.volume, defaults.volume, 0, 1),
    sfx: bounded(s.sfx, defaults.sfx, 0, 1),
    vibration: s.vibration === true,
    reduced: s.reduced === true,
    offset: bounded(s.offset, 0, -300, 300),
  };
}
export function saveSettings(s: Settings) {
  write(":settings", s);
}
export function records(): RecordEntry[] {
  const result = read<unknown>(":records", []);
  return Array.isArray(result)
    ? result.filter(
        (r) =>
          Number.isFinite(r?.total) &&
          Number.isFinite(r?.survival) &&
          typeof r?.name === "string" &&
          typeof r?.createdAt === "string" &&
          r?.counts &&
          ["Perfect", "Great", "Good", "Miss"].every((g) =>
            Number.isFinite(r.counts[g]),
          ),
      )
    : [];
}
export function recordRun(e: Engine, name: string) {
  let playerId = read<string>(":player", "");
  if (!playerId) {
    playerId = crypto.randomUUID();
    write(":player", playerId);
  }
  const entry: RecordEntry = {
    runId: crypto.randomUUID(),
    playerId,
    name: name.trim().slice(0, 16) || "PLAYER",
    total: e.score.total(e.time),
    dodge: Math.floor(e.time / 1000) * 100,
    match: e.score.match,
    survival: e.time,
    seed: e.seed,
    result: e.end!,
    counts: { ...e.score.counts },
    maxCombo: e.score.maxCombo,
    maxRecovery: e.score.maxRecovery,
    maxMiss: e.score.maxMiss,
    chartId: e.chart.chartId,
    chartVersion: e.chart.chartVersion,
    rulesetVersion: e.chart.rulesetVersion,
    createdAt: new Date().toISOString(),
  };
  write(":records", [entry, ...records()].slice(0, 1000));
  return entry;
}
export function ranked(entries = records()) {
  return [...entries]
    .sort(
      (a, b) =>
        b.total - a.total ||
        b.survival - a.survival ||
        b.counts.Perfect - a.counts.Perfect ||
        a.counts.Miss - b.counts.Miss ||
        a.createdAt.localeCompare(b.createdAt),
    )
    .slice(0, 100);
}
