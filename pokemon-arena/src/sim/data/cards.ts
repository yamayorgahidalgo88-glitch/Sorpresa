import type { Element } from './elements';

/**
 * Catálogo de cartas: TODA la configuración de estadísticas vive aquí.
 * Velocidades en casillas/segundo, alcances y radios en casillas, tiempos en segundos.
 * Las cifras son de diseño propio (no proceden de datos internos de ningún juego).
 */

export type Stage = 1 | 2 | 3;

export type Role = 'tanque' | 'rapido' | 'distancia' | 'apoyo' | 'antigrupo' | 'area' | 'asedio' | 'edificio' | 'hechizo';
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
  | { kind: 'ralentizar'; factor: number; duration: number }
  /** Aparece con un escudo que absorbe `amount` de daño antes de perder salud. */
  | { kind: 'escudo'; amount: number }
  /** Ditto: se transforma en la última carta jugada por su equipo; cuesta lo mismo + `extraCost`. */
  | { kind: 'transformacion'; extraCost: number }
  /** Edificio que genera `amount` de energía cada `interval` segundos mientras sigue en pie. */
  | { kind: 'recolector'; interval: number; amount: number };

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
  /** Edificio: no se mueve, distrae a las tropas y pierde toda su salud en `lifetime` segundos. */
  building?: { lifetime: number };
  description: string;
  /** Línea evolutiva (id de su primera fase) y fase dentro de ella (1, 2 o 3). */
  line: string;
  stage: Stage;
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
  /** Curación a los aliados de la zona (en lugar de daño). */
  heal?: number;
  /** Zona persistente: `pulses` golpes de `damage`, uno cada `interval` segundos. */
  dot?: { pulses: number; interval: number };
  description: string;
  /** Los hechizos también tienen "línea": su nivel 1, 2 o 3. */
  line: string;
  stage: Stage;
}

export type Card = PokemonCard | SpellCard;

type BaseFields = 'line' | 'stage';

/**
 * Primeras fases (y Snorlax, que no evoluciona). Las cifras son de diseño propio; las fases
 * siguientes se derivan de estas con STAGE_MULTIPLIER para que la mejora sea moderada y el
 * equilibrio, controlable.
 */
