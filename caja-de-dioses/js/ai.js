"use strict";
// ---------- inteligencia de las criaturas ----------
// Cada habitante tiene necesidades (hambre, energía, ánimo) y una profesión.
// Cada cierto tiempo puntúa todas sus decisiones posibles, elige una al azar
// ponderando por la puntuación y la ejecuta como una tarea por fases:
// ir → trabajar → (volver y entregar). El inspector muestra los pesos.

const PROFS = {
  farmer:   { n: 'Campesino', g: '🌾', trait: 'granjero' },
  gatherer: { n: 'Recolector', g: '🧺' },
  lumber:   { n: 'Leñador', g: '🪓', trait: 'fuerte' },
  miner:    { n: 'Minero', g: '⛏', trait: 'minero' },
  builder:  { n: 'Constructor', g: '🔨', trait: 'constructor' },
  fisher:   { n: 'Pescador', g: '🎣' },
  hunter:   { n: 'Cazador', g: '🏹', trait: 'arquero' },
  scholar:  { n: 'Erudito', g: '📜', trait: 'inteligente' },
  soldier:  { n: 'Soldado', g: '⚔', trait: 'valiente' },
  ruler:    { n: 'Soberano', g: '👑' },
  child:    { n: 'Niño', g: '🧸' },
};
const TASKN = {
  eat: 'Comer en el almacén', forage: 'Buscar comida', sleep: 'Dormir en casa', farm: 'Cultivar', gather: 'Recolectar', wood: 'Talar árbol', mine: 'Picar mineral', stone: 'Picar piedra',
  build: 'Construir una casa', fish: 'Pescar', hunt: 'Cazar', study: 'Estudiar', patrol: 'Patrullar', march: 'Marchar a la guerra', social: 'Charlar', love: 'Cortejar', play: 'Jugar',
  wander: 'Pasear', rule: 'Gobernar', settle: 'Fundar una colonia', flee: 'Huir', train: 'Entrenar', pray: 'Rezar', trade: 'Comerciar',
};
const isNight = () => dayLight() < .58;
const TCOST = new Float32Array(32).fill(1);
TCOST[T.FOREST] = 1.5; TCOST[T.JUNGLE] = 1.8; TCOST[T.SWAMP] = 1.7; TCOST[T.HILL] = 1.3; TCOST[T.ROCK] = 1.3; TCOST[T.MOUNT] = 2.4; TCOST[T.SAND] = 1.1; TCOST[T.SNOW] = 1.4; TCOST[T.MESA] = 1.3; TCOST[T.DESERT] = 1.2; TCOST[T.FIELD] = 1.05;

