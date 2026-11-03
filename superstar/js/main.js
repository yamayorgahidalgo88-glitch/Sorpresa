import { SONGS, PHOTO_CREDITS, THEMES, DIFFS, MEMBERS, DECK_SIZE, PACK_COST, REFILL_COST, HP_REGEN_SEC, BASE_MAX_SCORE, matchSong, GRADE_INFO } from './data.js';
import { loadProfile, saveProfile, resetProfile, idb, askPersistent } from './store.js';
import { analyzeAudio, makeChart, ANALYSIS_VERSION } from './beatmap.js';
import { cardHTML, cardPower, deckPower, openPack, welcomePack, autoDeck, memberById } from './cards.js';
import { Game } from './engine.js';

// ---------------- estado ----------------
const PREPARED = ['no-more-dream', 'dynamite']; // canciones con partitura que sigue la voz
let P = loadProfile();
let ctx = null;
let screen = 'title';
let diff = 'normal'; // sólo hay un nivel: NORMAL (4 botones)
let selectedSlot = -1;
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
function addExp(x) {
  P.exp += x;
  let up = 0;
  while (P.exp >= expNeed(P.level)) { P.exp -= expNeed(P.level); P.level++; up++; }
  if (up) P.hp = Math.max(P.hp, maxHP());
  return up;
}

// ---------------- audio ----------------
function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC({ latencyHint: 'interactive' });
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
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
  for (const d of DIFFS) lv[d.id] = makeChart(an, d.id, id).level;
  levels.set(id, lv);
  getPrepared(id).then(pr => { if (pr) { for (const d of DIFFS) if (pr.charts[d.id]) lv[d.id] = pr.charts[d.id].level; refreshRow(id); } });
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
    <div class="tb-lv"><b>Lv.${P.level}</b><i style="--p:${(P.exp / need * 100).toFixed(1)}%"></i></div>
    <div class="tb-name">${esc(P.name)}</div>
    <div class="pill hp" title="Auriculares"><span class="ico">🎧</span>${P.hp}/${maxHP()}<small>${hpTimer()}</small></div>
    <div class="pill rp" title="Rhythm Points"><span class="ico">♪</span>${fmt(P.rp)}</div>`;
}
setInterval(() => { if (!$('#topbar').hidden) renderTop(); }, 1000);

// ---------------- pantallas ----------------
function rTitle() {
  view.innerHTML = `
  <div class="title-screen">
    <div class="sparkles"></div>
    <div class="logo">
      <div class="logo-top">SUPERSTAR</div>
      <div class="logo-sub">ARMY EDITION</div>
    </div>
    <div class="tap-start">TOCA PARA EMPEZAR</div>
    <div class="title-foot">Fan game personal · sin afiliación oficial</div>
  </div>`;
  view.querySelector('.title-screen').addEventListener('click', () => {
    ensureCtx();
    go('lobby');
    if (!P.welcomed) welcome();
  }, { once: true });
}

function welcome() {
  const got = welcomePack(P);
  P.welcomed = true; save();
  modal(`
    <h2>¡Bienvenida, ARMY!</h2>
    <p>Un regalo para empezar: una carta de cada miembro. Ya están en tu mazo.</p>
    <div class="reveal-grid">${got.map(g => cardHTML(g.card, { size: 'sm' })).join('')}</div>
    <p class="muted">Ve a <b>Canciones</b> y carga tus canciones desde el móvil para jugar.</p>
    <button class="btn primary" data-close>¡Vamos!</button>`, null, () => { if (screen === 'lobby') rLobby(); });
}

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
    <div class="diff-one">NORMAL · 4 botones · 🎧 2</div>
    <label class="btn ghost import">＋ Importar canciones (varias a la vez)
      <input type="file" accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.flac" multiple hidden id="multiIn">
    </label>
    <div class="song-list">${songs.map(songRow).join('')}</div>
  </div>`;
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
      <div class="song-sub">${esc(s.artist || '')}${lv ? ` · <span class="lvl">★${lv[diff]}</span>` : ''}${PREPARED.includes(s.id) ? ' · <span class="voz">🎤 voz</span>' : ''}</div>
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

