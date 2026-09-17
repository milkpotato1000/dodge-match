import type { End } from "./core";
export const SUCCESS_MS = 320,
  COLLISION_MS = 480;
export function dogMotion(
  time: number,
  successAt: number,
  end: End | null,
  collisionAge: number,
  reduced = false,
) {
  if (
    end === "dodge_collision" &&
    collisionAge >= 0 &&
    collisionAge < COLLISION_MS
  )
    return { kind: "cry" as const, lift: 0 };
  if (end) return { kind: "idle" as const, lift: 0 };
  const age = time - successAt;
  if (age >= 0 && age < SUCCESS_MS)
    return {
      kind: "happy" as const,
      lift: reduced ? 0 : Math.sin((age / SUCCESS_MS) * Math.PI) * 1.2,
    };
  return { kind: "idle" as const, lift: 0 };
}
/** The existing fourth pose, bounded separately from its neighbors in the edited sheet. */
export function happyFrame(image: HTMLImageElement) {
  const sx = image.naturalWidth / 2171,
    sy = image.naturalHeight / 724;
  return {
    x: Math.round(1160 * sx),
    y: Math.round(210 * sy),
    width: Math.round(290 * sx),
    height: Math.round(350 * sy),
  };
}
