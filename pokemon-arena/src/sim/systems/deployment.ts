import type { TowerRole } from '../data/arena';
import { ARENA, inRiverBand, MID_Y } from '../data/arena';
import type { Card } from '../data/cards';
import type { Team } from '../core/state';
import type { Vec } from '../core/vec';
import { dist } from '../core/vec';

/** Lo mínimo que hace falta saber de una torre para validar despliegues (también lo conoce la IA). */
export interface TowerLike {
  team: Team;
  role: TowerRole;
  pos: Vec;
  radius: number;
  destroyed: boolean;
}

/** Mitad del campo de la ruta a la que pertenece una torre guardiana (0 izquierda, 1 derecha). */
export function laneOfTower(t: TowerLike): 0 | 1 | null {
  if (t.role === 'guardia_izq') return 0;
  if (t.role === 'guardia_der') return 1;
  return null;
}

/** ¿Está `pos` en la "bolsa" abierta en campo rival por haber destruido su torre guardiana? */
function inPocket(team: Team, pos: Vec, towers: readonly TowerLike[]): boolean {
  for (const t of towers) {
    if (t.team === team || !t.destroyed) continue;
    const lane = laneOfTower(t);
    if (lane === null) continue;
    const xOk = lane === 0 ? pos.x < ARENA.width / 2 : pos.x >= ARENA.width / 2;
    const yOk =
      team === 0
        ? pos.y >= ARENA.riverTop - ARENA.pocketDepth && pos.y < ARENA.riverTop
        : pos.y > ARENA.riverBottom && pos.y <= ARENA.riverBottom + ARENA.pocketDepth;
    if (xOk && yOk) return true;
  }
  return false;
}

function insideBounds(pos: Vec): boolean {
  return pos.x >= 0 && pos.x <= ARENA.width && pos.y >= 0 && pos.y <= ARENA.height;
}

/**
 * Reglas de despliegue:
 * - Hechizos: en cualquier punto del campo.
 * - Pokémon: en la mitad propia, fuera del río y sin solaparse con torres en pie;
 *   además, en la bolsa de una ruta cuya torre guardiana rival haya caído.
 */
export function isDeployAllowed(team: Team, card: Card, pos: Vec, towers: readonly TowerLike[]): boolean {
  if (!insideBounds(pos)) return false;
  if (card.kind === 'hechizo') return true;
  if (inRiverBand(pos.y) || pos.y === ARENA.riverTop || pos.y === ARENA.riverBottom) return false;
  for (const t of towers) {
    if (!t.destroyed && dist(t.pos, pos) < t.radius + 0.35) return false;
  }
  const ownHalf = team === 0 ? pos.y > MID_Y : pos.y < MID_Y;
  return ownHalf || inPocket(team, pos, towers);
}
