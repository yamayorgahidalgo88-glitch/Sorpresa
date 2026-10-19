"use strict";
// ---------- efectos ----------
function updateFx() {
  for (const f of fx) {
    f.life--;
    if (f.k === 'meteor' && f.life <= 0) explode(f.x, f.y, f.r, { crater: 1, dmg: 200, fire: .5 });
    if (f.k === 'quake') {
      shake = Math.max(shake, 5);
      for (let k = 0; k < 6; k++) {
        const x = Math.round(f.x + (rnd() - .5) * f.r * 2), y = Math.round(f.y + (rnd() - .5) * f.r * 2);
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        const i = y * W + x; if (bld[i]) bld[i] = 4; if (wall[i] && rnd() < .3) wall[i] = 0;
        if (rnd() < .3 && !isWater(tile[i])) tile[i] = pick([T.HILL, T.ROCK, T.WATER, T.SAND]);
      }
      regionDirty = true;
      if (tickN % 10 === 0) around(f.x, f.y, f.r, u => { if (!u.def.fly) damage(u, 3, null); });
    }
    if (f.k === 'tornado') {
      f.vx = clamp(f.vx + (rnd() - .5) * .02, -.15, .15); f.vy = clamp(f.vy + (rnd() - .5) * .02, -.15, .15);
      f.x = clamp(f.x + f.vx, 1, W - 2); f.y = clamp(f.y + f.vy, 1, H - 2);
      circle(f.x, f.y, 1.8, (x, y, i) => { if (bld[i] && rnd() < .2) bld[i] = 0; if ((tile[i] === T.FOREST || tile[i] === T.JUNGLE) && rnd() < .1) tile[i] = T.GRASS; if (fire[i]) fire[i] = 1; });
      around(f.x, f.y, 2.5, u => { if (u.def.size > 1.5) return; const a = rnd() * 6.28, nx = clamp(u.x + Math.cos(a) * .6, 0, W - 1), ny = clamp(u.y + Math.sin(a) * .6, 0, H - 1); if (u.def.fly || !wall[(ny | 0) * W + (nx | 0)]) { u.x = nx; u.y = ny; } damage(u, .6, null); });
      if (tickN % 2 === 0) parts.push({ x: f.x + (rnd() - .5) * 2, y: f.y + (rnd() - .5), vx: (rnd() - .5) * .2, vy: -.1 - rnd() * .1, l: 18, c: [170, 170, 160], s: 1 });
    }
    if (f.k === 'cloud') {
      f.x = clamp(f.x + f.vx, 0, W - 1); f.y = clamp(f.y + f.vy, 0, H - 1);
      for (let k = 0; k < 6; k++) {
        const x = Math.round(f.x + (rnd() - .5) * 9), y = Math.round(f.y + (rnd() - .5) * 5);
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        const i = y * W + x;
        if (f.snow) { if (isWater(tile[i]) && rnd() < .15) { tile[i] = T.ICE; regionDirty = true; } else if (!isWater(tile[i]) && tile[i] !== T.LAVA && tile[i] !== T.MOUNT && rnd() < .2) tile[i] = T.SNOW; fire[i] = 0; continue; }
        if (f.acid) { if (tile[i] === T.FOREST && rnd() < .2) tile[i] = T.ASH; else if (tile[i] === T.GRASS && rnd() < .05) tile[i] = T.SWAMP; if (bld[i] && rnd() < .02) bld[i] = 4; }
        else { fire[i] = 0; if (tile[i] === T.ASH && rnd() < .5) tile[i] = T.GRASS; else if (tile[i] === T.GRASS && !owner[i] && rnd() < .04) tile[i] = T.FOREST; else if (tile[i] === T.DESERT && rnd() < .05) tile[i] = T.SAVANNA; else if (tile[i] === T.LAVA && rnd() < .3) { tile[i] = T.BASALT; regionDirty = true; } }
      }
      if (f.acid && tickN % 8 === 0) around(f.x, f.y, 4.5, u => damage(u, 2, null));
      if (f.snow && tickN % 10 === 0) around(f.x, f.y, 4.5, u => { if (!u.def.fireproof || u.type !== 'dragon') damage(u, u.def.fireproof ? 3 : 1, null); });
    }
    if (f.k === 'bhole') {
      const r = Math.min(14, 2 + (520 - f.life) / 30); f.r = r;
      for (let k = 0; k < 10; k++) {
        const a = rnd() * 6.28, d = rnd() * r;
        const x = Math.round(f.x + Math.cos(a) * d), y = Math.round(f.y + Math.sin(a) * d);
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        const i = y * W + x; tile[i] = T.DEEP; bld[i] = 0; fire[i] = 0; owner[i] = 0; ore[i] = 0; wall[i] = 0;
      }
      regionDirty = true;
      around(f.x, f.y, 26, u => { const dx = f.x - u.x, dy = f.y - u.y, d = Math.hypot(dx, dy) || 1; u.x += dx / d * Math.min(.5, 3 / d); u.y += dy / d * Math.min(.5, 3 / d); if (d < 1.5) kill(u, null, 'agujero negro'); });
      for (let k = 0; k < 2; k++) { const a = rnd() * 6.28, d = r + 4; parts.push({ x: f.x + Math.cos(a) * d, y: f.y + Math.sin(a) * d, vx: -Math.cos(a) * .25, vy: -Math.sin(a) * .25, l: 18, c: [170, 110, 255], s: 1 }); }
      if (f.life === 1) addLog('El agujero negro se cierra, dejando un mar sin fondo.', 'doom');
    }
    if (f.k === 'volcano' && tickN % 14 === 0) {
      const a = rnd() * 6.28, d = 2 + rnd() * 6;
      const x = Math.round(f.x + Math.cos(a) * d), y = Math.round(f.y + Math.sin(a) * d);
      if (x >= 0 && y >= 0 && x < W && y < H) { const i = y * W + x; if (!isWater(tile[i]) && rnd() < .4) { tile[i] = T.LAVA; regionDirty = true; } ignite(x, y); }
      for (let k = 0; k < 5; k++) parts.push({ x: f.x, y: f.y, vx: (rnd() - .5) * .3, vy: -.2 - rnd() * .3, l: 30, c: [255, 120 + ri(0, 80), 20], s: 1.2, g: .015 });
      tile[clamp(Math.round(f.y), 0, H - 1) * W + clamp(Math.round(f.x), 0, W - 1)] = T.LAVA;
      if (rnd() < .05) shake = Math.max(shake, 3);
    }
    if (f.k === 'mush' && f.life > 60) for (let k = 0; k < 3; k++) parts.push({ x: f.x + (rnd() - .5) * 3, y: f.y, vx: (rnd() - .5) * .08, vy: -.15 - rnd() * .1, l: 70, c: pick([[255, 170, 60], [140, 120, 110], [90, 85, 80]]), s: 2.4 });
  }
  fx = fx.filter(f => f.life > 0);
}
function updateProjs() {
  for (const p of projs) {
    const t = p.t, tx = t.x, ty = t.y;
    const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
    if (d < p.spd || t.dead) {
      p.done = true;
      if (!t.dead) damage(t, p.dmg, p.src);
      if (p.kind === 'fireball') { ignite(tx | 0, ty | 0); burst(tx, ty, [255, 140, 30], 8, .6); around(tx, ty, 1.5, o => { if (o !== t && p.src && isEnemy(p.src, o)) damage(o, p.dmg * .5, p.src); }); }
      continue;
    }
    const nx = p.x + dx / d * p.spd, ny = p.y + dy / d * p.spd;
    if (p.kind !== 'laser' && wall[(ny | 0) * W + (nx | 0)]) { p.done = true; continue; }
    p.x = nx; p.y = ny;
  }
  projs = projs.filter(p => !p.done);
}
function updateParts() {
  for (const p of parts) { p.x += p.vx; p.y += p.vy; if (p.g) p.vy += p.g; p.l--; }
  parts = parts.filter(p => p.l > 0);
  if (parts.length > 2500) parts.splice(0, parts.length - 2500);
}