async function importMany(files) {
  if (!files.length) return;
  const matched = [], extra = [];
  for (const f of files) {
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
        <div class="muted">${esc(s.artist || '')} · ${esc(th.name)}</div>
      </div>
    </div>
    <div class="sheet-row"><span>Dificultad</span><b style="color:${d.color}">${d.name}${lv ? ' ★' + lv[diff] : ''}</b></div>
    <div class="sheet-row"><span>Mejor puntuación</span><b>${rec ? fmt(rec.score) + ' · ' + rec.rank : '—'}</b></div>
    <div class="sheet-row"><span>Poder del mazo (con bonus de era)</span><b>${fmt(dp)}</b></div>
    <div class="deck-mini">${P.deck.map(uid => cardHTML(P.cards.find(c => c.uid === uid), { size: 'xs', songTheme: s.theme })).join('')}</div>
    <div class="row2">
      <button class="btn ghost" data-act="auto">Mazo automático</button>
      <button class="btn ghost" data-act="remove">Quitar audio</button>
    </div>
    ${id.startsWith('c-') ? '<div class="row2"><button class="btn ghost" data-act="assign">Es una canción de la lista…</button>' : '<div class="row2" hidden>'}
    </div>
    <button class="btn primary huge" data-act="start">EMPEZAR <small>🎧 ${d.cost}</small></button>
  `, el => {
    el.querySelector('[data-act=start]').onclick = () => { closeModal(); startSong(id); };
    el.querySelector('[data-act=auto]').onclick = () => { autoDeck(P, s.theme); save(); songSheet(id); };
    const asg = el.querySelector('[data-act=assign]');
    if (asg) asg.onclick = async () => {
      closeModal();
      const to = await askWhichSong(s.title);
      if (!to) return;
      await reassignSong(id, to);
      rSongs(); toast(`Ahora es «${songById(to).title}». Analizando…`);
      try { await getAnalysis(to); } catch {}
    };
    el.querySelector('[data-act=remove]').onclick = async () => {
      await idb.del('audio', id); await idb.del('analysis', id);
      loaded.delete(id); levels.delete(id); bufCache.delete(id);
      if (id.startsWith('c-')) { P.customSongs = P.customSongs.filter(x => x.id !== id); save(); }
      closeModal(); rSongs();
    };
  });
}

// ---------------- jugar ----------------
async function startSong(id, { free = false } = {}) {
  tickHP();
  const d = diffInfo(diff);
  if (!free && P.hp < d.cost) {
    modal(`<h2>Sin auriculares 🎧</h2>
      <p>Necesitas ${d.cost} y tienes ${P.hp}. Se recupera uno cada ${HP_REGEN_SEC / 60} minutos (siguiente en ${hpTimer()}).</p>
      <button class="btn primary" data-act="refill" ${P.rp < REFILL_COST ? 'disabled' : ''}>Recargar por ${fmt(REFILL_COST)} RP</button>
      <button class="btn ghost" data-close>Vale</button>`, el => {
      el.querySelector('[data-act=refill]').onclick = () => { P.rp -= REFILL_COST; P.hp = maxHP(); P.hpTs = Date.now(); save(); closeModal(); renderTop(); startSong(id); };
    });
    return;
  }
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
  if (!free) { P.hp -= d.cost; if (P.hp < maxHP() && P.hpTs > Date.now() - 1000) P.hpTs = Date.now(); save(); }
  // si hay partitura preparada para esta canción (y el audio es la misma versión), se usa esa
  const prep = await getPrepared(id);
  const usePrep = prep && prep.charts[diff] && Math.abs(prep.duration - buf.duration) < 1.5;
  const chart = usePrep
    ? { ...prep.charts[diff], bpm: prep.bpm, phase: prep.phase, beats: prep.beats, intensity: prep.intensity, start: prep.start || 0, end: prep.end }
    : makeChart(an, diff, id);
  if (prep && !usePrep) toast('Este MP3 es otra versión: uso la partitura automática');
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
    ctx, buffer: buf, chart, settings: P.settings, maxScore, title: s.title, theme: th,
    deck: P.deck.map(uid => P.cards.find(c => c.uid === uid)).filter(Boolean).map(c => { const m = memberById(c.member); return { photo: m.photo, name: m.name, grade: c.grade }; }),
    bgPhotos: MEMBERS.map(m => m.photo),
    onEnd: res => endSong(res),
    onPause: () => togglePause(),
  });
  game.start();
}

// El original se juega en horizontal: pantalla completa + giro si el móvil lo permite.
async function ensureLandscape() {
  if (P.settings.orient === 'portrait') return;
  // Sin pedir pantalla completa (Chrome mostraría un aviso que tapa la pista).
  // En la app instalada se puede bloquear en horizontal; en el navegador basta con girar el móvil.
  try { if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); } catch {}
  if (innerWidth > innerHeight) return;
  const ov = $('#rotate');
  ov.hidden = false;
  await new Promise(res => {
    const done = () => { window.removeEventListener('resize', chk); ov.hidden = true; res(); };
    const chk = () => { if (innerWidth > innerHeight) done(); };
    window.addEventListener('resize', chk);
    $('#rotateSkip').onclick = done;
  });
  await new Promise(r => setTimeout(r, 250));
}
function leaveLandscape() {
  try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch {}
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
  go('result', { ...res, rank, isNew, rp, exp, ups, id, dId });
}

function rResult(r) {
  const s = songById(r.id);
  const d = diffInfo(r.dId);
  const rows = ['S.PERFECT', 'PERFECT', 'GOOD', 'BAD', 'MISS'];
  view.innerHTML = `
  <div class="result">
    <div class="res-song">${esc(s.title)} <span style="color:${d.color}">${d.name}</span></div>
    <div class="res-rank r-${r.rank}">${r.rank}</div>
    ${r.ap ? '<div class="badge holo">ALL S.PERFECT</div>' : r.fc ? '<div class="badge">FULL COMBO</div>' : ''}
    <div class="res-score">${fmt(r.score)}${r.isNew ? '<span class="newrec">NEW RECORD</span>' : ''}</div>
    ${r.bonus ? `<div class="muted small">incluye RAVE BONUS +${fmt(r.bonus)}</div>` : ''}
    <div class="res-grid">
      ${rows.map((n, i) => `<div class="jr j${i}"><span>${n}</span><b>${r.counts[i]}</b></div>`).join('')}
      <div class="jr"><span>MAX COMBO</span><b>${r.maxCombo}</b></div>
    </div>
    <div class="res-rew">
      <div>♪ +${fmt(r.rp)} RP</div><div>EXP +${r.exp}</div>
    </div>
    ${r.ups ? `<div class="levelup">¡SUBES A NIVEL ${P.level}! Auriculares recargados 🎧</div>` : ''}
    <div class="row2">
      <button class="btn ghost" data-act="retry">Reintentar</button>
      <button class="btn primary" data-act="ok">Continuar</button>
    </div>
  </div>`;
  view.querySelector('[data-act=ok]').onclick = () => go('songs');
  view.querySelector('[data-act=retry]').onclick = () => { diff = r.dId; startSong(r.id); };
}

// ---------------- mazo ----------------
function rDeck() {
  const cards = [...P.cards].sort((a, b) => cardPower(b) - cardPower(a));
  view.innerHTML = `
  <div class="deck">
    <div class="deck-head">
      <div><div class="muted small">PODER DEL MAZO</div><div class="big">${fmt(deckPower(P))}</div></div>
      <button class="btn ghost small" data-act="auto">Auto</button>
    </div>
    <p class="hint">Toca un hueco y luego una carta. Las cartas de la misma era que la canción dan <b>x1.5</b>. 4 o más de la misma era dan bonus de set.</p>
    <div class="deck-slots">
      ${P.deck.map((uid, i) => cardHTML(P.cards.find(c => c.uid === uid), { size: 'sm', extra: `data-slot="${i}"` }).replace('class="card', `class="card${i === selectedSlot ? ' sel' : ''}`)).join('')}
    </div>
    <h3>Colección <span class="muted">(${cards.length})</span></h3>
    <div class="collection">
      ${cards.length ? cards.map(c => cardHTML(c, { size: 'sm', extra: `data-uid="${c.uid}"` }).replace('class="card', `class="card${P.deck.includes(c.uid) ? ' in-deck' : ''}`)).join('') : '<p class="muted">Aún no tienes cartas. Abre sobres en la Tienda.</p>'}
    </div>
  </div>`;
  view.querySelector('[data-act=auto]').onclick = () => { autoDeck(P); save(); selectedSlot = -1; rDeck(); };
  view.querySelectorAll('[data-slot]').forEach(el => el.onclick = () => {
    const i = +el.dataset.slot;
    if (selectedSlot === i) { P.deck[i] = null; selectedSlot = -1; save(); }
    else selectedSlot = i;
    rDeck();
  });
  view.querySelectorAll('[data-uid]').forEach(el => el.onclick = () => {
    const uid = +el.dataset.uid;
    let slot = selectedSlot >= 0 ? selectedSlot : P.deck.indexOf(null);
    if (slot < 0) { cardInfo(uid); return; }
    const already = P.deck.indexOf(uid);
    if (already >= 0) P.deck[already] = P.deck[slot];
    P.deck[slot] = uid;
    selectedSlot = -1; save(); rDeck();
  });
}
function cardInfo(uid) {
  const c = P.cards.find(x => x.uid === uid);
  const m = memberById(c.member);
  modal(`${cardHTML(c, { size: 'lg' })}
    <h2>${esc(m.name)} · ${esc(THEMES[c.theme].name)}</h2>
    <p>Rango <b>${c.grade}</b> · Nivel ${c.lvl}/${GRADE_INFO[c.grade].maxLvl} · Poder ${fmt(cardPower(c))}</p>
    <p class="muted">Toca primero un hueco del mazo para colocarla.</p>
    <button class="btn primary" data-close>Vale</button>`);
}

// ---------------- tienda ----------------
function rShop() {
  view.innerHTML = `
  <div class="shop">
    <div class="pack">
      <div class="pack-art"><div class="pack-logo">SUPERSTAR</div><div class="pack-sub">CARD PACK</div></div>
      <div class="odds">${Object.entries(GRADE_INFO).reverse().map(([g, i]) => `<span class="grade-chip" style="--gc:${i.color}">${g} ${(i.odds * 100).toFixed(0)}%</span>`).join('')}</div>
      <button class="btn primary" data-n="1" ${P.rp < PACK_COST ? 'disabled' : ''}>Abrir 1 · ♪ ${fmt(PACK_COST)}</button>
      <button class="btn ghost" data-n="5" ${P.rp < PACK_COST * 5 ? 'disabled' : ''}>Abrir 5 · ♪ ${fmt(PACK_COST * 5)}</button>
    </div>
    <div class="shop-item">
      <div><b>🎧 Recargar auriculares</b><div class="muted small">Llena tus auriculares al máximo</div></div>
      <button class="btn small" data-act="refill" ${P.rp < REFILL_COST || P.hp >= maxHP() ? 'disabled' : ''}>♪ ${fmt(REFILL_COST)}</button>
    </div>
    <p class="hint">Las cartas repetidas suben de nivel a la original. Gana RP jugando canciones.</p>
  </div>`;
  view.querySelectorAll('[data-n]').forEach(b => b.onclick = () => {
    const n = +b.dataset.n;
    if (P.rp < PACK_COST * n) return;
    P.rp -= PACK_COST * n;
    const got = openPack(P, n);
    save(); renderTop();
    modal(`<h2>¡Sobre abierto!</h2>
      <div class="reveal-grid">${got.map((g, i) => `<div class="flip" style="--d:${i * 0.18}s">${cardHTML(g.card, { size: 'sm' })}${g.dup ? `<div class="dup">${g.maxed ? '+800 RP' : 'Lv UP'}</div>` : '<div class="dup new">NEW</div>'}</div>`).join('')}</div>
      <button class="btn primary" data-close>Genial</button>`, null, () => rShop());
  });
  view.querySelector('[data-act=refill]').onclick = () => { P.rp -= REFILL_COST; P.hp = maxHP(); P.hpTs = Date.now(); save(); renderTop(); rShop(); toast('Auriculares al máximo 🎧'); };
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
    <label class="set row"><span>Jugar en horizontal (como el original)</span><input type="checkbox" ${S.orient !== 'portrait' ? 'checked' : ''} data-orient></label>
    <label class="set row"><span>Efectos de partículas</span><input type="checkbox" ${S.fx ? 'checked' : ''} data-s="fx"></label>
    <div class="set"><span>Controles con teclado</span><small class="muted">EASY: F · Espacio · J — NORMAL: D F J K — HARD: S D F Espacio J K L — Pausa: Esc</small></div>
    <button class="btn ghost" data-act="clearAudio">Borrar canciones guardadas</button>
    <button class="btn danger" data-act="reset">Reiniciar todo el progreso</button>
    <div class="credits"><b>Fotos de las cartas</b> (Wikimedia Commons, recortadas):<br>${PHOTO_CREDITS.map(c => `${esc(c.member)}: <a href="https://commons.wikimedia.org/wiki/File:${encodeURIComponent(c.file.replace(/ /g, '_'))}" target="_blank" rel="noopener">${esc(c.author)}</a>, ${esc(c.license)}`).join('<br>')}</div>
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
  view.querySelector('[data-orient]').onchange = e => { S.orient = e.target.checked ? 'landscape' : 'portrait'; save(); };
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
function modal(html, setup, onClose) {
  const m = $('#modal');
  m.innerHTML = `<div class="modal-box">${html}</div>`;
  m.hidden = false;
  modalOnClose = onClose || null;
  m.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);
  m.onclick = e => { if (e.target === m) closeModal(); };
  if (setup) setup(m);
}
function closeModal() {
  $('#modal').hidden = true; $('#modal').innerHTML = '';
  const f = modalOnClose; modalOnClose = null; if (f) f();
}
function confirmBox(text, yes) {
  modal(`<p>${esc(text)}</p><div class="row2"><button class="btn ghost" data-close>Cancelar</button><button class="btn danger" data-act="yes">Sí</button></div>`,
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
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;

// ---------------- arranque ----------------
document.querySelectorAll('#nav button').forEach(b => b.onclick = () => { selectedSlot = -1; go(b.dataset.go); });
$('#pauseBtn').onclick = () => togglePause();
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
window.__ss = { get P() { return P; }, go, startSong, storeAudio, getAnalysis, get game() { return game; }, setDiff: d => { diff = d; } };
