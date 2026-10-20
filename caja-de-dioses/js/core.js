"use strict";
/* =========================================================
   CAJA DE DIOSES — crea un mundo, dale rasgos a su gente,
   reparte materiales y mira cómo evolucionan sus pueblos.
   ========================================================= */

// ---------- utilidades ----------
const rnd = Math.random;
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = a => a[Math.floor(rnd() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const dist2 = (ax, ay, bx, by) => (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
function hsl(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}
const css = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
function hash(x, y, s) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s) { let t = 0, a = .5, f = 1; for (let i = 0; i < 5; i++) { t += a * vnoise(x * f, y * f, s + i * 31); f *= 2; a *= .5; } return t / .97; }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

// ---------- mods y leyes ----------
const MODS = {
  tecnologia: { n: 'Tecnología y forja', d: 'Los pueblos investigan, minan y forjan armas, armaduras y edificios cada vez mejores, siguiendo la historia.', on: true },
  razas:      { n: 'Razas Extra', d: 'No-muertos que alzan a los caídos, demonios inmunes al fuego y hombres lagarto que nadan.', on: true },
  bestiario:  { n: 'Bestiario', d: 'Dragones que escupen fuego, serpientes marinas y gusanos de arena gigantes.', on: true },
  apocalipsis:{ n: 'Apocalipsis', d: 'Bomba nuclear, agujero negro, tornados, lluvia ácida, plagas y zombis contagiosos.', on: true },
  heroes:     { n: 'Héroes y Leyendas', d: 'Las unidades suben de nivel, ganan rangos y armas legendarias con nombre propio.', on: true },
  diplomacia: { n: 'Diplomacia', d: 'Alianzas, tratados de paz, rebeliones y pueblos que crecen a reinos e imperios.', on: true },
  magia:      { n: 'Magia', d: 'Rasgos de piromante, sanador y nigromante. Hadas que curan. Mithril y adamantita.', on: true },
  masalla:    { n: 'Más Allá', d: 'Los héroes y reyes que mueren vuelven como fantasmas para luchar por su pueblo.', on: true },
  alien:      { n: 'Invasión Alien', d: 'OVNIs que abducen aldeanos y disparan láseres.', on: true },
  clima:      { n: 'Clima y Estaciones', d: 'Día y noche con luces en las ciudades, e inviernos nevados.', on: true },
  trucos:     { n: 'Modo Dios', d: 'Velocidad x10 y x25, editar unidades y pueblos, mapas gigantes y botones de caos.', on: true },
};
const modOn = id => !id || !!(MODS[id] && MODS[id].on);
const LAWS = {
  guerras:   { n: 'Guerras automáticas', d: 'Los pueblos que se tocan pueden declararse la guerra solos. Si la apagas, solo hay guerra cuando tú la declaras.', on: true },
  mutacion:  { n: 'Mutaciones', d: 'Algunos bebés nacen con un rasgo nuevo al azar.', on: true },
  herencia:  { n: 'Herencia', d: 'Los hijos heredan los rasgos de sus padres.', on: true },
  rebelion:  { n: 'Rebeliones', d: 'Las ciudades lejanas pueden independizarse.', on: true },
  hambre:    { n: 'Hambre', d: 'Los pueblos necesitan comida para crecer.', on: true },
  fuego:     { n: 'El fuego se propaga', d: 'Bosques y casas arden y extienden las llamas.', on: true },
  salvaje:   { n: 'Vida salvaje', d: 'Aparecen ovejas y lobos solos.', on: true },
  bosques:   { n: 'Crecen los bosques', d: 'La pradera se vuelve bosque y la ceniza vuelve a ser hierba.', on: true },
  separados: { n: 'Sin pueblos dentro de otros', d: 'Nadie funda pueblos nuevos dentro o al lado de otro reino, los vagabundos se unen a su gente y no hay rebeliones. Ideal para guerras entre reinos grandes.', on: false },
  desastres: { n: 'Desastres naturales', d: 'De vez en cuando caen rayos y meteoritos.', on: false },
};

// ---------- terreno ----------
const T = { DEEP: 0, WATER: 1, SAND: 2, GRASS: 3, FOREST: 4, HILL: 5, MOUNT: 6, SNOW: 7, LAVA: 8, SWAMP: 9, DESERT: 10, ICE: 11, ASH: 12, CORRUPT: 13, FIELD: 14, CRYSTAL: 15, SHROOM: 16, JUNGLE: 17, SAVANNA: 18, TUNDRA: 19, ROCK: 20, FERTILE: 21, ACID: 22, BASALT: 23, MESA: 24 };
const TILE = [
  { n: 'Océano', c: [24, 58, 112], water: 1 },
  { n: 'Agua', c: [44, 100, 172], water: 1 },
  { n: 'Arena', c: [218, 202, 140], build: 1, food: .15 },
  { n: 'Pradera', c: [98, 164, 64], build: 1, burn: 1, food: .6, farm: 1 },
  { n: 'Bosque', c: [44, 112, 50], burn: 1, food: .25, wood: 1 },
  { n: 'Colinas', c: [128, 138, 82], build: 1, food: .2, stone: 1 },
  { n: 'Montaña', c: [118, 110, 106], stone: 1 },
  { n: 'Nieve', c: [232, 238, 244], build: 1, food: .05 },
  { n: 'Lava', c: [236, 92, 24], liquid: 1 },
  { n: 'Pantano', c: [74, 104, 76], build: 1, food: .35 },
  { n: 'Desierto', c: [212, 168, 96], build: 1, food: .05 },
  { n: 'Hielo', c: [178, 218, 238] },
  { n: 'Ceniza', c: [72, 68, 66], build: 1 },
  { n: 'Corrupción', c: [108, 52, 128] },
  { n: 'Cultivo', c: [206, 182, 72], build: 1, burn: 1, food: 2.2 },
  { n: 'Cristal', c: [118, 214, 226], build: 1, food: .2 },
  { n: 'Setas', c: [158, 92, 124], build: 1, burn: 1, food: .8 },
  { n: 'Jungla', c: [26, 126, 64], burn: 1, food: .5, wood: 1 },
  { n: 'Sabana', c: [178, 168, 84], build: 1, burn: 1, food: .4, farm: 1 },
  { n: 'Tundra', c: [146, 158, 140], build: 1, food: .15 },
  { n: 'Roca', c: [134, 130, 126], build: 1, stone: 1 },
  { n: 'Tierra fértil', c: [86, 128, 46], build: 1, burn: 1, food: 1.3, farm: 1 },
  { n: 'Ácido', c: [150, 222, 44], liquid: 1 },
  { n: 'Basalto', c: [58, 58, 66], build: 1, stone: 1 },
  { n: 'Arcilla roja', c: [192, 106, 64], build: 1, stone: 1, food: .1 },
];
const ELEV = [T.DEEP, T.WATER, T.SAND, T.GRASS, T.HILL, T.MOUNT, T.SNOW];
const isWater = t => t === T.DEEP || t === T.WATER;

// ---------- materiales ----------
const MAT = [null,
  { id: 'cobre', n: 'Cobre', c: [216, 122, 62] },
  { id: 'estano', n: 'Estaño', c: [196, 202, 206] },
  { id: 'hierro', n: 'Hierro', c: [160, 84, 62] },
  { id: 'carbon', n: 'Carbón', c: [28, 28, 30] },
  { id: 'salitre', n: 'Salitre', c: [244, 242, 214] },
  { id: 'oro', n: 'Oro', c: [252, 212, 58] },
  { id: 'plata', n: 'Plata', c: [226, 232, 244] },
  { id: 'obsidiana', n: 'Obsidiana', c: [66, 30, 92] },
  { id: 'diamante', n: 'Diamante', c: [170, 250, 255] },
  { id: 'mithril', n: 'Mithril', c: [96, 220, 255], mod: 'magia' },
  { id: 'adamantita', n: 'Adamantita', c: [206, 38, 92], mod: 'magia' },
];
const MATID = {}; MAT.forEach((m, i) => { if (m) MATID[m.id] = i; });
const RESLIST = [['madera', 'Madera', [150, 104, 60]], ['piedra', 'Piedra', [140, 136, 132]], ...MAT.slice(1).map(m => [m.id, m.n, m.c])];
const RESNAME = Object.fromEntries(RESLIST.map(r => [r[0], r[1]]));
