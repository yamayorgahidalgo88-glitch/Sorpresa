'use strict';
/* Sugar Rush Kart — juego de karts ambientado en el mundo de dulces de Sugar Rush (Rompe Ralph).
   Motor pseudo-3D estilo arcade, todo el arte se dibuja por código en canvas (sin imágenes externas). */

// =====================================================================
// Utilidades
// =====================================================================
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const mod = (n, m) => ((n % m) + m) % m;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.random() * a.length | 0];
const easeIn = (a, b, p) => a + (b - a) * p * p;
const easeInOut = (a, b, p) => a + (b - a) * (-Math.cos(p * Math.PI) / 2 + .5);
const TAU = Math.PI * 2;
function srand(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function shade(hex, a) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = n >> 8 & 255, b = n & 255;
  const t = a < 0 ? 0 : 255, f = Math.abs(a);
  r = Math.round((t - r) * f + r); g = Math.round((t - g) * f + g); b = Math.round((t - b) * f + b);
  return `rgb(${r},${g},${b})`;
}
function rrp(p, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); p.moveTo(x + r, y); p.arcTo(x + w, y, x + w, y + h, r); p.arcTo(x + w, y + h, x, y + h, r); p.arcTo(x, y + h, x, y, r); p.arcTo(x, y, x + w, y, r); p.closePath(); }
function rr(g, x, y, w, h, r) { g.beginPath(); rrp(g, x, y, w, h, r); }
function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
function ell(g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, TAU); g.fill(); }
const SPRINK = ['#ff4f8b', '#ffd23f', '#4fd1ff', '#6fe36a', '#b07bff', '#ffffff'];
function sprinkles(g, R, x, y, w, h, n, s) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = SPRINK[R() * SPRINK.length | 0]; g.save(); g.translate(x + R() * w, y + R() * h); g.rotate(R() * Math.PI);
    g.fillRect(-s, -s * .35, s * 2, s * .7); g.restore();
  }
}

// =====================================================================
// Catálogo: personaje, tienda y taller
// =====================================================================
const SKINS = ['#ffe3cc', '#f7cba6', '#e2a87c', '#bb7b52', '#8c5637', '#5f3a24'];
const HAIR_COLORS = ['#2b1a12', '#4a2a1a', '#7a4a24', '#c98a3c', '#f2d16b', '#f5f0e0', '#ff6fae', '#7a5cff', '#3fbf9f', '#ff8a2a', '#d11f3a', '#4fb7ff'];
const EYE_COLORS = ['#6b3a18', '#2f6fd1', '#2c9a54', '#7b4bd6', '#222222', '#d14a8b', '#d18a1a'];
const OUTFIT_COLORS = ['#5fd3b0', '#ff7eb6', '#ffd23f', '#58c4ff', '#8f3bd6', '#ff6b4a', '#7a4a2a', '#ffffff', '#2b2b3a', '#3fbf6f', '#d11f3a'];
const PAINTS = ['#ff7eb6', '#5fd3b0', '#ffd23f', '#ff6b4a', '#8f6bff', '#58c4ff', '#8a5a2a', '#ffffff', '#3a2a3a', '#c7f464', '#d11f3a', '#ffb070'];
const HAIR_STYLES = { corta: 'Corto', coletas: 'Coletas', cola: 'Coleta', larga: 'Melena', tupe: 'Tupé', mono: 'Moño' };
const EYE_STYLES = { grandes: 'Brillantes', redondos: 'Redondos', felices: 'Felices', pestanas: 'Pestañas', traviesos: 'Traviesos' };
const MOUTHS = { sonrisa: 'Sonrisa', abierta: '¡Yuju!', lengua: 'Burla', dientes: 'Pícara', o: '¡Oh!' };
const DECOS = { nada: 'Liso', chispas: 'Fideos de colores', rayas: 'Rayas de caramelo', lunares: 'Lunares', glaseado: 'Glaseado' };

const SHOP = {
  hat: [['ninguno', 'Nada', 0], ['lazo', 'Lazo de caramelo', 80], ['gorra', 'Gorra de reparador', 120], ['cereza', 'Cerezas', 150],
    ['vela', 'Vela de cumpleaños', 200], ['calabaza', 'Gorro calabaza', 220], ['casco', 'Casco de carreras', 250], ['corona', 'Corona real', 600]],
  outfit: [['sudadera', 'Sudadera', 0], ['chaqueta', 'Chaqueta de piloto', 150], ['vestido', 'Vestido merengue', 160], ['peto', 'Peto destructor', 180],
    ['armadura', 'Armadura de soldado', 400], ['traje', 'Traje real', 500]],
  acc: [['ninguno', 'Nada', 0], ['pajarita', 'Pajarita', 70], ['gafas', 'Gafas', 90], ['bufanda', 'Bufanda de regaliz', 110],
    ['gafasSol', 'Gafas de sol', 140], ['medalla', 'Medalla de héroe', 300]],
};
const PARTS = {
  body: {
    galleta: { name: 'Galleta Clásica', price: 0, st: { acel: .5, man: .5 } },
    chuche: { name: 'Kart Chuche', price: 300, st: { vel: .5, acel: 1, man: 1, peso: -.5 } },
    pastel: { name: 'Pastel Turbo', price: 450, st: { vel: 1.5, acel: -.5, man: -.5, peso: 1.5 } },
    bombon: { name: 'Bombón Tanque', price: 500, st: { vel: 1, acel: -.5, peso: 2.5, trac: .5 } },
    piruleta: { name: 'Piruleta Rayo', price: 600, st: { vel: 2, man: -1, peso: -.5 } },
  },
  wheels: {
    donut: { name: 'Donuts', price: 0, st: {} },
    galleta: { name: 'Galletas', price: 150, st: { acel: .5, trac: 1 } },
    gominola: { name: 'Gominolas', price: 250, st: { man: 1, vel: -.5, trac: .5 } },
    caramelo: { name: 'Caramelos duros', price: 250, st: { vel: 1, man: -.5, trac: -.5 } },
    menta: { name: 'Mentas', price: 400, st: { vel: .5, acel: .5, man: .5 } },
  },
  engine: {
    ninguno: { name: 'De serie', price: 0, st: {} },
    chicle: { name: 'Escape de chicle', price: 200, st: { acel: 1 } },
    barquillo: { name: 'Alerón de barquillo', price: 250, st: { man: 1, trac: .5 } },
    mentos: { name: 'Cohete Mentos', price: 700, st: { vel: 1, acel: .5, man: -.5 } },
  },
};
const STAT_NAMES = { vel: 'Velocidad', acel: 'Aceleración', man: 'Manejo', peso: 'Peso', trac: 'Tracción' };
const STAT_SHORT = { vel: 'Vel', acel: 'Acel', man: 'Man', peso: 'Peso', trac: 'Trac' };
function carStats(car) {
  const s = { vel: 2, acel: 2, man: 2, peso: 2, trac: 2 };
  for (const k of ['body', 'wheels', 'engine']) { const p = PARTS[k][car[k]]; if (p) for (const j in p.st) s[j] += p.st[j]; }
  for (const j in s) s[j] = clamp(s[j], .5, 5);
  return s;
}
const SUPERS = {
  turbo: { name: 'Turbo Mentos', icon: '🥤' },
  glitch: { name: 'Glitch', icon: '👾' },
  escudo: { name: 'Martillo de Félix', icon: '🔨' },
  punio: { name: 'Puñetazo de Ralph', icon: '👊' },
  chicle: { name: 'Bomba de chicle', icon: '🍬' },
  cohete: { name: 'Piruleta cohete', icon: '🍭' },
};
const DIFFS = [{ name: 'Fácil', mul: .86, prize: 1 }, { name: 'Normal', mul: .95, prize: 1.3 }, { name: 'Difícil', mul: 1.03, prize: 1.7 }];
const PRIZES = [60, 45, 35, 25, 20, 15, 10, 5];
const POINTS = [15, 12, 10, 8, 7, 6, 5, 4];

// Corredores rivales de Sugar Rush
const BASE_CHAR = { name: 'Piloto', skin: 1, hair: 'cola', hairColor: '#4a2a1a', eyes: 'grandes', eyeColor: '#6b3a18', mouth: 'sonrisa', outfit: 'sudadera', outfitColor: '#ff7eb6', hat: 'ninguno', acc: 'ninguno' };
const BASE_CAR = { body: 'galleta', wheels: 'donut', engine: 'ninguno', paint: '#ff7eb6', deco: 'chispas' };
const RIVALS = [
  { name: 'Vanellope', skill: 1, glitch: true, char: { skin: 0, hair: 'cola', hairColor: '#2b1a12', eyes: 'traviesos', eyeColor: '#6b3a18', mouth: 'dientes', outfit: 'sudadera', outfitColor: '#5fd3b0', candy: true }, car: { body: 'chuche', wheels: 'galleta', engine: 'chicle', paint: '#5fd3b0', deco: 'chispas' } },
  { name: 'Taffyta', skill: .985, char: { skin: 0, hair: 'coletas', hairColor: '#f5f0e0', eyes: 'pestanas', eyeColor: '#2f6fd1', mouth: 'sonrisa', outfit: 'vestido', outfitColor: '#ff7eb6', hat: 'lazo' }, car: { body: 'piruleta', wheels: 'caramelo', engine: 'barquillo', paint: '#ff7eb6', deco: 'rayas' } },
  { name: 'Rancis', skill: .965, char: { skin: 1, hair: 'tupe', hairColor: '#f2d16b', eyes: 'redondos', eyeColor: '#2f6fd1', mouth: 'sonrisa', outfit: 'chaqueta', outfitColor: '#7a4a2a' }, car: { body: 'bombon', wheels: 'menta', engine: 'ninguno', paint: '#8a5a2a', deco: 'glaseado' } },
  { name: 'Candlehead', skill: .95, char: { skin: 0, hair: 'larga', hairColor: '#7a4a24', eyes: 'felices', eyeColor: '#6b3a18', mouth: 'abierta', outfit: 'vestido', outfitColor: '#58c4ff', hat: 'vela' }, car: { body: 'pastel', wheels: 'donut', engine: 'ninguno', paint: '#ffffff', deco: 'chispas' } },
  { name: 'Gloyd', skill: .955, char: { skin: 1, hair: 'corta', hairColor: '#ff8a2a', eyes: 'redondos', eyeColor: '#2c9a54', mouth: 'lengua', outfit: 'chaqueta', outfitColor: '#ff6b4a', hat: 'calabaza' }, car: { body: 'galleta', wheels: 'gominola', engine: 'chicle', paint: '#ff8a2a', deco: 'rayas' } },
  { name: 'Jubileena', skill: .96, char: { skin: 2, hair: 'mono', hairColor: '#d11f3a', eyes: 'pestanas', eyeColor: '#6b3a18', mouth: 'sonrisa', outfit: 'vestido', outfitColor: '#d11f3a', hat: 'cereza' }, car: { body: 'chuche', wheels: 'caramelo', engine: 'barquillo', paint: '#ff4060', deco: 'lunares' } },
  { name: 'Rey Candy', skill: 1, char: { skin: 0, hair: 'corta', hairColor: '#f5f0e0', eyes: 'traviesos', eyeColor: '#7b4bd6', mouth: 'dientes', outfit: 'traje', outfitColor: '#8f3bd6', hat: 'corona', acc: 'gafas' }, car: { body: 'pastel', wheels: 'menta', engine: 'mentos', paint: '#8f6bff', deco: 'rayas' } },
];
RIVALS.forEach(r => { r.char = { ...BASE_CHAR, hat: 'ninguno', acc: 'ninguno', ...r.char, name: r.name }; });

// =====================================================================
// Partida guardada
// =====================================================================
const SAVE_KEY = 'sugarRushKart.v1';
function loadSave() {
  let s = null; try { s = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { }
  s = s || {};
  return { coins: s.coins ?? 200, created: !!s.created, muted: !!s.muted, char: { ...BASE_CHAR, ...s.char }, car: { ...BASE_CAR, ...s.car }, owned: s.owned || [], best: s.best || {}, diff: s.diff ?? 1 };
}
let save = loadSave();
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { } }
function priceOf(cat, id) { if (SHOP[cat]) { const e = SHOP[cat].find(x => x[0] === id); return e ? e[2] : 0; } return PARTS[cat][id].price; }
function owns(cat, id) { return priceOf(cat, id) === 0 || save.owned.includes(cat + ':' + id); }