// ---------- búsqueda de caminos (A* con presupuesto) ----------
let PF = null, pathBudget = 0;
function pfInit() { PF = { g: new Float32Array(N), came: new Int32Array(N), seen: new Uint32Array(N), shut: new Uint32Array(N), stamp: 0, hf: new Float32Array(N), hi: new Int32Array(N) }; }
const DX8 = [1, -1, 0, 0, 1, 1, -1, -1], DY8 = [0, 0, 1, -1, 1, -1, 1, -1];
function walk(def, x, y) { return canStand(def, x + .5, y + .5); }
// devuelve: array de casillas (sin la de salida), false si es inalcanzable,
// o null si se agotó el presupuesto de este tick (reintentar luego)
function findPath(u, goal) {
  if (!PF || PF.g.length !== N) pfInit();
  const def = u.def, sx = u.x | 0, sy = u.y | 0, s = sy * W + sx;
  if (s === goal) return [];
  const gx = goal % W, gy = (goal / W) | 0;
  if (!def.fly && !def.mount && region[s] && region[goal] && region[s] !== region[goal]) return false;
  if (pathBudget <= 0) return null;
  const maxN = Math.min(pathBudget, 1600);
  const st = ++PF.stamp, g = PF.g, came = PF.came, seen = PF.seen, shut = PF.shut, hf = PF.hf, hi = PF.hi;
  let hn = 0;
  const push = (f, i) => { let k = hn++; while (k > 0) { const p = (k - 1) >> 1; if (hf[p] <= f) break; hf[k] = hf[p]; hi[k] = hi[p]; k = p; } hf[k] = f; hi[k] = i; };
  const pop = () => { const top = hi[0], f = hf[--hn], i = hi[hn]; let k = 0; for (;;) { let c = 2 * k + 1; if (c >= hn) break; if (c + 1 < hn && hf[c + 1] < hf[c]) c++; if (hf[c] >= f) break; hf[k] = hf[c]; hi[k] = hi[c]; k = c; } hf[k] = f; hi[k] = i; return top; };
  const h = (x, y) => { const dx = Math.abs(x - gx), dy = Math.abs(y - gy); return (dx + dy) + (1.414 - 2) * Math.min(dx, dy); };
  g[s] = 0; seen[s] = st; came[s] = -1; push(h(sx, sy), s);
  let best = s, bestH = h(sx, sy), n = 0, found = false;
  while (hn > 0) {
    const i = pop();
    if (shut[i] === st) continue;
    shut[i] = st;
    if (i === goal) { found = true; break; }
    if (++n > maxN) break;
    const x = i % W, y = (i / W) | 0, gi = g[i];
    for (let k = 0; k < 8; k++) {
      const nx = x + DX8[k], ny = y + DY8[k];
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const j = ny * W + nx;
      if (shut[j] === st) continue;
      if (j !== goal && !walk(def, nx, ny)) continue;
      if (k >= 4 && (!walk(def, nx, y) || !walk(def, x, ny))) continue;
      const ng = gi + (k >= 4 ? 1.414 : 1) * TCOST[tile[j]] * (road[j] ? .55 : 1);
      if (seen[j] === st && ng >= g[j]) continue;
      seen[j] = st; g[j] = ng; came[j] = i;
      const hh = h(nx, ny); push(ng + hh * 1.05, j);
      if (hh < bestH) { bestH = hh; best = j; }
    }
  }
  pathBudget -= n;
  const end = found ? goal : best;
  if (!found && end === s) return n >= maxN ? null : false;
  const path = [];
  for (let i = end; i !== s && i >= 0; i = came[i]) path.push(i);
  path.reverse();
  path.partial = !found;
  return path;
}
// paso en línea recta: 1 llegó, 0 avanza, -1 bloqueado
function stepToward(u, tx, ty, mul = 1) {
  const dx = tx - u.x, dy = ty - u.y, d = Math.hypot(dx, dy);
  if (d < .12) return 1;
  const sp = u.def.spd * tmul(u, 'spd') * .095 * mul * (u.traits.length && hasTrait(u, 'licantropo') && isNight() ? 1.4 : 1) * (road[(u.y | 0) * W + (u.x | 0)] ? 1.35 : 1) * (u.def.civ ? kmul(u.k, 'speed') : 1) * (u.def.civ && u.food <= 0 ? .6 : 1);
  const st = Math.min(sp, d);
  if (Math.abs(dx) > .02) u.face = dx < 0 ? -1 : 1;
  const nx = u.x + dx / d * st, ny = u.y + dy / d * st, oi = (u.y | 0) * W + (u.x | 0);
  if (canStand(u.def, nx, ny)) { u.x = nx; u.y = ny; }
  else if (canStand(u.def, nx, u.y)) u.x = nx;
  else if (canStand(u.def, u.x, ny)) u.y = ny;
  else return -1;
  const ni = (u.y | 0) * W + (u.x | 0); if (ni !== oi) noteStep(u, ni);
  return d - st < .12 ? 1 : 0;
}
// camina hacia (tx,ty) usando caminos: 1 llegó, 0 en camino, -1 imposible
function moveTo(u, tx, ty, mul = 1) {
  const def = u.def;
  if (def.fly || def.swim || (def.waterOnly && !def.boat)) { const r = stepToward(u, tx, ty, mul); return r === -1 ? (u.stuck = (u.stuck || 0) + 1) > 20 ? -1 : 0 : r; }
  const goal = (ty | 0) * W + (tx | 0);
  const near = dist2(u.x, u.y, tx, ty);
  if (near < 9 && !u.path) {
    const r = stepToward(u, tx, ty, mul);
    if (r !== -1) return r;
  }
  if (u.pgoal !== goal || (!u.path && u.pretry <= tickN)) {
    const p = findPath(u, goal);
    if (p === null) { u.pgoal = -1; u.pretry = tickN + 3; return 0; }
    if (p === false) { u.path = null; u.pgoal = goal; return -1; }
    u.path = p; u.pi = 0; u.pgoal = goal;
  }
  if (u.path && u.pi < u.path.length) {
    const n = u.path[u.pi], nx = n % W + .5, ny = ((n / W) | 0) + .5;
    const r = stepToward(u, nx, ny, mul);
    if (r === 1) u.pi++;
    else if (r === -1) { u.path = null; u.pgoal = -1; u.pretry = tickN + 8; if ((u.stuck = (u.stuck || 0) + 1) > 6) return -1; }
    if (u.path && u.pi >= u.path.length) { const partial = u.path.partial; u.path = null; if (partial) { u.pgoal = -1; u.pretry = tickN; } }
    return 0;
  }
  const r = stepToward(u, tx, ty, mul);
  if (r === -1) return (u.stuck = (u.stuck || 0) + 1) > 10 ? -1 : 0;
  return r;
}
// casilla pisable en o junto a (x,y)
function standNear(def, x, y) {
  if (walk(def, x, y)) return [x, y];
  for (let k = 0; k < 8; k++) { const nx = x + DX8[k], ny = y + DY8[k]; if (nx >= 0 && ny >= 0 && nx < W && ny < H && walk(def, nx, ny)) return [nx, ny]; }
  return null;
}