const BASE_POKEMON: Omit<PokemonCard, BaseFields>[] = [
  {
    kind: 'pokemon', id: 'onix', name: 'Onix', types: ['roca', 'tierra'], role: 'tanque', cost: 5, count: 1,
    hp: 3450, damage: 150, hitSpeed: 1.5, speed: 0.8, range: 0.8, sight: 7, radius: 0.8, mass: 8,
    locomotion: 'tierra', targets: 'edificios', attack: { kind: 'cuerpo' }, deployTime: 1,
    description: 'Tanque enorme que solo ataca torres. Ideal para abrir camino a otros Pokémon.',
  },
  {
    kind: 'pokemon', id: 'snorlax', name: 'Snorlax', types: ['normal'], role: 'tanque', cost: 6, count: 1,
    hp: 3000, damage: 190, hitSpeed: 1.8, speed: 0.6, range: 1.0, sight: 5.5, radius: 0.9, mass: 10,
    locomotion: 'tierra', targets: 'tierra', attack: { kind: 'cuerpo', splashRadius: 1.2 }, deployTime: 1,
    description: 'Muro lento que aplasta a los enemigos terrestres cercanos con cada golpe. No evoluciona.',
  },
  {
    kind: 'pokemon', id: 'pikachu', name: 'Pikachu', types: ['electrico'], role: 'rapido', cost: 3, count: 1,
    hp: 480, damage: 70, hitSpeed: 0.9, speed: 1.8, range: 3, sight: 5.5, radius: 0.45, mass: 2,
    locomotion: 'tierra', targets: 'aire_y_tierra', attack: { kind: 'proyectil', projectileSpeed: 14 }, deployTime: 1,
    ability: { kind: 'cadena', jumps: 2, radius: 2.5, falloff: 0.5 },
    description: 'Muy rápido. Sus descargas saltan a dos enemigos cercanos.',
  },
  {
    kind: 'pokemon', id: 'charmander', name: 'Charmander', types: ['fuego'], role: 'antigrupo', cost: 4, count: 1,
    hp: 950, damage: 125, hitSpeed: 1.5, speed: 1.0, range: 2, sight: 5.5, radius: 0.5, mass: 4,
    locomotion: 'tierra', targets: 'tierra', attack: { kind: 'proyectil', projectileSpeed: 9, splashRadius: 1.4 }, deployTime: 1,
    description: 'Ascuas de corto alcance que queman a grupos de enemigos terrestres.',
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
    ability: { kind: 'aura_curativa', radius: 3, amount: 60, interval: 2 },
    description: 'Cura periódicamente a los aliados cercanos. Mantiene vivas las ofensivas largas.',
  },
  {
    kind: 'pokemon', id: 'machop', name: 'Machop', types: ['lucha'], role: 'rapido', cost: 3, count: 3,
    hp: 340, damage: 75, hitSpeed: 1.0, speed: 1.4, range: 0.6, sight: 5.5, radius: 0.42, mass: 2,
    locomotion: 'tierra', targets: 'tierra', attack: { kind: 'cuerpo' }, deployTime: 1,
    description: 'Trío de luchadores. Mucho daño combinado, pero vulnerables al daño en área.',
  },
  {
    kind: 'pokemon', id: 'pidgey', name: 'Pidgey', types: ['normal', 'volador'], role: 'rapido', cost: 3, count: 1,
    hp: 620, damage: 100, hitSpeed: 1.1, speed: 1.6, range: 1.2, sight: 6, radius: 0.45, mass: 2,
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
    hp: 760, damage: 60, hitSpeed: 1.5, speed: 1.0, range: 3.5, sight: 5.5, radius: 0.5, mass: 3,
    locomotion: 'tierra', targets: 'aire_y_tierra', attack: { kind: 'proyectil', projectileSpeed: 9 }, deployTime: 1,
    ability: { kind: 'canto', radius: 2.5, duration: 1.5, interval: 5 },
    description: 'Su Canto duerme a los enemigos cercanos durante un instante.',
  },
  {
    kind: 'pokemon', id: 'ditto', name: 'Ditto', types: ['normal'], role: 'apoyo', cost: 1, count: 1,
    hp: 400, damage: 40, hitSpeed: 1.2, speed: 1.0, range: 0.6, sight: 5, radius: 0.45, mass: 2,
    locomotion: 'tierra', targets: 'tierra', attack: { kind: 'cuerpo' }, deployTime: 1,
    ability: { kind: 'transformacion', extraCost: 1 },
    description: 'Se transforma en la última carta que jugaste (Pokémon o hechizo, en tu misma fase) y cuesta 1 de energía más que ella.',
  },
  {
    kind: 'pokemon', id: 'magnemite', name: 'Magnemite', types: ['electrico', 'acero'], role: 'edificio', cost: 4, count: 1,
    hp: 950, damage: 85, hitSpeed: 0.9, speed: 0, range: 5.5, sight: 5.5, radius: 0.55, mass: 1000,
    locomotion: 'tierra', targets: 'aire_y_tierra', attack: { kind: 'proyectil', projectileSpeed: 14 }, deployTime: 1,
    building: { lifetime: 35 },
    description: 'Torreta flotante: dispara descargas a lo que se acerque (aire y tierra) y atrae a las tropas que van a por edificios.',
  },
  {
    kind: 'pokemon', id: 'voltorb', name: 'Voltorb', types: ['electrico'], role: 'edificio', cost: 4, count: 1,
    hp: 1100, damage: 120, hitSpeed: 1.4, speed: 0, range: 4, sight: 4, radius: 0.55, mass: 1000,
    locomotion: 'tierra', targets: 'tierra', attack: { kind: 'proyectil', projectileSpeed: 9, splashRadius: 1.2 }, deployTime: 1,
    building: { lifetime: 30 },
    ability: { kind: 'autodestruccion', radius: 2.5, damage: 200, element: 'electrico', towerFactor: 0.5 },
    description: 'Bomba defensiva: lanza chispas en área a las tropas de tierra y explota al ser destruida.',
  },
  {
    kind: 'pokemon', id: 'chansey', name: 'Chansey', types: ['normal'], role: 'edificio', cost: 5, count: 1,
    hp: 1000, damage: 0, hitSpeed: 1, speed: 0, range: 0, sight: 0, radius: 0.6, mass: 1000,
    locomotion: 'tierra', targets: 'tierra', attack: { kind: 'cuerpo' }, deployTime: 1,
    building: { lifetime: 70 },
    ability: { kind: 'recolector', interval: 8, amount: 1 },
    description: 'Pone un huevo de energía cada 8 s mientras sigue en pie (unos 8 en total). No ataca.',
  },
  {
    kind: 'pokemon', id: 'rattata', name: 'Rattata', types: ['normal'], role: 'rapido', cost: 2, count: 5,
    hp: 130, damage: 50, hitSpeed: 1.0, speed: 1.7, range: 0.5, sight: 5, radius: 0.32, mass: 1,
    locomotion: 'tierra', targets: 'tierra', attack: { kind: 'cuerpo' }, deployTime: 1,
    description: 'Enjambre de cinco: barato y rápido, rodea a los enemigos grandes, pero cae ante el daño en área.',
  },
  {
    kind: 'pokemon', id: 'zubat', name: 'Zubat', types: ['veneno', 'volador'], role: 'rapido', cost: 2, count: 4,
    hp: 85, damage: 45, hitSpeed: 1.1, speed: 1.9, range: 0.5, sight: 5.5, radius: 0.3, mass: 1,
    locomotion: 'aire', targets: 'aire_y_tierra', attack: { kind: 'cuerpo' }, deployTime: 1,
    description: 'Bandada de cuatro murciélagos voladores muy rápidos y frágiles.',
  },
  {
    kind: 'pokemon', id: 'gastly', name: 'Gastly', types: ['fantasma', 'veneno'], role: 'distancia', cost: 3, count: 1,
    hp: 430, damage: 70, hitSpeed: 1.1, speed: 1.4, range: 3.5, sight: 6, radius: 0.45, mass: 1,
    locomotion: 'aire', targets: 'aire_y_tierra', attack: { kind: 'proyectil', projectileSpeed: 10 }, deployTime: 1,
    ability: { kind: 'ralentizar', factor: 0.35, duration: 1.5 },
    description: 'Gas flotante: su Lengüetazo ralentiza a quien toca. Los ataques de tipo Normal apenas le afectan.',
  },
  {
    kind: 'pokemon', id: 'abra', name: 'Abra', types: ['psiquico'], role: 'distancia', cost: 4, count: 1,
    hp: 560, damage: 115, hitSpeed: 1.5, speed: 1.0, range: 5, sight: 6.5, radius: 0.45, mass: 2,
    locomotion: 'tierra', targets: 'aire_y_tierra', attack: { kind: 'proyectil', projectileSpeed: 11 }, deployTime: 1,
    ability: { kind: 'escudo', amount: 240 },
    description: 'Aparece protegido por una Barrera psíquica que absorbe daño. Ataca desde muy lejos.',
  },
  {
    kind: 'pokemon', id: 'dratini', name: 'Dratini', types: ['dragon'], role: 'tanque', cost: 4, count: 1,
    hp: 1250, damage: 120, hitSpeed: 1.4, speed: 1.0, range: 1.0, sight: 5.5, radius: 0.55, mass: 5,
    locomotion: 'tierra', targets: 'tierra', attack: { kind: 'cuerpo', splashRadius: 0.9 }, deployTime: 1,
    description: 'Dragón resistente que barre con la cola a los enemigos de su alrededor.',
  },
];

