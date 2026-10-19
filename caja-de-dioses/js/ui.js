"use strict";
// ---------- interfaz ----------
const TABS = [['vida', 'Vida'], ['rasgos', 'Rasgos'], ['materiales', 'Materiales'], ['terreno', 'Terreno'], ['fronteras', 'Fronteras y guerra'], ['caos', 'Destrucción'], ['bendicion', 'Bendiciones'], ['dios', 'Dios'], ['leyes', 'Leyes'], ['mods', 'Mods']];
let curTab = 'vida';
const tabsEl = document.getElementById('tabs'), toolsEl = document.getElementById('tools');
function renderTabs() {
  tabsEl.innerHTML = '';
  for (const [id, n] of TABS) {
    const b = document.createElement('button'); b.textContent = n; b.className = (id === curTab ? 'on' : '') + (id === 'mods' ? ' mod' : '');
    b.onclick = () => { curTab = id; renderTabs(); renderTools(); };
    tabsEl.appendChild(b);
  }
}
function stampIcon(x, kc) {
  const id = x.createImageData(8, 8), d = id.data;
  for (let k = 0; k < 64; k++) d[k * 4 + 3] = 0;
  const spr = BLD_SPR[2], kd = shade(kc, .62);
  for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 8; xx++) { const ch = spr[yy][xx]; if (ch === '.' || ch === 's') continue; const cc = ch === 'K' ? kc : ch === 'k' ? kd : BPAL[ch]; const p = (yy * 8 + xx) * 4; d[p] = cc[0]; d[p + 1] = cc[1]; d[p + 2] = cc[2]; d[p + 3] = 255; }
  const t = document.createElement('canvas'); t.width = t.height = 8; t.getContext('2d').putImageData(id, 0, 0);
  x.imageSmoothingEnabled = false; x.drawImage(t, 0, 4, 16, 16);
}
function toolIcon(t) {
  const c = document.createElement('canvas'); c.width = 14; c.height = 14;
  const x = c.getContext('2d');
  if (t.kind === 'tile' || t.kind === 'ore') {
    const col = t.kind === 'tile' ? TILE[t.tile].c : null;
    for (let yy = 0; yy < 14; yy++) for (let xx = 0; xx < 14; xx++) {
      let cc;
      if (t.kind === 'tile') { const j = (hash(xx, yy, t.tile) - .5) * 26; cc = [col[0] + j, col[1] + j, col[2] + j]; }
      else { const base = [110, 106, 102], mc = MAT[t.ore].c, s = hash(xx >> 1, yy >> 1, t.ore) > .5; const j = (hash(xx, yy, 3) - .5) * 30; cc = s ? [mc[0] + j, mc[1] + j, mc[2] + j] : [base[0] + j, base[1] + j, base[2] + j]; }
      x.fillStyle = css(cc.map(v => clamp(v, 0, 255))); x.fillRect(xx, yy, 1, 1);
    }
  } else if (t.kind === 'spawn' || t.kind === 'village') {
    // icono con el sprite real de la criatura (y unas casas si es un pueblo)
    const def = SP[t.sp];
    const body = def.civ ? hsl((CIV.indexOf(t.sp) * 51) % 360, 60, 50) : def.skin;
    const fake = { def, type: t.sp, k: def.civ ? { id: -2 - CIV.indexOf(t.sp), color: body, armor: { tier: 0 } } : null, age: 30, id: 1, hitT: 0, plague: 0 };
    const spr = unitSprite(fake, 0, 0);
    c.width = 28; c.height = 28;
    if (t.kind === 'village') stampIcon(x, def.civ ? body : [200, 60, 60]);
    const sc = Math.max(1, Math.floor((t.kind === 'village' ? 22 : 27) / Math.max(spr.w - 6, spr.h - 2)));
    x.imageSmoothingEnabled = false;
    x.drawImage(spr.cv, Math.floor(14 - spr.ax * sc) + (t.kind === 'village' ? 4 : 0), Math.floor(27 - spr.ay * sc), spr.w * sc, spr.h * sc);
  } else {
    c.width = 28; c.height = 28;
    x.font = '20px system-ui, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#e8b64c'; x.fillText(t.glyph || '•', 14, 15);
  }
  return c;
}
function renderTools() {
  toolsEl.innerHTML = '';
  document.getElementById('brush').hidden = ['mods', 'leyes'].includes(curTab);
  if (curTab === 'mods' || curTab === 'leyes') {
    const src = curTab === 'mods' ? MODS : LAWS;
    const wrap = document.createElement('div'); wrap.className = 'plist';
    for (const id in src) {
      const m = src[id];
      const card = document.createElement('button'); card.className = 'pcard' + (m.on ? '' : ' off'); card.setAttribute('aria-pressed', m.on);
      card.innerHTML = `<span class="sw2"></span><span><b>${m.n}</b><p>${m.d}</p></span>`;
      card.onclick = () => { m.on = !m.on; if (curTab === 'mods') { toast(`${m.n}: ${m.on ? 'activado' : 'desactivado'}`); applyModChange(); } renderTools(); };
      wrap.appendChild(card);
    }
    if (curTab === 'mods') {
      const card = document.createElement('button'); card.className = 'pcard create';
      const n = Object.keys(customTraits).length;
      card.innerHTML = `<span style="font-size:22px;line-height:1">✚</span><span><b>Crear rasgo</b><p>Inventa tus propios rasgos con sus efectos.${n ? ' Tienes ' + n + '.' : ''}</p></span>`;
      card.onclick = openTraitEditor;
      wrap.prepend(card);
    }
    toolsEl.appendChild(wrap);
    return;
  }
  let lastCat = null;
  for (const t of TOOLS) {
    if (t.tab !== curTab || !modOn(t.mod)) continue;
    if (t.kind === 'trait' && TRAITS[t.trait].cat !== lastCat) {
      lastCat = TRAITS[t.trait].cat;
      const s = document.createElement('div'); s.className = 'tool sep'; s.innerHTML = `<span>${lastCat}</span>`; toolsEl.appendChild(s);
    }
    const b = document.createElement('button');
    b.className = 'tool' + (t === curTool ? ' on' : '') + (t.kind === 'act' ? ' act' : '');
    b.title = t.kind === 'trait' ? `${t.n}: ${TRAITS[t.trait].d}` : t.n;
    b.appendChild(toolIcon(t));
    const s = document.createElement('span'); s.textContent = t.kind === 'scope' ? (traitScope === 'brush' ? 'Con pincel' : 'Pueblo entero') : t.n; b.appendChild(s);
    if (t.mod) { const m = document.createElement('i'); m.className = 'm'; m.title = 'Mod: ' + MODS[t.mod].n; b.appendChild(m); }
    else if (t.trait && TRAITS[t.trait]?.custom) { const m = document.createElement('i'); m.className = 'm c'; m.title = 'Rasgo creado por ti'; b.appendChild(m); }
    b.onclick = () => {
      if (t.kind === 'act') { globalAct(t.act); return; }
      if (t.kind === 'scope') { traitScope = traitScope === 'brush' ? 'village' : 'brush'; toast(traitScope === 'brush' ? 'Los rasgos se ponen con el pincel' : 'Ahora toca un pueblo: el rasgo se pone a todos sus habitantes'); renderTools(); return; }
      selectTool(t);
    };
    toolsEl.appendChild(b);
  }
}
function applyModChange() {
  if (!modOn(curTool.mod)) curTool = TOOLS.find(t => t.id === 'v_human');
  for (const u of units) if (!modOn(u.def.mod)) u.dead = true;
  units = units.filter(u => !u.dead);
  document.querySelectorAll('#speed [data-mod]').forEach(b => b.hidden = !modOn(b.dataset.mod));
  if (!modOn('trucos') && speed > 5) setSpeed(5);
  sideDirty = true;
}
function selectTool(t) { sfx('ui', undefined, undefined, 1, 40); curTool = t; warPick = null; renderTools(); updateHint(); if (t.kind === 'declare' || t.kind === 'peace') toast('Toca el primer pueblo'); }
function updateHint() {
  const h = document.getElementById('hint');
  let s = curTool.kind === 'scope' ? 'Rasgos' : curTool.n;
  if (hover) {
    const x = hover.x | 0, y = hover.y | 0;
    if (x >= 0 && y >= 0 && x < W && y < H) {
      const i = y * W + x; s += ` · ${TILE[tile[i]].n}`;
      if (ore[i]) s += ` con ${MAT[ore[i]].n.toLowerCase()}`;
      if (wall[i]) s += ' · frontera';
      if (owner[i]) { const c = cities[owner[i] - 1]; if (c && c.alive) s += ` · ${c.name} (${c.k.name})`; }
    }
  }
  h.textContent = s;
}
function setBrush(v) { brush = clamp(v, 1, 12); document.getElementById('brushSize').value = brush; document.getElementById('brushLbl').textContent = 'Pincel ' + brush; }
document.getElementById('brushSize').oninput = e => setBrush(+e.target.value);
function setSpeed(s) { if (s === 0) paused = true; else { paused = false; speed = s; } syncSpeed(); }
function togglePause() { paused = !paused; syncSpeed(); }
function syncSpeed() {
  document.querySelectorAll('#speed button').forEach(b => { const v = +b.dataset.s; b.classList.toggle('on', v > 0 && !paused && v === speed); });
  const pb = document.getElementById('playBtn'); pb.textContent = paused ? '▶' : '❚❚'; pb.classList.toggle('play', paused);
  document.getElementById('creation').hidden = !paused;
}
document.querySelectorAll('#speed button').forEach(b => b.onclick = () => { if (+b.dataset.s === 0) togglePause(); else setSpeed(+b.dataset.s); });
document.getElementById('startBtn').onclick = () => {
  if (!units.length) toast('El mundo está vacío. Funda un pueblo en la pestaña Vida.');
  setSpeed(speed || 1);
};
let toastT = 0;
function toast(m) { const t = document.getElementById('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }
function addLog(m, cls = '') {
  logs.unshift({ y: year(), m, cls }); if (logs.length > 150) logs.pop(); sideDirty = true;
  if (cls === 'war' && /guerra|Rebelión|Desembarco/.test(m)) sfx('war', undefined, undefined, 1, 2500);
  else if (cls === 'peace' && /Paz|Alianza/.test(m)) sfx('peace', undefined, undefined, 1, 2500);
  else if (cls === 'found' && /funda|Nace/.test(m)) sfx('found', undefined, undefined, 1, 1500);
  else if (cls === 'tech' && /descubre:|entra en/.test(m)) sfx('tech', undefined, undefined, 1, 2000);
  else if (cls === 'hero') sfx('hero', undefined, undefined, 1, 2500);
  else if (cls === 'doom') sfx('doom', undefined, undefined, 1, 4000);
}

// panel lateral
let sidePane = 'log', sideDirty = true, selected = null, selectedCity = null, selectedKingdom = null, selectedDeadName = null;
const side = document.getElementById('side'), sideBody = document.getElementById('sideBody');
function wideScreen() { return window.innerWidth > 900 && window.innerHeight > 520; }
if (wideScreen()) side.classList.remove('closed');
document.getElementById('sideToggle').onclick = () => { side.classList.toggle('closed'); sideDirty = true; };
document.getElementById('sideClose').onclick = () => side.classList.add('closed');
document.querySelectorAll('#sideTabs button[data-p]').forEach(b => b.onclick = () => { sidePane = b.dataset.p; if (sidePane === 'kingdoms') selectedKingdom = null; sideDirty = true; renderSide(); });
function openSide(p) { sidePane = p; side.classList.remove('closed'); sideDirty = true; renderSide(); }
function select(u) { selected = u; selectedCity = null; selectedDeadName = null; openSide('ins'); }
function inspectAt(x, y) {
  rebuildGrid();
  const u = nearest(x, y, 2.2, () => true);
  if (u) { select(u); return; }
  const xi = x | 0, yi = y | 0;
  if (xi >= 0 && yi >= 0 && xi < W && yi < H && owner[yi * W + xi]) { const c = cities[owner[yi * W + xi] - 1]; if (c && c.alive) { selected = null; selectedCity = c; openSide('ins'); return; } }
  toast(`${TILE[tile[yi * W + xi]]?.n || 'Nada'} · nadie aquí`);
}
function resGrid(k) {
  return '<div class="res">' + RESLIST.filter(r => { const m = MAT[MATID[r[0]]]; return !m || modOn(m.mod); }).map(([id, n, c]) => { const v = Math.floor(k.res[id] || 0); return `<span class="${v ? '' : 'zero'}"><i style="background:${css(c)}"></i>${n}<b>${v}</b></span>`; }).join('') + '</div>';
}
function cultureChips(k) {
  const tot = Math.max(1, units.filter(u => u.k === k && u.def.civ && u.age >= 12).length);
  const cnt = Object.create(null); for (const u of units) if (u.k === k && u.def.civ && u.age >= 12) for (const t of u.traits) cnt[t] = (cnt[t] || 0) + 1;
  const arr = Object.entries(cnt).filter(([t]) => TRAITS[t]).sort((a, b) => b[1] - a[1]).slice(0, 12);
  if (!arr.length) return '<p class="empty">Sin rasgos todavía. Usa la pestaña Rasgos.</p>';
  return '<div class="chips">' + arr.map(([t, n]) => `<span class="chip ${TRAITS[t].magic ? 'm' : TRAITS[t].bad ? 'r' : ''}">${TRAITS[t].g} ${TRAITS[t].n} ${Math.round(n / tot * 100)}%</span>`).join('') + '</div>';
}
function relationsHtml(k) {
  const others = kingdoms.filter(o => o.alive && o !== k);
  if (!others.length || !modOn('diplomacia')) return '';
  const rows = others.map(o => {
    const op = opinion(k, o), st = k.wars.has(o.id) ? '<span class="chip r">⚔ Guerra</span>' : k.allies.has(o.id) ? '<span class="chip ok">Aliado</span>' : '';
    const why = Object.entries(op.why).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 4).map(([r, v]) => `${v > 0 ? '+' : ''}${v} ${r}`).join(' · ');
    const col = op.v > 25 ? '#8ed596' : op.v < -25 ? '#f08a80' : 'var(--muted)';
    return `<div class="rel" title="${esc(why)}"><span class="sw" style="background:${css(o.color)}"></span><span class="rn">${esc(o.name)} ${st}<small>${esc(why)}</small></span><b style="color:${col}">${op.v > 0 ? '+' : ''}${op.v}</b></div>`;
  }).join('');
  return `<h4>Relaciones (opinión de este reino)</h4>${rows}`;
}
function kingdomDetail(k) {
  const kc = cities.filter(c => c && c.alive && c.k === k);
  const wars = [...k.wars].map(w => kingdoms[w]).filter(o => o && o.alive);
  const allies = [...k.allies].map(w => kingdoms[w]).filter(o => o && o.alive);
  const avail = TECH.filter(t => techAvailable(k, t));
  const ready = avail.filter(t => !missingFor(k, t).length).sort((a, b) => a.cost - b.cost);
  const blocked = avail.filter(t => missingFor(k, t).length);
  const nt = ready[0] || blocked.sort((a, b) => a.cost - b.cost)[0] || null;
  let techHtml = '';
  if (modOn('tecnologia')) {
    const miss = nt ? missingFor(k, nt) : [];
    techHtml = `<h4>Tecnología</h4>
      <dl><dt>Era</dt><dd>${ERAS[k.era]}</dd><dt>Armas</dt><dd>${esc(k.weapon.n)}</dd><dt>Armadura</dt><dd>${esc(k.armor.n)}</dd><dt>Edificios</dt><dd>${HOUSES[k.house][0]}${k.walls ? ' + murallas' : ''}</dd><dt>Ciencia</dt><dd>${(k.rpRate || 0).toFixed(1)} cada medio año</dd></dl>
      ${nt ? `<div class="next">Siguiente: <b>${nt.n}</b> <span style="color:var(--muted)">(${ERAS[nt.era]})</span><div class="bar"><i style="width:${Math.min(100, k.rp / nt.cost * 100)}%"></i></div>${miss.length ? `<div class="miss">Falta: ${miss.map(m => `${RESNAME[m[0]].toLowerCase()} ${m[1]}`).join(', ')}</div>` : ''}</div>` : '<div class="next">Lo ha descubierto todo.</div>'}
      ${blocked.length && ready.length ? `<div class="chips">${blocked.map(t => `<span class="chip r" title="Falta ${missingFor(k, t).map(m => RESNAME[m[0]].toLowerCase()).join(', ')}">🔒 ${t.n}: falta ${missingFor(k, t).map(m => RESNAME[m[0]].toLowerCase()).join(' y ')}</span>`).join('')}</div>` : ''}
      <h4>Ya sabe</h4><div class="chips">${TECH.filter(t => k.tech.has(t.id)).map(t => `<span class="chip ok">${t.n}</span>`).join('') || '<span class="empty">Nada todavía</span>'}</div>
      <h4>Almacén</h4>${resGrid(k)}`;
  }
  const sep = kingdoms.filter(o => o.alive && o !== k && !kingdomsTouch(k, o));
  return `<div class="ins"><button class="back" data-back="1">← Todos los pueblos</button><h3>${esc(k.name)}</h3>
    <div class="sub">${SP[k.race].n} · nacido en el año ${k.born}${k.dynasty ? ' · Casa ' + esc(k.dynasty) : ''}${modOn('religion') && k.religion ? '<br>Fe: ' + esc(relOf(k.religion).n) + ' ' + relOf(k.religion).s : ''} · ${kc.length} ciudad${kc.length === 1 ? '' : 'es'} · ${k.pop || units.filter(u => u.k === k).length} habitantes${k.king && !k.king.dead ? '<br>Soberano: ' + esc(k.king.name) : ''}</div>
    ${wars.length ? `<div class="chips">${wars.map(o => `<span class="chip r">⚔ ${esc(o.name)}</span>`).join('')}</div>` : ''}
    ${allies.length ? `<div class="chips">${allies.map(o => `<span class="chip ok">Aliado: ${esc(o.name)}</span>`).join('')}</div>` : ''}
    ${sep.length ? `<p class="empty" style="font-size:12px">Separado por fronteras o agua de: ${sep.map(o => esc(o.name)).join(', ')}.</p>` : ''}
    ${relationsHtml(k)}
    <h4>Cultura (rasgos más comunes)</h4>${cultureChips(k)}
    ${techHtml}
    ${modOn('trucos') ? `<div class="acts"><button data-ka="res">+40 de todo</button><button data-ka="era">Avanzar una era</button><button data-ka="peace">Paz con todos</button><button data-ka="pop">+10 habitantes</button></div>` : ''}</div>`;
}
function renderSide() {
  if (side.classList.contains('closed')) { sideDirty = false; return; }
  document.querySelectorAll('#sideTabs button[data-p]').forEach(b => b.classList.toggle('on', b.dataset.p === sidePane));
  const scroll = sideBody.scrollTop;
  if (sidePane === 'log') {
    sideBody.innerHTML = logs.length > 1 ? '<div class="log">' + logs.map(l => `<div class="${l.cls}"><i>Año ${l.y}</i>${esc(l.m)}</div>`).join('') + '</div>'
      : '<p class="empty">Aquí se escribirá la historia de tu mundo.<br><br>1. En <b>Vida</b>, toca la tierra para fundar un pueblo.<br>2. En <b>Rasgos</b>, pasa el pincel por su gente: inteligentes, trabajadores, tontos…<br>3. En <b>Materiales</b>, pon cobre, hierro, obsidiana… cerca de ellos.<br>4. Separa pueblos con una <b>frontera</b> si quieres que crezcan aislados.<br>5. Pulsa <b>▶ Empezar</b>.</p>';
  } else if (sidePane === 'kingdoms') {
    if (selectedKingdom && selectedKingdom.alive) sideBody.innerHTML = kingdomDetail(selectedKingdom);
    else {
      const ks = kingdoms.filter(k => k.alive).sort((a, b) => (b.pop || 0) - (a.pop || 0));
      sideBody.innerHTML = ks.length ? ks.map(k => {
        const kc = cities.filter(c => c && c.alive && c.k === k).length;
        const wars = [...k.wars].map(w => kingdoms[w]?.name).filter(Boolean);
        return `<div class="krow" data-k="${k.id}"><span class="sw" style="background:${css(k.color)}"></span><div style="min-width:0"><div class="kn">${esc(k.name)}</div><div class="kmeta">${SP[k.race].n}${modOn('tecnologia') ? ' · ' + ERAS[k.era] + ' · ' + esc(k.weapon.n) : ''} · ${kc} ciudad${kc === 1 ? '' : 'es'}${wars.length ? '<br><span style="color:var(--danger)">En guerra con: ' + esc(wars.join(', ')) + '</span>' : ''}</div></div><span class="kpop">${k.pop || units.filter(u => u.k === k).length}</span></div>`;
      }).join('') : '<p class="empty">No hay pueblos todavía. Funda uno en la pestaña Vida.</p>';
    }
  } else {
    if (selected && !selected.dead) {
      const u = selected;
      sideBody.innerHTML = unitPanel(u);
      sideBody.querySelectorAll('[data-a]').forEach(b => b.onclick = () => unitAct(u, b.dataset.a));
      sideBody.querySelectorAll('[data-u]').forEach(b => b.onclick = () => { const o = unitById(+b.dataset.u); if (o) select(o); });
    } else if (selectedCity && selectedCity.alive) {
      const c = selectedCity, k = c.k;
      sideBody.innerHTML = `<div class="ins"><h3>${esc(c.name)}</h3><div class="sub">${k.capital === c.id ? 'Capital ' : 'Ciudad '}${esc(del(k))} · fundada en el año ${c.born}</div>
        <dl><dt>Población</dt><dd>${c.pop} / ${c.cap}</dd><dt>Casas</dt><dd>${c.houses}</dd><dt>Cultivos</dt><dd>${c.fields}</dd><dt>Comida</dt><dd>${SP[k.race].noFood ? 'no necesita' : c.food.toFixed(0)}</dd><dt>Minas cerca</dt><dd>${c.ores.length}</dd><dt>Ánimo</dt><dd>${Math.round(c.mood ?? 60)}</dd></dl>
        <h4>Edificios</h4><div class="chips">${Object.entries(c.has || {}).map(([b, n]) => `<span class="chip" title="${esc(BUILDINGS[b]?.d || '')}">${esc(BLD_NAME[b])}${n > 1 ? ' ×' + n : ''}</span>`).join('') || '<span class="empty">Solo casas. Con más población levantarán granero, cuartel, templo…</span>'}</div>
        <h4>Oficios</h4><div class="chips">${profChips(c)}</div>
        <button class="tbtn" data-c="kingdom">Ver ${esc(k.name)}</button>
        ${modOn('trucos') ? `<div class="acts"><button data-c="grow">+10 habitantes</button>${modOn('diplomacia') ? '<button data-c="rebel">Provocar rebelión</button>' : ''}<button data-c="burn" class="bad">Destruir ciudad</button></div>` : ''}</div>`;
      sideBody.querySelectorAll('[data-c]').forEach(b => b.onclick = () => cityAct(c, b.dataset.c));
    } else {
      sideBody.innerHTML = `<p class="empty">${selectedDeadName ? esc(selectedDeadName) + ' ha muerto. ' : ''}Elige <b>Inspeccionar</b> (pestaña Dios o tecla I) y toca un ser o una ciudad para ver sus rasgos, armas y datos.</p>`;
    }
  }
  sideBody.scrollTop = scroll;
  sideBody.querySelectorAll('.krow').forEach(r => r.onclick = () => { selectedKingdom = kingdoms[+r.dataset.k]; const c = cities[selectedKingdom.capital]; if (c) { cam.x = c.x - VW / cam.z / 2; cam.y = c.y - VH / cam.z / 2; clampCam(); } renderSide(); sideBody.scrollTop = 0; });
  sideBody.querySelectorAll('[data-back]').forEach(b => b.onclick = () => { selectedKingdom = null; renderSide(); });
  sideBody.querySelectorAll('[data-ka]').forEach(b => b.onclick = () => kingdomAct(selectedKingdom, b.dataset.ka));
  sideDirty = false;
}
function needBar(label, v, col) {
  return `<div class="need"><span>${label}</span><i><b style="width:${clamp(v, 0, 100).toFixed(0)}%;background:${col}"></b></i><em>${Math.round(v)}</em></div>`;
}
function linkU(id) { const o = unitById(id); return o ? `<button class="ulink" data-u="${o.id}">${esc(displayName(o))}</button>` : null; }
function taskText(u) {
  if (u.target && !u.target.dead) return (u.hunting ? 'Cazando: ' : 'Luchando contra ') + esc(displayName(u.target).toLowerCase());
  const t = u.task; if (!t) return u.def.civ ? 'Pensando qué hacer' : 'Deambulando';
  const ph = t.ph === 'go' ? 'de camino' : t.ph === 'back' ? 'volviendo con ' + (u.carry ? RESNAME[u.carry.r]?.toLowerCase() || u.carry.r : 'la carga') : t.k === 'sleep' ? 'durmiendo' : 'en ello';
  return `${esc(t.n)} <span class="muted">· ${ph}</span>`;
}
function unitPanel(u) {
  const def = u.def, k = u.k, c = cities[u.city];
  const tr = u.traits.filter(t => TRAITS[t] && modOn(TRAITS[t].mod)).map(t => `<span class="chip ${TRAITS[t].magic ? 'm' : TRAITS[t].bad ? 'r' : ''}" title="${esc(TRAITS[t].d)}">${TRAITS[t].g} ${TRAITS[t].n}</span>`).join('');
  const pr = u.prof && PROFS[u.prof] && u.prof !== 'ruler' ? `<span class="chip ok">${PROFS[u.prof].g} ${PROFS[u.prof].n}</span>` : '';
  let civ = '';
  if (def.civ) {
    const dec = (u.dec || []).slice(0, 7), mx = Math.max(1, ...dec.map(d => d.s));
    const kids = units.filter(o => o.parents && o.parents.includes(u.id)).length;
    const fr = Object.keys(u.friends || {}).length;
    civ = `<h4>Necesidades</h4>
      ${def.noFood ? '' : needBar('Comida', u.food, u.food > 40 ? '#6ad074' : u.food > 15 ? '#e8b64c' : '#e0584b')}
      ${needBar('Energía', u.energy, '#5aa6d6')}
      ${needBar('Ánimo', u.mood, u.mood > 55 ? '#c2b0f5' : '#e0584b')}
      <h4>Ahora</h4><div class="next">${taskText(u)}${u.carry ? `<div class="muted" style="margin-top:3px">Lleva ${u.carry.n.toFixed(1)} de ${esc((RESNAME[u.carry.r] || u.carry.r).toLowerCase())}</div>` : ''}</div>
      ${dec.length ? `<h4>Decisiones de la IA</h4><div class="decs">${dec.map(d => `<div class="${d.id === u.decPick ? 'on' : ''}"><span>${d.id === u.decPick ? '▸ ' : ''}${esc(d.n)}</span><i><b style="width:${(d.s / mx * 100).toFixed(0)}%"></b></i><em>${d.s}</em></div>`).join('')}</div>` : ''}
      <h4>Familia</h4><dl>
        ${u.fam ? `<dt>Linaje</dt><dd>Casa ${esc(u.fam)}</dd>` : ''}
        <dt>Pareja</dt><dd>${linkU(u.partner) || (u.widow ? 'viudo/a de ' + esc(u.widow) : 'ninguna')}</dd>
        ${u.parents ? `<dt>Padres</dt><dd>${u.parents.map(linkU).filter(Boolean).join(' y ') || 'fallecidos'}</dd>` : ''}
        <dt>Hijos</dt><dd>${kids}${u.kids && u.kids > kids ? ` (${u.kids} en total)` : ''}</dd><dt>Amigos</dt><dd>${fr}</dd></dl>`;
  }
  return `<div class="ins"><h3>${esc(displayName(u))}</h3>
    <div class="sub">${def.n}${def.civ ? (u.sex === 'f' ? ' · ♀' : ' · ♂') : ''} · ${Math.floor(u.age)} años${k ? ' · ' + esc(k.name) : def.civ ? ' · sin pueblo' : ''}${c ? ' · ' + esc(c.name) : ''}</div>
    <div class="chips">${k && k.king === u ? '<span class="chip g">♛ Soberano</span>' : ''}${u.hero ? '<span class="chip g">Héroe</span>' : ''}${pr}${u.settler ? '<span class="chip">Colono</span>' : ''}${u.plague ? '<span class="chip r">Con plaga</span>' : ''}</div>
    ${civ}
    <h4>Rasgos</h4>${tr ? `<div class="chips">${tr}</div>` : '<p class="empty">Ninguno. Ve a la pestaña Rasgos y pasa el pincel por encima.</p>'}
    <h4>Combate</h4><dl><dt>Vida</dt><dd>${Math.ceil(u.hp)} / ${Math.ceil(u.maxHp)}</dd><dt>Ataque</dt><dd>${atkOf(u).toFixed(1)}</dd>${def.civ && modOn('tecnologia') && k ? `<dt>Arma</dt><dd>${esc(u.item && modOn('heroes') ? u.item[0] : k.weapon.n)}</dd><dt>Armadura</dt><dd>${esc(k.armor.n)}</dd>` : ''}<dt>Nivel</dt><dd>${u.level}${modOn('heroes') ? ' · ' + rankOf(u.level) : ''}</dd><dt>Bajas</dt><dd>${u.kills}</dd><dt>Vida máx.</dt><dd>${u.maxAge > 5000 ? '∞' : Math.floor(u.maxAge * kmul(k, 'age'))} años</dd></dl>
    <div class="acts"><button data-a="follow">${followSel === u ? 'Dejar de seguir' : 'Seguir con la cámara'}</button>${k ? `<button data-a="kingdom">Ver su pueblo</button>` : ''}</div>
    ${modOn('trucos') ? `<div class="acts"><button data-a="heal">Curar</button><button data-a="lvl">+5 niveles</button>${modOn('heroes') && def.civ ? '<button data-a="hero">Hacer héroe</button>' : ''}${k ? '<button data-a="king">Coronar</button>' : ''}<button data-a="kill" class="bad">Fulminar</button></div>` : ''}</div>`;
}
let followSel = null;
function profChips(c) {
  const cnt = {}; for (const u of units) if (u.city === c.id && u.def.civ && u.prof) cnt[u.prof] = (cnt[u.prof] || 0) + 1;
  return Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([p, n]) => `<span class="chip">${PROFS[p]?.g || ''} ${PROFS[p]?.n || p} ${n}</span>`).join('');
}
function showKingdom(k) { selectedKingdom = k; openSide('kingdoms'); }
function kingdomAct(k, a) {
  if (!k) return;
  if (a === 'res') for (const r in k.res) k.res[r] += 40;
  if (a === 'era') { const te = Math.min(ERAS.length - 1, k.era + 1); for (const t of TECH) if (t.era <= te && modOn(t.mod)) applyTech(k, t, true); addLog(`${El(k)} avanza a la ${ERAS[k.era]}.`, 'tech'); }
  if (a === 'peace') for (const w of [...k.wars]) if (kingdoms[w]) makePeace(k, kingdoms[w]);
  if (a === 'pop') { const c = cities[k.capital]; if (c) for (let i = 0; i < 10; i++) spawn(k.race, c.x + .5, c.y + .5, k, c.id); }
  renderSide();
}
function unitAct(u, a) {
  if (a === 'kingdom') { showKingdom(u.k); return; }
  if (a === 'heal') { u.hp = u.maxHp; u.plague = 0; }
  if (a === 'lvl') { for (let i = 0; i < 5; i++) gainXp(u, u.level * 2); if (!modOn('heroes')) { u.level += 5; u.maxHp = maxHpOf(u); u.hp = u.maxHp; } }
  if (a === 'hero') { if (!u.hero) { u.level = Math.max(5, u.level); makeHero(u); } }
  if (a === 'king' && u.k) { u.k.king = u; u.name = u.name || mkName(u.k.race); addLog(`Por voluntad divina, ${u.name} es coronado soberano ${del(u.k)}.`, 'peace'); }
  if (a === 'follow') { followSel = followSel === u ? null : u; if (followSel && cam.z < 10) cam.z = 14; }
  if (a === 'kill') { lightning(u.x | 0, u.y | 0); kill(u, null, 'castigo divino'); }
  renderSide();
}
function cityAct(c, a) {
  if (a === 'kingdom') { showKingdom(c.k); return; }
  if (a === 'grow') for (let i = 0; i < 10; i++) spawn(c.k.race, c.x + .5, c.y + .5, c.k, c.id);
  if (a === 'rebel') rebel(c);
  if (a === 'burn') { explode(c.x + .5, c.y + .5, 6, { dmg: 300, fire: .7 }); destroyCity(c, 'ha sido destruida por los dioses'); }
  renderSide();
}