// ---------- tareas ----------
function setTask(u, k, x, y, dur, extra = {}) {
  const sp = standNear(u.def, x, y);
  if (!sp) return false;
  u.task = { k, n: TASKN[k] || k, x: sp[0], y: sp[1], tx: x, ty: y, dur, ph: 'go', t: 0, born: tickN, ...extra };
  u.path = null; u.pgoal = -1; u.stuck = 0; u.asleep = false;
  return true;
}
function endTask(u) { u.task = null; u.asleep = false; u.think = Math.min(u.think, ri(1, 6)); }
function homeCity(u) { const c = cities[u.city]; return c && c.alive ? c : null; }
function runTask(u) {
  const tk = u.task;
  if (!tk) return;
  if (tk.ph === 'go') {
    const mul = tk.k === 'flee' ? 1.3 : tk.k === 'march' ? 1.05 : 1;
    const r = moveTo(u, tk.x + .5, tk.y + .5, mul);
    if (r === 1) { tk.ph = 'work'; tk.t = tk.dur; if (tk.k === 'sleep') u.asleep = true; }
    else if (r === -1 || tickN - tk.born > 900) { if (tk.k === 'settle') settleHere(u); endTask(u); }
    return;
  }
  if (tk.ph === 'work') {
    const c = homeCity(u);
    if (tk.k === 'sleep') {
      u.energy = Math.min(100, u.energy + 1.6);
      if (u.energy >= 100 || (u.food < 20 && u.energy > 40)) { u.mood = Math.min(100, u.mood + 6); endTask(u); }
      else if (tickN % 40 === (u.id % 40)) parts.push({ x: u.x + .2, y: u.y - .8, vx: .01, vy: -.02, l: 30, c: [220, 230, 255], s: .9 });
      return;
    }
    if (tk.k === 'social' || tk.k === 'love') {
      const o = unitById(tk.who);
      if (!o || o.dead || dist2(u.x, u.y, o.x, o.y) > 6) { endTask(u); return; }
      u.face = o.x < u.x ? -1 : 1;
      if (tk.t === tk.dur) parts.push({ x: u.x, y: u.y - 1.3, vx: 0, vy: -.01, l: 40, c: tk.k === 'love' ? [255, 120, 160] : [255, 255, 255], s: 1.3 });
    }
    // animación de trabajo: pequeñas partículas
    if (tk.k === 'wood' || tk.k === 'mine' || tk.k === 'stone' || tk.k === 'build') {
      if ((tickN + u.id) % 14 === 0) { const c2 = tk.k === 'wood' ? [150, 104, 60] : tk.k === 'build' ? [220, 190, 120] : [170, 166, 160]; parts.push({ x: tk.tx + .5, y: tk.ty + .4, vx: (rnd() - .5) * .06, vy: -.05, l: 14, c: c2, s: .8, g: .008 }); }
      u.face = tk.tx + .5 < u.x ? -1 : 1;
    }
    if (--tk.t > 0) return;
    finishWork(u, tk, c);
    return;
  }
  if (tk.ph === 'back') {
    const c = homeCity(u);
    if (!c) { u.carry = null; endTask(u); return; }
    const r = moveTo(u, c.x + .5, c.y + .5);
    if (r !== 0) { deliver(u, c); endTask(u); }
  }
}
function deliver(u, c) {
  const cr = u.carry; if (!cr) return;
  if (cr.r === 'comida') c.food += cr.n;
  else if (c.k) c.k.res[cr.r] = (c.k.res[cr.r] || 0) + cr.n;
  u.carry = null;
}
function workMul(u) { return workOf(u) * (.7 + u.mood / 100 * .6); }
function finishWork(u, tk, c) {
  const k = c ? c.k : null, i = tk.ty * W + tk.tx;
  const wm = workMul(u);
  switch (tk.k) {
    case 'eat': {
      if (c && c.food >= 1) { c.food -= 1; u.food = 100; u.mood = Math.min(100, u.mood + 4); }
      else u.food = Math.min(100, u.food + 20);
      break;
    }
    case 'forage': u.food = Math.min(100, u.food + 35 + (TILE[tile[i]].food || 0) * 30); break;
    case 'farm':
      if (!c || owner[i] !== c.id + 1) break;
      if (tile[i] !== T.FIELD) { if (TILE[tile[i]].farm) tile[i] = T.FIELD; }
      else c.food += 2.2 * wm * tmul(u, 'farm') * kmul(k, 'food') * (c.has[B.MILL] ? 1.3 : 1) * (season() === 3 ? .35 : season() === 1 ? 1.25 : 1) * (weather.rain > .3 ? 1.15 : 1);
      gainXp(u, .15);
      break;
    case 'gather':
      if (c) c.food += (.6 + (TILE[tile[i]].food || 0)) * 1.4 * wm * kmul(k, 'food');
      if (TILE[tile[i]].wood && k) k.res.madera += .4 * wm;
      break;
    case 'fish': if (c) c.food += 2.6 * wm * kmul(k, 'food') * (c.has[B.DOCKS] ? 1.6 : 1); gainXp(u, .1); break;
    case 'wood':
      if (TILE[tile[i]].wood) { u.carry = { r: 'madera', n: 9 * wm }; if (rnd() < .18) tile[i] = T.GRASS; tk.ph = 'back'; return; }
      break;
    case 'stone':
      if (TILE[tile[i]].stone) { u.carry = { r: 'piedra', n: 8 * wm * tmul(u, 'mine') }; tk.ph = 'back'; return; }
      break;
    case 'mine':
      if (ore[i] && k) {
        const m = MAT[ore[i]], amt = workOf(u, 'mine') * (u.def.bonus?.mine || 1) * 3;
        u.carry = { r: m.id, n: amt };
        if (!k.found[m.id]) { k.found[m.id] = 1; if (modOn('tecnologia')) addLog(`${El(k)} descubre ${m.n.toLowerCase()} y empieza a extraerlo.`, 'tech', { x: tk.tx, y: tk.ty }); }
        oreAmt[i] = Math.max(0, oreAmt[i] - Math.max(1, Math.round(amt)));
        if (!oreAmt[i]) ore[i] = 0;
        gainXp(u, .2); tk.ph = 'back'; return;
      }
      break;
    case 'build': if (c && buildStep(u, c, i, tk.want, tk)) return; break;
    case 'study': if (k) k.rp += 1.2 * tmul(u, 'research') * (u.def.bonus?.research || 1) * k.mul.research; gainXp(u, .2); break;
    case 'train': gainXp(u, c && c.has[B.BARRACKS] ? 1.1 : .5); if (c && c.has[B.BARRACKS]) u.hp = Math.min(u.maxHp, u.hp + 8); break;
    case 'social': case 'love': {
      const o = unitById(tk.who);
      if (o && !o.dead) {
        befriend(u, o, tk.k === 'love' ? 18 : 10);
        u.mood = Math.min(100, u.mood + 8); o.mood = Math.min(100, o.mood + 6);
        if (tk.k === 'love' && canCouple(u, o) && (u.friends[o.id] || 0) >= 15) marry(u, o);
      }
      break;
    }
    case 'play': u.mood = Math.min(100, u.mood + 6); break;
    case 'rule': gainXp(u, .3); if (k) for (const c2 of cities) if (c2 && c2.alive && c2.k === k) c2.mood = Math.min(100, (c2.mood ?? 60) + .3); break;
    case 'settle': settleHere(u); break;
    case 'pray': u.mood = Math.min(100, u.mood + 10); if (u.k) u.k.faith = (u.k.faith || 0) + .5; break;
  }
  endTask(u);
}
function settleHere(u) {
  if (!u.settler) return;
  const follow = u.settler.follow;
  u.settler = null;
  if (!follow && foundCity(u)) return;
  const near = cities.find(cc => cc && cc.alive && cc.k === u.k && dist2(cc.x, cc.y, u.x, u.y) < 100);
  if (near) u.city = near.id; else if (!u.city || u.city < 0) foundCity(u);
}