// ---------- bucle ----------
function tick() {
  tickN++;
  pathBudget = 7000;
  if (regionDirty && tickN % 10 === 0) computeRegions();
  rebuildGrid();
  for (const k in countType) countType[k] = 0;
  for (const u of units) countType[u.type] = (countType[u.type] || 0) + 1;
  for (let i = 0; i < units.length; i++) { const u = units[i]; if (!u.dead) updateUnit(u); }
  updateProjs(); updateFx(); updateParts();
  if (tickN % 4 === 0) { updateFires(); liveWorld(); }
  if (tickN % 30 === 0) {
    for (const c of cities) if (c) c.pop = 0;
    for (const u of units) if (!u.dead && u.city >= 0 && cities[u.city]) { const c = cities[u.city]; if (c.alive) c.pop++; else u.city = -1; }
    for (const c of cities) if (c) cityUpdate(c);
  }
  if (tickN % 20 === 0) towersFire();
  if (tickN % 120 === 0) kingdomUpdate();
  if (tickN % YEAR === 0) recordHistory();
  if (tickN % 200 === 0) naturalSpawns();
  weatherTick();
  if (units.some(u => u.dead)) {
    if (selected && selected.dead) selectedDeadName = displayName(selected);
    units = units.filter(u => !u.dead);
  }
}

// episodios de lluvia (a veces con tormenta) en primavera y otoño
function weatherTick() {
  if (!modOn('clima')) { weather.rain = 0; return; }
  if (tickN > weather.until) {
    const sea = season();
    weather.target = (sea === 0 || sea === 2) && rnd() < .45 ? .5 + rnd() * .5 : 0;
    weather.storm = weather.target > .8 && rnd() < .5;
    weather.until = tickN + ri(60, 180);
  }
  weather.rain += (weather.target - weather.rain) * .02;
  if (weather.rain > .3 && tickN % 4 === 0) { for (let k = 0; k < 6; k++) { const i = (rnd() * N) | 0; if (fire[i] && rnd() < .5) fire[i] = 0; } }
  if (weather.storm && weather.rain > .6 && rnd() < .006) {
    weather.flash = .35;
    const x = ri(0, W - 1), y = ri(0, H - 1);
    if (LAWS.desastres.on && rnd() < .4) lightning(x, y); else sfx('thunder', cam.x + VW / cam.z / 2, cam.y + VH / cam.z / 2, .6, 400);
  }
}

// historia: población de cada reino año a año (se aclara si crece mucho)
let history = [], histStep = 1;
function recordHistory() {
  if ((year() - 1) % histStep) return;
  const p = {}; let tot = 0;
  for (const k of kingdoms) if (k.alive && k.pop) { p[k.id] = k.pop; tot += k.pop; }
  history.push({ y: year(), p, t: tot });
  if (history.length > 240) { history = history.filter((_, i) => i % 2 === 0); histStep *= 2; }
}
