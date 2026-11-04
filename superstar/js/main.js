import { SONGS, PHOTO_CREDITS, THEMES, ERAS, DIFFS, MEMBERS, DECK_SIZE, PACK_COST, REFILL_COST, HP_REGEN_SEC, BASE_MAX_SCORE, matchSong, GRADE_INFO } from './data.js';
import { loadProfile, saveProfile, resetProfile, idb, askPersistent, defaultProfile } from './store.js';
import { analyzeAudio, makeChart, ANALYSIS_VERSION, beatGrid, nearestIn } from './beatmap.js';
import { cardHTML, cardPower, deckPower, openPack, welcomePack, autoDeck, memberById, cardPhoto, migrateEras, grantCard, welcomeSizes } from './cards.js';
import { CARD_CREDITS } from './card-credits.js';
import { Game } from './engine.js';
import { openDrop, preloadDrop } from './drop.js';
import { buildShareFile, readShareInfo, sendFile, isMp3 } from './share.js';

// ---------------- estado ----------------
let recState = null, pendingRec = null, afterTry = null;
const PREPARED = ['no-more-dream', 'dynamite', 'the-truth-untold']; // canciones con partitura que sigue la voz
// Siempre en horizontal: si el móvil está en vertical, la app se gira (sin avisos).
function applyRot() {
  const r = innerHeight > innerWidth;
  document.body.classList.toggle('rot', r);
  const st = document.documentElement.style;
  st.setProperty('--rw', innerHeight + 'px'); st.setProperty('--rh', innerWidth + 'px');
  // tamaño real de la app (ancho y alto en horizontal), para el CSS
  st.setProperty('--aw', (r ? innerHeight : innerWidth) + 'px'); st.setProperty('--ah', (r ? innerWidth : innerHeight) + 'px');
  if (window.__ss && window.__ss.game) window.__ss.game.resize();
}
applyRot(); addEventListener('resize', applyRot);
setTimeout(() => preloadDrop(), 1500);   // imágenes de los sobres listas antes de abrir uno
let P = loadProfile();
if (migrateEras(P)) saveProfile(P);
const RESET_TAG = 'reset-2026-11-04c';
try {
  if (localStorage.getItem('superstar.reset') !== RESET_TAG) {
    const keep = { name: P.name, settings: P.settings, customSongs: P.customSongs || [], userCharts: P.userCharts || {}, lastDiff: P.lastDiff };
    P = { ...defaultProfile(), ...keep };
    saveProfile(P);
    localStorage.setItem('superstar.reset', RESET_TAG);
    localStorage.removeItem('superstar.testR');
  }
} catch {}
let ctx = null;
let screen = 'title';
let diff = P.lastDiff || 'normal';
let game = null;
let lastPlay = null;
const loaded = new Set();
const analyzing = new Map();   // songId -> progreso 0..1
const levels = new Map();      // songId -> {easy, normal, hard}
const bufCache = new Map();
let installEvt = null;

const $ = s => document.querySelector(s);
const view = $('#view');
const save = () => saveProfile(P);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Math.round(n).toLocaleString('es-ES');
const allSongs = () => [...SONGS, ...P.customSongs];
const songById = id => allSongs().find(s => s.id === id);
const diffInfo = id => DIFFS.find(d => d.id === id);

// ---------------- auriculares (energía) y nivel ----------------
const maxHP = () => 10 + Math.floor((P.level - 1) / 5);
function tickHP() {
  const now = Date.now();
  const max = maxHP();
  if (P.hp >= max) { P.hpTs = now; return; }
  const n = Math.floor((now - P.hpTs) / (HP_REGEN_SEC * 1000));
  if (n > 0) {
    P.hp = Math.min(max, P.hp + n);
    P.hpTs = P.hp >= max ? now : P.hpTs + n * HP_REGEN_SEC * 1000;
    save();
  }
}
function hpTimer() {
  if (P.hp >= maxHP()) return 'MAX';
  const left = HP_REGEN_SEC - Math.floor((Date.now() - P.hpTs) / 1000) % HP_REGEN_SEC;
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
}
const expNeed = l => 200 + l * 120;
// Recompensa al llegar a cada nivel: cada 10 niveles 5 sobres gratis, cada 5 (5, 15, 25…) 1 sobre, el resto 1000 notas
function levelReward(l) {
  if (l % 10 === 0) return { packs: 5, text: '5 sobres gratis', ico: '<img class="pk-ico x5" src="img/drop/pack.webp" alt="">' };
  if (l % 5 === 0) return { packs: 1, text: '1 sobre gratis', ico: '<img class="pk-ico" src="img/drop/pack.webp" alt="">' };
  return { rp: 1000, text: '1.000 notas', ico: '♪' };
}
let lastRewards = [];
function addExp(x) {
  P.exp += x;
  let up = 0; lastRewards = [];
  while (P.exp >= expNeed(P.level)) {
    P.exp -= expNeed(P.level); P.level++; up++;
    const r = levelReward(P.level);
    // la recompensa queda pendiente hasta que se recoja tocando el nivel
    P.pending = P.pending || [];
    P.pending.push({ level: P.level, packs: r.packs || 0, rp: r.rp || 0 });
    lastRewards.push({ level: P.level, ...r });
  }
  if (up) P.hp = Math.max(P.hp, maxHP());
  return up;
}
// Ventana del nivel: recompensas sin recoger, barra de progreso y próximas recompensas
function levelSheet() {
  const need = expNeed(P.level), pct = Math.min(100, P.exp / need * 100);
  const next = levelReward(P.level + 1);
  const pend = P.pending || [];
  const list = Array.from({ length: 8 }, (_, k) => P.level + 1 + k).map(l => { const r = levelReward(l); return `<div class="lv-item ${r.packs ? 'big' : ''}"><b>Nv. ${l}</b><span>${r.ico}</span><small>${r.text}</small></div>`; }).join('');
  modal(`<div class="lv-head"><div class="lv-num">Nv. ${P.level}</div><div class="lv-main">
      <div class="lv-bar"><i style="width:${pct.toFixed(1)}%"></i></div>
      <div class="muted small">${fmt(P.exp)} / ${fmt(need)} EXP · faltan <b>${fmt(need - P.exp)}</b> para el nivel ${P.level + 1}</div></div></div>
    ${pend.length ? `<div class="lv-claim-title">¡Tienes recompensas sin recoger! Toca para recogerlas</div>
      <div class="lv-list">${pend.map((r, k) => { const rw = levelReward(r.level); return `<button class="lv-item claim" data-claim="${k}"><b>Nv. ${r.level}</b><span>${rw.ico}</span><small>${rw.text}</small><em>RECOGER</em></button>`; }).join('')}</div>` : ''}
    <div class="lv-next">Al subir a nivel ${P.level + 1}: <b>${next.ico} ${next.text}</b></div>
    <div class="lv-list">${list}</div>
    <p class="muted small">Ganas EXP jugando canciones. Cada nivel: 1.000 notas · cada 5 niveles (5, 15, 25…): 1 sobre gratis · cada 10 niveles: 5 sobres gratis.</p>`, el => {
    el.querySelectorAll('[data-claim]').forEach(b => b.onclick = () => claimReward(+b.dataset.claim));
  });
}
async function claimReward(k) {
  const r = (P.pending || [])[k];
  if (!r) return;
  P.pending.splice(k, 1);
  if (r.rp) { P.rp += r.rp; save(); renderTop(); toast(`+${fmt(r.rp)} notas`); levelSheet(); return; }
  save(); closeModal(); renderTop();
  await openPacksNow(r.packs);   // se abren los sobres directamente, como al empezar
  if (screen === 'shop') rShop();
  levelSheet();                  // y se vuelve a la ventana del nivel
}

