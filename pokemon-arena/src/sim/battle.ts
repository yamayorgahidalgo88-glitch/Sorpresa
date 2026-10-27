import { Rng, deriveSeed } from './core/rng';
import type {
  BattleResult,
  Phase,
  PlayerState,
  SimEvent,
  Team,
  TowerEntity,
  UnitEntity,
} from './core/state';
import { enemyOf } from './core/state';
import type { Vec } from './core/vec';
import { dist, moveTowards } from './core/vec';
import type { World } from './core/world';
import { emit, getEntity, isAlive, nextId } from './core/world';
import { ARENA, TOWERS, inRiverBand, mirrorForTeam, snapToTile } from './data/arena';
import type { PokemonCard, SpellCard } from './data/cards';
import { attackElement, getCard } from './data/cards';
import type { Rules } from './data/rules';
import { DEFAULT_RULES, secondsToTicks } from './data/rules';
import type { HitSpec } from './systems/combat';
import { applySlow, applySplash, applyStun, resolveHit, spawnProjectile } from './systems/combat';
import { DeckCycle, validateDeck } from './systems/deck';
import { isDeployAllowed } from './systems/deployment';
import { canAfford, createEnergy, energyPoints, energyValue, regenerate, spend } from './systems/energy';
import { clampToArena, constrainGround, waypoint } from './systems/navigation';
import { canTarget, edgeDistance, selectTowerTarget, selectUnitTarget } from './systems/targeting';
import { baseDestroyed, decide, medalsOf } from './systems/victory';

export interface BattleOptions {
  seed: number;
  decks: [readonly string[], readonly string[]];
  rules?: Partial<Rules>;
}

export type DeployFailure = 'partida_terminada' | 'carta_no_en_mano' | 'energia_insuficiente' | 'zona_no_permitida';

export type DeployResult = { ok: true; unitIds: number[]; pos: Vec } | { ok: false; reason: DeployFailure };

/** Orden registrada: permite reproducir una partida exacta con la misma semilla. */
export interface Command {
  tick: number;
  team: Team;
  cardId: string;
  x: number;
  y: number;
}

/** Formaciones de despliegue (offsets en casillas; "delante" es hacia el rival). */
const FORMATIONS: Record<number, Vec[]> = {
  1: [{ x: 0, y: 0 }],
  2: [{ x: -0.45, y: 0 }, { x: 0.45, y: 0 }],
  3: [{ x: 0, y: -0.5 }, { x: -0.55, y: 0.35 }, { x: 0.55, y: 0.35 }],
};

/**
 * Motor de simulación determinista e independiente de la interfaz.
 * Se avanza con `step()` a paso fijo (`rules.tickRate` pasos por segundo).
 */
export class Battle {
  readonly rules: Rules;
  readonly seed: number;
  readonly world: World;
  readonly commandLog: Command[] = [];
  phase: Phase = 'normal';
  result: BattleResult | null = null;

  constructor(opts: BattleOptions) {
    this.rules = { ...DEFAULT_RULES, ...opts.rules };
    this.seed = opts.seed >>> 0;
    for (const d of opts.decks) {
      const v = validateDeck(d, this.rules.deckSize);
      if (!v.ok) throw new Error(`Mazo no válido: ${v.errors.join(' ')}`);
    }
    const players = ([0, 1] as const).map(
      (team): PlayerState => ({
        team,
        energy: createEnergy(this.rules),
        deck: new DeckCycle(opts.decks[team], new Rng(deriveSeed(this.seed, team + 1)), this.rules.handSize),
        cardsPlayed: 0,
        energySpent: 0,
      }),
    ) as [PlayerState, PlayerState];

    this.world = {
      rules: this.rules,
      tick: 0,
      units: [],
      towers: [],
      projectiles: [],
      spells: [],
      players,
      events: [],
      entities: new Map(),
      idCounter: 0,
    };
    for (const team of [0, 1] as const) {
      for (const def of TOWERS) {
        const t: TowerEntity = {
          kind: 'tower',
          id: nextId(this.world),
          team,
          role: def.role,
          pos: mirrorForTeam(def.pos, team),
          radius: def.radius,
          hp: def.hp,
          maxHp: def.hp,
          damage: def.damage,
          hitTicks: secondsToTicks(this.rules, def.hitSpeed),
          range: def.range,
          projectileSpeed: def.projectileSpeed,
          cooldown: 0,
          active: def.role !== 'base',
          targetId: null,
          destroyed: false,
        };
        this.world.towers.push(t);
        this.world.entities.set(t.id, t);
      }
    }
  }

