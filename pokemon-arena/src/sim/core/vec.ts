export interface Vec {
  x: number;
  y: number;
}

export function dist(a: Vec, b: Vec): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function dist2(a: Vec, b: Vec): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/** Desplaza `from` hacia `to` como máximo `step` unidades. */
export function moveTowards(from: Vec, to: Vec, step: number): Vec {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const d = Math.hypot(dx, dy);
  if (d <= step || d === 0) return { x: to.x, y: to.y };
  return { x: from.x + (dx / d) * step, y: from.y + (dy / d) * step };
}
