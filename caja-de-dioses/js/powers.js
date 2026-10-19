"use strict";
// ---------- poderes ----------
function circle(cx, cy, r, fn) {
  const r2 = r * r;
  for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(H - 1, Math.ceil(cy + r)); y++)
    for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(W - 1, Math.ceil(cx + r)); x++) {
      const d = dist2(x + .5, y + .5, cx, cy); if (d <= r2) fn(x, y, y * W + x, Math.sqrt(d));
    }
}
function explode(cx, cy, r, o = {}) {
  circle(cx, cy, r, (x, y, i, d) => {
    if (o.crater && d < r * .45) { tile[i] = T.LAVA; bld[i] = 0; }
    else if (!isWater(tile[i])) { if (tile[i] !== T.MOUNT || d < r * .5) tile[i] = d < r * .8 ? T.ASH : tile[i]; if (bld[i]) bld[i] = 4; if (rnd() < (o.fire ?? .3)) ignite(x, y); }
    if (o.rad) rad[i] = Math.max(rad[i], 200);
    if (d < r * .6) wall[i] = 0;
  });
  regionDirty = true;
  rebuildGrid();
  around(cx, cy, r * 1.15, u => { const d = Math.hypot(u.x - cx, u.y - cy); damage(u, (o.dmg ?? 120) * (1 - d / (r * 1.2)), null); });
  for (let k = 0; k < r * 10; k++) { const a = rnd() * 6.28, s = rnd() * .25 * Math.sqrt(r); parts.push({ x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, l: 20 + rnd() * 30, c: pick([[255, 200, 60], [255, 120, 30], [90, 80, 75], [255, 240, 180]]), s: 1.4 }); }
  shake = Math.max(shake, Math.min(18, r * 1.5));
}
function lightning(x, y) {
  fx.push({ k: 'bolt', x: x + .5, y: y + .5, life: 12, seed: rnd() });
  rebuildGrid();
  around(x + .5, y + .5, 2.2, u => damage(u, 60, null));
  ignite(x, y); if (rnd() < .5) ignite(x + ri(-1, 1), y + ri(-1, 1));
  flash = Math.max(flash, .25); shake = Math.max(shake, 3);
}
function nuke(x, y) {
  explode(x, y, 15, { dmg: 999, fire: .6, rad: 1 });
  circle(x, y, 22, (xx, yy, i, d) => { if (d > 15) { rad[i] = Math.max(rad[i], 120); if (rnd() < .2 && TILE[tile[i]].burn) ignite(xx, yy); } });
  fx.push({ k: 'mush', x, y, life: 160 });
  flash = 1; shake = 30;
  addLog('Una bomba nuclear arrasa la región. La radiación tardará años en desaparecer.', 'doom');
}

const TOOLS = [];
function addTool(tab, id, n, kind, extra = {}) { TOOLS.push({ tab, id, n, kind, ...extra }); }
[T.GRASS, T.FERTILE, T.FOREST, T.JUNGLE, T.SAVANNA, T.DESERT, T.MESA, T.SAND, T.SWAMP, T.TUNDRA, T.SNOW, T.ICE, T.HILL, T.ROCK, T.MOUNT, T.BASALT, T.WATER, T.DEEP, T.LAVA, T.ACID, T.ASH, T.CRYSTAL, T.SHROOM, T.CORRUPT]
  .forEach(t => addTool('terreno', 't_' + t, TILE[t].n, 'tile', { tile: t, mod: t === T.CORRUPT ? 'apocalipsis' : (t === T.CRYSTAL || t === T.SHROOM) ? 'magia' : null }));
