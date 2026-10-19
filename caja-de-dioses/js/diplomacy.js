"use strict";
// ---------- diplomacia, religiones y dinastías ----------
// Cada reino tiene una opinión de los demás. Una parte se recalcula siempre
// (raza, fronteras, fe, alianza, carácter) y otra es memoria de hechos
// (guerras pasadas, conquistas, comercio) que se va olvidando poco a poco.
MODS.religion = { n: 'Religiones', d: 'Los pueblos fundan religiones al construir templos, las difunden y la fe une o enfrenta a los reinos.', on: true };
const RACE_FEUD = { 'elf|orc': -25, 'dwarf|orc': -15, 'elf|dwarf': -6, 'human|orc': -8, 'demon|*': -20, 'undead|*': -20, 'lizard|*': -4 };
function raceFeud(a, b) {
  if (a === b) return 15;
  const k1 = a < b ? a + '|' + b : b + '|' + a;
  return RACE_FEUD[k1] ?? RACE_FEUD[a + '|*'] ?? RACE_FEUD[b + '|*'] ?? -5;
}
function memOf(a, b) { a.mem = a.mem || {}; return (a.mem[b.id] = a.mem[b.id] || {}); }
function bumpOpinion(a, b, v, why) {
  for (const [x, y] of [[a, b], [b, a]]) { const m = memOf(x, y); m[why] = clamp((m[why] || 0) + v, -80, 80); }
}
// opinión de a sobre b con sus motivos
function opinion(a, b) {
  const why = {};
  why[a.race === b.race ? 'Misma raza' : 'Otra raza'] = raceFeud(a.race, b.race);
  if (modOn('religion') && a.religion && b.religion) why[a.religion === b.religion ? 'Misma fe' : 'Otra fe'] = a.religion === b.religion ? 22 : -12;
  if (kingdomsTouch(a, b)) { const ca = cities[a.capital], cb = cities[b.capital]; if (ca && cb && dist2(ca.x, ca.y, cb.x, cb.y) < 60 * 60) why['Fronteras cercanas'] = -10; }
  if (a.allies.has(b.id)) why['Aliados'] = 25;
  if (a.wars.has(b.id)) why['En guerra'] = -55;
  if (a.aggr > .15) why['Carácter belicoso'] = Math.round(-a.aggr * 30);
  else if (a.aggr < -.15) why['Carácter pacífico'] = Math.round(-a.aggr * 20);
  const king = a.king;
  if (king && hasTrait(king, 'agresivo')) why['Soberano agresivo'] = -10;
  if (king && hasTrait(king, 'pacifico')) why['Soberano pacífico'] = 10;
  const m = a.mem && a.mem[b.id];
  if (m) for (const r in m) if (Math.abs(m[r]) >= 1) why[r] = Math.round(m[r]);
  let v = 0; for (const r in why) v += why[r];
  return { v: clamp(Math.round(v), -100, 100), why };
}
function forgetMemories(k) {
  if (!k.mem) return;
  for (const id in k.mem) { const m = k.mem[id]; for (const r in m) { m[r] *= .97; if (Math.abs(m[r]) < .5) delete m[r]; } }
}
function military(k) { let n = 0; for (const u of units) if (u.k === k && u.def.civ && u.age >= 14) n += u.prof === 'soldier' ? 1.5 : .4; return n; }

