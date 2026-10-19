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
function hasTrait(u, t) { return u.traits.includes(t) && modOn(TRAITS[t].mod); }
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
    aggro: def.hunter ? rnd() < .3 : false, settler: null, dead: false, life: 0, target: null
  };
  u.maxAge *= tmul(u, 'age');
  u.maxHp = maxHpOf(u); u.hp = u.maxHp;
  units.push(u);
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
    if (k.ranged && (u.archer || hasTrait(u, 'arquero'))) return k.ranged;
  }
  if (hasTrait(u, 'arquero')) return 4;
  return 1.25;
}
function displayName(u) { return u.name || u.def.n.replace(/s$/, ''); }

function isEnemy(a, b) {
  if (a === b || b.dead) return false;
  const da = a.def, db = b.def;
  if (da.hostile) return !db.hostile || (a.type !== b.type && !(da.infect && db.infect));
  if (db.hostile) return da.civ || (a.type === 'ghost' && !!a.k);
  if (da.hunter) return b.type === 'sheep' || (db.civ && a.aggro);
  if (db.hunter) return !!da.civ && !!b.aggro;
  if (a.k && b.k && a.k !== b.k) return a.k.wars.has(b.k.id) && sameRegion(a, b);
  if (a.type === 'ghost' && !a.k) return !!db.civ;
  return false;
}