// ---------- relaciones ----------
function befriend(a, b, n) {
  a.friends[b.id] = Math.min(100, (a.friends[b.id] || 0) + n);
  b.friends[a.id] = Math.min(100, (b.friends[a.id] || 0) + n);
  for (const o of [a, b]) { const ks = Object.keys(o.friends); if (ks.length > 6) { ks.sort((x, y) => o.friends[x] - o.friends[y]); delete o.friends[ks[0]]; } }
}
const adult = u => u.def.civ && u.age >= 16;
function canCouple(a, b) { return a !== b && adult(a) && adult(b) && !a.partner && !b.partner && a.sex !== b.sex && a.type === b.type && !b.dead && !(a.parents && a.parents.includes(b.id)) && !(b.parents && b.parents.includes(a.id)) && !(a.parents && b.parents && a.parents[0] && a.parents[0] === b.parents[0]); }
function marry(a, b) {
  a.partner = b.id; b.partner = a.id;
  a.mood = Math.min(100, a.mood + 20); b.mood = Math.min(100, b.mood + 20);
  for (let k = 0; k < 6; k++) parts.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 1, vx: (rnd() - .5) * .06, vy: -.03, l: 40, c: [255, 120, 170], s: 1.1 });
  if (a.hero || b.hero || (a.k && (a.k.king === a || a.k.king === b))) addLog(`${displayName(a)} y ${displayName(b)} se casan${a.k ? ' en ' + (cities[a.city]?.name || a.k.name) : ''}.`, 'peace', a);
}
const UMAP = new Map();
function unitById(id) { if (!id) return null; const u = UMAP.get(id); return u && !u.dead ? u : null; }

