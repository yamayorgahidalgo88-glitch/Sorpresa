"use strict";
// ---------- gráficos: texturas de terreno, edificios y sprites ----------
// Cada casilla del mundo se pinta con una textura de TS×TS píxeles. El canal
// alfa de las texturas guarda una etiqueta (copa de árbol, hierba, agua…)
// para que las estaciones puedan recolorear solo lo que toca.
const TS = 8;
const TAG = { N: 255, CANOPY: 250, GRASS: 251, WATER: 252, PEAK: 249 };
function mulb(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const jitter = (c, R, a) => { const j = (R() - .5) * a; return [c[0] + j, c[1] + j, c[2] + j]; };

class Tex {
  constructor() { this.d = new Uint8ClampedArray(TS * TS * 4); }
  set(x, y, c, tag = TAG.N) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= TS || y >= TS) return; const p = (y * TS + x) * 4; this.d[p] = c[0]; this.d[p + 1] = c[1]; this.d[p + 2] = c[2]; this.d[p + 3] = tag; }
  get(x, y) { const p = (y * TS + x) * 4; return [this.d[p], this.d[p + 1], this.d[p + 2]]; }
  tag(x, y) { return this.d[(y * TS + x) * 4 + 3]; }
  fill(fn) { for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) { const r = fn(x, y); this.set(x, y, r[0], r[1] ?? TAG.N); } }
}

// suelo con grano: mezcla de dos tonos y motas
function ground(t, R, a, b, tag = TAG.N, speck = null, sp = 0) {
  t.fill(() => { if (speck && R() < sp) return [jitter(speck, R, 10), tag]; return [jitter(mix(a, b, R()), R, 8), tag]; });
}
function tuft(t, R, n, dark, light) {
  for (let k = 0; k < n; k++) { const x = (R() * TS) | 0, y = 1 + (R() * (TS - 2)) | 0; t.set(x, y, dark, TAG.GRASS); t.set(x, y - 1, light, TAG.GRASS); }
}
function shadowDisk(t, cx, cy, r, k = .62) {
  for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) { const d = Math.hypot(x - cx, (y - cy) * 1.4); if (d <= r) { const c = t.get(x, y); t.set(x, y, shade(c, k), t.tag(x, y)); } }
}
// árbol de copa redonda: luz arriba a la izquierda, sombra abajo a la derecha
function treeRound(t, R, cx, cy, r, pal) {
  shadowDisk(t, cx + 1, cy + r * .9, r * .8);
  t.set(cx, cy + r + .4, pal.trunk); t.set(cx, cy + r + 1.4, shade(pal.trunk, .8));
  for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
    if (d > r + .35) continue;
    const l = -(dx + dy) / (r * 1.6);
    let c = l > .35 ? pal.light : l < -.25 || d > r - .4 ? pal.dark : pal.mid;
    if (R() < .18) c = mix(c, pal.light, .4);
    t.set(x, y, jitter(c, R, 10), TAG.CANOPY);
  }
}
function treePine(t, R, cx, top, h, pal) {
  shadowDisk(t, cx + 1, top + h, 2);
  t.set(cx, top + h, pal.trunk);
  for (let k = 0; k < h; k++) {
    const w = Math.floor(k * .45 + .5);
    for (let x = -w; x <= w; x++) t.set(cx + x, top + k, jitter(x < 0 ? pal.light : x > 0 ? pal.dark : pal.mid, R, 8), TAG.CANOPY);
  }
}
function treeAcacia(t, R, cx, cy, pal) {
  shadowDisk(t, cx + 1, cy + 3, 2.4);
  t.set(cx, cy + 1, pal.trunk); t.set(cx, cy + 2, pal.trunk); t.set(cx - 1, cy + 3, pal.trunk);
  for (let x = -3; x <= 3; x++) { t.set(cx + x, cy, jitter(x < 0 ? pal.light : pal.mid, R, 8), TAG.CANOPY); if (Math.abs(x) < 3) t.set(cx + x, cy - 1, jitter(pal.light, R, 8), TAG.CANOPY); }
}
function peak(t, R, cx, base, snow) {
  // montaña: cara iluminada a la izquierda y en sombra a la derecha
  for (let y = 0; y < TS; y++) {
    const w = (y + 1) * .62;
    for (let x = 0; x < TS; x++) {
      const dx = x - cx; if (Math.abs(dx) > w) continue;
      let c = dx <= 0 ? mix(base.light, base.mid, -dx / Math.max(1, w)) : mix(base.dark, base.mid, .2);
      if (snow && y < 3 + (R() < .5 ? 1 : 0)) c = dx <= 0 ? [244, 248, 252] : [196, 208, 226];
      if (Math.abs(Math.abs(dx) - w) < .6) c = shade(c, .82);
      t.set(x, y, jitter(c, R, 7), snow && y < 3 ? TAG.PEAK : TAG.N);
    }
  }
}

