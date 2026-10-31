// Catálogo de cortes, reglas por forma de cara y pictogramas en semitono.
// Las puntuaciones (0–3) siguen las pautas habituales de asesoría de imagen masculina:
// alargar lo redondo, suavizar lo anguloso y no estirar más lo que ya es largo.

export const SHAPES = {
  ovalada: {
    name: 'Ovalada',
    rule: 'Proporciones equilibradas: casi todo te funciona, así que manda tu estilo.',
  },
  redonda: {
    name: 'Redonda',
    rule: 'Ancho y largo parecidos: busca altura arriba y laterales cortos para estirar la cara.',
  },
  cuadrada: {
    name: 'Cuadrada',
    rule: 'Mandíbula marcada y ancha: los cortes limpios la lucen; evita volúmenes cuadrados.',
  },
  alargada: {
    name: 'Alargada',
    rule: 'Cara más larga que ancha: evita la altura arriba; flequillo y algo de volumen lateral.',
  },
  corazon: {
    name: 'Corazón',
    rule: 'Frente ancha y barbilla estrecha: flequillo y largo medio para equilibrar.',
  },
  diamante: {
    name: 'Diamante',
    rule: 'Pómulos lo más ancho de la cara: textura y flequillo para suavizar frente y barbilla.',
  },
};

export const CUTS = [
  {
    id: 'crop-alto',
    name: 'Crop texturizado',
    detail: 'con degradado alto',
    fade: 'high', top: 'crop', length: 'corto',
    scores: { ovalada: 3, redonda: 2, cuadrada: 3, alargada: 1, corazon: 1, diamante: 2 },
    why: 'Textura arriba y laterales a piel desde muy alto.',
  },
  {
    id: 'french-crop',
    name: 'French crop',
    detail: 'con degradado bajo',
    fade: 'low', top: 'fringe', length: 'corto',
    scores: { ovalada: 3, redonda: 1, cuadrada: 2, alargada: 3, corazon: 3, diamante: 3 },
    why: 'Flequillo recto hacia delante que acorta la frente.',
  },
  {
    id: 'buzz',
    name: 'Buzz cut',
    detail: 'rapado al 1 o al 2',
    fade: 'none', top: 'buzz', length: 'corto',
    scores: { ovalada: 3, redonda: 0, cuadrada: 3, alargada: 1, corazon: 0, diamante: 1 },
    why: 'Todo al mismo largo: deja la forma de la cabeza a la vista.',
  },
  {
    id: 'tupe',
    name: 'Tupé',
    detail: 'con degradado medio',
    fade: 'mid', top: 'quiff', length: 'medio',
    scores: { ovalada: 3, redonda: 3, cuadrada: 2, alargada: 0, corazon: 1, diamante: 2 },
    why: 'Volumen hacia arriba y atrás: suma altura.',
  },
  {
    id: 'pompadour',
    name: 'Pompadour',
    detail: 'con laterales al degradado',
    fade: 'mid', top: 'pomp', length: 'medio',
    scores: { ovalada: 2, redonda: 3, cuadrada: 2, alargada: 0, corazon: 1, diamante: 1 },
    why: 'Mucha altura delante, laterales pegados.',
  },
  {
    id: 'raya-lado',
    name: 'Raya al lado',
    detail: 'clásica, a tijera',
    fade: 'none', top: 'part', length: 'medio',
    scores: { ovalada: 3, redonda: 2, cuadrada: 3, alargada: 2, corazon: 3, diamante: 2 },
    why: 'La raya rompe la simetría y suaviza los rasgos.',
  },
  {
    id: 'slick-back',
    name: 'Peinado atrás',
    detail: 'laterales a tijera',
    fade: 'none', top: 'slick', length: 'medio',
    scores: { ovalada: 3, redonda: 1, cuadrada: 2, alargada: 0, corazon: 1, diamante: 2 },
    why: 'Frente despejada y todo el pelo hacia atrás.',
  },
  {
    id: 'rizos-taper',
    name: 'Rizos con taper',
    detail: 'degradado bajo en patillas y nuca',
    fade: 'low', top: 'curls', length: 'medio',
    scores: { ovalada: 3, redonda: 1, cuadrada: 3, alargada: 2, corazon: 2, diamante: 3 },
    why: 'Volumen natural arriba, contorno limpio abajo.',
  },
  {
    id: 'mullet',
    name: 'Mullet moderno',
    detail: 'con degradado medio',
    fade: 'mid', top: 'mullet', length: 'largo',
    scores: { ovalada: 2, redonda: 1, cuadrada: 2, alargada: 2, corazon: 2, diamante: 2 },
    why: 'Corto delante y a los lados, largo en la nuca.',
  },
  {
    id: 'melena',
    name: 'Melena media',
    detail: 'raya al centro',
    fade: 'none', top: 'long', length: 'largo',
    scores: { ovalada: 2, redonda: 0, cuadrada: 2, alargada: 3, corazon: 3, diamante: 2 },
    why: 'Largo hasta la mandíbula: ensancha visualmente la parte baja.',
  },
  {
    id: 'crew',
    name: 'Crew cut',
    detail: 'con degradado bajo',
    fade: 'low', top: 'crew', length: 'corto',
    scores: { ovalada: 3, redonda: 2, cuadrada: 3, alargada: 1, corazon: 1, diamante: 2 },
    why: 'Corto y limpio, un poco más largo delante.',
  },
  {
    id: 'flequillo',
    name: 'Flequillo despeinado',
    detail: 'a tijera, sin degradado',
    fade: 'none', top: 'messy', length: 'medio',
    scores: { ovalada: 3, redonda: 1, cuadrada: 2, alargada: 3, corazon: 3, diamante: 3 },
    why: 'Mechones hacia la frente con textura.',
  },
];

