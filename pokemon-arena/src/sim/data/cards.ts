import type { Element } from './elements';

/**
 * Catálogo de cartas: TODA la configuración de estadísticas vive aquí.
 * Velocidades en casillas/segundo, alcances y radios en casillas, tiempos en segundos.
 * Las cifras son de diseño propio (no proceden de datos internos de ningún juego).
 */

export type Role = 'tanque' | 'rapido' | 'distancia' | 'apoyo' | 'antigrupo' | 'area' | 'asedio' | 'hechizo';
export type Locomotion = 'tierra' | 'aire';
/** Qué puede atacar la unidad. */
export type TargetFilter = 'tierra' | 'aire_y_tierra' | 'edificios';

export type Ability =
  /** Cura a los aliados cercanos (incluida ella misma) cada `interval` segundos. */
  | { kind: 'aura_curativa'; radius: number; amount: number; interval: number }
  /** Al morir causa daño de área a los enemigos (tropas y torres). */
  /** Al morir causa daño de área; las torres reciben `towerFactor` de ese daño. */
  | { kind: 'autodestruccion'; radius: number; damage: number; element: Element; towerFactor: number }
  /** Cada `interval` segundos duerme (aturde) a los enemigos cercanos. */
  | { kind: 'canto'; radius: number; duration: number; interval: number }
  /** Cada impacto salta a `jumps` enemigos cercanos con daño decreciente. */
  | { kind: 'cadena'; jumps: number; radius: number; falloff: number }
  /** Cada impacto ralentiza al objetivo. */
  | { kind: 'ralentizar'; factor: number; duration: number };

export interface AttackDef {
  kind: 'cuerpo' | 'proyectil';
  /** Velocidad del proyectil (casillas/s). */
  projectileSpeed?: number;
  /** Radio de daño en área alrededor del objetivo (0 = un solo objetivo). */
  splashRadius?: number;
  /** Tipo del ataque; por defecto, el primer tipo del Pokémon. */
  element?: Element;
}

export interface PokemonCard {
  kind: 'pokemon';
  id: string;
  name: string;
  types: Element[];
  role: Role;
  cost: number;
  /** Número de unidades que aparecen al jugar la carta. */
  count: number;
  hp: number;
  damage: number;
  /** Segundos entre ataques. */
  hitSpeed: number;
  speed: number;
  range: number;
  /** Distancia a la que detecta enemigos. */
  sight: number;
  radius: number;
  mass: number;
  locomotion: Locomotion;
  targets: TargetFilter;
  attack: AttackDef;
  /** Segundos que tarda en poder actuar tras desplegarse. */
  deployTime: number;
  ability?: Ability;
  description: string;
}

export interface SpellCard {
  kind: 'hechizo';
  id: string;
  name: string;
  types: [Element];
  role: 'hechizo';
  cost: number;
  radius: number;
  damage: number;
  /** Fracción del daño que reciben las torres. */
  towerDamageFactor: number;
  /** Segundos entre el lanzamiento y el impacto. */
  delay: number;
  effect?: { kind: 'aturdir'; duration: number } | { kind: 'ralentizar'; factor: number; duration: number };
  description: string;
}

export type Card = PokemonCard | SpellCard;