type Evo = Pick<PokemonCard, 'id' | 'name'> & Partial<Omit<PokemonCard, 'kind' | 'id' | 'name' | BaseFields>>;

/** Fases 2 y 3 de cada línea (en orden). Solo se indica lo que cambia además de las estadísticas. */
const EVOLUTIONS: Record<string, Evo[]> = {
  charmander: [
    { id: 'charmeleon', name: 'Charmeleon', radius: 0.55, description: 'Lanzallamas de corto alcance que quema a grupos de enemigos terrestres.' },
    {
      id: 'charizard', name: 'Charizard', types: ['fuego', 'volador'], role: 'area', radius: 0.7, locomotion: 'aire', targets: 'aire_y_tierra',
      range: 3, attack: { kind: 'proyectil', projectileSpeed: 10, splashRadius: 1.5 },
      description: 'Dragón volador con Lanzallamas en área. Domina el aire y el suelo.',
    },
  ],
  squirtle: [
    { id: 'wartortle', name: 'Wartortle', radius: 0.5, description: 'Hidropulso de largo alcance. Más resistente que Squirtle.' },
    { id: 'blastoise', name: 'Blastoise', radius: 0.65, mass: 5, description: 'Sus cañones disparan Hidrobomba desde muy lejos.' },
  ],
  bulbasaur: [
    { id: 'ivysaur', name: 'Ivysaur', radius: 0.6, description: 'El capullo de su lomo cura a los aliados cercanos.' },
    { id: 'venusaur', name: 'Venusaur', radius: 0.75, mass: 6, description: 'La flor de su lomo cura a los aliados cercanos con más fuerza.' },
  ],
  pikachu: [{ id: 'raichu', name: 'Raichu', radius: 0.5, description: 'Descargas más potentes que saltan a dos enemigos cercanos.' }],
  machop: [
    { id: 'machoke', name: 'Machoke', radius: 0.47, description: 'Trío de luchadores con cinturón de campeón. Mucho daño combinado.' },
    { id: 'machamp', name: 'Machamp', radius: 0.52, description: 'Trío de cuatro brazos: golpes rapidísimos.' },
  ],
  pidgey: [
    { id: 'pidgeotto', name: 'Pidgeotto', radius: 0.5, description: 'Ataca en picado desde el aire, por encima del río.' },
    { id: 'pidgeot', name: 'Pidgeot', radius: 0.6, description: 'Ave majestuosa y veloz que ataca en picado.' },
  ],
  geodude: [
    { id: 'graveler', name: 'Graveler', radius: 0.5, description: 'Rueda hacia las torres y explota al caer.' },
    { id: 'golem', name: 'Golem', radius: 0.55, mass: 4, description: 'Roca blindada que explota al caer con gran potencia.' },
  ],
  jigglypuff: [{ id: 'wigglytuff', name: 'Wigglytuff', radius: 0.55, description: 'Su Canto duerme a los enemigos cercanos.' }],
  onix: [{ id: 'steelix', name: 'Steelix', types: ['acero', 'tierra'], description: 'Serpiente de acero que solo ataca torres. Muy difícil de derribar.' }],
  gastly: [
    { id: 'haunter', name: 'Haunter', radius: 0.5, description: 'Sus manos fantasmales ralentizan a quien tocan.' },
    { id: 'gengar', name: 'Gengar', radius: 0.55, mass: 2, description: 'Bola Sombra que ralentiza. Los ataques de tipo Normal apenas le afectan.' },
  ],
  abra: [
    { id: 'kadabra', name: 'Kadabra', radius: 0.5, description: 'Su Barrera psíquica absorbe daño. Ataca con su cuchara desde lejos.' },
    { id: 'alakazam', name: 'Alakazam', radius: 0.55, description: 'Psíquico supremo: Barrera fuerte y ataques de muy largo alcance.' },
  ],
  magnemite: [{ id: 'magneton', name: 'Magneton', radius: 0.7, description: 'Tres Magnemite unidos: torreta eléctrica más resistente y potente.' }],
  voltorb: [{ id: 'electrode', name: 'Electrode', radius: 0.62, description: 'Bomba defensiva más potente que explota al ser destruida.' }],
  chansey: [{ id: 'blissey', name: 'Blissey', radius: 0.65, description: 'Recolectora de energía mucho más resistente.' }],
  rattata: [{ id: 'raticate', name: 'Raticate', radius: 0.38, description: 'Enjambre de cinco con colmillos más duros.' }],
  zubat: [
    { id: 'golbat', name: 'Golbat', radius: 0.36, description: 'Bandada de cuatro, más resistente.' },
    { id: 'crobat', name: 'Crobat', radius: 0.38, description: 'Bandada de cuatro, la más veloz.' },
  ],
  dratini: [
    { id: 'dragonair', name: 'Dragonair', radius: 0.6, description: 'Dragón sereno que barre con la cola a su alrededor.' },
    {
      id: 'dragonite', name: 'Dragonite', types: ['dragon', 'volador'], radius: 0.75, mass: 7, locomotion: 'aire', targets: 'aire_y_tierra',
      description: 'Dragón volador muy resistente que golpea a todo lo que le rodea.',
    },
  ],
};

