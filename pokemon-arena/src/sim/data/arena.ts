import type { Vec } from '../core/vec';

/**
 * Geometría del campo, en casillas. El equipo 0 (jugador) ocupa la mitad inferior y el
 * equipo 1 (rival) la superior. El eje Y crece hacia abajo, como en pantalla.
 */
export const ARENA = {
  width: 18,
  height: 32,
  /** El río ocupa la franja y ∈ [riverTop, riverBottom]. */
  riverTop: 15,
  riverBottom: 17,
  /** Puentes: rangos de X donde las unidades terrestres pueden cruzar el río. */
  bridges: [
    { xMin: 2, xMax: 5 },
    { xMin: 13, xMax: 16 },
  ],
  /** X central de cada ruta (izquierda, derecha). */
  laneX: [3.5, 14.5],
  /** Profundidad de la "bolsa" de despliegue que se abre al destruir una torre guardiana rival. */
  pocketDepth: 4,
} as const;

export const MID_Y = (ARENA.riverTop + ARENA.riverBottom) / 2;

export type TowerRole = 'guardia_izq' | 'guardia_der' | 'base';

export interface TowerDef {
  role: TowerRole;
  /** Posición para el equipo 0; el equipo 1 usa la posición reflejada en Y. */
  pos: Vec;
  radius: number;
  hp: number;
  damage: number;
  /** Segundos entre disparos. */
  hitSpeed: number;
  range: number;
  projectileSpeed: number;
}

export const TOWERS: readonly TowerDef[] = [
  { role: 'guardia_izq', pos: { x: 3.5, y: 25.5 }, radius: 1.3, hp: 1600, damage: 55, hitSpeed: 0.8, range: 7.5, projectileSpeed: 14 },
  { role: 'guardia_der', pos: { x: 14.5, y: 25.5 }, radius: 1.3, hp: 1600, damage: 55, hitSpeed: 0.8, range: 7.5, projectileSpeed: 14 },
  { role: 'base', pos: { x: 9, y: 29 }, radius: 1.8, hp: 2600, damage: 70, hitSpeed: 1.0, range: 7, projectileSpeed: 14 },
];

/** Refleja una posición del equipo 0 al lado del equipo 1. */
export function mirrorForTeam(pos: Vec, team: 0 | 1): Vec {
  return team === 0 ? { x: pos.x, y: pos.y } : { x: pos.x, y: ARENA.height - pos.y };
}

/** Mitad del campo a la que pertenece una coordenada Y. */
export function sideOfY(y: number): 0 | 1 {
  return y >= MID_Y ? 0 : 1;
}

export function inRiverBand(y: number): boolean {
  return y > ARENA.riverTop && y < ARENA.riverBottom;
}

export function bridgeAt(x: number, margin = 0): number {
  for (let i = 0; i < ARENA.bridges.length; i++) {
    const b = ARENA.bridges[i];
    if (x >= b.xMin + margin && x <= b.xMax - margin) return i;
  }
  return -1;
}

/** Ajusta una coordenada arbitraria al centro de su casilla (entrada reproducible). */
export function snapToTile(p: Vec): Vec {
  const x = Math.min(ARENA.width - 1, Math.max(0, Math.floor(p.x))) + 0.5;
  const y = Math.min(ARENA.height - 1, Math.max(0, Math.floor(p.y))) + 0.5;
  return { x, y };
}
