"use strict";
// ---------- edificios especiales y caminos ----------
// bld: 1 casa, 2 centro, 3 obra, 4 ruinas, y a partir de 5 los especiales.
// Mientras una casilla es obra (3), siteT guarda qué se está construyendo.
const B = { HOUSE: 1, CENTER: 2, SITE: 3, RUIN: 4, GRANARY: 5, BARRACKS: 6, TEMPLE: 7, MARKET: 8, DOCKS: 9, TOWER: 10, MILL: 11, LIBRARY: 13 };
const BUILDINGS = {
  [B.GRANARY]:  { n: 'Granero', d: 'Guarda mucha más comida y la conserva en invierno.', cost: { madera: 8 }, pop: 10 },
  [B.DOCKS]:    { n: 'Muelle', d: 'Los pescadores pescan más y el pueblo puede construir barcos.', cost: { madera: 12 }, pop: 8, coast: 1 },
  [B.MILL]:     { n: 'Molino', d: 'Los cultivos rinden un 30 % más.', cost: { madera: 10 }, pop: 12, fields: 5, tech: 'agri' },
  [B.BARRACKS]: { n: 'Cuartel', d: 'Los soldados entrenan el doble de rápido y se curan.', cost: { madera: 10, piedra: 8 }, pop: 16 },
  [B.LIBRARY]:  { n: 'Biblioteca', d: 'El reino investiga un 25 % más rápido.', cost: { piedra: 14 }, pop: 18, tech: 'escritura' },
  [B.TEMPLE]:   { n: 'Templo', d: 'Mejora el ánimo de la ciudad y difunde la fe.', cost: { piedra: 16 }, pop: 20 },
  [B.MARKET]:   { n: 'Mercado', d: 'Produce oro y comercia con los aliados.', cost: { madera: 12, piedra: 6 }, pop: 24, tech: 'comercio' },
  [B.TOWER]:    { n: 'Torre de vigía', d: 'Dispara flechas a los enemigos cercanos.', cost: { piedra: 12 }, pop: 14, war: 1 },
};
const BUILD_ORDER = [B.GRANARY, B.DOCKS, B.MILL, B.BARRACKS, B.LIBRARY, B.TEMPLE, B.MARKET, B.TOWER];
const BLD_NAME = { 1: 'Casa', 2: 'Ayuntamiento', 3: 'Obra', 4: 'Ruinas' };
for (const k in BUILDINGS) BLD_NAME[k] = BUILDINGS[k].n;

const coastal = i => { const x = i % W; return (x > 0 && isWater(tile[i - 1])) || (x < W - 1 && isWater(tile[i + 1])) || (i >= W && isWater(tile[i - W])) || (i < N - W && isWater(tile[i + W])); };
const borderOf = (i, id1) => owner[i - 1] !== id1 || owner[i + 1] !== id1 || owner[i - W] !== id1 || owner[i + W] !== id1;
function canAfford(k, cost) { for (const r in cost) if ((k.res[r] || 0) < cost[r]) return false; return true; }
function pay(k, cost) { for (const r in cost) k.res[r] -= cost[r]; }
const freeLot = (i, id1) => owner[i] === id1 && !bld[i] && !road[i] && TILE[tile[i]].build && tile[i] !== T.FIELD && !ore[i] && !wall[i];

