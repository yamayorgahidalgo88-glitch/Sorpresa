import type { Vec } from './vec';
import type { Element, EffectivenessLabel } from '../data/elements';
import type { Locomotion } from '../data/cards';
import type { TowerRole } from '../data/arena';
import type { EnergyState } from '../systems/energy';
import type { DeckCycle } from '../systems/deck';

export type Team = 0 | 1;

export function enemyOf(team: Team): Team {
  return team === 0 ? 1 : 0;
}

export interface StatusEffects {
  /** Paso hasta el que la unidad está aturdida/dormida (exclusivo). */
  stunUntil: number;
  slowUntil: number;
  /** Fracción de reducción de velocidad y cadencia (0..1). */
  slowFactor: number;
}

export interface UnitEntity {
  kind: 'unit';
  id: number;
  team: Team;
  cardId: string;
  types: Element[];
  pos: Vec;
  hp: number;
  maxHp: number;
  radius: number;
  mass: number;
  locomotion: Locomotion;
  /** Pasos restantes de despliegue (no actúa mientras sea > 0). */
  deployTicks: number;
  /** Pasos hasta poder atacar de nuevo (puede ser fraccionario por ralentización). */
  cooldown: number;
  targetId: number | null;
  /** true mientras el objetivo esté dentro del alcance y se le esté atacando. */
  engaged: boolean;
  abilityTimer: number;
  /** Barrera que absorbe daño antes que la salud (habilidad «escudo»). */
  shield: number;
  /** Edificios: salud que pierden por paso y resto acumulado (0 en las tropas). */
  decayRate: number;
  decayAcc: number;
  status: StatusEffects;
  dead: boolean;
}

export interface TowerEntity {
  kind: 'tower';
  id: number;
  team: Team;
  role: TowerRole;
  pos: Vec;
  radius: number;
  hp: number;
  maxHp: number;
  damage: number;
  hitTicks: number;
  range: number;
  projectileSpeed: number;
  cooldown: number;
  /** La base empieza inactiva; las guardianas siempre están activas. */
  active: boolean;
  targetId: number | null;
  destroyed: boolean;
}

export type Entity = UnitEntity | TowerEntity;

export interface Projectile {
  id: number;
  team: Team;
  sourceId: number;
  targetId: number;
  pos: Vec;
  /** Última posición conocida del objetivo (si muere, el proyectil acaba ahí). */
  aim: Vec;
  speed: number;
  damage: number;
  element: Element | null;
  sourceCardId: string | null;
  splashRadius: number;
  /** Filtro de área: 'tierra' no daña voladores. */
  splashHitsAir: boolean;
  chain?: { jumps: number; radius: number; falloff: number };
  slow?: { factor: number; duration: number };
}

/** Zona persistente de un hechizo con daño en el tiempo (Tóxico). */
export interface PoisonZone {
  id: number;
  team: Team;
  cardId: string;
  pos: Vec;
  pulsesLeft: number;
  /** Pasos hasta el siguiente golpe. */
  timer: number;
}

export interface PendingSpell {
  id: number;
  team: Team;
  cardId: string;
  pos: Vec;
  ticksLeft: number;
}

export type Phase = 'normal' | 'doble' | 'prorroga' | 'terminada';

export type EndReason = 'base_destruida' | 'tiempo' | 'muerte_subita' | 'desempate' | 'empate';

export interface BattleResult {
  winner: Team | null;
  reason: EndReason;
  medals: [number, number];
  tick: number;
}

export interface PlayerState {
  team: Team;
  energy: EnergyState;
  deck: DeckCycle;
  cardsPlayed: number;
  energySpent: number;
  /** Daño total infligido a torres rivales. */
  towerDamage: number;
  /** Pokémon rivales derrotados. */
  defeated: number;
  /** Última carta jugada (la que copia Ditto); null al empezar. */
  lastPlayed: string | null;
  /** Veces que se ha jugado cada línea desde su última evolución en combate. */
  evoCount: Record<string, number>;
}

/** Eventos emitidos en cada paso: la interfaz los usa para animaciones y sonido. */
export type SimEvent =
  | { type: 'despliegue'; team: Team; cardId: string; pos: Vec; unitIds: number[]; via?: string; evolved?: boolean }
  | { type: 'hechizo_lanzado'; team: Team; cardId: string; pos: Vec; delayTicks: number; via?: string }
  | { type: 'hechizo_impacto'; team: Team; cardId: string; pos: Vec; radius: number }
  | { type: 'ataque'; sourceId: number; targetId: number; melee: boolean }
  | { type: 'proyectil'; projectileId: number; sourceId: number; targetId: number; element: Element | null }
  | { type: 'impacto_area'; pos: Vec; radius: number; element: Element | null }
  | { type: 'cadena'; points: Vec[] }
  /** `sourceCardId`: carta que causó el daño (null = disparo de torre). */
  | { type: 'dano'; targetId: number; amount: number; effectiveness: EffectivenessLabel; element: Element | null; sourceTeam: Team; sourceCardId: string | null }
  | { type: 'curacion'; targetId: number; amount: number }
  | { type: 'energia'; team: Team; unitId: number; amount: number }
  | { type: 'veneno'; team: Team; pos: Vec; radius: number; final: boolean }
  | { type: 'canto'; sourceId: number; pos: Vec; radius: number; targetIds: number[] }
  | { type: 'explosion'; sourceId: number; pos: Vec; radius: number }
  | { type: 'muerte'; unitId: number; team: Team; cardId: string; pos: Vec }
  | { type: 'torre_destruida'; towerId: number; team: Team; role: TowerRole }
  | { type: 'base_activada'; towerId: number; team: Team }
  | { type: 'fase'; phase: Phase }
  | { type: 'fin'; result: BattleResult };