  // ------------------------------------------------------------------ consultas

  get tick(): number {
    return this.world.tick;
  }

  get isOver(): boolean {
    return this.result !== null;
  }

  get regularTicks(): number {
    return secondsToTicks(this.rules, this.rules.regularSeconds);
  }

  get overtimeTicks(): number {
    return secondsToTicks(this.rules, this.rules.overtimeSeconds);
  }

  /** Segundos restantes de la fase actual (reglamentario o prórroga). */
  get secondsLeft(): number {
    const t = this.world.tick;
    const end = this.phase === 'prorroga' ? this.regularTicks + this.overtimeTicks : this.regularTicks;
    return Math.max(0, (end - t) / this.rules.tickRate);
  }

  player(team: Team): PlayerState {
    return this.world.players[team];
  }

  energy(team: Team): number {
    return energyValue(this.world.players[team].energy);
  }

  energyPoints(team: Team): number {
    return energyPoints(this.world.players[team].energy);
  }

  hand(team: Team): readonly string[] {
    return this.world.players[team].deck.hand;
  }

  nextCard(team: Team): string {
    return this.world.players[team].deck.next;
  }

  medals(team: Team): number {
    return medalsOf(team, this.world.towers);
  }

  energyMultiplier(): number {
    if (this.phase === 'prorroga') return this.rules.overtimeEnergyMultiplier;
    if (this.phase === 'doble') return 2;
    return 1;
  }

  /** Valida un despliegue sin ejecutarlo. */
  canDeploy(team: Team, cardId: string, rawPos: Vec): DeployResult {
    if (this.result) return { ok: false, reason: 'partida_terminada' };
    const p = this.world.players[team];
    if (p.deck.indexOf(cardId) < 0) return { ok: false, reason: 'carta_no_en_mano' };
    const card = getCard(cardId);
    if (!canAfford(p.energy, card.cost)) return { ok: false, reason: 'energia_insuficiente' };
    const pos = snapToTile(rawPos);
    if (!isDeployAllowed(team, card, pos, this.world.towers)) return { ok: false, reason: 'zona_no_permitida' };
    return { ok: true, unitIds: [], pos };
  }

  isDeployZone(team: Team, cardId: string, rawPos: Vec): boolean {
    return isDeployAllowed(team, getCard(cardId), snapToTile(rawPos), this.world.towers);
  }

  // ------------------------------------------------------------------ órdenes

  /**
   * Juega una carta de la mano. Se aplica antes del siguiente `step()` y queda
   * registrada en `commandLog` con el paso actual.
   */
  deploy(team: Team, cardId: string, rawPos: Vec): DeployResult {
    const check = this.canDeploy(team, cardId, rawPos);
    if (!check.ok) return check;
    const p = this.world.players[team];
    const card = getCard(cardId);
    spend(p.energy, card.cost);
    p.deck.play(p.deck.indexOf(cardId));
    p.cardsPlayed++;
    p.energySpent += card.cost;
    const pos = check.pos;
    this.commandLog.push({ tick: this.world.tick, team, cardId, x: pos.x, y: pos.y });

    if (card.kind === 'hechizo') {
      const delayTicks = secondsToTicks(this.rules, card.delay);
      this.world.spells.push({ id: nextId(this.world), team, cardId, pos, ticksLeft: delayTicks });
      emit(this.world, { type: 'hechizo_lanzado', team, cardId, pos, delayTicks });
      return { ok: true, unitIds: [], pos };
    }
    const unitIds = this.spawnUnits(team, card, pos);
    emit(this.world, { type: 'despliegue', team, cardId, pos, unitIds });
    return { ok: true, unitIds, pos };
  }

  /**
   * Crea tropas sin pasar por mano ni energía. Solo para pruebas y herramientas
   * (escenarios controlados); la interfaz y la IA usan siempre `deploy()`.
   */
  spawnUnchecked(team: Team, cardId: string, pos: Vec, opts: { ready?: boolean } = {}): number[] {
    const card = getCard(cardId);
    if (card.kind !== 'pokemon') throw new Error(`${cardId} no es un Pokémon`);
    const ids = this.spawnUnits(team, card, pos);
    if (opts.ready) for (const id of ids) (this.world.entities.get(id) as UnitEntity).deployTicks = 0;
    return ids;
  }

