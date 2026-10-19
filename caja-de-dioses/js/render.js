"use strict";
// ---------- render ----------
// El suelo se pinta por bloques de CH×CH casillas a TS píxeles por casilla y
// se guarda en lienzos. Cada fotograma se compara el mundo con una copia
// sombra y solo se repintan los bloques que han cambiado.
const CH = 16;
let wdist = null, wdistDirty = true, wdistF = 0;
let CW = 0, CHn = 0, chunks = [], sTile, sBld, sOre, sWall, sOwner, sRoad, citySig = [], seasonSig = -1, chunkFor = null;
const nightCol = [18, 26, 60];
function dayLight() {
  if (!modOn('clima') || tickN === 0) return 1;
  const d = (tickN % (YEAR / 2)) / (YEAR / 2);
  return clamp(.62 + Math.cos(d * Math.PI * 2) * .55, .4, 1);
}
function season() { return modOn('clima') ? Math.floor((tickN % YEAR) / (YEAR / 4)) : 1; }
const SEASONS = ['Primavera', 'Verano', 'Otoño', 'Invierno'];

function initChunks() {
  CW = Math.ceil(W / CH); CHn = Math.ceil(H / CH);
  chunks = Array.from({ length: CW * CHn }, () => ({ cv: null, dirty: true }));
  sTile = new Uint8Array(N).fill(255); sBld = new Uint8Array(N).fill(255); sOre = new Uint8Array(N).fill(255); sWall = new Uint8Array(N).fill(255); sOwner = new Uint16Array(N).fill(65535); sRoad = new Uint8Array(N).fill(255);
  citySig = []; chunkFor = tile; wdist = null; wdistDirty = true;
  mini.dirty = true;
}
function dirtyAt(x, y) {
  const cx = (x / CH) | 0, cy = (y / CH) | 0;
  if (cx >= 0 && cy >= 0 && cx < CW && cy < CHn) chunks[cy * CW + cx].dirty = true;
}
function dirtyTile(i) {
  const x = i % W, y = (i / W) | 0;
  dirtyAt(x, y);
  const lx = x % CH, ly = y % CH;
  if (lx === 0) dirtyAt(x - 1, y); else if (lx === CH - 1) dirtyAt(x + 1, y);
  if (ly === 0) dirtyAt(x, y - 1); else if (ly === CH - 1) dirtyAt(x, y + 1);
}
function dirtyArea(cx, cy, r) { for (let y = cy - r; y <= cy + r; y += CH >> 1) for (let x = cx - r; x <= cx + r; x += CH >> 1) dirtyAt(clamp(x, 0, W - 1), clamp(y, 0, H - 1)); }
function diffWorld() {
  if (chunkFor !== tile || chunks.length !== Math.ceil(W / CH) * Math.ceil(H / CH)) initChunks();
  let changed = false;
  for (let i = 0; i < N; i++) {
    if (tile[i] !== sTile[i] || bld[i] !== sBld[i] || ore[i] !== sOre[i] || wall[i] !== sWall[i] || owner[i] !== sOwner[i] || road[i] !== sRoad[i]) {
      sRoad[i] = road[i]; sBld[i] = bld[i]; sOre[i] = ore[i]; sWall[i] = wall[i]; sOwner[i] = owner[i];
      if (sTile[i] !== 255) wdistDirty = true;
      sTile[i] = tile[i];
      dirtyTile(i); changed = true;
    }
  }
  if (!wdist || (wdistDirty && ++wdistF > 12)) computeWaterDist();
  for (const c of cities) {
    if (!c) continue;
    const k = c.k, sig = c.alive ? 1 + (k ? k.id * 64 + (modOn('tecnologia') ? k.house * 8 + k.walls : 0) : 0) : 0;
    if (citySig[c.id] !== sig) { citySig[c.id] = sig; dirtyArea(c.x, c.y, 18); changed = true; }
  }
  const sea = season(), ss = (sea === 3 && tickN > 0) ? 3 : sea === 2 ? 2 : 0;
  if (ss !== seasonSig) { seasonSig = ss; for (const c of chunks) c.dirty = true; changed = true; }
  if (changed) mini.dirty = true;
}