// =====================================================================
// Arte: personajes
// =====================================================================
function drawCharFront(g, cx, cy, R, ch) {
  const skin = SKINS[ch.skin] || SKINS[1], hc = ch.hairColor;
  g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
  // pelo trasero
  g.fillStyle = shade(hc, -.12);
  if (ch.hair === 'larga') { rr(g, cx - R * 1.1, cy - R * .4, R * 2.2, R * 2, R * .55); g.fill(); }
  if (ch.hair === 'coletas') for (const s of [-1, 1]) { ell(g, cx + s * R * 1.18, cy + R * .45, R * .36, R * .8, s * .25); g.fillStyle = '#ff5fa2'; circ(g, cx + s * R * 1.02, cy - R * .2, R * .12); g.fillStyle = shade(hc, -.12); }
  if (ch.hair === 'cola') { ell(g, cx + R * .78, cy - R * 1.02, R * .32, R * .62, .7); }
  if (ch.hair === 'mono') { g.fillStyle = hc; circ(g, cx, cy - R * 1.08, R * .42); }
  drawOutfitFront(g, cx, cy, R, ch);
  // cuello y orejas
  g.fillStyle = skin; g.fillRect(cx - R * .2, cy + R * .7, R * .4, R * .3);
  g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(cx - R * .2, cy + R * .7, R * .4, R * .1);
  g.fillStyle = skin; circ(g, cx - R * .97, cy + R * .1, R * .2); circ(g, cx + R * .97, cy + R * .1, R * .2);
  // cabeza
  g.beginPath(); g.ellipse(cx, cy, R, R * .96, 0, 0, TAU); g.fillStyle = skin; g.fill();
  g.strokeStyle = 'rgba(90,30,40,.45)'; g.lineWidth = R * .04; g.stroke();
  g.fillStyle = 'rgba(255,110,140,.35)'; ell(g, cx - R * .58, cy + R * .4, R * .17, R * .1); ell(g, cx + R * .58, cy + R * .4, R * .17, R * .1);
  drawEyes(g, cx, cy, R, ch, skin);
  drawMouth(g, cx, cy, R, ch.mouth);
  drawBangs(g, cx, cy, R, ch);
  drawHatFront(g, cx, cy, R, ch.hat);
  drawAccFront(g, cx, cy, R, ch.acc);
  g.restore();
}
function drawOutfitFront(g, cx, cy, R, ch) {
  const oc = ch.outfitColor, top = cy + R * .85, bot = cy + R * 2.2, o = ch.outfit;
  const p = new Path2D(); const flare = o === 'vestido' ? .35 : 0;
  p.moveTo(cx - R * .5, top); p.quadraticCurveTo(cx - R * .95, top + R * .02, cx - R * 1.0, top + R * .5);
  p.lineTo(cx - R * (1.05 + flare), bot); p.lineTo(cx + R * (1.05 + flare), bot); p.lineTo(cx + R * 1.0, top + R * .5);
  p.quadraticCurveTo(cx + R * .95, top + R * .02, cx + R * .5, top); p.closePath();
  g.fillStyle = o === 'peto' ? '#ff8a3a' : o === 'armadura' ? '#8a97ad' : oc; g.fill(p);
  g.strokeStyle = 'rgba(70,20,40,.4)'; g.lineWidth = R * .04; g.stroke(p);
  g.save(); g.clip(p);
  if (o === 'sudadera') {
    g.fillStyle = shade(oc, -.15); ell(g, cx, top + R * .02, R * .62, R * .2);
    g.fillStyle = shade(oc, -.1); rr(g, cx - R * .45, top + R * .75, R * .9, R * .36, R * .12); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = R * .05; g.beginPath(); g.moveTo(cx - R * .16, top + R * .1); g.lineTo(cx - R * .2, top + R * .5); g.moveTo(cx + R * .16, top + R * .1); g.lineTo(cx + R * .2, top + R * .5); g.stroke();
  } else if (o === 'chaqueta') {
    g.fillStyle = '#fff'; g.fillRect(cx - R * .78, top, R * .14, R * 1.5); g.fillRect(cx + R * .64, top, R * .14, R * 1.5);
    g.strokeStyle = shade(oc, -.4); g.lineWidth = R * .05; g.beginPath(); g.moveTo(cx, top + R * .1); g.lineTo(cx, bot); g.stroke();
    g.fillStyle = shade(oc, .2); g.beginPath(); g.moveTo(cx - R * .5, top); g.lineTo(cx, top + R * .35); g.lineTo(cx + R * .5, top); g.lineTo(cx + R * .35, top - R * .1); g.lineTo(cx, top + R * .15); g.lineTo(cx - R * .35, top - R * .1); g.fill();
  } else if (o === 'vestido') {
    g.fillStyle = '#fff'; for (let i = -6; i <= 6; i++) circ(g, cx + i * R * .2, bot - R * .05, R * .13);
    g.fillStyle = shade(oc, .35); ell(g, cx, top + R * .7, R * .9, R * .1);
    g.fillStyle = '#fff'; ell(g, cx - R * .14, top + R * .7, R * .16, R * .1, -.3); ell(g, cx + R * .14, top + R * .7, R * .16, R * .1, .3);
  } else if (o === 'peto') {
    g.fillStyle = oc === '#ffffff' ? '#7a4a2a' : oc; g.fillRect(cx - R * .62, top + R * .55, R * 1.24, R * 1.5); g.fillRect(cx - R * .62, top, R * .2, R * .6); g.fillRect(cx + R * .42, top, R * .2, R * .6);
    g.fillStyle = '#ffd23f'; circ(g, cx - R * .52, top + R * .62, R * .08); circ(g, cx + R * .52, top + R * .62, R * .08);
  } else if (o === 'armadura') {
    g.fillStyle = '#b8c4d8'; rr(g, cx - R * .55, top + R * .25, R * 1.1, R * .8, R * .2); g.fill();
    g.fillStyle = oc; g.fillRect(cx - R * .55, top + R * .55, R * 1.1, R * .12);
    g.fillStyle = '#6b778c'; circ(g, cx - R * .95, top + R * .28, R * .3); circ(g, cx + R * .95, top + R * .28, R * .3);
  } else if (o === 'traje') {
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(cx - R * .5, top); g.lineTo(cx, top + R * .9); g.lineTo(cx + R * .5, top); g.fill();
    g.fillStyle = '#ffd23f'; for (let i = 0; i < 3; i++) circ(g, cx, top + R * (1.05 + i * .32), R * .07);
    g.fillStyle = '#ffe9f5'; for (let i = -3; i <= 3; i++) circ(g, cx + i * R * .16, top + R * .02, R * .13);
  }
  g.restore();
}
function drawEyes(g, cx, cy, R, ch, skin) {
  const ey = cy + R * .1, st = ch.eyes, s = R * .2;
  g.strokeStyle = shade(ch.hairColor, -.25); g.lineWidth = R * .06;
  for (const d of [-1, 1]) {
    g.beginPath(); const tw = st === 'traviesos' ? .08 : 0;
    g.moveTo(cx + d * R * .2, cy - R * (tw ? .16 : .3)); g.lineTo(cx + d * R * .56, cy - R * (tw ? .36 : .26)); g.stroke();
  }
  for (const d of [-1, 1]) {
    const x = cx + d * R * .38;
    if (st === 'felices') { g.strokeStyle = '#3a1a14'; g.lineWidth = R * .07; g.beginPath(); g.arc(x, ey + s * .4, s * .75, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); continue; }
    const k = st === 'redondos' ? .8 : 1.1;
    g.fillStyle = '#fff'; ell(g, x, ey, s * k * .85, s * k * 1.05);
    g.fillStyle = ch.eyeColor; ell(g, x, ey + s * .1, s * k * .62, s * k * .8);
    g.fillStyle = '#1a0d0a'; ell(g, x, ey + s * .15, s * k * .3, s * k * .42);
    g.fillStyle = '#fff'; circ(g, x - s * .25, ey - s * .25, s * .22); circ(g, x + s * .22, ey + s * .35, s * .1);
    if (st === 'traviesos') { g.fillStyle = skin; ell(g, x, ey - s * 1.05, s * 1.2, s * .75, d * .25); }
    g.strokeStyle = '#3a1a14'; g.lineWidth = R * .05; g.beginPath();
    g.ellipse(x, ey, s * k * .85, s * k * 1.05, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    if (st === 'pestanas') { g.beginPath(); for (let i = 0; i < 3; i++) { const a = Math.PI * (1.25 + i * .2) + (d > 0 ? .25 : -.25) * 0; const bx = x + Math.cos(a) * s * k * .85, by = ey + Math.sin(a) * s * k * 1.05; g.moveTo(bx, by); g.lineTo(bx + Math.cos(a) * s * .45 + d * s * .15, by + Math.sin(a) * s * .45); } g.stroke(); }
  }
}
function drawMouth(g, cx, cy, R, m) {
  const y = cy + R * .52; g.strokeStyle = '#5a1a1a'; g.lineWidth = R * .055; g.fillStyle = '#7a1f2b';
  if (m === 'sonrisa') { g.beginPath(); g.arc(cx, y - R * .14, R * .2, Math.PI * .2, Math.PI * .8); g.stroke(); }
  else if (m === 'abierta') { g.beginPath(); g.moveTo(cx - R * .2, y - R * .05); g.quadraticCurveTo(cx, y + R * .34, cx + R * .2, y - R * .05); g.closePath(); g.fill(); g.fillStyle = '#ff7a8a'; ell(g, cx, y + R * .1, R * .09, R * .05); }
  else if (m === 'lengua') { g.fillStyle = '#ff7a8a'; ell(g, cx + R * .06, y + R * .08, R * .08, R * .11); g.beginPath(); g.arc(cx, y - R * .14, R * .2, Math.PI * .2, Math.PI * .8); g.stroke(); }
  else if (m === 'dientes') { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(cx - R * .25, y - R * .08); g.quadraticCurveTo(cx, y + R * .26, cx + R * .25, y - R * .08); g.closePath(); g.fill(); g.stroke(); g.lineWidth = R * .03; g.beginPath(); g.moveTo(cx - R * .22, y - R * .02); g.lineTo(cx + R * .22, y - R * .02); g.stroke(); }
  else { ell(g, cx, y, R * .08, R * .1); }
}
function drawBangs(g, cx, cy, R, ch) {
  const t = ch.hair, hc = ch.hairColor, side = (t === 'larga' || t === 'coletas') ? .5 : .1;
  g.fillStyle = hc; g.beginPath();
  g.moveTo(cx - R * 1.03, cy + R * side);
  g.bezierCurveTo(cx - R * 1.15, cy - R * 1.3, cx + R * 1.15, cy - R * 1.3, cx + R * 1.03, cy + R * side);
  const n = 6; for (let i = n; i >= 0; i--) g.lineTo(cx - R * .95 + R * 1.9 * i / n, cy - R * (i % 2 ? .28 : .5) + (i === 0 || i === n ? R * .25 : 0));
  g.closePath(); g.fill();
  if (t === 'tupe') { g.beginPath(); g.ellipse(cx + R * .1, cy - R * .92, R * .78, R * .42, -.2, 0, TAU); g.fill(); }
  if (t === 'cola') { g.beginPath(); g.ellipse(cx + R * .45, cy - R * .85, R * .25, R * .18, .5, 0, TAU); g.fillStyle = '#ff5fa2'; g.fill(); }
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = R * .07; g.beginPath(); g.arc(cx - R * .05, cy - R * .1, R * .78, Math.PI * 1.2, Math.PI * 1.45); g.stroke();
  if (ch.candy) { const S = srand(5); for (let i = 0; i < 7; i++) { g.fillStyle = SPRINK[i % 5]; circ(g, cx + (S() - .5) * R * 1.5, cy - R * (.45 + S() * .5), R * .07); } }
}
function drawHatFront(g, cx, cy, R, hat) {
  if (hat === 'gorra') {
    g.fillStyle = '#2f6fd1'; g.beginPath(); g.arc(cx, cy - R * .38, R * .98, Math.PI, 0); g.closePath(); g.fill();
    g.fillStyle = '#1f4fa8'; ell(g, cx, cy - R * .36, R * 1.12, R * .17);
    g.fillStyle = '#ffd23f'; circ(g, cx, cy - R * .8, R * .17);
  } else if (hat === 'corona') {
    g.fillStyle = '#ffcf3a'; g.strokeStyle = '#c98f00'; g.lineWidth = R * .04; g.beginPath(); const b = cy - R * .72;
    g.moveTo(cx - R * .7, b); for (let i = 0; i <= 4; i++) { const x = cx - R * .7 + R * 1.4 * i / 4; g.lineTo(x, b - R * (i % 2 ? .3 : .6)); if (i < 4) g.lineTo(x + R * .175, b - R * .22); }
    g.lineTo(cx + R * .7, b); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#ff3d6e'; circ(g, cx, b - R * .12, R * .09); g.fillStyle = '#4fb7ff'; circ(g, cx - R * .4, b - R * .1, R * .07); circ(g, cx + R * .4, b - R * .1, R * .07);
  } else if (hat === 'vela') {
    g.fillStyle = '#fff'; g.fillRect(cx - R * .13, cy - R * 1.65, R * .26, R * .75);
    g.fillStyle = '#ff7eb6'; for (let i = 0; i < 4; i++) g.fillRect(cx - R * .13, cy - R * 1.6 + i * R * .19, R * .26, R * .07);
    g.fillStyle = '#ffb020'; ell(g, cx, cy - R * 1.8, R * .12, R * .2); g.fillStyle = '#fff3a0'; ell(g, cx, cy - R * 1.76, R * .05, R * .1);
  } else if (hat === 'lazo') {
    g.fillStyle = '#ff4f98'; const x = cx + R * .45, y = cy - R * .82;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - R * .45, y - R * .28); g.lineTo(x - R * .42, y + R * .25); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + R * .45, y - R * .28); g.lineTo(x + R * .42, y + R * .25); g.closePath(); g.fill();
    g.fillStyle = '#fff'; circ(g, x, y, R * .12);
  } else if (hat === 'calabaza') {
    g.fillStyle = '#ff8a2a'; ell(g, cx, cy - R * .78, R * .85, R * .42); g.strokeStyle = '#d0601a'; g.lineWidth = R * .04;
    for (const k of [-.4, 0, .4]) { g.beginPath(); g.ellipse(cx + k * R, cy - R * .78, R * .22, R * .4, 0, 0, TAU); g.stroke(); }
    g.fillStyle = '#3f9a3a'; g.fillRect(cx - R * .07, cy - R * 1.32, R * .14, R * .2);
  } else if (hat === 'cereza') {
    g.strokeStyle = '#3f9a3a'; g.lineWidth = R * .05; g.beginPath(); g.moveTo(cx - R * .55, cy - R * .55); g.quadraticCurveTo(cx - R * .3, cy - R * 1.25, cx - R * .1, cy - R * 1.1); g.moveTo(cx - R * .3, cy - R * .5); g.quadraticCurveTo(cx - R * .25, cy - R * 1.1, cx - R * .1, cy - R * 1.1); g.stroke();
    g.fillStyle = '#d11f3a'; circ(g, cx - R * .55, cy - R * .5, R * .18); circ(g, cx - R * .28, cy - R * .45, R * .18);
    g.fillStyle = 'rgba(255,255,255,.6)'; circ(g, cx - R * .6, cy - R * .56, R * .05); circ(g, cx - R * .33, cy - R * .51, R * .05);
  } else if (hat === 'casco') {
    g.fillStyle = '#e8243c'; g.beginPath(); g.arc(cx, cy - R * .05, R * 1.12, Math.PI * 1.02, Math.PI * 1.98); g.lineTo(cx + R * 1.1, cy + R * .45); g.lineTo(cx + R * .9, cy + R * .45); g.lineTo(cx + R * .9, cy - R * .3); g.lineTo(cx - R * .9, cy - R * .3); g.lineTo(cx - R * .9, cy + R * .45); g.lineTo(cx - R * 1.1, cy + R * .45); g.closePath(); g.fill();
    g.fillStyle = '#fff'; g.fillRect(cx - R * .12, cy - R * 1.15, R * .24, R * .85);
    g.fillStyle = 'rgba(120,200,255,.5)'; rr(g, cx - R * .85, cy - R * .5, R * 1.7, R * .26, R * .1); g.fill();
  }
}
function drawAccFront(g, cx, cy, R, acc) {
  const ey = cy + R * .1;
  if (acc === 'gafas' || acc === 'gafasSol') {
    g.strokeStyle = '#2b1a2a'; g.lineWidth = R * .06;
    for (const d of [-1, 1]) { g.beginPath(); g.arc(cx + d * R * .38, ey, R * .27, 0, TAU); if (acc === 'gafasSol') { g.fillStyle = 'rgba(30,20,40,.88)'; g.fill(); } g.stroke(); }
    g.beginPath(); g.moveTo(cx - R * .11, ey); g.lineTo(cx + R * .11, ey); g.stroke();
    if (acc === 'gafasSol') { g.fillStyle = 'rgba(255,255,255,.5)'; for (const d of [-1, 1]) ell(g, cx + d * R * .38 - R * .1, ey - R * .1, R * .07, R * .04, -.5); }
  } else if (acc === 'pajarita') {
    const y = cy + R * .98; g.fillStyle = '#d11f3a';
    g.beginPath(); g.moveTo(cx, y); g.lineTo(cx - R * .3, y - R * .15); g.lineTo(cx - R * .3, y + R * .15); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(cx, y); g.lineTo(cx + R * .3, y - R * .15); g.lineTo(cx + R * .3, y + R * .15); g.closePath(); g.fill(); circ(g, cx, y, R * .08);
  } else if (acc === 'bufanda') {
    const y = cy + R * .92; g.save(); rr(g, cx - R * .65, y - R * .14, R * 1.3, R * .3, R * .14); g.clip();
    for (let i = -8; i < 8; i++) { g.fillStyle = i % 2 ? '#d11f3a' : '#2b1a1a'; g.fillRect(cx + i * R * .16, y - R * .2, R * .16, R * .4); }
    g.restore(); g.fillStyle = '#d11f3a'; g.fillRect(cx + R * .3, y, R * .18, R * .6);
  } else if (acc === 'medalla') {
    const y = cy + R * 1.4; g.fillStyle = '#4fb7ff'; g.beginPath(); g.moveTo(cx - R * .2, cy + R * .9); g.lineTo(cx, y); g.lineTo(cx + R * .2, cy + R * .9); g.fill();
    g.fillStyle = '#ffcf3a'; circ(g, cx, y + R * .12, R * .22); g.fillStyle = '#c98f00'; circ(g, cx, y + R * .12, R * .13);
    g.fillStyle = '#fff3b0'; g.font = `bold ${R * .18}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('★', cx, y + R * .13);
  }
}
// Piloto visto desde atrás (para el kart en carrera)
function drawDriverBack(g, hy, ch) {
  const skin = SKINS[ch.skin] || SKINS[1], hc = ch.hairColor, oc = ch.outfit === 'peto' ? '#ff8a3a' : ch.outfit === 'armadura' ? '#8a97ad' : ch.outfitColor, r = 17;
  g.fillStyle = oc; rr(g, -23, hy + 12, 46, 32, 13); g.fill(); g.strokeStyle = 'rgba(60,20,40,.4)'; g.lineWidth = 2; g.stroke();
  if (ch.outfit === 'sudadera') { g.fillStyle = shade(ch.outfitColor, -.18); ell(g, 0, hy + 20, 15, 8); }
  if (ch.outfit === 'peto') { g.fillStyle = ch.outfitColor; g.fillRect(-14, hy + 14, 6, 30); g.fillRect(8, hy + 14, 6, 30); }
  if (ch.outfit === 'chaqueta') { g.fillStyle = '#fff'; g.fillRect(-18, hy + 14, 5, 30); g.fillRect(13, hy + 14, 5, 30); }
  g.fillStyle = skin; g.fillRect(-6, hy + 8, 12, 8); circ(g, -r, hy + 2, 4.5); circ(g, r, hy + 2, 4.5);
  if (ch.hat === 'casco') {
    g.fillStyle = '#e8243c'; circ(g, 0, hy, r + 3); g.fillStyle = '#fff'; g.fillRect(-3, hy - r - 3, 6, 2 * r + 4);
    g.fillStyle = 'rgba(255,255,255,.35)'; ell(g, -7, hy - 8, 5, 3, -.5); return;
  }
  g.fillStyle = hc;
  if (ch.hair === 'larga') { rr(g, -r - 1, hy - 4, 2 * r + 2, r + 18, 8); g.fill(); }
  circ(g, 0, hy, r);
  if (ch.hair === 'coletas') { ell(g, -r - 6, hy + 6, 7, 12, .3); ell(g, r + 6, hy + 6, 7, 12, -.3); g.fillStyle = '#ff5fa2'; circ(g, -r - 2, hy - 2, 3); circ(g, r + 2, hy - 2, 3); }
  if (ch.hair === 'cola') { g.fillStyle = hc; ell(g, 0, hy - r + 2, 7, 6); ell(g, 2, hy + 8, 7, 14, .15); g.fillStyle = '#ff5fa2'; circ(g, 0, hy - r + 2, 3); }
  if (ch.hair === 'mono') { circ(g, 0, hy - r - 2, 8); }
  if (ch.hair === 'corta' || ch.hair === 'tupe') { g.fillStyle = skin; ell(g, 0, hy + r - 3, 8, 4); }
  if (ch.candy) { const S = srand(9); for (let i = 0; i < 6; i++) { g.fillStyle = SPRINK[i % 5]; circ(g, (S() - .5) * 24, hy + (S() - .6) * 22, 2); } }
  g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 3; g.beginPath(); g.arc(-3, hy - 2, r - 5, Math.PI * 1.15, Math.PI * 1.5); g.stroke();
  const t = hy - r;
  if (ch.hat === 'gorra') { g.fillStyle = '#2f6fd1'; g.beginPath(); g.arc(0, hy - 2, r + 1, Math.PI, 0); g.fill(); g.fillStyle = '#1f4fa8'; g.fillRect(-6, hy - 4, 12, 4); }
  else if (ch.hat === 'corona') { g.fillStyle = '#ffcf3a'; g.beginPath(); g.moveTo(-12, t + 6); for (let i = 0; i <= 4; i++) { g.lineTo(-12 + 6 * i, t - (i % 2 ? 4 : 10)); if (i < 4) g.lineTo(-9 + 6 * i, t); } g.lineTo(12, t + 6); g.closePath(); g.fill(); g.fillStyle = '#ff3d6e'; circ(g, 0, t + 1, 2.5); }
  else if (ch.hat === 'vela') { g.fillStyle = '#fff'; g.fillRect(-3, t - 14, 6, 15); g.fillStyle = '#ff7eb6'; g.fillRect(-3, t - 10, 6, 3); g.fillRect(-3, t - 4, 6, 3); g.fillStyle = '#ffb020'; ell(g, 0, t - 18, 3, 5); }
  else if (ch.hat === 'lazo') { g.fillStyle = '#ff4f98'; g.beginPath(); g.moveTo(0, t + 3); g.lineTo(-10, t - 4); g.lineTo(-10, t + 9); g.closePath(); g.moveTo(0, t + 3); g.lineTo(10, t - 4); g.lineTo(10, t + 9); g.closePath(); g.fill(); g.fillStyle = '#fff'; circ(g, 0, t + 3, 3); }
  else if (ch.hat === 'calabaza') { g.fillStyle = '#ff8a2a'; ell(g, 0, t + 4, 17, 9); g.fillStyle = '#3f9a3a'; g.fillRect(-2, t - 8, 4, 6); }
  else if (ch.hat === 'cereza') { g.fillStyle = '#d11f3a'; circ(g, -5, t + 1, 4); circ(g, 4, t + 2, 4); }
}

// =====================================================================
// Arte: karts (vista trasera)
// =====================================================================
function drawWheel(g, x, y, w, h, type) {
  const R = srand(7); const rad = Math.min(w, h) * .35;
  g.save(); rr(g, x, y, w, h, rad); g.clip();
  if (type === 'donut') {
    g.fillStyle = '#c4844a'; g.fillRect(x, y, w, h); g.fillStyle = '#ff8fc8'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y);
    for (let i = 4; i >= 0; i--) g.lineTo(x + w * i / 4, y + h * (i % 2 ? .62 : .5)); g.closePath(); g.fill(); sprinkles(g, R, x, y, w, h * .5, 8, 2);
  } else if (type === 'galleta') {
    g.fillStyle = '#e0ac6a'; g.fillRect(x, y, w, h); g.fillStyle = '#5a3418'; for (let i = 0; i < 7; i++) circ(g, x + R() * w, y + R() * h, 1.6 + R() * 1.6);
  } else if (type === 'caramelo') {
    g.fillStyle = '#fff'; g.fillRect(x, y, w, h); g.fillStyle = '#e8243c';
    for (let i = -h; i < w + h; i += 9) { g.beginPath(); g.moveTo(x + i, y); g.lineTo(x + i + 4.5, y); g.lineTo(x + i + 4.5 + h, y + h); g.lineTo(x + i + h, y + h); g.fill(); }
  } else if (type === 'gominola') {
    g.fillStyle = '#38c172'; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(255,255,255,.45)'; rr(g, x + w * .18, y + 3, w * .22, h - 6, 3); g.fill();
    g.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 10; i++) circ(g, x + R() * w, y + R() * h, .9);
  } else {
    g.fillStyle = '#fff'; g.fillRect(x, y, w, h); g.fillStyle = '#e8243c'; for (let i = 0; i < h; i += 7) g.fillRect(x, y + i, w, 3.5);
  }
  const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, 'rgba(0,0,0,.35)'); gr.addColorStop(.45, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.3)');
  g.fillStyle = gr; g.fillRect(x, y, w, h); g.restore();
  g.lineWidth = 2; g.strokeStyle = 'rgba(40,20,10,.75)'; rr(g, x, y, w, h, rad); g.stroke();
}
function bodyPath(type) {
  const p = new Path2D();
  if (type === 'chuche') { p.moveTo(-47, -12); p.bezierCurveTo(-50, -44, -30, -50, 0, -50); p.bezierCurveTo(30, -50, 50, -44, 47, -12); p.closePath(); }
  else if (type === 'pastel') rrp(p, -48, -54, 96, 44, 8);
  else if (type === 'piruleta') { p.moveTo(-38, -12); p.lineTo(-31, -42); p.quadraticCurveTo(0, -50, 31, -42); p.lineTo(38, -12); p.closePath(); }
  else if (type === 'bombon') rrp(p, -50, -48, 100, 38, 16);
  else rrp(p, -43, -50, 86, 40, 14);
  return p;
}
function drawDeco(g, deco) {
  const R = srand(3);
  if (deco === 'chispas') sprinkles(g, R, -52, -62, 104, 54, 44, 2.6);
  else if (deco === 'rayas') { g.fillStyle = 'rgba(255,255,255,.55)'; for (let i = -130; i < 110; i += 18) { g.beginPath(); g.moveTo(i, -8); g.lineTo(i + 8, -8); g.lineTo(i + 60, -62); g.lineTo(i + 52, -62); g.fill(); } }
  else if (deco === 'lunares') { g.fillStyle = 'rgba(255,255,255,.85)'; for (let y = -56, k = 0; y < -8; y += 11, k++) for (let x = -54 + (k % 2) * 7; x < 56; x += 14) circ(g, x, y, 3.3); }
  else if (deco === 'glaseado') {
    g.fillStyle = '#fff6fb'; g.beginPath(); g.moveTo(-60, -64); g.lineTo(60, -64); g.lineTo(60, -42);
    for (let x = 60; x >= -60; x -= 10) { const d = (x / 10) % 2 ? 8 + Math.abs(x % 3) * 3 : 0; g.quadraticCurveTo(x - 5, -38 + d + 4, x - 10, -42); }
    g.closePath(); g.fill();
  }
}
function drawBodyRear(g, car) {
  const p = bodyPath(car.body), c = car.paint;
  const gr = g.createLinearGradient(0, -56, 0, -10); gr.addColorStop(0, shade(c, .3)); gr.addColorStop(1, shade(c, -.28));
  g.fillStyle = gr; g.fill(p);
  g.save(); g.clip(p); drawDeco(g, car.deco);
  g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-60, -60, 120, 6); g.restore();
  g.lineWidth = 2.5; g.strokeStyle = shade(c, -.6); g.stroke(p);
  if (car.body === 'galleta') { g.fillStyle = shade(c, .15); for (let i = 0; i < 7; i++) circ(g, -36 + i * 12, -50, 5.5); g.fillStyle = 'rgba(70,35,15,.55)'; [[-25, -32], [18, -38], [-6, -24], [28, -24]].forEach(([x, y]) => circ(g, x, y, 2.5)); }
  if (car.body === 'chuche') { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-40, -40); g.quadraticCurveTo(0, -56, 40, -40); g.lineTo(40, -36); for (let x = 40; x >= -40; x -= 10) g.quadraticCurveTo(x - 5, -30 + ((x / 10) % 2 ? 6 : 0), x - 10, -36); g.closePath(); g.fill(); g.fillStyle = '#d11f3a'; circ(g, 0, -48, 5); }
  if (car.body === 'pastel') {
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-48, -54); g.lineTo(48, -54); g.lineTo(48, -44); for (let x = 48; x >= -48; x -= 12) g.quadraticCurveTo(x - 6, -36 + ((x / 12) % 2 ? 7 : 0), x - 12, -44); g.closePath(); g.fill();
    for (const s of [-1, 1]) { g.fillStyle = '#fff'; g.fillRect(s * 40 - 3, -74, 6, 22); g.fillStyle = '#4fb7ff'; g.fillRect(s * 40 - 3, -70, 6, 3); g.fillRect(s * 40 - 3, -62, 6, 3); g.fillStyle = '#ffb020'; ell(g, s * 40, -78, 3.5, 5.5); g.fillStyle = '#fff3a0'; ell(g, s * 40, -77, 1.5, 3); }
  }
  if (car.body === 'piruleta') for (const s of [-1, 1]) { g.fillStyle = '#f4efe6'; g.fillRect(s * 34 - 2, -66, 4, 28); g.fillStyle = shade(c, .2); circ(g, s * 34, -68, 10); g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.beginPath(); for (let a = 0; a < 4 * Math.PI; a += .3) g.lineTo(s * 34 + Math.cos(a) * a * .7, -68 + Math.sin(a) * a * .7); g.stroke(); }
  if (car.body === 'bombon') { g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; for (const x of [-25, 0, 25]) { g.beginPath(); g.moveTo(x, -46); g.lineTo(x, -12); g.stroke(); } g.fillStyle = '#ffcf3a'; g.fillRect(-50, -18, 100, 6); }
  g.fillStyle = '#ff2d4a'; rr(g, -34, -27, 14, 7, 3); g.fill(); rr(g, 20, -27, 14, 7, 3); g.fill();
  g.fillStyle = '#fff6b0'; g.fillRect(-31, -26, 4, 2); g.fillRect(23, -26, 4, 2);
  g.fillStyle = '#3a2216'; rr(g, -40, -14, 80, 7, 3); g.fill();
}
function drawEngineRear(g, car) {
  const e = car.engine;
  if (e === 'chicle') { g.fillStyle = '#9a9aa8'; g.fillRect(24, -14, 8, 6); g.fillStyle = '#ff7ac3'; circ(g, 36, -12, 9); g.fillStyle = 'rgba(255,255,255,.6)'; circ(g, 33, -15, 3); }
  else if (e === 'barquillo') {
    g.fillStyle = '#c98a3c'; g.fillRect(-30, -62, 6, 12); g.fillRect(24, -62, 6, 12);
    g.fillStyle = '#f0c27a'; rr(g, -50, -68, 100, 10, 3); g.fill(); g.strokeStyle = '#b77b36'; g.lineWidth = 1.5;
    g.beginPath(); for (let x = -46; x < 50; x += 8) { g.moveTo(x, -68); g.lineTo(x + 6, -58); } g.stroke();
  } else if (e === 'mentos') {
    for (const s of [-1, 1]) { g.fillStyle = '#5a3418'; rr(g, s * 18 - 7, -40, 14, 30, 5); g.fill(); g.fillStyle = '#f4f4f4'; ell(g, s * 18, -11, 7, 4); g.fillStyle = '#d0d0d0'; ell(g, s * 18, -11, 4, 2); g.fillStyle = '#e8243c'; g.fillRect(s * 18 - 7, -32, 14, 4); }
  } else { g.fillStyle = '#8a8a98'; for (const s of [-1, 1]) { rr(g, s * 12 - 4, -14, 8, 7, 2); g.fill(); } g.fillStyle = '#333'; circ(g, -12, -10, 2); circ(g, 12, -10, 2); }
}
const KART_CW = 128, KART_CH = 128;
function drawKartRear(g, car, ch, lean = 0) {
  g.save(); g.translate(KART_CW / 2, KART_CH - 4);
  g.fillStyle = 'rgba(0,0,0,.28)'; ell(g, 0, -2, 60, 8);
  const big = car.wheels === 'menta' ? 1.08 : car.wheels === 'gominola' ? 1.12 : 1, ww = 25 * big, wh = 30 * big;
  drawWheel(g, -60, -wh - 1, ww, wh, car.wheels); drawWheel(g, 60 - ww, -wh - 1, ww, wh, car.wheels);
  g.translate(lean * 3, 0); g.rotate(lean * .045);
  g.fillStyle = '#5a3418'; g.fillRect(-42, -22, 84, 6);
  drawDriverBack(g, -82, ch);
  drawBodyRear(g, car);
  drawEngineRear(g, car);
  g.restore();
}
function renderKart(car, ch, lean) { const c = mkCanvas(KART_CW, KART_CH); drawKartRear(c.getContext('2d'), car, ch, lean); return c; }
function renderPortrait(ch, size) { const c = mkCanvas(size, size); drawCharFront(c.getContext('2d'), size / 2, size * .4, size * .26, ch); return c; }

// =====================================================================
// Arte: decorados del circuito
// =====================================================================
const SPR = {};
function addSpr(name, w, h, ww, fn) { const c = mkCanvas(w, h); fn(c.getContext('2d'), w, h); (SPR[name] = SPR[name] || []).push({ c, w: ww }); }
function makeSprites() {
  [['#ff4f8b', '#fff'], ['#5fd3b0', '#fff'], ['#ffd23f', '#ff6b4a'], ['#8f5bff', '#ffd1f0'], ['#4fb7ff', '#fff']].forEach(([a, b]) => addSpr('pirul', 64, 128, .75, g => {
    g.fillStyle = '#f4efe6'; g.fillRect(29, 56, 6, 72); g.fillStyle = '#d8cfc0'; g.fillRect(33, 56, 2, 72);
    g.fillStyle = a; circ(g, 32, 32, 30); g.strokeStyle = b; g.lineWidth = 6; g.beginPath();
    for (let t = 0; t < 6 * Math.PI; t += .2) { const r = t / (6 * Math.PI) * 27; g.lineTo(32 + Math.cos(t) * r, 32 + Math.sin(t) * r); } g.stroke();
    g.fillStyle = 'rgba(255,255,255,.45)'; ell(g, 21, 19, 8, 5, -.5); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; g.beginPath(); g.arc(32, 32, 30, 0, TAU); g.stroke();
  }));
  addSpr('cane', 48, 128, .42, g => {
    g.lineCap = 'round'; const path = () => { g.beginPath(); g.moveTo(30, 122); g.lineTo(30, 30); g.arc(19, 30, 11, 0, Math.PI, true); g.lineTo(8, 40); };
    g.lineWidth = 14; g.strokeStyle = '#a0002a'; path(); g.stroke(); g.lineWidth = 11; g.strokeStyle = '#fff'; path(); g.stroke();
    g.setLineDash([7, 7]); g.strokeStyle = '#e8243c'; path(); g.stroke(); g.setLineDash([]);
  });
  ['#ffd6ea', '#c8f7e6', '#7a4a2a', '#fff3b0'].forEach((fc, i) => addSpr('cupcake', 80, 92, .85, g => {
    g.fillStyle = ['#ff9fc8', '#58c4ff', '#ffd23f', '#b07bff'][i]; g.beginPath(); g.moveTo(12, 50); g.lineTo(68, 50); g.lineTo(60, 90); g.lineTo(20, 90); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 2; for (let x = 18; x < 66; x += 8) { g.beginPath(); g.moveTo(x, 52); g.lineTo(x * .85 + 6, 88); g.stroke(); }
    g.fillStyle = fc; ell(g, 40, 48, 32, 11); ell(g, 40, 37, 25, 10); ell(g, 40, 27, 17, 9); ell(g, 40, 19, 9, 7);
    g.fillStyle = 'rgba(255,255,255,.4)'; ell(g, 30, 34, 8, 3); sprinkles(g, srand(i + 3), 14, 18, 52, 30, 14, 2);
    g.fillStyle = '#d11f3a'; circ(g, 40, 10, 6); g.fillStyle = 'rgba(255,255,255,.6)'; circ(g, 38, 8, 2);
  }));
  ['#ff4f8b', '#5fe3a1', '#ffd23f', '#8f5bff', '#4fb7ff', '#ff8a2a'].forEach(c => addSpr('gumdrop', 64, 56, .55, g => {
    g.fillStyle = c; g.beginPath(); g.moveTo(4, 54); g.bezierCurveTo(4, 4, 60, 4, 60, 54); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(4, 50, 56, 4); g.fillStyle = 'rgba(255,255,255,.4)'; ell(g, 22, 26, 7, 12, .3);
    const R = srand(c.length); g.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 18; i++) circ(g, 10 + R() * 44, 16 + R() * 34, 1.2);
  }));
  [['#ffb3dc', '#ffd6ee'], ['#b3e0ff', '#dff2ff'], ['#d7b3ff', '#efe0ff']].forEach(([a, b], k) => addSpr('cotton', 88, 128, .95, g => {
    g.fillStyle = '#f4efe6'; g.beginPath(); g.moveTo(39, 128); g.lineTo(49, 128); g.lineTo(44, 64); g.fill();
    const R = srand(k + 11); for (let i = 0; i < 14; i++) { g.fillStyle = i < 9 ? a : b; circ(g, 44 + (R() - .5) * 52, 44 + (R() - .5) * 46 - (i > 8 ? 6 : 0), 15 + R() * 10); }
  }));
  addSpr('icecream', 60, 116, .6, g => {
    g.fillStyle = '#e0a85a'; g.beginPath(); g.moveTo(8, 52); g.lineTo(52, 52); g.lineTo(30, 114); g.closePath(); g.fill();
    g.save(); g.clip(); g.strokeStyle = '#b77b36'; g.lineWidth = 2; for (let i = -60; i < 80; i += 8) { g.beginPath(); g.moveTo(i, 50); g.lineTo(i + 60, 116); g.moveTo(i + 60, 50); g.lineTo(i, 116); g.stroke(); } g.restore();
    g.fillStyle = '#ffb3dc'; circ(g, 30, 46, 21); g.fillStyle = '#b8f2dc'; circ(g, 30, 27, 17); g.fillStyle = '#fff3d6'; circ(g, 30, 12, 12);
    g.fillStyle = '#ffb3dc'; for (const x of [14, 24, 40]) ell(g, x, 62, 4, 7); g.fillStyle = '#d11f3a'; circ(g, 30, 2, 4);
  });
  addSpr('mentos', 64, 100, .6, g => {
    for (let k = 0; k < 6; k++) { const y = 92 - k * 15, rx = 27 - k * 3; g.fillStyle = '#d6d6d6'; ell(g, 32, y + 3, rx, 9); g.fillStyle = '#f7f7f7'; ell(g, 32, y, rx, 9); g.fillStyle = '#fff'; ell(g, 26, y - 3, rx * .4, 3); }
  });
  addSpr('rock', 90, 64, .9, g => {
    g.fillStyle = '#4a2a14'; g.beginPath(); g.moveTo(2, 62); g.lineTo(10, 26); g.lineTo(30, 8); g.lineTo(56, 4); g.lineTo(78, 20); g.lineTo(88, 62); g.closePath(); g.fill();
    g.fillStyle = '#7a4a2a'; g.beginPath(); g.moveTo(14, 28); g.lineTo(30, 12); g.lineTo(56, 8); g.lineTo(74, 22); g.lineTo(50, 30); g.closePath(); g.fill();
    g.fillStyle = '#fff3d6'; for (const [x, y] of [[30, 40], [55, 45], [70, 38], [20, 52]]) circ(g, x, y, 3);
  });
  addSpr('sign', 176, 104, 1.7, g => {
    g.fillStyle = '#7a4a2a'; g.fillRect(28, 56, 8, 48); g.fillRect(140, 56, 8, 48);
    g.fillStyle = '#ff5fa2'; rr(g, 4, 4, 168, 64, 16); g.fill(); g.lineWidth = 5; g.strokeStyle = '#fff'; g.stroke();
    g.fillStyle = '#ffe45c'; for (let i = 0; i < 14; i++) { circ(g, 14 + i * 11.4, 6, 2.5); circ(g, 14 + i * 11.4, 66, 2.5); }
    g.font = 'bold 30px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 6; g.strokeStyle = '#8f1d55'; g.strokeText('SUGAR RUSH', 88, 37); g.fillStyle = '#fff'; g.fillText('SUGAR RUSH', 88, 37);
  });
  addSpr('flag', 40, 132, .36, g => {
    g.fillStyle = '#eee'; g.fillRect(4, 0, 4, 132); g.fillStyle = '#ffcf3a'; circ(g, 6, 3, 4);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 6; x++) { g.fillStyle = (x + y) % 2 ? '#222' : '#fff'; g.fillRect(8 + x * 5, 6 + y * 5, 5, 5); }
  });
  addSpr('box', 48, 48, .24, g => {
    const gr = g.createLinearGradient(0, 0, 48, 48); ['#ff5fa2', '#ffd23f', '#5fe3a1', '#4fb7ff', '#b07bff'].forEach((c, i) => gr.addColorStop(i / 4, c));
    g.globalAlpha = .9; g.fillStyle = gr; rr(g, 4, 4, 40, 40, 9); g.fill(); g.globalAlpha = 1; g.lineWidth = 3.5; g.strokeStyle = '#fff'; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.45)'; rr(g, 9, 8, 16, 7, 3); g.fill();
    g.font = 'bold 30px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 4; g.strokeStyle = '#8f1d55'; g.strokeText('?', 24, 26); g.fillStyle = '#fff'; g.fillText('?', 24, 26);
  });
  addSpr('coin', 32, 32, .13, g => {
    g.fillStyle = '#d99a12'; circ(g, 16, 16, 15); g.fillStyle = '#ffcf3a'; circ(g, 16, 16, 12); g.fillStyle = '#fff3b0';
    g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 3.5 : 8; g.lineTo(16 + Math.cos(a) * r, 16 + Math.sin(a) * r); } g.fill();
  });
  addSpr('gum', 72, 28, .4, g => { g.fillStyle = '#e8569f'; ell(g, 36, 17, 34, 10); g.fillStyle = '#ff8ac8'; ell(g, 36, 14, 30, 8); g.fillStyle = 'rgba(255,255,255,.55)'; circ(g, 22, 12, 4); circ(g, 48, 10, 6); circ(g, 34, 16, 3); });
  addSpr('rocket', 48, 48, .2, g => {
    g.fillStyle = 'rgba(255,160,40,.6)'; circ(g, 24, 24, 23); g.fillStyle = '#ff4f8b'; circ(g, 24, 24, 17);
    g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); for (let t = 0; t < 4 * Math.PI; t += .25) { const r = t / (4 * Math.PI) * 15; g.lineTo(24 + Math.cos(t) * r, 24 + Math.sin(t) * r); } g.stroke();
  });
}

// =====================================================================
// Circuitos
// =====================================================================
const SEG = 200, ROADW = 2000, RUMBLE = 3, DRAW = 260, CAMH = 1000, FOV = 100, FOGD = 5, LAPS = 3, KART_W = .3;
const camDepth = 1 / Math.tan((FOV / 2) * Math.PI / 180);
const playerZ = CAMH * camDepth * 1.25;
const TRACKS = [
  {
    name: 'Circuito Arcoíris', desc: 'El gran circuito de Sugar Rush', seed: 3,
    pal: { sky: ['#6fc8ff', '#ffc3e6'], fog: '#ffd2ea', road: ['#9a6440', '#8c5838'], grass: ['#9ff0c4', '#8ce3b2'], rumble: ['#ff4f8b', '#ffd23f', '#5fe3a1', '#4fb7ff', '#b07bff', '#ffffff'], lane: '#fff4c9', mount: ['#ff8ac0', '#c45f9a'], cap: '#ffffff', hills: ['#ffd166', '#ff9f43', '#7ed6a5', '#ff7eb6'], cloud: '#ffffff' },
    deco: ['pirul', 'cane', 'gumdrop', 'cupcake', 'cotton'],
    layout: [[20, 0, 0], [40, 0, 0], [35, -3, 0], [30, 0, 20], [40, 4, -10], [25, 0, -10], [30, -5, 15], [30, 5, 0], [40, 0, -15], [35, 3, 10], [30, -4, -10], [20, 0, 0]],
  },
  {
    name: 'Bosque de Piruletas', desc: 'Curvas entre piruletas gigantes', seed: 17,
    pal: { sky: ['#a98bff', '#ffd6f0'], fog: '#f3d8ff', road: ['#ff9ccc', '#f48ac0'], grass: ['#b9e8ff', '#a6dcf6'], rumble: ['#ffffff', '#7a5cff'], lane: '#ffffff', mount: ['#9fd0ff', '#6f8fe0'], cap: '#ffe6f6', hills: ['#ff7eb6', '#ffd23f', '#b07bff'], cloud: '#fff0fb' },
    deco: ['pirul', 'pirul', 'cotton', 'cane', 'gumdrop'],
    layout: [[20, 0, 0], [30, 4, 0], [30, -4, 0], [25, 6, 10], [30, 0, -10], [30, -6, 0], [25, 3, 15], [25, -3, -15], [35, 5, 0], [30, 0, 0], [25, -5, 0], [20, 0, 0]],
  },
  {
    name: 'Montaña Cola Light', desc: 'Cuestas de Mentos y cola', seed: 29,
    pal: { sky: ['#3b1c55', '#ff9a5c'], fog: '#c9784f', road: ['#5a3a26', '#4d311f'], grass: ['#c98a4b', '#b97d42'], rumble: ['#ffffff', '#3a2216'], lane: '#ffe9c9', mount: ['#6b3a22', '#3a1e10'], cap: '#f7f7f7', hills: ['#8a5530', '#a3683a', '#f4f4f4'], cloud: '#ffd2b0' },
    deco: ['mentos', 'rock', 'cane', 'mentos'],
    layout: [[20, 0, 0], [30, 0, 40], [30, 0, -40], [30, -3, 30], [30, 3, -30], [25, 0, 50], [35, -5, -50], [30, 4, 20], [30, 0, -20], [25, -2, 0], [20, 0, 0]],
  },
  {
    name: 'Cumbres de Helado', desc: 'Nieve de vainilla y bolas de helado', seed: 41,
    pal: { sky: ['#8fd4ff', '#f1fbff'], fog: '#eaf6ff', road: ['#f3d9a8', '#e8cc98'], grass: ['#ffffff', '#eef4ff'], rumble: ['#ff7eb6', '#ffffff'], lane: '#c98a3c', mount: ['#ffffff', '#cfe4ff'], cap: '#ffb3dc', hills: ['#b8f2dc', '#ffb3dc', '#fff3d6'], cloud: '#ffffff' },
    deco: ['icecream', 'gumdrop', 'cupcake', 'icecream'],
    layout: [[20, 0, 0], [35, 2, 20], [35, -2, -20], [30, 6, 0], [30, -6, 0], [40, 0, 30], [30, 4, -30], [30, -4, 0], [30, 3, 10], [25, 0, -10], [20, 0, 0]],
  },
];
function buildTrack(def) {
  const segs = []; let lastY = 0;
  const add = (curve, y) => { const n = segs.length; segs.push({ index: n, p1: { world: { y: lastY, z: n * SEG }, camera: {}, screen: {} }, p2: { world: { y, z: (n + 1) * SEG }, camera: {}, screen: {} }, curve, sprites: [], items: [] }); lastY = y; };
  const road = (en, ho, le, curve, y) => {
    const sy = lastY, ey = sy + y * SEG, t = en + ho + le;
    for (let i = 0; i < en; i++) add(easeIn(0, curve, i / en), easeInOut(sy, ey, (i + 1) / t));
    for (let i = 0; i < ho; i++) add(curve, easeInOut(sy, ey, (en + i + 1) / t));
    for (let i = 0; i < le; i++) add(easeInOut(curve, 0, i / le), easeInOut(sy, ey, (en + ho + i + 1) / t));
  };
  for (const [n, c, h] of def.layout) road(n, n, n, c, h);
  road(15, 15, 15, 0, -lastY / SEG);
  const P = def.pal, N = segs.length, R = srand(def.seed);
  segs.forEach((s, i) => { const band = Math.floor(i / RUMBLE), light = band % 2 === 0; s.color = { road: P.road[light ? 0 : 1], grass: P.grass[light ? 0 : 1], rumble: P.rumble[band % P.rumble.length], lane: light ? P.lane : null }; s.checker = i < 3; });
  const spr = (name, R) => { const v = SPR[name]; return v[R() * v.length | 0]; };
  for (let i = 8; i < N - 2; i += 3 + (R() * 5 | 0)) {
    const side = R() < .5 ? -1 : 1;
    segs[i].sprites.push({ s: spr(def.deco[R() * def.deco.length | 0], R), x: side * (1.3 + R() * 1.8) });
    if (R() < .4) segs[i].sprites.push({ s: spr(def.deco[R() * def.deco.length | 0], R), x: -side * (1.3 + R() * 2) });
  }
  for (const f of [.06, .36, .68]) segs[Math.floor(f * N)].sprites.push({ s: SPR.sign[0], x: (f > .3 && f < .5) ? 1.25 : -1.25 });
  segs[2].sprites.push({ s: SPR.flag[0], x: -1.12 }, { s: SPR.flag[0], x: 1.12 });
  for (const f of [.17, .5, .78]) { const i = Math.floor(f * N); for (const x of [-.66, -.22, .22, .66]) segs[i].items.push({ type: 'box', x, t: 0 }); }
  for (const f of [.1, .28, .42, .62, .9]) { const i0 = Math.floor(f * N), x = (R() - .5) * 1.2; for (let k = 0; k < 6; k++) segs[i0 + k * 3].items.push({ type: 'coin', x: x + Math.sin(k * .7) * .25, taken: false }); }
  return { segs, length: N * SEG, def };
}

// =====================================================================
// Fondo (capas con paralaje)
// =====================================================================
const H = 288; // resolución vertical interna (pixel art)
let VW = 512;
const view = $('#view'), VX = view.getContext('2d');
let BG = null;
function buildBackground(def) {
  const P = def.pal, LW = 1024, LH = H + 60, R = srand(def.seed + 99), base = H / 2 + 30 + 14;
  const clouds = mkCanvas(LW, LH), g1 = clouds.getContext('2d');
  for (let i = 0; i < 10; i++) {
    const x = R() * LW, y = 40 + R() * 80, s = 10 + R() * 14;
    for (const ox of [-LW, 0, LW]) for (let pass = 0; pass < 2; pass++) {
      g1.fillStyle = pass ? P.cloud : 'rgba(255,150,200,.35)';
      for (let k = 0; k < 5; k++) circ(g1, x + ox + (k - 2) * s * .9, y + (pass ? 0 : 4) - (k % 2 ? s * .45 : 0), s * (k === 2 ? 1.2 : .85));
    }
  }
  const mts = mkCanvas(LW, LH), g2 = mts.getContext('2d');
  for (let i = 0; i < 11; i++) {
    const x = i * LW / 11 + R() * 50, w = 130 + R() * 130, h = 55 + R() * 70;
    for (const ox of [-LW, 0, LW]) {
      const cx = x + ox, p = new Path2D();
      p.moveTo(cx - w / 2, LH); p.lineTo(cx - w * .13, base - h + 12); p.quadraticCurveTo(cx, base - h - 10, cx + w * .13, base - h + 12); p.lineTo(cx + w / 2, LH); p.closePath();
      const gr = g2.createLinearGradient(0, base - h, 0, base + 20); gr.addColorStop(0, P.mount[0]); gr.addColorStop(1, P.mount[1]);
      g2.fillStyle = gr; g2.fill(p); g2.save(); g2.clip(p); g2.fillStyle = P.cap; g2.beginPath(); g2.moveTo(cx - w, base - h - 20);
      g2.lineTo(cx + w, base - h - 20); g2.lineTo(cx + w, base - h + h * .28);
      for (let k = 8; k >= -8; k--) g2.lineTo(cx + k * w / 16, base - h + h * (.24 + (k % 2 ? .1 : 0)));
      g2.closePath(); g2.fill(); g2.restore();
    }
  }
  const hills = mkCanvas(LW, LH), g3 = hills.getContext('2d');
  for (let i = 0; i < 16; i++) {
    const x = R() * LW, r = 26 + R() * 38, col = P.hills[R() * P.hills.length | 0];
    for (const ox of [-LW, 0, LW]) { g3.fillStyle = col; ell(g3, x + ox, base + 20, r, r * .75); g3.fillRect(x + ox - r, base + 20, 2 * r, LH); g3.fillStyle = 'rgba(255,255,255,.35)'; ell(g3, x + ox - r * .35, base + 20 - r * .4, r * .2, r * .12, -.4); }
  }
  const sky = VX.createLinearGradient(0, 0, 0, H * .62); sky.addColorStop(0, P.sky[0]); sky.addColorStop(1, P.sky[1]);
  BG = { clouds, mts, hills, sky, rot: [0, 0, 0], fog: P.fog };
}
function drawLayer(img, rot) {
  const iw = img.width, sx = Math.floor(mod(rot, 1) * iw), sw = Math.min(VW, iw - sx);
  VX.drawImage(img, sx, 0, sw, img.height, 0, -30, sw, img.height);
  if (sw < VW) VX.drawImage(img, 0, 0, VW - sw, img.height, sw, -30, VW - sw, img.height);
}

// =====================================================================
// Audio (sintetizado)
// =====================================================================
const SND = { ctx: null, eng: null };
function ac() {
  if (!SND.ctx) { try { SND.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } }
  if (SND.ctx && SND.ctx.state === 'suspended') SND.ctx.resume();
  return SND.ctx;
}
function tone(f, d = .12, type = 'square', v = .06, f2 = null) {
  if (save.muted) return; const a = ac(); if (!a) return; const t = a.currentTime;
  const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + .02);
}
const seq = (notes, step, type = 'square', v = .05) => notes.forEach((f, i) => setTimeout(() => tone(f, step * 1.4 / 1000, type, v), i * step));
const sfx = {
  coin: () => seq([988, 1319], 70), box: () => tone(500, .3, 'triangle', .07, 1300), hit: () => tone(260, .4, 'sawtooth', .08, 50),
  boost: () => tone(250, .6, 'sawtooth', .06, 900), count: () => tone(440, .2, 'square', .06), go: () => tone(880, .5, 'square', .07),
  glitch: () => { for (let i = 0; i < 6; i++) setTimeout(() => tone(rnd(200, 1800), .04, 'square', .05), i * 35); },
  punch: () => tone(140, .35, 'square', .09, 40), bump: () => tone(160, .08, 'triangle', .06), use: () => tone(500, .12, 'triangle', .06, 760),
  lap: () => seq([660, 880, 1100], 100), win: () => seq([523, 659, 784, 1047, 1319], 140), lose: () => seq([523, 440, 349], 180, 'triangle'),
  click: () => tone(720, .05, 'triangle', .04), buy: () => seq([784, 1047, 1319, 1568], 70), shield: () => seq([1200, 900], 60, 'triangle'),
};
function engineStart() {
  if (save.muted || SND.eng) return; const a = ac(); if (!a) return;
  const o = a.createOscillator(), o2 = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain();
  o.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 500; g.gain.value = .022;
  o.connect(f); o2.connect(f); f.connect(g).connect(a.destination); o.frequency.value = 55; o2.frequency.value = 28; o.start(); o2.start();
  SND.eng = { o, o2, g };
}
function engineSet(sp) { if (!SND.eng) return; const t = SND.ctx.currentTime; SND.eng.o.frequency.setTargetAtTime(55 + sp * 140, t, .05); SND.eng.o2.frequency.setTargetAtTime(28 + sp * 70, t, .05); }
function engineStop() { if (SND.eng) { try { SND.eng.o.stop(); SND.eng.o2.stop(); } catch (e) { } SND.eng = null; } }

// =====================================================================
// Carrera
// =====================================================================
let track = null, racers = [], player = null, hazards = [], shots = [], race = null;
const input = { left: false, right: false, brake: false };

function makeRacer(char, car, opts) {
  const st = carStats(car), maxSpeed = 10200 + st.vel * 700;
  return {
    char, car, st, name: opts.name, isPlayer: !!opts.player, ai: opts.ai || null, glitcher: !!opts.glitcher,
    maxSpeed, accelRate: maxSpeed / (4.2 - st.acel * .5), steerRate: 2 * (.75 + st.man * .13), centri: .22 * (1.3 - st.man * .1),
    offMax: maxSpeed * (.3 + st.trac * .07), dist: 0, x: 0, speed: 0, steer: 0, lastSeg: 0, pos: 8,
    boost: 0, spin: 0, gum: 0, shield: 0, inv: 0, glitch: 0, items: [null, null], itemDelay: 0, finished: false, finishTime: 0,
    spr: [-1, 0, 1].map(l => renderKart(car, char, l)), portrait: renderPortrait(char, 64),
  };
}
function startRace(ti, opts) {
  const def = TRACKS[ti]; track = buildTrack(def); buildBackground(def);
  player = makeRacer(save.char, save.car, { player: true, name: save.char.name || 'Tú' });
  const diff = DIFFS[opts.diff];
  const rivals = RIVALS.map(r => { const m = makeRacer(r.char, r.car, { name: r.name, glitcher: r.glitch, ai: { lane: rnd(-.6, .6), laneT: rnd(1, 3), skill: r.skill } }); m.maxSpeed = 11600 * diff.mul * r.skill; m.accelRate = m.maxSpeed / 3; return m; });
  racers = [...rivals, player];
  let order;
  if (opts.cup && opts.cup.race > 0) order = [...racers].sort((a, b) => (opts.cup.points[b.name] || 0) - (opts.cup.points[a.name] || 0));
  else order = [...rivals.sort(() => Math.random() - .5), player];
  order.forEach((r, i) => { const row = i >> 1; r.dist = -(SEG * 2 + row * 520 + (i % 2) * 260); r.x = i % 2 ? .42 : -.42; r.lastSeg = Math.floor(mod(r.dist, track.length) / SEG); });
  hazards = []; shots = [];
  race = { ti, opts, state: 'countdown', count: 3.99, lastCount: 4, time: 0, coins: 0, shake: 0, glitchFx: 0, endT: 0, paused: false, toastT: 0, lapShown: 1 };
  APP.mode = 'race'; UI.innerHTML = ''; $('#hud').classList.remove('hidden'); $('#controls').classList.remove('hidden');
  hudCache = {}; resize(); engineStart();
}
function findSeg(z) { return track.segs[Math.floor(z / SEG) % track.segs.length]; }
function toast(msg, t = 1.6) { const el = $('#toast'); el.textContent = msg; el.classList.add('on'); race.toastT = t; }

function update(dt) {
  if (race.shake > 0) race.shake -= dt; if (race.glitchFx > 0) race.glitchFx -= dt;
  if (race.toastT > 0 && (race.toastT -= dt) <= 0) $('#toast').classList.remove('on');
  for (const s of track.segs) for (const it of s.items) if (it.t > 0) it.t -= dt;
  if (race.state === 'countdown') {
    race.count -= dt; const c = Math.ceil(race.count);
    if (c !== race.lastCount) { race.lastCount = c; const el = $('#countdown'); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); el.textContent = c > 0 ? c : '¡YA!'; c > 0 ? sfx.count() : sfx.go(); }
    if (race.count <= 0) race.state = 'race';
    engineSet(0); return;
  }
  race.time += dt;
  const L = track.length;
  for (const r of racers) updateRacer(r, dt, L);
  // fondo con paralaje
  const ps = findSeg(mod(player.dist, L)); const d = player.speed * dt / SEG * ps.curve;
  BG.rot[0] += .0008 * d; BG.rot[1] += .0016 * d; BG.rot[2] += .0026 * d;
  // choques entre karts
  for (let i = 0; i < racers.length; i++) for (let j = i + 1; j < racers.length; j++) {
    const a = racers[i], b = racers[j], dz = b.dist - a.dist, dx = b.x - a.x;
    if (Math.abs(dz) < 170 && Math.abs(dx) < .26 && a.glitch <= 0 && b.glitch <= 0) {
      const back = dz > 0 ? a : b, front = dz > 0 ? b : a; back.speed = Math.min(back.speed, front.speed * .93);
      const push = (.27 - Math.abs(dx)) * .5, s = Math.sign(a.x - b.x) || 1, wa = a.st.peso, wb = b.st.peso;
      a.x += s * push * 2 * wb / (wa + wb); b.x -= s * push * 2 * wa / (wa + wb);
      if (a.isPlayer || b.isPlayer) sfx.bump();
    }
  }
  updateHazards(dt);
  // clasificación
  const ord = [...racers].sort((a, b) => (b.finished - a.finished) || (a.finished && b.finished ? a.finishTime - b.finishTime : b.dist - a.dist));
  ord.forEach((r, i) => r.pos = i + 1);
  engineSet(player.speed / player.maxSpeed);
  if (race.state === 'finish' && (race.endT -= dt) <= 0) endRace();
}
function updateRacer(r, dt, L) {
  for (const k of ['boost', 'spin', 'gum', 'shield', 'inv', 'glitch', 'itemDelay']) if (r[k] > 0) r[k] -= dt;
  r.items.forEach(it => { if (it && it.roll > 0) { it.roll -= dt; if (it.roll <= 0 && r.isPlayer) sfx.box(); } });
  const seg = findSeg(mod(r.dist, L)), sp = r.speed / r.maxSpeed, off = Math.abs(r.x) > 1;
  let target = r.maxSpeed;
  if (r.ai) {
    const gap = player.dist - r.dist; target *= gap > 2500 ? 1 + Math.min(.09, (gap - 2500) / 40000) : gap < -6000 ? .94 : 1;
  }
  if (r.finished) target *= .55;
  if (r.boost > 0) target *= 1.32;
  if (r.gum > 0) target *= .35;
  if (off && r.boost <= 0) target = Math.min(target, r.offMax);
  const braking = r.isPlayer && input.brake && !r.finished;
  if (r.spin > 0) r.speed = Math.max(0, r.speed - r.maxSpeed * 1.4 * dt);
  else if (braking) r.speed = Math.max(0, r.speed - r.maxSpeed * 1.2 * dt);
  else if (r.speed < target) r.speed = Math.min(target, r.speed + r.accelRate * dt * (r.boost > 0 ? 2.5 : 1));
  else r.speed = Math.max(target, r.speed - r.maxSpeed * (off ? 1.1 : .45) * dt);
  if (r.isPlayer && !r.finished) {
    const dir = (input.left ? -1 : 0) + (input.right ? 1 : 0);
    r.steer = lerp(r.steer, dir, Math.min(1, dt * 10));
    if (r.spin <= 0) r.x += dt * r.steerRate * Math.max(sp, r.speed > 50 ? .3 : 0) * r.steer;
    r.x -= dt * 2 * sp * sp * seg.curve * r.centri;
    // choque con decorados fuera de pista
    if (off) for (const s of seg.sprites) {
      const w = s.s.w * .5, x0 = s.x < 0 ? s.x - w * 1.5 : s.x + w * .5, x1 = x0 + w;
      if (r.x + .13 > x0 && r.x - .13 < x1) { r.speed = Math.min(r.speed, r.maxSpeed * .2); r.x += r.x > 0 ? -.12 : .12; sfx.bump(); race.shake = .2; break; }
    }
  } else if (r.ai) {
    const ai = r.ai; ai.laneT -= dt; if (ai.laneT <= 0) { ai.lane = rnd(-.65, .65); ai.laneT = rnd(2, 5); }
    let tx = ai.lane - seg.curve * .05;
    for (const o of racers) { if (o === r) continue; const dz = o.dist - r.dist; if (dz > 0 && dz < 900 && Math.abs(o.x - tx) < .3) tx += o.x > r.x ? -.36 : .36; }
    tx = clamp(tx, -.82, .82); const nx = lerp(r.x, tx, Math.min(1, dt * 1.4)); r.steer = clamp((nx - r.x) / dt * .8, -1, 1); r.x = nx;
    if (r.items[0] && r.itemDelay <= 0) useSuper(r, 0);
    if (r.glitcher && Math.random() < dt * .06 && r.pos > 1) { r.glitch = .5; r.dist += 500; }
  } else r.steer *= .9;
  r.x = clamp(r.x, -2.6, 2.6);
  r.dist += r.speed * dt;
  // recoger cajas y monedas
  const si = Math.floor(mod(r.dist, L) / SEG), N = track.segs.length, steps = mod(si - r.lastSeg, N);
  if (steps < 20) for (let k = 1; k <= steps; k++) pickups(r, track.segs[(r.lastSeg + k) % N]);
  r.lastSeg = si;
  // vueltas y meta
  const lap = Math.floor(r.dist / L) + 1;
  if (r.isPlayer && lap > race.lapShown && lap <= LAPS) { race.lapShown = lap; sfx.lap(); toast(lap === LAPS ? '¡ÚLTIMA VUELTA!' : `VUELTA ${lap}`); }
  if (!r.finished && r.dist >= LAPS * L) {
    r.finished = true; r.finishTime = race.time;
    if (r.isPlayer) { race.state = 'finish'; race.endT = 3.2; const pos = racers.filter(o => o.finished).length; toast(pos === 1 ? '¡VICTORIA!' : `¡META! ${pos}º`, 3); pos <= 3 ? sfx.win() : sfx.lose(); }
  }
}
function pickups(r, seg) {
  for (const it of seg.items) {
    if (it.type === 'box' && it.t <= 0 && Math.abs(it.x - r.x) < .2) {
      it.t = 4; const slot = r.items[0] ? (r.items[1] ? -1 : 1) : 0;
      if (slot >= 0) { r.items[slot] = { type: rollItem(r), roll: r.isPlayer ? .9 : 0 }; r.itemDelay = rnd(1, 4); if (r.isPlayer) sfx.use(); }
    } else if (it.type === 'coin' && !it.taken && r.isPlayer && Math.abs(it.x - r.x) < .2) { it.taken = true; race.coins++; sfx.coin(); }
  }
}
function rollItem(r) {
  const p = r.pos, w = p <= 2 ? { chicle: 4, escudo: 3, cohete: 2, turbo: 1 } : p <= 5 ? { chicle: 2, escudo: 2, cohete: 3, turbo: 3, punio: 2, glitch: 1 } : { turbo: 4, glitch: 3, punio: 3, cohete: 3, escudo: 1 };
  let t = Object.values(w).reduce((a, b) => a + b, 0) * Math.random();
  for (const k in w) if ((t -= w[k]) <= 0) return k; return 'turbo';
}
function nextAhead(r) { let best = null, bd = 1e9; for (const o of racers) { const d = o.dist - r.dist; if (o !== r && d > 0 && d < bd) { bd = d; best = o; } } return best; }
function useSuper(r, i) {
  const it = r.items[i]; if (!it || it.roll > 0 || race.state === 'countdown') return;
  r.items[i] = null; if (i === 0 && r.items[1] && !r.isPlayer) { r.items[0] = r.items[1]; r.items[1] = null; r.itemDelay = rnd(2, 5); }
  const me = r.isPlayer, near = Math.abs(r.dist - player.dist) < 3000;
  switch (it.type) {
    case 'turbo': r.boost = 2.2; if (me || near) sfx.boost(); break;
    case 'glitch': r.glitch = .7; r.inv = 1.6; r.dist += 1500; r.x = clamp(r.x, -.8, .8); if (me) { race.glitchFx = .5; } if (me || near) sfx.glitch(); break;
    case 'escudo': r.shield = 12; if (me) { sfx.shield(); toast('🔨 ¡Lo arreglaré!', 1.2); } break;
    case 'punio':
      for (const o of racers) { const d = o.dist - r.dist; if (o !== r && d > -350 && d < 1400 && Math.abs(o.x - r.x) < 1.1) hit(o); }
      if (me || near) { race.shake = .45; sfx.punch(); } if (me) toast('👊 ¡VOY A DESTROZARLO!', 1.2); break;
    case 'chicle': hazards.push({ dist: r.dist - 280, x: r.x, life: 30, owner: r, safe: .6 }); if (me) sfx.use(); break;
    case 'cohete': shots.push({ dist: r.dist + 150, x: r.x, speed: Math.max(r.speed, 8000) + 7000, target: nextAhead(r), life: 5, owner: r }); if (me || near) sfx.boost(); break;
  }
}
function hit(o) {
  if (o.inv > 0 || o.glitch > 0) return;
  if (o.shield > 0) { o.shield = 0; if (o.isPlayer) { sfx.shield(); toast('🔨 ¡Félix lo ha arreglado!', 1.2); } return; }
  o.spin = 1.25 - o.st.peso * .08; o.speed *= .4;
  if (o.isPlayer) { sfx.hit(); race.shake = .35; }
}
function updateHazards(dt) {
  for (const h of hazards) {
    h.life -= dt; h.safe -= dt;
    for (const o of racers) if ((o !== h.owner || h.safe <= 0) && Math.abs(o.dist - h.dist) < 160 && Math.abs(o.x - h.x) < .3) {
      h.life = 0; if (o.inv > 0 || o.glitch > 0) break;
      if (o.shield > 0) { o.shield = 0; break; } o.gum = 1.7; if (o.isPlayer) { sfx.hit(); toast('🍬 ¡Pegado en chicle!', 1); } break;
    }
  }
  hazards = hazards.filter(h => h.life > 0);
  for (const s of shots) {
    s.life -= dt; s.dist += s.speed * dt; if (s.target) s.x = lerp(s.x, s.target.x, Math.min(1, dt * 5));
    for (const o of racers) if (o !== s.owner && Math.abs(o.dist - s.dist) < 180 && Math.abs(o.x - s.x) < .32) { hit(o); s.life = 0; break; }
  }
  shots = shots.filter(s => s.life > 0);
}
function endRace() {
  race.state = 'done'; engineStop();
  const ord = [...racers].sort((a, b) => (b.finished - a.finished) || (a.finished && b.finished ? a.finishTime - b.finishTime : b.dist - a.dist));
  const pos = ord.indexOf(player) + 1, diff = DIFFS[race.opts.diff];
  const prize = Math.round(PRIZES[pos - 1] * diff.prize), earned = prize + race.coins;
  save.coins += earned;
  const key = race.ti + ''; if (!save.best[key] || player.finishTime < save.best[key]) save.best[key] = player.finishTime;
  persist();
  const cup = race.opts.cup; if (cup) { ord.forEach((r, i) => cup.points[r.name] = (cup.points[r.name] || 0) + POINTS[i]); cup.race++; }
  $('#hud').classList.add('hidden'); $('#controls').classList.add('hidden');
  show('results', { ord, pos, prize, coins: race.coins, earned });
}

// =====================================================================
// Render del mundo
// =====================================================================
function project(p, cx, cy, cz) {
  p.camera.x = -cx; p.camera.y = p.world.y - cy; p.camera.z = p.world.z - cz;
  const s = p.screen.scale = camDepth / p.camera.z;
  p.screen.x = Math.round(VW / 2 + s * p.camera.x * VW / 2); p.screen.y = Math.round(H / 2 - s * p.camera.y * H / 2); p.screen.w = Math.round(s * ROADW * VW / 2);
}
function poly(x1, y1, x2, y2, x3, y3, x4, y4, col) { VX.fillStyle = col; VX.beginPath(); VX.moveTo(x1, y1); VX.lineTo(x2, y2); VX.lineTo(x3, y3); VX.lineTo(x4, y4); VX.closePath(); VX.fill(); }
function drawSegment(seg, x1, y1, w1, x2, y2, w2, fog) {
  const c = seg.color;
  VX.fillStyle = c.grass; VX.fillRect(0, y2, VW, y1 - y2);
  const r1 = w1 / 6, r2 = w2 / 6;
  poly(x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2, c.rumble);
  poly(x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, c.rumble);
  if (seg.checker) { for (let k = 0; k < 10; k++) { const a = -1 + k / 5, b = a + .2; poly(x1 + w1 * a, y1, x1 + w1 * b, y1, x2 + w2 * b, y2, x2 + w2 * a, y2, (k + seg.index) % 2 ? '#222' : '#fff'); } }
  else poly(x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, c.road);
  if (c.lane) { const l1 = w1 / 28, l2 = w2 / 28; for (const f of [-1 / 3, 1 / 3]) { const a = x1 + w1 * f, b = x2 + w2 * f; poly(a - l1, y1, a + l1, y1, b + l2, y2, b - l2, y2, c.lane); } }
  if (fog < 1) { VX.globalAlpha = 1 - fog; VX.fillStyle = BG.fog; VX.fillRect(0, y2, VW, y1 - y2); VX.globalAlpha = 1; }
}
function drawSprite(sp, scale, x, y, ox, clip, bob = 0) {
  const img = sp.c, dw = sp.w * ROADW * scale * VW / 2, dh = dw * img.height / img.width;
  const dx = x + dw * ox, dy = y - dh - bob * dh;
  if (dw < 1 || dx > VW || dx + dw < 0 || dy > clip) return;
  const clipH = Math.max(0, dy + dh - clip);
  if (clipH < dh) VX.drawImage(img, 0, 0, img.width, img.height * (1 - clipH / dh), dx, dy, dw, dh - clipH);
}
function drawRacer(r, sx, sy, scale, clip) {
  const img = r.spr[r.steer < -.3 ? 0 : r.steer > .3 ? 2 : 1];
  const dw = KART_W * ROADW * scale * VW / 2, dh = dw * img.height / img.width;
  if (dw < 2 || dw > VW * 1.2) return;
  const x = sx - dw / 2, y = sy - dh, c = VX;
  c.save(); c.beginPath(); c.rect(0, 0, VW, clip); c.clip();
  if (r.boost > 0) for (const s of [-1, 1]) { const f = rnd(.8, 1.3); c.fillStyle = 'rgba(255,120,30,.9)'; ell(c, sx + s * dw * .17, sy - dh * .1, dw * .07, dw * .1 * f); c.fillStyle = '#fff38a'; ell(c, sx + s * dw * .17, sy - dh * .1, dw * .035, dw * .05 * f); }
  if (r.spin > 0) { c.translate(sx, 0); c.scale(Math.cos(r.spin * 14) || .1, 1); c.translate(-sx, 0); }
  if (r.glitch > 0 || (r.glitcher && Math.random() < .015)) {
    for (let k = 0; k < 6; k++) c.drawImage(img, 0, k * img.height / 6, img.width, img.height / 6, x + rnd(-dw * .18, dw * .18), y + k * dh / 6, dw, dh / 6);
    c.fillStyle = Math.random() < .5 ? 'rgba(0,255,240,.35)' : 'rgba(255,0,200,.35)'; c.fillRect(x + rnd(-5, dw * .6), y + rnd(0, dh * .8), dw * .4, dh * .12);
  } else c.drawImage(img, x, y, dw, dh);
  if (r.gum > 0) { c.fillStyle = '#ff7ac3'; ell(c, sx - dw * .38, sy - dh * .13, dw * .13, dh * .1); ell(c, sx + dw * .38, sy - dh * .13, dw * .13, dh * .1); }
  if (r.shield > 0) { c.globalAlpha = .45 + .25 * Math.sin(race.time * 10); c.strokeStyle = '#ffd23f'; c.lineWidth = Math.max(1, dw * .03); c.beginPath(); c.ellipse(sx, sy - dh * .45, dw * .6, dh * .55, 0, 0, TAU); c.stroke(); c.globalAlpha = .12; c.fillStyle = '#fff3a0'; c.fill(); c.globalAlpha = 1; }
  c.restore();
  if (!r.isPlayer && dw > 30) {
    c.font = `bold ${clamp(dw * .13, 7, 11) | 0}px Fredoka, sans-serif`; c.textAlign = 'center'; c.lineWidth = 2.5; c.strokeStyle = 'rgba(110,20,60,.85)'; c.fillStyle = '#fff';
    c.strokeText(r.name, sx, y + dh * .08); c.fillText(r.name, sx, y + dh * .08);
  }
}
function render() {
  const L = track.length, N = track.segs.length;
  const camZ = mod(player.dist - playerZ, L), base = findSeg(camZ), bp = (camZ % SEG) / SEG;
  const pz = mod(player.dist, L), pseg = findSeg(pz), pp = (pz % SEG) / SEG;
  const playerY = lerp(pseg.p1.world.y, pseg.p2.world.y, pp);
  VX.save(); if (race.shake > 0) VX.translate(rnd(-3, 3) | 0, rnd(-2, 2) | 0);
  VX.fillStyle = BG.sky; VX.fillRect(-4, -4, VW + 8, H + 8);
  drawLayer(BG.clouds, BG.rot[0]); drawLayer(BG.mts, BG.rot[1]); drawLayer(BG.hills, BG.rot[2]);
  let maxy = H, x = 0, dx = -(base.curve * bp);
  for (let n = 0; n < DRAW; n++) {
    const seg = track.segs[(base.index + n) % N], looped = seg.index < base.index, cz = camZ - (looped ? L : 0);
    seg.clip = maxy; seg.fog = 1 / Math.exp((n / DRAW) * (n / DRAW) * FOGD);
    project(seg.p1, player.x * ROADW - x, playerY + CAMH, cz); project(seg.p2, player.x * ROADW - x - dx, playerY + CAMH, cz);
    x += dx; dx += seg.curve;
    const a = seg.p1.screen, b = seg.p2.screen;
    if (seg.p1.camera.z <= camDepth || b.y >= a.y || b.y >= maxy) continue;
    let x1 = a.x, y1 = a.y, w1 = a.w;
    if (y1 > maxy) { const t = (maxy - b.y) / (a.y - b.y); x1 = b.x + (a.x - b.x) * t; w1 = b.w + (a.w - b.w) * t; y1 = maxy; }
    drawSegment(seg, x1, y1, w1, b.x, b.y, b.w, seg.fog);
    maxy = b.y;
  }
  // objetos dinámicos por segmento
  const dyn = new Map(); const put = (z, o) => { const i = Math.floor(mod(z, L) / SEG); o.pct = (mod(z, L) % SEG) / SEG; (dyn.get(i) || dyn.set(i, []).get(i)).push(o); };
  for (const r of racers) if (r !== player) put(r.dist, { r });
  for (const h of hazards) put(h.dist, { s: SPR.gum[0], x: h.x });
  for (const s of shots) put(s.dist, { s: SPR.rocket[0], x: s.x, bob: .3 });
  const bob = Math.sin(race.time * 5) * .12 + .15;
  for (let n = DRAW - 1; n > 0; n--) {
    const seg = track.segs[(base.index + n) % N], a = seg.p1.screen, b = seg.p2.screen;
    if (seg.p1.camera.z <= camDepth) continue;
    for (const s of seg.sprites) drawSprite(s.s, a.scale, a.x + a.scale * s.x * ROADW * VW / 2, a.y, s.x < 0 ? -1 : 0, seg.clip);
    for (const it of seg.items) {
      if (it.type === 'box' && it.t <= 0) drawSprite(SPR.box[0], a.scale, a.x + a.scale * it.x * ROADW * VW / 2, a.y, -.5, seg.clip, bob);
      else if (it.type === 'coin' && !it.taken) drawSprite(SPR.coin[0], a.scale, a.x + a.scale * it.x * ROADW * VW / 2, a.y, -.5, seg.clip, .4 + bob);
    }
    const list = dyn.get(seg.index);
    if (list) {
      list.sort((u, v) => u.pct - v.pct).reverse();
      for (const o of list) {
        const sc = lerp(a.scale, b.scale, o.pct), sx = lerp(a.x, b.x, o.pct), sy = lerp(a.y, b.y, o.pct);
        if (o.r) drawRacer(o.r, sx + sc * o.r.x * ROADW * VW / 2, sy, sc, seg.clip);
        else drawSprite(o.s, sc, sx + sc * o.x * ROADW * VW / 2, sy, -.5, seg.clip, o.bob || 0);
      }
    }
    if (seg === pseg) {
      const ps = camDepth / playerZ, py = H / 2 - ps * lerp(pseg.p1.camera.y, pseg.p2.camera.y, pp) * H / 2;
      const jig = Math.abs(player.x) > 1 && player.speed > 500 ? (Math.random() * 2 | 0) : 0;
      drawRacer(player, VW / 2, py - jig, ps, H);
    }
  }
  VX.restore();
  // efectos de pantalla
  if (player.boost > 0) { VX.strokeStyle = 'rgba(255,255,255,.55)'; VX.lineWidth = 1.5; VX.beginPath(); for (let i = 0; i < 12; i++) { const a = rnd(0, TAU), r0 = rnd(.35, .5) * VW, r1 = r0 + rnd(30, 70); VX.moveTo(VW / 2 + Math.cos(a) * r0, H * .55 + Math.sin(a) * r0 * .6); VX.lineTo(VW / 2 + Math.cos(a) * r1, H * .55 + Math.sin(a) * r1 * .6); } VX.stroke(); }
  if (race.glitchFx > 0) {
    for (let k = 0; k < 9; k++) { const y = rnd(0, H) | 0, h = rnd(2, 16) | 0; VX.drawImage(view, 0, y, VW, h, rnd(-24, 24) | 0, y, VW, h); }
    VX.globalAlpha = .25; VX.fillStyle = '#00fff0'; VX.fillRect(0, rnd(0, H), VW, rnd(4, 20)); VX.fillStyle = '#ff00c8'; VX.fillRect(0, rnd(0, H), VW, rnd(4, 20)); VX.globalAlpha = 1;
  }
}

// =====================================================================
// HUD
// =====================================================================
let hudCache = {};
function setText(id, v, html) { if (hudCache[id] !== v) { hudCache[id] = v; const el = $(id); html ? el.innerHTML = v : el.textContent = v; } }
function fmtTime(t) { const m = Math.floor(t / 60), s = t % 60; return `${m}:${s < 10 ? '0' : ''}${s.toFixed(2)}`; }
function hud() {
  setText('#hudPos', `${player.pos}<small>º</small>`, true);
  setText('#hudLap', `VUELTA ${clamp(Math.floor(player.dist / track.length) + 1, 1, LAPS)}/${LAPS}`);
  setText('#hudTime', fmtTime(race.time));
  setText('#hudCoins', `🪙 ${race.coins}`);
  const keys = Object.keys(SUPERS);
  player.items.forEach((it, i) => {
    const el = $(i ? '#cS2' : '#cS1'), icon = it ? (it.roll > 0 ? SUPERS[keys[(race.time * 14 | 0) % keys.length]].icon : SUPERS[it.type].icon) : '';
    setText(i ? '#cS2 span' : '#cS1 span', icon); el.classList.toggle('ready', !!it && it.roll <= 0);
  });
}

// =====================================================================
// Controles
// =====================================================================
const pointers = new Map();
const CTL = ['left', 'right', 'brake', 's1', 's2'].map(k => ({ k, el: $(`[data-k="${k}"]`), on: false }));
function refreshTouch() {
  for (const c of CTL) {
    const r = c.el.getBoundingClientRect(), pad = 12; let on = false;
    if (r.width) for (const p of pointers.values()) if (p.x > r.left - pad && p.x < r.right + pad && p.y > r.top - pad && p.y < r.bottom + pad) { on = true; break; }
    if (on && !c.on && (c.k === 's1' || c.k === 's2') && player) useSuper(player, c.k === 's1' ? 0 : 1);
    c.on = on; c.el.classList.toggle('on', on);
  }
  input.left = CTL[0].on || keys.left; input.right = CTL[1].on || keys.right; input.brake = CTL[2].on || keys.brake;
}
function onPtr(e) {
  if (APP.mode !== 'race' || race.paused) return;
  if (e.type === 'pointerup' || e.type === 'pointercancel') pointers.delete(e.pointerId);
  else if (e.type === 'pointerdown' || pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  refreshTouch();
}
['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach(t => window.addEventListener(t, onPtr, { passive: true }));
const keys = { left: false, right: false, brake: false };
const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowDown: 'brake', KeyS: 'brake', Space: 'brake' };
window.addEventListener('keydown', e => {
  if (APP.mode !== 'race') return;
  if (KEYMAP[e.code]) { keys[KEYMAP[e.code]] = true; e.preventDefault(); }
  if (!e.repeat && (e.code === 'KeyZ' || e.code === 'KeyJ' || e.code === 'KeyQ')) useSuper(player, 0);
  if (!e.repeat && (e.code === 'KeyX' || e.code === 'KeyK' || e.code === 'KeyE')) useSuper(player, 1);
  if (e.code === 'Escape' || e.code === 'KeyP') togglePause();
  refreshTouch();
});
window.addEventListener('keyup', e => { if (KEYMAP[e.code]) { keys[KEYMAP[e.code]] = false; refreshTouch(); } });
window.addEventListener('contextmenu', e => e.preventDefault());
$('#btnPause').addEventListener('click', () => togglePause());
function togglePause() {
  if (APP.mode !== 'race' || race.state === 'done') return;
  race.paused = !race.paused; pointers.clear(); refreshTouch();
  if (race.paused) { engineStop(); show('pause'); } else { UI.innerHTML = ''; engineStart(); }
}
document.addEventListener('visibilitychange', () => { if (document.hidden && APP.mode === 'race' && !race.paused) togglePause(); });

// =====================================================================
// Interfaz (menús)
// =====================================================================
const UI = $('#screens');
const APP = { mode: 'menu', screen: null, draft: null, tab: null, sel: null, quick: 0 };
let acts = {};
UI.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b) return; sfx.click(); acts[b.dataset.act] && acts[b.dataset.act](b.dataset.v, b); });
UI.addEventListener('input', e => { if (e.target.dataset.in && acts[e.target.dataset.in]) acts[e.target.dataset.in](e.target.value); });
function show(name, arg) {
  const pane = UI.querySelector('.pane'), keep = APP.screen === name && pane ? pane.scrollTop : 0;
  APP.screen = name; acts = {}; SCREENS[name](arg);
  const np = UI.querySelector('.pane'); if (np) np.scrollTop = keep;
}
function paint(sel, fn, w, h) { const c = UI.querySelector(sel); if (!c) return; const d = Math.min(2, devicePixelRatio || 1); c.width = w * d; c.height = h * d; const g = c.getContext('2d'); g.scale(d, d); fn(g, w, h); }
const coinsHtml = () => `<div class="coins">🪙 ${save.coins}</div>`;
const esc = s => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
function goFull() {
  const d = document.documentElement;
  try { const p = d.requestFullscreen ? d.requestFullscreen({ navigationUI: 'hide' }) : d.webkitRequestFullscreen && d.webkitRequestFullscreen(); if (p && p.then) p.then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => { })).catch(() => { }); } catch (e) { }
}
function drawShowroom(g, w, h, car, ch, front = true) {
  if (front) drawCharFront(g, w * .3, h * .36, h * .2, ch);
  const k = Math.min(w * (front ? .52 : .9), h * (front ? .55 : .9)) / KART_CW;
  g.save(); g.translate(front ? w * .68 : w / 2, front ? h * .97 : h * .95); g.scale(k, k); g.translate(-KART_CW / 2, -KART_CH); drawKartRear(g, car, ch, 0); g.restore();
}
function statBars(st, prev) {
  return `<div class="stats">${Object.keys(STAT_NAMES).map(k => {
    const v = st[k] / 5 * 100, p = prev ? prev[k] / 5 * 100 : v;
    const delta = p !== v ? `<b class="${v > p ? 'up' : 'dn'}" style="left:${Math.min(v, p)}%;width:${Math.abs(v - p)}%"></b>` : '';
    return `<div class="stat"><span>${STAT_NAMES[k]}</span><div class="bar"><i style="width:${Math.min(v, p)}%"></i>${delta}</div></div>`;
  }).join('')}</div>`;
}
const SCREENS = {
  title() {
    UI.innerHTML = `<div class="scr title" data-act="start"><div class="logo"><span>SUGAR RUSH</span><small>KART</small></div>
      <div class="tap">Toca para empezar</div><div class="hint">Móvil en horizontal · PC: flechas para girar, ↓ o espacio para frenar, Z / X supers</div></div>`;
    acts.start = () => { goFull(); ac(); if (save.created) show('menu'); else { APP.draft = { ...save.char }; show('creator', true); } };
  },
  creator(first) {
    const d = APP.draft, sw = (key, list) => list.map(c => `<button class="sw ${d[key] === c ? 'on' : ''}" style="background:${c}" data-act="set" data-v="${key}|${c}"></button>`).join('');
    const ch = (key, obj) => Object.entries(obj).map(([k, n]) => `<button class="chip ${d[key] === k ? 'on' : ''}" data-act="set" data-v="${key}|${k}">${n}</button>`).join('');
    UI.innerHTML = `<div class="scr"><div class="top">${first ? '' : '<button class="back" data-act="back">◀</button>'}<h2 class="logo" style="font-size:24px">Diseña tu piloto</h2><div class="sp"></div>
      <button class="btn mint" data-act="ok">${first ? '¡A correr! ▶' : 'Guardar ✔'}</button></div>
      <div class="split"><div class="stage"><canvas id="pv" style="width:260px;height:260px"></canvas></div>
      <div class="pane right"><div class="lbl">Nombre</div><input class="nm" maxlength="12" value="${esc(d.name)}" data-in="name">
      <div class="lbl">Piel</div><div class="chips">${SKINS.map((c, i) => `<button class="sw ${d.skin === i ? 'on' : ''}" style="background:${c}" data-act="set" data-v="skin|${i}"></button>`).join('')}</div>
      <div class="lbl">Peinado</div><div class="chips">${ch('hair', HAIR_STYLES)}</div>
      <div class="lbl">Color de pelo</div><div class="chips">${sw('hairColor', HAIR_COLORS)}</div>
      <div class="lbl">Ojos</div><div class="chips">${ch('eyes', EYE_STYLES)}</div>
      <div class="lbl">Color de ojos</div><div class="chips">${sw('eyeColor', EYE_COLORS)}</div>
      <div class="lbl">Boca</div><div class="chips">${ch('mouth', MOUTHS)}</div>
      <div class="lbl">Color de la ropa</div><div class="chips">${sw('outfitColor', OUTFIT_COLORS)}</div></div></div></div>`;
    paint('#pv', (g, w, h) => drawCharFront(g, w / 2, h * .42, h * .25, d), 260, 260);
    acts.set = v => { const [k, val] = v.split('|'); d[k] = k === 'skin' ? +val : val; show('creator', first); };
    acts.name = v => { d.name = v.slice(0, 12); };
    acts.ok = () => { save.char = { ...d, name: (d.name || '').trim() || 'Piloto' }; save.created = true; persist(); show(first ? 'menu' : 'char'); };
    acts.back = () => show('char');
  },
  menu() {
    UI.innerHTML = `<div class="scr"><div class="top"><div class="logo" style="font-size:30px">SUGAR RUSH<small>KART</small></div><div class="sp"></div>
      <button class="icon" data-act="mute">${save.muted ? '🔇' : '🔊'}</button>${coinsHtml()}</div>
      <div class="split"><div class="stage" style="flex:1"><canvas id="pv" style="width:100%;height:100%"></canvas></div>
      <div class="menuBtns"><button class="btn" data-act="cup">🏆 Copa</button><button class="btn mint" data-act="quick">⚡ Carrera rápida</button>
      <button class="btn yel" data-act="char">🎀 Personaje</button><button class="btn choc" data-act="garage">🛠️ Coche</button></div></div></div>`;
    const st = UI.querySelector('.stage'), w = st.clientWidth || 300, h = st.clientHeight || 220;
    paint('#pv', (g, w, h) => drawShowroom(g, w, h, save.car, save.char), w, h);
    acts.cup = () => show('cup'); acts.quick = () => show('quick'); acts.char = () => { APP.tab = 'hat'; APP.sel = null; show('char'); };
    acts.garage = () => { APP.tab = 'body'; APP.sel = null; show('garage'); };
    acts.mute = () => { save.muted = !save.muted; persist(); show('menu'); };
  },
  quick() { trackPicker(false); },
  cup() { trackPicker(true); },
  char() {
    const tab = APP.tab || 'hat', ch = { ...save.char }, cat = SHOP[tab];
    const key = tab === 'hat' ? 'hat' : tab === 'outfit' ? 'outfit' : 'acc';
    const prev = APP.sel ? { ...ch, [key]: APP.sel } : ch;
    UI.innerHTML = `<div class="scr"><div class="top"><button class="back" data-act="back">◀</button><h2 class="logo" style="font-size:24px">Personaje · Tienda</h2><div class="sp"></div>${coinsHtml()}</div>
      <div class="split"><div class="stage"><canvas id="pv" style="width:230px;height:230px"></canvas><div style="font-weight:700;color:#fff;font-size:20px" class="out">${esc(save.char.name)}</div>
      <button class="btn sm yel" data-act="edit" style="margin-top:6px">✏️ Cara y pelo</button></div>
      <div class="right"><div class="tabs">${[['hat', '🎩 Gorros'], ['outfit', '👕 Ropa'], ['acc', '🕶️ Accesorios']].map(([k, n]) => `<button class="chip ${tab === k ? 'on' : ''}" data-act="tab" data-v="${k}">${n}</button>`).join('')}</div>
      <div class="pane" style="flex:1">${tab === 'outfit' ? `<div class="lbl">Color</div><div class="chips" style="margin-bottom:8px">${OUTFIT_COLORS.map(c => `<button class="sw ${ch.outfitColor === c ? 'on' : ''}" style="background:${c}" data-act="color" data-v="${c}"></button>`).join('')}</div>` : ''}
      <div class="grid">${cat.map(([id, name, price], i) => {
        const own = owns(tab, id), on = ch[key] === id;
        return `<div class="item ${on ? 'on' : ''} ${APP.sel === id ? 'sel' : ''}" data-act="pick" data-v="${id}"><canvas id="it${i}"></canvas>${name}
          ${on ? '<span class="d">✔ Puesto</span>' : own ? `<button class="btn sm mint" data-act="equip" data-v="${id}">Ponérmelo</button>` : `<button class="btn sm yel" data-act="buy" data-v="${id}" ${save.coins < price ? 'disabled' : ''}>🪙 ${price}</button>`}</div>`;
      }).join('')}</div></div></div></div></div>`;
    paint('#pv', (g, w, h) => drawCharFront(g, w / 2, h * .42, h * .25, prev), 230, 230);
    cat.forEach(([id], i) => paint('#it' + i, (g, w, h) => drawCharFront(g, w / 2, h * .42, h * .24, { ...ch, [key]: id }), 76, 76));
    acts.back = () => show('menu'); acts.tab = v => { APP.tab = v; APP.sel = null; show('char'); };
    acts.edit = () => { APP.draft = { ...save.char }; show('creator', false); };
    acts.pick = v => { APP.sel = v; show('char'); };
    acts.equip = v => { save.char[key] = v; APP.sel = null; persist(); show('char'); };
    acts.color = v => { save.char.outfitColor = v; persist(); show('char'); };
    acts.buy = v => { const p = priceOf(tab, v); if (save.coins < p) return; save.coins -= p; save.owned.push(tab + ':' + v); save.char[key] = v; APP.sel = null; persist(); sfx.buy(); show('char'); };
  },
  garage() {
    const tab = APP.tab || 'body', car = { ...save.car };
    const prevCar = APP.sel && tab !== 'paint' ? { ...car, [tab]: APP.sel } : car;
    const cur = carStats(car), pst = carStats(prevCar);
    let list = '';
    if (tab === 'paint') {
      list = `<div class="lbl">Pintura</div><div class="chips">${PAINTS.map(c => `<button class="sw ${car.paint === c ? 'on' : ''}" style="background:${c}" data-act="paint" data-v="${c}"></button>`).join('')}</div>
        <div class="lbl">Decoración</div><div class="chips">${Object.entries(DECOS).map(([k, n]) => `<button class="chip ${car.deco === k ? 'on' : ''}" data-act="deco" data-v="${k}">${n}</button>`).join('')}</div>`;
    } else {
      list = `<div class="grid">${Object.entries(PARTS[tab]).map(([id, p], i) => {
        const own = owns(tab, id), on = car[tab] === id, d = Object.entries(p.st).map(([k, v]) => v > 0 ? `<b>+${v} ${STAT_SHORT[k]}</b>` : `<u>${v} ${STAT_SHORT[k]}</u>`).join(' ');
        return `<div class="item ${on ? 'on' : ''} ${APP.sel === id ? 'sel' : ''}" data-act="pick" data-v="${id}"><canvas id="it${i}"></canvas>${p.name}<span class="d">${d || 'Equilibrado'}</span>
          ${on ? '<span class="d">✔ Montado</span>' : own ? `<button class="btn sm mint" data-act="equip" data-v="${id}">Montar</button>` : `<button class="btn sm yel" data-act="buy" data-v="${id}" ${save.coins < p.price ? 'disabled' : ''}>🪙 ${p.price}</button>`}</div>`;
      }).join('')}</div>`;
    }
    UI.innerHTML = `<div class="scr"><div class="top"><button class="back" data-act="back">◀</button><h2 class="logo" style="font-size:24px">Taller de karts</h2><div class="sp"></div>${coinsHtml()}</div>
      <div class="split"><div class="stage"><canvas id="pv" style="width:200px;height:170px"></canvas>${statBars(pst, APP.sel ? cur : null)}</div>
      <div class="right"><div class="tabs">${[['body', '🚗 Carrocería'], ['wheels', '🍩 Ruedas'], ['engine', '🚀 Motor'], ['paint', '🎨 Pintura']].map(([k, n]) => `<button class="chip ${tab === k ? 'on' : ''}" data-act="tab" data-v="${k}">${n}</button>`).join('')}</div>
      <div class="pane" style="flex:1">${list}</div></div></div></div>`;
    paint('#pv', (g, w, h) => drawShowroom(g, w, h, prevCar, save.char, false), 200, 170);
    if (tab !== 'paint') Object.keys(PARTS[tab]).forEach((id, i) => paint('#it' + i, (g, w, h) => drawShowroom(g, w, h, { ...car, [tab]: id }, save.char, false), 76, 76));
    acts.back = () => show('menu'); acts.tab = v => { APP.tab = v; APP.sel = null; show('garage'); };
    acts.pick = v => { APP.sel = v; show('garage'); };
    acts.equip = v => { save.car[tab] = v; APP.sel = null; persist(); show('garage'); };
    acts.buy = v => { const p = PARTS[tab][v].price; if (save.coins < p) return; save.coins -= p; save.owned.push(tab + ':' + v); save.car[tab] = v; APP.sel = null; persist(); sfx.buy(); show('garage'); };
    acts.paint = v => { save.car.paint = v; persist(); show('garage'); };
    acts.deco = v => { save.car.deco = v; persist(); show('garage'); };
  },
  pause() {
    UI.innerHTML = `<div class="scr overlay"><div class="box stack"><div class="logo" style="font-size:34px">PAUSA</div>
      <button class="btn mint" data-act="resume">▶ Continuar</button><button class="btn yel" data-act="restart">↻ Reiniciar</button><button class="btn choc" data-act="quit">⌂ Salir al menú</button></div></div>`;
    acts.resume = () => togglePause();
    acts.restart = () => { startRace(race.ti, race.opts); };
    acts.quit = () => { race.state = 'done'; engineStop(); APP.mode = 'menu'; $('#hud').classList.add('hidden'); $('#controls').classList.add('hidden'); show('menu'); };
  },
  results(r) {
    const cup = race.opts.cup, def = TRACKS[race.ti];
    const rows = r.ord.map((o, i) => `<tr class="${o === player ? 'me' : ''}"><td class="p">${i + 1}º</td><td><canvas id="rp${i}"></canvas></td><td>${esc(o.name)}</td><td>${o.finished ? fmtTime(o.finishTime) : '--'}</td>${cup ? `<td>${cup.points[o.name]} pts</td>` : ''}</tr>`).join('');
    const next = cup ? (cup.race < cup.tracks.length ? '<button class="btn mint" data-act="next">Siguiente carrera ▶</button>' : '<button class="btn yel" data-act="cupEnd">🏆 Ver trofeo</button>')
      : '<button class="btn mint" data-act="again">↻ Repetir</button><button class="btn choc" data-act="menu">⌂ Menú</button>';
    UI.innerHTML = `<div class="scr"><div class="top"><h2 class="logo" style="font-size:24px">${def.name}${cup ? ` · Carrera ${cup.race}/${cup.tracks.length}` : ''}</h2><div class="sp"></div>${coinsHtml()}</div>
      <div class="split"><div class="pane" style="flex:1.4"><table class="res">${rows}</table></div>
      <div class="box stack" style="flex:1;justify-content:center"><div>Has quedado</div><div class="big">${r.pos}º</div>
      <div>Premio: 🪙 ${r.prize}<br>Monedas recogidas: 🪙 ${r.coins}<br><b>Total: +🪙 ${r.earned}</b></div>${next}</div></div></div>`;
    r.ord.forEach((o, i) => paint('#rp' + i, g => g.drawImage(o.portrait, 0, 0, 28, 28), 28, 28));
    acts.next = () => startRace(cup.tracks[cup.race], race.opts);
    acts.cupEnd = () => show('cupEnd', cup);
    acts.again = () => startRace(race.ti, race.opts);
    acts.menu = () => { APP.mode = 'menu'; show('menu'); };
  },
  cupEnd(cup) {
    const ord = [...racers].sort((a, b) => cup.points[b.name] - cup.points[a.name]), pos = ord.indexOf(player) + 1;
    const bonus = [300, 200, 100][pos - 1] || 0, trophy = ['🏆', '🥈', '🥉'][pos - 1] || '🍬';
    if (!cup.paid) { cup.paid = true; save.coins += bonus; persist(); pos <= 3 ? sfx.win() : sfx.lose(); }
    UI.innerHTML = `<div class="scr"><div class="top"><h2 class="logo" style="font-size:24px">Copa Sugar Rush · ${DIFFS[cup.diff].name}</h2><div class="sp"></div>${coinsHtml()}</div>
      <div class="split"><div class="pane" style="flex:1.3"><table class="res">${ord.map((o, i) => `<tr class="${o === player ? 'me' : ''}"><td class="p">${i + 1}º</td><td><canvas id="rp${i}"></canvas></td><td>${esc(o.name)}</td><td>${cup.points[o.name]} pts</td></tr>`).join('')}</table></div>
      <div class="box stack" style="flex:1;justify-content:center"><div style="font-size:70px;line-height:1">${trophy}</div><div class="big">${pos}º</div>
      <div>${pos === 1 ? '¡Eres el campeón de Sugar Rush!' : pos <= 3 ? '¡Al podio!' : '¡La próxima vez será!'}</div>${bonus ? `<div><b>Bonus copa: +🪙 ${bonus}</b></div>` : ''}
      <button class="btn mint" data-act="menu">⌂ Menú</button></div></div></div>`;
    ord.forEach((o, i) => paint('#rp' + i, g => g.drawImage(o.portrait, 0, 0, 28, 28), 28, 28));
    acts.menu = () => { APP.mode = 'menu'; show('menu'); };
  },
};
function trackPicker(isCup) {
  const d = save.diff;
  UI.innerHTML = `<div class="scr"><div class="top"><button class="back" data-act="back">◀</button><h2 class="logo" style="font-size:24px">${isCup ? 'Copa Sugar Rush' : 'Carrera rápida'}</h2><div class="sp"></div>
    ${DIFFS.map((x, i) => `<button class="chip ${d === i ? 'on' : ''}" data-act="diff" data-v="${i}">${x.name}</button>`).join('')}</div>
    <div class="pane" style="flex:1"><div class="tracks">${TRACKS.map((t, i) => `<div class="track ${!isCup && APP.quick === i ? 'on' : ''}" data-act="pickT" data-v="${i}"><canvas id="tk${i}"></canvas>${isCup ? `${i + 1}. ` : ''}${t.name}<small>${t.desc}${save.best[i] ? ` · Récord ${fmtTime(save.best[i])}` : ''}</small></div>`).join('')}</div></div>
    <div style="display:flex;justify-content:flex-end;margin-top:8px;flex:none"><button class="btn mint" data-act="go">${isCup ? '🏆 Empezar copa (4 carreras)' : '¡A correr! ▶'}</button></div></div>`;
  TRACKS.forEach((t, i) => paint('#tk' + i, (g, w, h) => {
    const P = t.pal, sk = g.createLinearGradient(0, 0, 0, h * .55); sk.addColorStop(0, P.sky[0]); sk.addColorStop(1, P.sky[1]); g.fillStyle = sk; g.fillRect(0, 0, w, h);
    g.fillStyle = P.mount[0]; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(k * w / 4 - 30, h * .55); g.lineTo(k * w / 4, h * .2 + (k % 2) * 12); g.lineTo(k * w / 4 + 30, h * .55); g.fill(); }
    g.fillStyle = P.grass[0]; g.fillRect(0, h * .55, w, h); g.fillStyle = P.rumble[0]; g.beginPath(); g.moveTo(w * .46, h * .55); g.lineTo(w * .54, h * .55); g.lineTo(w * .95, h); g.lineTo(w * .05, h); g.fill();
    g.fillStyle = P.road[0]; g.beginPath(); g.moveTo(w * .47, h * .55); g.lineTo(w * .53, h * .55); g.lineTo(w * .88, h); g.lineTo(w * .12, h); g.fill();
    const s = SPR[t.deco[0]][0].c; g.drawImage(s, w * .06, h * .3, h * .35 * s.width / s.height, h * .35); g.drawImage(s, w * .8, h * .35, h * .3 * s.width / s.height, h * .3);
  }, 160, 80));
  acts.back = () => show('menu');
  acts.diff = v => { save.diff = +v; persist(); show(isCup ? 'cup' : 'quick'); };
  acts.pickT = v => { if (isCup) return; APP.quick = +v; show('quick'); };
  acts.go = () => {
    if (isCup) startRace(0, { diff: save.diff, cup: { diff: save.diff, race: 0, tracks: [0, 1, 2, 3], points: {} } });
    else startRace(APP.quick, { diff: save.diff });
  };
}

// =====================================================================
// Bucle principal
// =====================================================================
function resize() { VW = clamp(Math.round(H * innerWidth / Math.max(1, innerHeight)), 380, 720); view.width = VW; view.height = H; VX.imageSmoothingEnabled = false; if (track) BG.sky = (() => { const s = VX.createLinearGradient(0, 0, 0, H * .62); s.addColorStop(0, track.def.pal.sky[0]); s.addColorStop(1, track.def.pal.sky[1]); return s; })(); }
window.addEventListener('resize', () => { resize(); if (APP.mode === 'menu' && APP.screen === 'menu') show('menu'); });
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) document.body.classList.add('touch');
const STEP = 1 / 60; let last = performance.now(), accT = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  if (APP.mode !== 'race' || !race) return;
  if (!race.paused && race.state !== 'done') { accT += dt; let n = 0; while (accT >= STEP && n++ < 6) { update(STEP); accT -= STEP; } if (race.state === 'done') return; }
  render(); hud();
}
makeSprites(); resize(); show('title'); requestAnimationFrame(frame);