  private spawnUnits(team: Team, card: PokemonCard, pos: Vec): number[] {
    const offsets = FORMATIONS[card.count] ?? FORMATIONS[1];
    const ids: number[] = [];
    const dir = team === 0 ? 1 : -1;
    for (let i = 0; i < card.count; i++) {
      const o = offsets[i] ?? { x: 0, y: 0 };
      const u: UnitEntity = {
        kind: 'unit',
        id: nextId(this.world),
        team,
        cardId: card.id,
        types: card.types.slice(),
        pos: { x: pos.x + o.x, y: pos.y + o.y * dir },
        hp: card.hp,
        maxHp: card.hp,
        radius: card.radius,
        mass: card.mass,
        locomotion: card.locomotion,
        deployTicks: secondsToTicks(this.rules, card.deployTime),
        cooldown: secondsToTicks(this.rules, card.hitSpeed) * 0.5,
        targetId: null,
        engaged: false,
        abilityTimer: card.ability && 'interval' in card.ability ? secondsToTicks(this.rules, card.ability.interval) : 0,
        status: { stunUntil: 0, slowUntil: 0, slowFactor: 0 },
        dead: false,
      };
      if (u.locomotion === 'tierra' && inRiverBand(u.pos.y)) {
        u.pos.y = pos.y > ARENA.riverBottom ? ARENA.riverBottom + 0.01 : ARENA.riverTop - 0.01;
      }
      clampToArena(u);
      this.world.units.push(u);
      this.world.entities.set(u.id, u);
      ids.push(u.id);
    }
    return ids;
  }

  // ------------------------------------------------------------------ bucle

  /** Avanza un paso fijo. Devuelve los eventos generados en él. */
  step(): SimEvent[] {
    const w = this.world;
    // Las órdenes dadas entre pasos ya emitieron eventos: se entregan junto con este paso.
    if (this.result) {
      const out = w.events;
      w.events = [];
      return out;
    }

    const mult = this.energyMultiplier();
    for (const p of w.players) regenerate(p.energy, mult);

    this.updateSpells();
    this.updateStatuses();
    this.updateAbilities();
    for (const u of w.units) if (this.canAct(u)) selectUnitTarget(w, u);
    for (const t of w.towers) selectTowerTarget(w, t);
    this.updateEngagement();
    this.moveUnits();
    this.resolveCollisions();
    this.updateAttacks();
    this.updateProjectiles();
    this.resolveDeaths();

    w.tick++;
    this.updatePhaseAndVictory();

    const out = w.events;
    w.events = [];
    return out;
  }

  /** Ejecuta pasos hasta terminar o alcanzar `maxTicks`. */
  runUntilEnd(maxTicks = Infinity, onTick?: (b: Battle) => void): BattleResult | null {
    let n = 0;
    while (!this.result && n < maxTicks) {
      onTick?.(this);
      this.step();
      n++;
    }
    return this.result;
  }

  private canAct(u: UnitEntity): boolean {
    return isAlive(u) && u.deployTicks <= 0 && this.world.tick >= u.status.stunUntil;
  }

  private slowMul(u: UnitEntity): number {
    return this.world.tick < u.status.slowUntil ? 1 - u.status.slowFactor : 1;
  }

  private updateSpells(): void {
    const w = this.world;
    const remaining = [];
    for (const s of w.spells) {
      s.ticksLeft--;
      if (s.ticksLeft > 0) {
        remaining.push(s);
        continue;
      }
      const card = getCard(s.cardId) as SpellCard;
      const hit = applySplash(w, s.team, s.pos, card.radius, card.damage, card.types[0], {
        hitsAir: true,
        includeTowers: true,
        towerFactor: card.towerDamageFactor,
      });
      if (card.effect) {
        for (const id of hit) {
          const e = w.entities.get(id);
          if (!e || e.kind !== 'unit') continue;
          const ticks = secondsToTicks(this.rules, card.effect.duration);
          if (card.effect.kind === 'aturdir') applyStun(w, e, ticks);
          else applySlow(w, e, card.effect.factor, ticks);
        }
      }
      emit(w, { type: 'hechizo_impacto', team: s.team, cardId: s.cardId, pos: s.pos, radius: card.radius });
    }
    w.spells = remaining;
  }

