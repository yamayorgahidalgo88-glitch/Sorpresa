"use strict";
// ---------- tecnología (línea temporal) ----------
const ERAS = ['Edad de Piedra', 'Edad del Cobre', 'Edad del Bronce', 'Edad del Hierro', 'Edad Media', 'Era de la Pólvora', 'Era Industrial', 'Era Moderna'];
const WEAPONS = [['Puños', 0, null], ['Lanza de madera', 2, [150, 105, 60]], ['Hacha de cobre', 4, [216, 122, 62]], ['Espada de bronce', 6, [205, 150, 70]], ['Espada de hierro', 9, [168, 168, 174]], ['Espada de acero', 12, [218, 222, 232]], ['Hoja de mithril', 16, [110, 230, 255]], ['Mosquete', 18, [96, 72, 50]], ['Rifle', 24, [74, 74, 74]], ['Ametralladora', 30, [46, 46, 50]]];
const ARMORS = [['Sin armadura', 0, null], ['Pieles', .1, [140, 100, 60]], ['Armadura de bronce', .2, [205, 150, 70]], ['Cota de malla', .3, [168, 168, 174]], ['Placas de acero', .4, [218, 222, 232]], ['Cota de mithril', .5, [110, 230, 255]], ['Armadura de diamante', .56, [170, 250, 255]], ['Blindaje moderno', .6, [92, 104, 78]], ['Armadura de adamantita', .68, [206, 38, 92]]];
const HOUSES = [['Tiendas de piel', [172, 136, 96]], ['Chozas', [150, 106, 62]], ['Casas de piedra', [156, 154, 150]], ['Castillos', [118, 118, 130]], ['Fábricas', [158, 72, 52]], ['Rascacielos', [124, 176, 214]]];
const TECH = [
  { id: 'fuego', n: 'Dominio del fuego', era: 0, cost: 3, need: { madera: 4 }, fx: { food: 1.15 } },
  { id: 'piedra', core: 1, n: 'Herramientas de piedra', era: 0, cost: 5, need: { piedra: 6 }, fx: { work: 1.2 } },
  { id: 'lanza', n: 'Lanzas de madera', era: 0, cost: 6, need: { madera: 10 }, weapon: 1 },
  { id: 'pieles', n: 'Ropa de pieles', era: 0, cost: 6, req: ['piedra'], armor: 1 },
  { id: 'chozas', n: 'Chozas', era: 0, cost: 8, need: { madera: 15 }, house: 1 },
  { id: 'agri', n: 'Agricultura', era: 0, cost: 10, req: ['piedra'], fx: { food: 1.35 } },
  { id: 'obsid', n: 'Hojas de obsidiana', era: 0, cost: 14, need: { obsidiana: 8 }, req: ['piedra'], weapon: 3, wn: 'Macuahuitl de obsidiana', wc: [92, 48, 130] },
  { id: 'cobre', core: 1, n: 'Metalurgia del cobre', era: 1, cost: 20, need: { cobre: 12 }, req: ['piedra', 'fuego'], weapon: 2 },
  { id: 'arco', n: 'Arco y flechas', era: 1, cost: 18, need: { madera: 20 }, req: ['lanza'], ranged: 4 },
  { id: 'rueda', n: 'La rueda', era: 1, cost: 18, need: { madera: 15 }, req: ['piedra'], fx: { speed: 1.15, work: 1.1 } },
  { id: 'escritura', n: 'Escritura', era: 1, cost: 26, req: ['agri'], fx: { research: 1.3 } },
  { id: 'bronce', core: 1, n: 'Aleación de bronce', era: 2, cost: 38, need: { cobre: 15, estano: 10 }, req: ['cobre'], weapon: 3, armor: 2 },
  { id: 'casasp', n: 'Casas de piedra', era: 2, cost: 34, need: { piedra: 40 }, req: ['chozas'], house: 2 },
  { id: 'comercio', n: 'Comercio y moneda', era: 2, cost: 40, need: { oro: 10 }, req: ['escritura'], fx: { research: 1.2, birth: 1.25 } },
  { id: 'joyas', n: 'Orfebrería', era: 2, cost: 36, need: { plata: 8, oro: 4 }, req: ['escritura'], fx: { birth: 1.1, research: 1.1 } },
  { id: 'hierro', core: 1, n: 'Forja de hierro', era: 3, cost: 66, need: { hierro: 20 }, req: ['cobre', 'escritura'], weapon: 4, armor: 3 },
  { id: 'murallas', n: 'Murallas', era: 3, cost: 58, need: { piedra: 80 }, req: ['casasp'], walls: 1 },
  { id: 'plata', n: 'Armas de plata', era: 3, cost: 50, need: { plata: 12 }, req: ['hierro'], silver: 1 },
  { id: 'acero', core: 1, n: 'Acero', era: 4, cost: 105, need: { hierro: 30, carbon: 20 }, req: ['hierro'], weapon: 5, armor: 4 },
  { id: 'ballesta', n: 'Ballestas', era: 4, cost: 90, need: { hierro: 15, madera: 25 }, req: ['arco', 'hierro'], ranged: 5 },
  { id: 'castillos', n: 'Castillos', era: 4, cost: 115, need: { piedra: 150 }, req: ['murallas'], house: 3, walls: 2 },
  { id: 'mithril', n: 'Forja de mithril', era: 4, cost: 135, need: { mithril: 15 }, req: ['acero'], weapon: 6, armor: 5, mod: 'magia' },
  { id: 'polvora', core: 1, n: 'Pólvora', era: 5, cost: 190, need: { carbon: 25, salitre: 20 }, req: ['acero', 'escritura'], weapon: 7, ranged: 6, gun: 1 },
  { id: 'imprenta', n: 'Imprenta', era: 5, cost: 170, req: ['acero'], fx: { research: 1.4 } },
  { id: 'canones', n: 'Cañones', era: 5, cost: 210, need: { hierro: 50, carbon: 20 }, req: ['polvora'], siege: 1 },
  { id: 'diamante', n: 'Armadura de diamante', era: 5, cost: 200, need: { diamante: 15 }, req: ['acero'], armor: 6 },
  { id: 'vapor', core: 1, n: 'Máquina de vapor', era: 6, cost: 300, need: { carbon: 60, hierro: 60 }, req: ['imprenta'], fx: { work: 1.6, food: 1.3 }, house: 4 },
  { id: 'rifles', n: 'Rifles', era: 6, cost: 360, need: { hierro: 40 }, req: ['polvora', 'vapor'], weapon: 8, ranged: 7, gun: 1 },
  { id: 'medicina', n: 'Medicina', era: 6, cost: 290, req: ['imprenta'], fx: { birth: 1.3, age: 1.4 } },
  { id: 'electricidad', core: 1, n: 'Electricidad', era: 7, cost: 500, need: { cobre: 60 }, req: ['vapor'], fx: { research: 1.5 }, house: 5 },
  { id: 'ametra', n: 'Ametralladoras', era: 7, cost: 580, need: { hierro: 80 }, req: ['rifles', 'electricidad'], weapon: 9, ranged: 7, gun: 1, rof: 2 },
  { id: 'blindaje', n: 'Blindaje moderno', era: 7, cost: 580, need: { hierro: 80, carbon: 40 }, req: ['electricidad'], armor: 7 },
  { id: 'adamant', n: 'Armadura de adamantita', era: 5, cost: 260, need: { adamantita: 15 }, req: ['mithril'], armor: 8, mod: 'magia' },
];
const TECHID = Object.fromEntries(TECH.map(t => [t.id, t]));