// ---------------- audio ----------------
function ensureCtx() {
  if (!ctx) {
    // iPhone: que la música suene aunque el interruptor de silencio esté activado
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch {}
    try {   // iOS antiguos: un audio HTML mudo cambia el modo de sonido a «reproducción»
      const a = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
      a.setAttribute('playsinline', ''); a.volume = 0; a.play().catch(() => {});
    } catch {}
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC({ latencyHint: 'interactive' });
  }
  if (ctx.state === 'suspended' || ctx.state === 'interrupted') ctx.resume();
  return ctx;
}
// al volver a la app (iPhone puede «interrumpir» el sonido), se reactiva
document.addEventListener('visibilitychange', () => { if (!document.hidden && ctx && ctx.state !== 'running' && ctx.state !== 'closed') ctx.resume().catch(() => {}); });
async function getBuffer(id) {
  if (bufCache.has(id)) return bufCache.get(id);
  const rec = await idb.get('audio', id);
  if (!rec) throw new Error('Sin audio');
  const ab = await rec.blob.arrayBuffer();
  const buf = await new Promise((res, rej) => {
    const p = ensureCtx().decodeAudioData(ab, res, rej);
    if (p && p.then) p.then(res, rej);
  });
  bufCache.set(id, buf);
  while (bufCache.size > 2) bufCache.delete(bufCache.keys().next().value);
  return buf;
}
async function getAnalysis(id) {
  const cached = await idb.get('analysis', id);
  if (cached && cached.v === ANALYSIS_VERSION) return cached;
  if (analyzing.has(id)) return analyzing.get(id + ':p');
  const job = (async () => {
    analyzing.set(id, 0); refreshRow(id);
    try {
      const buf = await getBuffer(id);
      const an = await analyzeAudio(buf, (p) => { analyzing.set(id, p); refreshRow(id); });
      await idb.put('analysis', id, an);
      return an;
    } finally { analyzing.delete(id); analyzing.delete(id + ':p'); }
  })();
  analyzing.set(id + ':p', job);
  const an = await job;
  computeLevels(id, an);
  refreshRow(id);
  return an;
}
function computeLevels(id, an) {
  const lv = {};
  for (const d of DIFFS) lv[d.id] = makeChart(an, 'normal', id).level + (d.id === 'hard' ? 3 : d.id === 'easy' ? -2 : 0);
  levels.set(id, lv);
  getPrepared(id).then(pr => { if (pr && pr.charts.normal) { for (const d of DIFFS) lv[d.id] = pr.charts.normal.level + (d.id === 'hard' ? 3 : d.id === 'easy' ? -2 : 0); refreshRow(id); } });
}

// Partituras preparadas que siguen la voz (charts/<id>.json). Sólo tiempos y carriles: el audio lo pone ella.
const prepCache = new Map();
function getPrepared(id) {
  if (!prepCache.has(id)) {
    prepCache.set(id, fetch(`charts/${id}.json`).then(r => (r.ok ? r.json() : null)).catch(() => null));
  }
  return prepCache.get(id);
}

async function storeAudio(id, file) {
  const blob = new Blob([await file.arrayBuffer()], { type: file.type || 'audio/mpeg' });
  await idb.put('audio', id, { blob, name: file.name, size: file.size });
  await idb.del('analysis', id);
  bufCache.delete(id); levels.delete(id);
  loaded.add(id);
  askPersistent();
}

// ---------------- navegación ----------------
function go(s, arg) {
  if (s === 'deck' && screen !== 'deck') deckFilter = { sort: 'desc', era: null };   // el filtro se reinicia al volver
  document.querySelectorAll('.swap').forEach(e => e.remove());
  screen = s;
  document.body.dataset.screen = s;
  const menu = ['lobby', 'songs', 'deck', 'shop', 'settings'].includes(s);
  $('#nav').hidden = !menu;
  $('#topbar').hidden = !menu;
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.go === s));
  ({ title: rTitle, lobby: rLobby, songs: rSongs, deck: rDeck, shop: rShop, settings: rSettings, result: rResult }[s] || (() => {}))(arg);
  renderTop();
  view.scrollTop = 0;
}

function renderTop() {
  tickHP();
  const need = expNeed(P.level);
  $('#topbar').innerHTML = `
    <div class="tb-lv ${(P.pending || []).length ? 'has-reward' : ''}"><b>Lv.${P.level}</b><i style="--p:${(P.exp / need * 100).toFixed(1)}%"></i></div>
    <div class="tb-name">${esc(P.name)}</div>
    <div class="pill rp" title="Rhythm Points"><span class="ico">♪</span>${fmt(P.rp)}</div>`;
}
setInterval(() => { if (!$('#topbar').hidden) renderTop(); }, 1000);
$('#topbar').addEventListener('click', e => { if (e.target.closest('.tb-lv')) levelSheet(); });

// ---------------- pantallas ----------------
function rTitle() {
  view.innerHTML = `
  <div class="title-screen title-v2">
    <div class="tap-start"><i></i><span>TOCA PARA EMPEZAR</span><i></i></div>
    <div class="title-foot">Fan game personal · sin afiliación oficial</div>
  </div>`;
  view.querySelector('.title-screen').addEventListener('click', () => {
    ensureCtx(); ensureLandscape();
    go('lobby');
    if (!P.welcomed) welcome();
  }, { once: true });
}

// Primera vez: primero el nombre, luego el regalo de 5 sobres que se abren directamente
function welcome() {
  modal(`
    <h2>¿Cuál es tu nombre?</h2>
    <p class="muted">Así te llamará el juego.</p>
    <input class="name-in" type="text" maxlength="16" placeholder="Tu nombre" autocomplete="off" value="">
    <button class="btn primary" data-act="ok">Empezar</button>`, el => {
    const inp = el.querySelector('.name-in'), ok = el.querySelector('[data-act=ok]');
    const go2 = () => {
      const n = inp.value.trim();
      if (!n) { inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); inp.focus(); return; }
      P.name = n.slice(0, 16); save(); renderTop(); closeModal(); welcomeGift();
    };
    ok.onclick = go2;
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') go2(); });
    setTimeout(() => inp.focus(), 50);
  }, null, { locked: true });
}
function welcomeGift() {
  P.freePacks = (P.freePacks || 0) + 5;
  P.welcomed = true; save();
  modal(`
    <h2>¡Bienvenid@, ${esc(P.name)}!</h2>
    <div class="welcome-packs">${'<img src="img/drop/pack.webp" alt="">'.repeat(5)}</div>
    <p>Un regalo para empezar: <b>5 sobres gratis</b> para conseguir las cartas de tu mazo.</p>
    <button class="btn primary" data-act="open">Abrir mis sobres</button>`, el => {
    el.querySelector('[data-act=open]').onclick = () => { closeModal(); openPacksNow(P.freePacks, true, welcomeSizes(P.freePacks)).then(() => go('lobby')); };
  }, null, { locked: true });
}
// Abre sobres gratis uno detrás de otro, sin que se vea la pantalla de detrás entre medias
async function openPacksNow(n, fromFree = false, sizes = null) {
  const hold = document.createElement('div');
  hold.className = 'drop-hold';
  $('#app').appendChild(hold);
  try {
    for (let k = 0; k < n; k++) {
      if (fromFree) { if ((P.freePacks || 0) <= 0) break; P.freePacks--; }
      const got = sizes ? openPack(P, sizes[k], { noDup: true }) : openPack(P); save();
      await openDrop(got, { cardHTML, packs: 1 });
    }
  } finally { hold.remove(); }
}
const openFreePacks = n => openPacksNow(n, true);

function rLobby() {
  const leader = P.cards.find(c => c.uid === P.deck[0]) || P.cards.find(c => P.deck.includes(c.uid));
  const nLoaded = allSongs().filter(s => loaded.has(s.id)).length;
  const recs = Object.values(P.records);
  view.innerHTML = `
  <div class="lobby">
    <div class="leader">
      ${cardHTML(leader, { size: 'lg' })}
      <div class="leader-info">
        <div class="muted small">PODER DEL MAZO</div>
        <div class="big">${fmt(deckPower(P))}</div>
        <div class="mazo-bonus">Tu mazo te da <b>+${deckBonusPct()}%</b> de puntos en cada canción.<br>Abre sobres y sube cartas para sacar más.</div>
      </div>
    </div>
    <button class="btn primary huge" data-act="play">JUGAR</button>
    <div class="stats">
      <div><b>${nLoaded}</b><span>canciones listas</span></div>
      <div><b>${recs.length}</b><span>récords</span></div>
      <div><b>${recs.filter(r => r.fc).length}</b><span>full combos</span></div>
    </div>
    ${installEvt ? '<button class="btn ghost" data-act="install">⬇ Instalar en el móvil</button>' : ''}
    ${isIOS() && !isStandalone() ? '<p class="hint">Para instalarla en iPhone: botón <b>Compartir</b> → <b>Añadir a pantalla de inicio</b>.</p>' : ''}
  </div>`;
  view.querySelector('[data-act=play]').onclick = () => go('songs');
  const ib = view.querySelector('[data-act=install]');
  if (ib) ib.onclick = async () => { installEvt.prompt(); await installEvt.userChoice; installEvt = null; rLobby(); };
}