const POKEMON: PokemonCard[] = [
  {
    kind: 'pokemon', id: 'onix', name: 'Onix', types: ['roca', 'tierra'], role: 'tanque', cost: 5, count: 1,
    hp: 3000, damage: 150, hitSpeed: 1.5, speed: 0.8, range: 0.8, sight: 7, radius: 0.8, mass: 8,
    locomotion: 'tierra', targets: 'edificios', attack: { kind: 'cuerpo' }, deployTime: 1,
    description: 'Tanque enorme que solo ataca torres. Ideal para abrir camino a otros Pokémon.',
  },
  {
    kind: 'pokemon', id: 'snorlax', name: 'Snorlax', types: ['normal'], role: 'tanque', cost: 6, count: 1,
    hp: 3000, damage: 190, hitSpeed: 1.8, speed: 0.6, range: 1.0, sight: 5.5, radius: 0.9, mass: 10,
    locomotion: 'tierra', targets: 'tierra', attack: { kind: 'cuerpo', splashRadius: 1.2 }, deployTime: 1,
    description: 'Muro lento que aplasta a los enemigos terrestres cercanos con cada golpe.',
  },
  {
    kind: 'pokemon', id: 'pikachu', name: 'Pikachu', types: ['electrico'], role: 'rapido', cost: 3, count: 1,
    hp: 520, damage: 80, hitSpeed: 0.9, speed: 1.8, range: 3, sight: 5.5, radius: 0.45, mass: 2,
    locomotion: 'tierra', targets: 'aire_y_tierra', attack: { kind: 'proyectil', projectileSpeed: 14 }, deployTime: 1,
    ability: { kind: 'cadena', jumps: 2, radius: 2.5, falloff: 0.6 },
    description: 'Muy rápido. Sus descargas saltan a dos enemigos cercanos.',
  },
  {
    kind: 'pokemon', id: 'charmeleon', name: 'Charmeleon', types: ['fuego'], role: 'antigrupo', cost: 4, count: 1,
    hp: 900, damage: 125, hitSpeed: 1.6, speed: 1.0, range: 2, sight: 5.5, radius: 0.55, mass: 4,
    locomotion: 'tierra', targets: 'tierra', attack: { kind: 'proyectil', projectileSpeed: 9, splashRadius: 1.4 }, deployTime: 1,
    description: 'Llamarada de corto alcance que quema a grupos de enemigos terrestres.',
  },
  {
    kind: 'pokemon', id: 'squirtle', name: 'Squirtle', types: ['agua'], role: 'distancia', cost: 3, count: 1,
    hp: 480, damage: 95, hitSpeed: 1.2, speed: 1.0, range: 5, sight: 6, radius: 0.45, mass: 2,
    locomotion: 'tierra', targets: 'aire_y_tierra', attack: { kind: 'proyectil', projectileSpeed: 9 }, deployTime: 1,
    description: 'Pistola Agua de largo alcance. Frágil, pero alcanza también a voladores.',
  },
  {
    kind: 'pokemon', id: 'bulbasaur', name: 'Bulbasaur', types: ['planta', 'veneno'], role: 'apoyo', cost: 4, count: 1,
    hp: 950, damage: 60, hitSpeed: 1.4, speed: 1.0, range: 4, sight: 5.5, radius: 0.55, mass: 4,
    locomotion: 'tierra', targets: 'aire_y_tierra', attack: { kind: 'proyectil', projectileSpeed: 10 }, deployTime: 1,
    ability: { kind: 'aura_curativa', radius: 3, amount: 70, interval: 2 },
    description: 'Cura periódicamente a los aliados cercanos. Mantiene vivas las ofensivas largas.',
  },
  {
    kind: 'pokemon', id: 'machop', name: 'Machop', types: ['lucha'], role: 'rapido', cost: 3, count: 3,
    hp: 340, damage: 75, hitSpeed: 1.0, speed: 1.4, range: 0.6, sight: 5.5, radius: 0.42, mass: 2,
    locomotion: 'tierra', targets: 'tierra', attack: { kind: 'cuerpo' }, deployTime: 1,
    description: 'Trío de luchadores. Mucho daño combinado, pero vulnerables al daño en área.',
  },
  {
    kind: 'pokemon', id: 'pidgeotto', name: 'Pidgeotto', types: ['normal', 'volador'], role: 'rapido', cost: 3, count: 1,
    hp: 620, damage: 100, hitSpeed: 1.1, speed: 1.6, range: 1.2, sight: 6, radius: 0.5, mass: 2,
    locomotion: 'aire', targets: 'aire_y_tierra', attack: { kind: 'cuerpo' }, deployTime: 1,
    description: 'Vuela por encima del río y de las tropas terrestres. Solo lo alcanzan atacantes antiaéreos.',
  },
  {
    kind: 'pokemon', id: 'geodude', name: 'Geodude', types: ['roca', 'tierra'], role: 'asedio', cost: 2, count: 1,
    hp: 480, damage: 50, hitSpeed: 1.2, speed: 1.4, range: 0.6, sight: 6, radius: 0.45, mass: 3,
    locomotion: 'tierra', targets: 'edificios', attack: { kind: 'cuerpo' }, deployTime: 1,
    ability: { kind: 'autodestruccion', radius: 2, damage: 260, element: 'roca', towerFactor: 0.6 },
    description: 'Corre hacia las torres. Al caer, explota y daña todo lo que tenga cerca.',
  },
  {
    kind: 'pokemon', id: 'jigglypuff', name: 'Jigglypuff', types: ['normal', 'hada'], role: 'apoyo', cost: 3, count: 1,
    hp: 680, damage: 55, hitSpeed: 1.5, speed: 1.0, range: 3.5, sight: 5.5, radius: 0.5, mass: 3,
    locomotion: 'tierra', targets: 'aire_y_tierra', attack: { kind: 'proyectil', projectileSpeed: 9 }, deployTime: 1,
    ability: { kind: 'canto', radius: 2.5, duration: 1.5, interval: 5 },
    description: 'Su Canto duerme a los enemigos cercanos durante un instante.',
  },
  {
    kind: 'pokemon', id: 'charizard', name: 'Charizard', types: ['fuego', 'volador'], role: 'area', cost: 5, count: 1,
    hp: 1050, damage: 140, hitSpeed: 1.8, speed: 1.2, range: 3, sight: 6, radius: 0.7, mass: 5,
    locomotion: 'aire', targets: 'aire_y_tierra', attack: { kind: 'proyectil', projectileSpeed: 10, splashRadius: 1.5 }, deployTime: 1,
    description: 'Dragón volador con Lanzallamas en área. Caro, pero domina el aire y el suelo.',
  },
];

