"use strict";
// ---------- inspeccionar el mundo: seres, barcos, edificios y ciudades ----------
const CITY_LV = [[0, 'Aldea'], [15, 'Pueblo'], [35, 'Villa'], [60, 'Ciudad'], [90, 'Gran ciudad'], [120, 'Metrópolis']];
function cityLevel(c) { let n = 0; for (let k = 0; k < CITY_LV.length; k++) if (c.pop >= CITY_LV[k][0]) n = k; return { lv: n + 1, n: CITY_LV[n][1] }; }
// el nivel de un edificio sigue a la arquitectura de su reino (tiendas → rascacielos)
function bldLevel(i) {
  const c = owner[i] ? cities[owner[i] - 1] : null, k = c && c.alive ? c.k : null;
  const ht = k && modOn('tecnologia') ? k.house : 0;
  return { lv: ht + 1, style: HOUSES[ht][0], c, k };
}
const MISSION = { settle: 'Lleva colonos a una tierra nueva', invade: 'Lleva soldados a la guerra', trade: 'Comercia con otra ciudad', return: 'Vuelve a su puerto' };
let selectedBld = -1;
function inspectAt(x, y) {
  rebuildGrid();
  // radio de toque según el zoom, para que sea fácil acertar desde lejos
  const r = clamp(16 / cam.z, 1.2, 4);
  const xi = x | 0, yi = y | 0;
  if (xi < 0 || yi < 0 || xi >= W || yi >= H) return;
  const i = yi * W + xi;
  // primero lo que está justo debajo del dedo: un barco, una persona o un edificio
  const boat = nearest(x, y, r * 1.3, o => !!o.def.boat);
  if (boat) { select(boat); return; }
  const close = nearest(x, y, .65, () => true);
  if (close) { select(close); return; }
  if (bld[i] && bld[i] !== B.CENTER) { selectBld(i); return; }
  const u = nearest(x, y, r, () => true);
  if (u) { select(u); return; }
  if (owner[i]) { const c = cities[owner[i] - 1]; if (c && c.alive) { selectCity(c); return; } }
  toast(`${TILE[tile[i]]?.n || 'Nada'}${ore[i] ? ' con ' + MAT[ore[i]].n.toLowerCase() : ''} · aquí no hay nadie`);
}
function selectBld(i) { selected = null; selectedCity = null; selectedBld = i; pingAt(i % W + .5, ((i / W) | 0) + .5); openSide('ins'); }
function selectCity(c) { selected = null; selectedBld = -1; selectedCity = c; pingAt(c.x + .5, c.y + .5); openSide('ins'); }
function goTo(x, y) { if (cam.z < 9) cam.z = 12; cam.x = x + .5 - VW / cam.z / 2; cam.y = y + .5 - VH / cam.z / 2; clampCam(); followSel = null; }