// ---------- decisiones ----------
// score(u, cx) → puntuación (0 = imposible); start(u, cx) → true si arrancó
const DECISIONS = [
  { id: 'eat', n: 'Comer', score: (u, c) => u.food < 60 && c && c.food >= 1 && sameLand(u, c) ? (60 - u.food) * 2.1 : 0,
    start: (u, c) => setTask(u, 'eat', c.x, c.y, 18) },
  { id: 'forage', n: 'Buscar comida', score: (u, c) => u.food < 50 && (!c || c.food < 1 || !sameLand(u, c)) ? (50 - u.food) * 1.5 + 8 : 0,
    start: u => { const p = pickNear(u, u.x, u.y, 7, i => (TILE[tile[i]].food || 0) >= .25 && !bld[i], 20); return p && setTask(u, 'forage', p[0], p[1], 30); } },
  { id: 'sleep', n: 'Dormir', score: u => u.energy < 45 ? (50 - u.energy) * 2.2 * (isNight() ? 1.4 : 1) : isNight() && u.energy < 70 ? (70 - u.energy) * .9 : 0,
    start: (u, c) => { const h = homeOf(u, c); if (h) return setTask(u, 'sleep', h % W, (h / W) | 0, 9999); return setTask(u, 'sleep', u.x | 0, u.y | 0, 9999); } },
  { id: 'work', n: 'Trabajar', score: (u, c) => !c || u.age < 12 || u.prof === 'child' ? 0 : 46 * Math.min(1.6, tmul(u, 'work')) * (.6 + u.energy / 250) * (u.prof === 'soldier' && u.k?.wars.size ? 1.8 : 1),
    start: (u, c) => startWork(u, c) },
  { id: 'social', n: 'Charlar', score: (u, c) => !c ? 0 : (9 + Math.max(0, 62 - u.mood) * .5 + (hasTrait(u, 'lider') ? 6 : 0)) * (u.traits.length ? tmul(u, 'social') : 1),
    start: u => { const o = nearest(u.x, u.y, 7, v => v !== u && v.def.civ && v.city === u.city && !v.asleep && !v.task?.who); return o && setTask(u, 'social', o.x | 0, o.y | 0, 30, { who: o.id }); } },
  { id: 'love', n: 'Buscar pareja', score: u => adult(u) && !u.partner && u.age < SP[u.type].age[0] * .8 && !hasTrait(u, 'esteril') ? 30 * (hasTrait(u, 'carismatico') ? 1.5 : 1) : 0,
    start: u => { const o = nearest(u.x, u.y, 10, v => canCouple(u, v) && v.city === u.city && !v.asleep); return o && setTask(u, 'love', o.x | 0, o.y | 0, 36, { who: o.id }); } },
  { id: 'play', n: 'Jugar', score: u => u.def.civ && u.age < 12 ? 34 : 0,
    start: (u, c) => { const cx = c ? c.x : u.x, cy = c ? c.y : u.y; const p = pickTile(cx, cy, 4, i => canStand(u.def, i % W + .5, ((i / W) | 0) + .5)); return p && setTask(u, 'play', p[0], p[1], 40); } },
  { id: 'pray', n: 'Rezar', score: (u, c) => modOn('religion') && c && u.k?.religion ? 6 + Math.max(0, 50 - u.mood) * .3 + (hasTrait(u, 'devoto') ? 18 : 0) : 0,
    start: (u, c) => { const ti = c.temple >= 0 ? c.temple : c.y * W + c.x; return setTask(u, 'pray', ti % W, (ti / W) | 0, 40); } },
  { id: 'wander', n: 'Pasear', score: () => 5,
    start: (u, c) => { const cx = c ? c.x : u.x, cy = c ? c.y : u.y, r = c ? Math.max(2, c.radius * .8) : 6; const p = pickTile(cx, cy, r, i => canStand(u.def, i % W + .5, ((i / W) | 0) + .5)); return p && setTask(u, 'wander', p[0], p[1], ri(10, 40)); } },
];
function sameLand(u, c) { const a = regAt(u.x, u.y), b = region[c.y * W + c.x]; return !a || !b || a === b; }
function homeOf(u, c) {
  if (u.home >= 0 && bld[u.home] === 1 && c && owner[u.home] === c.id + 1) return u.home;
  if (!c) return -1;
  const p = pickTile(c.x, c.y, c.radius + 1, i => bld[i] === 1 && owner[i] === c.id + 1, 24);
  u.home = p ? p[1] * W + p[0] : (c.y * W + c.x);
  return u.home;
}
// como pickTile, pero de los candidatos válidos se queda con el más cercano al habitante
function pickNear(u, cx, cy, r, fn, tries = 26) {
  let best = null, bd = 1e9;
  for (let a = 0; a < tries; a++) {
    const x = (cx + (rnd() * 2 - 1) * r) | 0, y = (cy + (rnd() * 2 - 1) * r) | 0;
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const i = y * W + x; if (!fn(i)) continue;
    const d = dist2(u.x, u.y, x, y); if (d < bd) { bd = d; best = [x, y]; }
  }
  return best;
}
// arranca la tarea de su profesión
function startWork(u, c) {
  const k = u.k, r = c.radius, id1 = c.id + 1;
  switch (u.prof) {
    case 'farmer': { const p = pickNear(u, c.x, c.y, r, i => owner[i] === id1 && (tile[i] === T.FIELD || TILE[tile[i]].farm) && !bld[i] && !ore[i], 22); if (p) return setTask(u, 'farm', p[0], p[1], 34); break; }
    case 'lumber': { const p = pickNear(u, c.x, c.y, r + 5, i => TILE[tile[i]].wood && (!owner[i] || owner[i] === id1), 24); if (p) return setTask(u, 'wood', p[0], p[1], 40); break; }
    case 'miner': {
      if (c.ores.length) { let i = pick(c.ores), bd = dist2(u.x, u.y, i % W, (i / W) | 0); for (let k = 0; k < 4; k++) { const j = pick(c.ores), d = dist2(u.x, u.y, j % W, (j / W) | 0); if (d < bd) { bd = d; i = j; } } if (ore[i]) return setTask(u, 'mine', i % W, (i / W) | 0, 50); }
      const p = pickNear(u, c.x, c.y, r + 5, i => TILE[tile[i]].stone && !ore[i] && (!owner[i] || owner[i] === id1), 24); if (p) return setTask(u, 'stone', p[0], p[1], 46);
      break;
    }
    case 'builder': {
      const plan = chooseBuild(u, c);
      if (plan) return setTask(u, 'build', plan.x, plan.y, 26, { want: plan.t, n: plan.t >= 5 ? 'Construir: ' + BUILDINGS[plan.t].n.toLowerCase() : plan.t === 0 ? 'Terminar una obra' : TASKN.build });
      break;
    }
    case 'fisher': { const p = pickNear(u, c.x, c.y, r + 4, i => isWater(tile[i]) && nextToOwned(i, id1), 30); if (p) return setTask(u, 'fish', p[0], p[1], 44); break; }
    case 'hunter': {
      const prey = nearest(c.x, c.y, r + 12, o => o.def.passive || (o.def.hunter && !o.def.civ));
      if (prey) { u.target = prey; u.hunting = true; u.task = { k: 'hunt', n: TASKN.hunt, ph: 'hunt', x: prey.x | 0, y: prey.y | 0, born: tickN }; return true; }
      break;
    }
    case 'scholar': return setTask(u, 'study', c.x, c.y, 60);
    case 'ruler': { const p = pickTile(c.x, c.y, 3, i => owner[i] === id1); if (p) return setTask(u, 'rule', p[0], p[1], 50); break; }
    case 'soldier': {
      if (k && k.wars.size) {
        const tgt = enemyCityFor(k, u);
        if (tgt) {
          if (tgt.reach && dist2(u.x, u.y, tgt.x, tgt.y) < 9) { tryCapture(u, tgt); if (u.target) return true; }
          // se reúnen con su escuadra antes de marchar
          const ox = (u.id % 5) - 2, oy = ((u.id / 5 | 0) % 5) - 2;
          return setTask(u, 'march', clamp(tgt.x + ox, 0, W - 1), clamp(tgt.y + oy, 0, H - 1), 6);
        }
      }
      if (rnd() < .35) { const bi = c.barracks >= 0 ? c.barracks : c.y * W + c.x; return setTask(u, 'train', bi % W, (bi / W) | 0, 40); }
      const p = pickTile(c.x, c.y, r + 1, i => owner[i] === id1 && (owner[i - 1] !== id1 || owner[i + 1] !== id1 || owner[i - W] !== id1 || owner[i + W] !== id1), 30);
      if (p) return setTask(u, 'patrol', p[0], p[1], 30);
      break;
    }
  }
  // sin tarea de su oficio: recolecta
  const p = pickNear(u, c.x, c.y, r + 2, i => (TILE[tile[i]].food || 0) >= .25 && !bld[i] && (!owner[i] || owner[i] === id1), 20);
  return p && setTask(u, 'gather', p[0], p[1], 32);
}
function nextToOwned(i, id1) { const x = i % W; return (x > 0 && owner[i - 1] === id1) || (x < W - 1 && owner[i + 1] === id1) || (i >= W && owner[i - W] === id1) || (i < N - W && owner[i + W] === id1); }

