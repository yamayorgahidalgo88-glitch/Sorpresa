"use strict";
// ---------- unidades ----------
function canStand(def, x, y) {
  if (x < 0 || y < 0 || x >= W || y >= H) return false;
  const i = (y | 0) * W + (x | 0), t = tile[i];
  if (def.fly) return true;
  if (wall[i]) return false;
  if (def.waterOnly) return isWater(t);
  if (def.sandOnly) return t === T.SAND || t === T.DESERT || t === T.MESA;
  if (isWater(t)) return !!def.swim;
  if (t === T.MOUNT) return !!def.mount;
  if (t === T.LAVA) return !!def.fireproof;
  if (t === T.ACID) return false;
  return true;
}
function tmul(u, key) { let m = 1; for (const t of u.traits) { const tr = TRAITS[t]; if (tr && tr[key] !== undefined && modOn(tr.mod)) m *= tr[key]; } return m; }
function tflag(u, key) { for (const t of u.traits) { const tr = TRAITS[t]; if (tr && tr[key] && modOn(tr.mod)) return true; } return false; }
function hasTrait(u, t) { return u.traits.includes(t) && !!TRAITS[t] && modOn(TRAITS[t].mod); }
function addTrait(u, t) {
  if (u.traits.includes(t)) return false;
  const o = OPPOSITE[t]; if (o) u.traits = u.traits.filter(x => x !== o);
  if (t === 'genio') u.traits = u.traits.filter(x => x !== 'tonto');
  u.traits.push(t);
  const om = u.maxHp; u.maxHp = maxHpOf(u); u.hp = Math.max(1, u.hp + u.maxHp - om);
  return true;
}

function spawn(type, x, y, k, city, opt = {}) {
  const def = SP[type];
  if (!def || !modOn(def.mod)) return null;
  if (!canStand(def, x, y)) {
    let ok = false;
    for (let r = 1; r < 4 && !ok; r++) for (let a = 0; a < 8 && !ok; a++) {
      const nx = (x | 0) + ri(-r, r), ny = (y | 0) + ri(-r, r);
      if (canStand(def, nx, ny)) { x = nx + .5; y = ny + .5; ok = true; }
    }
    if (!ok) return null;
  }
  const u = {
    id: uid++, type, def, x, y, k: k || null, city: city ?? -1, age: opt.age ?? (def.civ ? ri(16, 24) : ri(1, 3)),
    maxAge: ri(def.age[0], def.age[1]), level: 1, xp: 0, kills: 0, traits: opt.traits ? [...opt.traits] : [], name: null, hero: false, item: null,
    tx: null, ty: null, think: ri(0, 30), cool: 0, spell: ri(60, 160), hitT: 0, plague: 0, job: null, army: false, archer: rnd() < .4,
    aggro: def.hunter ? rnd() < .3 : false, settler: null, dead: false, life: 0, target: null,
    food: 70 + rnd() * 30, energy: 60 + rnd() * 40, mood: 55 + rnd() * 20, task: null, prof: null, sex: rnd() < .5 ? 'm' : 'f', fam: null,
    friends: {}, partner: null, parents: null, home: -1, carry: null, face: rnd() < .5 ? -1 : 1, dec: null, path: null, pgoal: -1, pretry: 0
  };
  if (def.civ && u.age < 12) u.prof = 'child';
  if (def.civ) u.name = mkName(type);
  u.maxAge *= tmul(u, 'age');
  u.maxHp = maxHpOf(u); u.hp = u.maxHp;
  units.push(u); UMAP.set(u.id, u);
  return u;
}
function kmul(k, key) { return k && modOn('tecnologia') ? (k.mul[key] || 1) : 1; }
function atkOf(u) {
  let a = u.def.atk;
  const k = u.k;
  if (k && u.def.civ && modOn('tecnologia')) a += WEAPONS[k.weapon.tier][1];
  a *= tmul(u, 'atk') * (1 + (u.level - 1) * .12);
  if (k && u.def.civ) a *= 1 + Math.min(.3, (k.smiths || 0) * .03) + Math.min(.25, (k.leaders || 0) * .05) + (k.siege && u.army ? .15 : 0);
  if (u.item && modOn('heroes')) a += u.item[1];
  if (u.traits.length) a *= traitAtk(u);
  return a;
}
function maxHpOf(u) {
  let h = u.def.hp * tmul(u, 'hp') * (1 + (u.level - 1) * .1);
  if (u.item && modOn('heroes')) h += u.item[2];
  return Math.max(5, h);
}
function armorOf(u) { return u.k && u.def.civ && modOn('tecnologia') ? ARMORS[u.k.armor.tier][1] : 0; }
function rangeOf(u) {
  if (!u.def.civ) return u.def.range || 1.25;
  const k = u.k;
  if (k && modOn('tecnologia')) {
    if (k.gun) return k.ranged;
    if (k.ranged && (u.archer || hasTrait(u, 'arquero') || (u.traits.length && tflag(u, 'archer')))) return k.ranged;
  }
  if (hasTrait(u, 'arquero') || (u.traits.length && tflag(u, 'archer'))) return 4;
  return 1.25;
}
function displayName(u) { return u.name ? u.name + (u.fam && u.def.civ ? ' ' + u.fam : '') : u.def.n.replace(/s$/, ''); }