// distancia de cada casilla de agua a la tierra (para el degradado de la costa)
function computeWaterDist() {
  const nd = new Uint8Array(N), q = new Int32Array(N); let h = 0, t = 0;
  for (let i = 0; i < N; i++) { if (isW(tile[i])) nd[i] = 9; else { nd[i] = 0; q[t++] = i; } }
  while (h < t) {
    const i = q[h++], x = i % W, d = nd[i] + 1; if (d > 8) continue;
    if (x > 0 && nd[i - 1] > d) { nd[i - 1] = d; q[t++] = i - 1; }
    if (x < W - 1 && nd[i + 1] > d) { nd[i + 1] = d; q[t++] = i + 1; }
    if (i >= W && nd[i - W] > d) { nd[i - W] = d; q[t++] = i - W; }
    if (i < N - W && nd[i + W] > d) { nd[i + W] = d; q[t++] = i + W; }
  }
  if (wdist) for (let i = 0; i < N; i++) if (wdist[i] !== nd[i] && isW(tile[i])) dirtyAt(i % W, (i / W) | 0);
  wdist = nd; wdistDirty = false; wdistF = 0;
}
function wd(x, y) { x = clamp(x, 0, W - 1); y = clamp(y, 0, H - 1); return wdist[y * W + x]; }
// relieve aproximado a partir del tipo de casilla
const ELV = new Uint8Array(32).fill(3);
ELV[T.DEEP] = 0; ELV[T.WATER] = 1; ELV[T.ACID] = 1; ELV[T.LAVA] = 2; ELV[T.SAND] = 2; ELV[T.SWAMP] = 2; ELV[T.ICE] = 2;
ELV[T.HILL] = 4; ELV[T.ROCK] = 4; ELV[T.MESA] = 4; ELV[T.MOUNT] = 5; ELV[T.SNOW] = 3;
const isW = t => t === T.DEEP || t === T.WATER;
function elvAt(i) { const t = tile[i]; if (t === T.SNOW) { const x = i % W; let m = 0; if (x > 0 && tile[i - 1] === T.MOUNT) m++; if (x < W - 1 && tile[i + 1] === T.MOUNT) m++; if (i >= W && tile[i - W] === T.MOUNT) m++; if (i < N - W && tile[i + W] === T.MOUNT) m++; return m ? 6 : 3; } return ELV[t]; }
// relieve continuo (no por casilla) para montañas, colinas y rocas
const RELIEF = new Float32Array(32); RELIEF[T.MOUNT] = 2.6; RELIEF[T.HILL] = 1.2; RELIEF[T.ROCK] = 1.3; RELIEF[T.MESA] = 1.4; RELIEF[T.SNOW] = 1.9; RELIEF[T.ICE] = .5; RELIEF[T.TUNDRA] = .5; RELIEF[T.DESERT] = .6; RELIEF[T.BASALT] = .9;
const rn = (gx, gy) => vnoise(gx / 9, gy / 9, 77) * .62 + vnoise(gx / 3.5, gy / 3.5, 78) * .38;
const AUTUMN = [[214, 120, 40], [196, 72, 36], [228, 172, 52], [170, 96, 40]];
const SNOWC = [238, 242, 248], FOAM = [226, 240, 246], SHALLOW = [70, 158, 186];

