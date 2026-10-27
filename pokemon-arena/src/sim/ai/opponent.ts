import { Rng } from '../core/rng';
import type { Team } from '../core/state';
import { enemyOf } from '../core/state';
import type { Vec } from '../core/vec';
import { dist } from '../core/vec';
import { ARENA, MID_Y, snapToTile } from '../data/arena';
import type { Card, PokemonCard } from '../data/cards';
import { attackElement, getCard } from '../data/cards';
import { typeMultiplier } from '../data/elements';
import { isDeployAllowed } from '../systems/deployment';
import type { Observation, ObservedTower, ObservedUnit } from './observation';

/** Parámetros de dificultad (configurables). */
export interface AiParams {
  /** Pasos entre decisiones. */
  decisionInterval: number;
  /** Pasos que tarda en "reaccionar" a una amenaza nueva. */
  reactionDelay: number;
  /** Energía mínima para iniciar un ataque sin amenazas. */
  attackEnergy: number;
  /** Probabilidad de dudar y saltarse una decisión (simula errores humanos). */
  hesitation: number;
  /** Si tiene en cuenta las ventajas de tipo al elegir defensa. */
  typeAware: boolean;
  /** Si aprovecha hechizos para rematar torres. */
  opportunist: boolean;
}

export type Difficulty = 'facil' | 'normal' | 'dificil';

export const DIFFICULTIES: Record<Difficulty, AiParams> = {
  facil: { decisionInterval: 30, reactionDelay: 40, attackEnergy: 9, hesitation: 0.35, typeAware: false, opportunist: false },
  normal: { decisionInterval: 16, reactionDelay: 20, attackEnergy: 8, hesitation: 0.12, typeAware: true, opportunist: true },
  dificil: { decisionInterval: 8, reactionDelay: 8, attackEnergy: 7, hesitation: 0, typeAware: true, opportunist: true },
};

export interface AiAction {
  cardId: string;
  pos: Vec;
  intent: 'defensa' | 'ataque' | 'apoyo' | 'remate' | 'ciclo';
}

/**
 * Rival controlado por ordenador. Decide solo a partir de una `Observation`
 * (sin acceso a la mano ni a la energía del jugador) y propone acciones que la
 * batalla vuelve a validar con las mismas reglas que al jugador humano.
 */
export class OpponentAI {
  readonly team: Team;
  readonly params: AiParams;
  private readonly rng: Rng;
  private readonly firstSeen = new Map<number, number>();
  private nextDecision = 0;

  constructor(team: Team, params: AiParams, seed: number) {
    this.team = team;
    this.params = params;
    this.rng = new Rng(seed);
  }

  /** Devuelve una acción o null si decide esperar. */
  decide(obs: Observation): AiAction | null {
    this.trackThreats(obs);
    if (obs.tick < this.nextDecision) return null;
    this.nextDecision = obs.tick + this.params.decisionInterval;
    if (this.params.hesitation > 0 && this.rng.next() < this.params.hesitation) return null;

    const affordable = obs.hand.filter((id) => getCard(id).cost <= obs.energy);
    if (affordable.length === 0) return null;

    if (this.params.opportunist) {
      const finisher = this.findFinisher(obs, affordable);
      if (finisher) return finisher;
    }
    const threats = this.noticedThreats(obs);
    if (threats.length > 0) {
      const defense = this.planDefense(obs, threats, affordable);
      if (defense) return defense;
    }
    return this.planOffense(obs, affordable);
  }

  // -------------------------------------------------------------- percepción

  private ownHalf(y: number): boolean {
    return this.team === 0 ? y > MID_Y - 1 : y < MID_Y + 1;
  }

  private myTowers(obs: Observation): ObservedTower[] {
    return obs.towers.filter((t) => t.team === this.team && !t.destroyed);
  }

  private trackThreats(obs: Observation): void {
    const alive = new Set<number>();
    for (const u of obs.units) {
      if (u.team === this.team) continue;
      alive.add(u.id);
      if (this.isThreat(obs, u) && !this.firstSeen.has(u.id)) this.firstSeen.set(u.id, obs.tick);
    }
    for (const id of this.firstSeen.keys()) if (!alive.has(id)) this.firstSeen.delete(id);
  }

  private isThreat(obs: Observation, u: ObservedUnit): boolean {
    if (this.ownHalf(u.pos.y)) return true;
    return this.myTowers(obs).some((t) => dist(t.pos, u.pos) < 10);
  }

  private noticedThreats(obs: Observation): ObservedUnit[] {
    return obs.units.filter((u) => {
      if (u.team === this.team || !this.isThreat(obs, u)) return false;
      const seen = this.firstSeen.get(u.id);
      return seen !== undefined && obs.tick - seen >= this.params.reactionDelay;
    });
  }