const GREEN = { light: [96, 168, 72], mid: [56, 124, 52], dark: [32, 84, 40], trunk: [96, 66, 42] };
const JUNG = { light: [74, 176, 82], mid: [34, 136, 66], dark: [18, 92, 52], trunk: [90, 60, 36] };
const PINE = { light: [70, 130, 80], mid: [42, 100, 64], dark: [26, 70, 48], trunk: [84, 60, 40] };
const ACAC = { light: [136, 162, 70], mid: [104, 134, 56], dark: [70, 96, 44], trunk: [104, 76, 48] };
const ROCKP = { light: [168, 160, 152], mid: [124, 116, 110], dark: [78, 72, 72] };

// generadores de textura por tipo de casilla; v = variante 0..3
const TEXGEN = {
  [T.DEEP]: (t, R) => { ground(t, R, [20, 48, 98], [24, 56, 108], TAG.WATER); for (let k = 0; k < 2; k++) if (R() < .5) { const x = (R() * 6) | 0, y = (R() * TS) | 0; t.set(x, y, [44, 82, 140], TAG.WATER); t.set(x + 1, y, [44, 82, 140], TAG.WATER); } },
  [T.WATER]: (t, R) => { ground(t, R, [38, 94, 164], [44, 104, 174], TAG.WATER); for (let k = 0; k < 2; k++) if (R() < .6) { const x = (R() * 6) | 0, y = (R() * TS) | 0; t.set(x, y, [78, 140, 204], TAG.WATER); t.set(x + 1, y, [78, 140, 204], TAG.WATER); } },
  [T.SAND]: (t, R) => ground(t, R, [222, 204, 146], [230, 214, 158], TAG.N, [196, 174, 118], .14),
  [T.GRASS]: (t, R) => { ground(t, R, [88, 152, 58], [104, 170, 66], TAG.GRASS); tuft(t, R, 3, [64, 124, 44], [124, 186, 80]); },
  [T.FOREST]: (t, R, v) => {
    ground(t, R, [56, 108, 46], [66, 120, 50], TAG.GRASS);
    if (v === 3) { treePine(t, R, 2, 0, 6, PINE); treePine(t, R, 5, 1, 6, PINE); }
    else if (v === 2) { treeRound(t, R, 2, 2.5, 2.2, GREEN); treeRound(t, R, 5.4, 4, 2.3, GREEN); }
    else treeRound(t, R, 3.5 + (R() - .5), 3, 3, GREEN);
  },
  [T.JUNGLE]: (t, R) => { ground(t, R, [30, 96, 50], [40, 110, 54], TAG.GRASS); treeRound(t, R, 2.3, 2.3, 2.6, JUNG); treeRound(t, R, 5.2, 4.2, 2.8, JUNG); if (R() < .5) t.set((R() * TS) | 0, 7, [220, 80, 120]); },
  [T.SAVANNA]: (t, R, v) => { ground(t, R, [176, 164, 82], [192, 178, 92], TAG.GRASS); tuft(t, R, 3, [150, 138, 66], [214, 196, 110]); if (v === 0) treeAcacia(t, R, 4, 2, ACAC); },
  [T.DESERT]: (t, R) => { ground(t, R, [214, 172, 100], [224, 184, 112]); for (let x = 0; x < TS; x++) { const y = (x * .5 + R() * 1.2 + 3) | 0; t.set(x, y % TS, [236, 202, 132]); t.set(x, (y + 1) % TS, [194, 152, 86]); } },
  [T.MESA]: (t, R) => t.fill((x, y) => [jitter(y % 3 === 0 ? [168, 86, 52] : y % 3 === 1 ? [204, 116, 70] : [222, 140, 86], R, 10)]),
  [T.SWAMP]: (t, R) => { ground(t, R, [66, 94, 64], [80, 108, 70], TAG.GRASS); const x = 1 + (R() * 4) | 0, y = 1 + (R() * 4) | 0; for (let k = 0; k < 6; k++) t.set(x + (k % 3), y + (k / 3 | 0), [56, 84, 92], TAG.WATER); t.set(6, 2, [120, 140, 70]); t.set(6, 1, [140, 160, 80]); t.set(1, 6, [120, 140, 70]); },
  [T.TUNDRA]: (t, R) => ground(t, R, [140, 150, 134], [152, 162, 144], TAG.GRASS, [176, 168, 120], .08),
  [T.SNOW]: (t, R) => ground(t, R, [232, 238, 246], [240, 244, 250], TAG.N, [204, 216, 232], .12),
  [T.ICE]: (t, R) => { ground(t, R, [172, 212, 234], [184, 222, 240], TAG.N); let x = (R() * TS) | 0; for (let y = 0; y < TS; y++) { t.set(x, y, [226, 242, 252]); x += R() < .5 ? -1 : 1; } },
  [T.HILL]: (t, R) => { ground(t, R, [116, 138, 74], [128, 148, 80], TAG.GRASS); for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) { const d = Math.hypot(x - 3.5, y - 4.5); if (d < 3.6) { const c = t.get(x, y); t.set(x, y, shade(c, (x + y) < 7 ? 1.12 : .86), TAG.GRASS); } } },
  [T.ROCK]: (t, R) => { ground(t, R, [132, 128, 122], [146, 142, 136], TAG.N, [98, 94, 90], .12); t.set(2, 5, [176, 172, 166]); t.set(5, 2, [176, 172, 166]); },
  [T.MOUNT]: (t, R, v) => { ground(t, R, [112, 104, 98], [124, 116, 108], TAG.N, [92, 86, 82], .15); if (v === 0) peak(t, R, 3.5, ROCKP, false); },
  [T.LAVA]: (t, R) => { ground(t, R, [224, 84, 22], [238, 104, 28]); for (let k = 0; k < 10; k++) t.set((R() * TS) | 0, (R() * TS) | 0, R() < .5 ? [255, 206, 70] : [140, 40, 20]); },
  [T.ASH]: (t, R) => { ground(t, R, [68, 64, 62], [78, 74, 72], TAG.N, [104, 100, 98], .12); if (R() < .4) t.set((R() * TS) | 0, (R() * TS) | 0, [200, 90, 40]); },
  [T.CORRUPT]: (t, R) => { ground(t, R, [96, 44, 116], [114, 54, 134]); let x = (R() * TS) | 0; for (let y = 0; y < TS; y++) { t.set(x, y, [70, 26, 86]); x += (R() * 3 | 0) - 1; } if (R() < .6) t.set((R() * TS) | 0, (R() * TS) | 0, [236, 120, 230]); },
  [T.FIELD]: (t, R, v) => {
    const crop = v & 1 ? [214, 186, 70] : [176, 196, 74];
    t.fill((x, y) => { const row = (v < 2 ? y : x) % 3; return [jitter(row === 2 ? [140, 102, 58] : row === 1 ? shade(crop, .85) : crop, R, 10)]; });
  },
  [T.CRYSTAL]: (t, R) => { ground(t, R, [150, 196, 206], [164, 208, 216]); for (let k = 0; k < 3; k++) { const x = 1 + (R() * 6) | 0, y = 2 + (R() * 5) | 0, h = 2 + (R() * 3) | 0; for (let j = 0; j < h; j++) { t.set(x, y - j, j === h - 1 ? [240, 255, 255] : [96, 220, 236]); t.set(x + 1, y - j, [60, 170, 200]); } } },
  [T.SHROOM]: (t, R) => { ground(t, R, [96, 70, 92], [108, 80, 102], TAG.GRASS); for (let k = 0; k < 2; k++) { const x = 1 + (R() * 5) | 0, y = 2 + (R() * 4) | 0, c = R() < .5 ? [210, 60, 70] : [170, 90, 210]; t.set(x + 1, y + 1, [230, 220, 200]); t.set(x + 1, y + 2, [230, 220, 200]); for (let dx = 0; dx < 3; dx++) t.set(x + dx, y, c); t.set(x + 1, y - 1, c); t.set(x + 1, y, [250, 250, 250]); } },
  [T.FERTILE]: (t, R) => { ground(t, R, [74, 124, 42], [86, 138, 48], TAG.GRASS); for (let k = 0; k < 3; k++) t.set((R() * TS) | 0, (R() * TS) | 0, pick([[250, 230, 90], [250, 250, 240], [240, 140, 190], [180, 140, 240]])); tuft(t, R, 2, [56, 104, 34], [110, 170, 64]); },
  [T.ACID]: (t, R) => { ground(t, R, [140, 214, 40], [158, 230, 52]); for (let k = 0; k < 3; k++) t.set((R() * TS) | 0, (R() * TS) | 0, [214, 255, 140]); },
  [T.BASALT]: (t, R) => { ground(t, R, [54, 54, 62], [62, 62, 70]); for (let k = 0; k < TS; k++) { t.set(k, (k * 3) % TS, [38, 38, 44]); t.set((k * 5) % TS, k, [38, 38, 44]); } },
};
const TEXCACHE = [];
function getTex(t, v) {
  const key = t * 4 + v;
  if (!TEXCACHE[key]) { const tx = new Tex(); (TEXGEN[t] || TEXGEN[T.GRASS])(tx, mulb(t * 977 + v * 131 + 7), v); TEXCACHE[key] = tx; }
  return TEXCACHE[key];
}
// pico nevado (nieve rodeada de montañas)
let SNOWPEAK = null;
function snowPeakTex(v) {
  SNOWPEAK = SNOWPEAK || [0, 1, 2, 3].map(k => { const t = new Tex(); const R = mulb(4242 + k); ground(t, R, [210, 216, 226], [224, 230, 238]); peak(t, R, 3 + (k & 1), { light: [244, 248, 252], mid: [210, 220, 234], dark: [150, 162, 186] }, false); return t; });
  return SNOWPEAK[v];
}