// ---------- especies ----------
const SP = {
  human:   { n: 'Humanos', civ: 1, skin: [232, 190, 150], hp: 30, atk: 4, spd: .55, age: [55, 80], spr: 'man' },
  elf:     { n: 'Elfos', civ: 1, skin: [242, 222, 184], hp: 26, atk: 4, spd: .65, age: [250, 400], spr: 'man', bonus: { research: 1.15 } },
  dwarf:   { n: 'Enanos', civ: 1, skin: [222, 170, 128], hp: 44, atk: 5, spd: .45, age: [150, 250], mount: 1, spr: 'dwarf', bonus: { mine: 1.6 } },
  orc:     { n: 'Orcos', civ: 1, skin: [96, 152, 72], hp: 40, atk: 6, spd: .55, age: [40, 60], war: 2, spr: 'man', bonus: { research: .8 } },
  undead:  { n: 'No-muertos', mod: 'razas', civ: 1, skin: [176, 204, 176], hp: 34, atk: 5, spd: .45, age: [9999, 9999], noFood: 1, raise: .35, spr: 'man', bonus: { research: .7 } },
  demon:   { n: 'Demonios', mod: 'razas', civ: 1, skin: [204, 56, 44], hp: 46, atk: 7, spd: .55, age: [300, 500], fireproof: 1, war: 2, spr: 'horn' },
  lizard:  { n: 'Hombres lagarto', mod: 'razas', civ: 1, skin: [82, 172, 112], hp: 32, atk: 5, spd: .6, age: [60, 90], swim: 1, spr: 'man' },
  sheep:   { n: 'Ovejas', skin: [240, 240, 232], hp: 10, atk: 0, spd: .35, age: [12, 18], passive: 1, spr: 'quad' },
  wolf:    { n: 'Lobos', skin: [122, 122, 134], hp: 20, atk: 4, spd: .7, age: [12, 18], hunter: 1, spr: 'quad' },
  zombie:  { n: 'Zombis', mod: 'apocalipsis', skin: [122, 172, 102], hp: 22, atk: 4, spd: .35, age: [60, 90], hostile: 1, infect: 1, spr: 'man', unholy: 1 },
  dragon:  { n: 'Dragón', mod: 'bestiario', skin: [186, 44, 40], hp: 520, atk: 28, spd: .6, age: [900, 999], fly: 1, hostile: 1, breath: 1, fireproof: 1, spr: 'dragon', size: 2.6 },
  serpent: { n: 'Serpiente marina', mod: 'bestiario', skin: [40, 142, 124], hp: 300, atk: 20, spd: .5, age: [400, 600], waterOnly: 1, hostile: 1, spr: 'serpent', size: 2.1 },
  worm:    { n: 'Gusano de arena', mod: 'bestiario', skin: [192, 150, 100], hp: 360, atk: 24, spd: .5, age: [400, 600], sandOnly: 1, hostile: 1, spr: 'worm', size: 2.1 },
  ufo:     { n: 'OVNI', mod: 'alien', skin: [176, 186, 206], hp: 180, atk: 7, spd: .8, age: [60, 80], fly: 1, hostile: 1, abduct: 1, range: 5, spr: 'ufo', size: 1.9 },
  ghost:   { n: 'Fantasma', mod: 'masalla', skin: [214, 226, 255], hp: 28, atk: 4, spd: .5, age: [3, 5], fly: 1, fireproof: 1, spr: 'ghost', unholy: 1 },
  fairy:   { n: 'Hadas', mod: 'magia', skin: [255, 176, 238], hp: 12, atk: 0, spd: .7, age: [100, 200], fly: 1, healer: 1, spr: 'fairy' },
};
SP.undead.unholy = 1; SP.demon.unholy = 1;
const CIV = Object.keys(SP).filter(k => SP[k].civ);
const SPR = {
  man:    [".hhh.", ".sss.", "bbbbb", ".bbb.", ".b.b.", ".d.d."],
  dwarf:  [".hhh.", ".sss.", ".rrr.", "bbbbb", ".bbb.", ".d.d."],
  horn:   ["d...d", ".sss.", ".sss.", "bbbbb", ".bbb.", ".d.d."],
  quad:   [".....", "....s", ".ssss", ".ssss", ".d..d", "....."],
  ghost:  [".sss.", "seses", "sssss", "sssss", "sssss", "s.s.s"],
  fairy:  ["y...y", "yysyy", ".sss.", "..s..", ".s.s.", "....."],
  ufo:    ["..ccc..", ".ccccc.", "sssssss", ".y.y.y."],
  dragon: [".......ss", "w....ssse", "ww..ssss.", "wwwsssss.", ".ssssss..", ".d...d..."],
  serpent:["ss.....", "sesss..", ".s..ss.", ".....ss"],
  worm:   [".ssss.", "ssssss", "sddddS", "ssssss", ".ssss."],
};

