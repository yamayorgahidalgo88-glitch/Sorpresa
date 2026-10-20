"use strict";
// ---------- guardar / cargar ----------
// Tres ranuras y un autoguardado en el navegador, más exportar/importar un
// archivo .json. Un índice aparte guarda el resumen de cada ranura para
// listarlas sin tener que leer partidas enteras.
const toB64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const fromB64 = s => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
const SAVE_PREFIX = 'caja-de-dioses-slot-', SAVE_META = 'caja-de-dioses-meta', OLD_SAVE = 'caja-de-dioses-save2';
const UNIT_KEYS = ['id', 'type', 'x', 'y', 'city', 'age', 'maxAge', 'level', 'xp', 'kills', 'traits', 'name', 'hero', 'item', 'hp', 'maxHp', 'army', 'archer', 'aggro', 'life', 'food', 'energy', 'mood', 'prof', 'sex', 'fam', 'friends', 'partner', 'parents', 'home', 'kids', 'lastBirth', 'face', 'sick', 'immune', 'settler', 'widow', 'owner'];

function serialize() {
  const list = [];
  for (const u of units) {
    if (u.dead) continue;
    if (u.def.boat) { // los pasajeros se guardan en tierra, en su ciudad
      for (const p of u.cargo || []) { const c = cities[u.city]; list.push({ ...p, x: c ? c.x + .5 : u.x, y: c ? c.y + .5 : u.y, settler: null }); }
      continue;
    }
    list.push(u);
  }
  const used = new Set(); for (const u of list) for (const t of u.traits) if (TRAITS[t]?.custom) used.add(t);
  return {
    v: 4, W, H, tickN, uid, tile: toB64(tile), owner: toB64(new Uint8Array(owner.buffer)), bld: toB64(bld), rad: toB64(rad), ore: toB64(ore), oreAmt: toB64(oreAmt), wall: toB64(wall), road: toB64(road), siteT: toB64(siteT),
    mods: Object.fromEntries(Object.entries(MODS).map(([k, m]) => [k, m.on])), laws: Object.fromEntries(Object.entries(LAWS).map(([k, m]) => [k, m.on])),
    kingdoms: kingdoms.map(k => ({ ...k, css: undefined, _embC: undefined, _embK: undefined, _embUrl: undefined, _embUrlK: undefined, _flag: undefined, _flagK: undefined, wars: [...k.wars], allies: [...k.allies], tech: [...k.tech], king: k.king && !k.king.dead ? k.king.id : null })),
    cities: cities.map(c => c && ({ ...c, k: c.k.id, ores: [] })),
    units: list.map(u => { const o = { k: u.k ? u.k.id : null }; for (const key of UNIT_KEYS) if (u[key] !== undefined && u[key] !== null) o[key] = u[key]; return o; }),
    races: Object.fromEntries(Object.keys(SP).filter(t => SP[t].custom && units.some(u => u.type === t)).map(t => [t, SP[t]])),
    religions, history, histStep, custom: Object.fromEntries([...used].map(t => [t, TRAITS[t]])),
    logs: logs.slice(0, 120),
  };
}
function deserialize(data) {
  if (!data || !data.W || !data.tile) return false;
  for (const k in data.mods) if (MODS[k]) MODS[k].on = data.mods[k];
  for (const k in data.laws) if (LAWS[k]) LAWS[k].on = data.laws[k];
  for (const id in data.custom || {}) if (!TRAITS[id]) { TRAITS[id] = data.custom[id]; customTraits[id] = data.custom[id]; TOOLS.push({ tab: 'rasgos', id: 'r_' + id, n: TRAITS[id].n, kind: 'trait', trait: id, glyph: TRAITS[id].g }); }
  for (const id in data.races || {}) if (!SP[id]) { registerRace(id, data.races[id]); customRaces[id] = data.races[id]; addRaceTools(id); }
  allocWorld(data.W, data.H);
  tile.set(fromB64(data.tile)); owner.set(new Uint16Array(fromB64(data.owner).buffer)); bld.set(fromB64(data.bld)); rad.set(fromB64(data.rad));
  ore.set(fromB64(data.ore)); oreAmt.set(fromB64(data.oreAmt)); wall.set(fromB64(data.wall));
  if (data.road) road.set(fromB64(data.road));
  if (data.siteT) siteT.set(fromB64(data.siteT));
  tickN = data.tickN; uid = data.uid; logs = data.logs || []; religions = data.religions || []; history = data.history || []; histStep = data.histStep || 1;
  kingdoms = data.kingdoms.map(k => ({ mem: {}, ...k, wars: new Set(k.wars), allies: new Set(k.allies), tech: new Set(k.tech), kingId: k.king, king: null }));
  cities = data.cities.map(c => c && ({ has: {}, towers: [], mood: 60, ...c, k: kingdoms[c.k] }));
  const byId = {};
  units = data.units.map(s => {
    const u = { food: 80, energy: 80, mood: 60, prof: null, sex: rnd() < .5 ? 'm' : 'f', fam: null, friends: {}, partner: null, parents: null, home: -1, face: 1, item: null, hero: false, name: null, ...s,
      traits: (s.traits || []).filter(t => TRAITS[t]), def: SP[s.type], k: s.k !== null && s.k !== undefined ? kingdoms[s.k] : null, tx: null, ty: null, think: ri(0, 30), cool: 0, spell: ri(60, 160), hitT: 0, plague: 0, task: null, carry: null, path: null, pgoal: -1, pretry: 0, dead: false, target: null };
    byId[u.id] = u; return u;
  }).filter(u => u.def);
  UMAP.clear(); for (const u of units) UMAP.set(u.id, u);
  for (const k of kingdoms) { k.king = byId[k.kingId] || null; delete k.kingId; }
  computeRegions(); for (const c of cities) if (c && c.alive) scanCity(c);
  selected = null; selectedCity = null; selectedBld = -1; selectedKingdom = null; warPick = null; followSel = null;
  centerCam(); applyModChange(); renderTabs(); renderTools(); setSpeed(0); sideDirty = true;
  return true;
}
function saveMeta() { try { return JSON.parse(localStorage.getItem(SAVE_META) || '{}') || {}; } catch (e) { return {}; } }
function worldSummary() {
  const ak = kingdoms.filter(k => k.alive);
  const top = ak.slice().sort((a, b) => (b.pop || 0) - (a.pop || 0))[0];
  return { year: year(), pop: units.filter(u => u.def.civ).length, kingdoms: ak.length, top: top ? top.name : null, size: W + '×' + H, date: Date.now() };
}
function saveSlot(slot, quiet) {
  try {
    localStorage.setItem(SAVE_PREFIX + slot, JSON.stringify(serialize()));
    const m = saveMeta(); m[slot] = worldSummary(); localStorage.setItem(SAVE_META, JSON.stringify(m));
    if (!quiet) toast(slot === 'auto' ? 'Autoguardado' : `Partida guardada en la ranura ${slot}`);
    return true;
  } catch (e) { if (!quiet) toast('No se pudo guardar: el navegador no deja más espacio. Prueba a exportar a un archivo.'); return false; }
}
function loadSlot(slot) {
  let data;
  try { data = JSON.parse(localStorage.getItem(slot === 'old' ? OLD_SAVE : SAVE_PREFIX + slot) || 'null'); } catch (e) { data = null; }
  if (!data) { toast('Esa ranura está vacía'); return false; }
  if (!deserialize(data)) { toast('La partida está dañada'); return false; }
  toast('Partida cargada. El tiempo está parado.');
  return true;
}
const framed = (() => { try { return window.top !== window; } catch (e) { return true; } })();
function exportGame() {
  if (framed) { // dentro de un marco las descargas no funcionan: se copia al portapapeles
    const txt = JSON.stringify(serialize());
    navigator.clipboard.writeText(txt).then(() => toast('Partida copiada al portapapeles. Pégala en un archivo .json para guardarla.'), () => toast('No se pudo copiar. Usa las ranuras de guardado.'));
    return;
  }
  const blob = new Blob([JSON.stringify(serialize())], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `caja-de-dioses-año-${year()}.json`; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('Mundo exportado a un archivo');
}
function importGame(file) {
  const r = new FileReader();
  r.onload = () => { let data = null; try { data = JSON.parse(r.result); } catch (e) { } if (deserialize(data)) { document.getElementById('modal').hidden = true; toast('Mundo importado. El tiempo está parado.'); } else toast('Ese archivo no es una partida de Caja de Dioses'); };
  r.readAsText(file);
}
// autoguardado cada tres minutos mientras el tiempo corre
let lastAuto = performance.now();
function autoSave(now) { if (!paused && now - lastAuto > 180000 && units.length) { lastAuto = now; saveSlot('auto', true); } }
function hasOldSave() { try { return !!localStorage.getItem(OLD_SAVE); } catch (e) { return false; } }
// compatibilidad con el nombre antiguo
function saveGame() { return saveSlot(1); }
function loadGame() { return loadSlot(1); }