/** Mejora de estadísticas por fase: notable pero moderada. */
export const STAGE_MULTIPLIER: Record<Stage, number> = { 1: 1, 2: 1.12, 3: 1.25 };

const scale = (v: number, stage: Stage) => Math.round(v * STAGE_MULTIPLIER[stage]);

function scaleAbility(a: Ability | undefined, stage: Stage): Ability | undefined {
  if (!a) return a;
  switch (a.kind) {
    case 'aura_curativa':
      return { ...a, amount: scale(a.amount, stage) };
    case 'autodestruccion':
      return { ...a, damage: scale(a.damage, stage) };
    case 'escudo':
      return { ...a, amount: scale(a.amount, stage) };
    default:
      return a;
  }
}

function buildLine(base: Omit<PokemonCard, BaseFields>): PokemonCard[] {
  const first: PokemonCard = { ...base, line: base.id, stage: 1 };
  const out = [first];
  (EVOLUTIONS[base.id] ?? []).forEach((evo, i) => {
    const stage = (i + 2) as Stage;
    out.push({
      ...first,
      hp: scale(base.hp, stage),
      damage: scale(base.damage, stage),
      ability: scaleAbility(base.ability, stage),
      ...evo,
      line: base.id,
      stage,
    });
  });
  return out;
}