// ---------- rasgos y habilidades ----------
const TRAITS = {
  inteligente: { n: 'Inteligente', cat: 'Mente', g: '🧠', research: 1.7, d: 'Investiga mucho más rápido.' },
  genio:       { n: 'Genio', cat: 'Mente', g: '💡', research: 3.5, inh: .25, d: 'Vale por tres investigadores.' },
  tonto:       { n: 'Tonto', cat: 'Mente', g: '🤪', research: .25, work: .85, bad: 1, d: 'Apenas aporta a la ciencia.' },
  curioso:     { n: 'Curioso', cat: 'Mente', g: '🧭', research: 1.2, explore: 2.5, d: 'Investiga y funda colonias lejanas.' },
  sabio:       { n: 'Sabio', cat: 'Mente', g: '📜', research: 1.3, xp: 1.8, d: 'Aprende rápido de la experiencia.' },
  trabajador:  { n: 'Trabajador', cat: 'Carácter', g: '🔨', work: 1.8, d: 'Mina, tala, cultiva y construye más.' },
  vago:        { n: 'Vago', cat: 'Carácter', g: '💤', work: .35, bad: 1, d: 'Trabaja poco.' },
  agresivo:    { n: 'Agresivo', cat: 'Carácter', g: '😠', aggr: 1, atk: 1.15, d: 'Empuja a su pueblo a la guerra.' },
  pacifico:    { n: 'Pacífico', cat: 'Carácter', g: '🕊', aggr: -1, d: 'Su pueblo evita las guerras.' },
  valiente:    { n: 'Valiente', cat: 'Carácter', g: '🦁', atk: 1.1, hp: 1.1, d: 'Lucha mejor y aguanta más.' },
  cobarde:     { n: 'Cobarde', cat: 'Carácter', g: '🐔', atk: .7, coward: 1, bad: 1, d: 'Huye del combate.' },
  lider:       { n: 'Líder', cat: 'Carácter', g: '👑', lead: 1, d: 'Da moral al ejército y evita rebeliones.' },
  fuerte:      { n: 'Fuerte', cat: 'Cuerpo', g: '💪', atk: 1.35, work: 1.1, d: 'Golpea más fuerte.' },
  debil:       { n: 'Débil', cat: 'Cuerpo', g: '🥀', atk: .65, hp: .75, bad: 1, d: 'Poco útil en la guerra.' },
  gigante:     { n: 'Gigante', cat: 'Cuerpo', g: '🗿', hp: 1.8, atk: 1.3, spd: .85, size: 1.35, d: 'Enorme y resistente.' },
  diminuto:    { n: 'Diminuto', cat: 'Cuerpo', g: '🐭', hp: .7, spd: 1.2, size: .75, bad: 1, d: 'Pequeño y rápido.' },
  veloz:       { n: 'Veloz', cat: 'Cuerpo', g: '💨', spd: 1.45, d: 'Se mueve mucho más rápido.' },
  fertil:      { n: 'Fértil', cat: 'Cuerpo', g: '🍼', fert: 2.2, d: 'Su pueblo tiene más hijos.' },
  esteril:     { n: 'Estéril', cat: 'Cuerpo', g: '🚫', fert: 0, bad: 1, d: 'No tiene hijos.' },
  longevo:     { n: 'Longevo', cat: 'Cuerpo', g: '⏳', age: 1.7, d: 'Vive mucho más.' },
  regenera:    { n: 'Regeneración', cat: 'Cuerpo', g: '💗', regen: 1, d: 'Se cura solo.' },
  afortunado:  { n: 'Afortunado', cat: 'Cuerpo', g: '🍀', dodge: .3, d: 'Esquiva uno de cada tres golpes.' },
  inmortal:    { n: 'Inmortal', cat: 'Cuerpo', g: '♾', immortal: 1, inh: 0, d: 'No envejece y casi no recibe daño.' },
  minero:      { n: 'Minero', cat: 'Habilidad', g: '⛏', mine: 2.5, d: 'Saca mucho más mineral.' },
  granjero:    { n: 'Granjero', cat: 'Habilidad', g: '🌾', farm: 2.5, d: 'Cultiva y produce más comida.' },
  constructor: { n: 'Constructor', cat: 'Habilidad', g: '🧱', build: 2.5, d: 'Levanta casas muy rápido.' },
  herrero:     { n: 'Herrero', cat: 'Habilidad', g: '⚒', smith: 1, d: 'Mejora las armas de todo su pueblo.' },
  arquero:     { n: 'Arquero', cat: 'Habilidad', g: '🏹', archer: 1, d: 'Dispara de lejos aunque no conozcan el arco.' },
  piromante:   { n: 'Piromante', cat: 'Habilidad', g: '🔥', spell: 'fire', mod: 'magia', magic: 1, d: 'Lanza bolas de fuego.' },
  sanador:     { n: 'Sanador', cat: 'Habilidad', g: '✚', spell: 'heal', mod: 'magia', magic: 1, d: 'Cura a los suyos.' },
  nigromante:  { n: 'Nigromante', cat: 'Habilidad', g: '💀', spell: 'raise', mod: 'magia', magic: 1, d: 'Levanta muertos que luchan por él.' },
};
const OPPOSITE = { inteligente: 'tonto', tonto: 'inteligente', genio: 'tonto', trabajador: 'vago', vago: 'trabajador', agresivo: 'pacifico', pacifico: 'agresivo', valiente: 'cobarde', cobarde: 'valiente', fuerte: 'debil', debil: 'fuerte', gigante: 'diminuto', diminuto: 'gigante', fertil: 'esteril', esteril: 'fertil' };
const RANKS = [[1, 'Recluta'], [3, 'Veterano'], [5, 'Campeón'], [8, 'Maestro de armas'], [12, 'Leyenda'], [17, 'Semidiós'], [25, 'Inmortal']];
const rankOf = l => { let r = RANKS[0][1]; for (const [lv, n] of RANKS) if (l >= lv) r = n; return r; };
const ITEMS = [['Espada del Alba', 8, 0], ['Hacha rúnica', 10, 0], ['Arco de las Estrellas', 7, 0], ['Martillo del Trueno', 12, -5], ['Báculo arcano', 6, 20], ['Escudo del Dragón', 2, 60], ['Lanza celeste', 9, 10], ['Corona maldita', 14, -10]];

