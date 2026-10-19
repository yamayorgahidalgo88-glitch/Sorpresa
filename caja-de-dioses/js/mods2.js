"use strict";
// ---------- packs de mods: ecosistema, rasgos ampliados, superpoderes,
// enfermedades, mentes visibles y rasgos creados por el jugador ----------
Object.assign(MODS, {
  ecosistema:    { n: 'Ecosistema', d: 'Ciervos, osos, conejos, cangrejos, peces, pájaros, gallinas y mascotas que siguen a sus dueños.', on: true },
  rasgos2:       { n: 'Rasgos ampliados', d: 'Veinte rasgos nuevos: glotón, devoto, bardo, berserker, ambicioso, noctámbulo, curandero…', on: true },
  superpoderes:  { n: 'Superpoderes', d: 'Vampiros, licántropos, teletransporte, tormenta, escudo de energía y veneno.', on: true },
  enfermedades:  { n: 'Enfermedades', d: 'Las ciudades grandes sufren epidemias. La medicina y los sanadores las frenan; algunos nacen inmunes.', on: true },
  mentes:        { n: 'Mentes visibles', d: 'Al acercarte verás un bocadillo sobre cada habitante con lo que está pensando hacer.', on: true },
});

// ---------- animales ----------
Object.assign(SP, {
  deer:    { n: 'Ciervos', mod: 'ecosistema', skin: [168, 116, 70], hp: 14, atk: 0, spd: .8, age: [12, 20], passive: 1, spr: 'deer', breed: [.01, 60], spawnOn: [T.FOREST, T.GRASS] },
  rabbit:  { n: 'Conejos', mod: 'ecosistema', skin: [206, 196, 180], hp: 4, atk: 0, spd: .9, age: [4, 8], passive: 1, spr: 'rabbit', size: .7, breed: [.03, 80], spawnOn: [T.GRASS, T.FERTILE, T.SAVANNA] },
  bear:    { n: 'Osos', mod: 'ecosistema', skin: [104, 72, 48], hp: 60, atk: 7, spd: .55, age: [20, 30], hunter: 1, prey: ['deer', 'rabbit', 'sheep', 'chicken'], spr: 'bear', size: 1.2, breed: [.004, 16], spawnOn: [T.FOREST, T.TUNDRA] },
  crab:    { n: 'Cangrejos', mod: 'ecosistema', skin: [222, 92, 64], hp: 6, atk: 1, spd: .35, age: [6, 10], passive: 1, spr: 'crab', size: .7, swim: 1, breed: [.008, 40], spawnOn: [T.SAND] },
  fish:    { n: 'Peces', mod: 'ecosistema', skin: [120, 180, 210], hp: 3, atk: 0, spd: .5, age: [4, 8], passive: 1, waterOnly: 1, spr: 'fish', size: .7, breed: [.02, 90], spawnOn: [T.WATER] },
  bird:    { n: 'Pájaros', mod: 'ecosistema', skin: [70, 70, 90], hp: 3, atk: 0, spd: 1.1, age: [5, 9], passive: 1, fly: 1, spr: 'bird', size: .7, breed: [.012, 40], spawnOn: [T.FOREST, T.GRASS, T.JUNGLE] },
  chicken: { n: 'Gallinas', mod: 'ecosistema', skin: [244, 240, 228], hp: 4, atk: 0, spd: .45, age: [5, 8], passive: 1, spr: 'chicken', size: .7, breed: [.02, 70], pet: 'farm' },
  dog:     { n: 'Perros', mod: 'ecosistema', skin: [176, 128, 80], hp: 14, atk: 3, spd: .9, age: [10, 15], spr: 'dog', size: .8, pet: 'follow' },
  cat:     { n: 'Gatos', mod: 'ecosistema', skin: [120, 120, 126], hp: 8, atk: 2, spd: .8, age: [12, 18], spr: 'cat', size: .7, pet: 'follow' },
});
SP.wolf.prey = ['sheep', 'deer', 'rabbit', 'chicken'];
SP.sheep.breed = [.01, 70]; SP.wolf.breed = [.005, 30];
Object.assign(USPR, {
  deer:    { f: [['.....d.d', '......d.', '.....sse', 'ssssss..', '.ssssss.', '.l...l..'], ['.....d.d', '......d.', '.....sse', 'ssssss..', '.ssssss.', 'l.l..l.l']] },
  rabbit:  { f: [['...ss', '...se', 'ssss.', 'sSss.'], ['...ss', '...se', '.sss.', 'ss.s.']] },
  bear:    { f: [['......ss.', '.sssssss.', 'sssssssse', 'sSSSSSSs.', '.l..l.l..'], ['......ss.', '.sssssss.', 'sssssssse', 'sSSSSSSs.', 'l..l...l.']] },
  crab:    { f: [['s.....s', '.s.e.s.', '.sssss.', 's.s.s.s'], ['.s...s.', 's..e..s', '.sssss.', '.s.s.s.']] },
  fish:    { f: [['....ss.', 's.sssse', 'sssSss.', 's..ss..'], ['....ss.', '..sssse', 'ssSsss.', '...ss..']] },
  bird:    { f: [['s.....s', '.s...s.', '..sss..', '...e...'], ['.......', 'sss.sss', '..sss..', '...e...']] },
  chicken: { f: [['...rr', '..sse', '.ssss', 'ssss.', '.l.l.'], ['...rr', '..sse', '.ssss', 'ssss.', 'l...l']] },
  dog:     { f: [['......s.', '.....sse', 's.sssss.', '.ssssss.', '.l..l...'], ['......s.', '.....sse', '.ssssss.', 'sssssss.', 'l..l.l..']] },
  cat:     { f: [['.....s.s', 's....sse', 's.ssss..', '.ssssS..', '.l..l...'], ['.....s.s', '.s...sse', 's.ssss..', '.ssssS..', 'l..l.l..']] },
});
// mascotas y gallinas: viven junto a la gente
ANIMAL_HOOKS.dog = ANIMAL_HOOKS.cat = u => {
  let o = unitById(u.owner);
  if (!o) { o = nearest(u.x, u.y, 8, v => v.def.civ && !v.dead); u.owner = o ? o.id : null; }
  if (o && dist2(u.x, u.y, o.x, o.y) > 2.5) { u.tx = o.x + (rnd() - .5) * 1.5; u.ty = o.y + (rnd() - .5) * 1.5; return true; }
  return false;
};
ANIMAL_HOOKS.chicken = u => {
  const i = (u.y | 0) * W + (u.x | 0);
  if (!owner[i] || rnd() < .3) { const c = cities.find(c => c && c.alive && dist2(c.x, c.y, u.x, u.y) < 400); if (c) { u.tx = c.x + .5 + (rnd() - .5) * c.radius; u.ty = c.y + .5 + (rnd() - .5) * c.radius; return true; } }
  return false;
};
// cría y aparición natural de animales
function animalBreed(u) {
  const b = u.def.breed; if (!b || !modOn(u.def.mod)) return;
  if (rnd() < b[0] && (countType[u.type] || 0) < Math.min(b[1], N / (12000 / b[1]))) spawn(u.type, u.x, u.y);
}
function ecoSpawns() {
  if (!LAWS.salvaje.on || !units.length) return;
  for (const t in SP) {
    const d = SP[t]; if (!d.spawnOn || !modOn(d.mod)) continue;
    if ((countType[t] || 0) < Math.min(6, d.breed[1] / 6) && rnd() < .5) { const p = randomTile(x => d.spawnOn.includes(x)); if (p) spawn(t, p[0] + .5, p[1] + .5); }
  }
  if (modOn('ecosistema')) for (const c of cities) {
    if (!c || !c.alive || c.pop < 8 || rnd() > .15) continue;
    const near = t => units.filter(o => o.type === t && dist2(o.x, o.y, c.x, c.y) < 225).length;
    if (c.fields > 3 && near('chicken') < 3) spawn('chicken', c.x + .5 + ri(-2, 2), c.y + .5 + ri(-2, 2));
    else if (near('dog') + near('cat') < Math.min(4, c.pop / 8)) spawn(rnd() < .5 ? 'dog' : 'cat', c.x + .5 + ri(-2, 2), c.y + .5 + ri(-2, 2));
  }
}