function isEnemy(a, b) {
  if (a === b || b.dead) return false;
  const da = a.def, db = b.def;
  if (da.hostile) return !db.hostile || (a.type !== b.type && !(da.infect && db.infect));
  if (db.hostile) return da.civ || (a.type === 'ghost' && !!a.k);
  if (da.hunter) return (da.prey ? da.prey.includes(b.type) : b.type === 'sheep') || (db.civ && a.aggro);
  if (db.hunter) return !!da.civ && !!b.aggro;
  if (a.k && b.k && a.k !== b.k) return a.k.wars.has(b.k.id) && sameRegion(a, b);
  if (a.type === 'ghost' && !a.k) return !!db.civ;
  return false;
}

function rebuildGrid() {
  for (const c of grid) c.length = 0;
  if (UMAP.size > units.length * 1.5 + 50) { UMAP.clear(); for (const u of units) UMAP.set(u.id, u); }
  for (const u of units) {
    if (u.dead) continue;
    const gx = clamp((u.x / GC) | 0, 0, GW - 1), gy = clamp((u.y / GC) | 0, 0, GH - 1);
    grid[gy * GW + gx].push(u);
  }
}
function nearest(x, y, r, fn) {
  let best = null, bd = r * r;
  const x0 = clamp(((x - r) / GC) | 0, 0, GW - 1), x1 = clamp(((x + r) / GC) | 0, 0, GW - 1);
  const y0 = clamp(((y - r) / GC) | 0, 0, GH - 1), y1 = clamp(((y + r) / GC) | 0, 0, GH - 1);
  for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) for (const o of grid[gy * GW + gx]) {
    if (o.dead) continue;
    const d = dist2(x, y, o.x, o.y);
    if (d < bd && fn(o)) { bd = d; best = o; }
  }
  return best;
}
function around(x, y, r, fn) {
  const x0 = clamp(((x - r) / GC) | 0, 0, GW - 1), x1 = clamp(((x + r) / GC) | 0, 0, GW - 1);
  const y0 = clamp(((y - r) / GC) | 0, 0, GH - 1), y1 = clamp(((y + r) / GC) | 0, 0, GH - 1);
  const r2 = r * r;
  for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) for (const o of grid[gy * GW + gx]) {
    if (!o.dead && dist2(x, y, o.x, o.y) <= r2) fn(o);
  }
}