const SYL = {
  human:  [['Al', 'Bel', 'Cor', 'Dar', 'Ed', 'Fer', 'Gal', 'Hal', 'Is', 'Mar', 'Nor', 'Ro', 'San', 'Tor', 'Val', 'Lu'], ['ia', 'gard', 'mont', 'burgo', 'ona', 'ar', 'en', 'villa', 'esta', 'ano']],
  elf:    [['Ael', 'Sil', 'Lor', 'Thal', 'Ely', 'Fae', 'Ith', 'Nim', 'Gal', 'Ara'], ['wen', 'ndor', 'lith', 'iel', 'assë', 'orë', 'athil', 'ion']],
  dwarf:  [['Khaz', 'Dur', 'Bor', 'Grim', 'Thor', 'Bal', 'Dun', 'Gor', 'Bram'], ['ak', 'dum', 'grund', 'hold', 'rim', 'in', 'zar', 'forja']],
  orc:    [['Gor', 'Mog', 'Uruk', 'Grub', 'Zug', 'Krag', 'Nar', 'Thrak', 'Bol'], ['ash', 'gul', 'muk', 'rok', 'tar', 'zog', 'gash']],
  undead: [['Mor', 'Nec', 'Vel', 'Sep', 'Gri', 'Ossa', 'Lich', 'Umbr'], ['ul', 'tharn', 'mire', 'cripta', 'vex', 'ossum']],
  demon:  [['Baal', 'Az', 'Infer', 'Mal', 'Xar', 'Bel', 'Asmo', 'Vor'], ['oth', 'ius', 'gor', 'zeth', 'ax', 'deus']],
  lizard: [['Ss', 'Kre', 'Zal', 'Tss', 'Yix', 'Sar', 'Ksa'], ['ith', 'ash', 'ka', 'ssa', 'rix', 'zul']],
};
const KT = {
  human: [['Pueblo de', 0], ['Reino de', 0], ['Imperio de', 0]],
  elf: [['Clan élfico de', 0], ['Reino élfico de', 0], ['Imperio élfico de', 0]],
  dwarf: [['Clan enano de', 0], ['Fortaleza de', 1], ['Imperio enano de', 0]],
  orc: [['Tribu de', 1], ['Horda de', 1], ['Imperio orco de', 0]],
  undead: [['Cripta de', 1], ['Dominio de', 0], ['Imperio de los muertos de', 0]],
  demon: [['Culto de', 0], ['Infierno de', 0], ['Imperio infernal de', 0]],
  lizard: [['Nido de', 0], ['Pantano de', 0], ['Imperio lagarto de', 0]],
};
const mkName = race => { const s = SYL[race] || SYL.human; return pick(s[0]) + (rnd() < .3 ? pick(s[0]).toLowerCase() : '') + pick(s[1]); };
const el = k => (k.fem ? 'la ' : 'el ') + k.name;
const del = k => (k.fem ? 'de la ' : 'del ') + k.name;
const al = k => (k.fem ? 'a la ' : 'al ') + k.name;
const El = k => (k.fem ? 'La ' : 'El ') + k.name;