// ---------- rasgos ampliados y superpoderes ----------
// claves nuevas: hunger (lo que come), tired (cansancio), social, berserk,
// poison, vamp (roba vida), tele (teletransporte), storm (rayos),
// dmgTaken (daño recibido), night (solo de noche), aura (cura), bard (ánimo)
Object.assign(TRAITS, {
  gloton:      { n: 'Glotón', cat: 'Carácter', g: '🍖', hunger: 1.7, mod: 'rasgos2', bad: 1, d: 'Come casi el doble.' },
  asceta:      { n: 'Asceta', cat: 'Carácter', g: '🍃', hunger: .55, mod: 'rasgos2', d: 'Se conforma con muy poca comida.' },
  noctambulo:  { n: 'Noctámbulo', cat: 'Cuerpo', g: '🦉', tired: .5, mod: 'rasgos2', d: 'Necesita dormir la mitad.' },
  dormilon:    { n: 'Dormilón', cat: 'Cuerpo', g: '😴', tired: 1.8, mod: 'rasgos2', bad: 1, d: 'Se cansa enseguida.' },
  sociable:    { n: 'Sociable', cat: 'Carácter', g: '🗣', social: 1.8, mod: 'rasgos2', d: 'Busca compañía y alegra a los demás.' },
  solitario:   { n: 'Solitario', cat: 'Carácter', g: '🌑', social: .2, work: 1.15, mod: 'rasgos2', d: 'Evita a la gente y trabaja más.' },
  devoto:      { n: 'Devoto', cat: 'Mente', g: '🙏', mod: 'rasgos2', d: 'Reza a menudo y difunde la fe de su pueblo.' },
  bardo:       { n: 'Bardo', cat: 'Habilidad', g: '🎵', bard: 1, mod: 'rasgos2', d: 'Sus canciones suben el ánimo de toda su ciudad.' },
  berserker:   { n: 'Berserker', cat: 'Carácter', g: '🪓', berserk: 1, aggr: .5, mod: 'rasgos2', d: 'Con poca vida golpea mucho más fuerte.' },
  ambicioso:   { n: 'Ambicioso', cat: 'Carácter', g: '🎯', ambition: 1, mod: 'rasgos2', d: 'Quiere el trono: su ciudad se rebela más.' },
  curandero:   { n: 'Curandero', cat: 'Habilidad', g: '🌿', aura: 1, mod: 'rasgos2', d: 'Cura poco a poco a quien tiene cerca, sin magia.' },
  explorador:  { n: 'Explorador', cat: 'Mente', g: '🗺', explore: 3, spd: 1.1, mod: 'rasgos2', d: 'Funda colonias muy lejos.' },
  carismatico: { n: 'Carismático', cat: 'Carácter', g: '✨', lead: 1, charm: 1, mod: 'rasgos2', d: 'Enamora y lidera con facilidad.' },
  inmune:      { n: 'Inmune', cat: 'Cuerpo', g: '🛡', immune: 1, mod: 'rasgos2', d: 'No enferma nunca.' },
  torpe:       { n: 'Torpe', cat: 'Cuerpo', g: '🥴', work: .8, atk: .85, mod: 'rasgos2', bad: 1, d: 'Se le cae todo.' },
  alquimista:  { n: 'Alquimista', cat: 'Mente', g: '⚗', research: 2, mod: 'rasgos2', d: 'Investiga con fórmulas extrañas.' },
  vampiro:     { n: 'Vampiro', cat: 'Poder', g: '🧛', vamp: .35, hunger: .2, night: 0, atk: 1.2, mod: 'superpoderes', d: 'Roba vida al morder. No necesita casi comer.' },
  licantropo:  { n: 'Licántropo', cat: 'Poder', g: '🐺', wolfAtk: 1.8, mod: 'superpoderes', d: 'De noche se vuelve una bestia: más ataque y velocidad.' },
  teletransporte: { n: 'Teletransporte', cat: 'Poder', g: '🌀', tele: 1, mod: 'superpoderes', d: 'Aparece de golpe junto a sus enemigos.' },
  tormenta:    { n: 'Señor de la tormenta', cat: 'Poder', g: '🌩', storm: 1, magic: 1, mod: 'superpoderes', d: 'Lanza rayos a sus enemigos.' },
  escudo:      { n: 'Escudo de energía', cat: 'Poder', g: '🔰', dmgTaken: .5, mod: 'superpoderes', d: 'Recibe la mitad de daño.' },
  venenoso:    { n: 'Venenoso', cat: 'Poder', g: '🐍', poison: 1, mod: 'superpoderes', d: 'Sus golpes envenenan.' },
});
Object.assign(OPPOSITE, { gloton: 'asceta', asceta: 'gloton', noctambulo: 'dormilon', dormilon: 'noctambulo', sociable: 'solitario', solitario: 'sociable' });