// ---------- edificios (sellos de 8×8 con paleta) ----------
// K = color del reino, k = reino oscuro, s = sombra (oscurece el suelo)
const BLD_SPR = [
  ['........', '...h....', '..hhH...', '..hKHH..', '.hhKHHH.', '.hKKoHH.', 'hhhooHHH', '.ssssss.'], // tiendas
  ['........', '...yy...', '..yyyY..', '.yKyyYY.', 'yyyyyYYY', '.wwddww.', '.wwddWw.', '.ssssss.'], // chozas
  ['...KK...', '..KKKk..', '.KKKKkk.', 'KKKKKkkk', '.ggigGG.', '.ggdgGG.', '.ggdgGG.', '.ssssss.'], // casas de piedra
  ['K.K.K.K.', 'gggggGG.', 'ggiggGG.', 'gggggGG.', 'ggiggiG.', 'gKgggGG.', 'ggdddGG.', '.ssssss.'], // castillos
  ['.cC.....', '.cC..rR.', '.cC.rrRR', 'rrrrrrRR', 'rirrirRR', 'rrrrrrRR', 'rrdrrrRR', '.ssssss.'], // fábricas
  ['..fff...', '..bBf...', '.fbBff..', '.fbBbBf.', '.fbBbBf.', '.fKKKKf.', '.fbBdBf.', '.ssssss.'], // rascacielos
];
const CENTER_SPR = [
  ['|KK.....', '|KKk....', '|.hhh...', '.hhKhh..', 'hhKKKhh.', 'hhKooHH.', 'hhhooHHH', '.ssssss.'],
  ['|KK.....', '|KKk....', '|.yyy...', '.yyyyyY.', 'yyyyyyYY', '.wwddww.', '.wwddWw.', '.ssssss.'],
  ['|KK.....', '|KKk....', '|.KKK...', '.KKKKKk.', 'KKKKKKkk', '.giggiG.', '.ggddgG.', '.ssssss.'],
  ['|KKg.g..', '|KkgggG.', '|.giigG.', 'g.ggggGg', 'ggggggGG', 'giggggiG', 'gggddgGG', '.ssssss.'],
  ['|KK.cC..', '|KKkcC..', '|..rrRR.', '.rrrrrRR', 'rirrrirR', 'rrrrrrRR', 'rrrddrRR', '.ssssss.'],
  ['|KK.f...', '|KKkbf..', '|.fbBf..', '.fbBbBf.', 'fbBbBbBf', 'fbKKKKBf', 'fbBddBbf', '.ssssss.'],
];
const SITE_SPR = ['........', '.J....J.', '.JjjjjJ.', '.J....J.', '.JjjjjJ.', '.J.hh.J.', '.JhhhhJ.', '.ssssss.'];
const SPECIAL_SPR = {
  5: ['...yy...', '..yyyY..', '.yyyyYY.', '.wwwwWW.', '.wKwwWW.', '.wwddWW.', '.wwddWW.', '.ssssss.'], // granero
  6: ['........', 'KKKKKKkk', 'KKKKKKkk', 'gggggGGG', 'gzgzgGGG', 'gggddGGG', 'gggddGGG', '.ssssss.'], // cuartel
  7: ['...u....', '...un...', '..mmmM..', '.mmmmMM.', '.m.m.mM.', '.m.m.mM.', 'mmmmmmmM', '.ssssss.'], // templo
  8: ['........', 'xmxmxm..', 'xmxmxmM.', 'j....jJ.', 'juunvjJ.', 'j....jJ.', 'jjjjjjJ.', '.ssssss.'], // mercado
  9: ['....J...', '....JJJ.', '....J..J', 'jjjjjjjj', 'JjJjJjJj', 'jjjjjjjj', 'J.J.J.J.', '.s.s.s.s'], // muelle
  10: ['.g.g.g..', '.ggggG..', '..giG...', '..ggG.K.', '..giGKK.', '..ggG.|.', '.gggGG|.', '.sssss..'], // torre
  11: ['j.....j.', '.j...j..', '..jMj...', '..mmM...', '.jmmMj..', 'j.mmM.j.', '..mdM...', '.ssss...'], // molino
  13: ['..KKKk..', '.KKKKKk.', 'KKKKKKKk', '.mMmMmM.', '.mvmvmM.', '.mmddmM.', '.mmddmM.', '.ssssss.'], // biblioteca
};
const RUIN_SPR = ['........', '........', '.g......', '.gG...g.', '.gGg..gG', 'ggGg.ggG', 'aggGaggG', '.sssssss'];
const BPAL = {
  h: [176, 140, 98], H: [138, 104, 70], o: [52, 36, 28], y: [214, 184, 96], Y: [168, 136, 64], w: [132, 92, 56], W: [104, 70, 42], d: [58, 40, 30],
  g: [176, 170, 160], G: [130, 124, 118], i: [250, 222, 140], c: [112, 70, 60], C: [80, 50, 44], r: [176, 84, 60], R: [130, 60, 44],
  f: [70, 78, 92], b: [124, 186, 226], B: [86, 136, 182], a: [74, 70, 68], '|': [80, 60, 44],
  m: [236, 232, 220], M: [186, 182, 172], u: [252, 212, 80], n: [204, 152, 40], x: [196, 56, 48], v: [74, 112, 196], j: [176, 126, 76], J: [122, 84, 50], z: [64, 62, 68],
};
function stamp(d, stride, ox, oy, spr, kc) {
  const kd = kc ? shade(kc, .62) : null;
  for (let y = 0; y < TS; y++) {
    const row = spr[y];
    for (let x = 0; x < TS; x++) {
      const ch = row[x]; if (ch === '.') continue;
      const p = (oy + y) * stride + (ox + x) * 4;
      if (ch === 's') { d[p] *= .62; d[p + 1] *= .62; d[p + 2] *= .62; continue; }
      const c = ch === 'K' ? (kc || [200, 60, 60]) : ch === 'k' ? (kd || [140, 40, 40]) : BPAL[ch];
      d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2];
    }
  }
}

