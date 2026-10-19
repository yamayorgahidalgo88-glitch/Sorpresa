"use strict";
// ---------- barcos ----------
// Las ciudades con muelle botan barcos para colonizar otras islas, desembarcar
// ejércitos en tierras enemigas o comerciar. Los pasajeros salen del mundo
// mientras navegan y vuelven a él al desembarcar.
SP.boat = { n: 'Barco', skin: [150, 104, 62], hp: 70, atk: 0, spd: .75, age: [400, 500], waterOnly: 1, boat: 1, spr: 'boat' };
USPR.boat = { f: [['....w.....', '....wbb...', '....wbbb..', '....wbbbb.', '.ssssssss.', 'sSSSSSSSSs', '.SSSSSSSS.'], ['....w.....', '....wbb...', '....wbbbb.', '....wbbb..', '.ssssssss.', 'sSSSSSSSSs', '.SSSSSSSS.']] };

function dockWater(c) {
  if (!c.docks || c.docks < 0 || bld[c.docks] !== B.DOCKS) return null;
  const x = c.docks % W, y = (c.docks / W) | 0;
  for (let k = 0; k < 8; k++) { const nx = x + DX8[k], ny = y + DY8[k]; if (nx >= 0 && ny >= 0 && nx < W && ny < H && isWater(tile[ny * W + nx])) return [nx, ny]; }
  return null;
}
// agua junto a una casilla de tierra (para desembarcar)
function landingFor(x, y, r = 6) {
  let best = null, bd = 1e9;
  for (let yy = Math.max(0, y - r); yy <= Math.min(H - 1, y + r); yy++) for (let xx = Math.max(0, x - r); xx <= Math.min(W - 1, x + r); xx++) {
    const i = yy * W + xx; if (!isWater(tile[i])) continue;
    let land = false; for (let k = 0; k < 4; k++) { const nx = xx + DX8[k], ny = yy + DY8[k]; if (nx >= 0 && ny >= 0 && nx < W && ny < H && !isWater(tile[ny * W + nx]) && !TILE[tile[ny * W + nx]].liquid) land = true; }
    if (!land) continue;
    const d = dist2(xx, yy, x, y); if (d < bd) { bd = d; best = [xx, yy]; }
  }
  return best;
}
function launchBoat(c, cargo, mission) {
  const dw = dockWater(c); if (!dw) return null;
  const b = spawn('boat', dw[0] + .5, dw[1] + .5, c.k, c.id);
  if (!b) return null;
  b.cargo = cargo; b.mission = { born: tickN, home: dw, ...mission };
  for (const p of cargo) { p.aboard = b.id; p.task = null; p.path = null; p.target = null; }
  const ids = new Set(cargo.map(p => p.id));
  units = units.filter(o => !ids.has(o.id));
  return b;
}
function unloadBoat(b) {
  const m = b.mission;
  const lx = m.lx ?? (b.x | 0), ly = m.ly ?? (b.y | 0);
  let spot = null;
  for (let r = 1; r <= 4 && !spot; r++) for (let k = 0; k < 16 && !spot; k++) { const x = (b.x | 0) + ri(-r, r), y = (b.y | 0) + ri(-r, r); if (x >= 0 && y >= 0 && x < W && y < H && !isWater(tile[y * W + x]) && canStand(SP.human, x + .5, y + .5)) spot = [x, y]; }
  if (!spot) return false;
  for (const p of b.cargo || []) {
    p.aboard = null; p.dead = false;
    p.x = spot[0] + .5 + (rnd() - .5) * .8; p.y = spot[1] + .5 + (rnd() - .5) * .8;
    if (!canStand(p.def, p.x, p.y)) { p.x = spot[0] + .5; p.y = spot[1] + .5; }
    p.think = ri(0, 6); p.food = Math.max(p.food, 70);
    units.push(p); UMAP.set(p.id, p);
  }
  const n = (b.cargo || []).length;
  if (m.kind === 'settle' && n && b.k) addLog(`Un barco ${del(b.k)} desembarca ${n} colonos en una nueva tierra.`, 'found');
  if (m.kind === 'invade' && n && b.k) addLog(`¡Desembarco! ${n} soldados ${del(b.k)} llegan por mar cerca de ${m.tname}.`, 'war');
  if (m.kind === 'trade') {
    const o = cities[m.to];
    if (o && o.alive && b.k) {
      for (const k2 of [b.k, o.k]) { k2.res.oro = (k2.res.oro || 0) + 4; const c2 = k2 === b.k ? cities[b.city] : o; if (c2) c2.food += 6; }
      if (o.k !== b.k) bumpOpinion(b.k, o.k, 6, 'comercio');
    }
  }
  b.cargo = [];
  b.mission = { kind: 'return', born: tickN, lx: null, ly: null, wx: m.home[0], wy: m.home[1], home: m.home };
  return true;
}
function updateBoat(u) {
  const m = u.mission;
  if (!m) { u.dead = true; return; }
  if (tickN % 7 === 0) parts.push({ x: u.x - u.face * .5, y: u.y + .1, vx: -u.face * .01, vy: 0, l: 26, c: [220, 236, 246], s: .8 });
  const r = moveTo(u, m.wx + .5, m.wy + .5, 1);
  const age = tickN - m.born;
  if (m.kind === 'return') { if (r !== 0 || age > 2400) u.dead = true; return; }
  if (r === 1 || (r === -1 && dist2(u.x, u.y, m.wx, m.wy) < 25) || age > 3000) { if (!unloadBoat(u) && age > 3000) u.dead = true; }
  else if (r === -1) { m.wx = u.x | 0; m.wy = u.y | 0; if (!unloadBoat(u)) u.dead = true; }
}