function rebuildGrid() {
  for (const c of grid) c.length = 0;
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
  u.hp -= d; u.hitT = 6;
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
function kill(u, src, cause) {
  if (u.dead) return;
  u.dead = true; u.hp = 0;
  burst(u.x, u.y, [150, 20, 20], 5, .6);
  if (src && !src.dead) { src.kills++; gainXp(src, 1 + u.level * .5 + (u.hero ? 4 : 0)); }
  const wasKing = u.k && u.k.king === u;
  if (wasKing) { addLog(`Ha muerto ${u.name}, soberano ${del(u.k)}${cause ? ' (' + cause + ')' : ''}.`, 'war'); u.k.king = null; }
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
  const dx = tx - u.x, dy = ty - u.y, d = Math.hypot(dx, dy);
  if (d < .05) return true;
  let sp = u.def.spd * tmul(u, 'spd') * .055 * mul * (u.def.civ ? kmul(u.k, 'speed') : 1);
  const st = Math.min(sp, d);
  if (Math.abs(dx) > .02) u.face = dx < 0 ? -1 : 1;
  const nx = u.x + dx / d * st, ny = u.y + dy / d * st;
  if (canStand(u.def, nx, ny)) { u.x = nx; u.y = ny; }
  else if (canStand(u.def, nx, u.y)) u.x = nx;
  else if (canStand(u.def, u.x, ny)) u.y = ny;
  else {
    if (u.job && d < 1.9) { u.tx = null; arrive(u); return true; }
    u.tx = null; u.job = null; return true;
  }
  return d < .3;
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
  if (hasTrait(u, 'regenera') && u.hp < u.maxHp) u.hp += .04;
  if (u.dead) return;
  if (u.type === 'ghost') u.life++;

  if (modOn('magia') && def.civ && --u.spell <= 0 && u.traits.some(t => TRAITS[t].magic)) castSpell(u);
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

  if (--u.think <= 0) think(u);

  if (u.target) {
    const t = u.target;
    if (t.dead || dist2(u.x, u.y, t.x, t.y) > 200) u.target = null;
    else {
      const rg = rangeOf(u), d2 = dist2(u.x, u.y, t.x, t.y);
      if (d2 <= rg * rg) {
        if (def.abduct && d2 < 2.5 && t.def.civ && rnd() < .02) {
          fx.push({ k: 'beam', x: t.x, y: t.y, life: 30 }); kill(t, u, 'abducido'); u.target = null;
        } else if (def.atk > 0) attack(u, t);
        if (rg > 2 && d2 < (rg * .5) ** 2 && def.civ) moveToward(u, u.x + (u.x - t.x), u.y + (u.y - t.y));
      } else moveToward(u, t.x, t.y, 1.1);
      return;
    }
  }
  if (u.tx !== null) { if (moveToward(u, u.tx, u.ty)) { u.tx = null; arrive(u); } }
}

function workOf(u, key) { return tmul(u, 'work') * (key ? tmul(u, key) : 1) * kmul(u.k, 'work') * (u.def.bonus?.[key] || 1); }
function arrive(u) {
  const j = u.job; if (!j) return;
  u.job = null;
  const i = (j.y | 0) * W + (j.x | 0);
  const c = cities[u.city], k = u.k;
  if (j.type === 'settle') {
    if (!(j.follow || u.settler?.follow) && foundCity(u)) return;
    u.settler = null;
    const near = cities.find(cc => cc && cc.alive && cc.k === u.k && dist2(cc.x, cc.y, u.x, u.y) < 64);
    if (near) u.city = near.id; else if (!u.city || u.city < 0) foundCity(u);
    return;
  }
  if (!c || !k || dist2(u.x, u.y, j.x + .5, j.y + .5) > 4) return;
  if (j.type === 'build' && owner[i] === c.id + 1 && !bld[i] && TILE[tile[i]].build && !fire[i] && !ore[i]) {
    const ht = modOn('tecnologia') ? k.house : 0;
    const cost = ht >= 2 ? ['piedra', 2] : ['madera', 1];
    if (ht === 0 || k.res[cost[0]] - cost[1] >= (k.reserve?.[cost[0]] || 0)) {
      if (ht > 0) k.res[cost[0]] -= cost[1];
      bld[i] = 1;
      if (tmul(u, 'build') > 1) { // los constructores levantan una casa extra al lado
        const n = i + pick([1, -1, W, -W]);
        if (n >= 0 && n < N && owner[n] === c.id + 1 && !bld[n] && TILE[tile[n]].build && !ore[n]) bld[n] = 1;
      }
    }
  } else if (j.type === 'farm' && owner[i] === c.id + 1 && TILE[tile[i]].farm && !bld[i]) {
    tile[i] = T.FIELD;
    c.food += 1 * workOf(u, 'farm');
  } else if (j.type === 'wood' && TILE[tile[i]].wood) {
    k.res.madera += 1.5 * workOf(u);
    if (rnd() < .12) tile[i] = T.GRASS;
  } else if (j.type === 'stone' && TILE[tile[i]].stone) {
    k.res.piedra += 1.5 * workOf(u, 'mine');
  } else if (j.type === 'mine' && ore[i]) {
    const m = MAT[ore[i]];
    const amt = workOf(u, 'mine');
    k.res[m.id] = (k.res[m.id] || 0) + amt;
    if (!k.found[m.id]) { k.found[m.id] = 1; if (modOn('tecnologia')) addLog(`${El(k)} descubre ${m.n.toLowerCase()} y empieza a extraerlo.`, 'tech'); }
    oreAmt[i] = Math.max(0, oreAmt[i] - Math.max(1, Math.round(amt)));
    if (!oreAmt[i]) ore[i] = 0;
  }
}

function pickTile(cx, cy, r, fn, tries = 14) {
  for (let a = 0; a < tries; a++) {
    const x = (cx + (rnd() * 2 - 1) * r) | 0, y = (cy + (rnd() * 2 - 1) * r) | 0;
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const i = y * W + x; if (fn(i)) return [x, y];
  }
  return null;
}
function think(u) {
  const def = u.def;
  u.think = ri(15, 35);
  if (def.civ && u.age > 14 && rnd() < .01) gainXp(u, .5);
  let sight = def.hostile ? 9 : def.civ ? (u.army ? 9 : 3.5) : def.hunter ? 7 : 4;
  if (u.type === 'ghost') sight = 8;
  if (def.atk > 0 && !hasTrait(u, 'cobarde')) {
    const e = nearest(u.x, u.y, sight, o => isEnemy(u, o));
    if (e) { u.target = e; return; }
  } else if (hasTrait(u, 'cobarde')) {
    const e = nearest(u.x, u.y, 4, o => isEnemy(o, u));
    if (e) { u.tx = clamp(u.x + (u.x - e.x) * 2, 0, W - 1); u.ty = clamp(u.y + (u.y - e.y) * 2, 0, H - 1); return; }
  }
  if (def.passive) {
    const p = nearest(u.x, u.y, 3, o => o.def.hunter || o.def.hostile);
    if (p) { u.tx = clamp(u.x + (u.x - p.x) * 2, 0, W - 1); u.ty = clamp(u.y + (u.y - p.y) * 2, 0, H - 1); return; }
    if (u.type === 'sheep' && rnd() < .025 && (countType.sheep || 0) < 300) spawn('sheep', u.x, u.y);
  }
  if (u.type === 'wolf' && rnd() < .006 && (countType.wolf || 0) < 80) spawn('wolf', u.x, u.y);
  if (u.type === 'ghost' && u.life > YEAR * 3) { kill(u, null, 'se desvanece'); return; }
  if (u.type === 'ghost' && u.k) { const tgt = enemyCityFor(u.k, u); if (tgt) { u.tx = tgt.x + .5; u.ty = tgt.y + .5; return; } }
  if (!def.civ) { wander(u, u.x, u.y, def.hostile ? 10 : 6); return; }

  const c = cities[u.city];
  if (u.settler) { u.tx = u.settler.x + .5; u.ty = u.settler.y + .5; u.job = { type: 'settle', x: u.settler.x, y: u.settler.y, follow: u.settler.follow }; if (++u.settler.t > 40) u.settler = null; return; }
  if (!c || !c.alive) {
    u.city = -1;
    if (u.k && !u.k.alive) u.k = null;
    const i = (u.y | 0) * W + (u.x | 0);
    if (u.age > 12 && !owner[i] && TILE[tile[i]].build && !nearCity(u.x, u.y, 10) && rnd() < .3) { foundCity(u); return; }
    const jc = cities.find(cc => cc && cc.alive && (cc.k === u.k || (!u.k && cc.k.race === u.type)) && dist2(cc.x, cc.y, u.x, u.y) < 600 && region[cc.y * W + cc.x] === regAt(u.x, u.y));
    if (jc) { u.city = jc.id; u.k = jc.k; return; }
    wander(u, u.x, u.y, 8); return;
  }
  const k = u.k;
  if (u.job && u.tx !== null && !u.army && tickN - (u.jobT || 0) < 500) return; // sigue con su tarea
  // ejército
  if (u.army && k && k.wars.size) {
    const tgt = enemyCityFor(k, u);
    if (tgt) {
      u.tx = tgt.x + .5 + (rnd() - .5) * 2; u.ty = tgt.y + .5 + (rnd() - .5) * 2;
      if (tgt.reach && dist2(u.x, u.y, tgt.x, tgt.y) < 4) tryCapture(u, tgt);
      return;
    }
  }
  // trabajos
  const r = c.radius, id1 = c.id + 1;
  const opts = [];
  if (c.pop + 2 > c.cap) opts.push(['build', 3 * tmul(u, 'build')]);
  if (!def.noFood && LAWS.hambre.on && c.fields < c.pop * .5) opts.push(['farm', 2 * tmul(u, 'farm')]);
  if (c.ores.length) opts.push(['mine', 2.2 * tmul(u, 'mine') * (def.bonus?.mine || 1)]);
  if (k.res.madera < 40 + c.pop * 2) opts.push(['wood', 1.6]);
  if (k.res.piedra < 60 + c.pop * 3) opts.push(['stone', 1.1 * tmul(u, 'mine')]);
  opts.push(['idle', 1.2 / Math.max(.3, tmul(u, 'work'))]);
  let tot = opts.reduce((s, o) => s + o[1], 0), roll = rnd() * tot, job = 'idle';
  for (const o of opts) { roll -= o[1]; if (roll <= 0) { job = o[0]; break; } }
  let p = null;
  if (job === 'build') p = pickTile(c.x, c.y, r * .8, i => owner[i] === id1 && !bld[i] && TILE[tile[i]].build && tile[i] !== T.FIELD && !ore[i] && !wall[i]);
  else if (job === 'farm') p = pickTile(c.x, c.y, r, i => owner[i] === id1 && TILE[tile[i]].farm && !bld[i] && !ore[i]);
  else if (job === 'mine') { const i = pick(c.ores); if (ore[i]) p = [i % W, (i / W) | 0]; }
  else if (job === 'wood') p = pickTile(c.x, c.y, r + 3, i => TILE[tile[i]].wood && (!owner[i] || owner[i] === id1));
  else if (job === 'stone') p = pickTile(c.x, c.y, r + 4, i => TILE[tile[i]].stone && !ore[i] && (!owner[i] || owner[i] === id1));
  if (p) { u.job = { type: job, x: p[0], y: p[1] }; u.jobT = tickN; u.tx = p[0] + .5; u.ty = p[1] + .5; return; }
  wander(u, c.x + .5, c.y + .5, Math.max(2, r * .7));
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