const SPELLS: SpellCard[] = [
  {
    kind: 'hechizo', id: 'rayo', name: 'Rayo', types: ['electrico'], role: 'hechizo', cost: 3,
    radius: 2.5, damage: 300, towerDamageFactor: 0.35, delay: 0.4,
    effect: { kind: 'aturdir', duration: 0.5 },
    description: 'Descarga instantánea en área que aturde brevemente. Daño reducido a torres.',
  },
  {
    kind: 'hechizo', id: 'ventisca', name: 'Ventisca', types: ['hielo'], role: 'hechizo', cost: 4,
    radius: 3, damage: 170, towerDamageFactor: 0.4, delay: 0.6,
    effect: { kind: 'ralentizar', factor: 0.4, duration: 4 },
    description: 'Tormenta helada en una zona amplia que ralentiza movimiento y ataques.',
  },
];

export const CARDS: Readonly<Record<string, Card>> = Object.freeze(
  Object.fromEntries([...POKEMON, ...SPELLS].map((c) => [c.id, c])),
);

export const CARD_IDS: readonly string[] = Object.keys(CARDS);

export function getCard(id: string): Card {
  const c = CARDS[id];
  if (!c) throw new Error(`Carta desconocida: ${id}`);
  return c;
}

/** Elemento con el que ataca un Pokémon. */
export function attackElement(card: PokemonCard): Element {
  return card.attack.element ?? card.types[0];
}

export const ROLE_NAMES: Record<Role, string> = {
  tanque: 'Tanque',
  rapido: 'Rápido',
  distancia: 'Distancia',
  apoyo: 'Apoyo',
  antigrupo: 'Antigrupo',
  area: 'Área',
  asedio: 'Asedio',
  hechizo: 'Hechizo',
};

export const DEFAULT_PLAYER_DECK = ['onix', 'pikachu', 'charmeleon', 'squirtle', 'bulbasaur', 'machop', 'pidgeotto', 'rayo'];
export const DEFAULT_RIVAL_DECK = ['snorlax', 'charizard', 'geodude', 'jigglypuff', 'squirtle', 'pikachu', 'machop', 'ventisca'];