// peligro cercano: huir o luchar
function danger(u) {
  const def = u.def;
  const sight = def.civ ? (u.prof === 'soldier' ? 9 : 4.5) : def.hostile ? 9 : def.hunter ? 7 : 4;
  if (!def.hostile && !def.hunter && !(u.mad > 0) && !(u.k && u.k.wars.size) && !threatNear(u.x, u.y, sight)) return false;
  const e = nearest(u.x, u.y, sight, o => isEnemy(u, o) || isEnemy(o, u));
  if (!e) return false;
  const hpR = u.hp / u.maxHp;
  const weak = u.age < 12 || hasTrait(u, 'cobarde') || def.atk <= 0 || hpR < .3 || (u.prof !== 'soldier' && def.civ && (e.def.size || 1) > 1.5);
  const close = dist2(u.x, u.y, e.x, e.y) < (u.prof === 'soldier' ? 81 : 9);
  if (weak) {
    const fx = clamp(u.x + (u.x - e.x) * 3, 0, W - 1), fy = clamp(u.y + (u.y - e.y) * 3, 0, H - 1);
    if (!u.task || u.task.k !== 'flee') { setTask(u, 'flee', fx | 0, fy | 0, 4) || (u.task = null); }
    u.dec = [{ id: 'flee', n: 'Huir', s: 95 }]; return true;
  }
  if (isEnemy(u, e) && (close || def.hostile || def.hunter)) { u.target = e; u.task = null; u.dec = [{ id: 'fight', n: 'Luchar', s: 90 }]; return true; }
  return false;
}

