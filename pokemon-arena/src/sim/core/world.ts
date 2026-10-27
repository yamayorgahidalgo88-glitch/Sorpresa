import type { Rules } from '../data/rules';
import type { Entity, PendingSpell, PlayerState, Projectile, SimEvent, TowerEntity, UnitEntity } from './state';

/** Estado mutable compartido por los sistemas de la simulación. */
export interface World {
  rules: Rules;
  /** Pasos completados. */
  tick: number;
  units: UnitEntity[];
  towers: TowerEntity[];
  projectiles: Projectile[];
  spells: PendingSpell[];
  players: [PlayerState, PlayerState];
  events: SimEvent[];
  entities: Map<number, Entity>;
  idCounter: number;
}

export function nextId(world: World): number {
  return ++world.idCounter;
}

export function emit(world: World, ev: SimEvent): void {
  world.events.push(ev);
}

export function getEntity(world: World, id: number | null): Entity | undefined {
  return id === null ? undefined : world.entities.get(id);
}

export function isAlive(e: Entity | undefined): e is Entity {
  if (!e) return false;
  return e.kind === 'unit' ? !e.dead && e.hp > 0 : !e.destroyed;
}