function rSongs() {
  // primero las que ya tienen audio, manteniendo el orden del catálogo
  const songs = allSongs().map((s, i) => [s, i]).sort((a, b) => (loaded.has(b[0].id) - loaded.has(a[0].id)) || a[1] - b[1]).map(x => x[0]);
  view.innerHTML = `
  <div class="songs">
    <div class="diff-tabs">
      ${DIFFS.map(d => `<button class="dtab ${d.id === diff ? 'on' : ''}" data-diff="${d.id}" style="--dc:${d.color}">${d.name}<small>velocidad ${d.label}</small></button>`).join('')}
    </div>
    <label class="btn ghost import">＋ Importar canciones (varias a la vez)
      <input type="file" accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.flac" multiple hidden id="multiIn">
    </label>
    <div class="song-list">${songs.map(songRow).join('')}</div>
  </div>`;
  view.querySelectorAll('.dtab').forEach(b => b.onclick = () => { diff = b.dataset.diff; P.lastDiff = diff; save(); rSongs(); });
  $('#multiIn').onchange = e => importMany([...e.target.files]);
  view.querySelector('.song-list').addEventListener('click', onSongClick);
  view.querySelector('.song-list').addEventListener('change', onSongFile);
}

function songRow(s) {
  const th = THEMES[s.theme] || THEMES.SPECIAL;
  const rec = P.records[s.id + '|' + diff];
  const isL = loaded.has(s.id);
  const prog = analyzing.get(s.id);
  const lv = levels.get(s.id);
  let right;
  if (!isL) {
    right = `<label class="btn small load">Cargar<input type="file" accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.flac" hidden data-load="${s.id}"></label>`;
  } else if (prog !== undefined) {
    right = `<div class="anal"><i style="width:${Math.round(prog * 100)}%"></i><span>Analizando…</span></div>`;
  } else {
    right = rec ? `<div class="rec"><b class="rank r-${rec.rank}">${rec.rank}</b><span>${fmt(rec.score)}</span>${rec.fc ? '<em>FC</em>' : ''}</div>` : '<div class="rec new">NUEVA</div>';
  }
  return `
  <div class="song ${isL ? 'ready' : 'locked'}" data-id="${s.id}" style="--c1:${th.c1};--c2:${th.c2}">
    <div class="song-jacket"><span>${esc(th.short)}</span></div>
    <div class="song-meta">
      <div class="song-title">${esc(s.title)}</div>
      <div class="song-sub">${esc(s.artist || '')}${lv ? ` · <span class="lvl">★${lv[diff]}</span>` : ''}${P.userCharts && P.userCharts[s.id] ? ' · <span class="voz">✋ tuya</span>' : PREPARED.includes(s.id) ? ' · <span class="voz">🎤 voz</span>' : ''}</div>
    </div>
    <div class="song-right">${right}</div>
  </div>`;
}
function refreshRow(id) {
  if (screen !== 'songs') return;
  const el = view.querySelector(`.song[data-id="${CSS.escape(id)}"]`);
  const s = songById(id);
  if (el && s) el.outerHTML = songRow(s);
}

async function onSongFile(e) {
  const id = e.target.dataset.load;
  if (!id || !e.target.files[0]) return;
  const f = e.target.files[0];
  try {
    const info = await readShareInfo(f);
    if (info && info.chart && info.chart.notes && info.song && info.song.id === id && !(P.userCharts && P.userCharts[id])) { P.userCharts = P.userCharts || {}; P.userCharts[id] = info.chart; save(); }
    await storeAudio(id, f);
    refreshRow(id);
    await getAnalysis(id);
    toast(`«${songById(id).title}» lista para jugar`);
  } catch (err) {
    console.error(err);
    await idb.del('audio', id); loaded.delete(id); refreshRow(id);
    toast('No se pudo leer ese archivo de audio');
  }
}