  private updateStatuses(): void {
    for (const u of this.world.units) {
      if (u.deployTicks > 0) u.deployTicks--;
    }
  }

  private updateAbilities(): void {
    const w = this.world;
    for (const u of w.units) {
      if (!this.canAct(u)) continue;
      const card = getCard(u.cardId) as PokemonCard;
      const ab = card.ability;
      if (!ab || (ab.kind !== 'aura_curativa' && ab.kind !== 'canto')) continue;
      if (u.abilityTimer > 0) {
        u.abilityTimer--;
        continue;
      }
      if (ab.kind === 'aura_curativa') {
        for (const a of w.units) {
          if (a.team !== u.team || !isAlive(a) || a.hp >= a.maxHp) continue;
          if (dist(a.pos, u.pos) - a.radius > ab.radius) continue;
          const amount = Math.min(ab.amount, a.maxHp - a.hp);
          a.hp += amount;
          emit(w, { type: 'curacion', targetId: a.id, amount });
        }
        u.abilityTimer = secondsToTicks(this.rules, ab.interval);
      } else {
        const foe = enemyOf(u.team);
        const targets = w.units.filter(
          (e) => e.team === foe && isAlive(e) && dist(e.pos, u.pos) - e.radius <= ab.radius,
        );
        if (targets.length === 0) continue; // lista para usarse en cuanto haya enemigos
        const ticks = secondsToTicks(this.rules, ab.duration);
        for (const e of targets) applyStun(w, e, ticks);
        emit(w, { type: 'canto', sourceId: u.id, pos: { ...u.pos }, radius: ab.radius, targetIds: targets.map((e) => e.id) });
        u.abilityTimer = secondsToTicks(this.rules, ab.interval);
      }
    }
  }

  /** Marca qué tropas tienen a su objetivo dentro del alcance (dejan de caminar). */
  private updateEngagement(): void {
    for (const u of this.world.units) {
      if (!this.canAct(u)) continue;
      const card = getCard(u.cardId) as PokemonCard;
      const target = getEntity(this.world, u.targetId);
      u.engaged = !!target && canTarget(card.targets, target) && edgeDistance(u, target) <= card.range;
    }
  }

  private moveUnits(): void {
    const w = this.world;
    for (const u of w.units) {
      if (!this.canAct(u) || u.engaged) continue;
      const target = getEntity(w, u.targetId);
      if (!target) continue;
      const card = getCard(u.cardId) as PokemonCard;
      const step = (card.speed * this.slowMul(u)) / this.rules.tickRate;
      const prev = { x: u.pos.x, y: u.pos.y };
      const next = moveTowards(u.pos, waypoint(u, target.pos), step);
      u.pos.x = next.x;
      u.pos.y = next.y;
      constrainGround(u, prev);
      clampToArena(u);
    }
  }

  /**
   * Separación de cuerpos: las tropas no se atraviesan. Se empujan según su masa
   * (las pesadas se desplazan menos). Tierra y aire son capas independientes.
   * Las torres son obstáculos fijos para las tropas terrestres.
   */
  private resolveCollisions(): void {
    const units = this.world.units.filter((u) => isAlive(u));
    for (let iter = 0; iter < 2; iter++) {
      for (let i = 0; i < units.length; i++) {
        const a = units[i];
        for (let j = i + 1; j < units.length; j++) {
          const b = units[j];
          if (a.locomotion !== b.locomotion) continue;
          const dx = b.pos.x - a.pos.x;
          const dy = b.pos.y - a.pos.y;
          const minD = a.radius + b.radius;
          const d2 = dx * dx + dy * dy;
          if (d2 >= minD * minD) continue;
          const d = Math.sqrt(d2);
          let nx: number;
          let ny: number;
          if (d < 1e-6) {
            nx = (a.id + b.id) % 2 === 0 ? 1 : -1;
            ny = 0;
          } else {
            nx = dx / d;
            ny = dy / d;
          }
          const overlap = minD - d;
          const total = a.mass + b.mass;
          const prevA = { x: a.pos.x, y: a.pos.y };
          const prevB = { x: b.pos.x, y: b.pos.y };
          a.pos.x -= nx * overlap * (b.mass / total);
          a.pos.y -= ny * overlap * (b.mass / total);
          b.pos.x += nx * overlap * (a.mass / total);
          b.pos.y += ny * overlap * (a.mass / total);
          constrainGround(a, prevA);
          constrainGround(b, prevB);
        }
      }
      for (const u of units) {
        if (u.locomotion === 'aire') continue;
        for (const t of this.world.towers) {
          if (t.destroyed) continue;
          const dx = u.pos.x - t.pos.x;
          const dy = u.pos.y - t.pos.y;
          const minD = u.radius + t.radius;
          const d = Math.hypot(dx, dy);
          if (d >= minD) continue;
          if (d < 1e-6) {
            u.pos.y += u.team === 0 ? minD : -minD;
          } else {
            u.pos.x = t.pos.x + (dx / d) * minD;
            u.pos.y = t.pos.y + (dy / d) * minD;
          }
        }
        clampToArena(u);
      }
    }
  }