addTool('terreno', 'raise', 'Elevar', 'raise', { glyph: '▲' });
addTool('terreno', 'lower', 'Hundir', 'lower', { glyph: '▼' });
MAT.forEach((m, i) => { if (m) addTool('materiales', 'm_' + m.id, m.n, 'ore', { ore: i, mod: m.mod }); });
addTool('materiales', 'm_none', 'Quitar mineral', 'unore', { glyph: '✕' });
CIV.forEach(s => addTool('vida', 'v_' + s, 'Pueblo de ' + SP[s].n.toLowerCase(), 'village', { sp: s, mod: SP[s].mod, once: 1 }));
Object.keys(SP).forEach(s => addTool('vida', 's_' + s, SP[s].n, 'spawn', { sp: s, mod: SP[s].mod, once: SP[s].size > 1.5 }));
addTool('rasgos', 'scope', 'Aplicar a', 'scope', { glyph: '◎' });
addTool('rasgos', 'r_clear', 'Quitar rasgos', 'untrait', { glyph: '✕' });
Object.keys(TRAITS).forEach(t => addTool('rasgos', 'r_' + t, TRAITS[t].n, 'trait', { trait: t, glyph: TRAITS[t].g, mod: TRAITS[t].mod }));
addTool('fronteras', 'wall', 'Dibujar frontera', 'wall', { glyph: '┃' });
addTool('fronteras', 'unwall', 'Borrar frontera', 'unwall', { glyph: '⌫' });
addTool('fronteras', 'g_unwall', 'Quitar todas las fronteras', 'act', { glyph: '⛶', act: 'unwallall' });
addTool('fronteras', 'declare', 'Declarar guerra', 'declare', { glyph: '⚔', once: 1 });
addTool('fronteras', 'peace', 'Firmar paz', 'peace', { glyph: '🕊', once: 1 });
addTool('fronteras', 'g_war', '¡Guerra total!', 'act', { glyph: '🔥', act: 'war' });
addTool('fronteras', 'g_peace', 'Paz mundial', 'act', { glyph: '☮', act: 'peace' });
addTool('caos', 'fire', 'Fuego', 'fire', { glyph: '🔥' });
addTool('caos', 'bolt', 'Rayo', 'bolt', { glyph: '⚡', rate: 8 });
addTool('caos', 'meteor', 'Meteorito', 'meteor', { glyph: '☄', once: 1 });
addTool('caos', 'bomb', 'Bomba', 'bomb', { glyph: '💣', once: 1 });
addTool('caos', 'quake', 'Terremoto', 'quake', { glyph: '〰', once: 1 });
addTool('caos', 'flood', 'Inundación', 'flood', { glyph: '🌊', once: 1 });
addTool('caos', 'volcano', 'Volcán', 'volcano', { glyph: '🌋', once: 1 });
addTool('caos', 'nuke', 'Bomba nuclear', 'nuke', { glyph: '☢', once: 1, mod: 'apocalipsis' });
addTool('caos', 'tornado', 'Tornado', 'tornado', { glyph: '🌪', once: 1, mod: 'apocalipsis' });
addTool('caos', 'acid', 'Lluvia ácida', 'acid', { glyph: '☁', once: 1, mod: 'apocalipsis' });
addTool('caos', 'bhole', 'Agujero negro', 'bhole', { glyph: '◉', once: 1, mod: 'apocalipsis' });
addTool('caos', 'plague', 'Plaga', 'plague', { glyph: '☣', mod: 'apocalipsis' });
addTool('bendicion', 'rain', 'Lluvia', 'rain', { glyph: '🌧', once: 1 });
addTool('bendicion', 'bless', 'Bendición', 'bless', { glyph: '✦' });
addTool('bendicion', 'seed', 'Fertilidad', 'seed', { glyph: '🌱' });
addTool('bendicion', 'cure', 'Curar', 'cure', { glyph: '✚' });
addTool('bendicion', 'extinguish', 'Apagar fuego', 'extinguish', { glyph: '💧' });
addTool('bendicion', 'erase', 'Borrar seres', 'erase', { glyph: '✕' });
addTool('dios', 'inspect', 'Inspeccionar', 'inspect', { glyph: '🔍', once: 1 });
addTool('dios', 'move', 'Mover mapa', 'move', { glyph: '✋' });
addTool('dios', 'hero', 'Crear héroe', 'heroize', { glyph: '♛', once: 1, mod: 'heroes' });
addTool('dios', 'gift', 'Regalar recursos', 'gift', { glyph: '🎁', once: 1, mod: 'trucos' });
addTool('dios', 'g_era', 'Avanzar una era', 'act', { glyph: '⚙', act: 'era', mod: 'tecnologia' });
addTool('dios', 'g_meteor', 'Lluvia de meteoritos', 'act', { glyph: '☄', act: 'meteors', mod: 'trucos' });
addTool('dios', 'g_alien', 'Invasión alien', 'act', { glyph: '🛸', act: 'aliens', mod: 'alien' });
addTool('dios', 'g_zombie', 'Apocalipsis zombi', 'act', { glyph: '☠', act: 'zombies', mod: 'apocalipsis' });
addTool('dios', 'g_dragon', 'Despertar dragones', 'act', { glyph: '🐉', act: 'dragons', mod: 'bestiario' });
addTool('dios', 'g_heal', 'Curar el mundo', 'act', { glyph: '✚', act: 'healall', mod: 'trucos' });
addTool('dios', 'g_clear', 'Exterminar todo', 'act', { glyph: '✖', act: 'clear', mod: 'trucos' });