  // -------------------------------------------------------------- defensa

  private planDefense(obs: Observation, threats: ObservedUnit[], affordable: string[]): AiAction | null {
    const towers = this.myTowers(obs);
    const closeness = (u: ObservedUnit) => Math.min(...towers.map((t) => dist(t.pos, u.pos)), 99);
    const focus = threats.slice().sort((a, b) => closeness(a) - closeness(b) || a.id - b.id)[0];
    const cluster = threats.filter((u) => dist(u.pos, focus.pos) <= 3);

    // ¿Defienden ya suficientes aliados? Evita sobrerreaccionar.
    const defenders = obs.units.filter((u) => u.team === this.team && dist(u.pos, focus.pos) < 5);
    const threatHp = cluster.reduce((s, u) => s + u.hp, 0);
    const defenderHp = defenders.reduce((s, u) => s + u.hp, 0);
    if (defenderHp > threatHp * 1.3 && closeness(focus) > 6) return null;

    let best: { id: string; score: number } | null = null;
    for (const id of affordable) {
      const s = this.defenseScore(getCard(id), focus, cluster);
      if (s > -Infinity && (!best || s > best.score)) best = { id, score: s };
    }
    if (!best) return null;
    const card = getCard(best.id);
    const pos = card.kind === 'hechizo' ? centroid(cluster) : this.defensePosition(obs, card, focus);
    return pos ? { cardId: best.id, pos, intent: 'defensa' } : null;
  }

  private defenseScore(card: Card, focus: ObservedUnit, cluster: ObservedUnit[]): number {
    if (card.kind === 'hechizo') {
      let value = 0;
      for (const u of cluster) {
        const mult = this.params.typeAware ? typeMultiplier(card.types[0], u.types) : 1;
        value += Math.min(card.damage * mult, u.hp);
      }
      if (value < card.cost * 120) return -Infinity; // no compensa
      return value / 150 - card.cost * 0.35 + (cluster.length >= 3 ? 1 : 0);
    }
    if (card.targets === 'edificios') return -Infinity;
    if (focus.locomotion === 'aire' && card.targets !== 'aire_y_tierra') return -Infinity;

    const focusCard = getCard(focus.cardId);
    const atk = this.params.typeAware ? typeMultiplier(attackElement(card), focus.types) : 1;
    const def =
      this.params.typeAware && focusCard.kind === 'pokemon' ? typeMultiplier(attackElement(focusCard), card.types) : 1;
    let dps = ((card.damage * card.count) / card.hitSpeed) * atk;
    const areaAttack = (card.attack.splashRadius ?? 0) > 0 || card.ability?.kind === 'cadena';
    if (areaAttack && cluster.length >= 2) dps *= 1 + 0.5 * (cluster.length - 1);
    const toughness = (card.hp * card.count) / def;
    return dps / 100 + (toughness / 1000) * 0.6 - card.cost * 0.35;
  }

  private defensePosition(obs: Observation, card: PokemonCard, focus: ObservedUnit): Vec | null {
    const towers = this.myTowers(obs);
    const anchor = towers.slice().sort((a, b) => dist(a.pos, focus.pos) - dist(b.pos, focus.pos))[0];
    const back = card.range >= 3 ? 3.5 : 1.5;
    let p = focus.pos;
    if (anchor) {
      const dx = anchor.pos.x - focus.pos.x;
      const dy = anchor.pos.y - focus.pos.y;
      const d = Math.hypot(dx, dy) || 1;
      p = { x: focus.pos.x + (dx / d) * back, y: focus.pos.y + (dy / d) * back };
    }
    return this.nearestValid(obs, card, this.clampToOwnSide(p));
  }

  // -------------------------------------------------------------- ataque

  private findFinisher(obs: Observation, affordable: string[]): AiAction | null {
    for (const id of affordable) {
      const card = getCard(id);
      if (card.kind !== 'hechizo') continue;
      for (const t of obs.towers) {
        if (t.team === this.team || t.destroyed) continue;
        if (t.hp <= Math.round(card.damage * card.towerDamageFactor)) {
          return { cardId: id, pos: { x: t.pos.x, y: t.pos.y }, intent: 'remate' };
        }
      }
    }
    return null;
  }

