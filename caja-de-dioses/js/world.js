"use strict";
// ---------- estado del mundo ----------
let W, H, N, tile, owner, bld, fire, rad, ore, oreAmt, wall, region, road, traffic, siteT;
let units = [], cities = [], kingdoms = [], projs = [], fx = [], parts = [], fires = [];
let tickN = 0, uid = 1, logs = [], regionDirty = true;
const YEAR = 240;
let paused = true, speed = 1, shake = 0, flash = 0;
const cam = { x: 0, y: 0, z: 4 };
const GC = 8; let GW, GH, grid;
const countType = {};

const view = document.getElementById('view');
const vctx = view.getContext('2d');
let VW = 0, VH = 0, DPR = 1;

function allocWorld(w, h) {
  W = w; H = h; N = W * H;
  tile = new Uint8Array(N); owner = new Uint16Array(N); bld = new Uint8Array(N);
  fire = new Uint8Array(N); rad = new Uint8Array(N); ore = new Uint8Array(N); oreAmt = new Uint8Array(N);
  wall = new Uint8Array(N); region = new Int32Array(N); road = new Uint8Array(N); traffic = new Uint8Array(N); siteT = new Uint8Array(N);
  GW = Math.ceil(W / GC); GH = Math.ceil(H / GC); grid = Array.from({ length: GW * GH }, () => []);
  units = []; cities = []; kingdoms = []; projs = []; fx = []; parts = []; fires = []; logs = [];
  tickN = 0; regionDirty = true;
  if (typeof onAllocWorld === 'function') onAllocWorld();
}

function genWorld(w, h, type, ores) {
  allocWorld(w, h);
  const s = ri(1, 99999);
  const sc = type === 'arch' ? 22 : type === 'pang' ? 70 : 42;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (type === 'empty') { tile[i] = T.DEEP; continue; }
    const nx = x / W - .5, ny = y / H - .5;
    const d = Math.sqrt(nx * nx * 1.1 + ny * ny * 1.4) * 2;
    let e = fbm(x / sc, y / sc, s);
    if (type === 'flat') { const f = vnoise(x / 9, y / 9, s + 40), r = vnoise(x / 7, y / 7, s + 41); tile[i] = d > .92 ? (d > 1 ? T.DEEP : T.WATER) : d > .88 ? T.SAND : r > .8 ? T.ROCK : f > .7 ? T.FOREST : T.GRASS; continue; }
    if (type === 'pang') e = e * .75 + .42 - d * .55;
    else if (type === 'arch') e = e * 1.05 - d * .25 + .02;
    else e = e + .12 - d * .38;
    const m = fbm(x / 30 + 100, y / 30, s + 5);
    const temp = 1 - Math.abs(ny) * 2 + (vnoise(x / 20, y / 20, s + 9) - .5) * .35;
    let t;
    if (e < .34) t = T.DEEP; else if (e < .41) t = T.WATER; else if (e < .435) t = T.SAND;
    else if (e < .63) {
      if (temp < .14) t = rnd() < .2 ? T.ICE : T.SNOW;
      else if (temp < .26) t = T.TUNDRA;
      else if (m < .33 && temp > .6) t = vnoise(x / 12, y / 12, s + 3) > .65 ? T.MESA : T.DESERT;
      else if (m < .42 && temp > .62) t = T.SAVANNA;
      else if (m > .62 && e < .5 && temp > .4) t = T.SWAMP;
      else if (m > .55 && temp > .7) t = T.JUNGLE;
      else if (m > .5) t = T.FOREST;
      else t = vnoise(x / 10, y / 10, s + 21) > .74 ? T.FERTILE : T.GRASS;
    }
    else if (e < .67) t = T.HILL; else if (e < .7) t = vnoise(x / 6, y / 6, s + 13) > .55 ? T.ROCK : T.HILL; else if (e < .78) t = T.MOUNT; else t = T.SNOW;
    if (temp < .1 && isWater(t) && e > .3) t = T.ICE;
    tile[i] = t;
  }
  if (ores !== 'none') {
    const nVein = Math.round(N / (ores === 'many' ? 450 : 1400));
    const common = [1, 1, 2, 3, 3, 3, 4, 4, 5, 6, 7, 8], rare = [9, 10, 11];
    for (let v = 0; v < nVein; v++) {
      const p = randomTile(t => TILE[t].stone || t === T.HILL) || randomTile(t => TILE[t].build);
      if (!p) break;
      let m = rnd() < .07 ? pick(rare) : pick(common);
      if (!modOn(MAT[m].mod)) m = 3;
      placeVein(p[0], p[1], m, ri(3, 7));
    }
  }
  centerCam();
}
function placeVein(x, y, m, n) {
  for (let k = 0; k < n; k++) {
    x += ri(-1, 1); y += ri(-1, 1);
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const i = y * W + x; if (isWater(tile[i]) || TILE[tile[i]].liquid) continue;
    ore[i] = m; oreAmt[i] = 40;
  }
}

function resize() {
  const r = view.getBoundingClientRect(); DPR = Math.min(2, window.devicePixelRatio || 1);
  VW = r.width; VH = r.height; view.width = Math.max(1, Math.round(VW * DPR)); view.height = Math.max(1, Math.round(VH * DPR));
}
function centerCam() {
  resize();
  cam.z = Math.max(2, Math.min(VW / W, VH / H) * (VW < VH ? 1.6 : 1));
  cam.x = W / 2 - VW / cam.z / 2; cam.y = H / 2 - VH / cam.z / 2;
}

// ---------- regiones (fronteras) ----------
function passable(i) { const t = tile[i]; return !wall[i] && !isWater(t) && !TILE[t].liquid && t !== T.MOUNT; }
function computeRegions() {
  region.fill(0);
  const q = new Int32Array(N);
  let id = 0;
  for (let s = 0; s < N; s++) {
    if (region[s] || !passable(s)) continue;
    id++; let h = 0, t = 0; q[t++] = s; region[s] = id;
    while (h < t) {
      const i = q[h++], x = i % W;
      if (x > 0 && !region[i - 1] && passable(i - 1)) { region[i - 1] = id; q[t++] = i - 1; }
      if (x < W - 1 && !region[i + 1] && passable(i + 1)) { region[i + 1] = id; q[t++] = i + 1; }
      if (i >= W && !region[i - W] && passable(i - W)) { region[i - W] = id; q[t++] = i - W; }
      if (i < N - W && !region[i + W] && passable(i + W)) { region[i + W] = id; q[t++] = i + W; }
    }
  }
  regionDirty = false;
}
const regAt = (x, y) => region[(y | 0) * W + (x | 0)];
function sameRegion(a, b) {
  if (a.def.fly || b.def.fly) return true;
  const ra = regAt(a.x, a.y), rb = regAt(b.x, b.y);
  return !ra || !rb || ra === rb;
}
function kingdomsTouch(a, b) {
  const ca = cities[a.capital], cb = cities[b.capital]; if (!ca || !cb) return false;
  const ra = region[ca.y * W + ca.x], rb = region[cb.y * W + cb.x];
  return ra && ra === rb;
}
