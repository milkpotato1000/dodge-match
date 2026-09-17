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
/** Crop transparent padding from the fourth EXISTING loading frame, without modifying the source. */
export function happyFrame(image: HTMLImageElement) {
  const width = image.naturalWidth / 6,
    canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    3 * width,
    0,
    width,
    image.naturalHeight,
    0,
    0,
    width,
    image.naturalHeight,
  );
  const pixels = ctx.getImageData(0, 0, width, canvas.height).data;
  let left = width,
    top = canvas.height,
    right = 0,
    bottom = 0;
  for (let y = 0; y < canvas.height; y++)
    for (let x = 0; x < width; x++)
      if (pixels[(y * width + x) * 4 + 3] > 8) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
  return right >= left
    ? {
        x: 3 * width + left,
        y: top,
        width: right - left + 1,
        height: bottom - top + 1,
      }
    : { x: 3 * width, y: 0, width, height: canvas.height };
}
