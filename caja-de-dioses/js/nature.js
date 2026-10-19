"use strict";
// ---------- fuego y mundo vivo ----------
function ignite(x, y) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = y * W + x;
  if (fire[i] || isWater(tile[i]) || tile[i] === T.ICE || tile[i] === T.ACID) return;
  if (!TILE[tile[i]].burn && !bld[i]) { fire[i] = 8; fires.push(i); return; }
  fire[i] = ri(18, 30); fires.push(i);
}
function updateFires() {
  const next = [];
  for (const i of fires) {
    if (!fire[i]) continue;
    fire[i]--;
    if (fire[i] === 0) {
      if (TILE[tile[i]].burn) tile[i] = T.ASH;
      if (bld[i] && bld[i] !== 4) bld[i] = rnd() < .5 ? 4 : 0;
      continue;
    }
    next.push(i);
    if (LAWS.fuego.on && (TILE[tile[i]].burn || bld[i]) && rnd() < .35) {
      const x = i % W, y = (i / W) | 0, nx = x + ri(-1, 1), ny = y + ri(-1, 1);
      if (nx >= 0 && ny >= 0 && nx < W && ny < H) {
        const j = ny * W + nx;
        if (!fire[j] && !wall[j] && (TILE[tile[j]].burn || bld[j]) && rnd() < (tile[j] === T.FOREST || tile[j] === T.JUNGLE ? .7 : .35)) { fire[j] = ri(18, 30); next.push(j); }
      }
    }
  }
  fires = next;
}
function liveWorld() {
  const n = Math.max(40, N / 60 | 0);
  for (let k = 0; k < n; k++) {
    const i = (rnd() * N) | 0, t = tile[i], x = i % W, y = (i / W) | 0;
    const nb = [x > 0 ? i - 1 : i, x < W - 1 ? i + 1 : i, y > 0 ? i - W : i, y < H - 1 ? i + W : i];
    const j = pick(nb), tj = tile[j];
    if (rad[i]) rad[i]--;
    if (t === T.ASH && LAWS.bosques.on && rnd() < .08) tile[i] = T.GRASS;
    else if (t === T.GRASS && LAWS.bosques.on && !owner[i] && tj === T.FOREST && rnd() < .05) tile[i] = T.FOREST;
    else if (t === T.FIELD && !owner[i] && rnd() < .1) tile[i] = T.GRASS;
    else if (t === T.CORRUPT && rnd() < .3 && (tj === T.GRASS || tj === T.FOREST || tj === T.FIELD)) { tile[j] = T.CORRUPT; if (rnd() < .002 && (countType.zombie || 0) < 120) spawn('zombie', x + .5, y + .5); }
    else if (t === T.LAVA) {
      if (isWater(tj)) { tile[i] = T.BASALT; tile[j] = T.BASALT; if (rnd() < .35) { ore[i] = MATID.obsidiana; oreAmt[i] = 30; } steam(x, y); regionDirty = true; }
      else if (TILE[tj].burn || bld[j]) ignite(j % W, (j / W) | 0);
      else if (rnd() < .006) { tile[i] = T.BASALT; regionDirty = true; }
    }
    else if (t === T.ACID) { if (bld[j] && rnd() < .2) bld[j] = 4; if (TILE[tj].burn && rnd() < .05) tile[j] = T.ASH; }
    else if (t === T.CRYSTAL && modOn('magia') && rnd() < .0008 && (countType.fairy || 0) < 30) spawn('fairy', x + .5, y + .5);
    roadDecay(i);
    if (bld[i] === 4 && !owner[i] && rnd() < .05) bld[i] = 0;
    if (bld[i] && !owner[i] && bld[i] !== 4) bld[i] = 4;
  }
}
function steam(x, y) { for (let k = 0; k < 4; k++) parts.push({ x: x + .5, y: y + .5, vx: (rnd() - .5) * .05, vy: -rnd() * .08, l: 30, c: [220, 230, 235], s: 1 }); }
function burst(x, y, c, n, sp) { for (let k = 0; k < n; k++) parts.push({ x, y, vx: (rnd() - .5) * sp * .3, vy: (rnd() - .5) * sp * .3, l: 15 + rnd() * 15, c, s: .8 }); }
function naturalSpawns() {
  if (LAWS.salvaje.on && units.length) {
    if ((countType.sheep || 0) < 20) for (let k = 0; k < 2; k++) { const p = randomTile(t => t === T.GRASS); if (p) spawn('sheep', p[0] + .5, p[1] + .5); }
    if ((countType.wolf || 0) < 5 && rnd() < .3) { const p = randomTile(t => t === T.FOREST); if (p) spawn('wolf', p[0] + .5, p[1] + .5); }
  }
  ecoSpawns();
  if (LAWS.desastres.on && rnd() < .15) {
    const p = randomTile(t => !isWater(t));
    if (p) { if (rnd() < .7) lightning(p[0], p[1]); else fx.push({ k: 'meteor', x: p[0] + .5, y: p[1] + .5, life: 40, r: 4 }); }
  }
}
function randomTile(fn) { for (let a = 0; a < 80; a++) { const x = ri(0, W - 1), y = ri(0, H - 1); if (fn(tile[y * W + x])) return [x, y]; } return null; }
const year = () => Math.floor(tickN / YEAR) + 1;