function boatPanel(u) {
  const m = u.mission || {}, c = cities[u.city], k = u.k;
  const dest = m.kind === 'trade' && cities[m.to] ? cities[m.to].name : m.tname || null;
  const pax = u.cargo || [];
  const crew = pax.slice(0, 8).map(p => `<span class="chip">${esc(displayName(p))}${p.prof === 'soldier' ? ' ⚔' : ''}</span>`).join('');
  return `<div class="ins"><div class="khead">${k ? embCached(k, 'emb big') : ''}<h3>Barco ${k ? esc(del(k)) : ''}</h3></div>
    <div class="sub">${c ? 'Puerto de ' + esc(c.name) : 'Sin puerto'}</div>
    <h4>Misión</h4><div class="next">${MISSION[m.kind] || 'Navegando'}${dest ? ` <span class="muted">· rumbo a ${esc(dest)}</span>` : ''}</div>
    <dl><dt>Pasajeros</dt><dd>${pax.length}</dd><dt>Vida</dt><dd>${Math.ceil(u.hp)} / ${Math.ceil(u.maxHp)}</dd><dt>Navegando</dt><dd>${Math.round((tickN - (m.born || tickN)) / YEAR * 10) / 10} años</dd></dl>
    ${crew ? `<h4>A bordo</h4><div class="chips">${crew}${pax.length > 8 ? `<span class="chip">+${pax.length - 8}</span>` : ''}</div>` : ''}
    <div class="acts"><button data-a="follow">${followSel === u ? 'Dejar de seguir' : 'Seguir con la cámara'}</button>${c ? '<button data-cityof="1">Ver su ciudad</button>' : ''}</div></div>`;
}
function buildingPanel(i) {
  const b = bld[i], x = i % W, y = (i / W) | 0, L = bldLevel(i), c = L.c, k = L.k;
  if (b === B.RUIN || !c) return `<div class="ins"><h3>Ruinas</h3><div class="sub">Restos de un edificio abandonado o destruido.</div></div>`;
  const name = b === B.HOUSE ? HOUSES[L.lv - 1][0].replace(/s$/, '').replace(/^Tiendas de piel$/, 'Tienda de piel') : b === B.SITE ? 'Obra' : BLD_NAME[b];
  let extra = '';
  if (b === B.HOUSE) {
    const live = units.filter(u => u.home === i && u.city === c.id && !u.dead);
    extra = `<h4>Viven aquí</h4>${live.length ? '<div class="chips">' + live.slice(0, 12).map(u => `<button class="chip ulink2" data-u="${u.id}">${esc(displayName(u))}${u.age < 12 ? ' 🧸' : ''}</button>`).join('') + '</div>' : '<p class="empty">Nadie ha dormido aquí todavía.</p>'}`;
  } else if (b === B.SITE) {
    const t = siteT[i] || B.HOUSE;
    extra = `<div class="next">Se está construyendo: <b>${esc(t >= 5 ? BUILDINGS[t].n : 'una casa')}</b></div>`;
  } else if (b === B.DOCKS) {
    const boats = units.filter(o => o.def.boat && o.city === c.id && !o.dead);
    extra = `<h4>Barcos</h4>${boats.length ? boats.map(o => `<button class="next blink" data-u="${o.id}">⛵ ${MISSION[o.mission?.kind] || 'Navegando'}${o.cargo?.length ? ` · ${o.cargo.length} a bordo` : ''}</button>`).join('') : '<p class="empty">Ningún barco en el mar ahora. Los botan para colonizar islas, invadir o comerciar (con mercado).</p>'}`;
  } else if (b === B.TOWER) extra = `<p class="empty">${c.k.wars.size ? 'En guerra: dispara a los enemigos que se acercan.' : 'En paz: vigila la frontera.'}</p>`;
  else if (b === B.TEMPLE && c.k.religion) { const r = relOf(c.k.religion); extra = `<p class="empty">Aquí se reza a la ${esc(r.n)} ${r.s}.</p>`; }
  return `<div class="ins"><div class="khead">${embCached(k, 'emb big')}<h3>${esc(name)}</h3></div>
    <div class="sub">${esc(c.name)} · ${esc(k.name)}</div>
    <div class="chips"><span class="chip g">Nivel ${L.lv}</span><span class="chip">${esc(L.style)}</span><span class="chip">${ERAS[k.era]}</span></div>
    ${b >= 5 ? `<p class="empty">${esc(BUILDINGS[b].d)}</p>` : ''}${extra}
    <div class="acts"><button data-cityof="1">Ver ${esc(c.name)}</button><button data-goto="${x},${y}">Ir al edificio</button></div></div>`;
}
function cityPanel(c) {
  const k = c.k, L = cityLevel(c), arch = modOn('tecnologia') ? k.house : 0;
  const list = (c.blist || []).filter(e => bld[e.i] === e.b);
  const byType = {}; for (const e of list) (byType[e.b] = byType[e.b] || []).push(e.i);
  const rows = Object.entries(byType).map(([b, is]) => `<button class="brow" data-bld="${is[0]}"><span>${esc(BLD_NAME[b])}${is.length > 1 ? ' ×' + is.length : ''}</span><em>nivel ${arch + 1}</em></button>`).join('');
  const boats = units.filter(o => o.def.boat && o.city === c.id && !o.dead);
  return `<div class="ins"><div class="khead">${embCached(k, 'emb big')}<h3>${esc(c.name)}</h3></div>
    <div class="sub">${k.capital === c.id ? 'Capital ' : 'Ciudad '}${esc(del(k))} · fundada en el año ${c.born}</div>
    <div class="chips"><span class="chip g">${L.n} · nivel ${L.lv}</span><span class="chip">Arquitectura: ${esc(HOUSES[arch][0].toLowerCase())}</span>${c.coast ? '<span class="chip">Costera</span>' : ''}</div>
    <dl><dt>Población</dt><dd>${c.pop} / ${c.cap}</dd><dt>Casas</dt><dd>${c.houses}</dd><dt>Cultivos</dt><dd>${c.fields}</dd><dt>Comida</dt><dd>${SP[k.race].noFood ? 'no necesita' : c.food.toFixed(0)}</dd><dt>Minas cerca</dt><dd>${c.ores.length}</dd><dt>Ánimo</dt><dd>${Math.round(c.mood ?? 60)}</dd></dl>
    <h4>Edificios</h4>${rows ? `<div class="blist">${rows}</div>` : '<p class="empty">Solo casas. Con más población levantarán granero, muelle, cuartel, templo…</p>'}
    ${boats.length ? `<h4>Barcos en el mar</h4>${boats.map(o => `<button class="next blink" data-u="${o.id}">⛵ ${MISSION[o.mission?.kind] || 'Navegando'}${o.cargo?.length ? ` · ${o.cargo.length} a bordo` : ''}</button>`).join('')}` : ''}
    <h4>Oficios</h4><div class="chips">${profChips(c)}</div>
    <div class="acts"><button data-c="kingdom">Ver ${esc(k.name)}</button><button data-goto="${c.x},${c.y}">Ir a la ciudad</button></div>
    ${modOn('trucos') ? `<div class="acts"><button data-c="grow">+10 habitantes</button>${modOn('diplomacia') ? '<button data-c="rebel">Provocar rebelión</button>' : ''}<button data-c="burn" class="bad">Destruir ciudad</button></div>` : ''}</div>`;
}
// enlaces dentro de los paneles del inspector
function bindInspect(ctx) {
  sideBody.querySelectorAll('[data-bld]').forEach(b => b.onclick = () => { const i = +b.dataset.bld; goTo(i % W, (i / W) | 0); selectBld(i); });
  sideBody.querySelectorAll('[data-goto]').forEach(b => b.onclick = () => { const [x, y] = b.dataset.goto.split(',').map(Number); goTo(x, y); pingAt(x + .5, y + .5); });
  sideBody.querySelectorAll('.blink[data-u], .ulink2[data-u]').forEach(b => b.onclick = () => { const o = unitById(+b.dataset.u); if (o) { goTo(o.x | 0, o.y | 0); select(o); } });
  sideBody.querySelectorAll('[data-cityof]').forEach(b => b.onclick = () => { const c = ctx && ctx.city; if (c) { goTo(c.x, c.y); selectCity(c); } });
}
