/**
 * Sistema elemental de Pokémon Arena.
 *
 * Las relaciones (quién es eficaz contra quién) siguen la tabla de tipos de los juegos
 * principales de Pokémon para los 15 tipos usados. Los MULTIPLICADORES son una decisión
 * de diseño propia: en un juego en tiempo real un x2 / x0 resulta demasiado extremo,
 * así que se atenúan (ver docs/diseno_juego.md, "Sistema elemental").
 */
export const ELEMENTS = [
  'normal',
  'fuego',
  'agua',
  'planta',
  'electrico',
  'hielo',
  'lucha',
  'veneno',
  'tierra',
  'volador',
  'psiquico',
  'roca',
  'fantasma',
  'dragon',
  'hada',
  'acero',
] as const;

export type Element = (typeof ELEMENTS)[number];

/** Multiplicadores de diseño. */
export const EFFECTIVENESS = {
  eficaz: 1.5,
  neutro: 1,
  poco_eficaz: 0.7,
  casi_inmune: 0.4,
} as const;

/** Límites del producto para atacantes contra defensores de doble tipo. */
export const MULTIPLIER_MIN = 0.25;
export const MULTIPLIER_MAX = 2.25;

type Relation = { eficaz?: Element[]; poco_eficaz?: Element[]; casi_inmune?: Element[] };

/** Atacante -> relaciones con tipos defensores. Lo que no aparece es neutro. */
export const TYPE_CHART: Record<Element, Relation> = {
  normal: { poco_eficaz: ['roca', 'acero'], casi_inmune: ['fantasma'] },
  fuego: { eficaz: ['planta', 'hielo', 'acero'], poco_eficaz: ['fuego', 'agua', 'roca', 'dragon'] },
  agua: { eficaz: ['fuego', 'tierra', 'roca'], poco_eficaz: ['agua', 'planta', 'dragon'] },
  planta: {
    eficaz: ['agua', 'tierra', 'roca'],
    poco_eficaz: ['fuego', 'planta', 'veneno', 'volador', 'dragon', 'acero'],
  },
  electrico: {
    eficaz: ['agua', 'volador'],
    poco_eficaz: ['planta', 'electrico', 'dragon'],
    casi_inmune: ['tierra'],
  },
  hielo: { eficaz: ['planta', 'tierra', 'volador', 'dragon'], poco_eficaz: ['fuego', 'agua', 'hielo', 'acero'] },
  lucha: {
    eficaz: ['normal', 'hielo', 'roca', 'acero'],
    poco_eficaz: ['veneno', 'volador', 'psiquico', 'hada'],
    casi_inmune: ['fantasma'],
  },
  veneno: { eficaz: ['planta', 'hada'], poco_eficaz: ['veneno', 'tierra', 'roca', 'fantasma'], casi_inmune: ['acero'] },
  tierra: {
    eficaz: ['fuego', 'electrico', 'veneno', 'roca', 'acero'],
    poco_eficaz: ['planta'],
    casi_inmune: ['volador'],
  },
  volador: { eficaz: ['planta', 'lucha'], poco_eficaz: ['electrico', 'roca', 'acero'] },
  psiquico: { eficaz: ['lucha', 'veneno'], poco_eficaz: ['psiquico', 'acero'] },
  roca: { eficaz: ['fuego', 'hielo', 'volador'], poco_eficaz: ['lucha', 'tierra', 'acero'] },
  fantasma: { eficaz: ['psiquico', 'fantasma'], casi_inmune: ['normal'] },
  dragon: { eficaz: ['dragon'], poco_eficaz: ['acero'], casi_inmune: ['hada'] },
  hada: { eficaz: ['lucha', 'dragon'], poco_eficaz: ['fuego', 'veneno', 'acero'] },
  acero: { eficaz: ['hielo', 'roca', 'hada'], poco_eficaz: ['fuego', 'agua', 'electrico', 'acero'] },
};

/** Multiplicador de un tipo atacante contra UN tipo defensor. */
export function singleMultiplier(attack: Element, defend: Element): number {
  const rel = TYPE_CHART[attack];
  if (rel.eficaz?.includes(defend)) return EFFECTIVENESS.eficaz;
  if (rel.casi_inmune?.includes(defend)) return EFFECTIVENESS.casi_inmune;
  if (rel.poco_eficaz?.includes(defend)) return EFFECTIVENESS.poco_eficaz;
  return EFFECTIVENESS.neutro;
}

/**
 * Multiplicador contra un defensor con 0, 1 o 2 tipos.
 * Sin tipos (torres) => 1. Con dos tipos se multiplican y se acota a [MIN, MAX].
 */
export function typeMultiplier(attack: Element | null, defenderTypes: readonly Element[]): number {
  if (!attack || defenderTypes.length === 0) return 1;
  let m = 1;
  for (const t of defenderTypes) m *= singleMultiplier(attack, t);
  m = Math.min(MULTIPLIER_MAX, Math.max(MULTIPLIER_MIN, m));
  return Math.round(m * 1000) / 1000;
}

export type EffectivenessLabel = 'eficaz' | 'neutro' | 'poco_eficaz';

export function effectivenessLabel(multiplier: number): EffectivenessLabel {
  if (multiplier > 1.0001) return 'eficaz';
  if (multiplier < 0.9999) return 'poco_eficaz';
  return 'neutro';
}

export const ELEMENT_NAMES: Record<Element, string> = {
  normal: 'Normal',
  fuego: 'Fuego',
  agua: 'Agua',
  planta: 'Planta',
  electrico: 'Eléctrico',
  hielo: 'Hielo',
  lucha: 'Lucha',
  veneno: 'Veneno',
  tierra: 'Tierra',
  volador: 'Volador',
  psiquico: 'Psíquico',
  roca: 'Roca',
  fantasma: 'Fantasma',
  dragon: 'Dragón',
  hada: 'Hada',
  acero: 'Acero',
};

/** Colores de interfaz por tipo (paleta propia). */
export const ELEMENT_COLORS: Record<Element, number> = {
  normal: 0xb8b39a,
  fuego: 0xf2782f,
  agua: 0x4f8ff0,
  planta: 0x5cbf4a,
  electrico: 0xf7cf2e,
  hielo: 0x8fdcdc,
  lucha: 0xc23b2f,
  veneno: 0xa04aa8,
  tierra: 0xd9b45a,
  volador: 0x9fa8f0,
  psiquico: 0xf55a8a,
  roca: 0xb59f45,
  fantasma: 0x6f5a9c,
  dragon: 0x6f38f2,
  hada: 0xf0a6c8,
  acero: 0x9fb1c2,
};