function damage(u, d, src) {
  if (u.dead) return;
  if (hasTrait(u, 'afortunado') && rnd() < .3) return;
  if (hasTrait(u, 'inmortal')) d *= .08;
  d *= 1 - armorOf(u);
  if (u.k && u.k.walls && owner[(u.y | 0) * W + (u.x | 0)] && cities[owner[(u.y | 0) * W + (u.x | 0)] - 1]?.k === u.k) d *= 1 - u.k.walls * .12;
  if (src && src.k && src.k.silver && u.def.unholy) d *= 2;
  if (u.traits.length) d *= tmul(u, 'dmgTaken');
  u.hp -= d; u.hitT = 6;
  if (src) onHit(src, u, d);
  if (u.hp <= 0) kill(u, src);
}
function gainXp(u, n) {
  if (!modOn('heroes')) return;
  u.xp += n * tmul(u, 'xp');
  while (u.xp >= u.level * 2) {
    u.xp -= u.level * 2; u.level++;
    const oldMax = u.maxHp; u.maxHp = maxHpOf(u); u.hp += u.maxHp - oldMax;
    if (u.level === 5 && u.def.civ && !u.hero) makeHero(u);
    else if (u.hero && [8, 12, 17, 25].includes(u.level)) addLog(`${u.name} alcanza el rango de ${rankOf(u.level)}.`, 'hero');
  }
}
function makeHero(u) {
  u.hero = true;
  if (!u.name) u.name = mkName(u.type);
  u.item = pick(ITEMS);
  u.maxHp = maxHpOf(u); u.hp = u.maxHp;
  addLog(`${u.name}${u.k ? ' ' + del(u.k) : ''} se convierte en héroe y empuña ${u.item[0]}.`, 'hero');
}
const DEATHS = {};
function kill(u, src, cause) {
  if (u.dead) return;
  u.dead = true; u.hp = 0;
  if (u.def.civ) { const why = cause || (src ? 'combate' : 'daño'); DEATHS[why] = (DEATHS[why] || 0) + 1; }
  burst(u.x, u.y, [150, 20, 20], 5, .6);
  if (src && !src.dead) { src.kills++; gainXp(src, 1 + u.level * .5 + (u.hero ? 4 : 0)); }
  if (src && src.hunting && !u.def.civ) { const c = cities[src.city]; if (c && c.alive) c.food += 3 + (u.def.hp > 15 ? 3 : 0); src.hunting = false; src.target = null; src.task = null; }
  if (u.def.civ) {
    const pa = unitById(u.partner); if (pa) { pa.partner = null; pa.mood = Math.max(0, pa.mood - 35); pa.widow = u.name || displayName(u); }
    for (const o of units) if (o.parents && o.parents.includes(u.id) && !o.dead) o.mood = Math.max(0, o.mood - 22);
  }
  if (u.cargo && u.cargo.length && u.k) addLog(`Un barco ${del(u.k)} se hunde con ${u.cargo.length} personas a bordo.`, 'doom');
  const wasKing = u.k && u.k.king === u;
  if (wasKing) { u.k.lastKing = u.id; addLog(`Ha muerto ${u.name}, soberano ${del(u.k)}${cause ? ' (' + cause + ')' : ''}.`, 'war'); u.k.king = null; }
  else if (u.hero) addLog(`El héroe ${u.name} ha caído${src ? ' a manos de ' + (src.name || src.def.n.toLowerCase()) : cause ? ' (' + cause + ')' : ''}.`, 'hero');
  if (src && src.def.infect && u.def.civ && u.type !== 'undead' && rnd() < .6) { spawn('zombie', u.x, u.y); return; }
  if (src && src.type === 'undead' && src.k && u.def.civ && u.type !== 'undead' && rnd() < SP.undead.raise) {
    const z = spawn('undead', u.x, u.y, src.k, src.city); if (z) burst(u.x, u.y, [120, 230, 140], 6, .5); return;
  }
  if (modOn('masalla') && u.def.civ && (u.hero || wasKing || rnd() < .02)) {
    const g = spawn('ghost', u.x, u.y, (u.hero || wasKing) && u.k && u.k.alive ? u.k : null, -1);
    if (g) { g.name = u.name ? 'Espíritu de ' + u.name : null; g.level = Math.max(1, u.level >> 1); g.maxHp = maxHpOf(g); g.hp = g.maxHp; }
  }
}

function moveToward(u, tx, ty, mul = 1) {
  const r = stepToward(u, tx, ty, mul);
  if (r === -1) { u.tx = null; return true; }
  return r === 1;
}
function wander(u, cx, cy, r) {
  for (let i = 0; i < 6; i++) {
    const x = cx + (rnd() * 2 - 1) * r, y = cy + (rnd() * 2 - 1) * r;
    if (canStand(u.def, x, y)) { u.tx = x; u.ty = y; return; }
  }
}