export const LENGTH_LABEL = { corto: 'Corto', medio: 'Medio', largo: 'Largo' };

export function hasFade(cut) {
  return cut.fade !== 'none';
}

// ---------- Pictogramas ----------
// Cabeza frontal sin rasgos, tinta negra sobre cartulina. El degradado se dibuja
// como una trama de semitono: puntos que se encogen hasta desaparecer.

const INK = 'var(--ink)';

const FADE_BANDS = {
  // [y donde empiezan a encogerse los puntos, y donde ya no hay puntos]
  none: null,
  low: [70, 86],
  mid: [60, 80],
  high: [48, 68],
};

function halftoneSides(fade) {
  const dots = [];
  const band = FADE_BANDS[fade];
  const solidEnd = band ? band[0] : 84;
  const end = band ? band[1] : 84;
  // dos franjas laterales: izquierda x 25..35, derecha 85..95 (a la altura de sienes y orejas)
  for (let y = 44; y <= end; y += 3.2) {
    let r;
    if (y <= solidEnd) r = 1.9;
    else r = 1.9 * (1 - (y - solidEnd) / (end - solidEnd));
    if (r < 0.25) continue;
    const row = Math.round((y - 44) / 3.2);
    const offset = row % 2 ? 1.6 : 0;
    for (let x = 25 + offset; x <= 35; x += 3.2) {
      if (!insideSide(x, y, 'l')) continue;
      dots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}"/>`);
    }
    for (let x = 95 - offset; x >= 85; x -= 3.2) {
      if (!insideSide(x, y, 'r')) continue;
      dots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}"/>`);
    }
  }
  if (!band) {
    // sin degradado: lateral lleno con borde limpio, por encima de la oreja
    return `<path d="M24.5 50 Q25 66 29 80 L34 80 Q31 64 33 48 Z M95.5 50 Q95 66 91 80 L86 80 Q89 64 87 48 Z" fill="${INK}"/>`;
  }
  return `<g fill="${INK}">${dots.join('')}</g>`;
}

function insideSide(x, y, side) {
  // franja curva que sigue el cráneo
  const cx = 60, cy = 78, rx = 36, ry = 42;
  const inner = ((x - cx) ** 2) / ((rx - 9) ** 2) + ((y - cy) ** 2) / ((ry - 7) ** 2);
  const outer = ((x - cx) ** 2) / (rx ** 2) + ((y - cy) ** 2) / (ry ** 2);
  return outer <= 1.02 && inner >= 0.92 && (side === 'l' ? x < 40 : x > 80);
}