function diplomacyUpdate(live) {
  for (const k of live) forgetMemories(k);
  const mil = new Map(live.map(k => [k.id, military(k)]));
  for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
    const a = live[i], b = live[j];
    const ca = cities[a.capital], cb = cities[b.capital]; if (!ca || !cb) continue;
    const oa = opinion(a, b).v, ob = opinion(b, a).v, avg = (oa + ob) / 2;
    if (a.wars.has(b.id)) {
      // cansancio de guerra: con los años y si uno va perdiendo
      const yrs = a.warYears[b.id] || 0, ma = mil.get(a.id) || 1, mb = mil.get(b.id) || 1;
      const lopsided = Math.min(ma, mb) / Math.max(ma, mb) < .35;
      const peaceful = Math.max(0, -(a.aggr + b.aggr));
      if (LAWS.guerras.on && yrs > 2.5 && rnd() < .025 * (1 + peaceful * 3) * (lopsided ? 2.5 : 1) * (avg > -45 ? 1.6 : 1)) makePeace(a, b);
      continue;
    }
    if (a.allies.has(b.id)) { if (avg < 5 && rnd() < .2) { a.allies.delete(b.id); b.allies.delete(a.id); addLog(`Se rompe la alianza entre ${el(a)} y ${el(b)}.`, 'war'); } continue; }
    if (LAWS.guerras.on && kingdomsTouch(a, b) && dist2(ca.x, ca.y, cb.x, cb.y) < 85 * 85) {
      const worst = oa < ob ? a : b, wv = Math.min(oa, ob), other = worst === a ? b : a;
      if (wv < -25) {
        const ratio = (mil.get(worst.id) || 1) / Math.max(1, mil.get(other.id) || 1);
        const p = .03 * ((-wv - 25) / 40) * (SP[worst.race].war || 1) * clamp(.6 + ratio * .6, .2, 2.2);
        if (rnd() < p) { declareWar(worst, other); continue; }
      }
    }
    if (modOn('diplomacia') && avg > 40 && rnd() < .04) { a.allies.add(b.id); b.allies.add(a.id); addLog(`Alianza entre ${el(a)} y ${el(b)}.`, 'peace'); }
  }
}

// ---------- religiones ----------
let religions = [];
const RELIG_T = [['Fe de', 0], ['Culto de', 0], ['Iglesia de', 1], ['Orden de', 1], ['Senda de', 1], ['Misterios de', 0]];
const RELIG_S = ['☀', '☾', '✦', '♆', '⚚', '☯', '✠', '❂', '⚘', '♁'];
function foundReligion(k, c) {
  const god = mkName(k.race), t = pick(RELIG_T);
  const r = { id: religions.length + 1, n: t[0] + ' ' + god, s: RELIG_S[religions.length % RELIG_S.length], color: hsl(ri(0, 359), 60, 62), born: year(), by: k.id };
  religions.push(r); k.religion = r.id; k.faith = 10;
  addLog(`En ${c.name} nace una religión: la ${r.n} ${r.s}.`, 'hero');
  return r;
}
const relOf = id => religions[id - 1] || null;
function religionUpdate(live) {
  if (!modOn('religion')) return;
  for (const k of live) {
    if (!k.religion) { const c = cities.find(c => c && c.alive && c.k === k && c.has?.[B.TEMPLE]); if (c) foundReligion(k, c); continue; }
    k.faith = Math.max(0, (k.faith || 0) * .99);
  }
  // misioneros: la fe de un vecino con templos puede convertir a otro reino
  for (const a of live) {
    if (!a.religion) continue;
    for (const b of live) {
      if (a === b || b.religion === a.religion || !kingdomsTouch(a, b) || a.wars.has(b.id)) continue;
      const temples = cities.reduce((s, c) => s + (c && c.alive && c.k === a ? (c.has?.[B.TEMPLE] || 0) : 0), 0);
      const p = .004 * temples * (1 + (a.faith || 0) / 30) / (1 + (b.faith || 0) / 20) * (b.religion ? .5 : 1.5);
      if (rnd() < p) {
        const r = relOf(a.religion);
        b.religion = a.religion; b.faith = 5;
        addLog(`${El(b)} abraza la ${r.n} ${r.s}.`, 'peace');
        bumpOpinion(a, b, 8, 'Conversión');
      }
    }
  }
}

// ---------- dinastías ----------
function crown(k, cand) {
  const prev = k.dynasty;
  k.king = cand; cand.name = cand.name || mkName(k.race); cand.prof = 'ruler'; cand.task = null;
  if (cand.fam && cand.fam !== prev) {
    if (prev && modOn('diplomacia')) addLog(`Cambio de dinastía ${del(k)}: la Casa ${cand.fam} llega al trono con ${displayName(cand)}.`, 'peace');
    k.dynasty = cand.fam;
  } else if (modOn('diplomacia')) addLog(`${displayName(cand)} es coronado soberano ${del(k)}.`, 'peace');
}
function succession(k, members) {
  const dead = k.lastKing;
  const score = u => u.level + (u.hero ? 5 : 0) + (hasTrait(u, 'lider') ? 6 : 0) + (u.fam && u.fam === k.dynasty ? 9 : 0) + (dead && u.parents && u.parents.includes(dead) ? 12 : 0) + Math.min(5, u.age / 10);
  const cand = members.filter(u => u.age >= 16).sort((a, b) => score(b) - score(a))[0] || members[0];
  if (cand) crown(k, cand);
}