// ---------- sprites de criaturas ----------
// h pelo, s piel, e ojo, b ropa (color del reino), B ropa oscura, l piernas,
// a casco/armadura, t colmillos, r barba, d cuernos, w lana, S cola.
const USPR = {
  human:  { f: [['..hhh..', '.hssse.', '..sss..', '.bbbbb.', 'sbbbbbs', '.bbbbb.', '.BBBBB.', '.l...l.', '.l...l.'], ['..hhh..', '.hssse.', '..sss..', '.bbbbb.', 'sbbbbbs', '.bbbbb.', '.BBBBB.', '..l.l..', '..l.l..']] },
  elf:    { f: [['.hhhh..', 'shssse.', '.hsss..', '.hbbbb.', 'sbbbbbs', '.bbbbb.', '.BBBBB.', '.l...l.', '.l...l.'], ['.hhhh..', 'shssse.', '.hsss..', '.hbbbb.', 'sbbbbbs', '.bbbbb.', '.BBBBB.', '..l.l..', '..l.l..']] },
  dwarf:  { f: [['.hhhhh.', '.sssse.', '.rrrrr.', 'srrrrrs', 'bbrrrbb', '.BBBBB.', '.l...l.', '.l...l.'], ['.hhhhh.', '.sssse.', '.rrrrr.', 'srrrrrs', 'bbrrrbb', '.BBBBB.', '..l.l..', '..l.l..']] },
  orc:    { f: [['..hhh..', '.sssse.', '.stsst.', '.bbbbb.', 'sbbbbbs', 'sbbbbbs', '.BBBBB.', '.l...l.', '.l...l.'], ['..hhh..', '.sssse.', '.stsst.', '.bbbbb.', 'sbbbbbs', 'sbbbbbs', '.BBBBB.', '..l.l..', '..l.l..']] },
  undead: { f: [['..sss..', '.sesse.', '..sss..', '.bBbBb.', 's.bbb.s', '.bBbBb.', '..BBB..', '.s...s.', '.s...s.'], ['..sss..', '.sesse.', '..sss..', '.bBbBb.', 's.bbb.s', '.bBbBb.', '..BBB..', '..s.s..', '..s.s..']] },
  demon:  { f: [['d.....d', '.dsssd.', '.sssse.', '..sss..', 'sbbbbbs', 'sbbbbbs', '.BBBBB.', '.l...l.', '.l...l.'], ['d.....d', '.dsssd.', '.sssse.', '..sss..', 'sbbbbbs', 'sbbbbbs', '.BBBBB.', '..l.l..', '..l.l..']] },
  lizard: { f: [['...sss.', '..sssse', '...sss.', '..bbbb.', '.sbbbbs', '..bbbb.', 'S.BBBB.', 'SS.l.l.', '.S.l.l.'], ['...sss.', '..sssse', '...sss.', '..bbbb.', '.sbbbbs', '..bbbb.', '.SBBBB.', 'S..l.l.', 'S.l...l']] },
  sheep:  { f: [['.wwww...', 'wwwwwwdd', 'wwwwwwde', '.wwwww..', '.l...l..'], ['.wwww...', 'wwwwwwdd', 'wwwwwwde', '.wwwww..', '..l.l...']] },
  wolf:   { f: [['......ss', 's....sse', '.ssssss.', '.sssss..', '.l...l..'], ['......ss', '.s...sse', 'sssssss.', '.sssss..', 'l.l.l.l.']] },
  zombie: { f: [['..hhh..', '.sssse.', '..sss..', '.bbbbbs', 'sbbbbb.', '.bbbbb.', '.BBBBB.', '.l...l.', '.l...l.'], ['..hhh..', '.sssse.', '..sss..', 'sbbbbb.', '.bbbbbs', '.bbbbb.', '.BBBBB.', '..l.l..', '.l...l.']] },
  dragon: { f: [['..........ss..', 'ww.......ssse.', 'www.....sssss.', 'wwww..sssss...', '.wwwssssss....', '..ssssssss....', 'SSsssssss.....', '...l...l......', '..l...l.......'], ['..........ss..', '.........ssse.', '........sssss.', 'w.....sssss...', 'wwwwssssss....', 'wwwsssssss....', 'SSsssssss.....', '...l...l......', '...l...l......']] },
  serpent:{ f: [['.....ss.', '.....sse', '.s..ss..', 'ss.ss...', '.sss....'], ['.....ss.', '.....sse', '..s.ss..', '.ssss...', 'ss......']] },
  worm:   { f: [['.ssss.', 'ssssss', 'sddddS', 'ssssss', '.ssss.'], ['.ssss.', 'ssssss', 'sdddds', 'SsssSs', '.ssss.']] },
  ufo:    { f: [['...ccc...', '..ccccc..', 'sssssssss', '.SsSsSsS.', '..y...y..'], ['...ccc...', '..ccccc..', 'sssssssss', '.sSsSsSs.', '...y.y...']] },
  ghost:  { f: [['.sss.', 'seses', 'sssss', 'sssss', 'sssss', 's.s.s'], ['.sss.', 'seses', 'sssss', 'sssss', 'sssss', '.s.s.']] },
  fairy:  { f: [['y...y', 'yysyy', '.sss.', '..s..', '.s.s.'], ['.y.y.', 'yysyy', 'y.s.y', '..s..', '.s.s.']] },
};
const SPRITE_CACHE = new Map();
function hairOf(type, seed) {
  if (SP[type]?.hair) return SP[type].hair;
  const H = { human: [[70, 46, 30], [40, 30, 24], [170, 120, 60], [120, 70, 40]], elf: [[230, 210, 140], [210, 200, 190], [170, 120, 70]], dwarf: [[160, 80, 40], [90, 60, 40], [200, 140, 60]], orc: [[40, 40, 30]], undead: [[200, 210, 200]], demon: [[30, 20, 20]], lizard: [[60, 140, 90]], zombie: [[60, 70, 50]] };
  const a = H[type] || [[60, 50, 40]]; return a[seed % a.length];
}
// sprite completo de una criatura: sombra, cuerpo con contorno y arma, ya
// orientado. Se cachea por aspecto y cada unidad recuerda el último que usó.
// Devuelve {cv, w, h, ax, ay}: ax/ay es el punto de los pies dentro del lienzo.
function weaponKind(u) {
  if (!u.def.civ || !u.k || !modOn('tecnologia') || u.age < 12 || !u.k.weapon || !u.k.weapon.c) return 0;
  return u.k.gun ? 3 : rangeOf(u) > 2 ? 2 : 1;
}
function unitSprite(u, frame, flip = 0) {
  const def = u.def;
  const tech = def.civ && u.k && modOn('tecnologia') && u.age >= 12;
  const at = tech ? u.k.armor.tier : 0, wk = weaponKind(u), hit = u.hitT > 0 ? 1 : 0;
  const sig = (frame & 1) | flip << 1 | hit << 2 | (u.plague || u.sick ? 1 : 0) << 3 | wk << 4 | at << 6 | (u.k ? u.k.id + 3 : 1) << 10 | (u.k && wk ? u.k.weapon.tier : 0) << 24;
  if (u._sig === sig && u._spr) return u._spr;
  const hs = u.id % 4;
  const key = u.type + '|' + sig + '|' + hs + '|' + (u.k ? u.k.color.join(',') : '') + (def.custom ? '|' + def.skin.join(',') + '|' + (def.hair || []).join(',') + '|' + def.base : '');
  let s = SPRITE_CACHE.get(key);
  if (!s) {
    const tpl = USPR[u.type] || USPR.human;
    const pat = tpl.f[frame % tpl.f.length], h = pat.length, w = pat[0].length;
    const ox = 3, cw = w + 2 + 6, chh = h + 4;
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = chh;
    const x = cv.getContext('2d');
    const body = hit ? [255, 90, 90] : u.k ? u.k.color : def.skin.map(v => v * .75);
    const skin = (u.plague || u.sick) ? mix(def.skin, [120, 220, 90], .45) : def.skin;
    const arm = at >= 1 ? ARMORS[at][2] : null;
    const pal = { h: arm || hairOf(u.type, hs), s: skin, e: [24, 16, 16], b: body, B: shade(body, .66), l: [58, 44, 36], t: [250, 250, 236], r: hairOf(u.type, hs), d: [40, 24, 24], w: [244, 244, 236], S: shade(skin, .8), c: [150, 224, 255], y: [255, 240, 140] };
    if (!def.civ) { pal.b = def.skin; pal.B = shade(def.skin, .7); pal.l = shade(def.skin, .55); }
    if (def.boat) { pal.b = u.k ? u.k.color : [230, 230, 220]; pal.w = [90, 66, 44]; }
    if (flip) { x.translate(cw, 0); x.scale(-1, 1); }
    // sombra
    if (!def.fly && !def.waterOnly) { x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(ox + 1 + w / 2, h + 1.6, w * .5 + .3, 1.3, 0, 0, 7); x.fill(); }
    // contorno oscuro de 1 píxel para que destaque sobre cualquier suelo
    x.fillStyle = 'rgba(16,12,10,.6)';
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (pat[yy][xx] !== '.') { x.fillRect(ox + xx, yy + 1, 1, 1); x.fillRect(ox + xx + 2, yy + 1, 1, 1); x.fillRect(ox + xx + 1, yy, 1, 1); x.fillRect(ox + xx + 1, yy + 2, 1, 1); }
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const ch = pat[yy][xx]; if (ch === '.') continue;
      x.fillStyle = css((pal[ch] || skin).map(v => clamp(v, 0, 255))); x.fillRect(ox + 1 + xx, yy + 1, 1, 1);
    }
    // arma en la mano delantera
    if (wk) {
      const wc = css(u.k.weapon.c), wx = ox + 1 + w;
      x.fillStyle = 'rgba(16,12,10,.6)';
      if (wk === 1) { x.fillRect(wx - 1, 1, 3, 7); x.fillStyle = wc; x.fillRect(wx, 2, 1, 5); x.fillStyle = '#5a3c24'; x.fillRect(wx, 6, 1, 1); }
      else if (wk === 2) { x.fillStyle = '#8a5a30'; for (const [dx, dy] of [[1, 3], [2, 4], [2, 5], [2, 6], [1, 7]]) x.fillRect(wx - 1 + dx, dy, 1, 1); x.fillStyle = 'rgba(240,230,210,.85)'; x.fillRect(wx, 4, 1, 3); }
      else { x.fillRect(wx - 3, 4, 6, 3); x.fillStyle = wc; x.fillRect(wx - 2, 5, 5, 1); }
    }
    s = { cv, w: cw, h: chh, ax: flip ? cw - (ox + 1 + w / 2) : ox + 1 + w / 2, ay: h + 1.4 };
    if (SPRITE_CACHE.size > 5000) SPRITE_CACHE.clear();
    SPRITE_CACHE.set(key, s);
  }
  u._sig = sig; u._spr = s;
  return s;
}