let curTool = TOOLS.find(t => t.id === 'v_human');
let brush = 3, traitScope = 'brush', warPick = null;

function kingdomAt(x, y) {
  const xi = x | 0, yi = y | 0;
  if (xi < 0 || yi < 0 || xi >= W || yi >= H) return null;
  const o = owner[yi * W + xi]; if (o) { const c = cities[o - 1]; if (c && c.alive) return c.k; }
  rebuildGrid();
  const u = nearest(x, y, 3, v => !!v.k && v.k.alive);
  return u ? u.k : null;
}
function applyTool(t, x, y, first) {
  const xi = x | 0, yi = y | 0;
  if (xi < 0 || yi < 0 || xi >= W || yi >= H) return;
  const b = brush;
  switch (t.kind) {
    case 'tile': circle(x, y, b, (xx, yy, i) => { tile[i] = t.tile; if (isWater(t.tile) || TILE[t.tile].liquid || t.tile === T.MOUNT) bld[i] = 0; if (isWater(t.tile) || TILE[t.tile].liquid) ore[i] = 0; fire[i] = 0; }); regionDirty = true; break;
    case 'raise': case 'lower':
      circle(x, y, b, (xx, yy, i) => {
        if (rnd() > .35) return;
        let e = ELEV.indexOf(tile[i]); if (e < 0) e = 3;
        e = clamp(e + (t.kind === 'raise' ? 1 : -1), 0, ELEV.length - 1);
        tile[i] = ELEV[e]; if (isWater(tile[i])) { bld[i] = 0; ore[i] = 0; }
      }); regionDirty = true; break;
    case 'ore': circle(x, y, Math.max(.8, b * .6), (xx, yy, i) => { if (!isWater(tile[i]) && !TILE[tile[i]].liquid && !bld[i] && rnd() < .7) { ore[i] = t.ore; oreAmt[i] = 40; } }); break;
    case 'unore': circle(x, y, b, (xx, yy, i) => { ore[i] = 0; }); break;
    case 'village': foundVillage(t.sp, x, y); break;
    case 'spawn': {
      const def = SP[t.sp];
      if (t.once) { const u = spawn(t.sp, x, y); if (u) toast(`Aparece: ${def.n}`); break; }
      const n = def.civ ? 1 : 1 + (b > 4 ? 1 : 0);
      for (let k = 0; k < n; k++) spawn(t.sp, x + (rnd() - .5) * b, y + (rnd() - .5) * b);
      break;
    }
    case 'trait': case 'untrait': {
      rebuildGrid();
      let targets = [];
      if (traitScope === 'village') {
        const o = owner[yi * W + xi];
        const cid = o ? o - 1 : (nearest(x, y, 3, v => v.def.civ && v.city >= 0)?.city ?? -1);
        if (cid >= 0) targets = units.filter(u => u.city === cid && u.def.civ && !u.dead);
      } else around(x, y, Math.max(1.2, b * .8), u => { if (u.def.civ) targets.push(u); });
      if (!targets.length) { if (first) toast(traitScope === 'village' ? 'Toca dentro de un pueblo' : 'Pasa el pincel por encima de la gente'); break; }
      let n = 0;
      for (const u of targets) { if (t.kind === 'untrait') { if (u.traits.length) { u.traits = []; u.maxHp = maxHpOf(u); u.hp = Math.min(u.hp, u.maxHp); n++; } } else if (addTrait(u, t.trait)) { n++; burst(u.x, u.y, [255, 230, 120], 2, .3); } }
      if (n && (first || traitScope === 'village')) toast(t.kind === 'untrait' ? `Rasgos quitados a ${n}` : `${TRAITS[t.trait].n}: ${n} persona${n === 1 ? '' : 's'}`);
      sideDirty = true;
      break;
    }
    case 'declare': case 'peace': {
      const k = kingdomAt(x, y);
      if (!k) { toast('Toca un pueblo'); break; }
      if (!warPick || !warPick.alive) { warPick = k; toast(`${k.name} elegido. Ahora toca ${t.kind === 'declare' ? 'al enemigo' : 'el otro pueblo'}.`); break; }
      if (warPick === k) { toast('Elige otro pueblo distinto'); break; }
      if (t.kind === 'declare') { if (warPick.wars.has(k.id)) toast('Ya están en guerra'); else declareWar(warPick, k, true); }
      else { if (warPick.wars.has(k.id)) makePeace(warPick, k); else toast('No estaban en guerra'); }
      warPick = null; sideDirty = true; break;
    }
    case 'fire': circle(x, y, b * .7, (xx, yy) => { if (rnd() < .5) ignite(xx, yy); }); break;
    case 'bolt': lightning(xi, yi); break;
    case 'meteor': fx.push({ k: 'meteor', x, y, life: 40, r: 4 + b * .4 }); break;
    case 'bomb': explode(x, y, 3 + b * .5, { dmg: 150, fire: .4 }); break;
    case 'nuke': nuke(x, y); break;
    case 'quake': fx.push({ k: 'quake', x, y, life: 140, r: 8 + b }); addLog('Un terremoto sacude la tierra.', 'doom'); break;
    case 'flood': circle(x, y, 6 + b, (xx, yy, i, d) => { const tt = tile[i]; if ([T.SAND, T.GRASS, T.FIELD, T.SWAMP, T.ASH, T.DESERT, T.SAVANNA, T.FERTILE].includes(tt) || (d < 4 && tt !== T.MOUNT && tt !== T.SNOW)) { tile[i] = d < 4 ? T.DEEP : T.WATER; bld[i] = 0; fire[i] = 0; ore[i] = 0; } }); regionDirty = true; break;
    case 'volcano': circle(x, y, 5, (xx, yy, i, d) => { tile[i] = d < 1.6 ? T.LAVA : d < 3.5 ? T.MOUNT : T.BASALT; bld[i] = 0; }); fx.push({ k: 'volcano', x, y, life: 900 }); regionDirty = true; break;
    case 'tornado': fx.push({ k: 'tornado', x, y, vx: (rnd() - .5) * .1, vy: (rnd() - .5) * .1, life: 700 }); break;
    case 'acid': fx.push({ k: 'cloud', acid: 1, x, y, vx: (rnd() - .5) * .04, vy: (rnd() - .5) * .02, life: 420 }); break;
    case 'rain': fx.push({ k: 'cloud', acid: 0, x, y, vx: (rnd() - .5) * .04, vy: (rnd() - .5) * .02, life: 420 }); break;
    case 'bhole': fx.push({ k: 'bhole', x, y, life: 520 }); addLog('Se abre un agujero negro en el mundo.', 'doom'); break;
    case 'plague': rebuildGrid(); around(x, y, b, u => { if (u.def.civ) u.plague = 900; }); break;
    case 'bless': rebuildGrid(); around(x, y, b, u => { if (u.def.civ || u.def.passive) { u.hp = u.maxHp; u.plague = 0; if (first || rnd() < .05) gainXp(u, u.level * 2); burst(u.x, u.y, [255, 230, 120], 3, .5); } }); break;
    case 'seed': circle(x, y, b, (xx, yy, i) => { const tt = tile[i]; if (tt === T.ASH || tt === T.DESERT || tt === T.CORRUPT || tt === T.SAND || tt === T.TUNDRA) tile[i] = T.GRASS; else if (tt === T.GRASS && rnd() < .4) tile[i] = T.FERTILE; rad[i] = 0; }); break;
    case 'cure': rebuildGrid(); around(x, y, b, u => { u.plague = 0; u.hp = Math.min(u.maxHp, u.hp + 5); }); circle(x, y, b, (xx, yy, i) => { rad[i] = 0; if (tile[i] === T.CORRUPT) tile[i] = T.GRASS; }); break;
    case 'erase': rebuildGrid(); around(x, y, b, u => { u.dead = true; if (u.k && u.k.king === u) u.k.king = null; }); units = units.filter(u => !u.dead); break;
    case 'extinguish': circle(x, y, b + 1, (xx, yy, i) => { fire[i] = 0; }); break;
    case 'heroize': { rebuildGrid(); const u = nearest(x, y, 3, o => o.def.civ); if (u) { u.level = Math.max(u.level, 5); if (!u.hero) makeHero(u); select(u); } else toast('No hay nadie cerca'); break; }
    case 'gift': { const k = kingdomAt(x, y); if (k) { for (const r in k.res) k.res[r] += 40; toast(`${k.name} recibe 40 de cada recurso`); sideDirty = true; } else toast('Toca un pueblo'); break; }
    case 'inspect': inspectAt(x, y); break;
  }
}
function wallLine(x0, y0, x1, y1, on) {
  const r = on ? Math.max(.75, brush * .3) : Math.max(1, brush * .7);
  const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
  for (let s = 0; s <= steps; s++) {
    const x = x0 + (x1 - x0) * s / steps, y = y0 + (y1 - y0) * s / steps;
    circle(x, y, r, (xx, yy, i) => { if (on) { if (!isWater(tile[i])) { wall[i] = 1; bld[i] = 0; } } else wall[i] = 0; });
  }
  if (on) for (const u of units) if (!u.def.fly && wall[(u.y | 0) * W + (u.x | 0)]) {
    for (let a = 0; a < 12; a++) { const nx = u.x + (rnd() - .5) * 4, ny = u.y + (rnd() - .5) * 4; if (canStand(u.def, nx, ny)) { u.x = nx; u.y = ny; break; } }
    u.tx = null;
  }
  regionDirty = true;
}
function globalAct(a) {
  const alive = kingdoms.filter(k => k.alive);
  if (a === 'unwallall') { wall.fill(0); computeRegions(); addLog('Los dioses borran todas las fronteras. Los pueblos ya pueden encontrarse.', 'doom'); toast('Fronteras eliminadas'); }
  if (a === 'peace') { for (const k of alive) for (const w of [...k.wars]) if (kingdoms[w]) makePeace(k, kingdoms[w]); LAWS.guerras.on = false; toast('Paz mundial. Guerras automáticas apagadas (puedes encenderlas en Leyes).'); }
  if (a === 'war') { if (alive.length < 2) { toast('Hacen falta al menos dos pueblos'); return; } for (let i = 0; i < alive.length; i++) for (let j = i + 1; j < alive.length; j++) declareWar(alive[i], alive[j], true); toast('Todos contra todos'); }
  if (a === 'era') {
    if (!alive.length) toast('No hay pueblos');
    for (const k of alive) { const te = Math.min(ERAS.length - 1, k.era + 1); for (const t of TECH) if (t.era <= te && modOn(t.mod) && !k.tech.has(t.id)) applyTech(k, t, true); addLog(`${El(k)} avanza a la ${ERAS[k.era]}.`, 'tech'); }
  }
  if (a === 'meteors') { for (let k = 0; k < 14; k++) { const p = randomTile(() => true); fx.push({ k: 'meteor', x: p[0], y: p[1], life: 30 + k * 6, r: 4 }); } addLog('Una lluvia de meteoritos cae sobre el mundo.', 'doom'); }
  if (a === 'aliens') { for (let k = 0; k < 4; k++) { const p = randomTile(t => !isWater(t)); if (p) spawn('ufo', p[0], p[1]); } addLog('¡Llegan los OVNIs! Empiezan las abducciones.', 'doom'); }
  if (a === 'zombies') { let n = 0; for (const c of cities) if (c && c.alive) for (let k = 0; k < 3; k++) { if (spawn('zombie', c.x + ri(-6, 6), c.y + ri(-6, 6))) n++; } if (!n) for (let k = 0; k < 12; k++) { const p = randomTile(t => t === T.GRASS); if (p) spawn('zombie', p[0], p[1]); } addLog('Los muertos se levantan: comienza el apocalipsis zombi.', 'doom'); }
  if (a === 'dragons') { for (let k = 0; k < 3; k++) { const p = randomTile(t => t === T.MOUNT || t === T.HILL) || randomTile(() => true); spawn('dragon', p[0], p[1]); } addLog('Tres dragones despiertan en las montañas.', 'doom'); }
  if (a === 'healall') { for (const u of units) { u.hp = u.maxHp; u.plague = 0; } rad.fill(0); for (const i of fires) fire[i] = 0; toast('Mundo curado'); }
  if (a === 'clear') { for (const u of units) u.dead = true; for (const k of kingdoms) k.king = null; units = []; toast('Todos los seres han desaparecido'); }
  sideDirty = true;
}