function paintChunk(ch, cx, cy) {
  const SZ = CH * TS;
  if (!ch.cv) { ch.cv = document.createElement('canvas'); ch.cv.width = SZ; ch.cv.height = SZ; ch.ctx = ch.cv.getContext('2d'); ch.img = ch.ctx.createImageData(SZ, SZ); }
  const d = ch.img.data, stride = SZ * 4;
  const autumn = seasonSig === 2, winter = seasonSig === 3, tech = modOn('tecnologia');
  for (let ty = 0; ty < CH; ty++) {
    const y = cy * CH + ty;
    for (let tx = 0; tx < CH; tx++) {
      const x = cx * CH + tx, ox = tx * TS, oy = ty * TS;
      if (x >= W || y >= H) { for (let py = 0; py < TS; py++) for (let px = 0; px < TS; px++) { const p = (oy + py) * stride + (ox + px) * 4; d[p] = 6; d[p + 1] = 9; d[p + 2] = 12; d[p + 3] = 255; } continue; }
      const i = y * W + x, t = tile[i], v = (hash(x, y, 1) * 4) | 0;
      const e = elvAt(i);
      const tex = t === T.SNOW && e === 6 ? snowPeakTex(v) : getTex(t, v);
      const water = isW(t);
      // vecinos
      const nN = y > 0 ? i - W : i, nS = y < H - 1 ? i + W : i, nWst = x > 0 ? i - 1 : i, nE = x < W - 1 ? i + 1 : i;
      let landN = false, landS = false, landW = false, landE = false;
      if (water) {
        landN = !isW(tile[nN]); landS = !isW(tile[nS]); landW = !isW(tile[nWst]); landE = !isW(tile[nE]);
      }
      const eS = elvAt(nS), eN = elvAt(nN);
      const cliff = !water && eS < e, lit = !water && eN < e;
      const cliffWater = cliff && isW(tile[nS]);
      // territorio
      const o = owner[i];
      let kc = null, bN = false, bS = false, bW = false, bE = false, walls = 0;
      if (o) {
        const c = cities[o - 1];
        if (c && c.alive && c.k) {
          kc = c.k.color; walls = tech ? c.k.walls : 0;
          const kk = c.k;
          const other = j => { const oj = owner[j]; if (oj === o) return false; if (!oj) return true; const cj = cities[oj - 1]; return !cj || !cj.alive || cj.k !== kk; };
          bN = y === 0 || other(nN); bS = y === H - 1 || other(nS); bW = x === 0 || other(nWst); bE = x === W - 1 || other(nE);
        }
      }
      const lat = Math.abs(y / H - .5) * 2, snowK = winter && lat > .42 && !water && t !== T.LAVA && t !== T.ACID && t !== T.DESERT && t !== T.MESA ? Math.min(1, (lat - .42) * 3.2) : 0;
      const aut = autumn ? AUTUMN[(hash(x, y, 9) * 4) | 0] : null;
      const td = tex.d;
      for (let py = 0; py < TS; py++) for (let px = 0; px < TS; px++) {
        const q = (py * TS + px) * 4, tag = td[q + 3];
        let r = td[q], g = td[q + 1], b = td[q + 2];
        if (water) {
          const fx = (px + .5) / TS - .5, fy = (py + .5) / TS - .5, x0 = fx < 0 ? x - 1 : x, y0 = fy < 0 ? y - 1 : y, ax = fx < 0 ? fx + 1 : fx, ay = fy < 0 ? fy + 1 : fy;
          const dd = (wd(x0, y0) * (1 - ax) + wd(x0 + 1, y0) * ax) * (1 - ay) + (wd(x0, y0 + 1) * (1 - ax) + wd(x0 + 1, y0 + 1) * ax) * ay;
          const sh = clamp(1 - (dd - .5) / 4.2, 0, 1) * .85, dp = clamp((dd - 3) / 5, 0, 1) * .35;
          if (sh) { r += (SHALLOW[0] - r) * sh; g += (SHALLOW[1] - g) * sh; b += (SHALLOW[2] - b) * sh; }
          if (dp) { r *= 1 - dp; g *= 1 - dp * .8; b *= 1 - dp * .5; }
          if ((landN && py === 0) || (landS && py === TS - 1) || (landW && px === 0) || (landE && px === TS - 1)) {
            if (hash(x * TS + px, y * TS + py, 3) < .75) { r = FOAM[0]; g = FOAM[1]; b = FOAM[2]; }
          } else if ((landN && py === 1) || (landS && py === TS - 2) || (landW && px === 1) || (landE && px === TS - 2)) { r += 24; g += 30; b += 26; }
        } else {
          if (aut && tag === TAG.CANOPY) { const k = .55; r += (aut[0] - r) * k; g += (aut[1] - g) * k; b += (aut[2] - b) * k; }
          else if (autumn && tag === TAG.GRASS) { r += 18; g += 2; b -= 8; }
          if (snowK && (tag !== TAG.CANOPY || py < 3) && hash(x * TS + px, y * TS + py, 5) < snowK * (tag === TAG.CANOPY ? .7 : .92)) { r = SNOWC[0] - (px + py & 1) * 8; g = SNOWC[1] - (px + py & 1) * 6; b = SNOWC[2]; }
          const rk = RELIEF[t];
          if (rk) {
            const gx = x * TS + px, gy = y * TS + py, h0 = rn(gx, gy), l = 1 + (rn(gx - 1, gy - 1) - rn(gx + 1, gy + 1)) * rk;
            r *= l; g *= l; b *= l;
            if (t === T.MOUNT && h0 > .66) { const k2 = Math.min(1, (h0 - .66) * 6); r += (236 - r) * k2; g += (240 - g) * k2; b += (246 - b) * k2; }
          }
          if (lit && py === 0) { r *= 1.1; g *= 1.1; b *= 1.08; }
          if (cliff) {
            if (cliffWater) { if (py === TS - 1) { r = 120; g = 96; b = 70; } else if (py === TS - 2) { r *= .82; g *= .8; b *= .78; } }
            else if (py === TS - 1) { r *= .7; g *= .7; b *= .74; } else if (py === TS - 2) { r *= .86; g *= .86; b *= .88; }
          }
        }
        if (kc) {
          const edge = (bN && py === 0) || (bS && py === TS - 1) || (bW && px === 0) || (bE && px === TS - 1);
          const edge2 = (bN && py === 1) || (bS && py === TS - 2) || (bW && px === 1) || (bE && px === TS - 2);
          if (edge) {
            if (walls) { const m = ((px + py) & 1) ? 1 : .78; r = (150 + kc[0] * .15) * m; g = (146 + kc[1] * .15) * m; b = (140 + kc[2] * .15) * m; }
            else { r = kc[0] * 1.1 + 20; g = kc[1] * 1.1 + 20; b = kc[2] * 1.1 + 20; }
          } else if (edge2) { r += (kc[0] - r) * .45; g += (kc[1] - g) * .45; b += (kc[2] - b) * .45; }
          else { r += (kc[0] - r) * .13; g += (kc[1] - g) * .13; b += (kc[2] - b) * .13; }
        }
        const p = (oy + py) * stride + (ox + px) * 4;
        d[p] = r; d[p + 1] = g; d[p + 2] = b; d[p + 3] = 255;
      }
      // caminos: tierra o adoquín según la era, unidos con los vecinos
      if (road[i]) {
        const stone = kc && tech && cities[o - 1].k.house >= 2;
        const rc = stone ? [158, 152, 142] : [176, 146, 100], rd = stone ? [122, 118, 110] : [146, 118, 78];
        const cn = road[nN] && y > 0, cs = road[nS] && y < H - 1, cw = road[nWst] && x > 0, ce = road[nE] && x < W - 1;
        for (let py = 0; py < TS; py++) for (let px = 0; px < TS; px++) {
          const inC = px >= 2 && px <= 5 && py >= 2 && py <= 5;
          const on = inC || (cn && py < 2 && px >= 2 && px <= 5) || (cs && py > 5 && px >= 2 && px <= 5) || (cw && px < 2 && py >= 2 && py <= 5) || (ce && px > 5 && py >= 2 && py <= 5);
          if (!on) continue;
          const p = (oy + py) * stride + (ox + px) * 4, h2 = hash(x * TS + px, y * TS + py, 11);
          const c = stone ? (((px + (py >> 1)) & 1) ? rc : rd) : h2 < .2 ? rd : rc;
          d[p] = c[0] + h2 * 8; d[p + 1] = c[1] + h2 * 8; d[p + 2] = c[2] + h2 * 6;
        }
      }
      // minerales
      const m = ore[i];
      if (m) {
        const mc = MAT[m].c, R = mulb(i * 7 + m);
        for (let k = 0; k < 4; k++) {
          const px = 1 + (R() * 5) | 0, py = 1 + (R() * 5) | 0;
          for (const [dx, dy, kk] of [[0, 0, 1], [1, 0, .8], [0, 1, .7], [1, 1, .55]]) { const p = (oy + py + dy) * stride + (ox + px + dx) * 4; d[p] = mc[0] * kk; d[p + 1] = mc[1] * kk; d[p + 2] = mc[2] * kk; }
          const p = (oy + py) * stride + (ox + px) * 4; d[p] = Math.min(255, mc[0] + 70); d[p + 1] = Math.min(255, mc[1] + 70); d[p + 2] = Math.min(255, mc[2] + 70);
        }
      }
      // edificios
      const bl = bld[i];
      if (bl) {
        const c = o ? cities[o - 1] : null, k = c && c.alive ? c.k : null;
        const ht = k && tech ? k.house : 0;
        if (bl === 4 || !k) stamp(d, stride, ox, oy, RUIN_SPR, null);
        else if (bl === 3) stamp(d, stride, ox, oy, SITE_SPR, k.color);
        else if (bl >= 5) stamp(d, stride, ox, oy, SPECIAL_SPR[bl] || BLD_SPR[ht], k.color);
        else stamp(d, stride, ox, oy, bl === 2 ? CENTER_SPR[ht] : BLD_SPR[ht], k.color);
      }
      // frontera divina
      if (wall[i]) {
        for (let py = 0; py < TS; py++) for (let px = 0; px < TS; px++) {
          const p = (oy + py) * stride + (ox + px) * 4, brick = ((py >> 1) + ((px >> 2) & 1)) & 1;
          const c = py < 2 ? [196, 52, 58] : brick ? [72, 64, 76] : [92, 82, 96];
          d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2];
        }
        const p = (oy + 4) * stride + (ox + 3) * 4; d[p] = 255; d[p + 1] = 110; d[p + 2] = 100;
      }
    }
  }
  ch.ctx.putImageData(ch.img, 0, 0);
  ch.dirty = false;
}