  private planOffense(obs: Observation, affordable: string[]): AiAction | null {
    const troops = affordable.filter((id) => getCard(id).kind === 'pokemon');
    if (troops.length === 0) return null;
    const lane = this.chooseLane(obs);
    const laneX = ARENA.laneX[lane];
    const dir = this.team === 0 ? -1 : 1; // hacia el rival en Y

    // Apoyar una ofensiva propia que ya está en marcha: tropas en campo rival o un tanque
    // propio que avanza (un tanque solo no rinde: necesita apoyo detrás).
    const pushers = obs.units.filter(
      (u) => u.team === this.team && (!this.ownHalf(u.pos.y) || getCard(u.cardId).role === 'tanque'),
    );
    if (pushers.length > 0 && obs.energy >= 4) {
      const lead = pushers.slice().sort((a, b) => (a.pos.y - b.pos.y) * dir)[pushers.length - 1];
      const support = this.pick(troops, (c) => (c.role === 'distancia' || c.role === 'apoyo' || c.role === 'antigrupo' || c.role === 'area' ? 2 : 0) - c.cost * 0.2);
      if (support) {
        const card = getCard(support) as PokemonCard;
        const bridgeY = this.team === 0 ? ARENA.riverBottom + 0.5 : ARENA.riverTop - 0.5;
        const pos = this.nearestValid(obs, card, { x: lead.pos.x < ARENA.width / 2 ? ARENA.laneX[0] : ARENA.laneX[1], y: bridgeY });
        if (pos) return { cardId: support, pos, intent: 'apoyo' };
      }
    }

    const full = obs.energy >= obs.maxEnergy;
    if (obs.energy < this.params.attackEnergy && !full) return null;

    const tank = this.pick(troops, (c) => (c.role === 'tanque' ? 3 : -10));
    if (tank && obs.energy >= getCard(tank).cost + 2) {
      const backY = this.team === 0 ? ARENA.height - 4.5 : 4.5;
      const pos = this.nearestValid(obs, getCard(tank) as PokemonCard, { x: laneX, y: backY });
      if (pos) return { cardId: tank, pos, intent: 'ataque' };
    }
    const runner = this.pick(troops, (c) => (c.role === 'rapido' || c.role === 'asedio' ? 2 : 0) + (c.locomotion === 'aire' ? 1 : 0) - c.cost * 0.3);
    if (runner) {
      const bridgeY = this.team === 0 ? ARENA.riverBottom + 0.5 : ARENA.riverTop - 0.5;
      const pos = this.nearestValid(obs, getCard(runner) as PokemonCard, { x: laneX, y: bridgeY });
      if (pos) return { cardId: runner, pos, intent: full ? 'ciclo' : 'ataque' };
    }
    return null;
  }

  /** Ruta con la torre rival más débil (si una cayó, esa ruta: la base queda expuesta). */
  private chooseLane(obs: Observation): 0 | 1 {
    const foe = enemyOf(this.team);
    const guard = (role: 'guardia_izq' | 'guardia_der') => obs.towers.find((t) => t.team === foe && t.role === role)!;
    const l = guard('guardia_izq');
    const r = guard('guardia_der');
    const hl = l.destroyed ? -1 : l.hp;
    const hr = r.destroyed ? -1 : r.hp;
    if (hl !== hr) return hl < hr ? 0 : 1;
    return this.rng.next() < 0.5 ? 0 : 1;
  }

  // -------------------------------------------------------------- utilidades

  private pick(ids: string[], score: (c: PokemonCard) => number): string | null {
    let best: string | null = null;
    let bestS = -Infinity;
    for (const id of ids) {
      const c = getCard(id);
      if (c.kind !== 'pokemon') continue;
      const s = score(c);
      if (s > bestS) {
        bestS = s;
        best = id;
      }
    }
    return bestS > -5 ? best : null;
  }

  private clampToOwnSide(p: Vec): Vec {
    const y = this.team === 0 ? Math.max(ARENA.riverBottom + 0.5, p.y) : Math.min(ARENA.riverTop - 0.5, p.y);
    return { x: Math.min(ARENA.width - 0.5, Math.max(0.5, p.x)), y };
  }

  /** Casilla válida más cercana (búsqueda en anillos) usando las reglas públicas de despliegue. */
  private nearestValid(obs: Observation, card: Card, p: Vec): Vec | null {
    const start = snapToTile(p);
    for (let r = 0; r <= 4; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const q = { x: start.x + dx, y: start.y + dy };
          if (isDeployAllowed(this.team, card, q, obs.towers)) return q;
        }
      }
    }
    return null;
  }
}

function centroid(units: readonly ObservedUnit[]): Vec {
  let x = 0;
  let y = 0;
  for (const u of units) {
    x += u.pos.x;
    y += u.pos.y;
  }
  return { x: x / units.length, y: y / units.length };
}