// sprites sueltos: brillo de luz, sombra, llama, nube
function radial(r, stops) {
  const c = document.createElement('canvas'); c.width = c.height = r * 2;
  const x = c.getContext('2d'), g = x.createRadialGradient(r, r, 0, r, r, r);
  for (const [o, col] of stops) g.addColorStop(o, col);
  x.fillStyle = g; x.fillRect(0, 0, r * 2, r * 2); return c;
}
const GLOW = radial(32, [[0, 'rgba(255,214,140,1)'], [.35, 'rgba(255,170,80,.45)'], [1, 'rgba(255,140,40,0)']]);
const FIREGLOW = radial(32, [[0, 'rgba(255,190,90,1)'], [.4, 'rgba(255,110,30,.5)'], [1, 'rgba(255,60,10,0)']]);
const SHADOW = (() => { const c = document.createElement('canvas'); c.width = 16; c.height = 6; const x = c.getContext('2d'); x.fillStyle = 'rgba(0,0,0,.32)'; x.beginPath(); x.ellipse(8, 3, 7, 2.6, 0, 0, 7); x.fill(); return c; })();
const FLAMES = [0, 1, 2].map(f => {
  const c = document.createElement('canvas'); c.width = c.height = TS; const x = c.getContext('2d'), R = mulb(99 + f);
  for (let k = 0; k < 3; k++) {
    const cx = 1.5 + k * 2.5 + (R() - .5), h = 4 + R() * 4;
    for (let y = 0; y < h; y++) { const w = (1 - y / h) * 1.6; for (let dx = -w; dx <= w; dx += 1) { x.fillStyle = y < h * .35 ? '#fff2a0' : y < h * .7 ? '#ffb030' : '#e8481c'; x.fillRect((cx + dx) | 0, (TS - 1 - y) | 0, 1, 1); } }
  }
  return c;
});
function makeCloud(seed) {
  const R = mulb(seed), w = 200, h = 110, c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  for (let k = 0; k < 14; k++) {
    const cx = 40 + R() * 120, cy = 40 + R() * 34 - Math.abs(cx - 100) * .15, r = 18 + R() * 22;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.6, 'rgba(250,252,255,.55)'); g.addColorStop(1, 'rgba(240,246,255,0)');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
  }
  return c;
}
const CLOUD_SPR = [1, 2, 3, 4].map(makeCloud);

