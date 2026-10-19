"use strict";
// ---------- pueblos (reinos) y ciudades ----------
function newKingdom(race, founder) {
  const used = kingdoms.filter(k => k.alive).map(k => k.hue);
  let hue = ri(0, 359);
  for (let a = 0; a < 25; a++) { if (used.every(h => Math.min(Math.abs(h - hue), 360 - Math.abs(h - hue)) > 26)) break; hue = ri(0, 359); }
  const k = {
    id: kingdoms.length, base: mkName(race), rank: 0, race, hue, color: hsl(hue, 72, 52),
    wars: new Set(), allies: new Set(), warYears: {}, alive: true, king: null, capital: -1, born: year(),
    res: Object.fromEntries(RESLIST.map(r => [r[0], 0])), found: {}, tech: new Set(), rp: 0,
    weapon: { tier: 0, n: WEAPONS[0][0], c: null }, armor: { tier: 0, n: ARMORS[0][0] }, house: 0, walls: 0, ranged: 0, gun: 0, silver: 0, siege: 0, rof: 0, era: 0,
    mul: { work: 1, food: 1, research: 1, birth: 1, speed: 1, age: 1 }, pop: 0, blocked: {}, culture: {}
  };
  k.res.madera = 12; k.res.piedra = 6;
  nameKingdom(k);
  kingdoms.push(k);
  if (founder) { founder.name = founder.name || mkName(race); k.king = founder; }
  return k;
}
function nameKingdom(k) {
  if (k.custom) { k.name = k.custom; k.fem = k.customFem; return; }
  const t = KT[k.race][k.rank]; k.name = t[0] + ' ' + k.base; k.fem = !!t[1];
}
function foundCity(u, force) {
  u.settler = null;
  const x = u.x | 0, y = u.y | 0, i = y * W + x;
  if (!force && (owner[i] || !TILE[tile[i]].build || nearCity(x, y, 8))) return null;
  let k = u.k && u.k.alive ? u.k : null;
  const isNew = !k;
  if (!k) k = newKingdom(u.type, u);
  const c = { id: cities.length, name: mkName(u.type), x, y, k, alive: true, pop: 0, cap: 6, food: 8, fields: 0, houses: 0, radius: 3, empty: 0, born: year(), ores: [] };
  cities.push(c);
  if (k.capital < 0 || !cities[k.capital] || !cities[k.capital].alive) k.capital = c.id;
  bld[i] = 2; ore[i] = 0;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) claim(c, x + dx, y + dy);
  u.city = c.id; u.k = k;
  rebuildGrid();
  around(u.x, u.y, 6, o => { if (o.def.civ && o.type === u.type && o.city < 0 && !o.settler && !o.k) { o.city = c.id; o.k = k; } });
  if (isNew) addLog(`Nace ${el(k)}, fundado por ${u.name}.`, 'found');
  else addLog(`${El(k)} funda la ciudad de ${c.name}.`, 'found');
  regionDirty = true;
  return c;
}
function foundVillage(race, x, y) {
  const def = SP[race];
  if (!canStand(def, x, y) || !TILE[tile[(y | 0) * W + (x | 0)]].build) { toast('Ponlo en tierra firme donde se pueda construir'); return; }
  if (owner[(y | 0) * W + (x | 0)]) { toast('Ahí ya hay un pueblo'); return; }
  const leader = spawn(race, (x | 0) + .5, (y | 0) + .5);
  if (!leader) return;
  const c = foundCity(leader, true);
  if (!c) return;
  for (let n = 0; n < 9; n++) { const u = spawn(race, c.x + .5 + ri(-2, 2), c.y + .5 + ri(-2, 2), c.k, c.id); if (u && n < 3) u.age = ri(3, 10); }
  for (let n = 0; n < 4; n++) { const p = pickTile(c.x, c.y, 2, j => owner[j] === c.id + 1 && !bld[j] && TILE[tile[j]].build); if (p) bld[p[1] * W + p[0]] = 1; }
  scanCity(c);
  toast(`${c.k.name}: 10 habitantes. Dales rasgos en la pestaña Rasgos.`);
  sideDirty = true;
  return c;
}
function claim(c, x, y) {
  if (x < 0 || y < 0 || x >= W || y >= H) return false;
  const i = y * W + x;
  if (owner[i] || wall[i] || isWater(tile[i]) || TILE[tile[i]].liquid) return false;
  owner[i] = c.id + 1; return true;
}
function destroyCity(c, why) {
  c.alive = false;
  const r = 22;
  for (let y = Math.max(0, c.y - r); y < Math.min(H, c.y + r); y++) for (let x = Math.max(0, c.x - r); x < Math.min(W, c.x + r); x++) {
    const i = y * W + x; if (owner[i] === c.id + 1) { owner[i] = 0; if (bld[i]) bld[i] = 4; }
  }
  for (const u of units) if (u.city === c.id) u.city = -1;
  if (why) addLog(`La ciudad de ${c.name} ${why}.`, 'doom');
}
function tryCapture(u, c) {
  if (!c.alive || c.k === u.k) return;
  const def = nearest(c.x + .5, c.y + .5, 4, o => o.city === c.id && o.def.civ && o.age > 12);
  if (def) { u.target = def; return; }
  const old = c.k;
  c.k = u.k;
  for (const o of units) if (o.city === c.id) { o.k = u.k; o.army = false; }
  for (const r in old.res) { const loot = Math.floor(old.res[r] * .3); old.res[r] -= loot; u.k.res[r] += loot; }
  addLog(`${El(u.k)} conquista ${c.name}, arrebatada ${al(old)}, y saquea sus almacenes.`, 'war');
  if (old.capital === c.id) old.capital = -1;
}
function scanCity(c) {
  let houses = 0, fields = 0, owned = 0, food = 0;
  const r = Math.ceil(c.radius) + 4, id1 = c.id + 1;
  c.ores = [];
  for (let y = Math.max(0, c.y - r); y <= Math.min(H - 1, c.y + r); y++) for (let x = Math.max(0, c.x - r); x <= Math.min(W - 1, c.x + r); x++) {
    const i = y * W + x;
    if (ore[i] && (owner[i] === id1 || (!owner[i] && dist2(x, y, c.x, c.y) < (c.radius + 3) ** 2)) && region[i] !== -1) c.ores.push(i);
    if (owner[i] !== id1) continue;
    owned++; if (bld[i] === 1) houses++;
    const t = tile[i]; if (t === T.FIELD) fields++;
    food += TILE[t].food || 0;
    if ((x > 0 && isWater(tile[i - 1])) || (x < W - 1 && isWater(tile[i + 1]))) food += .25;
  }
  c.houses = houses; c.fields = fields; c.owned = owned; c.foodYield = food;
  const ht = modOn('tecnologia') ? c.k.house : 0;
  c.cap = 5 + Math.floor(houses * (1.5 + ht * .5));
}
function cityUpdate(c) {
  if (!c.alive) return;
  scanCity(c);
  const id1 = c.id + 1, k = c.k, race = k.race, sp = SP[race];
  if (!bld[c.y * W + c.x] || bld[c.y * W + c.x] === 4) bld[c.y * W + c.x] = 2;
  if (!sp.noFood && LAWS.hambre.on) {
    c.food += c.foodYield * .16 * kmul(k, 'food') - c.pop * .09;
    if (c.food < 0) { c.food = 0; if (c.pop > 2 && rnd() < .25) { const v = units.find(o => o.city === c.id && !o.dead); if (v) kill(v, null, 'hambre'); } }
    c.food = Math.min(c.food, 60 + c.pop * 2);
  } else c.food = 20;
  // nacimientos con herencia
  const members = units.filter(o => o.city === c.id && !o.dead && o.def.civ && o.age >= 14);
  const fert = members.length ? members.reduce((s, o) => s + tmul(o, 'fert'), 0) / members.length : 0;
  const birth = (sp.noFood ? .15 : .38) * fert * kmul(k, 'birth');
  if (members.length >= 2 && c.pop < c.cap && c.food > 1.5 && rnd() < birth) {
    const fertile = members.filter(o => tmul(o, 'fert') > 0);
    const pa = pick(fertile.length ? fertile : members), pb = pick(members);
    let traits = [];
    if (LAWS.herencia.on) {
      const pool = new Set([...pa.traits, ...pb.traits]);
      for (const t of pool) {
        const both = pa.traits.includes(t) && pb.traits.includes(t);
        const inh = TRAITS[t].inh ?? 1;
        if (rnd() < (both ? .8 : .45) * inh) traits.push(t);
      }
    }
    if (LAWS.mutacion.on && rnd() < .06) {
      const pool = Object.keys(TRAITS).filter(t => modOn(TRAITS[t].mod) && t !== 'inmortal');
      const t = pick(pool); if (!traits.includes(t)) traits.push(t);
    }
    const clean = [];
    for (const t of traits) { if (OPPOSITE[t] && clean.includes(OPPOSITE[t])) continue; if (!clean.includes(t)) clean.push(t); }
    const b = spawn(race, c.x + .5, c.y + .5, k, c.id, { age: 0, traits: clean });
    if (b) c.food -= 1.5;
  }
  // territorio
  c.radius = Math.min(15, 3 + Math.sqrt(c.pop) * 1.35);
  for (let a = 0; a < 8; a++) {
    const ang = rnd() * Math.PI * 2, d = rnd() * c.radius;
    const x = Math.round(c.x + Math.cos(ang) * d), y = Math.round(c.y + Math.sin(ang) * d);
    if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) continue;
    const i = y * W + x;
    if (owner[i - 1] === id1 || owner[i + 1] === id1 || owner[i - W] === id1 || owner[i + W] === id1) claim(c, x, y);
  }
  // colonos
  const explore = members.length ? members.reduce((s, o) => s + tmul(o, 'explore'), 0) / members.length : 1;
  if (c.pop >= 14 && rnd() < .1 * explore) {
    const kc = cities.filter(o => o && o.alive && o.k === k).length;
    if (kc < 10) {
      const s = members.find(o => !o.army && !o.settler && o !== k.king);
      const reg = region[c.y * W + c.x];
      if (s) for (let a = 0; a < 20; a++) {
        const ang = rnd() * Math.PI * 2, d = 13 + rnd() * (14 + explore * 6);
        const x = Math.round(c.x + Math.cos(ang) * d), y = Math.round(c.y + Math.sin(ang) * d);
        if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) continue;
        const i = y * W + x;
        if (!owner[i] && region[i] === reg && TILE[tile[i]].build && canStand(sp, x, y) && !nearCity(x, y, 11)) {
          s.settler = { x, y, t: 0 }; s.city = -1; s.tx = x + .5; s.ty = y + .5; s.job = { type: 'settle', x, y };
          let n = 0;
          for (const o of members) { if (n >= 4) break; if (o === s || o.army || o.settler || o === k.king) continue; o.settler = { x: x + ri(-1, 1), y: y + ri(-1, 1), follow: 1, t: 0 }; o.city = -1; n++; }
          break;
        }
      }
    }
  }
  // ejército
  if (k.wars.size) {
    const share = (.3 + (sp.war ? .15 : 0) + (k.aggr || 0) * .2);
    for (const o of members) if (!o.settler && o !== k.king && !o.army && rnd() < share * .35 * (hasTrait(o, 'cobarde') ? .2 : 1)) o.army = true;
  } else for (const o of members) o.army = false;
  if (c.pop === 0) { if (++c.empty > 10) destroyCity(c, 'queda abandonada'); } else c.empty = 0;
  // rebelión
  if (LAWS.rebelion.on && modOn('diplomacia') && k.capital !== c.id && c.pop > 10 && year() - k.born > 15) {
    const cap = cities[k.capital];
    const far = cap ? Math.sqrt(dist2(cap.x, cap.y, c.x, c.y)) : 50;
    const kc = cities.filter(o => o && o.alive && o.k === k).length;
    if (kc > 4 && year() - k.born > 30 && rnd() < .0007 * (far / 25) * (1 + k.wars.size) / (1 + (k.leaders || 0) * .5)) rebel(c);
  }
}
function rebel(c) {
  const old = c.k;
  const leader = units.find(o => o.city === c.id && !o.dead && o.def.civ);
  const k = newKingdom(old.race, leader);
  const taken = kingdoms.some(o => o.alive && o !== k && o.custom === 'República de ' + c.name);
  k.custom = (taken ? 'Rebeldes de ' : 'República de ') + c.name; k.customFem = !taken; nameKingdom(k);
  c.k = k; k.capital = c.id;
  for (const t of old.tech) applyTech(k, TECHID[t], true);
  for (const o of units) if (o.city === c.id) { o.k = k; o.army = false; }
  k.wars.add(old.id); old.wars.add(k.id);
  addLog(`¡Rebelión! ${c.name} se independiza ${del(old)} y le declara la guerra.`, 'war');
}
function declareWar(a, b, byGod) {
  if (a === b || a.wars.has(b.id)) return;
  a.allies.delete(b.id); b.allies.delete(a.id);
  a.wars.add(b.id); b.wars.add(a.id); a.warYears[b.id] = 0; b.warYears[a.id] = 0;
  const sep = !kingdomsTouch(a, b);
  addLog(`${El(a)} declara la guerra ${al(b)}${byGod ? ' por voluntad divina' : ''}.${sep ? ' Una frontera los separa: sus ejércitos esperan en la línea.' : ''}`, 'war');
  if (modOn('diplomacia')) for (const al_ of a.allies) { const k = kingdoms[al_]; if (k && k.alive && !k.wars.has(b.id) && k !== b) { k.wars.add(b.id); b.wars.add(k.id); } }
}
function makePeace(a, b) {
  if (!a.wars.has(b.id)) return;
  a.wars.delete(b.id); b.wars.delete(a.id);
  addLog(`Paz firmada entre ${el(a)} y ${el(b)}.`, 'peace');
}
function applyTech(k, t, silent) {
  if (k.tech.has(t.id)) return;
  k.tech.add(t.id);
  if (t.weapon && t.weapon > k.weapon.tier) k.weapon = { tier: t.weapon, n: t.wn || WEAPONS[t.weapon][0], c: t.wc || WEAPONS[t.weapon][2] };
  if (t.armor && t.armor > k.armor.tier) k.armor = { tier: t.armor, n: ARMORS[t.armor][0] };
  if (t.house) k.house = Math.max(k.house, t.house);
  if (t.walls) k.walls = Math.max(k.walls, t.walls);
  if (t.ranged) k.ranged = Math.max(k.ranged, t.ranged);
  if (t.gun) k.gun = 1; if (t.silver) k.silver = 1; if (t.siege) k.siege = 1; if (t.rof) k.rof = 1;
  if (t.fx) for (const f in t.fx) k.mul[f] = (k.mul[f] || 1) * t.fx[f];
  const oldEra = k.era; if (t.core) k.era = Math.max(k.era, t.era);
  if (!silent) {
    addLog(`${El(k)} descubre: ${t.n}.`, 'tech');
    if (k.era > oldEra) addLog(`${El(k)} entra en la ${ERAS[k.era]}.`, 'found');
  }
}
function techAvailable(k, t) { return !k.tech.has(t.id) && modOn(t.mod) && (t.req || []).every(r => k.tech.has(r)); }
function missingFor(k, t) { const m = []; for (const r in t.need || {}) if ((k.res[r] || 0) < t.need[r]) m.push([r, t.need[r] - Math.floor(k.res[r] || 0)]); return m; }
function nextTech(k) { return TECH.find(t => techAvailable(k, t)) || null; }
function research(k, members) {
  if (!modOn('tecnologia')) return;
  let pts = 0;
  for (const u of members) pts += tmul(u, 'research') * (u.def.bonus?.research || 1);
  k.rpRate = pts * .3 * k.mul.research;
  k.rp += k.rpRate;
  let guard = 0;
  while (guard++ < 5) {
    let done = false;
    for (const t of TECH) {
      if (!techAvailable(k, t) || k.rp < t.cost) continue;
      const miss = missingFor(k, t);
      if (miss.length) {
        if (!k.blocked[t.id]) { k.blocked[t.id] = 1; addLog(`${El(k)} sabe cómo hacer ${t.n.toLowerCase()}, pero le falta ${miss.map(m => RESNAME[m[0]].toLowerCase()).join(' y ')}.`, 'tech'); }
        continue;
      }
      for (const r in t.need || {}) k.res[r] -= t.need[r];
      k.rp -= t.cost; applyTech(k, t); done = true; break;
    }
    if (!done) break;
  }
  k.reserve = {};
  for (const t of TECH) if (techAvailable(k, t)) for (const r in t.need || {}) k.reserve[r] = Math.max(k.reserve[r] || 0, t.need[r]);
  let maxCost = 40; for (const t of TECH) if (techAvailable(k, t)) maxCost = Math.max(maxCost, t.cost);
  k.rp = Math.min(k.rp, maxCost * 1.5);
}
function kingdomUpdate() {
  if (regionDirty) computeRegions();
  const alive = kingdoms.filter(k => k.alive);
  for (const k of alive) {
    const kc = cities.filter(c => c && c.alive && c.k === k);
    if (!kc.length) {
      k.alive = false;
      for (const o of kingdoms) { o.wars.delete(k.id); o.allies.delete(k.id); }
      for (const u of units) if (u.k === k) { u.k = null; u.army = false; }
      addLog(`${El(k)} ha desaparecido para siempre.`, 'doom');
      continue;
    }
    const members = units.filter(u => u.k === k && u.def.civ && !u.dead && u.age >= 12);
    k.pop = kc.reduce((s, c) => s + c.pop, 0);
    const cnt = Object.create(null); let ag = 0; k.smiths = 0; k.leaders = 0;
    for (const u of members) for (const t of u.traits) { cnt[t] = (cnt[t] || 0) + 1; if (TRAITS[t].aggr) ag += TRAITS[t].aggr; if (t === 'herrero') k.smiths++; if (t === 'lider') k.leaders++; }
    k.culture = cnt; k.aggr = members.length ? ag / members.length : 0;
    research(k, members);
    if (modOn('diplomacia')) {
      const rank = kc.length >= 7 ? 2 : kc.length >= 3 ? 1 : 0;
      if (rank > k.rank && !k.custom) { const old = k.name; k.rank = rank; nameKingdom(k); addLog(`${old} crece y se convierte en ${el(k)}.`, 'found'); }
    }
    if (k.capital < 0 || !cities[k.capital] || !cities[k.capital].alive || cities[k.capital].k !== k) k.capital = kc.sort((a, b) => b.pop - a.pop)[0].id;
    if (!k.king || k.king.dead || k.king.k !== k) {
      const score = u => u.level + (u.hero ? 5 : 0) + (hasTrait(u, 'lider') ? 6 : 0);
      const cand = members.slice().sort((a, b) => score(b) - score(a))[0];
      if (cand) { k.king = cand; cand.name = cand.name || mkName(k.race); if (modOn('diplomacia')) addLog(`${cand.name} es coronado soberano ${del(k)}.`, 'peace'); }
    }
    for (const w of k.wars) k.warYears[w] = (k.warYears[w] || 0) + .5;
  }
  const live = kingdoms.filter(k => k.alive);
  for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
    const a = live[i], b = live[j];
    const ca = cities[a.capital], cb = cities[b.capital]; if (!ca || !cb) continue;
    if (a.wars.has(b.id)) {
      const peaceful = Math.max(0, -(a.aggr + b.aggr));
      if (LAWS.guerras.on && (a.warYears[b.id] || 0) > 3 && rnd() < .05 * (1 + peaceful * 3)) makePeace(a, b);
      continue;
    }
    if (!LAWS.guerras.on || !kingdomsTouch(a, b)) continue;
    const d = Math.sqrt(dist2(ca.x, ca.y, cb.x, cb.y));
    if (d > 80) continue;
    let p = .022 * ((SP[a.race].war || 1) + (SP[b.race].war || 1)) / 2 * clamp(1 + (a.aggr + b.aggr) * 2, .05, 4);
    if (a.race === b.race) p *= .6;
    if (a.allies.has(b.id)) p *= .1;
    if (rnd() < p) declareWar(rnd() < .5 ? a : b, rnd() < .5 ? b : a);
    else if (modOn('diplomacia') && !a.allies.has(b.id) && rnd() < .012 && a.aggr + b.aggr < .3) {
      a.allies.add(b.id); b.allies.add(a.id); addLog(`Alianza entre ${el(a)} y ${el(b)}.`, 'peace');
    }
  }
}