const BASE_SPELLS: Omit<SpellCard, BaseFields>[] = [
  {
    kind: 'hechizo', id: 'rayo', name: 'Rayo', types: ['electrico'], role: 'hechizo', cost: 3,
    radius: 2.5, damage: 320, towerDamageFactor: 0.35, delay: 0.4,
    effect: { kind: 'aturdir', duration: 0.5 },
    description: 'Descarga instantánea en área que aturde brevemente. Daño reducido a torres.',
  },
  {
    kind: 'hechizo', id: 'pocion', name: 'Poción', types: ['normal'], role: 'hechizo', cost: 2,
    radius: 2.8, damage: 0, heal: 260, towerDamageFactor: 0, delay: 0.3,
    description: 'Cura al instante a tus Pokémon de la zona.',
  },
  {
    kind: 'hechizo', id: 'toxico', name: 'Tóxico', types: ['veneno'], role: 'hechizo', cost: 4,
    radius: 3, damage: 50, dot: { pulses: 8, interval: 1 }, towerDamageFactor: 0.35, delay: 0.4,
    effect: { kind: 'ralentizar', factor: 0.15, duration: 1.2 },
    description: 'Nube venenosa que daña y frena un poco a los enemigos de la zona durante 8 s (400 de daño en total).',
  },
  {
    kind: 'hechizo', id: 'ventisca', name: 'Ventisca', types: ['hielo'], role: 'hechizo', cost: 4,
    radius: 3, damage: 190, towerDamageFactor: 0.4, delay: 0.6,
    effect: { kind: 'ralentizar', factor: 0.4, duration: 4 },
    description: 'Tormenta helada en una zona amplia que ralentiza movimiento y ataques.',
  },
];