  private updateAttacks(): void {
    const w = this.world;
    for (const u of w.units) {
      if (!this.canAct(u)) continue;
      const card = getCard(u.cardId) as PokemonCard;
      if (u.cooldown > 0) u.cooldown = Math.max(0, u.cooldown - this.slowMul(u));
      if (!u.engaged || u.cooldown > 0) continue;
      const target = getEntity(w, u.targetId);
      if (!target || !isAlive(target)) continue;
      const spec = this.hitSpecFor(u, card);
      emit(w, { type: 'ataque', sourceId: u.id, targetId: target.id, melee: card.attack.kind === 'cuerpo' });
      if (card.attack.kind === 'cuerpo') resolveHit(w, spec, target, target.pos);
      else spawnProjectile(w, u, target, card.attack.projectileSpeed ?? 10, spec);
      u.cooldown = secondsToTicks(this.rules, card.hitSpeed);
    }
    for (const t of w.towers) {
      if (t.destroyed || !t.active) continue;
      if (t.cooldown > 0) t.cooldown--;
      const target = getEntity(w, t.targetId);
      if (t.cooldown > 0 || !target || !isAlive(target)) continue;
      if (edgeDistance(t, target) > t.range) continue;
      emit(w, { type: 'ataque', sourceId: t.id, targetId: target.id, melee: false });
      spawnProjectile(w, t, target, t.projectileSpeed, {
        team: t.team,
        damage: t.damage,
        element: null,
        splashRadius: 0,
        splashHitsAir: false,
      });
      t.cooldown = t.hitTicks;
    }
  }

  private hitSpecFor(u: UnitEntity, card: PokemonCard): HitSpec {
    const ab = card.ability;
    return {
      team: u.team,
      damage: card.damage,
      element: attackElement(card),
      splashRadius: card.attack.splashRadius ?? 0,
      splashHitsAir: card.targets === 'aire_y_tierra',
      chain: ab?.kind === 'cadena' ? { jumps: ab.jumps, radius: ab.radius, falloff: ab.falloff } : undefined,
      slow: ab?.kind === 'ralentizar' ? { factor: ab.factor, duration: ab.duration } : undefined,
    };
  }

  private updateProjectiles(): void {
    const w = this.world;
    const remaining = [];
    for (const p of w.projectiles) {
      const target = getEntity(w, p.targetId);
      const alive = isAlive(target);
      if (alive) p.aim = { x: target!.pos.x, y: target!.pos.y };
      const step = p.speed / this.rules.tickRate;
      const reach = alive ? target!.radius * 0.5 : 0;
      if (dist(p.pos, p.aim) - reach <= step) {
        p.pos = { x: p.aim.x, y: p.aim.y };
        resolveHit(
          w,
          {
            team: p.team,
            damage: p.damage,
            element: p.element,
            splashRadius: p.splashRadius,
            splashHitsAir: p.splashHitsAir,
            chain: p.chain,
            slow: p.slow,
          },
          alive ? target : undefined,
          p.aim,
        );
      } else {
        p.pos = moveTowards(p.pos, p.aim, step);
        remaining.push(p);
      }
    }
    w.projectiles = remaining;
  }