function think(u) {
  const def = u.def;
  u.think = ri(14, 30);
  if (!def.civ) { thinkAnimal(u); return; }
  if (u.age > 14 && rnd() < .01) gainXp(u, .5);
  if (u.target && !u.target.dead && !u.hunting) return;
  if (danger(u)) return;
  if (u.settler) {
    if (u.food < 30 && (!u.task || u.task.k !== 'forage')) { const p = pickTile(u.x, u.y, 6, i => (TILE[tile[i]].food || 0) >= .25 && !bld[i], 20); if (p && setTask(u, 'forage', p[0], p[1], 20)) return; }
    if (u.task && u.task.k === 'forage') return;
    if (!u.task || u.task.k !== 'settle') setTask(u, 'settle', u.settler.x, u.settler.y, 4) || settleHere(u);
    if (++u.settler.t > 60) settleHere(u);
    return;
  }
  const c = homeCity(u);
  if (!c) {
    u.city = -1;
    if (u.k && !u.k.alive) u.k = null;
    const i = (u.y | 0) * W + (u.x | 0);
    if (u.age > 12 && !owner[i] && TILE[tile[i]].build && !nearCity(u.x, u.y, 10) && rnd() < .3) { foundCity(u); return; }
    const jc = cities.find(cc => cc && cc.alive && (cc.k === u.k || (!u.k && cc.k.race === u.type)) && dist2(cc.x, cc.y, u.x, u.y) < 600 && region[cc.y * W + cc.x] === regAt(u.x, u.y));
    if (jc) { u.city = jc.id; u.k = jc.k; return; }
  }
  // una tarea en marcha solo se interrumpe por hambre o sueño extremos
  if (u.task && tickN - u.task.born < 700) {
    const urgent = (u.food < 25 && u.task.k !== 'eat' && u.task.k !== 'forage') || (u.energy < 6 && u.task.k !== 'sleep');
    if (!urgent) return;
  }
  const scores = [];
  let tot = 0;
  for (const d of DECISIONS) {
    let s = d.score(u, c);
    if (s > 0) { s = s * (.85 + rnd() * .3); scores.push({ id: d.id, n: d.n, s, d }); tot += s * s; }
  }
  scores.sort((a, b) => b.s - a.s);
  u.dec = scores.map(x => ({ id: x.id, n: x.n, s: Math.round(x.s) }));
  // elige ponderando por el cuadrado de la puntuación
  let roll = rnd() * tot;
  const order = [];
  for (const x of scores) { roll -= x.s * x.s; if (roll <= 0 && !order.length) order.push(x); }
  for (const x of scores) if (!order.includes(x)) order.push(x);
  for (const x of order) if (x.d.start(u, c)) { u.decPick = x.id; return; }
  u.decPick = null;
}

