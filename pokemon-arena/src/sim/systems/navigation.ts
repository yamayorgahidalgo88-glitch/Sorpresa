import { ARENA, bridgeAt, inRiverBand, sideOfY } from '../data/arena';
import type { UnitEntity } from '../core/state';
import type { Vec } from '../core/vec';
import { clamp, dist } from '../core/vec';

/**
 * Navegación por puentes. Las unidades terrestres solo cruzan el río por los puentes;
 * las voladoras van en línea recta.
 */

const EXIT_MARGIN = 0.35;

function bridgeCenter(i: number): number {
  const b = ARENA.bridges[i];
  return (b.xMin + b.xMax) / 2;
}

/** Puente que minimiza el recorrido horizontal total hasta el destino (empate: el primero). */
export function chooseBridge(from: Vec, dest: Vec): number {
  let best = 0;
  let bestCost = Infinity;
  for (let i = 0; i < ARENA.bridges.length; i++) {
    const cx = bridgeCenter(i);
    const cost = Math.abs(from.x - cx) + Math.abs(cx - dest.x);
    if (cost < bestCost - 1e-9) {
      bestCost = cost;
      best = i;
    }
  }
  return best;
}

function clampToBridge(x: number, bridge: number, r: number): number {
  const b = ARENA.bridges[bridge];
  return clamp(x, b.xMin + r, b.xMax - r);
}

/** Siguiente punto intermedio hacia `dest`. */
export function waypoint(u: UnitEntity, dest: Vec): Vec {
  if (u.locomotion === 'aire') return dest;
  const destSide = sideOfY(dest.y);
  const r = Math.min(u.radius, 1.2);

  if (inRiverBand(u.pos.y)) {
    // Sobre un puente: salir en vertical hacia la orilla del destino.
    let b = bridgeAt(u.pos.x);
    if (b < 0) b = chooseBridge(u.pos, dest);
    const exitY = destSide === 0 ? ARENA.riverBottom + EXIT_MARGIN : ARENA.riverTop - EXIT_MARGIN;
    return { x: clampToBridge(u.pos.x, b, r), y: exitY };
  }

  const mySide = sideOfY(u.pos.y);
  if (mySide === destSide) return dest;

  const b = chooseBridge(u.pos, dest);
  const farExit = mySide === 0 ? ARENA.riverTop - EXIT_MARGIN : ARENA.riverBottom + EXIT_MARGIN;
  const bridge = ARENA.bridges[b];
  if (u.pos.x >= bridge.xMin + r && u.pos.x <= bridge.xMax - r) {
    return { x: u.pos.x, y: farExit };
  }
  const entryY = mySide === 0 ? ARENA.riverBottom + EXIT_MARGIN : ARENA.riverTop - EXIT_MARGIN;
  return { x: bridgeCenter(b), y: entryY };
}

/** Distancia de recorrido estimada (pasando por un puente si hace falta). */
export function travelDistance(u: UnitEntity, dest: Vec): number {
  if (u.locomotion === 'aire' || inRiverBand(u.pos.y) || sideOfY(u.pos.y) === sideOfY(dest.y)) {
    return dist(u.pos, dest);
  }
  const b = chooseBridge(u.pos, dest);
  const cx = bridgeCenter(b);
  const mySide = sideOfY(u.pos.y);
  const entry = { x: cx, y: mySide === 0 ? ARENA.riverBottom : ARENA.riverTop };
  const exit = { x: cx, y: mySide === 0 ? ARENA.riverTop : ARENA.riverBottom };
  return dist(u.pos, entry) + dist(entry, exit) + dist(exit, dest);
}

/**
 * Mantiene a una unidad terrestre fuera del agua. `prev` es su posición antes de moverse.
 */
export function constrainGround(u: UnitEntity, prev: Vec): void {
  if (u.locomotion === 'aire') return;
  if (!inRiverBand(u.pos.y)) return;
  const r = Math.min(u.radius, 1.2) * 0.5;
  if (bridgeAt(u.pos.x, r) >= 0) return;
  if (inRiverBand(prev.y)) {
    // Estaba en un puente y lo han empujado de lado: volver al puente más cercano.
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < ARENA.bridges.length; i++) {
      const d = Math.abs(u.pos.x - bridgeCenter(i));
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    u.pos.x = clampToBridge(u.pos.x, best, r);
  } else {
    u.pos.y = sideOfY(prev.y) === 0 ? ARENA.riverBottom + 0.001 : ARENA.riverTop - 0.001;
  }
}

export function clampToArena(u: UnitEntity): void {
  u.pos.x = clamp(u.pos.x, u.radius, ARENA.width - u.radius);
  u.pos.y = clamp(u.pos.y, u.radius, ARENA.height - u.radius);
}