  /**
   * Muertes y torres derribadas. Cada entidad emite su evento UNA sola vez (bandera
   * `dead`/`destroyed`). Las explosiones al morir pueden encadenar más muertes: se
   * repite hasta que no quedan cambios.
   */
  private resolveDeaths(): void {
    const w = this.world;
    let changed = true;
    while (changed) {
      changed = false;
      for (const u of w.units) {
        if (u.dead || u.hp > 0) continue;
        u.dead = true;
        changed = true;
        emit(w, { type: 'muerte', unitId: u.id, team: u.team, cardId: u.cardId, pos: { ...u.pos } });
        const ab = (getCard(u.cardId) as PokemonCard).ability;
        if (ab?.kind === 'autodestruccion') {
          emit(w, { type: 'explosion', sourceId: u.id, pos: { ...u.pos }, radius: ab.radius });
          applySplash(w, u.team, u.pos, ab.radius, ab.damage, ab.element, { hitsAir: false, includeTowers: true });
        }
      }
      for (const t of w.towers) {
        if (t.destroyed || t.hp > 0) continue;
        t.destroyed = true;
        t.targetId = null;
        changed = true;
        emit(w, { type: 'torre_destruida', towerId: t.id, team: t.team, role: t.role });
        if (t.role !== 'base') {
          const base = w.towers.find((b) => b.team === t.team && b.role === 'base');
          if (base && !base.destroyed && !base.active) {
            base.active = true;
            emit(w, { type: 'base_activada', towerId: base.id, team: base.team });
          }
        }
      }
    }
    w.units = w.units.filter((u) => !u.dead);
    for (const [id, e] of w.entities) if (e.kind === 'unit' && e.dead) w.entities.delete(id);
  }

  private updatePhaseAndVictory(): void {
    const w = this.world;
    const towers = w.towers;
    if (baseDestroyed(0, towers) || baseDestroyed(1, towers)) {
      return this.finish(decide(towers, w.tick, 'base_destruida', true)!);
    }
    const regular = this.regularTicks;
    if (this.phase === 'normal' && w.tick >= secondsToTicks(this.rules, this.rules.doubleEnergyFromSecond) && w.tick < regular) {
      this.setPhase('doble');
    }
    if (this.phase !== 'prorroga' && w.tick >= regular) {
      const r = decide(towers, w.tick, 'tiempo', false);
      if (r) return this.finish(r);
      this.setPhase('prorroga');
      return;
    }
    if (this.phase === 'prorroga') {
      const r = decide(towers, w.tick, 'muerte_subita', false);
      if (r) return this.finish(r);
      if (w.tick >= regular + this.overtimeTicks) return this.finish(decide(towers, w.tick, 'desempate', true)!);
    }
  }

  private setPhase(phase: Phase): void {
    this.phase = phase;
    emit(this.world, { type: 'fase', phase });
  }

  private finish(result: BattleResult): void {
    this.result = result;
    this.phase = 'terminada';
    emit(this.world, { type: 'fase', phase: 'terminada' });
    emit(this.world, { type: 'fin', result });
  }

  // ------------------------------------------------------------------ utilidades

  /** Huella del estado: dos partidas iguales producen la misma huella. */
  stateHash(): string {
    const w = this.world;
    const parts: (string | number)[] = [w.tick, this.phase];
    for (const t of w.towers) parts.push(t.id, t.hp, t.destroyed ? 1 : 0, t.active ? 1 : 0);
    for (const u of w.units) parts.push(u.id, u.cardId, u.hp, u.pos.x.toFixed(6), u.pos.y.toFixed(6));
    for (const p of w.players) parts.push(p.energy.sub, p.deck.hand.join(','), p.deck.queue.join(','));
    let h = 2166136261;
    const s = parts.join('|');
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
    return h.toString(16).padStart(8, '0');
  }

  /** Reproduce una partida registrada con la misma semilla y mazos. */
  static replay(opts: BattleOptions, log: readonly Command[], maxTicks = 100000): Battle {
    const b = new Battle(opts);
    let i = 0;
    while (!b.result && b.tick < maxTicks) {
      while (i < log.length && log[i].tick === b.tick) {
        const c = log[i++];
        const r = b.deploy(c.team, c.cardId, { x: c.x, y: c.y });
        if (!r.ok) throw new Error(`Orden no reproducible en el paso ${c.tick}: ${r.reason}`);
      }
      b.step();
    }
    return b;
  }
}

