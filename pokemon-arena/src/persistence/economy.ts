import type { Rng } from '../sim/core/rng';
import type { Team } from '../sim/core/state';
import type { Stage } from '../sim/data/cards';
import { LINES, STARTER_LINES, cardAtStage, maxStage } from '../sim/data/cards';

/**
 * Economía y colección (cifras de diseño propio, ajustables aquí):
 * - Monedas por partida → Pokéballs (cofres) → copias de cartas.
 * - Copias + monedas → evolucionar una línea (Charmander → Charmeleon → Charizard).
 * - Lo que no sirve (copias de una línea ya al máximo o una evolución que ya tienes) se
 *   convierte en monedas por su valor equivalente.
 * - Camino de trofeos con recompensas que solo se cobran una vez.
 * Todo es puro y determinista (recibe un Rng), para poder probarlo.
 */

export type BallKind = 'poke' | 'super' | 'ultra' | 'master';
export const BALL_ORDER: readonly BallKind[] = ['poke', 'super', 'ultra', 'master'];

export interface BallDef {
  name: string;
  price: number;
  /** Cartas distintas que contiene. */
  distinct: number;
  /** Copias de cada carta (entero aleatorio entre min y max). */
  min: number;
  max: number;
  /** Probabilidad de que cada hueco sea una carta que aún no tienes. */
  newChance: number;
  /** Probabilidad de que una carta salga ya evolucionada (fase 2 o 3). */
  stage2Chance: number;
  stage3Chance: number;
  /** Garantiza al menos una carta en fase 2 o superior. */
  guaranteeStage2: boolean;
}

export const BALLS: Record<BallKind, BallDef> = {
  poke: { name: 'Pokéball', price: 60, distinct: 2, min: 1, max: 4, newChance: 0.1, stage2Chance: 0, stage3Chance: 0, guaranteeStage2: false },
  super: { name: 'Superball', price: 180, distinct: 3, min: 3, max: 7, newChance: 0.2, stage2Chance: 0, stage3Chance: 0, guaranteeStage2: false },
  ultra: { name: 'Ultraball', price: 500, distinct: 5, min: 6, max: 12, newChance: 0.25, stage2Chance: 0.08, stage3Chance: 0.01, guaranteeStage2: false },
  master: { name: 'Master Ball', price: 1500, distinct: 10, min: 10, max: 20, newChance: 0.3, stage2Chance: 0.15, stage3Chance: 0.06, guaranteeStage2: true },
};

/** Coste de evolucionar a cada fase. */
export const EVOLVE_COST: Record<2 | 3, { copies: number; coins: number }> = {
  2: { copies: 15, coins: 250 },
  3: { copies: 40, coins: 1000 },
};

/** Valor en monedas de una copia que no se puede usar. */
export const COPY_VALUE = 5;
/** Valor de una carta que sale ya evolucionada y que no mejora la tuya: lo que cuesta conseguirla. */
export function evolvedValue(stage: Stage): number {
  if (stage === 1) return COPY_VALUE;
  const to2 = EVOLVE_COST[2].copies * COPY_VALUE + EVOLVE_COST[2].coins;
  return stage === 2 ? to2 : to2 + EVOLVE_COST[3].copies * COPY_VALUE + EVOLVE_COST[3].coins;
}

export const STARTING_COINS = 100;

export interface Owned {
  stage: Stage;
  /** Copias acumuladas para la siguiente evolución. */
  copies: number;
}

export interface Profile {
  coins: number;
  owned: Record<string, Owned>;
  /** Pokéballs sin abrir (recompensas del camino de trofeos). */
  balls: Record<BallKind, number>;
  /** Trofeos de los hitos del camino ya cobrados. */
  claimedRoad: number[];
}

export function newProfile(): Profile {
  const owned: Record<string, Owned> = {};
  for (const l of STARTER_LINES) owned[l] = { stage: 1, copies: 0 };
  return { coins: STARTING_COINS, owned, balls: { poke: 0, super: 0, ultra: 0, master: 0 }, claimedRoad: [] };
}

/** Id de la carta que usa el jugador para una línea (según su fase actual). */
export function cardIdFor(profile: Profile, line: string): string {
  return cardAtStage(line, profile.owned[line]?.stage ?? 1).id;
}

// ---------------------------------------------------------------- monedas por partida

export const MATCH_COINS = { win: 30, draw: 12, loss: 6, perMedal: 5 };

export function matchCoins(winner: Team | null, medals: number): number {
  const base = winner === 0 ? MATCH_COINS.win : winner === 1 ? MATCH_COINS.loss : MATCH_COINS.draw;
  return base + medals * MATCH_COINS.perMedal;
}

// ---------------------------------------------------------------- Pokéballs

export interface Drop {
  line: string;
  /** Carta que se muestra (la fase en que ha salido). */
  cardId: string;
  copies: number;
  isNew: boolean;
  /** Fase a la que ha subido tu carta gracias a esta tirada (si ha subido). */
  upgradedTo: Stage | null;
  /** Monedas en que se ha convertido lo que no se podía usar. */
  coins: number;
}

export function buyBall(profile: Profile, kind: BallKind): boolean {
  const price = BALLS[kind].price;
  if (profile.coins < price) return false;
  profile.coins -= price;
  profile.balls[kind]++;
  return true;
}

const randInt = (rng: Rng, a: number, b: number) => a + Math.floor(rng.next() * (b - a + 1));
const pick = <T>(rng: Rng, arr: readonly T[]): T => arr[Math.floor(rng.next() * arr.length)];