function thinkAnimal(u) {
  const def = u.def;
  if (danger(u)) return;
  animalBreed(u);
  if (ANIMAL_HOOKS[u.type]) { if (ANIMAL_HOOKS[u.type](u)) return; }
  if (u.type === 'ghost' && u.life > YEAR * 3) { kill(u, null, 'se desvanece'); return; }
  if (u.type === 'ghost' && u.k) { const tgt = enemyCityFor(u.k, u); if (tgt) { u.tx = tgt.x + .5; u.ty = tgt.y + .5; return; } }
  if (u.tx === null) wander(u, u.x, u.y, def.hostile ? 10 : 6);
}
const ANIMAL_HOOKS = {};

// profesiones de una ciudad: reparte el trabajo según lo que falta
function assignJobs(c, members) {
  const k = c.k, n = members.length; if (!n) return;
  const war = k.wars.size > 0;
  const want = {};
  const foodNeed = c.food < c.pop * 1.5 ? 1.5 : c.food > c.pop * 4 ? .6 : 1;
  want.soldier = war ? Math.ceil(n * (.28 + (SP[k.race].war ? .12 : 0) + Math.max(0, k.aggr || 0) * .15)) : n >= 8 ? Math.max(1, Math.round(n * .08)) : 0;
  want.farmer = SP[k.race].noFood ? 0 : Math.max(1, Math.round(n * .26 * foodNeed));
  want.builder = c.pop + 3 > c.cap ? Math.max(2, Math.round(n * .2)) : n > 5 ? 1 : 0;
  const woodNeed = 40 + c.pop * 2 + (k.reserve?.madera || 0);
  want.lumber = k.res.madera < woodNeed ? Math.max(2, Math.round(n * .16)) : n > 6 ? 1 : 0;
  want.miner = c.ores.length ? Math.max(1, Math.round(n * .14)) : k.res.piedra < 50 + c.pop * 2 && n > 6 ? 1 : 0;
  want.fisher = c.coast && !SP[k.race].noFood ? Math.max(1, Math.round(n * .1 * foodNeed)) : 0;
  want.hunter = n > 5 && !SP[k.race].noFood ? 1 : 0;
  want.scholar = modOn('tecnologia') && n > 7 ? Math.max(1, Math.round(n * .08)) : 0;
  const have = {};
  for (const u of members) if (u.prof && u.prof !== 'gatherer') have[u.prof] = (have[u.prof] || 0) + 1;
  // libera a los que sobran
  for (const u of members) {
    if (u.prof === 'ruler' || u.prof === 'gatherer' || !u.prof) continue;
    if ((have[u.prof] || 0) > (want[u.prof] || 0) && !(u.prof === 'soldier' && u.task?.k === 'march')) { have[u.prof]--; u.prof = 'gatherer'; u.task = null; }
  }
  // asigna a los libres
  const free = members.filter(u => !u.prof || u.prof === 'gatherer');
  for (const p of ['soldier', 'farmer', 'builder', 'lumber', 'miner', 'fisher', 'scholar', 'hunter']) {
    while ((have[p] || 0) < (want[p] || 0) && free.length) {
      const fit = PROFS[p].trait;
      let idx = fit ? free.findIndex(u => hasTrait(u, fit)) : -1;
      if (p === 'soldier') { const j = free.findIndex(u => hasTrait(u, 'fuerte') || hasTrait(u, 'valiente') || hasTrait(u, 'agresivo')); if (j >= 0) idx = j; else { const j2 = free.findIndex(u => !hasTrait(u, 'cobarde')); if (j2 >= 0) idx = j2; } }
      if (idx < 0) idx = 0;
      const u = free.splice(idx, 1)[0];
      u.prof = p; u.task = null; have[p] = (have[p] || 0) + 1;
    }
  }
  for (const u of free) u.prof = 'gatherer';
  for (const u of members) u.army = u.prof === 'soldier';
}
