import type { Battle } from '../battle';
import type { Phase, Team } from '../core/state';
import type { Vec } from '../core/vec';
import type { Element } from '../data/elements';
import type { Locomotion } from '../data/cards';
import type { TowerRole } from '../data/arena';

/**
 * Información que un jugador puede conocer legítimamente en un instante dado:
 * su propia mano, su energía y lo que está a la vista en el campo.
 * NO incluye la mano, la cola ni la energía del rival, ni ningún estado futuro.
 */
export interface Observation {
  tick: number;
  tickRate: number;
  phase: Phase;
  secondsLeft: number;
  team: Team;
  energy: number;
  maxEnergy: number;
  hand: readonly string[];
  next: string;
  units: readonly ObservedUnit[];
  towers: readonly ObservedTower[];
}

export interface ObservedUnit {
  id: number;
  team: Team;
  cardId: string;
  types: readonly Element[];
  pos: Vec;
  hp: number;
  maxHp: number;
  locomotion: Locomotion;
}

export interface ObservedTower {
  id: number;
  team: Team;
  role: TowerRole;
  pos: Vec;
  radius: number;
  hp: number;
  maxHp: number;
  destroyed: boolean;
}

export function observe(battle: Battle, team: Team): Observation {
  const w = battle.world;
  return {
    tick: w.tick,
    tickRate: battle.rules.tickRate,
    phase: battle.phase,
    secondsLeft: battle.secondsLeft,
    team,
    energy: battle.energyPoints(team),
    maxEnergy: battle.rules.maxEnergy,
    hand: battle.hand(team).slice(),
    next: battle.nextCard(team),
    units: w.units.map((u) => ({
      id: u.id,
      team: u.team,
      cardId: u.cardId,
      types: u.types.slice(),
      pos: { x: u.pos.x, y: u.pos.y },
      hp: u.hp,
      maxHp: u.maxHp,
      locomotion: u.locomotion,
    })),
    towers: w.towers.map((t) => ({
      id: t.id,
      team: t.team,
      role: t.role,
      pos: { x: t.pos.x, y: t.pos.y },
      radius: t.radius,
      hp: t.hp,
      maxHp: t.maxHp,
      destroyed: t.destroyed,
    })),
  };
}