// ---------- minimapa ----------
const mini = { cv: document.getElementById('minimap'), dirty: true, f: 0 };
mini.ctx = mini.cv ? mini.cv.getContext('2d') : null;
function renderMini() {
  if (!mini.ctx || mini.cv.offsetParent === null) return;
  if (mini.cv.width !== W || mini.cv.height !== H) { mini.cv.width = W; mini.cv.height = H; mini.img = mini.ctx.createImageData(W, H); mini.dirty = true; }
  if (mini.dirty && ++mini.f % 20 === 0) {
    const d = mini.img.data;
    for (let i = 0; i < N; i++) {
      const t = tile[i]; let c = TILE[t].c, r = c[0], g = c[1], b = c[2];
      const o = owner[i];
      if (o) { const ct = cities[o - 1]; if (ct && ct.alive && ct.k) { const kc = ct.k.color; r += (kc[0] - r) * .55; g += (kc[1] - g) * .55; b += (kc[2] - b) * .55; } }
      if (bld[i] && bld[i] !== 4) { r = 240; g = 230; b = 210; }
      const p = i * 4; d[p] = r; d[p + 1] = g; d[p + 2] = b; d[p + 3] = 255;
    }
    mini.ctx.putImageData(mini.img, 0, 0);
    mini.dirty = false;
  }
  // rectángulo de cámara
  const fr = document.getElementById('miniFrame');
  if (fr) {
    const sx = mini.cv.clientWidth / W, sy = mini.cv.clientHeight / H;
    fr.style.left = (cam.x * sx) + 'px'; fr.style.top = (cam.y * sy) + 'px';
    fr.style.width = (VW / cam.z * sx) + 'px'; fr.style.height = (VH / cam.z * sy) + 'px';
  }
}

// ---------- nubes y clima ----------
let clouds = [], weather = [], lastRT = 0;
function updateAmbient(now) {
  const dt = Math.min(.1, (now - (lastRT || now)) / 1000); lastRT = now;
  if (!clouds.length && W) for (let k = 0; k < Math.max(3, (N / 4500) | 0); k++) clouds.push({ x: rnd() * W, y: rnd() * H, s: .6 + rnd() * .9, spr: (rnd() * 4) | 0, v: .4 + rnd() * .5 });
  for (const c of clouds) { c.x += c.v * dt * (paused ? .3 : 1 + speed * .2); if (c.x > W + 30) { c.x = -40; c.y = rnd() * H; } }
}
function bodyColor(u) { return u.k ? u.k.color : u.def.skin.map(v => v * .75); }