/** Abre una Pokéball del inventario y aplica su contenido al perfil. */
export function openBall(profile: Profile, kind: BallKind, rng: Rng): Drop[] | null {
  if (profile.balls[kind] <= 0) return null;
  profile.balls[kind]--;
  const def = BALLS[kind];
  const chosen: string[] = [];
  for (let i = 0; i < def.distinct; i++) {
    const unowned = LINES.filter((l) => !profile.owned[l] && !chosen.includes(l));
    const owned = LINES.filter((l) => profile.owned[l] && !chosen.includes(l));
    const wantNew = unowned.length > 0 && (rng.next() < def.newChance || owned.length === 0);
    const pool = wantNew ? unowned : owned;
    if (pool.length === 0) break;
    chosen.push(pick(rng, pool));
  }
  const stages: Stage[] = chosen.map((line) => {
    const top = maxStage(line);
    const r = rng.next();
    if (top >= 3 && r < def.stage3Chance) return 3;
    if (top >= 2 && r < def.stage3Chance + def.stage2Chance) return 2;
    return 1;
  });
  if (def.guaranteeStage2 && !stages.some((s) => s >= 2)) {
    // Garantía: una carta en fase 2, a ser posible de una línea que aún no tengas en fase 2.
    const candidates = chosen.map((_, i) => i).filter((i) => maxStage(chosen[i]) >= 2);
    const better = candidates.filter((i) => (profile.owned[chosen[i]]?.stage ?? 0) < 2);
    const list = better.length ? better : candidates;
    if (list.length) stages[pick(rng, list)] = 2;
  }
  return chosen.map((line, i) => applyDrop(profile, line, stages[i], randInt(rng, def.min, def.max)));
}

function applyDrop(profile: Profile, line: string, stage: Stage, amount: number): Drop {
  const drop: Drop = { line, cardId: cardAtStage(line, stage).id, copies: amount, isNew: false, upgradedTo: null, coins: 0 };
  let own = profile.owned[line];
  let copies = amount;
  if (!own) {
    // Carta nueva: la primera copia la desbloquea; el resto cuenta para evolucionar.
    own = profile.owned[line] = { stage, copies: 0 };
    drop.isNew = true;
    drop.upgradedTo = stage > 1 ? stage : null;
    copies--;
  } else if (stage > own.stage) {
    own.stage = stage;
    drop.upgradedTo = stage;
  } else if (stage > 1) {
    // Evolución que ya tenías: se convierte en monedas por su valor.
    drop.coins += evolvedValue(stage);
  }
  if (own.stage >= maxStage(line)) {
    drop.coins += copies * COPY_VALUE;
    own.copies = 0;
  } else {
    own.copies += copies;
  }
  profile.coins += drop.coins;
  return drop;
}

// ---------------------------------------------------------------- evolucionar

export function evolveCost(profile: Profile, line: string): { copies: number; coins: number; to: Stage } | null {
  const own = profile.owned[line];
  if (!own || own.stage >= maxStage(line)) return null;
  const to = (own.stage + 1) as 2 | 3;
  return { ...EVOLVE_COST[to], to };
}

export function canEvolve(profile: Profile, line: string): boolean {
  const c = evolveCost(profile, line);
  return !!c && profile.owned[line].copies >= c.copies && profile.coins >= c.coins;
}

export function evolve(profile: Profile, line: string): boolean {
  if (!canEvolve(profile, line)) return false;
  const c = evolveCost(profile, line)!;
  const own = profile.owned[line];
  own.copies -= c.copies;
  profile.coins -= c.coins;
  own.stage = c.to;
  if (own.stage >= maxStage(line)) {
    profile.coins += own.copies * COPY_VALUE;
    own.copies = 0;
  }
  return true;
}

// ---------------------------------------------------------------- camino de trofeos

export interface RoadReward {
  trophies: number;
  coins?: number;
  ball?: BallKind;
}

export const TROPHY_ROAD: readonly RoadReward[] = [
  { trophies: 20, coins: 100 },
  { trophies: 50, ball: 'poke' },
  { trophies: 75, ball: 'super' },
  { trophies: 100, ball: 'ultra' },
  { trophies: 150, coins: 250 },
  { trophies: 200, ball: 'ultra' },
  { trophies: 250, ball: 'super' },
  { trophies: 300, ball: 'ultra' },
  { trophies: 350, coins: 400 },
  { trophies: 400, ball: 'ultra' },
  { trophies: 450, ball: 'super' },
  { trophies: 500, ball: 'master' },
  { trophies: 600, ball: 'ultra' },
  { trophies: 700, ball: 'ultra' },
  { trophies: 750, coins: 1000 },
  { trophies: 800, ball: 'ultra' },
  { trophies: 900, ball: 'ultra' },
  { trophies: 1000, ball: 'master' },
];

/** Cobra los hitos alcanzados que aún no se habían cobrado (perder trofeos no los repite). */
export function claimRoad(profile: Profile, trophies: number): RoadReward[] {
  const got: RoadReward[] = [];
  for (const r of TROPHY_ROAD) {
    if (trophies < r.trophies || profile.claimedRoad.includes(r.trophies)) continue;
    profile.claimedRoad.push(r.trophies);
    if (r.coins) profile.coins += r.coins;
    if (r.ball) profile.balls[r.ball]++;
    got.push(r);
  }
  return got;
}

// ---------------------------------------------------------------- rival

/**
 * Mazo del rival con evoluciones al azar: cuantos más trofeos tengas, más probable es que
 * saque segundas (y, raramente, terceras) fases. Determinista con la semilla de la partida.
 */
export function rivalDeck(baseLines: readonly string[], trophies: number, rng: Rng): string[] {
  const p2 = Math.min(0.55, 0.06 + trophies / 900);
  const p3 = Math.min(0.12, trophies / 5000);
  return baseLines.map((line) => {
    const r = rng.next();
    const stage = r < p3 ? 3 : r < p3 + p2 ? 2 : 1;
    return cardAtStage(line, stage).id;
  });
}