const TOPS = {
  buzz: `<path d="M27 64 Q26 38 60 34 Q94 38 93 64 Q90 46 60 41 Q30 46 27 64 Z" fill="${INK}"/>`,
  crop: `<path d="M28 60 Q26 30 60 27 Q94 30 92 60 Q88 50 84 49 L80 54 L76 48 L71 53 L66 47 L61 53 L56 47 L51 53 L46 48 L41 54 L37 49 Q31 51 28 60 Z" fill="${INK}"/>`,
  fringe: `<path d="M28 60 Q26 29 60 26 Q94 29 92 60 Q89 54 86 54 L34 54 Q31 54 28 60 Z" fill="${INK}"/><path d="M40 54 L42 46 M52 54 L53 45 M64 54 L64 45 M76 54 L75 46" stroke="var(--card)" stroke-width="1.6" fill="none"/>`,
  crew: `<path d="M28 62 Q26 34 60 30 Q94 34 92 62 Q88 48 60 44 Q32 48 28 62 Z" fill="${INK}"/><path d="M40 38 Q60 30 80 38 Q72 42 60 41 Q48 42 40 38Z" fill="${INK}"/>`,
  quiff: `<path d="M28 60 Q25 34 46 28 Q50 14 70 14 Q92 16 88 32 Q95 40 92 60 Q88 48 76 46 Q60 44 46 48 Q32 50 28 60 Z" fill="${INK}"/><path d="M50 26 Q62 18 80 22 M54 34 Q66 26 84 30" stroke="var(--card)" stroke-width="1.6" fill="none"/>`,
  pomp: `<path d="M29 62 Q27 30 42 22 Q52 8 72 9 Q94 12 90 30 Q94 42 91 62 Q88 46 60 44 Q32 46 29 62 Z" fill="${INK}"/><path d="M44 24 Q60 12 84 18 M42 32 Q62 20 88 28" stroke="var(--card)" stroke-width="1.6" fill="none"/>`,
  part: `<path d="M27 64 Q24 30 60 26 Q96 30 93 64 Q90 46 80 42 Q60 40 36 46 Q30 52 27 64 Z" fill="${INK}"/><path d="M44 28 Q42 36 44 44" stroke="var(--card)" stroke-width="2.2" fill="none"/><path d="M50 34 Q68 30 86 40 M50 40 Q68 36 88 46" stroke="var(--card)" stroke-width="1.4" fill="none"/>`,
  slick: `<path d="M27 64 Q24 28 60 24 Q96 28 93 64 Q90 46 60 44 Q30 46 27 64 Z" fill="${INK}"/><path d="M40 40 Q48 30 60 30 M50 42 Q56 32 70 31 M62 42 Q68 33 82 34" stroke="var(--card)" stroke-width="1.4" fill="none"/>`,
  curls: `<g fill="${INK}"><circle cx="38" cy="44" r="9"/><circle cx="50" cy="34" r="10"/><circle cx="63" cy="30" r="10"/><circle cx="76" cy="35" r="10"/><circle cx="85" cy="46" r="8"/><circle cx="44" cy="48" r="7"/><circle cx="58" cy="44" r="8"/><circle cx="72" cy="45" r="8"/><circle cx="32" cy="54" r="5"/><circle cx="88" cy="54" r="5"/></g><g fill="none" stroke="var(--card)" stroke-width="1.2"><path d="M46 32 a4 4 0 1 0 6 2"/><path d="M60 27 a4 4 0 1 0 6 2"/><path d="M73 33 a4 4 0 1 0 6 2"/><path d="M40 42 a3 3 0 1 0 5 2"/></g>`,
  mullet: `<path d="M28 62 Q24 30 60 27 Q96 30 92 62 Q90 50 86 52 L80 56 L76 50 L70 55 L64 49 L58 55 L52 49 L46 55 L40 50 Q32 52 28 62 Z" fill="${INK}"/><path d="M26 82 Q24 100 30 114 L38 112 Q32 98 33 84 Z M94 82 Q96 100 90 114 L82 112 Q88 98 87 84 Z" fill="${INK}"/>`,
  long: `<path d="M60 24 Q22 26 22 66 Q20 96 26 118 L36 118 Q30 96 32 70 Q34 52 58 34 L60 30 L62 34 Q86 52 88 70 Q90 96 84 118 L94 118 Q100 96 98 66 Q98 26 60 24 Z" fill="${INK}"/>`,
  messy: `<path d="M28 60 Q25 30 60 25 Q95 30 92 60 Q90 52 87 56 L83 50 L79 60 L74 51 L69 61 L64 50 L59 60 L54 50 L49 60 L44 51 L39 59 L35 52 Q30 54 28 60 Z" fill="${INK}"/><path d="M44 36 L48 48 M58 32 L60 46 M72 34 L70 48" stroke="var(--card)" stroke-width="1.4" fill="none"/>`,
};

export function pictogram(cut, { title = true } = {}) {
  const sides = cut.top === 'long' ? '' : halftoneSides(cut.fade);
  const label = `${cut.name} ${cut.detail}`;
  return `<svg class="picto" viewBox="0 0 120 140" role="img" aria-label="${title ? label : ''}" ${title ? '' : 'aria-hidden="true"'}>
  <g fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M47 112 L46 128 Q30 130 16 140 M73 112 L74 128 Q90 130 104 140"/>
    <ellipse cx="60" cy="76" rx="30" ry="38"/>
    <path d="M30.5 70 Q22 70 23 80 Q24 90 32 90"/>
    <path d="M89.5 70 Q98 70 97 80 Q96 90 88 90"/>
  </g>
  ${sides}
  ${TOPS[cut.top] || ''}
</svg>`;
}

// Nivel mostrado: solo los 3 primeros pueden ser «muy recomendado», para que el
// ranking recomiende de verdad aunque la forma de cara admita casi todo.
export function rankCuts(shape) {
  const ranked = CUTS
    .map((c, i) => ({ cut: c, score: c.scores[shape] ?? 0, order: i }))
    .sort((a, b) => b.score - a.score || a.order - b.order);
  ranked.forEach((r, i) => {
    r.tier = r.score >= 3 && i < 3 ? 3 : r.score >= 2 ? 2 : r.score;
  });
  return ranked;
}
