import type { Element } from '../data/elements';
import { effectivenessLabel, typeMultiplier } from '../data/elements';
import type { Entity, Projectile, Team, UnitEntity } from '../core/state';
import { enemyOf } from '../core/state';
import type { World } from '../core/world';
import { emit, isAlive, nextId } from '../core/world';
import type { Vec } from '../core/vec';
import { dist } from '../core/vec';

export interface HitSpec {
  team: Team;
  damage: number;
  element: Element | null;
  splashRadius: number;
  /** Si el daño en área alcanza a voladores. */
  splashHitsAir: boolean;
  /** Fracción del daño que reciben las torres (hechizos). */
  towerFactor?: number;
  chain?: { jumps: number; radius: number; falloff: number };
  slow?: { factor: number; duration: number };
}

/**
 * Aplica daño a una entidad viva. Las tropas aplican el multiplicador elemental;
 * las torres no tienen tipo (x1) pero pueden recibir daño reducido de hechizos.
 * La salud nunca baja de 0. Devuelve el daño realmente aplicado.
 */
export function applyDamage(world: World, target: Entity, raw: number, element: Element | null, towerFactor = 1): number {
  if (!isAlive(target) || raw <= 0) return 0;
  let amount: number;
  let mult = 1;
  if (target.kind === 'tower') {
    amount = Math.round(raw * towerFactor);
    if (target.role === 'base' && !target.active && amount > 0) {
      target.active = true;
      emit(world, { type: 'base_activada', towerId: target.id, team: target.team });
    }
  } else {
    mult = typeMultiplier(element, target.types);
    amount = Math.round(raw * mult);
  }
  amount = Math.min(amount, target.hp);
  target.hp -= amount;
  emit(world, { type: 'dano', targetId: target.id, amount, effectiveness: effectivenessLabel(mult), element });
  return amount;
}

/** Daño en área a enemigos de `team` alrededor de `center` (excepto `excludeId`). */
export function applySplash(
  world: World,
  team: Team,
  center: Vec,
  radius: number,
  damage: number,
  element: Element | null,
  opts: { hitsAir: boolean; includeTowers: boolean; towerFactor?: number; excludeId?: number },
): number[] {
  const foe = enemyOf(team);
  const hit: number[] = [];
  for (const u of world.units) {
    if (u.team !== foe || !isAlive(u) || u.id === opts.excludeId) continue;
    if (u.locomotion === 'aire' && !opts.hitsAir) continue;
    if (dist(u.pos, center) - u.radius <= radius) {
      applyDamage(world, u, damage, element);
      hit.push(u.id);
    }
  }
  if (opts.includeTowers) {
    for (const t of world.towers) {
      if (t.team !== foe || t.destroyed || t.id === opts.excludeId) continue;
      if (dist(t.pos, center) - t.radius <= radius) {
        applyDamage(world, t, damage, element, opts.towerFactor ?? 1);
        hit.push(t.id);
      }
    }
  }
  return hit;
}

export function applySlow(world: World, u: UnitEntity, factor: number, durationTicks: number): void {
  const until = world.tick + durationTicks;
  if (world.tick < u.status.slowUntil) {
    u.status.slowFactor = Math.max(u.status.slowFactor, factor);
    u.status.slowUntil = Math.max(u.status.slowUntil, until);
  } else {
    u.status.slowFactor = factor;
    u.status.slowUntil = until;
  }
}

export function applyStun(world: World, u: UnitEntity, durationTicks: number): void {
  u.status.stunUntil = Math.max(u.status.stunUntil, world.tick + durationTicks);
}

/** Resuelve un impacto (cuerpo a cuerpo o de proyectil) sobre `target` o, si murió, en `at`. */
export function resolveHit(world: World, spec: HitSpec, target: Entity | undefined, at: Vec): void {
  const targetAlive = isAlive(target);
  if (targetAlive) applyDamage(world, target!, spec.damage, spec.element, spec.towerFactor ?? 1);
  if (spec.splashRadius > 0) {
    const center = targetAlive ? target!.pos : at;
    applySplash(world, spec.team, center, spec.splashRadius, spec.damage, spec.element, {
      hitsAir: spec.splashHitsAir,
      includeTowers: false,
      excludeId: targetAlive ? target!.id : undefined,
    });
    emit(world, { type: 'impacto_area', pos: { x: center.x, y: center.y }, radius: spec.splashRadius, element: spec.element });
  }
  if (targetAlive && spec.slow && target!.kind === 'unit') {
    applySlow(world, target!, spec.slow.factor, Math.round(spec.slow.duration * world.rules.tickRate));
  }
  if (targetAlive && spec.chain) chainFrom(world, spec, target!);
}

function chainFrom(world: World, spec: HitSpec, first: Entity): void {
  const chain = spec.chain!;
  const foe = enemyOf(spec.team);
  const visited = new Set<number>([first.id]);
  const points: Vec[] = [{ x: first.pos.x, y: first.pos.y }];
  let from = first.pos;
  let damage = spec.damage;
  for (let j = 0; j < chain.jumps; j++) {
    damage *= chain.falloff;
    let best: UnitEntity | null = null;
    let bestD = Infinity;
    for (const u of world.units) {
      if (u.team !== foe || !isAlive(u) || visited.has(u.id)) continue;
      const d = dist(u.pos, from) - u.radius;
      if (d <= chain.radius && d < bestD) {
        bestD = d;
        best = u;
      }
    }
    if (!best) break;
    visited.add(best.id);
    applyDamage(world, best, damage, spec.element);
    points.push({ x: best.pos.x, y: best.pos.y });
    from = best.pos;
  }
  if (points.length > 1) emit(world, { type: 'cadena', points });
}

export function spawnProjectile(world: World, source: Entity, target: Entity, speed: number, spec: HitSpec): Projectile {
  const p: Projectile = {
    id: nextId(world),
    team: spec.team,
    sourceId: source.id,
    targetId: target.id,
    pos: { x: source.pos.x, y: source.pos.y },
    aim: { x: target.pos.x, y: target.pos.y },
    speed,
    damage: spec.damage,
    element: spec.element,
    splashRadius: spec.splashRadius,
    splashHitsAir: spec.splashHitsAir,
    chain: spec.chain,
    slow: spec.slow,
  };
  world.projectiles.push(p);
  emit(world, { type: 'proyectil', projectileId: p.id, sourceId: source.id, targetId: target.id, element: spec.element });
  return p;
}