function render() {
  diffWorld();
  const now = performance.now();
  updateAmbient(now);
  const ctx = vctx, z = cam.z * DPR;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#071019'; ctx.fillRect(0, 0, view.width, view.height);
  let sxo = 0, syo = 0;
  if (shake > 0) { sxo = (rnd() - .5) * shake * DPR; syo = (rnd() - .5) * shake * DPR; if (!paused) shake *= .9; if (shake < .3) shake = 0; }
  const ox = -cam.x * z + sxo, oy = -cam.y * z + syo;
  const toS = (x, y) => [ox + x * z, oy + y * z];
  // bloques de suelo visibles (repinta los sucios con un presupuesto de tiempo)
  const cx0 = clamp(Math.floor(cam.x / CH) - 1, 0, CW - 1), cx1 = clamp(Math.floor((cam.x + VW / cam.z) / CH) + 1, 0, CW - 1);
  const cy0 = clamp(Math.floor(cam.y / CH) - 1, 0, CHn - 1), cy1 = clamp(Math.floor((cam.y + VH / cam.z) / CH) + 1, 0, CHn - 1);
  ctx.imageSmoothingEnabled = z < TS * .7; ctx.imageSmoothingQuality = 'medium';
  const budget = now + 7;
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
    const ch = chunks[cy * CW + cx];
    if ((ch.dirty && (performance.now() < budget || !ch.cv))) paintChunk(ch, cx, cy);
    const x0 = Math.floor(ox + cx * CH * z), y0 = Math.floor(oy + cy * CH * z);
    const x1 = Math.floor(ox + (cx + 1) * CH * z), y1 = Math.floor(oy + (cy + 1) * CH * z);
    ctx.drawImage(ch.cv, x0, y0, x1 - x0, y1 - y0);
  }
  // pinta en segundo plano algún bloque sucio fuera de pantalla
  if (performance.now() < budget) for (let k = 0; k < chunks.length; k++) { if (chunks[k].dirty) { paintChunk(chunks[k], k % CW, (k / CW) | 0); if (performance.now() > budget) break; } }
  ctx.imageSmoothingEnabled = false;

  const vx0 = cam.x - 3, vy0 = cam.y - 3, vx1 = cam.x + VW / cam.z + 3, vy1 = cam.y + VH / cam.z + 3;
  const tx0 = clamp(Math.floor(cam.x), 0, W - 1), tx1 = clamp(Math.ceil(cam.x + VW / cam.z), 0, W - 1);
  const ty0 = clamp(Math.floor(cam.y), 0, H - 1), ty1 = clamp(Math.ceil(cam.y + VH / cam.z), 0, H - 1);
  const tsec = now / 1000;
  // brillos del agua y lava
  if (cam.z >= 4) {
    const step = cam.z < 7 ? 2 : 1, fr = Math.floor(tsec * 1.6);
    for (let y = ty0; y <= ty1; y += step) for (let x = tx0; x <= tx1; x += step) {
      const t = tile[y * W + x];
      if (t <= 1) { if (hash(x, y, fr) < .045) { ctx.fillStyle = 'rgba(210,236,255,.7)'; const s = z / TS; ctx.fillRect(ox + (x + hash(x, y, 2) * .6) * z, oy + (y + hash(x, y, 4)) * z, s * 2, s); } }
      else if (t === T.LAVA && hash(x, y, fr + 50) < .2) { ctx.fillStyle = 'rgba(255,230,120,.8)'; const s = z / TS; ctx.fillRect(ox + (x + hash(x, y, 6) * .8) * z, oy + (y + hash(x, y, 8) * .8) * z, s, s); }
    }
  }
  // fuego
  const ff = Math.floor(tsec * 8) % 3;
  for (const i of fires) {
    if (!fire[i]) continue;
    const x = i % W, y = (i / W) | 0; if (x < tx0 - 1 || x > tx1 + 1 || y < ty0 - 1 || y > ty1 + 1) continue;
    ctx.drawImage(FLAMES[(ff + i) % 3], ox + x * z, oy + y * z - z * .25, z, z);
  }
  // unidades: ordenadas por y para que las de delante tapen a las de detrás
  const vis = [];
  for (const u of units) if (u.x >= vx0 && u.x <= vx1 && u.y >= vy0 && u.y <= vy1) vis.push(u);
  vis.sort((a, b) => a.y - b.y);
  const sprites = z >= 3.2 * DPR;
  for (const u of vis) {
    const [sx, sy] = toS(u.x, u.y);
    if (sprites) drawUnit(ctx, u, sx, sy, z);
    else {
      const s = Math.max(1.5 * DPR, z * .8 * (u.def.size || 1));
      ctx.fillStyle = css(u.hitT ? [255, 70, 70] : u.def.civ ? bodyColor(u) : u.def.skin);
      ctx.fillRect(sx - s / 2, sy - s, s, s);
      if ((u.k && u.k.king === u) || u.hero) { ctx.fillStyle = '#ffd23a'; ctx.fillRect(sx - s / 2, sy - s * 1.5, s, s * .4); }
      if (u === selected) { ctx.strokeStyle = '#e8b64c'; ctx.lineWidth = 2; ctx.strokeRect(sx - s, sy - s * 1.6, s * 2, s * 2); }
    }
  }
  // mentes visibles: bocadillo con lo que piensa cada habitante
  if (modOn('mentes') && cam.z >= 15 && sprites) {
    let n = 0;
    for (const u of vis) {
      if (!u.def.civ || (u.asleep && bld[(u.y | 0) * W + (u.x | 0)]) || n > 160) continue;
      const key = u.target && !u.target.dead ? (u.hunting ? 'hunt' : 'fight') : u.task ? u.task.k : null;
      const g = key === 'fight' ? '⚔' : TASKICON[key]; if (!g) continue;
      const [sx, sy] = toS(u.x, u.y), r = z * .5, bx = sx + z * .55, by = sy - z * 1.75;
      ctx.fillStyle = 'rgba(250,248,240,.93)'; ctx.beginPath(); ctx.arc(bx, by, r, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(bx - r * .7, by + r * 1.05, r * .2, 0, 7); ctx.fill();
      ctx.drawImage(emojiCanvas(g), bx - r * .78, by - r * .78, r * 1.56, r * 1.56);
      n++;
    }
  }
  for (const p of projs) {
    const [sx, sy] = toS(p.x, p.y);
    const s = Math.max(2, z * (p.kind === 'fireball' ? .45 : .2));
    if (p.kind === 'fireball') { ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(FIREGLOW, sx - s * 2, sy - s * 2 - z * .5, s * 4, s * 4); ctx.globalCompositeOperation = 'source-over'; }
    ctx.fillStyle = p.kind === 'fireball' ? '#ffb040' : p.kind === 'laser' ? '#6cff8a' : p.kind === 'bullet' ? '#ffe9a0' : '#e8dcc0';
    if (p.kind === 'arrow' || p.kind === 'laser' || p.kind === 'bullet') {
      const t = p.t, a = Math.atan2(t.y - p.y, t.x - p.x), L = z * (p.kind === 'laser' ? .9 : .5);
      ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = Math.max(1, z * .09); ctx.beginPath(); ctx.moveTo(sx, sy - z * .5); ctx.lineTo(sx - Math.cos(a) * L, sy - z * .5 - Math.sin(a) * L); ctx.stroke();
    } else ctx.fillRect(sx - s / 2, sy - s / 2 - z * .5, s, s);
  }
  drawFx(ctx, toS, z);
  for (const p of parts) {
    if (p.x < vx0 || p.x > vx1 || p.y < vy0 || p.y > vy1) continue;
    const [sx, sy] = toS(p.x, p.y); const s = Math.max(1.5, z * .3 * p.s);
    ctx.globalAlpha = Math.min(1, p.l / 15);
    ctx.fillStyle = css(p.c); ctx.fillRect(sx - s / 2, sy - s / 2, s, s);
  }
  ctx.globalAlpha = 1;
  // noche: oscurece y enciende luces de casas y hogueras
  const light = dayLight();
  if (light < .98) {
    const dark = 1 - light;
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = css(mix([255, 255, 255], [70, 86, 150], dark * 1.15));
    ctx.fillRect(0, 0, view.width, view.height);
    ctx.globalCompositeOperation = 'lighter';
    if (dark > .15) {
      const a = Math.min(1, (dark - .15) * 2.2);
      ctx.globalAlpha = a * .55;
      let n = 0;
      const step = cam.z < 3 ? 2 : 1;
      for (let y = ty0; y <= ty1 && n < 1800; y += step) for (let x = tx0; x <= tx1; x += step) {
        const i = y * W + x, b = bld[i]; if (!b || b === 3 || b === 4) continue;
        if (hash(x, y, 77) > (b === 2 ? 1 : .7)) continue;
        const r = z * (b === 2 ? 2.4 : b >= 5 ? 1.8 : 1.3); n++;
        ctx.drawImage(GLOW, ox + (x + .5) * z - r, oy + (y + .5) * z - r, r * 2, r * 2);
      }
      ctx.globalAlpha = a;
      for (const i of fires) { if (!fire[i]) continue; const x = i % W, y = (i / W) | 0; if (x < tx0 || x > tx1 || y < ty0 || y > ty1) continue; const r = z * 1.8; ctx.drawImage(FIREGLOW, ox + (x + .5) * z - r, oy + (y + .5) * z - r, r * 2, r * 2); }
      for (let y = ty0; y <= ty1; y += 2) for (let x = tx0; x <= tx1; x += 2) { if (tile[y * W + x] === T.LAVA) { const r = z * 2.2; ctx.drawImage(FIREGLOW, ox + (x + .5) * z - r, oy + (y + .5) * z - r, r * 2, r * 2); } }
      ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  // nubes (solo de lejos) con su sombra
  if (cam.z < 9 && modOn('clima')) {
    const a = clamp((9 - cam.z) / 5, 0, 1) * .55;
    for (const c of clouds) {
      const w = 34 * c.s * z, h = w * .55, sx = ox + c.x * z, sy = oy + c.y * z;
      if (sx > view.width || sx + w < 0 || sy > view.height || sy + h < 0) continue;
      ctx.globalAlpha = a * .35; ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(CLOUD_SPR[c.spr], sx + z * 5, sy + z * 7, w, h);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a;
      ctx.drawImage(CLOUD_SPR[c.spr], sx, sy, w, h);
    }
    ctx.globalAlpha = 1;
  }
  // nieve en invierno (partículas en pantalla)
  if (seasonSig === 3 && modOn('clima')) {
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    for (let k = 0; k < 90; k++) { const x = (hash(k, 1, 3) * view.width + tsec * 20 * (1 + hash(k, 2, 3))) % view.width, y = (hash(k, 5, 3) * view.height + tsec * 40 * (1 + hash(k, 3, 3))) % view.height; const s = (1 + hash(k, 9, 3) * 1.5) * DPR; ctx.fillRect(x, y, s, s); }
  }
  // nombres de ciudades
  if (cam.z >= 2.6) {
    ctx.font = `600 ${Math.round(11 * DPR)}px Barlow, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    for (const c of cities) {
      if (!c || !c.alive || c.x < vx0 || c.x > vx1 || c.y < vy0 || c.y > vy1) continue;
      const [sx, sy] = toS(c.x + .5, c.y - .6);
      const cap = c.k.capital === c.id;
      const label = c.name + '  ' + c.pop;
      const w = ctx.measureText(label).width + (cap ? 26 : 14) * DPR, h = 17 * DPR, bx = sx - w / 2, by = sy - h - 2 * DPR;
      ctx.fillStyle = 'rgba(10,14,20,.82)'; roundRect(ctx, bx, by, w, h, 4 * DPR); ctx.fill();
      ctx.fillStyle = css(c.k.color); roundRect(ctx, bx, by, 4 * DPR, h, 2 * DPR); ctx.fill();
      ctx.fillStyle = c.k === warPick ? '#e8b64c' : '#f0f3ef';
      ctx.fillText((cap ? '♛ ' : '') + label, sx + 2 * DPR, by + h - 5 * DPR);
      if (c.k.wars.size) { ctx.fillStyle = '#ff7466'; ctx.fillText('⚔', bx + w + 7 * DPR, by + h - 5 * DPR); }
    }
  }
  // pincel
  if (hover && !['inspect', 'move', 'act', 'spawn', 'bolt', 'heroize', 'village', 'declare', 'peace', 'gift', 'scope'].includes(curTool.kind) && !(curTool.kind === 'trait' && traitScope === 'village')) {
    const [sx, sy] = toS(hover.x, hover.y);
    const k = curTool.kind;
    const r = (k === 'quake' ? 8 + brush : k === 'flood' ? 6 + brush : k === 'nuke' ? 15 : k === 'bomb' ? 3 + brush * .5 : k === 'meteor' ? 4 + brush * .4 : k === 'wall' ? Math.max(.75, brush * .3) : k === 'unwall' ? Math.max(1, brush * .7) : k === 'ore' ? Math.max(.8, brush * .6) : (k === 'trait' || k === 'untrait') ? Math.max(1.2, brush * .8) : brush) * z;
    ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 3 * DPR; ctx.beginPath(); ctx.arc(sx, sy, r, 0, 7); ctx.stroke();
    ctx.strokeStyle = k === 'wall' ? 'rgba(240,96,84,.95)' : 'rgba(240,196,96,.95)'; ctx.lineWidth = 1.5 * DPR; ctx.beginPath(); ctx.arc(sx, sy, r, 0, 7); ctx.stroke();
  }
  if (flash > 0) { ctx.fillStyle = `rgba(255,250,235,${flash})`; ctx.fillRect(0, 0, view.width, view.height); if (!paused) flash *= .93; if (flash < .02) flash = 0; }
  renderMini();
}
const EMOJI = new Map();
function emojiCanvas(g) {
  let c = EMOJI.get(g); if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = 40; const x = c.getContext('2d');
  x.font = '30px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(g, 20, 22); EMOJI.set(g, c); return c;
}
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

const RESCOL = Object.fromEntries(RESLIST.map(r => [r[0], css(r[2])]));
function drawUnit(ctx, u, sx, sy, z) {
  const def = u.def;
  if (u.asleep && bld[(u.y | 0) * W + (u.x | 0)]) return; // duerme dentro de casa
  const size = (def.size || 1) * tmul(u, 'size') * (def.civ && u.age < 12 ? .72 : 1);
  const moving = u.tx !== null || u.target;
  const frame = moving ? ((tickN + u.id * 3) >> 3) & 1 : 0;
  const s = unitSprite(u, frame);
  const px = z / TS * size * (def.civ ? .78 : def.size > 1.5 ? .9 : .72);
  const w = s.w * px, h = s.h * px;
  const bob = def.fly ? Math.sin((tickN + u.id * 7) * .1) * px * 1.5 - px * 4 : 0;
  const flip = u.face < 0;
  ctx.drawImage(SHADOW, sx - w * .45, sy - px * 1.6, w * .9, px * 3);
  ctx.save();
  ctx.translate(sx, sy - h + px + bob);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(s.cv, -w / 2, 0, w, h);
  // arma
  const tech = def.civ && u.k && modOn('tecnologia') && u.age >= 12;
  if (tech && u.k.weapon.c) {
    ctx.fillStyle = css(u.k.weapon.c);
    if (u.k.gun) ctx.fillRect(w * .28, h * .48, px * 3, px);
    else if (rangeOf(u) > 2) { ctx.strokeStyle = '#8a5a30'; ctx.lineWidth = px * .7; ctx.beginPath(); ctx.arc(w * .2, h * .52, px * 2.6, -1.1, 1.1); ctx.stroke(); ctx.strokeStyle = 'rgba(240,230,210,.8)'; ctx.lineWidth = px * .3; ctx.beginPath(); ctx.moveTo(w * .2 + Math.cos(-1.1) * px * 2.6, h * .52 + Math.sin(-1.1) * px * 2.6); ctx.lineTo(w * .2 + Math.cos(1.1) * px * 2.6, h * .52 + Math.sin(1.1) * px * 2.6); ctx.stroke(); }
    else ctx.fillRect(w * .36, h * .12, px, px * 5);
  }
  if (u.carry) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(w * .14 - px * .3, h * .38 - px * .3, px * 3.6, px * 3.1); ctx.fillStyle = RESCOL[u.carry.r] || '#c9a060'; ctx.fillRect(w * .14, h * .38, px * 3, px * 2.5); }
  if (u.asleep) ctx.globalAlpha = 1;
  ctx.restore();
  const top = sy - h + px + bob;
  const crown = (u.k && u.k.king === u) ? 'king' : u.hero ? 'hero' : null;
  if (crown) {
    ctx.fillStyle = crown === 'king' ? '#ffd23a' : '#e8b64c';
    const cw = px * (crown === 'king' ? 5 : 3);
    ctx.fillRect(sx - cw / 2, top - px * .8, cw, px * 1.2);
    if (crown === 'king') { ctx.fillRect(sx - cw / 2, top - px * 2, px, px * 1.4); ctx.fillRect(sx + cw / 2 - px, top - px * 2, px, px * 1.4); ctx.fillRect(sx - px / 2, top - px * 2.2, px, px * 1.6); }
  }
  if (u.traits.length && z >= 14 && !crown) { ctx.fillStyle = 'rgba(232,182,76,.95)'; ctx.fillRect(sx - px * .6, top - px * 1.6, px * 1.2, px * 1.2); }
  if (u.hp < u.maxHp && z >= 8) {
    const bw = Math.max(w, px * 7), bx = sx - bw / 2, by = top - px * 3.2, bh = Math.max(2, px * .9);
    ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = u.hp / u.maxHp > .5 ? '#6ad074' : u.hp / u.maxHp > .25 ? '#e8b64c' : '#e0584b'; ctx.fillRect(bx, by, bw * Math.max(0, u.hp / u.maxHp), bh);
  }
  if (u === selected) { ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = Math.max(1.5, px * .5); ctx.beginPath(); ctx.ellipse(sx, sy, w * .7, px * 2.2, 0, 0, 7); ctx.stroke(); }
}

function drawFx(ctx, toS, z) {
  for (const f of fx) {
    const [sx, sy] = toS(f.x, f.y);
    if (f.k === 'meteor') {
      const k = f.life / 40, hx = sx + k * 30 * z, hy = sy - k * 60 * z;
      const g = ctx.createLinearGradient(hx + 10 * z, hy - 20 * z, hx, hy); g.addColorStop(0, 'rgba(255,170,60,0)'); g.addColorStop(1, 'rgba(255,200,90,.95)');
      ctx.strokeStyle = g; ctx.lineWidth = Math.max(3, z * .9); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(hx + 10 * z, hy - 20 * z); ctx.lineTo(hx, hy); ctx.stroke(); ctx.lineCap = 'butt';
      ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(FIREGLOW, hx - z * 3, hy - z * 3, z * 6, z * 6); ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#fff0c0'; ctx.beginPath(); ctx.arc(hx, hy, Math.max(3, z * 1.1), 0, 7); ctx.fill();
    } else if (f.k === 'bolt') {
      ctx.strokeStyle = `rgba(230,240,255,${f.life / 12})`; ctx.lineWidth = Math.max(2, z * .4);
      ctx.shadowColor = 'rgba(160,190,255,.9)'; ctx.shadowBlur = 12 * DPR;
      ctx.beginPath(); let x = sx, y = sy - 70 * z; ctx.moveTo(x, y);
      let s = f.seed * 1000;
      while (y < sy) { s = (s * 9301 + 49297) % 233280; x += ((s / 233280) - .5) * 6 * z; y += 6 * z; ctx.lineTo(x, Math.min(y, sy)); }
      ctx.stroke(); ctx.shadowBlur = 0;
    } else if (f.k === 'tornado') {
      for (let k = 0; k < 9; k++) { const a = tickN * .4 + k; ctx.strokeStyle = `rgba(200,200,190,${.65 - k * .05})`; ctx.lineWidth = Math.max(1, z * .35); ctx.beginPath(); ctx.ellipse(sx + Math.sin(a) * z * .4, sy - k * z * .8, z * (.4 + k * .3), z * (.15 + k * .09), 0, 0, 7); ctx.stroke(); }
    } else if (f.k === 'cloud') {
      ctx.globalAlpha = .85; ctx.drawImage(CLOUD_SPR[f.acid ? 1 : 0], sx - z * 8, sy - z * 10, z * 16, z * 8.8); ctx.globalAlpha = 1;
      if (f.snow) { ctx.fillStyle = 'rgba(255,255,255,.9)'; for (let k = 0; k < 26; k++) { const rx = sx + (hash(k, tickN >> 1, 1) - .5) * z * 12, ry = sy - z * 5 + hash(k, tickN >> 1, 2) * z * 7; ctx.fillRect(rx, ry, Math.max(1.5, z * .18), Math.max(1.5, z * .18)); } continue; }
      if (f.acid) { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(170,230,90,.7)'; ctx.beginPath(); ctx.ellipse(sx, sy - z * 6, z * 7, z * 3.4, 0, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
      ctx.strokeStyle = f.acid ? 'rgba(170,240,60,.7)' : 'rgba(170,200,255,.7)'; ctx.lineWidth = Math.max(1, z * .12);
      for (let k = 0; k < 18; k++) { const rx = sx + (rnd() - .5) * z * 12, ry = sy - z * 5 + rnd() * z * 7; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - z * .3, ry + z * 1); ctx.stroke(); }
    } else if (f.k === 'bhole') {
      const r = (f.r || 2) * z;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 1.6);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.55, 'rgba(10,0,20,1)'); g.addColorStop(.7, 'rgba(160,90,255,.8)'); g.addColorStop(1, 'rgba(80,20,160,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, r * 1.6, 0, 7); ctx.fill();
    } else if (f.k === 'beam') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(140,255,170,${f.life / 40})`; ctx.fillRect(sx - z * .6, sy - z * 6, z * 1.2, z * 6);
      ctx.globalCompositeOperation = 'source-over';
    } else if (f.k === 'mush') {
      const k = 1 - f.life / 160;
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.max(0, 1 - k * 1.2);
      ctx.drawImage(FIREGLOW, sx - z * 18 * k - z * 4, sy - z * 18 * k - z * 4, z * (36 * k + 8), z * (36 * k + 8));
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    } else if (f.k === 'volcano') {
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .6 + Math.sin(tickN * .2) * .2;
      ctx.drawImage(FIREGLOW, sx - z * 3, sy - z * 3, z * 6, z * 6);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
  }
}