// efectos que no son simples multiplicadores
function traitTick(u) {
  if (u.poison > 0) { u.poison--; if (u.poison % 10 === 0) damage(u, 1.2, null); }
  if (u.sick > 0) {
    u.sick--; if (u.sick % 12 === 0) damage(u, .5, null);
    if (u.sick % 30 === 0 && modOn('enfermedades')) around(u.x, u.y, 1.8, o => { if (o.def.civ && !o.sick && !o.immune && !hasTrait(o, 'inmune') && rnd() < .12) o.sick = 360; });
    if (u.sick === 0) u.immune = 1;
  }
  if (!u.traits.length) return;
  if (hasTrait(u, 'curandero') && tickN % 50 === u.id % 50) around(u.x, u.y, 3, o => { if (o.def.civ && !isEnemy(u, o) && o.hp < o.maxHp) { o.hp = Math.min(o.maxHp, o.hp + 3); if (o.sick && rnd() < .3) o.sick = 0; } });
  if (hasTrait(u, 'teletransporte') && u.target && !u.target.dead && rnd() < .006 && dist2(u.x, u.y, u.target.x, u.target.y) > 9) {
    const t = u.target, nx = t.x + (rnd() - .5) * 2, ny = t.y + (rnd() - .5) * 2;
    if (canStand(u.def, nx, ny)) { burst(u.x, u.y, [180, 120, 255], 8, .6); u.x = nx; u.y = ny; burst(nx, ny, [180, 120, 255], 8, .6); }
  }
  if (hasTrait(u, 'tormenta') && --u.spell <= 0) {
    u.spell = ri(120, 200);
    const e = nearest(u.x, u.y, 9, o => isEnemy(u, o));
    if (e) { fx.push({ k: 'bolt', x: e.x, y: e.y, life: 12, seed: rnd() }); damage(e, 25 + atkOf(u), u); flash = Math.max(flash, .08); }
  }
}
// ataque extra según rasgos especiales (se multiplica en atkOf)
function traitAtk(u) {
  let m = 1;
  if (hasTrait(u, 'berserker') && u.hp < u.maxHp * .4) m *= 1.7;
  if (hasTrait(u, 'licantropo') && isNight()) m *= 1.8;
  return m;
}
// golpes cuerpo a cuerpo: veneno y robo de vida
function onHit(src, t, d) {
  if (!src || !src.traits || !src.traits.length) return;
  if (hasTrait(src, 'venenoso')) t.poison = Math.max(t.poison || 0, 120);
  if (hasTrait(src, 'vampiro')) src.hp = Math.min(src.maxHp, src.hp + d * .35);
}