// Archivo enviado desde otro móvil con «Enviar canción»: ya dice qué canción es (y trae su partitura)
function songFromShare(info) {
  const sh = info && info.song;
  if (!sh || !sh.title) return null;
  let s = songById(sh.id) || P.customSongs.find(x => x.title === sh.title);
  if (!s) {
    s = { id: sh.id && sh.id.startsWith('c-') ? sh.id : 'c-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title: String(sh.title).slice(0, 60), artist: sh.artist || 'BTS', theme: THEMES[sh.theme] ? sh.theme : 'SPECIAL' };
    P.customSongs.push(s);
  }
  if (info.chart && info.chart.notes && !(P.userCharts && P.userCharts[s.id])) { P.userCharts = P.userCharts || {}; P.userCharts[s.id] = info.chart; }
  return s;
}

async function importMany(files) {
  if (!files.length) return;
  const matched = [], extra = [];
  for (const f of files) {
    const shared = songFromShare(await readShareInfo(f));
    if (shared) { matched.push([shared, f]); continue; }
    const s = matchSong(f.name, allSongs());
    if (s) matched.push([s, f]); else extra.push(f);
  }
  // si no se reconoce por el nombre, se pregunta qué canción es
  for (const f of extra) {
    const chosen = await askWhichSong(f.name, matched.map(m => m[0].id));
    if (chosen) { matched.push([songById(chosen), f]); continue; }
    const title = f.name.replace(/\.[a-z0-9]+$/i, '').replace(/[_]+/g, ' ').replace(/^\s*\d+[\s.-]+/, '').trim().slice(0, 60) || 'Canción';
    const s = { id: 'c-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title, artist: 'Personal', theme: 'SPECIAL' };
    P.customSongs.push(s);
    matched.push([s, f]);
  }
  save();
  toast(`Importando ${matched.length} canción(es)…`);
  for (const [s, f] of matched) {
    try { await storeAudio(s.id, f); } catch { toast('Error con ' + f.name); }
  }
  rSongs();
  // analiza en segundo plano, de una en una
  for (const [s] of matched) {
    try { await getAnalysis(s.id); } catch (e) { console.error(e); }
  }
  toast('¡Canciones listas!');
}

// Ventana: "¿Qué canción es este archivo?" -> id del catálogo o null (canción extra)
function askWhichSong(fileName, taken = []) {
  return new Promise(resolve => {
    const opts = SONGS.filter(x => !taken.includes(x.id))
      .map(x => `<option value="${x.id}">${esc(x.title)}${loaded.has(x.id) ? ' (ya cargada: se sustituye)' : ''}</option>`).join('');
    modal(`<h2>¿Qué canción es?</h2>
      <p>No reconozco <b>${esc(fileName)}</b> por su nombre. Elige cuál es:</p>
      <select class="pick" id="pickSong"><option value="">— Es otra canción (añadir como extra) —</option>${opts}</select>
      <button class="btn primary" data-act="ok">Aceptar</button>`, el => {
      el.querySelector('[data-act=ok]').onclick = () => { const v = el.querySelector('#pickSong').value || null; modalOnClose = null; closeModal(); resolve(v); };
    }, () => resolve(null));
  });
}
// Mueve el audio de una canción extra a su sitio en la lista
async function reassignSong(fromId, toId) {
  const rec = await idb.get('audio', fromId);
  if (!rec) return;
  await idb.put('audio', toId, rec);
  await idb.del('audio', fromId); await idb.del('analysis', fromId); await idb.del('analysis', toId);
  loaded.delete(fromId); loaded.add(toId); levels.delete(fromId); levels.delete(toId); bufCache.delete(fromId); bufCache.delete(toId);
  P.customSongs = P.customSongs.filter(x => x.id !== fromId);
  for (const k of Object.keys(P.records)) if (k.startsWith(fromId + '|')) delete P.records[k];
  save();
}

function onSongClick(e) {
  if (e.target.closest('label')) return;
  const row = e.target.closest('.song');
  if (!row || !row.classList.contains('ready')) return;
  if (analyzing.has(row.dataset.id)) return;
  songSheet(row.dataset.id);
}

async function songSheet(id) {
  const s = songById(id);
  const th = THEMES[s.theme] || THEMES.SPECIAL;
  const d = diffInfo(diff);
  const dp = deckPower(P, s.theme);
  const rec = P.records[id + '|' + diff];
  const lv = levels.get(id);
  modal(`
    <div class="sheet-head" style="--c1:${th.c1};--c2:${th.c2}">
      <div class="song-jacket big"><span>${esc(th.short)}</span></div>
      <div>
        <h2>${esc(s.title)}</h2>
        <div class="muted">${esc(s.artist || '')} · ${esc(th.name)}${th.year ? ' (' + th.year + ')' : ''}</div>
      </div>
    </div>
    <div class="sheet-row"><span>Dificultad</span><b style="color:${d.color}">${d.name}${lv ? ' ★' + lv[diff] : ''}</b></div>
    <div class="sheet-row"><span>Mejor puntuación</span><b>${rec ? fmt(rec.score) + ' · ' + rec.rank : '—'}</b></div>
    <div class="sheet-row"><span>Bonus de tu mazo en esta canción</span><b style="color:var(--gold)">+${deckBonusPct(s.theme)}% puntos</b></div>
    <div class="deck-mini">${P.deck.map(uid => cardHTML(P.cards.find(c => c.uid === uid), { size: 'xs', songTheme: s.theme })).join('')}</div>
    <div class="row2">
      <button class="btn ghost" data-act="auto">Mazo automático</button>
      <button class="btn ghost" data-act="remove">Quitar audio</button>
    </div>
    <div class="row2"><button class="btn ghost" data-act="share">📤 Enviar canción a alguien</button></div>
    ${id.startsWith('c-') ? '<div class="row2"><button class="btn ghost" data-act="assign">Es una canción de la lista…</button>' : '<div class="row2" hidden>'}
    </div>
    <div class="rec-box">
      ${P.userCharts && P.userCharts[id] ? `<div class="mine">✋ Se juega con <b>tu partitura</b> (${P.userCharts[id].notes.length} notas)</div>` : '<div class="muted small">¿No te convence cómo caen las notas? Grábalas tú.</div>'}
      <div class="row2">
        <button class="btn ghost" data-act="rec">🎙 Grabar partitura</button>
        ${P.userCharts && P.userCharts[id] ? '<button class="btn ghost" data-act="recdel">Borrar la mía</button><button class="btn ghost" data-act="recexp">Exportar</button>' : ''}
      </div>
    </div>
    <button class="btn primary huge" data-act="start">EMPEZAR</button>
  `, el => {
    el.querySelector('[data-act=start]').onclick = () => { closeModal(); startSong(id); };
    el.querySelector('[data-act=auto]').onclick = () => { autoDeck(P, s.theme); save(); songSheet(id); };
    el.querySelector('[data-act=rec]').onclick = () => { closeModal(); recordSetup(id); };
    const del = el.querySelector('[data-act=recdel]');
    if (del) del.onclick = () => confirmBox('¿Borrar tu partitura de esta canción? Volverá la automática.', () => { delete P.userCharts[id]; save(); toast('Borrada'); });
    const exp = el.querySelector('[data-act=recexp]');
    if (exp) exp.onclick = () => {
      const blob = new Blob([JSON.stringify({ id, ...P.userCharts[id] })], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `partitura-${id}.json`; a.click();
      toast('Descargada. Pásamela y la meto en el juego para siempre.');
    };
    const asg = el.querySelector('[data-act=assign]');
    if (asg) asg.onclick = async () => {
      closeModal();
      const to = await askWhichSong(s.title);
      if (!to) return;
      await reassignSong(id, to);
      rSongs(); toast(`Ahora es «${songById(to).title}». Analizando…`);
      try { await getAnalysis(to); } catch {}
    };
    el.querySelector('[data-act=share]').onclick = () => shareSong(id);
    el.querySelector('[data-act=remove]').onclick = async () => {
      await idb.del('audio', id); await idb.del('analysis', id);
      loaded.delete(id); levels.delete(id); bufCache.delete(id);
      if (id.startsWith('c-')) { P.customSongs = P.customSongs.filter(x => x.id !== id); save(); }
      closeModal(); rSongs();
    };
  });
}

// Enviar una canción por privado (WhatsApp, Telegram…): un MP3 que el otro juego reconoce solo
async function shareSong(id) {
  const s = songById(id), rec = await idb.get('audio', id);
  if (!rec) { toast('Esta canción no tiene audio cargado'); return; }
  const mine = P.userCharts && P.userCharts[id];
  const doIt = async () => {
    loading(true, 'Preparando…');
    let file;
    try {
      file = isMp3(rec.name, rec.blob.type)
        ? buildShareFile(await rec.blob.arrayBuffer(), { song: { id: s.id, title: s.title, artist: s.artist, theme: s.theme }, chart: mine || null })
        : new File([rec.blob], rec.name || s.title, { type: rec.blob.type });
    } finally { loading(false); }
    const r = await sendFile(file, `«${s.title}» para SUPERSTAR: ábrelo en el juego con «Importar canciones».`);
    if (r === 'downloaded') toast('Guardada en Descargas: mándala por WhatsApp como documento');
  };
  modal(`<h2>📤 Enviar «${esc(s.title)}»</h2>
    <p>Se prepara un archivo de música con la canción${mine ? ' y <b>tu partitura grabada</b>' : ''}. Mándalo por privado (WhatsApp, Telegram…) a quien quieras.</p>
    <p class="muted">La otra persona abre SUPERSTAR, va a <b>Canciones → Importar canciones</b> y elige el archivo: se coloca sola en su sitio${mine ? ' con tu partitura' : ''}. Sus puntuaciones y cartas son suyas.</p>
    <p class="muted small">Es solo para compartir en privado, sin fines comerciales: la música es de sus autores.</p>
    <button class="btn primary" data-act="go">Enviar</button>
    <button class="btn ghost" data-close>Cancelar</button>`, el => {
    el.querySelector('[data-act=go]').onclick = () => { closeModal(); doIt(); };
  });
}

// ---------------- jugar ----------------
// Partitura a usar: la grabada por ti > la preparada (sigue la voz) > la automática
async function chartFor(id, buf, an, { ignoreUser = false } = {}) {
  const prep = await getPrepared(id);
  // todos los niveles usan la misma partitura (la de 4 botones); sólo cambia la velocidad
  const usePrep = prep && prep.charts.normal && Math.abs(prep.duration - buf.duration) < 1.5;
  const base = usePrep
    ? { ...prep.charts.normal, bpm: prep.bpm, phase: prep.phase, beats: prep.beats, intensity: prep.intensity, start: prep.start || 0, end: prep.end }
    : makeChart(an, 'normal', id);
  const mine = !ignoreUser && P.userCharts && P.userCharts[id];
  if (mine && Math.abs((mine.duration || buf.duration) - buf.duration) < 1.5) return { ...base, notes: mine.notes, lanes: mine.lanes || 4, mine: true };
  return base;
}
async function startSong(id, { free = false, chartOverride = null } = {}) {
  tickHP();
  const d = diffInfo(diff);
  // sin auriculares: se puede jugar todas las veces que quiera
  const s = songById(id);
  loading(true, 'Cargando…');
  let buf, an;
  try {
    buf = await getBuffer(id);
    an = await getAnalysis(id);
  } catch (e) {
    console.error(e); loading(false); toast('No se pudo cargar la canción'); return;
  }
  loading(false);
  const chart = chartOverride || await chartFor(id, buf, an);
  const th = THEMES[s.theme] || THEMES.SPECIAL;
  const dp = deckPower(P, s.theme);
  const maxScore = Math.round(BASE_MAX_SCORE[diff] * (1 + dp / 6000));
  lastPlay = { id, diff, maxScore };

  screen = 'play';
  document.body.dataset.screen = 'play';
  $('#nav').hidden = true; $('#topbar').hidden = true;
  const play = $('#play');
  play.hidden = false;
  play.style.setProperty('--c1', th.c1); play.style.setProperty('--c2', th.c2);
  $('#playTitle').textContent = s.title;
  $('#playDiff').textContent = d.name;
  $('#playDiff').style.color = d.color;
  $('#pauseMenu').hidden = true;
  ensureCtx();
  await ensureLandscape();
  game = new Game($('#cv'), {
    ctx, buffer: buf, chart, settings: P.settings, maxScore, title: s.title, theme: th, speedMul: d.speed, diff: d.id,
    deck: P.deck.map(uid => P.cards.find(c => c.uid === uid)).filter(Boolean).map(c => { const m = memberById(c.member); return { photo: cardPhoto(c), name: m.name, grade: c.grade }; }),
    bgPhotos: MEMBERS.map(m => m.photo),
    onEnd: res => endSong(res),
    onPause: () => togglePause(),
  });
  await deckIntro(s, th);
  game.start();
}

// Antes de empezar: aparece tu mazo, brillan las cartas de la misma era que la canción
// (con su rango) y se suma el bonus de puntos que te dan.
function deckIntro(s, th) {
  const cards = P.deck.map(uid => P.cards.find(c => c.uid === uid)).filter(Boolean);
  if (!cards.length) return Promise.resolve();
  const era = s.theme, eraTh = THEMES[era] || THEMES.SPECIAL;
  const pct = c => cardPower(c, era) / 6000 * 100;
  const match = cards.filter(c => c.theme === era);
  const total = deckBonusPct(era);
  const ov = document.createElement('div');
  ov.id = 'deckIntro';
  ov.style.setProperty('--c2', th.c2);
  ov.innerHTML = `
    <div class="di-era">${esc(eraTh.name)}${eraTh.year ? ' · ' + eraTh.year : ''}</div>
    <div class="di-title">${esc(s.title)}</div>
    <div class="di-row">${cards.map(c => `<div class="di-slot"><div class="di-pct">+${pct(c).toFixed(1)}%</div>${cardHTML(c, { size: 'sm', songTheme: era })}</div>`).join('')}</div>
    <div class="di-combo"></div>
    <div class="di-total">+0%<small>PUNTOS DE TU MAZO</small></div>
    <div class="di-skip">Toca para empezar</div>`;
  $('#app').appendChild(ov);
  const slots = [...ov.querySelectorAll('.di-slot')], tot = ov.querySelector('.di-total'), combo = ov.querySelector('.di-combo');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const chime = (f, t = 0.18) => { try { const c = ensureCtx(), o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(0.18, c.currentTime + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t); o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + t + 0.05); } catch {} };
  let skip = false, run = 0;
  const setTot = v => { tot.firstChild.textContent = '+' + Math.round(v) + '%'; };
  return new Promise(async resolve => {
    const end = async () => { if (ov.classList.contains('out')) return; ov.classList.add('out'); await wait(450); ov.remove(); resolve(); };
    ov.addEventListener('pointerdown', () => { skip = true; end(); });
    for (const el of slots) { if (skip) return; el.classList.add('in'); await wait(90); }
    await wait(250);
    // primero las que no son de la era (suman poco), luego brillan una a una las que hacen combo
    cards.forEach((c, i) => { if (c.theme !== era) { slots[i].classList.add('dim', 'show'); run += pct(c); } });
    setTot(run);
    await wait(350);
    let k = 0;
    for (let i = 0; i < cards.length; i++) {
      if (skip) return;
      if (cards[i].theme !== era) continue;
      slots[i].classList.add('hit', 'show');
      run += pct(cards[i]); setTot(run);
      chime(660 * Math.pow(1.1225, k++));
      await wait(380);
    }
    combo.textContent = match.length
      ? `${match.length} carta${match.length > 1 ? 's' : ''} de ${eraTh.short} · x1.5${match.length >= 4 ? ` · ¡COMBO DE ERA +${5 * (match.length - 3)}%!` : ''}`
      : `Ninguna carta de ${eraTh.short}: consíguelas en los sobres`;
    setTot(total);
    if (match.length) chime(1320, 0.4);
    await wait(1400);
    end();
  });
}

// El juego es solo en horizontal: en la app instalada se bloquea en horizontal; en el navegador,
// si el móvil está en vertical, una capa pide girarlo (CSS #turn).
async function ensureLandscape() {
  try { if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); } catch {}
}
function leaveLandscape() {}

// ---------------- grabar partitura ----------------
async function recordSetup(id) {
  const s = songById(id);
  loading(true, 'Cargando…');
  let buf, an;
  try { buf = await getBuffer(id); an = await getAnalysis(id); } catch { loading(false); toast('No se pudo cargar la canción'); return; }
  loading(false);
  const base = await chartFor(id, buf, an);
  const st = Math.floor(base.start || 0), en = Math.floor(base.end || buf.duration);
  const fmtT = x => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
  modal(`<h2>🎙 Grabar «${esc(s.title)}»</h2>
    <p>Toca los botones <b>al ritmo de la voz</b>, como si cantaras con los dedos. Mantén pulsado para una nota larga; arrástralo a otro botón para un slide.
    No te preocupes por la precisión: <b>el juego cuadra tus toques al compás</b>. Para terminar, pulsa el botón de pausa.</p>
    <label class="set"><span>Empezar desde <b id="recFromL">${fmtT(st)}</b></span>
      <input type="range" id="recFrom" min="${st}" max="${Math.max(st, en - 5)}" step="1" value="${st}">
      <small class="muted">Puedes grabar sólo un trozo (por ejemplo el rap): el resto de la partitura no se toca.</small></label>
    <label class="set row"><span>Velocidad lenta (75%)</span><input type="checkbox" id="recSlow" checked></label>
    <label class="set row"><span>Mostrar guía en gris</span><input type="checkbox" id="recGuide" checked></label>
    <button class="btn primary huge" data-act="go">● GRABAR</button>`, el => {
    const r = el.querySelector('#recFrom');
    r.oninput = () => { el.querySelector('#recFromL').textContent = fmtT(+r.value); };
    el.querySelector('[data-act=go]').onclick = () => {
      const from = +r.value, slow = el.querySelector('#recSlow').checked, guide = el.querySelector('#recGuide').checked;
      closeModal();
      startRecording(id, buf, an, base, { from, rate: slow ? 0.75 : 1, guide });
    };
  });
}

async function startRecording(id, buf, an, base, { from, rate, guide }) {
  const s = songById(id), th = THEMES[s.theme] || THEMES.SPECIAL;
  recState = { id, buf, an, base, from, rate, guide };
  screen = 'play'; document.body.dataset.screen = 'play';
  $('#nav').hidden = true; $('#topbar').hidden = true;
  const play = $('#play'); play.hidden = false;
  play.style.setProperty('--c1', th.c1); play.style.setProperty('--c2', th.c2);
  $('#pauseMenu').hidden = true;
  ensureCtx();
  await ensureLandscape();
  game = new Game($('#cv'), {
    ctx, buffer: buf, settings: { ...P.settings, sfx: true }, maxScore: 1, title: s.title, theme: th,
    chart: { lanes: 13, notes: [], bpm: base.bpm, phase: base.phase, beats: base.beats, intensity: base.intensity, start: from, end: base.end },
    record: true, rate, guide: guide ? base.notes : [], guideLanes: base.lanes,
    deck: [], bgPhotos: MEMBERS.map(m => m.photo),
    onEnd: res => finishRecording(res),
  });
  game.start();
}

function finishRecording({ recorded, from, to }) {
  const { id, buf, an, base } = recState;
  quitGame();
  // cuadrar al compás: semicorcheas de los pulsos reales (si el toque cae cerca)
  const beats = base.beats && base.beats.length > 8 ? base.beats : (an.beats || []);
  const grid = beatGrid(beats, 4);
  const snap = t => { const g = nearestIn(grid, t); return Math.abs(g - t) <= 0.075 ? g : t; };
  let notes = recorded.map(n => {
    const o = { t: +snap(n.t).toFixed(3), lane: n.lane };
    if (n.end) { o.end = +Math.max(snap(n.end), o.t + 0.25).toFixed(3); if (n.lane2 !== undefined) o.lane2 = n.lane2; }
    return o;
  }).sort((a, b) => a.t - b.t || a.lane - b.lane);
  // quita toques dobles accidentales (mismo botón casi a la vez) y notas imposibles (< 90 ms)
  const clean = [];
  for (const n of notes) {
    const prev = clean.filter(x => n.t - x.t < 0.09);
    if (prev.some(x => x.lane === n.lane)) continue;
    if (prev.length >= 2) continue;
    clean.push(n);
  }
  // mezcla: lo grabado sustituye a lo que había entre "from" y "to"
  const prevC = P.userCharts && P.userCharts[id] ? P.userCharts[id] : base;
  const kL = 12 / Math.max(1, (prevC.lanes || 4) - 1);
  const toP = l => (prevC.lanes === 13 ? l : Math.round(l * kL));
  const old = prevC.notes.filter(n => n.t < from - 0.05 || n.t > to + 0.05).map(n => {
    const o = { ...n, lane: toP(n.lane) };
    if (n.lane2 !== undefined) o.lane2 = toP(n.lane2);
    if (n.path) o.path = n.path.map(([t, l]) => [t, toP(l)]);
    return o;
  });
  const merged = [...old, ...clean].sort((a, b) => a.t - b.t || a.lane - b.lane);
  pendingRec = { id, notes: merged, lanes: 13, duration: buf.duration };
  const fmtT = x => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
  go('songs');
  modal(`<h2>Grabación lista</h2>
    <p>Has grabado <b>${clean.length} notas</b> entre ${fmtT(from)} y ${fmtT(to)}${clean.length < recorded.length ? ` (quité ${recorded.length - clean.length} toques dobles)` : ''}. Ya están cuadradas al compás.</p>
    <button class="btn primary" data-act="try">▶ Probarla</button>
    <div class="row2"><button class="btn ghost" data-act="again">Repetir</button><button class="btn ghost" data-act="keep">💾 Guardar</button></div>
    <button class="btn ghost" data-close>Descartar</button>`, el => {
    el.querySelector('[data-act=try]').onclick = async () => {
      closeModal();
      const ch = { ...(await chartFor(id, buf, an, { ignoreUser: true })), notes: pendingRec.notes, lanes: pendingRec.lanes };
      afterTry = id;
      startSong(id, { free: true, chartOverride: ch });
    };
    el.querySelector('[data-act=again]').onclick = () => { closeModal(); recordSetup(id); };
    el.querySelector('[data-act=keep]').onclick = () => saveRec();
  });
}
function saveRec() {
  if (!pendingRec) return;
  P.userCharts = P.userCharts || {};
  P.userCharts[pendingRec.id] = { notes: pendingRec.notes, lanes: pendingRec.lanes, duration: pendingRec.duration, date: Date.now() };
  save(); closeModal(); if (screen === 'songs') rSongs(); toast('¡Guardada! Ahora esta canción se juega con tu partitura.');
  pendingRec = null;
}

function togglePause(force) {
  if (!game || game.ended) return;
  const pm = $('#pauseMenu');
  if (game.paused && force !== true) { pm.hidden = true; game.resume(); }
  else { game.pause(); pm.hidden = false; }
}
function quitGame(keepOrientation = false) {
  if (game) { game.destroy(); game = null; }
  $('#play').hidden = true;
  if (!keepOrientation) leaveLandscape();
}

function rankOf(ratio) { return ratio >= 0.88 ? 'S' : ratio >= 0.78 ? 'A' : ratio >= 0.66 ? 'B' : ratio >= 0.5 ? 'C' : 'D'; }

function endSong(res) {
  if (afterTry && pendingRec) {
    const id = afterTry; afterTry = null; quitGame(); go('songs');
    modal(`<h2>¿Qué tal ha ido?</h2><p>Has acertado ${res.counts[0] + res.counts[1] + res.counts[2]} de ${res.total} notas.</p>
      <button class="btn primary" data-act="keep">💾 Guardar esta partitura</button>
      <div class="row2"><button class="btn ghost" data-act="again">Repetir grabación</button><button class="btn ghost" data-close>Descartar</button></div>`, el => {
      el.querySelector('[data-act=keep]').onclick = () => saveRec();
      el.querySelector('[data-act=again]').onclick = () => { closeModal(); recordSetup(id); };
    });
    return;
  }
  const { id, diff: dId, maxScore } = lastPlay;
  quitGame();
  const key = id + '|' + dId;
  const prev = P.records[key];
  const rank = rankOf((res.baseScore ?? res.score) / maxScore);
  const isNew = !prev || res.score > prev.score;
  P.records[key] = {
    score: Math.max(res.score, prev ? prev.score : 0),
    rank: isNew ? rank : prev.rank,
    fc: res.fc || (prev && prev.fc) || false,
    ap: res.ap || (prev && prev.ap) || false,
    plays: (prev ? prev.plays : 0) + 1,
  };
  const dIdx = DIFFS.findIndex(d => d.id === dId);
  const rp = Math.round(res.score / 350) + (res.fc ? 300 : 0) + (res.ap ? 700 : 0);
  const exp = 30 + dIdx * 20 + Math.round(res.ratio * 40);
  P.rp += rp;
  const ups = addExp(exp);
  save();
  go('result', { ...res, rank, isNew, rp, exp, ups, id, dId, deckPct: deckBonusPct(songById(id).theme) });
}

function rResult(r) {
  const s = songById(r.id);
  const d = diffInfo(r.dId);
  const rows = ['S.PERFECT', 'PERFECT', 'GOOD', 'BAD', 'MISS'];
  view.innerHTML = `
  <div class="result">
   <div class="res-left">
    <div class="res-song">${esc(s.title)} <span style="color:${d.color}">${d.name}</span></div>
    <div class="res-rank r-${r.rank}">${r.rank}</div>
    ${r.ap ? '<div class="badge holo">ALL S.PERFECT</div>' : r.fc ? '<div class="badge">FULL COMBO</div>' : ''}
    <div class="res-score">${fmt(r.score)}${r.isNew ? '<span class="newrec">NEW RECORD</span>' : ''}</div>
    ${r.bonus ? `<div class="muted small">incluye RAVE BONUS +${fmt(r.bonus)}</div>` : ''}
   </div>
   <div class="res-right">
    <div class="res-grid">
      ${rows.map((n, i) => `<div class="jr j${i}"><span>${n}</span><b>${r.counts[i]}</b></div>`).join('')}
      <div class="jr"><span>MAX COMBO</span><b>${r.maxCombo}</b></div>
    </div>
    ${r.deckPct ? `<div class="muted small">Tu mazo sumó +${r.deckPct}% a la puntuación</div>` : ''}
    <div class="res-rew">
      <div>♪ +${fmt(r.rp)} RP</div><div>EXP +${r.exp}</div>
    </div>
    ${r.ups ? `<div class="levelup">¡SUBES A NIVEL ${P.level}! Recompensa: ${lastRewards.map(x => x.text).join(' · ')}<br><small>Recógela tocando tu nivel arriba</small></div>` : ''}
    <div class="row2">
      <button class="btn ghost" data-act="retry">Reintentar</button>
      <button class="btn primary" data-act="ok">Continuar</button>
    </div>
   </div>
  </div>`;
  view.querySelector('[data-act=ok]').onclick = () => go('songs');
  view.querySelector('[data-act=retry]').onclick = () => { diff = r.dId; startSong(r.id); };
}

// ---------------- mazo ----------------
// filtro de la colección: se reinicia cada vez que se entra en «Cartas» desde otra pantalla
let deckFilter = { sort: 'desc', era: null };
const GR = ['C', 'B', 'A', 'S', 'R'];
function rDeck() {
  const f = deckFilter;
  let cards = [...P.cards];
  if (f.era) cards = cards.filter(c => c.theme === f.era);
  const dir = f.sort === 'asc' ? 1 : -1;
  cards.sort((a, b) => dir * (GR.indexOf(a.grade) - GR.indexOf(b.grade)) || dir * (a.lvl - b.lvl) || cardPower(b) - cardPower(a));
  const eras = ERAS.filter(e => P.cards.some(c => c.theme === e));
  view.innerHTML = `
  <div class="deck">
    <div class="deck-head">
      <div><div class="muted small">PODER DEL MAZO</div><div class="big">${fmt(deckPower(P))}</div></div>
      <button class="btn ghost small" data-act="auto">Auto</button>
    </div>
    <div class="mazo-bonus"><b>¿Para qué sirven?</b> Las 7 cartas del mazo suman poder, y el poder sube tu puntuación: ahora mismo <b>+${deckBonusPct()}%</b>.<br>
      • Rango más alto (C → B → A → S → R) = más poder. • Las repetidas suben de nivel la carta.<br>
      • Cartas de la <b>misma era</b> que la canción valen <b>x1.5</b>. • 4 o más de la misma era: bonus extra.</div>
    <p class="hint">Toca una carta del mazo para cambiarla.</p>
    <div class="deck-slots">
      ${P.deck.map((uid, i) => cardHTML(P.cards.find(c => c.uid === uid), { size: 'sm', extra: `data-slot="${i}"` })).join('')}
    </div>
    <h3>Colección <span class="muted">(${cards.length}${f.era ? ' de ' + P.cards.length : ''})</span></h3>
    <div class="filters">
      <div class="f-row"><span class="muted small">Calidad</span>
        <button class="chip ${f.sort === 'desc' ? 'on' : ''}" data-sort="desc">Mayor a menor</button>
        <button class="chip ${f.sort === 'asc' ? 'on' : ''}" data-sort="asc">Menor a mayor</button></div>
      <div class="f-row"><span class="muted small">Época</span>
        <button class="chip ${!f.era ? 'on' : ''}" data-era="">Todas</button>
        ${eras.map(e => `<button class="chip ${f.era === e ? 'on' : ''}" data-era="${e}" style="--c1:${THEMES[e].c1};--c2:${THEMES[e].c2}">${esc(THEMES[e].short)} <small>${THEMES[e].year}</small></button>`).join('')}</div>
    </div>
    <div class="collection">
      ${cards.length ? cards.map(c => cardHTML(c, { size: 'sm', extra: `data-uid="${c.uid}"` }).replace('class="card', `class="card${P.deck.includes(c.uid) ? ' in-deck' : ''}`)).join('') : '<p class="muted">Aún no tienes cartas aquí. Abre sobres en la Tienda.</p>'}
    </div>
  </div>`;
  view.querySelector('[data-act=auto]').onclick = () => { autoDeck(P); save(); rDeck(); };
  view.querySelectorAll('[data-slot]').forEach(el => el.onclick = () => swapView(+el.dataset.slot));
  view.querySelectorAll('[data-sort]').forEach(el => el.onclick = () => { f.sort = el.dataset.sort; rDeck(); });
  view.querySelectorAll('[data-era]').forEach(el => el.onclick = () => { f.era = el.dataset.era || null; rDeck(); });
  view.querySelectorAll('[data-uid]').forEach(el => el.onclick = () => cardInfo(+el.dataset.uid));
}
// Cambiar una carta del mazo (como los mazos de Clash Royale): la carta elegida en grande
// y abajo todas las demás para deslizar y elegir con cuál cambiarla.
function swapView(slot) {
  const cur = P.cards.find(c => c.uid === P.deck[slot]);
  const others = P.cards.filter(c => c.uid !== P.deck[slot])
    .sort((a, b) => (P.deck.includes(a.uid) - P.deck.includes(b.uid)) || cardPower(b) - cardPower(a));
  const ov = document.createElement('div');
  ov.className = 'swap';
  const m = cur && memberById(cur.member);
  ov.innerHTML = `
    <button class="back-btn" data-back aria-label="Volver"><svg viewBox="0 0 48 40" aria-hidden="true"><defs><linearGradient id="bkg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7bdcff"/><stop offset=".5" stop-color="#b56bff"/><stop offset="1" stop-color="#ff5fc8"/></linearGradient></defs><path d="M20 3 3 20l17 17v-10h25V13H20z" fill="url(#bkg)" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><circle cx="31" cy="17" r="1.3" fill="#fff"/><circle cx="38" cy="23" r="1" fill="#fff" opacity=".8"/><circle cx="25" cy="23" r=".9" fill="#fff" opacity=".7"/></svg></button>
    <div class="swap-top">
      <div class="swap-cur">${cardHTML(cur, { size: 'lg' })}</div>
      <div class="swap-info">
        ${cur ? `<h2>${esc(m.name)}</h2><div class="muted">${esc(THEMES[cur.theme].name)} · ${THEMES[cur.theme].year}</div>
          <p>Rango <b>${cur.grade}</b> · Nivel ${cur.lvl}/${GRADE_INFO[cur.grade].maxLvl} · Poder <b>${fmt(cardPower(cur))}</b></p>
          <button class="btn ghost small" data-remove>Quitar del mazo</button>` : '<h2>Hueco libre</h2>'}
        <p class="hint">Desliza las cartas de abajo y toca la que quieras poner en su lugar.</p>
      </div>
    </div>
    <div class="swap-list">${others.length ? others.map(c => `<div class="swap-item" data-uid="${c.uid}">${cardHTML(c, { size: 'sm' }).replace('class="card', `class="card${P.deck.includes(c.uid) ? ' in-deck' : ''}`)}<div class="swap-pow">${fmt(cardPower(c))}</div></div>`).join('') : '<p class="muted">No tienes más cartas. Abre sobres en la Tienda.</p>'}</div>`;
  $('#app').appendChild(ov);
  const close = () => { ov.remove(); rDeck(); };
  ov.querySelector('[data-back]').onclick = close;
  const rm = ov.querySelector('[data-remove]'); if (rm) rm.onclick = () => { P.deck[slot] = null; save(); close(); };
  // deslizar con el dedo sin que cuente como toque
  const list = ov.querySelector('.swap-list');
  let downX = 0, moved = false;
  list.addEventListener('pointerdown', e => { downX = e.clientX + e.clientY; moved = false; });
  list.addEventListener('pointermove', e => { if (Math.abs(e.clientX + e.clientY - downX) > 8) moved = true; });
  ov.querySelectorAll('.swap-item').forEach(el => el.onclick = () => {
    if (moved) return;
    const uid = +el.dataset.uid, already = P.deck.indexOf(uid);
    if (already >= 0) P.deck[already] = P.deck[slot];   // si ya estaba en el mazo, se intercambian
    P.deck[slot] = uid; save(); close();
  });
}
function cardInfo(uid) {
  const c = P.cards.find(x => x.uid === uid);
  const m = memberById(c.member);
  modal(`${cardHTML(c, { size: 'lg' })}
    <h2>${esc(m.name)} · ${esc(THEMES[c.theme].name)}</h2>
    <p>Rango <b>${c.grade}</b> · Nivel ${c.lvl}/${GRADE_INFO[c.grade].maxLvl} · Poder ${fmt(cardPower(c))}</p>
    <p class="muted">Para ponerla en el mazo, toca la carta del mazo que quieras cambiar.</p>
    <button class="btn primary" data-close>Vale</button>`);
}

// ---------------- tienda ----------------
function rShop() {
  view.innerHTML = `
  <div class="shop">
    <div class="pack">
      <div class="pack-art"><div class="pack-logo">SUPERSTAR</div><div class="pack-sub">CARD PACK</div></div>
      <div class="odds">${Object.entries(GRADE_INFO).reverse().map(([g, i]) => `<span class="grade-chip" style="--gc:${i.color}">${g} ${+(i.odds * 100).toFixed(1)}%</span>`).join('')}</div>
      ${P.freePacks ? `<button class="btn primary free" data-free>Abrir ${P.freePacks > 1 ? `mis ${P.freePacks} sobres gratis` : 'mi sobre gratis'}</button>` : ''}
      <button class="btn primary" data-n="1" ${P.rp < PACK_COST ? 'disabled' : ''}>Abrir 1 · ${PACK_COST ? '♪ ' + fmt(PACK_COST) : 'GRATIS'}</button>
      <button class="btn ghost" data-n="5" ${P.rp < PACK_COST * 5 ? 'disabled' : ''}>Abrir 5 · ${PACK_COST ? '♪ ' + fmt(PACK_COST * 5) : 'GRATIS'}</button>
    </div>
    <p class="hint">Cada sobre trae 1 carta (50 %), 2 (30 %) o 3 (20 %). Toca cada carta 3 veces: si sube de rango, vuelve a tocarla 3 veces. Las repetidas suben de nivel a la original. Gana RP jugando canciones.</p>
  </div>`;
  view.querySelectorAll('[data-n]').forEach(b => b.onclick = () => {
    const n = +b.dataset.n;
    if (P.rp < PACK_COST * n) return;
    confirmBox(n > 1 ? '¿Seguro que quieres comprar 5 sobres?' : '¿Seguro que quieres comprar un sobre?', () => buyPacks(n), { no: 'No', ok: 'Sí', okClass: 'primary' });
  });
  view.querySelectorAll('[data-free]').forEach(b => b.onclick = () => openFreePacks(P.freePacks).then(() => rShop()));
  const buyPacks = (n, free = false) => {
    if (free) { if ((P.freePacks || 0) < n) return; P.freePacks -= n; }
    else { if (P.rp < PACK_COST * n) return; P.rp -= PACK_COST * n; }
    // cada sobre trae 1, 2 o 3 cartas; «Abrir 5» junta las de los 5 sobres en una sola apertura
    const got = Array.from({ length: n }, () => openPack(P)).flat();
    save(); renderTop();
    openDrop(got, { cardHTML, packs: n }).then(() => rShop());
  };
}

// ---------------- ajustes ----------------
function rSettings() {
  const S = P.settings;
  view.innerHTML = `
  <div class="settings">
    <label class="set"><span>Nombre</span><input type="text" maxlength="16" value="${esc(P.name)}" data-k="name"></label>
    <label class="set"><span>Velocidad de notas <b id="v-speed">${S.speed}</b></span><input type="range" min="1" max="10" step="1" value="${S.speed}" data-s="speed"></label>
    <label class="set"><span>Ajuste de sincronía <b id="v-offset">${S.offset} ms</b></span><input type="range" min="-400" max="200" step="5" value="${S.offset}" data-s="offset">
      <small class="muted">Si las notas llegan antes que la música, súbelo; si llegan tarde, bájalo.</small></label>
    <button class="btn primary" data-act="calib">🎧 Calibrar sincronía (recomendado)</button>
    <label class="set"><span>Volumen música <b id="v-music">${Math.round(S.music * 100)}%</b></span><input type="range" min="0" max="1" step="0.05" value="${S.music}" data-s="music"></label>
    <label class="set row"><span>Sonido al tocar</span><input type="checkbox" ${S.sfx ? 'checked' : ''} data-s="sfx"></label>
    <label class="set"><span>Volumen toque <b id="v-sfxVol">${Math.round(S.sfxVol * 100)}%</b></span><input type="range" min="0" max="1" step="0.05" value="${S.sfxVol}" data-s="sfxVol"></label>
    <label class="set row"><span>Efectos de partículas</span><input type="checkbox" ${S.fx ? 'checked' : ''} data-s="fx"></label>
    <div class="set"><span>Controles con teclado</span><small class="muted">EASY: F · Espacio · J — NORMAL: D F J K — HARD: S D F Espacio J K L — Pausa: Esc</small></div>
    <button class="btn ghost" data-act="clearAudio">Borrar canciones guardadas</button>
    <button class="btn danger" data-act="reset">Reiniciar todo el progreso</button>
    <div class="credits"><b>Fotos</b> (Wikimedia Commons, recortadas):<br>${[...PHOTO_CREDITS, ...CARD_CREDITS].map(c => `${esc(c.member)}${c.era ? ' · ' + esc(THEMES[c.era].short) : ''}: <a href="https://commons.wikimedia.org/wiki/File:${encodeURIComponent(c.file.replace(/ /g, '_'))}" target="_blank" rel="noopener">${esc(c.author)}</a>, ${esc(c.license)}`).join('<br>')}</div>
    <p class="about">Remake personal hecho con cariño, inspirado en un juego de ritmo que ya no existe. Las canciones las pones tú y se quedan sólo en tu dispositivo. Sin afiliación con los artistas ni con la desarrolladora original.</p>
  </div>`;
  view.querySelector('[data-k=name]').onchange = e => { P.name = e.target.value.trim() || 'ARMY'; save(); renderTop(); };
  view.querySelectorAll('[data-s]').forEach(inp => {
    inp.oninput = () => {
      const k = inp.dataset.s;
      const v = inp.type === 'checkbox' ? inp.checked : +inp.value;
      S[k] = v; save();
      const lab = $('#v-' + k);
      if (lab) lab.textContent = k === 'offset' ? v + ' ms' : (k === 'music' || k === 'sfxVol') ? Math.round(v * 100) + '%' : v;
    };
  });
  view.querySelector('[data-act=calib]').onclick = calibrate;
  view.querySelector('[data-act=clearAudio]').onclick = () => confirmBox('¿Borrar todas las canciones guardadas en este dispositivo?', async () => {
    await idb.clear('audio'); await idb.clear('analysis'); loaded.clear(); levels.clear(); bufCache.clear(); toast('Canciones borradas');
  });
  view.querySelector('[data-act=reset]').onclick = () => confirmBox('¿Seguro? Se perderán cartas, récords y nivel.', () => { resetProfile(); P = loadProfile(); save(); go('title'); });
}

// ---------------- calibración de sincronía ----------------
// Suena un clic cada 0,6 s; la jugadora toca al oírlo. El retraso medio (auriculares Bluetooth,
// altavoz, pantalla táctil) se guarda como ajuste para que las notas cuadren con la música.
function calibrate() {
  const c = ensureCtx();
  const N = 16, PER = 0.6;
  const clicks = [], taps = [];
  modal(`<h2>Calibrar sincronía</h2>
    <p>Ponte los auriculares que vayas a usar. Toca el círculo <b>justo cuando oigas cada clic</b>. Son ${N} clics.</p>
    <div class="calib-pad" id="calibPad"><span id="calibN">Prepárate…</span></div>
    <button class="btn ghost" data-close>Cancelar</button>`, el => {
    const pad = el.querySelector('#calibPad'), lab = el.querySelector('#calibN');
    const sr = c.sampleRate, b = c.createBuffer(1, Math.floor(sr * 0.05), sr), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.sin(2 * Math.PI * 1500 * i / sr) * Math.exp(-i / sr * 60);
    const t0 = c.currentTime + 1.2;
    for (let k = 0; k < N; k++) {
      const s2 = c.createBufferSource(); s2.buffer = b; s2.connect(c.destination); s2.start(t0 + k * PER); clicks.push(t0 + k * PER);
    }
    // pulso visual sólo como guía (no se usa para medir)
    let k = 0;
    const iv = setInterval(() => { if (c.currentTime >= t0 + k * PER) { lab.textContent = `${k + 1} / ${N}`; k++; } if (k >= N) clearInterval(iv); }, 10);
    pad.addEventListener('pointerdown', e => {
      e.preventDefault();
      taps.push(c.currentTime);
      pad.classList.remove('hit'); void pad.offsetWidth; pad.classList.add('hit');
    });
    setTimeout(() => {
      clearInterval(iv);
      const deltas = [];
      for (const t of taps) {
        let best = null;
        for (const ck of clicks.slice(3)) if (best === null || Math.abs(t - ck) < Math.abs(t - best)) best = ck;
        if (best !== null && t - best > -0.25 && t - best < 0.5) deltas.push(t - best);
      }
      if (deltas.length < 6) { closeModal(); toast('No se registraron suficientes toques. Prueba otra vez.'); return; }
      deltas.sort((a, b2) => a - b2);
      const med = deltas[Math.floor(deltas.length / 2)];
      const rep = (c.outputLatency || 0) + (c.baseLatency || 0);
      const off = Math.max(-400, Math.min(200, Math.round((rep - med) * 1000 / 5) * 5));
      P.settings.offset = off; save();
      closeModal();
      modal(`<h2>¡Listo!</h2><p>Retraso medido: <b>${Math.round(med * 1000)} ms</b>. Ajuste guardado: <b>${off} ms</b>.</p>
        <p class="muted">Si cambias de auriculares (Bluetooth ↔ cable ↔ altavoz), vuelve a calibrar.</p>
        <button class="btn primary" data-close>Vale</button>`, null, () => { if (screen === 'settings') rSettings(); });
    }, (1.2 + N * PER + 0.6) * 1000);
  });
}

// ---------------- utilidades UI ----------------
let modalOnClose = null;
function modal(html, setup, onClose, { locked = false } = {}) {
  const m = $('#modal');
  m.innerHTML = `<div class="modal-box"><button class="back-btn" data-close aria-label="Volver"><svg viewBox="0 0 48 40" aria-hidden="true"><defs><linearGradient id="bkg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7bdcff"/><stop offset=".5" stop-color="#b56bff"/><stop offset="1" stop-color="#ff5fc8"/></linearGradient></defs><path d="M20 3 3 20l17 17v-10h25V13H20z" fill="url(#bkg)" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><circle cx="31" cy="17" r="1.3" fill="#fff"/><circle cx="38" cy="23" r="1" fill="#fff" opacity=".8"/><circle cx="25" cy="23" r=".9" fill="#fff" opacity=".7"/></svg></button>${html}</div>`;
  m.hidden = false;
  if (locked) m.querySelector('.modal-box > .back-btn').remove();   // ventana que no se puede cerrar
  modalOnClose = onClose || null;
  m.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);
  m.onclick = e => { if (e.target === m && !locked) closeModal(); };
  if (setup) setup(m);
}
function closeModal() {
  $('#modal').hidden = true; $('#modal').innerHTML = '';
  const f = modalOnClose; modalOnClose = null; if (f) f();
}
function confirmBox(text, yes, { no = 'Cancelar', ok = 'Sí', okClass = 'danger' } = {}) {
  modal(`<p>${esc(text)}</p><div class="row2"><button class="btn ghost" data-close>${esc(no)}</button><button class="btn ${okClass}" data-act="yes">${esc(ok)}</button></div>`,
    el => { el.querySelector('[data-act=yes]').onclick = async () => { closeModal(); await yes(); }; });
}
let toastT = 0;
function toast(t) {
  const el = $('#toast');
  el.textContent = t; el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2600);
}
function loading(on, text = '') {
  const el = $('#loading');
  el.hidden = !on; el.querySelector('span').textContent = text;
}
// las cartas suben la puntuación máxima: este es el porcentaje extra que da el mazo
const deckBonusPct = theme => Math.round(deckPower(P, theme) / 6000 * 100);
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;

// ---------------- arranque ----------------
document.querySelectorAll('#nav button').forEach(b => b.onclick = () => go(b.dataset.go));
$('#pauseBtn').onclick = () => { if (game && game.rec) game.stopRecording(); else togglePause(); };
$('#pmResume').onclick = () => togglePause();
$('#pmRetry').onclick = () => { const lp = lastPlay; quitGame(true); startSong(lp.id, { free: true }); };
$('#pmQuit').onclick = () => { quitGame(); go('songs'); };
document.addEventListener('visibilitychange', () => { if (document.hidden && game && !game.paused) togglePause(true); });
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (screen === 'lobby') rLobby(); });

(async function boot() {
  try {
    const keys = await idb.keys('audio');
    keys.forEach(k => loaded.add(k));
    for (const k of keys) {
      const an = await idb.get('analysis', k);
      if (an && an.v === ANALYSIS_VERSION) computeLevels(k, an);
    }
  } catch (e) { console.warn('IndexedDB no disponible', e); }
  go('title');
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
})();

// para pruebas automáticas
window.__ss = { get P() { return P; }, go, addExp, startSong, storeAudio, getAnalysis, get game() { return game; }, setDiff: d => { diff = d; } };
