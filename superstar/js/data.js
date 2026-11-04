// Catálogo: canciones, miembros y eras (temas). Sin audio: el audio lo carga la jugadora.

// Eras = los 10 álbumes de estudio de BTS (6 coreanos + 4 japoneses). Cada carta es de una era,
// con la foto de ese miembro en ese año. Los colores son propios (no se copia el arte de los discos).
export const THEMES = {
  DW:      { name: 'DARK & WILD', short: 'D&W', year: 2014, c1: '#141414', c2: '#c8102e', ink: '#fff' },
  WAKEUP:  { name: 'WAKE UP', short: 'WAKE UP', year: 2014, c1: '#1c2b4a', c2: '#f2f2f2', ink: '#fff' },
  YOUTH:   { name: 'YOUTH', short: 'YOUTH', year: 2016, c1: '#ff8fab', c2: '#9fd3ff', ink: '#3b1830' },
  WINGS:   { name: 'WINGS', short: 'WINGS', year: 2016, c1: '#1b1440', c2: '#b38cff', ink: '#fff' },
  FACE:    { name: 'FACE YOURSELF', short: 'FACE', year: 2018, c1: '#e9e9ef', c2: '#5a5f73', ink: '#1d1d24' },
  LYT:     { name: 'LOVE YOURSELF 轉 TEAR', short: 'TEAR', year: 2018, c1: '#1f2433', c2: '#f7b7d8', ink: '#fff' },
  MOTS7:   { name: 'MAP OF THE SOUL : 7', short: 'MOTS:7', year: 2020, c1: '#ff6f91', c2: '#ffc75f', ink: '#3a0f22' },
  JOURNEY: { name: 'MAP OF THE SOUL : 7 ~ THE JOURNEY ~', short: 'JOURNEY', year: 2020, c1: '#0f4c5c', c2: '#7fe0d4', ink: '#fff' },
  BE:      { name: 'BE', short: 'BE', year: 2020, c1: '#c9c6ff', c2: '#7fd1ff', ink: '#1d2340' },
  ARIRANG: { name: 'ARIRANG', short: 'ARIRANG', year: 2026, c1: '#1b2a6b', c2: '#e63946', ink: '#fff' },
  SPECIAL: { name: 'SPECIAL', short: 'SP', year: 0, c1: '#6a00f4', c2: '#ff4ecd', ink: '#fff' },
};
export const ERAS = ['DW', 'WAKEUP', 'YOUTH', 'WINGS', 'FACE', 'LYT', 'MOTS7', 'JOURNEY', 'BE', 'ARIRANG'];
// eras antiguas del juego -> era nueva (para no perder cartas guardadas)
export const LEGACY_ERA = { SCHOOL: 'DW', HYYH: 'YOUTH', LY: 'LYT', MOTS: 'MOTS7', BUTTER: 'BE', PROOF: 'BE' };


export const MEMBERS = [
  { id: 'rm', photo: 'img/members/rm.jpg', mono: 'RM',   name: 'RM',        color: '#5b8def' },
  { id: 'jin', photo: 'img/members/jin.jpg', mono: 'JIN',  name: 'JIN',       color: '#ff7eb6' },
  { id: 'suga', photo: 'img/members/suga.jpg', mono: 'SG', name: 'SUGA',      color: '#8fa3b8' },
  { id: 'jh', photo: 'img/members/jh.jpg', mono: 'JH',   name: 'j-hope',    color: '#ffb347' },
  { id: 'jm', photo: 'img/members/jm.jpg', mono: 'JM',   name: 'JIMIN',     color: '#ffd166' },
  { id: 'v', photo: 'img/members/v.jpg', mono: 'V',    name: 'V',         color: '#3ccfbf' },
  { id: 'jk', photo: 'img/members/jk.jpg', mono: 'JK',   name: 'JUNG KOOK', color: '#a78bfa' },
];

// alias: palabras extra que ayudan a reconocer el archivo al importarlo.
// Fotos con licencia libre de Wikimedia Commons (atribución obligatoria).
export const PHOTO_CREDITS = [
  { member: 'RM', file: 'RM at W Korea Love Your W, November 2023.jpg', author: 'K-POPIT 케이팝잇', license: 'CC BY 3.0' },
  { member: 'JIN', file: 'BTS Jin at Maison Fred, 13 March 2025 01.jpg', author: 'TV 10', license: 'CC BY 3.0' },
  { member: 'SUGA', file: 'Min Yoon-gi May 2018.jpg', author: 'Dispatch', license: 'CC BY 3.0' },
  { member: 'j-hope', file: 'J-Hope at W Korea Breast Cancer Campaign, 15 October 2025.png', author: 'TV10', license: 'CC BY 4.0' },
  { member: 'JIMIN', file: 'Jimin on the way to SBS Radio, 31 March 2023 (2).jpg', author: 'K-POPIT 케이팝잇 TV10', license: 'CC BY 3.0' },
  { member: 'V', file: 'V (Kim Tae-hyung) at a fanmeet in May 2016 01 (cropped).jpg', author: "Taehyung's Moment", license: 'CC BY 4.0' },
  { member: 'JUNG KOOK', file: 'Jeon Jungkook at the White House, 31 May 2022.jpg', author: 'The White House (Adam Schultz)', license: 'Dominio público' },
];

