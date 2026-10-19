"use strict";
// ---------- guardar / cargar ----------
const toB64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const fromB64 = s => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
function saveGame() {
  const data = {
    v: 3, W, H, tickN, uid, tile: toB64(tile), owner: toB64(new Uint8Array(owner.buffer)), bld: toB64(bld), rad: toB64(rad), ore: toB64(ore), oreAmt: toB64(oreAmt), wall: toB64(wall),
    mods: Object.fromEntries(Object.entries(MODS).map(([k, m]) => [k, m.on])), laws: Object.fromEntries(Object.entries(LAWS).map(([k, m]) => [k, m.on])),
    kingdoms: kingdoms.map(k => ({ ...k, wars: [...k.wars], allies: [...k.allies], tech: [...k.tech], king: k.king && !k.king.dead ? k.king.id : null })),
    cities: cities.map(c => c && ({ ...c, k: c.k.id, ores: [] })),
    units: units.filter(u => !u.dead).map(u => ({ id: u.id, type: u.type, x: u.x, y: u.y, k: u.k ? u.k.id : null, city: u.city, age: u.age, maxAge: u.maxAge, level: u.level, xp: u.xp, kills: u.kills, traits: u.traits, name: u.name, hero: u.hero, item: u.item, hp: u.hp, maxHp: u.maxHp, army: u.army, archer: u.archer, aggro: u.aggro, life: u.life, food: u.food, energy: u.energy, mood: u.mood, prof: u.prof, sex: u.sex, fam: u.fam, friends: u.friends, partner: u.partner, parents: u.parents, home: u.home, kids: u.kids, lastBirth: u.lastBirth, face: u.face })),
    logs: logs.slice(0, 80),
  };
  try { localStorage.setItem('caja-de-dioses-save2', JSON.stringify(data)); toast('Partida guardada en este navegador'); }
  catch (e) { toast('No se pudo guardar: el navegador bloquea el almacenamiento'); }
}
function loadGame() {
  let data;
  try { data = JSON.parse(localStorage.getItem('caja-de-dioses-save2') || 'null'); } catch (e) { data = null; }
  if (!data) { toast('No hay ninguna partida guardada'); return false; }
  for (const k in data.mods) if (MODS[k]) MODS[k].on = data.mods[k];
  for (const k in data.laws) if (LAWS[k]) LAWS[k].on = data.laws[k];
  allocWorld(data.W, data.H);
  tile.set(fromB64(data.tile)); owner.set(new Uint16Array(fromB64(data.owner).buffer)); bld.set(fromB64(data.bld)); rad.set(fromB64(data.rad));
  ore.set(fromB64(data.ore)); oreAmt.set(fromB64(data.oreAmt)); wall.set(fromB64(data.wall));
  tickN = data.tickN; uid = data.uid; logs = data.logs || [];
  kingdoms = data.kingdoms.map(k => ({ ...k, wars: new Set(k.wars), allies: new Set(k.allies), tech: new Set(k.tech), kingId: k.king, king: null }));
  cities = data.cities.map(c => c && ({ ...c, k: kingdoms[c.k] }));
  const byId = {};
  units = data.units.map(s => { const u = { food: 80, energy: 80, mood: 60, prof: null, sex: rnd() < .5 ? 'm' : 'f', fam: null, friends: {}, partner: null, parents: null, home: -1, face: 1, ...s, def: SP[s.type], k: s.k !== null ? kingdoms[s.k] : null, tx: null, ty: null, think: ri(0, 30), cool: 0, spell: ri(60, 160), hitT: 0, plague: 0, task: null, carry: null, path: null, pgoal: -1, pretry: 0, settler: null, dead: false, target: null }; byId[u.id] = u; return u; }).filter(u => u.def);
  UMAP.clear(); for (const u of units) UMAP.set(u.id, u);
  for (const k of kingdoms) { k.king = byId[k.kingId] || null; delete k.kingId; }
  computeRegions(); for (const c of cities) if (c && c.alive) scanCity(c);
  centerCam(); applyModChange(); renderTabs(); renderTools(); setSpeed(0); sideDirty = true;
  toast('Partida cargada. El tiempo está parado.');
  return true;
}
