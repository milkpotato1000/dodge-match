import { describe, it, expect } from "vitest";
import { isMovementCode, keyboardVector } from "../src/keyboard";
import { direction } from "../src/core";
describe.each(["wasd", "arrows"] as const)("%s keyboard layout", (layout) => {
  const [up, left, down, right] =
    layout === "wasd"
      ? ["KeyW", "KeyA", "KeyS", "KeyD"]
      : ["ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"];
  it("accepts only the selected physical codes", () => {
    for (const code of [up, left, down, right])
      expect(isMovementCode(code, layout)).toBe(true);
    for (const code of layout === "wasd"
      ? ["ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"]
      : ["KeyW", "KeyA", "KeyS", "KeyD"]) {
      expect(isMovementCode(code, layout)).toBe(false);
      expect(keyboardVector(new Set([code]), layout)).toEqual({ x: 0, y: 0 });
    }
    expect(isMovementCode("w", layout)).toBe(false);
  });
  it("supports all eight directions and opposite-key cancellation", () => {
    expect(keyboardVector(new Set([left, right, up, down]), layout)).toEqual({
      x: 0,
      y: 0,
    });
    for (const combo of [
      [up],
      [down],
      [left],
      [right],
      [up, left],
      [up, right],
      [down, left],
      [down, right],
    ]) {
      const v = keyboardVector(new Set(combo), layout),
        unit = direction(v.x, v.y);
      expect(Math.hypot(unit.x * 90, unit.y * 90)).toBeCloseTo(90);
    }
  });
});