// colonias de ultramar: busca tierra libre en otra isla
function tryOverseas(c, members, explore) {
  if (!c.has[B.DOCKS] || units.some(o => o.def.boat && o.city === c.id)) return false;
  const reg = region[c.y * W + c.x];
  for (let a = 0; a < 40; a++) {
    const ang = rnd() * Math.PI * 2, d = 18 + rnd() * (40 + explore * 15);
    const x = Math.round(c.x + Math.cos(ang) * d), y = Math.round(c.y + Math.sin(ang) * d);
    if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) continue;
    const i = y * W + x;
    if (owner[i] || region[i] === reg || !region[i] || !TILE[tile[i]].build || !canStand(SP[c.k.race], x, y) || nearCity(x, y, 11)) continue;
    const land = landingFor(x, y); if (!land) continue;
    const crew = members.filter(o => !o.army && !o.settler && o !== c.k.king && o.age >= 16).slice(0, 5);
    if (crew.length < 2) return false;
    crew.forEach((o, n) => { o.settler = { x: x + (n ? ri(-1, 1) : 0), y: y + (n ? ri(-1, 1) : 0), t: 0, follow: n ? 1 : 0 }; o.city = -1; o.prof = null; o.food = 100; });
    return !!launchBoat(c, crew, { kind: 'settle', wx: land[0], wy: land[1], lx: x, ly: y });
  }
  return false;
}
// guerra al otro lado del mar
function tryNaval(c, members) {
  if (!c.has[B.DOCKS] || units.some(o => o.def.boat && o.city === c.id)) return false;
  const k = c.k, reg = region[c.y * W + c.x];
  let tgt = null, bd = 1e9;
  for (const e of cities) if (e && e.alive && k.wars.has(e.k.id) && region[e.y * W + e.x] !== reg) { const d = dist2(e.x, e.y, c.x, c.y); if (d < bd && d < 110 * 110) { bd = d; tgt = e; } }
  if (!tgt) return false;
  const crew = members.filter(o => o.prof === 'soldier' && !o.settler).slice(0, 8);
  if (crew.length < 3) return false;
  const land = landingFor(tgt.x, tgt.y, 10); if (!land) return false;
  return !!launchBoat(c, crew, { kind: 'invade', wx: land[0], wy: land[1], tname: tgt.name });
}
// comercio con una ciudad aliada o en paz que también tenga muelle
function tryTrade(c) {
  if (!c.has[B.DOCKS] || !c.has[B.MARKET] || units.some(o => o.def.boat && o.city === c.id)) return false;
  const opts = cities.filter(o => o && o.alive && o !== c && o.has && o.has[B.DOCKS] && !c.k.wars.has(o.k.id) && dist2(o.x, o.y, c.x, c.y) < 90 * 90);
  const o = pick(opts); if (!o) return false;
  const dw = dockWater(o); if (!dw) return false;
  return !!launchBoat(c, [], { kind: 'trade', wx: dw[0], wy: dw[1], to: o.id });
}
