// Catálogo: canciones, miembros y eras (temas). Sin audio: el audio lo carga la jugadora.

export const THEMES = {
  SCHOOL: { name: '2 COOL 4 SKOOL', short: 'SKOOL', c1: '#1d1d22', c2: '#d7263d', ink: '#fff' },
  HYYH:   { name: 'THE MOST BEAUTIFUL MOMENT', short: 'HYYH', c1: '#ff8fab', c2: '#ffd6a5', ink: '#3b1830' },
  WINGS:  { name: 'WINGS', short: 'WINGS', c1: '#1b1440', c2: '#b38cff', ink: '#fff' },
  LY:     { name: 'LOVE YOURSELF', short: 'LY', c1: '#f7b7d8', c2: '#9fb8ff', ink: '#2b1f45' },
  MOTS:   { name: 'MAP OF THE SOUL', short: 'MOTS', c1: '#ff6f91', c2: '#ffc75f', ink: '#3a0f22' },
  BE:     { name: 'BE', short: 'BE', c1: '#c9c6ff', c2: '#7fd1ff', ink: '#1d2340' },
  BUTTER: { name: 'BUTTER', short: 'BUTTER', c1: '#ffd36e', c2: '#ff9f68', ink: '#3d2300' },
  PROOF:  { name: 'PROOF', short: 'PROOF', c1: '#0e1b2c', c2: '#d4af37', ink: '#fff' },
  SPECIAL:{ name: 'SPECIAL', short: 'SP', c1: '#6a00f4', c2: '#ff4ecd', ink: '#fff' },
};

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

export const SONGS = [
  { id: 'no-more-dream', title: 'No More Dream', theme: 'SCHOOL', alias: ['nomoredream'] },
  { id: 'boy-in-luv', title: 'Boy In Luv', theme: 'SCHOOL', alias: ['boyinluv', 'sangnamja'] },
  { id: 'danger', title: 'Danger', theme: 'SCHOOL' },
  { id: 'i-need-u', title: 'I NEED U', theme: 'HYYH', alias: ['ineedu'] },
  { id: 'dope', title: 'DOPE', theme: 'HYYH', alias: ['ssaeonda'] },
  { id: 'run', title: 'RUN', theme: 'HYYH' },
  { id: 'fire', title: 'FIRE', theme: 'HYYH', alias: ['burningup'] },
  { id: 'save-me', title: 'Save ME', theme: 'HYYH', alias: ['saveme'] },
  { id: 'bst', title: 'Blood Sweat & Tears', theme: 'WINGS', alias: ['bloodsweattears', 'bloodsweatandtears', 'pittamnunmul'] },
  { id: 'spring-day', title: 'Spring Day', theme: 'WINGS', alias: ['springday', 'bomnal'] },
  { id: 'not-today', title: 'Not Today', theme: 'WINGS', alias: ['nottoday'] },
  { id: 'dna', title: 'DNA', theme: 'LY' },
  { id: 'mic-drop', title: 'MIC Drop', theme: 'LY', alias: ['micdrop'] },
  { id: 'fake-love', title: 'FAKE LOVE', theme: 'LY', alias: ['fakelove'] },
  { id: 'idol', title: 'IDOL', theme: 'LY' },
  { id: 'the-truth-untold', title: 'The Truth Untold', theme: 'LY', alias: ['truthuntold', 'thetruthuntold'] },
  { id: 'bwl', title: 'Boy With Luv', theme: 'MOTS', alias: ['boywithluv', 'jageungeotdeureulwihansi'] },
  { id: 'make-it-right', title: 'Make It Right', theme: 'MOTS', alias: ['makeitright'] },
  { id: 'on', title: 'ON', theme: 'MOTS' },
  { id: 'black-swan', title: 'Black Swan', theme: 'MOTS', alias: ['blackswan'] },
  { id: 'dynamite', title: 'Dynamite', theme: 'BE' },
  { id: 'life-goes-on', title: 'Life Goes On', theme: 'BE', alias: ['lifegoeson'] },
  { id: 'butter', title: 'Butter', theme: 'BUTTER' },
  { id: 'ptd', title: 'Permission to Dance', theme: 'BUTTER', alias: ['permissiontodance'] },
  { id: 'yet-to-come', title: 'Yet To Come', theme: 'PROOF', alias: ['yettocome', 'mostbeautifulmoment'] },
  { id: 'run-bts', title: 'Run BTS', theme: 'PROOF', alias: ['runbts', 'dallyeorabangtan'] },
].map(s => ({ artist: 'BTS', ...s }));

export const DIFFS = [
  // mismas notas y mismos 4 botones en todos los niveles: sólo cambia la velocidad de caída
  { id: 'easy',   name: 'EASY',   lanes: 4, cost: 1, color: '#5ee6a8', speed: 1.35, label: 'lenta' },
  { id: 'normal', name: 'NORMAL', lanes: 4, cost: 2, color: '#ffc94d', speed: 1.0,  label: 'normal' },
  { id: 'hard',   name: 'HARD',   lanes: 4, cost: 3, color: '#ff5d8f', speed: 0.7,  label: 'rápida' },
];

export const GRADES = ['C', 'B', 'A', 'S', 'R'];
export const GRADE_INFO = {
  C: { power: 120, maxLvl: 5,  color: '#b7c0cc', odds: 0.50 },
  B: { power: 240, maxLvl: 10, color: '#7fd1ff', odds: 0.30 },
  A: { power: 420, maxLvl: 15, color: '#ffd166', odds: 0.14 },
  S: { power: 720, maxLvl: 20, color: '#ff7eb6', odds: 0.05 },
  R: { power: 1150, maxLvl: 25, color: '#c18cff', odds: 0.01 },
};

export const DECK_SIZE = 7;
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