function attack(u, t) {
  if (u.cool > 0) return;
  u.cool = u.def.civ ? (u.k && u.k.rof ? 14 : 28) : 34;
  const rg = rangeOf(u);
  const dmg = atkOf(u) * (.7 + rnd() * .6);
  if (rg > 2) {
    const kind = u.type === 'ufo' ? 'laser' : (u.def.civ && u.k && u.k.gun) ? 'bullet' : 'arrow';
    projs.push({ x: u.x, y: u.y, t, src: u, dmg, kind, spd: kind === 'arrow' ? .35 : .7 });
  } else {
    damage(t, dmg, u);
    if (u.type === 'demon' && rnd() < .08) ignite((t.x | 0), (t.y | 0));
  }
}
function castSpell(u) {
  u.spell = ri(110, 200);
  if (hasTrait(u, 'piromante')) {
    const e = nearest(u.x, u.y, 7, o => isEnemy(u, o));
    if (e) { projs.push({ x: u.x, y: u.y, t: e, src: u, dmg: atkOf(u) * 1.5 + 6, kind: 'fireball', spd: .3 }); return; }
  }
  if (hasTrait(u, 'sanador')) {
    let healed = 0;
    around(u.x, u.y, 4, o => { if (!isEnemy(u, o) && o.def.civ && o.hp < o.maxHp) { o.hp = Math.min(o.maxHp, o.hp + 15); healed++; } });
    if (healed) burst(u.x, u.y, [120, 255, 160], 10, .7);
  }
  if (hasTrait(u, 'nigromante') && u.k && rnd() < .5) {
    const e = nearest(u.x, u.y, 8, o => isEnemy(u, o));
    if (e) { const z = spawn(modOn('razas') ? 'undead' : 'zombie', u.x + ri(-1, 1), u.y + ri(-1, 1), modOn('razas') ? u.k : null, u.city); if (z) { z.maxAge = 4 + z.age; burst(z.x, z.y, [140, 255, 160], 8, .5); } }
  }
}

