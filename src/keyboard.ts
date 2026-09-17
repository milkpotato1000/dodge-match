import type { Vec } from "./core";
export type KeyboardLayout = "wasd" | "arrows";
const layouts = {
  wasd: { up: "KeyW", left: "KeyA", down: "KeyS", right: "KeyD" },
  arrows: {
    up: "ArrowUp",
    left: "ArrowLeft",
    down: "ArrowDown",
    right: "ArrowRight",
  },
};
export function isMovementCode(code: string, layout: KeyboardLayout) {
  return Object.values(layouts[layout]).includes(code);
}
export function keyboardVector(
  pressed: ReadonlySet<string>,
  layout: KeyboardLayout,
): Vec {
  const map = layouts[layout];
  return {
    x: Number(pressed.has(map.right)) - Number(pressed.has(map.left)),
    y: Number(pressed.has(map.down)) - Number(pressed.has(map.up)),
  };
}