/** Hechizos de nivel 1 a 3: más daño en cada nivel; el resto no cambia. */
function buildSpell(base: Omit<SpellCard, BaseFields>): SpellCard[] {
  return ([1, 2, 3] as Stage[]).map((stage) => ({
    ...base,
    id: stage === 1 ? base.id : `${base.id}_${stage}`,
    name: stage === 1 ? base.name : `${base.name} Nv. ${stage}`,
    damage: scale(base.damage, stage),
    heal: base.heal ? scale(base.heal, stage) : undefined,
    line: base.id,
    stage,
  }));
}

const POKEMON: PokemonCard[] = BASE_POKEMON.flatMap(buildLine);
const SPELLS: SpellCard[] = BASE_SPELLS.flatMap(buildSpell);

export const CARDS: Readonly<Record<string, Card>> = Object.freeze(
  Object.fromEntries([...POKEMON, ...SPELLS].map((c) => [c.id, c])),
);

export const CARD_IDS: readonly string[] = Object.keys(CARDS);

/** Líneas (cartas coleccionables): el id de su primera fase, en orden de catálogo. */
export const LINES: readonly string[] = [...BASE_POKEMON.map((c) => c.id), ...BASE_SPELLS.map((c) => c.id)];

export function getCard(id: string): Card {
  const c = CARDS[id];
  if (!c) throw new Error(`Carta desconocida: ${id}`);
  return c;
}

/** Carta de una línea en una fase concreta (se limita a la última fase que exista). */
export function cardAtStage(line: string, stage: number): Card {
  const all = CARD_IDS.map((id) => CARDS[id]).filter((c) => c.line === line);
  if (all.length === 0) throw new Error(`Línea desconocida: ${line}`);
  const s = Math.max(1, Math.min(stage, maxStage(line)));
  return all.find((c) => c.stage === s)!;
}

/** Última fase de una línea (Snorlax: 1; Pikachu: 2; Charmander: 3; hechizos: 3). */
export function maxStage(line: string): Stage {
  let m: Stage = 1;
  for (const id of CARD_IDS) if (CARDS[id].line === line && CARDS[id].stage > m) m = CARDS[id].stage;
  return m;
}

/** ¿Es una carta que copia a otra (Ditto)? */
export function isTransform(card: Card): card is PokemonCard & { ability: { kind: 'transformacion'; extraCost: number } } {
  return card.kind === 'pokemon' && card.ability?.kind === 'transformacion';
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
  edificio: 'Edificio',
  hechizo: 'Hechizo',
};

/** Cartas con las que empieza el jugador (9): elige 8 para su mazo. */
export const STARTER_LINES: readonly string[] = ['onix', 'pikachu', 'charmander', 'squirtle', 'bulbasaur', 'machop', 'pidgey', 'geodude', 'rayo'];
export const DEFAULT_PLAYER_DECK = ['onix', 'pikachu', 'charmander', 'squirtle', 'bulbasaur', 'machop', 'pidgey', 'rayo'];
export const DEFAULT_RIVAL_DECK = ['snorlax', 'charmander', 'geodude', 'jigglypuff', 'squirtle', 'pikachu', 'machop', 'ventisca'];