// ---------- enfermedades ----------
function diseaseCheck(c, members) {
  if (!modOn('enfermedades') || c.pop < 22) return;
  const med = c.k.tech.has('medicina') ? .3 : 1;
  const crowd = c.pop / Math.max(6, c.cap);
  if (rnd() < .0025 * (c.pop / 22) * crowd * med) {
    let n = 0;
    for (const o of members) { if (n >= 3) break; if (!o.immune && !hasTrait(o, 'inmune') && rnd() < .3) { o.sick = 360; n++; } }
    if (n) addLog(`Brota una epidemia de fiebre en ${c.name}.`, 'doom');
  }
}

// ---------- mentes visibles: icono de lo que piensa cada uno ----------
const TASKICON = { eat: '🍞', forage: '🫐', sleep: '💤', farm: '🌾', gather: '🧺', wood: '🪓', mine: '⛏', stone: '🪨', build: '🔨', fish: '🎣', hunt: '🏹', study: '📜', patrol: '🛡', march: '⚔', social: '💬', love: '❤', play: '⚽', wander: '🚶', rule: '👑', settle: '🚩', flee: '😱', train: '🗡', pray: '🙏' };

// ---------- rasgos creados por el jugador ----------
const CUSTOM_KEY = 'caja-de-dioses-rasgos';
let customTraits = {};
function loadCustomTraits() {
  try { customTraits = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '{}') || {}; } catch (e) { customTraits = {}; }
  for (const id in customTraits) TRAITS[id] = customTraits[id];
}
function saveCustomTraits() { try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(customTraits)); return true; } catch (e) { return false; } }
loadCustomTraits();