// theme = era (álbum de estudio donde sale la canción; si no sale en ninguno, el más cercano en el tiempo)
export const SONGS = [
  { id: 'no-more-dream', title: 'No More Dream', theme: 'WAKEUP', alias: ['nomoredream'] },
  { id: 'boy-in-luv', title: 'Boy In Luv', theme: 'WAKEUP', alias: ['boyinluv', 'sangnamja'] },
  { id: 'danger', title: 'Danger', theme: 'DW' },
  { id: 'i-need-u', title: 'I NEED U', theme: 'YOUTH', alias: ['ineedu'] },
  { id: 'dope', title: 'DOPE', theme: 'YOUTH', alias: ['ssaeonda'] },
  { id: 'run', title: 'RUN', theme: 'YOUTH' },
  { id: 'fire', title: 'FIRE', theme: 'YOUTH', alias: ['burningup'] },
  { id: 'save-me', title: 'Save ME', theme: 'YOUTH', alias: ['saveme'] },
  { id: 'bst', title: 'Blood Sweat & Tears', theme: 'WINGS', alias: ['bloodsweattears', 'bloodsweatandtears', 'pittamnunmul'] },
  { id: 'spring-day', title: 'Spring Day', theme: 'WINGS', alias: ['springday', 'bomnal'] },
  { id: 'not-today', title: 'Not Today', theme: 'WINGS', alias: ['nottoday'] },
  { id: 'dna', title: 'DNA', theme: 'FACE' },
  { id: 'mic-drop', title: 'MIC Drop', theme: 'FACE', alias: ['micdrop'] },
  { id: 'fake-love', title: 'FAKE LOVE', theme: 'LYT', alias: ['fakelove'] },
  { id: 'idol', title: 'IDOL', theme: 'JOURNEY' },
  { id: 'the-truth-untold', title: 'The Truth Untold', theme: 'LYT', alias: ['truthuntold', 'thetruthuntold'] },
  { id: 'bwl', title: 'Boy With Luv', theme: 'MOTS7', alias: ['boywithluv', 'jageungeotdeureulwihansi'] },
  { id: 'make-it-right', title: 'Make It Right', theme: 'MOTS7', alias: ['makeitright'] },
  { id: 'on', title: 'ON', theme: 'MOTS7' },
  { id: 'black-swan', title: 'Black Swan', theme: 'MOTS7', alias: ['blackswan'] },
  { id: 'dynamite', title: 'Dynamite', theme: 'BE' },
  { id: 'life-goes-on', title: 'Life Goes On', theme: 'BE', alias: ['lifegoeson'] },
  { id: 'butter', title: 'Butter', theme: 'BE' },
  { id: 'ptd', title: 'Permission to Dance', theme: 'BE', alias: ['permissiontodance'] },
  { id: 'yet-to-come', title: 'Yet To Come', theme: 'BE', alias: ['yettocome', 'mostbeautifulmoment'] },
  { id: 'run-bts', title: 'Run BTS', theme: 'BE', alias: ['runbts', 'dallyeorabangtan'] },
].map(s => ({ artist: 'BTS', ...s }));

export const DIFFS = [
  // mismas notas y mismos 4 botones en todos los niveles: sólo cambia la velocidad de caída
  { id: 'easy',   name: 'EASY',   lanes: 4, cost: 1, color: '#5ee6a8', speed: 1.35, label: 'lenta' },
  { id: 'normal', name: 'NORMAL', lanes: 4, cost: 2, color: '#ffc94d', speed: 1.0,  label: 'normal' },
  { id: 'hard',   name: 'HARD',   lanes: 4, cost: 3, color: '#ff5d8f', speed: 0.7,  label: 'rápida' },
];

export const GRADES = ['C', 'B', 'A', 'S', 'R'];
export const GRADE_INFO = {
  // probabilidades de los Star Drops normales de Brawl Stars (raro, súper raro, épico, mítico, legendario)
  // colores: C gris plateado, B azul claro, A amarillo dorado, S rosa, R lila (iguales en cartas y sobres)
  C: { power: 120, maxLvl: 5,  color: '#b7c0cc', odds: 0.50 },
  B: { power: 240, maxLvl: 10, color: '#7fd1ff', odds: 0.28 },
  A: { power: 420, maxLvl: 15, color: '#ffd166', odds: 0.15 },
  S: { power: 720, maxLvl: 20, color: '#ff7eb6', odds: 0.05 },
  R: { power: 1150, maxLvl: 25, color: '#c18cff', odds: 0.02 },
};

export const DECK_SIZE = 7;
// cartas por sobre: 1 (50 %), 2 (30 %) o 3 (20 %)
export const PACK_SIZES = [[1, 0.5], [2, 0.3], [3, 0.2]];
export const PACK_COST = 5000;     // RP por sobre
export const REFILL_COST = 2500;   // RP por recargar auriculares
export const HP_REGEN_SEC = 180;   // un auricular cada 3 min
export const BASE_MAX_SCORE = { easy: 1000000, normal: 1150000, hard: 1300000 };

export function normName(s) {
  return String(s || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, 'and')
    .replace(/\(.*?\)|\[.*?\]/g, ' ')
    .replace(/[^a-z0-9]/g, '');
}

// Intenta reconocer qué canción es un archivo por su nombre.
export function matchSong(filename, songs) {
  const noisy = filename
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/\b(official|audio|music|video|mv|m\/v|lyrics?|hq|hd|4k|color coded|eng|han|rom|full)\b/gi, ' ')
    .replace(/^\s*\d+[\s._-]+/, ''); // "03 - DNA" -> "DNA"
  const bases = [normName(noisy.replace(/(bts|방탄소년단)/gi, ' ')), normName(noisy)];
  let best = null, bestLen = 0;
  for (const s of songs) {
    const keys = [normName(s.title), ...(s.alias || [])];
    for (const k of keys) {
      // claves cortas (ON, DNA, RUN...) tienen que coincidir enteras
      const hit = bases.some(b => (k.length <= 4 ? b === k : b.includes(k)));
      if (hit && k.length > bestLen) { best = s; bestLen = k.length; }
    }
  }
  return best;
}