function updateUnit(u) {
  const def = u.def;
  u.age += 1 / YEAR;
  if (u.cool > 0) u.cool--; if (u.hitT > 0) u.hitT--;
  if (u.age > u.maxAge * kmul(u.k, 'age') && !hasTrait(u, 'inmortal')) { kill(u, null, 'vejez'); return; }
  if (def.boat) { updateBoat(u); return; }
  const ti = (u.y | 0) * W + (u.x | 0), tt = tile[ti];
  if (!def.fly) {
    if (tt === T.LAVA && !def.fireproof) { kill(u, null, 'lava'); return; }
    if (tt === T.ACID) { kill(u, null, 'ácido'); return; }
    if (isWater(tt) && !def.swim && !def.waterOnly) { if (rnd() < .02) { kill(u, null, 'ahogado'); return; } wander(u, u.x, u.y, 3); }
  }
  if (fire[ti] && !def.fireproof) damage(u, .5, null);
  if (rad[ti]) damage(u, .15, null);
  if (tt === T.CORRUPT && def.civ && !def.unholy) damage(u, .03, null);
  if (u.plague) { u.plague--; damage(u, .06, null); if (rnd() < .02) around(u.x, u.y, 1.6, o => { if (o.def.civ && !o.plague && rnd() < .5) o.plague = 600; }); }
  if (u.traits.length && u.hp < u.maxHp && (hasTrait(u, 'regenera') || tflag(u, 'regen'))) u.hp += .04;
  if (u.dead) return;
  if (u.type === 'ghost') u.life++;

  if (modOn('magia') && def.civ && --u.spell <= 0 && u.traits.some(t => TRAITS[t]?.magic)) castSpell(u);
  if (def.healer && --u.spell <= 0) {
    u.spell = 80;
    around(u.x, u.y, 4, o => { if (o.def.civ && o.hp < o.maxHp) o.hp = Math.min(o.maxHp, o.hp + 10); if (o.plague) o.plague = 0; });
    const i = (u.y | 0) * W + (u.x | 0); if (tile[i] === T.ASH || tile[i] === T.CORRUPT) tile[i] = T.GRASS;
    burst(u.x, u.y, [255, 190, 240], 4, .4);
  }
  if (def.breath && --u.spell <= 0) {
    const e = nearest(u.x, u.y, 6, o => isEnemy(u, o));
    if (e) {
      u.spell = 70;
      for (let s = 1; s <= 6; s++) {
        const px = u.x + (e.x - u.x) * s / 6, py = u.y + (e.y - u.y) * s / 6;
        ignite(px | 0, py | 0);
        around(px, py, 1.3, o => { if (o !== u && !o.def.fireproof) damage(o, 8, u); });
        for (let k = 0; k < 3; k++) parts.push({ x: px, y: py, vx: (rnd() - .5) * .1, vy: (rnd() - .5) * .1, l: 20, c: rnd() < .5 ? [255, 160, 30] : [255, 60, 20], s: 1.2 });
      }
    } else u.spell = 20;
  }

  if (def.civ) {
    u.food -= def.noFood ? 0 : .12 * (u.asleep ? .5 : 1) * (u.age < 12 ? .8 : 1) * (u.traits.length ? tmul(u, 'hunger') : 1);
    u.energy -= u.asleep ? 0 : .09 * (u.traits.length ? tmul(u, 'tired') : 1);
    if (u.food <= 0) { u.food = 0; u.hp -= .025; if (u.hp <= 0) { kill(u, null, 'hambre'); return; } u.mood = Math.max(0, u.mood - .05); }
    if (u.energy < 0) u.energy = 0;
    u.mood += (58 - u.mood) * .0008;
    if (u.prof === 'child' && u.age >= 12) { u.prof = null; u.task = null; }
  }
  if (u.poison || u.sick || u.traits.length) { traitTick(u); if (u.dead) return; }
  if (--u.think <= 0) think(u);

  if (u.target) {
    const t = u.target;
    if (t.dead || dist2(u.x, u.y, t.x, t.y) > 200) { u.target = null; if (u.hunting) { u.hunting = false; endTask(u); } }
    else {
      const rg = rangeOf(u), d2 = dist2(u.x, u.y, t.x, t.y);
      if (d2 <= rg * rg) {
        if (def.abduct && d2 < 2.5 && t.def.civ && rnd() < .02) {
          fx.push({ k: 'beam', x: t.x, y: t.y, life: 30 }); kill(t, u, 'abducido'); u.target = null;
        } else if (def.atk > 0) attack(u, t);
        if (rg > 2 && d2 < (rg * .5) ** 2 && def.civ) moveToward(u, u.x + (u.x - t.x), u.y + (u.y - t.y));
      } else if (stepToward(u, t.x, t.y, 1.1) === -1 && moveTo(u, t.x, t.y, 1.1) === -1) { u.target = null; if (u.hunting) { u.hunting = false; endTask(u); } }
      return;
    }
  }
  if (u.task) { if (u.task.ph !== 'hunt') runTask(u); else endTask(u); }
  else if (u.tx !== null) { if (moveToward(u, u.tx, u.ty)) u.tx = null; }
}

function workOf(u, key) { return tmul(u, 'work') * (key ? tmul(u, key) : 1) * kmul(u.k, 'work') * (u.def.bonus?.[key] || 1); }
function pickTile(cx, cy, r, fn, tries = 14) {
  for (let a = 0; a < tries; a++) {
    const x = (cx + (rnd() * 2 - 1) * r) | 0, y = (cy + (rnd() * 2 - 1) * r) | 0;
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const i = y * W + x; if (fn(i)) return [x, y];
  }
  return null;
}
function nearCity(x, y, r) { return cities.some(c => c && c.alive && dist2(c.x, c.y, x, y) < r * r); }
function enemyCityFor(k, u) {
  let best = null, bd = 1e9, bestR = null, bdR = 1e9;
  const ru = regAt(u.x, u.y);
  for (const c of cities) if (c && c.alive && c.k && k.wars.has(c.k.id)) {
    const d = dist2(c.x, c.y, u.x, u.y);
    if (u.def.fly || region[c.y * W + c.x] === ru) { if (d < bdR) { bdR = d; bestR = c; } }
    else if (d < bd) { bd = d; best = c; }
  }
  if (bestR) { bestR.reach = true; return bestR; }
  if (best) best.reach = false;
  return best; // separados por frontera: se agolpan en la línea
}
