import type { PokemonCard, TargetFilter } from '../data/cards';
import { getCard } from '../data/cards';
import type { Entity, TowerEntity, UnitEntity } from '../core/state';
import { enemyOf } from '../core/state';
import type { World } from '../core/world';
import { getEntity, isAlive } from '../core/world';
import { dist } from '../core/vec';
import { travelDistance } from './navigation';

/** Distancia entre bordes (0 si se tocan). */
export function edgeDistance(a: Entity, b: Entity): number {
  return Math.max(0, dist(a.pos, b.pos) - a.radius - b.radius);
}

/** ¿Puede una unidad con este filtro atacar a `target`? */
export function canTarget(filter: TargetFilter, target: Entity): boolean {
  if (!isAlive(target)) return false;
  if (target.kind === 'tower') return true;
  if (filter === 'edificios') return false;
  if (filter === 'tierra') return target.locomotion === 'tierra';
  return true;
}

/** Margen de histéresis para no soltar un objetivo por un empujón mínimo. */
const LOCK_MARGIN = 0.5;

/**
 * Selección de objetivo de una tropa:
 * 1. Si está trabada en combate con un objetivo válido que sigue a su alcance, lo mantiene.
 * 2. Si no, elige el enemigo válido más cercano dentro de su rango de visión (tropas o torres).
 * 3. Si no ve a nadie, se dirige a la torre enemiga en pie con menor recorrido.
 * Empates: gana el id menor (orden de iteración estable).
 */
export function selectUnitTarget(world: World, u: UnitEntity): void {
  const card = getCard(u.cardId) as PokemonCard;
  const current = getEntity(world, u.targetId);
  if (u.engaged && current && canTarget(card.targets, current) && edgeDistance(u, current) <= card.range + LOCK_MARGIN) {
    return;
  }

  const foe = enemyOf(u.team);
  let best: Entity | null = null;
  let bestD = Infinity;

  if (card.targets !== 'edificios') {
    for (const e of world.units) {
      if (e.team !== foe || !canTarget(card.targets, e)) continue;
      const d = edgeDistance(u, e);
      if (d <= card.sight && d < bestD) {
        bestD = d;
        best = e;
      }
    }
    for (const t of world.towers) {
      if (t.team !== foe || t.destroyed) continue;
      const d = edgeDistance(u, t);
      if (d <= card.sight && d < bestD) {
        bestD = d;
        best = t;
      }
    }
  }

  if (!best) best = nearestTowerByTravel(world, u);
  u.targetId = best ? best.id : null;
  u.engaged = false;
}

export function nearestTowerByTravel(world: World, u: UnitEntity): TowerEntity | null {
  const foe = enemyOf(u.team);
  let best: TowerEntity | null = null;
  let bestD = Infinity;
  for (const t of world.towers) {
    if (t.team !== foe || t.destroyed) continue;
    const d = travelDistance(u, t.pos);
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  }
  return best;
}

/** Las torres disparan a la tropa enemiga más cercana dentro de su alcance; la base solo si está activa. */
export function selectTowerTarget(world: World, t: TowerEntity): void {
  if (t.destroyed || !t.active) {
    t.targetId = null;
    return;
  }
  const current = getEntity(world, t.targetId);
  if (current && current.kind === 'unit' && isAlive(current) && edgeDistance(t, current) <= t.range) return;
  let best: UnitEntity | null = null;
  let bestD = Infinity;
  for (const e of world.units) {
    if (e.team === t.team || !isAlive(e)) continue;
    const d = edgeDistance(t, e);
    if (d <= t.range && d < bestD) {
      bestD = d;
      best = e;
    }
  }
  t.targetId = best ? best.id : null;
}