function renderStats() {
  let pop = 0, heroes = 0; for (const u of units) { if (u.def.civ) pop++; if (u.hero) heroes++; }
  const ak = kingdoms.filter(k => k.alive); let wars = 0;
  for (let i = 0; i < ak.length; i++) for (let j = i + 1; j < ak.length; j++) if (ak[i].wars.has(ak[j].id)) wars++;
  const top = ak.reduce((m, k) => Math.max(m, k.era), 0);
  document.getElementById('stats').innerHTML = `<span>Año <b>${year()}</b>${modOn('clima') ? ' · ' + SEASONS[season()] : ''}</span><span>Gente <b>${pop}</b></span><span>Pueblos <b>${ak.length}</b></span><span>Guerras <b>${wars}</b></span>${ak.length && modOn('tecnologia') ? `<span>Era más avanzada <b>${ERAS[top]}</b></span>` : ''}${modOn('heroes') ? `<span>Héroes <b>${heroes}</b></span>` : ''}<span>Criaturas <b>${units.length - pop}</b></span>`;
}

// ---------- editor de rasgos ----------
const TSLIDERS = [['atk', 'Ataque', .3, 3], ['hp', 'Vida', .3, 3], ['spd', 'Velocidad', .4, 2.2], ['work', 'Trabajo', .2, 3], ['research', 'Investigación', .1, 4], ['fert', 'Fertilidad', 0, 3], ['age', 'Longevidad', .4, 4], ['hunger', 'Hambre', .1, 2.5], ['tired', 'Cansancio', .1, 2.5], ['dmgTaken', 'Daño recibido', .1, 2], ['size', 'Tamaño', .6, 1.8], ['social', 'Sociabilidad', .1, 3]];
const traitModal = document.getElementById('traitModal');
function openTraitEditor() {
  document.getElementById('tSliders').innerHTML = TSLIDERS.map(([k, n, a, b]) => `<div class="slid"><span>${n}</span><input type="range" id="ts_${k}" min="${a}" max="${b}" step=".05" value="1"><b id="tv_${k}">×1.00</b></div>`).join('');
  for (const [k] of TSLIDERS) { const r = document.getElementById('ts_' + k); r.oninput = () => document.getElementById('tv_' + k).textContent = '×' + (+r.value).toFixed(2); }
  renderTraitList();
  traitModal.hidden = false;
  document.getElementById('tName').focus();
}
function renderTraitList() {
  const ids = Object.keys(customTraits);
  document.getElementById('tList').innerHTML = ids.length ? '<h4 style="margin:0 0 6px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)">Tus rasgos</h4>' + ids.map(id => `<div class="ct"><span>${esc(customTraits[id].g)} ${esc(customTraits[id].n)} <small style="color:var(--muted)">${esc(customTraits[id].d)}</small></span><button class="tbtn" data-del="${id}">Borrar</button></div>`).join('') : '';
  document.querySelectorAll('#tList [data-del]').forEach(b => b.onclick = () => deleteCustomTrait(b.dataset.del));
}
function describeTrait(t) {
  const parts = [];
  for (const [k, n] of TSLIDERS) if (t[k] !== undefined && Math.abs(t[k] - 1) > .04) parts.push(`${n.toLowerCase()} ×${t[k].toFixed(2)}`);
  if (t.regen) parts.push('se regenera'); if (t.archer) parts.push('dispara de lejos');
  return parts.join(', ') || 'Sin efectos';
}
document.getElementById('tClose').onclick = () => traitModal.hidden = true;
traitModal.addEventListener('click', e => { if (e.target === traitModal) traitModal.hidden = true; });
document.getElementById('tSave').onclick = () => {
  const name = document.getElementById('tName').value.trim();
  if (!name) { toast('Ponle un nombre al rasgo'); return; }
  const id = 'c_' + name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '_').slice(0, 20) + '_' + Date.now().toString(36).slice(-3);
  const t = { n: name, g: document.getElementById('tIcon').value.trim() || '✨', cat: document.getElementById('tCat').value, custom: 1 };
  for (const [k] of TSLIDERS) { const v = +document.getElementById('ts_' + k).value; if (Math.abs(v - 1) > .04) t[k] = Math.round(v * 100) / 100; }
  if (document.getElementById('tRegen').checked) t.regen = 1;
  if (document.getElementById('tArcher').checked) t.archer = 1;
  if (document.getElementById('tAggr').checked) t.aggr = 1;
  if (document.getElementById('tPeace').checked) t.aggr = -1;
  if (!document.getElementById('tInh').checked) t.inh = 0;
  if (document.getElementById('tBad').checked) t.bad = 1;
  t.d = document.getElementById('tDesc').value.trim() || describeTrait(t);
  TRAITS[id] = t; customTraits[id] = t;
  if (!saveCustomTraits()) toast('No se pudo guardar en el navegador; el rasgo dura hasta que cierres la página');
  TOOLS.push({ tab: 'rasgos', id: 'r_' + id, n: t.n, kind: 'trait', trait: id, glyph: t.g });
  traitModal.hidden = true;
  document.getElementById('tName').value = ''; document.getElementById('tDesc').value = '';
  curTab = 'rasgos'; renderTabs(); selectTool(TOOLS.find(x => x.id === 'r_' + id));
  toast(`Rasgo creado: ${t.g} ${t.n}. Pásalo con el pincel por la gente.`);
};
function deleteCustomTrait(id) {
  delete customTraits[id]; delete TRAITS[id]; saveCustomTraits();
  const i = TOOLS.findIndex(x => x.id === 'r_' + id); if (i >= 0) TOOLS.splice(i, 1);
  for (const u of units) if (u.traits.includes(id)) u.traits = u.traits.filter(x => x !== id);
  if (curTool.trait === id) curTool = TOOLS.find(t => t.id === 'v_human');
  renderTraitList(); renderTools();
}