// el constructor decide qué levantar: obras pendientes, casas o un edificio que falte
function chooseBuild(u, c) {
  const k = c.k, id1 = c.id + 1, r = c.radius;
  const site = pickNear(u, c.x, c.y, r + 1, i => owner[i] === id1 && bld[i] === B.SITE, 18);
  if (site) return { x: site[0], y: site[1], t: 0 };
  if (modOn('tecnologia') || true) {
    for (const t of BUILD_ORDER) {
      const b = BUILDINGS[t];
      if ((c.has[t] || 0) >= (t === B.TOWER ? 2 : 1)) continue;
      if (c.pop < b.pop || (b.tech && !k.tech.has(b.tech)) || (b.fields && c.fields < b.fields) || (b.war && !k.wars.size) || (b.coast && !c.coast)) continue;
      if (!canAfford(k, b.cost)) continue;
      const fn = t === B.DOCKS ? (i => freeLot(i, id1) && coastal(i)) : t === B.TOWER ? (i => freeLot(i, id1) && borderOf(i, id1)) : (i => freeLot(i, id1));
      const p = pickNear(u, c.x, c.y, t === B.DOCKS || t === B.TOWER ? r + 1 : r * .7 + 1, fn, 40);
      if (p) return { x: p[0], y: p[1], t };
    }
  }
  if (c.pop + 2 > c.cap || rnd() < .12) {
    const p = pickNear(u, c.x, c.y, r * .85, i => freeLot(i, id1), 24);
    if (p) return { x: p[0], y: p[1], t: B.HOUSE };
  }
  return null;
}
// el constructor llega a la parcela: pone la obra (pagando) o la termina
function buildStep(u, c, i, want, tk) {
  const k = c.k;
  if (bld[i] === B.SITE) {
    const t = siteT[i] || B.HOUSE;
    bld[i] = t; siteT[i] = 0;
    if (cam.z >= 8) sfx('build', i % W, (i / W) | 0, .8, 250);
    if (t === B.TEMPLE || t === B.LIBRARY || t === B.MARKET) addLog(`${c.name} termina su ${BUILDINGS[t].n.toLowerCase()}.`, 'found', c);
    else if (tmul(u, 'build') > 1) { const n = i + pick([1, -1, W, -W]); if (n >= 0 && n < N && freeLot(n, c.id + 1)) { bld[n] = B.SITE; siteT[n] = B.HOUSE; } }
    gainXp(u, .3);
    return false;
  }
  if (bld[i] || owner[i] !== c.id + 1 || !TILE[tile[i]].build) return false;
  const t = want || B.HOUSE;
  if (t === B.HOUSE) {
    const ht = modOn('tecnologia') ? k.house : 0;
    const cost = ht >= 2 ? { piedra: 3 } : ht >= 1 ? { madera: 2 } : {};
    if (!canAfford(k, cost)) return false;
    pay(k, cost);
  } else { const b = BUILDINGS[t]; if (!canAfford(k, b.cost)) return false; pay(k, b.cost); }
  bld[i] = B.SITE; siteT[i] = t; road[i] = 0;
  tk.t = Math.max(20, (t >= 5 ? 120 : 70) / Math.max(.5, tmul(u, 'build')));
  return true; // sigue trabajando en la obra
}

// ---------- caminos ----------
// cada vez que un habitante pisa una casilla nueva de su territorio suma
// tráfico; cuando hay mucho, aparece un camino que luego acelera el paso.
function noteStep(u, i) {
  if (!u.def.civ || !owner[i] || bld[i] || tile[i] === T.FIELD || !TILE[tile[i]].build) return;
  if (traffic[i] < 255) traffic[i]++;
  if (!road[i] && traffic[i] > 26) road[i] = 1;
}
function roadDecay(i) {
  if (traffic[i]) traffic[i] = traffic[i] * .85 | 0;
  if (road[i] && (!owner[i] || bld[i] || !TILE[tile[i]].build || (traffic[i] < 3 && rnd() < .2))) road[i] = 0;
}

// ---------- efectos ----------
function towersFire() {
  for (const c of cities) {
    if (!c || !c.alive || !c.towers || !c.towers.length || !c.k.wars.size) continue;
    for (const i of c.towers) {
      if (bld[i] !== B.TOWER) continue;
      const x = i % W + .5, y = ((i / W) | 0) + .2;
      const e = nearest(x, y, 6.5, o => o.k && c.k.wars.has(o.k.id) && !o.dead);
      if (e) projs.push({ x, y, t: e, src: null, dmg: 6 + c.k.weapon.tier * 1.5, kind: 'arrow', spd: .4, k: c.k });
    }
  }
}
function onAllocWorld() { if (typeof PF !== 'undefined') PF = null; }
