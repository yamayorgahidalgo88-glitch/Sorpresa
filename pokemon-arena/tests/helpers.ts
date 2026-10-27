import { Battle } from '../src/sim/battle';
import type { Team, UnitEntity, TowerEntity } from '../src/sim/core/state';
import type { TowerRole } from '../src/sim/data/arena';
import { DEFAULT_PLAYER_DECK, DEFAULT_RIVAL_DECK } from '../src/sim/data/cards';
import type { Rules } from '../src/sim/data/rules';

export function newBattle(seed = 1, rules?: Partial<Rules>, decks: [string[], string[]] = [DEFAULT_PLAYER_DECK, DEFAULT_RIVAL_DECK]): Battle {
  return new Battle({ seed, decks, rules });
}

/** Coloca `cardId` en la mano (intercambiándola con la cola) para escenarios controlados. */
export function forceInHand(b: Battle, team: Team, cardId: string): void {
  const deck = b.player(team).deck;
  if (deck.hand.includes(cardId)) return;
  const qi = deck.queue.indexOf(cardId);
  if (qi < 0) throw new Error(`${cardId} no está en el mazo`);
  const tmp = deck.hand[0];
  deck.hand[0] = cardId;
  deck.queue[qi] = tmp;
}

export function setEnergy(b: Battle, team: Team, points: number): void {
  const e = b.player(team).energy;
  e.sub = points * e.subPerPoint;
}

export function unit(b: Battle, id: number): UnitEntity | undefined {
  return b.world.units.find((u) => u.id === id);
}

export function tower(b: Battle, team: Team, role: TowerRole): TowerEntity {
  return b.world.towers.find((t) => t.team === team && t.role === role)!;
}

export function steps(b: Battle, n: number) {
  const events = [];
  for (let i = 0; i < n; i++) events.push(...b.step());
  return events;
}

/** Aísla una prueba: quita la regeneración de energía no deseada y las torres no implicadas no molestan. */
export function disarmTowers(b: Battle): void {
  for (const t of b.world.towers) t.damage = 0;
}