// ---------- escudos de armas ----------
const EMB_SYM = ['✦', '☀', '☾', '♛', '⚔', '⚒', '❦', '✠', '♜', '☘', '⚓', '♞', '❂', '⚜', '♆', '☗', '✚', '⚘'];
function emblemOf(k) {
  if (!k.emb) { const r = mulb(k.id * 7919 + k.hue); k.emb = { s: (r() * 6) | 0, c2: hsl((k.hue + 120 + r() * 120) % 360, 55, r() < .5 ? 82 : 28), g: EMB_SYM[(r() * EMB_SYM.length) | 0] }; }
  return k.emb;
}
// escudo dibujado en un lienzo cacheado por reino
function emblemCanvas(k, size = 48) {
  const e = emblemOf(k), key = size + '|' + k.color.join(',') + '|' + e.s + e.g;
  if (k._embC && k._embK === key) return k._embC;
  const c = document.createElement('canvas'); c.width = size; c.height = Math.round(size * 1.15);
  const x = c.getContext('2d'), w = size, h = c.height;
  const shield = () => { x.beginPath(); x.moveTo(w * .06, h * .05); x.lineTo(w * .94, h * .05); x.lineTo(w * .94, h * .5); x.quadraticCurveTo(w * .94, h * .82, w * .5, h * .97); x.quadraticCurveTo(w * .06, h * .82, w * .06, h * .5); x.closePath(); };
  shield(); x.fillStyle = css(k.color); x.fill();
  x.save(); shield(); x.clip(); x.fillStyle = css(e.c2);
  if (e.s === 1) x.fillRect(w * .5, 0, w, h);
  else if (e.s === 2) x.fillRect(0, h * .48, w, h);
  else if (e.s === 3) { x.fillRect(w * .5, 0, w, h * .48); x.fillRect(0, h * .48, w * .5, h); }
  else if (e.s === 4) { x.beginPath(); x.moveTo(0, h * .75); x.lineTo(w * .5, h * .35); x.lineTo(w, h * .75); x.lineTo(w, h * .95); x.lineTo(w * .5, h * .55); x.lineTo(0, h * .95); x.fill(); }
  else if (e.s === 5) { x.lineWidth = w * .16; x.strokeStyle = css(e.c2); shield(); x.stroke(); }
  x.restore();
  shield(); x.lineWidth = Math.max(1.5, w * .05); x.strokeStyle = 'rgba(20,16,10,.75)'; x.stroke();
  x.font = `${Math.round(w * .5)}px "Segoe UI Symbol","DejaVu Sans",system-ui,sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = 'rgba(0,0,0,.35)'; x.fillText(e.g, w * .5 + 1, h * .47 + 1.5);
  x.fillStyle = '#fff6dc'; x.fillText(e.g, w * .5, h * .47);
  k._embC = c; k._embK = key;
  return c;
}
function emblemHTML(k, cls = 'emb') { try { return `<img class="${cls}" alt="" src="${emblemCanvas(k).toDataURL()}">`; } catch (e) { return `<span class="sw" style="background:${css(k.color)}"></span>`; } }
