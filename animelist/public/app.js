// Anime List M&Y — frontend (vanilla JS, sin build)
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const app = $('#app');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const PLATFORMS = {
  crunchyroll: { name: 'Crunchyroll', color: '#f47521' },
  netflix: { name: 'Netflix', color: '#e50914' },
  max: { name: 'HBO Max', color: '#5b2bd8' },
  prime: { name: 'Prime Video', color: '#00a8e1' },
  disney: { name: 'Disney+', color: '#113ccf' },
};
const PLATFORM_BY_NAME = Object.fromEntries(Object.entries(PLATFORMS).map(([k, v]) => [v.name.toLowerCase(), k]));
const LANGS = {
  es: 'Español', ja: 'Japonés', en: 'Inglés', ca: 'Catalán', fr: 'Francés', de: 'Alemán', it: 'Italiano', pt: 'Portugués',
  ko: 'Coreano', zh: 'Chino', ar: 'Árabe', hi: 'Hindi', ru: 'Ruso', pl: 'Polaco', ta: 'Tamil', te: 'Telugu', th: 'Tailandés',
  id: 'Indonesio', ms: 'Malayo', vi: 'Vietnamita', tr: 'Turco', nl: 'Neerlandés', eu: 'Euskera', gl: 'Gallego',
};
const langName = (c) => LANGS[c] || c.toUpperCase();
const PERSON_COLORS = ['#8bc34a', '#5b9bd5', '#ff8a3d', '#e05b8f', '#b38cff', '#ffd54f', '#4dd0c4'];

const ICON = {
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  share: '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/></svg>',
  dots: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>',
  users: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.8"/><path d="M16.5 14.1c2.9.3 5 2.4 5 5.4"/></svg>',
  logout: '<svg viewBox="0 0 24 24"><path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 17l5-5-5-5M15 12H4"/></svg>',
  film: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/></svg>',
  pencil: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  columns: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/></svg>',
  heart: '♥',
};

// ───────────── Utilidades ─────────────
async function api(path, opts = {}) {
  const res = await fetch('/api' + path, {
    method: opts.method || (opts.body ? 'POST' : 'GET'),
    headers: opts.body ? { 'content-type': 'application/json' } : {},
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !path.startsWith('/auth')) { state.user = null; go('#/login'); }
  if (!res.ok) throw new Error(data.error || 'Algo ha fallado');
  return data;
}

let toastTimer;
function toast(msg, bad = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'show' + (bad ? ' bad' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = bad ? 'bad' : ''), 2600);
}
const fail = (e) => toast(e.message || String(e), true);

const fmtRating = (r) => (r == null ? '' : String(Math.round(r * 100) / 100).replace('.', ','));
const avatarStyle = (name) => {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `--a1:hsl(${h} 90% 55%);--a2:hsl(${(h + 50) % 360} 80% 42%)`;
};
const platKey = (name) => PLATFORM_BY_NAME[(name || '').toLowerCase()] || null;
const platBadge = (key, label) => {
  const p = PLATFORMS[key];
  return `<span class="plat" style="--pc:${p ? p.color : '#555'}">${esc(p ? p.name : label)}</span>`;
};

// ───────────── Hojas (bottom sheets) y confirmaciones ─────────────
function openSheet(html, { onClose } = {}) {
  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  const close = () => { bg.remove(); onClose?.(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  bg.addEventListener('click', (e) => { if (e.target === bg) close(); });
  document.addEventListener('keydown', onKey);
  $('#sheet-root').append(bg);
  const sheet = $('.sheet', bg);
  sheet.close = close;
  $$('[data-close]', sheet).forEach((b) => b.addEventListener('click', close));
  return sheet;
}

function confirmSheet({ title, text, ok = 'Eliminar', danger = true, icon = ICON.trash }) {
  return new Promise((resolve) => {
    let done = false;
    const s = openSheet(`
      <div class="confirm-icon" style="${danger ? '' : 'background:rgba(255,122,26,.15);color:var(--orange)'}">${icon}</div>
      <h3 class="center">${esc(title)}</h3>
      <p class="center muted" style="margin-top:-6px">${text}</p>
      <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${esc(ok)}</button></div>`,
    { onClose: () => !done && resolve(false) });
    $('[data-ok]', s).addEventListener('click', () => { done = true; s.close(); resolve(true); });
  });
}

function promptSheet({ title, label, value = '', ok = 'Guardar', placeholder = '', extra = '' }) {
  return new Promise((resolve) => {
    let done = false;
    const s = openSheet(`
      <h3>${esc(title)}</h3>
      <form>
        <label class="field"><span>${esc(label)}</span><input class="input" name="v" maxlength="60" value="${esc(value)}" placeholder="${esc(placeholder)}" required autocomplete="off"></label>
        ${extra}
        <div class="actions"><button type="button" class="btn" data-close>Cancelar</button><button class="btn primary">${esc(ok)}</button></div>
      </form>`, { onClose: () => !done && resolve(null) });
    const form = $('form', s);
    setTimeout(() => form.v.focus(), 50);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = form.v.value.trim();
      if (!v) return;
      done = true;
      const extras = Object.fromEntries([...new FormData(form)].filter(([k]) => k !== 'v'));
      s.close();
      resolve({ value: v, ...extras });
    });
  });
}

// ───────────── Estado y router ─────────────
const state = { user: null, list: null, filter: 'all', query: '', friendsBadge: 0 };
let pollTimer = null;

function go(hash) { if (location.hash !== hash) location.hash = hash; else route(); }

async function route() {
  clearInterval(pollTimer);
  const hash = location.hash || '#/tablas';
  if (!state.user) {
    try { state.user = (await api('/me')).user; } catch { state.user = null; }
  }
  if (!state.user) return renderAuth();
  document.body.classList.remove('auth');
  $('#tabbar').hidden = false;
  const [, section, id] = hash.split('/');
  $$('#tabbar a').forEach((a) => a.classList.toggle('on', a.dataset.tab === (section === 'tabla' ? 'tablas' : section)));
  refreshBadge();
  if (section === 'perfil') return renderProfile();
  if (section === 'amigos') return renderFriends();
  if (section === 'tabla' && id) return renderList(Number(id));
  if (section !== 'tablas') return go('#/tablas');
  return renderLists();
}
window.addEventListener('hashchange', route);

async function refreshBadge() {
  try {
    const { stats } = await api('/me');
    const n = stats?.requests || 0;
    const b = $('#tabbar .badge');
    b.hidden = !n;
    b.textContent = n;
  } catch { /* nada */ }
}
setInterval(() => state.user && document.visibilityState === 'visible' && refreshBadge(), 30000);

// ───────────── Fondo anime ─────────────
async function loadBackdrop() {
  try {
    const { posters } = await api('/backdrop');
    if (!posters.length) return;
    const doubled = [...posters, ...posters];
    $('#backdrop .mosaic').innerHTML = doubled.map((p) => `<img src="${esc(p)}" alt="" loading="lazy" referrerpolicy="no-referrer">`).join('');
  } catch { /* sin fondo de pósters: queda el degradado */ }
}

// ───────────── Login / registro ─────────────
function renderAuth(mode = 'login') {
  document.body.classList.add('auth');
  $('#tabbar').hidden = true;
  app.innerHTML = `
    <div class="auth-wrap fade-in"><div class="auth-box">
      <img class="auth-logo" src="/img/logo-256.png" alt="Logo">
      <div class="auth-title">ANIME <em>LIST</em></div>
      <p class="auth-sub">Lo que vemos, lo que nos queda y nuestras notas</p>
      <form class="card" novalidate>
        <div class="seg"><button type="button" data-m="login">Iniciar sesión</button><button type="button" data-m="register">Crear cuenta</button></div>
        <label class="field"><span>Nombre de usuario</span><input class="input" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="20" required></label>
        <label class="field"><span>Contraseña</span><input class="input" type="password" name="password" autocomplete="current-password" required></label>
        <label class="field" data-reg><span>Repite la contraseña</span><input class="input" type="password" name="password2" autocomplete="new-password"></label>
        <div class="err"></div>
        <button class="btn primary block" data-submit></button>
      </form>
    </div></div>`;
  const form = $('form', app);
  const setMode = (m) => {
    mode = m;
    $$('.seg button', form).forEach((b) => b.classList.toggle('on', b.dataset.m === m));
    $('[data-reg]', form).hidden = m !== 'register';
    form.password.autocomplete = m === 'register' ? 'new-password' : 'current-password';
    $('[data-submit]', form).textContent = m === 'register' ? 'Crear cuenta' : 'Entrar';
    $('.err', form).textContent = '';
  };
  $$('.seg button', form).forEach((b) => b.addEventListener('click', () => setMode(b.dataset.m)));
  setMode(mode);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('.err', form);
    const username = form.username.value.trim();
    const password = form.password.value;
    if (!username || !password) return (err.textContent = 'Rellena usuario y contraseña');
    if (mode === 'register' && password !== form.password2.value) return (err.textContent = 'Las contraseñas no coinciden');
    const btn = $('[data-submit]', form);
    btn.disabled = true;
    try {
      const { user } = await api('/auth/' + mode, { body: { username, password } });
      state.user = user;
      toast(mode === 'register' ? `¡Bienvenido/a, ${user.username}!` : `Hola de nuevo, ${user.username}`);
      go('#/tablas');
    } catch (ex) {
      err.textContent = ex.message;
    } finally { btn.disabled = false; }
  });
}

// ───────────── Tablas ─────────────
function topbar(title, { back, right = '', sub = '' } = {}) {
  return `<header class="topbar">
    ${back ? `<a class="iconbtn" href="${back}" aria-label="Volver">${ICON.back}</a>` : '<img class="logo" src="/img/logo-256.png" alt="">'}
    <div style="flex:1;min-width:0"><h1>${esc(title)}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div>
    ${right}</header>`;
}

async function renderLists() {
  app.innerHTML = topbar('Mis tablas') + '<div class="lists-grid"><div class="skeleton"></div><div class="skeleton"></div></div>';
  let lists;
  try { ({ lists } = await api('/lists')); } catch (e) { return fail(e); }
  app.innerHTML = topbar('Mis tablas', { sub: `${lists.length} ${lists.length === 1 ? 'tabla' : 'tablas'}` }) + `
    <div class="lists-grid fade-in">
      <button class="new-card" data-new>${ICON.plus}Nueva tabla</button>
      ${lists.map((l) => `
        <a class="card list-card" href="#/tabla/${l.id}">
          <div class="covers">${l.covers.map((c) => `<img src="${esc(c)}" alt="" loading="lazy" referrerpolicy="no-referrer">`).join('')}</div>
          <button class="iconbtn trash" data-del="${l.id}" aria-label="${l.role === 'owner' ? 'Eliminar' : 'Salir de'} la tabla">${ICON.trash}</button>
          <h3>${esc(l.name)}</h3>
          <div class="meta">
            <span class="chip orange">${ICON.film}${l.count} anime${l.count === 1 ? '' : 's'}</span>
            ${l.members > 1 ? `<span class="chip">${ICON.users}Compartida · ${l.members}</span>` : ''}
            ${l.role !== 'owner' ? `<span class="chip">de @${esc(l.owner)}</span>` : ''}
          </div>
        </a>`).join('')}
    </div>
    ${lists.length ? '' : '<p class="empty">Aún no tienes tablas. ¡Crea la primera!</p>'}`;

  $('[data-new]', app).addEventListener('click', newListFlow);
  $$('[data-del]', app).forEach((b) => b.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const l = lists.find((x) => x.id === Number(b.dataset.del));
    const owner = l.role === 'owner';
    const ok = await confirmSheet(owner
      ? { title: '¿Eliminar tabla?', text: `Se borrará <b>${esc(l.name)}</b> con sus ${l.count} animes${l.members > 1 ? ' para todas las personas con las que la compartes' : ''}. No se puede deshacer.` }
      : { title: '¿Salir de la tabla?', text: `Dejarás de ver <b>${esc(l.name)}</b>. @${esc(l.owner)} podrá volver a compartírtela.`, ok: 'Salir' });
    if (!ok) return;
    try { await api('/lists/' + l.id, { method: 'DELETE' }); toast(owner ? 'Tabla eliminada' : 'Has salido de la tabla'); renderLists(); } catch (ex) { fail(ex); }
  }));
}

async function newListFlow() {
  const res = await promptSheet({
    title: 'Nueva tabla', label: 'Nombre de la tabla', ok: 'Crear tabla', placeholder: 'Ej: Anime para el finde',
    extra: `<label class="toggle"><span>Empezar con nuestra lista original <b>M&amp;Y</b><br><small class="muted">32 animes con checks y notas del PDF</small></span>
      <span class="switch"><input type="checkbox" name="template" value="my"><i></i></span></label>`,
  });
  if (!res) return;
  try {
    const { id } = await api('/lists', { body: { name: res.value, template: res.template } });
    toast('Tabla creada');
    go('#/tabla/' + id);
  } catch (e) { fail(e); }
}

// ───────────── Vista de una tabla ─────────────
async function loadList(id) {
  const data = await api('/lists/' + id);
  state.list = data;
  return data;
}

async function renderList(id) {
  app.innerHTML = topbar('Cargando…', { back: '#/tablas' }) + '<div class="skeleton" style="height:320px"></div>';
  try { await loadList(id); } catch (e) { fail(e); return go('#/tablas'); }
  drawList();
  // Sincroniza con los cambios de las otras personas de la tabla
  pollTimer = setInterval(async () => {
    if (document.visibilityState !== 'visible' || $('.sheet') || location.hash !== '#/tabla/' + id) return;
    const prev = state.list.list.updated_at;
    try { await loadList(id); if (state.list.list.updated_at !== prev) drawList(true); } catch { /* reintenta luego */ }
  }, 8000);
}

function computeRanking(people, entries) {
  return people.map((p) => ({
    p,
    top: entries.filter((e) => e.marks[p.id]?.rating != null)
      .sort((a, b) => b.marks[p.id].rating - a.marks[p.id].rating).slice(0, 3),
  })).filter((r) => r.top.length);
}

function visibleEntries() {
  const { entries, people } = state.list;
  const q = state.query.trim().toLowerCase();
  return entries.filter((e) => {
    if (q && !e.title.toLowerCase().includes(q)) return false;
    const seenAll = people.length && people.every((p) => e.marks[p.id]?.seen);
    const seenAny = people.some((p) => e.marks[p.id]?.seen);
    if (state.filter === 'pending') return !seenAll;
    if (state.filter === 'seen') return seenAny;
    if (state.filter === 'together') return e.together;
    return true;
  });
}

function drawList(keepScroll = false) {
  const { list, people, entries, members } = state.list;
  const scroll = keepScroll ? $('.table-wrap')?.scrollLeft : 0;
  const owner = list.role === 'owner';
  const ranking = computeRanking(people, entries);
  const shared = members.length > 1;

  app.innerHTML = topbar(list.name, {
    back: '#/tablas',
    sub: `${entries.length} animes${shared ? ` · compartida con ${members.filter((m) => m.id !== state.user.id).map((m) => '@' + esc(m.username)).join(', ')}` : ''}`,
    right: `${owner ? `<button class="iconbtn" data-share aria-label="Compartir">${ICON.share}</button>` : ''}<button class="iconbtn" data-menu aria-label="Opciones">${ICON.dots}</button>`,
  }) + `
  <div class="fade-in">
    <div class="card section">
      <div class="legend">
        ${people.map((p) => `<span class="chip"><i class="dot" style="background:${p.color}"></i>${esc(p.name)}</span>`).join('')}
        <span class="chip"><span class="together-key">Negrita</span>&nbsp;→ ver juntos</span>
      </div>
      ${ranking.length ? `<div class="rank-grid">${ranking.map(({ p, top }) => `
        <div class="rank-col" style="--c:${p.color}"><b>Top de ${esc(p.name)}</b>
          <ol>${top.map((e) => `<li>${esc(e.title)} <span>· ${fmtRating(e.marks[p.id].rating)}</span></li>`).join('')}</ol></div>`).join('')}</div>`
        : '<div class="muted" style="font-size:14px">Poned notas para ver vuestro ranking aquí.</div>'}
    </div>

    <div class="toolbar">
      <label class="search">${ICON.search}<input class="input" type="search" placeholder="Buscar en la tabla…" value="${esc(state.query)}" data-q></label>
      <div class="filters">
        ${[['all', 'Todos'], ['pending', 'Pendientes'], ['seen', 'Vistos'], ['together', 'Juntos ♥']].map(([k, t]) =>
          `<button data-f="${k}" class="${state.filter === k ? 'on' : ''}">${t}</button>`).join('')}
      </div>
    </div>

    <div class="card table-wrap"><table class="anime">
      <thead><tr>
        ${people.map((p) => `<th class="p" style="--c:${p.color}">Check<br><small>${esc(p.name)}</small></th>`).join('')}
        <th class="name">Nombre</th><th>Duración</th><th>Plataforma</th><th>Idioma</th>
        ${people.map((p) => `<th class="p" style="--c:${p.color}">Nota<br><small>${esc(p.name)}</small></th>`).join('')}
      </tr></thead>
      <tbody></tbody>
    </table></div>

    <div class="add-row"><button class="btn primary block" data-add>${ICON.plus} Añadir anime</button></div>
  </div>`;

  drawRows();
  if (scroll) $('.table-wrap').scrollLeft = scroll;

  $('[data-add]', app).addEventListener('click', () => entrySheet());
  $('[data-menu]', app).addEventListener('click', listMenu);
  $('[data-share]', app)?.addEventListener('click', shareSheet);
  $('[data-q]', app).addEventListener('input', (e) => { state.query = e.target.value; drawRows(); });
  $$('[data-f]', app).forEach((b) => b.addEventListener('click', () => {
    state.filter = b.dataset.f;
    $$('[data-f]', app).forEach((x) => x.classList.toggle('on', x === b));
    drawRows();
  }));
}

function drawRows() {
  const { people } = state.list;
  const rows = visibleEntries();
  const tbody = $('table.anime tbody', app);
  const cols = people.length * 2 + 4;
  tbody.innerHTML = rows.length ? rows.map((e) => {
    const pk = platKey(e.platform);
    return `<tr class="${e.together ? 'together' : ''}" data-id="${e.id}">
      ${people.map((p) => `<td class="p" style="--c:${p.color}"><button class="check ${e.marks[p.id]?.seen ? 'on' : ''}" data-seen="${p.id}" aria-label="Visto por ${esc(p.name)}" aria-pressed="${!!e.marks[p.id]?.seen}">${ICON.check}</button></td>`).join('')}
      <td class="name" data-open><div class="wrap">${e.poster ? `<img src="${esc(e.poster)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : '<span class="ph"></span>'}
        <div><span class="t">${esc(e.title)}</span>${e.together ? `<span class="heart">${ICON.heart} juntos</span>` : ''}</div></div></td>
      <td>${esc(e.duration || '—')}</td>
      <td>${e.platform ? platBadge(pk, e.platform) : '—'}</td>
      <td>${esc(e.language || '—')}</td>
      ${people.map((p) => {
        const r = e.marks[p.id]?.rating;
        return `<td class="p" style="--c:${p.color}"><button class="rate ${r == null ? 'empty-r' : ''}" data-rate="${p.id}">${r == null ? '— / 10' : fmtRating(r) + ' / 10'}</button></td>`;
      }).join('')}
    </tr>`;
  }).join('') : `<tr><td colspan="${cols}" class="empty">${state.list.entries.length ? 'Nada coincide con el filtro' : 'Tabla vacía. Pulsa «Añadir anime» para empezar.'}</td></tr>`;

  $$('tr[data-id]', tbody).forEach((tr) => {
    const entry = state.list.entries.find((x) => x.id === Number(tr.dataset.id));
    $('[data-open]', tr).addEventListener('click', () => entrySheet(entry));
    $$('[data-seen]', tr).forEach((b) => b.addEventListener('click', () => toggleSeen(entry, Number(b.dataset.seen), b)));
    $$('[data-rate]', tr).forEach((b) => b.addEventListener('click', () => ratingSheet(entry, Number(b.dataset.rate))));
  });
}

async function toggleSeen(entry, personId, btn) {
  const cur = entry.marks[personId] || { seen: false, rating: null };
  const seen = !cur.seen;
  entry.marks[personId] = { ...cur, seen };
  btn.classList.toggle('on', seen);
  btn.setAttribute('aria-pressed', seen);
  try {
    await api(`/entries/${entry.id}/marks/${personId}`, { method: 'PUT', body: { seen } });
    state.list.list.updated_at = Date.now();
  } catch (e) {
    entry.marks[personId] = cur;
    btn.classList.toggle('on', cur.seen);
    fail(e);
  }
}

function ratingSheet(entry, personId) {
  const person = state.list.people.find((p) => p.id === personId);
  const cur = entry.marks[personId]?.rating;
  let val = cur ?? 7;
  const s = openSheet(`
    <h3>Nota de ${esc(person.name)}</h3>
    <div class="muted" style="margin-top:-8px">${esc(entry.title)}</div>
    <div class="rating-big" style="--c:${person.color}"><span data-v>${fmtRating(val)}</span> <small style="font-size:28px;color:var(--muted)">/ 10</small></div>
    <input type="range" min="0" max="10" step="0.25" value="${val}" data-range aria-label="Nota">
    <div class="quick">${[5, 6, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((n) => `<button data-q="${n}">${fmtRating(n)}</button>`).join('')}</div>
    <div class="actions">
      ${cur != null ? '<button class="btn" data-clear>Quitar nota</button>' : '<button class="btn" data-close>Cancelar</button>'}
      <button class="btn primary" data-save>Guardar</button>
    </div>`);
  const range = $('[data-range]', s);
  const show = () => ($('[data-v]', s).textContent = fmtRating(val));
  range.addEventListener('input', () => { val = Number(range.value); show(); });
  $$('[data-q]', s).forEach((b) => b.addEventListener('click', () => { val = Number(b.dataset.q); range.value = val; show(); }));
  const save = async (rating) => {
    try {
      const r = await api(`/entries/${entry.id}/marks/${personId}`, { method: 'PUT', body: { rating, ...(rating != null ? { seen: true } : {}) } });
      entry.marks[personId] = r;
      s.close();
      drawList(true);
      if (rating != null && !(entry.marks[personId]?.seen === false)) toast(`Nota guardada · ${fmtRating(rating)}`);
    } catch (e) { fail(e); }
  };
  $('[data-save]', s).addEventListener('click', () => save(val));
  $('[data-clear]', s)?.addEventListener('click', () => save(null));
}

// ───────────── Añadir / editar anime ─────────────
function availabilityHtml(platforms) {
  if (!platforms?.length) {
    return '<div class="avail-item" style="--pc:#555"><div class="info">No está en Crunchyroll, Netflix, HBO Max, Prime Video ni Disney+ en España ahora mismo.</div></div>';
  }
  return platforms.map((p) => {
    const meta = PLATFORMS[p.key];
    const audio = p.audio.length
      ? p.audio.map((c) => (c === 'es' ? `<span class="es-dub">${langName(c)}</span>` : langName(c))).join(', ')
      : '<i>la plataforma no lo indica</i>';
    const subs = p.subs.length ? p.subs.map(langName).join(', ') : null;
    return `<div class="avail-item" style="--pc:${meta.color}">
      <div class="info"><b>${meta.name}</b>
        <div class="langs"><strong>Audio:</strong> ${audio}</div>
        ${subs ? `<div class="langs"><strong>Subtítulos:</strong> ${subs}</div>` : ''}
      </div>
      ${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">Ver ↗</a>` : ''}
    </div>`;
  }).join('');
}

const kindLabel = (it) => (it.type === 'movie' ? 'Película' : it.episodes ? `${it.episodes} cap` : 'Serie');
function suggestLanguage(platforms, platformKey) {
  const p = platforms?.find((x) => x.key === platformKey) || platforms?.[0];
  if (!p) return 'Español';
  if (p.audio.includes('es')) return 'Español';
  if (!p.audio.length) return 'Español';
  return p.audio.includes('ja') ? 'Japonés' : langName(p.audio[0]);
}

function entrySheet(entry = null) {
  const editing = !!entry;
  // Estado del formulario
  const f = {
    title: entry?.title || '',
    jw_id: entry?.jw_id || null,
    poster: entry?.poster || null,
    kind: entry?.kind || 'show',
    duration: entry?.duration || '',
    platform: entry?.platform || '',
    language: entry?.language || 'Español',
    together: entry?.together || false,
    availability: entry?.availability || null,
    meta: null,
  };

  const s = openSheet(`
    <h3>${editing ? 'Editar anime' : 'Añadir anime'}</h3>
    <div class="ac">
      <label class="field"><span>Nombre del anime</span>
        <input class="input" data-title placeholder="Empieza a escribir… (ej. Haikyu, Kimetsu)" autocomplete="off" value="${esc(f.title)}"></label>
      <div class="ac-list" data-ac hidden></div>
    </div>
    <div data-detail></div>
    <form data-form>
      <div class="row">
        <label class="field"><span>Duración</span><input class="input" name="duration" placeholder="24 cap / Película" maxlength="30"></label>
        <label class="field"><span>Plataforma</span><select class="input" name="platform"></select></label>
      </div>
      <label class="field"><span>Idioma en que lo veis</span><select class="input" name="language"></select></label>
      <label class="toggle"><span>${ICON.heart} Para ver juntos <small class="muted">(sale en negrita)</small></span>
        <span class="switch"><input type="checkbox" name="together"><i></i></span></label>
      <div class="actions">
        ${editing ? `<button type="button" class="btn" data-delete style="flex:0 0 auto;color:var(--red)" aria-label="Eliminar">${ICON.trash}</button>` : '<button type="button" class="btn" data-close>Cancelar</button>'}
        <button class="btn primary" data-submit>${editing ? 'Guardar' : `${ICON.plus} Añadir`}</button>
      </div>
    </form>`);

  const titleIn = $('[data-title]', s);
  const acBox = $('[data-ac]', s);
  const detail = $('[data-detail]', s);
  const form = $('[data-form]', s);

  function fillSelects() {
    const avail = f.availability || [];
    const opts = new Set([...avail.map((p) => PLATFORMS[p.key].name)]);
    if (f.platform) opts.add(f.platform);
    Object.values(PLATFORMS).forEach((p) => opts.add(p.name));
    opts.add('Otra');
    form.platform.innerHTML = [...opts].map((o) => {
      const on = avail.some((p) => PLATFORMS[p.key].name === o);
      return `<option value="${esc(o)}">${esc(o)}${avail.length && on ? ' ✓' : ''}</option>`;
    }).join('');
    form.platform.value = f.platform || [...opts][0];
    updateLangOptions();
    form.duration.value = f.duration;
    form.together.checked = f.together;
  }

  function updateLangOptions() {
    const pk = platKey(form.platform.value);
    const p = f.availability?.find((x) => x.key === pk);
    const audio = p?.audio?.length ? p.audio : ['es', 'ja'];
    const langs = new Set(audio.map(langName));
    langs.add('Japonés');
    const list = ['Español', 'Japonés', ...[...langs].filter((l) => l !== 'Español' && l !== 'Japonés').sort()]
      .filter((l) => langs.has(l) || l === 'Español');
    if (f.language && !list.includes(f.language)) list.push(f.language);
    form.language.innerHTML = list.map((l) => `<option value="${esc(l)}">${esc(l)}${l === 'Japonés' ? ' (VOSE)' : ''}${p?.audio?.length && l === 'Español' && !p.audio.includes('es') ? ' – sin doblaje aquí' : ''}</option>`).join('');
    form.language.value = f.language;
  }

  function drawDetail(item, live) {
    if (!item) { detail.innerHTML = ''; return; }
    detail.innerHTML = `
      <div class="anime-head">
        ${item.poster ? `<img src="${esc(item.poster)}" alt="" referrerpolicy="no-referrer">` : '<span class="ph"></span>'}
        <div><h4>${esc(item.title)}</h4>
          <div class="muted" style="font-size:13px">${item.type === 'movie' ? 'Película' : 'Serie'}${item.year ? ' · ' + item.year : ''}${item.seasons ? ` · ${item.seasons} temp.` : ''}${item.episodes ? ` · ${item.episodes} caps` : ''}${item.runtime && item.type === 'movie' ? ` · ${item.runtime} min` : ''}</div>
          ${item.original && item.original !== item.title ? `<div class="muted" style="font-size:12px;margin-top:4px">${esc(item.original)}</div>` : ''}
          <div class="chip orange" style="margin-top:8px">📍 Disponible en España${live ? '' : ' (catálogo guardado)'}</div>
        </div>
      </div>
      <div class="avail">${availabilityHtml(item.platforms)}</div>`;
  }

  function choose(item) {
    f.title = item.title;
    f.jw_id = item.id;
    f.poster = item.poster;
    f.kind = item.type;
    f.availability = item.platforms;
    f.duration = kindLabel(item);
    f.platform = item.platforms[0] ? PLATFORMS[item.platforms[0].key].name : (f.platform || 'Otra');
    f.language = suggestLanguage(item.platforms, item.platforms[0]?.key);
    titleIn.value = item.title;
    acBox.hidden = true;
    drawDetail(item, true);
    fillSelects();
    refreshLive(item.id);
  }

  async function refreshLive(id) {
    try {
      const { item } = await api('/anime/' + id);
      if (f.jw_id !== id) return;
      f.availability = item.platforms;
      if (!editing || !f.duration) f.duration = kindLabel(item);
      drawDetail(item, true);
      const prevPlat = form.platform.value;
      fillSelects();
      form.platform.value = prevPlat;
      updateLangOptions();
    } catch { /* se queda con lo que había */ }
  }

  // Autocompletado
  let seq = 0, debounce, results = [], sel = -1;
  const drawAc = () => {
    acBox.innerHTML = results.map((it, i) => `
      <button type="button" class="ac-item ${i === sel ? 'sel' : ''}" data-i="${i}">
        ${it.poster ? `<img src="${esc(it.poster)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : '<span class="ph"></span>'}
        <span style="min-width:0"><span class="t">${esc(it.title)}</span>
          <div class="s">${it.type === 'movie' ? 'Película' : 'Serie'}${it.year ? ' · ' + it.year : ''}${it.episodes ? ` · ${it.episodes} caps` : ''}${it.aka?.[0] && it.aka[0] !== it.title ? ` · ${esc(it.aka[0])}` : ''}</div>
          <span class="plat-list" style="justify-content:flex-start">${it.platforms.length ? it.platforms.map((p) => platBadge(p.key)).join('') : '<small class="muted">No disponible en tus plataformas</small>'}</span>
        </span></button>`).join('') ||
      '<div class="ac-status">Sin resultados. Puedes añadirlo igualmente con ese nombre.</div>';
    $$('.ac-item', acBox).forEach((b) => b.addEventListener('click', () => choose(results[Number(b.dataset.i)])));
  };
  titleIn.addEventListener('input', () => {
    f.title = titleIn.value;
    f.jw_id = null;
    const q = titleIn.value.trim();
    clearTimeout(debounce);
    if (q.length < 2) { acBox.hidden = true; return; }
    acBox.hidden = false;
    acBox.innerHTML = '<div class="ac-status"><span class="spinner"></span>Buscando en Crunchyroll, Netflix, HBO Max, Prime Video y Disney+…</div>';
    debounce = setTimeout(async () => {
      const my = ++seq;
      try {
        const r = await api('/anime/search?q=' + encodeURIComponent(q));
        if (my !== seq) return;
        results = r.results;
        sel = -1;
        drawAc();
      } catch (e) { if (my === seq) acBox.innerHTML = `<div class="ac-status">${esc(e.message)}</div>`; }
    }, 220);
  });
  titleIn.addEventListener('keydown', (e) => {
    if (acBox.hidden || !results.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
      drawAc();
    } else if (e.key === 'Enter' && sel >= 0) { e.preventDefault(); choose(results[sel]); }
  });

  form.platform.addEventListener('change', () => {
    f.platform = form.platform.value;
    f.language = suggestLanguage(f.availability, platKey(f.platform));
    updateLangOptions();
  });
  form.language.addEventListener('change', () => (f.language = form.language.value));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = titleIn.value.trim();
    if (!title) { titleIn.focus(); return toast('Escribe el nombre del anime', true); }
    const body = {
      title,
      jw_id: f.jw_id && title === f.title ? f.jw_id : (editing && title === entry.title ? entry.jw_id : null),
      poster: f.poster, kind: f.kind,
      duration: form.duration.value.trim(),
      platform: form.platform.value === 'Otra' ? '' : form.platform.value,
      language: form.language.value,
      together: form.together.checked,
      availability: f.availability,
    };
    if (!body.jw_id) { body.poster = editing && title === entry.title ? entry.poster : null; body.availability = editing && title === entry.title ? entry.availability : null; }
    $('[data-submit]', s).disabled = true;
    try {
      if (editing) await api('/entries/' + entry.id, { method: 'PATCH', body });
      else await api(`/lists/${state.list.list.id}/entries`, { body });
      s.close();
      toast(editing ? 'Guardado' : `«${title}» añadido`);
      await loadList(state.list.list.id);
      drawList(true);
      if (!editing) $('.add-row')?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } catch (ex) { fail(ex); $('[data-submit]', s).disabled = false; }
  });

  $('[data-delete]', s)?.addEventListener('click', async () => {
    s.close();
    if (!(await confirmSheet({ title: '¿Quitar de la tabla?', text: `Se eliminará <b>${esc(entry.title)}</b> con sus checks y notas.` }))) return;
    try {
      await api('/entries/' + entry.id, { method: 'DELETE' });
      toast('Anime eliminado');
      await loadList(state.list.list.id);
      drawList(true);
    } catch (ex) { fail(ex); }
  });

  fillSelects();
  if (editing && entry.jw_id) {
    drawDetail({ id: entry.jw_id, title: entry.title, poster: entry.poster, type: entry.kind, platforms: entry.availability || [] }, false);
    refreshLive(entry.jw_id);
  } else if (!editing) setTimeout(() => titleIn.focus(), 60);
}

// ───────────── Opciones de tabla, columnas y compartir ─────────────
function listMenu() {
  const { list } = state.list;
  const owner = list.role === 'owner';
  const s = openSheet(`
    <h3>${esc(list.name)}</h3>
    <div style="display:grid;gap:8px">
      <button class="btn block" data-a="rename" style="justify-content:flex-start">${ICON.pencil} Cambiar nombre</button>
      <button class="btn block" data-a="people" style="justify-content:flex-start">${ICON.columns} Personas / columnas de check y nota</button>
      ${owner ? `<button class="btn block" data-a="share" style="justify-content:flex-start">${ICON.share} Compartir con un amigo</button>` : ''}
      <button class="btn block" data-a="delete" style="justify-content:flex-start;color:var(--red)">${ICON.trash} ${owner ? 'Eliminar tabla' : 'Salir de la tabla'}</button>
    </div>`);
  $$('[data-a]', s).forEach((b) => b.addEventListener('click', async () => {
    s.close();
    const a = b.dataset.a;
    if (a === 'rename') {
      const r = await promptSheet({ title: 'Cambiar nombre', label: 'Nombre de la tabla', value: list.name });
      if (!r) return;
      try { await api('/lists/' + list.id, { method: 'PATCH', body: { name: r.value } }); await loadList(list.id); drawList(); toast('Nombre cambiado'); } catch (e) { fail(e); }
    } else if (a === 'people') peopleSheet();
    else if (a === 'share') shareSheet();
    else if (a === 'delete') {
      const ok = await confirmSheet(owner
        ? { title: '¿Eliminar tabla?', text: `Se borrará <b>${esc(list.name)}</b> para todos. No se puede deshacer.` }
        : { title: '¿Salir de la tabla?', text: `Dejarás de ver <b>${esc(list.name)}</b>.`, ok: 'Salir' });
      if (!ok) return;
      try { await api('/lists/' + list.id, { method: 'DELETE' }); toast(owner ? 'Tabla eliminada' : 'Has salido'); go('#/tablas'); } catch (e) { fail(e); }
    }
  }));
}

function peopleSheet() {
  const { list, people } = state.list;
  const s = openSheet(`
    <h3>Personas de la tabla</h3>
    <p class="muted" style="margin-top:-8px;font-size:14px">Cada persona tiene su columna de <b>check</b> y de <b>nota</b>, con su color.</p>
    <div class="people-edit">${people.map((p) => `
      <div class="person" data-pid="${p.id}">
        <input type="color" value="${p.color}" data-color aria-label="Color">
        <input class="input" value="${esc(p.name)}" maxlength="24" data-name>
        <button class="iconbtn danger" data-rm aria-label="Quitar">${ICON.trash}</button>
      </div>`).join('')}</div>
    <form class="row" data-add style="margin-top:12px">
      <input class="input" name="n" placeholder="Nueva persona" maxlength="24" required>
      <button class="btn primary" style="flex:0 0 auto">${ICON.plus}</button>
    </form>
    <div class="actions"><button class="btn primary" data-close>Listo</button></div>`, { onClose: async () => { await loadList(list.id); drawList(); } });

  $$('[data-pid]', s).forEach((row) => {
    const pid = row.dataset.pid;
    const save = (body) => api('/people/' + pid, { method: 'PATCH', body }).catch(fail);
    $('[data-name]', row).addEventListener('change', (e) => e.target.value.trim() && save({ name: e.target.value.trim() }));
    $('[data-color]', row).addEventListener('change', (e) => save({ color: e.target.value }));
    $('[data-rm]', row).addEventListener('click', async () => {
      const name = $('[data-name]', row).value;
      s.close();
      if (!(await confirmSheet({ title: `¿Quitar a ${name}?`, text: 'Se borrarán sus checks y notas de esta tabla.' }))) return;
      try { await api('/people/' + pid, { method: 'DELETE' }); await loadList(list.id); peopleSheet(); } catch (e) { fail(e); }
    });
  });
  $('[data-add]', s).addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = e.target.n.value.trim();
    if (!name) return;
    const color = PERSON_COLORS[people.length % PERSON_COLORS.length];
    try { await api(`/lists/${list.id}/people`, { body: { name, color } }); s.close(); await loadList(list.id); peopleSheet(); } catch (ex) { fail(ex); }
  });
}

async function shareSheet() {
  const { list, members } = state.list;
  let friends;
  try { ({ friends } = await api('/friends')); } catch (e) { return fail(e); }
  const memberIds = new Set(members.map((m) => m.id));
  const s = openSheet(`
    <h3>Compartir «${esc(list.name)}»</h3>
    <p class="muted" style="margin-top:-8px;font-size:14px">Las personas con las que la compartas podrán verla y editarla. Se les añade su columna de check y nota.</p>
    ${friends.length ? friends.map((f) => `
      <div class="person">
        <div class="avatar" style="${avatarStyle(f.username)}">${esc(f.username[0].toUpperCase())}</div>
        <div class="name">@${esc(f.username)}${memberIds.has(f.id) ? '<small>Puede editar esta tabla</small>' : ''}</div>
        ${memberIds.has(f.id)
          ? `<button class="small-btn danger" data-unshare="${f.id}">Dejar de compartir</button>`
          : `<button class="small-btn primary" data-share="${f.id}">Compartir</button>`}
      </div>`).join('')
      : `<div class="empty">Todavía no tienes amigos agregados.<br><br><a class="btn primary" href="#/amigos">Buscar amigos</a></div>`}
    <div class="actions"><button class="btn" data-close>Cerrar</button></div>`);
  $$('[data-share]', s).forEach((b) => b.addEventListener('click', async () => {
    b.disabled = true;
    try { await api(`/lists/${list.id}/share`, { body: { userId: Number(b.dataset.share) } }); toast('¡Tabla compartida!'); s.close(); await loadList(list.id); drawList(); } catch (e) { fail(e); b.disabled = false; }
  }));
  $$('[data-unshare]', s).forEach((b) => b.addEventListener('click', async () => {
    try { await api(`/lists/${list.id}/share/${b.dataset.unshare}`, { method: 'DELETE' }); toast('Ya no está compartida con esa persona'); s.close(); await loadList(list.id); drawList(); } catch (e) { fail(e); }
  }));
  $('[href="#/amigos"]', s)?.addEventListener('click', () => s.close());
}

// ───────────── Amigos ─────────────
async function renderFriends() {
  app.innerHTML = topbar('Amigos') + `
    <div class="card section">
      <h2>${ICON.search} Buscar por usuario</h2>
      <label class="search toolbar" style="margin:0;position:relative"><input class="input" type="search" placeholder="Nombre de usuario exacto o empieza por…" data-us autocapitalize="none" spellcheck="false" autocomplete="off"></label>
      <div data-results></div>
    </div>
    <div data-friends><div class="skeleton"></div></div>`;
  const input = $('[data-us]', app);
  const resBox = $('[data-results]', app);
  let deb, seq = 0;
  input.addEventListener('input', () => {
    clearTimeout(deb);
    const q = input.value.trim();
    if (!q) { resBox.innerHTML = ''; return; }
    deb = setTimeout(async () => {
      const my = ++seq;
      try {
        const { users } = await api('/users/search?q=' + encodeURIComponent(q));
        if (my !== seq) return;
        resBox.innerHTML = users.length ? users.map((u) => {
          const [status, dir] = (u.relation || '').split(':');
          let action = `<button class="small-btn primary" data-req="${esc(u.username)}">${ICON.plus.replace('<svg', '<svg style="width:16px;height:16px"')} Solicitar</button>`;
          if (status === 'accepted') action = '<span class="chip">✓ Amigos</span>';
          else if (status === 'pending' && dir === 'out') action = '<span class="chip">Enviada</span>';
          else if (status === 'pending' && dir === 'in') action = `<button class="small-btn primary" data-req="${esc(u.username)}">Aceptar</button>`;
          return `<div class="person"><div class="avatar" style="${avatarStyle(u.username)}">${esc(u.username[0].toUpperCase())}</div><div class="name">@${esc(u.username)}</div>${action}</div>`;
        }).join('') : '<div class="empty">No hay nadie con ese nombre de usuario</div>';
        $$('[data-req]', resBox).forEach((b) => b.addEventListener('click', async () => {
          b.disabled = true;
          try {
            const r = await api('/friends/request', { body: { username: b.dataset.req } });
            toast(r.accepted ? '¡Ahora sois amigos!' : 'Solicitud enviada');
            input.dispatchEvent(new Event('input'));
            drawFriendLists();
          } catch (e) { fail(e); b.disabled = false; }
        }));
      } catch (e) { fail(e); }
    }, 250);
  });
  drawFriendLists();
}

async function drawFriendLists() {
  const box = $('[data-friends]', app);
  if (!box) return;
  let data;
  try { data = await api('/friends'); } catch (e) { return fail(e); }
  const { friends, incoming, outgoing } = data;
  const person = (u, actions, sub = '') => `<div class="person"><div class="avatar" style="${avatarStyle(u.username)}">${esc(u.username[0].toUpperCase())}</div><div class="name">@${esc(u.username)}${sub ? `<small>${sub}</small>` : ''}</div>${actions}</div>`;
  box.innerHTML = `
    <div class="card section">
      <h2>Solicitudes ${incoming.length ? `<span class="count">${incoming.length}</span>` : ''}</h2>
      ${incoming.length ? incoming.map((r) => person(r, `
        <button class="round ok" data-acc="${r.requestId}" aria-label="Aceptar">${ICON.check}</button>
        <button class="round no" data-rej="${r.requestId}" aria-label="Rechazar">${ICON.x}</button>`, 'Quiere ser tu amigo/a')).join('')
        : '<div class="empty">No tienes solicitudes pendientes</div>'}
      ${outgoing.length ? `<div class="muted" style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin:14px 0 2px">Enviadas</div>
        ${outgoing.map((r) => person(r, `<button class="small-btn" data-cancel="${r.requestId}">Cancelar</button>`, 'Pendiente de aceptar')).join('')}` : ''}
    </div>
    <div class="card section">
      <h2>Mis amigos ${friends.length ? `<span class="count">${friends.length}</span>` : ''}</h2>
      ${friends.length ? friends.map((f) => person(f, `<button class="iconbtn danger" data-unf="${f.id}" data-name="${esc(f.username)}" aria-label="Eliminar amigo">${ICON.trash}</button>`)).join('')
        : '<div class="empty">Busca a alguien por su nombre de usuario para empezar</div>'}
    </div>`;
  const act = async (path, msg) => {
    try { await api(path, { method: 'POST' }); toast(msg); drawFriendLists(); refreshBadge(); } catch (e) { fail(e); }
  };
  $$('[data-acc]', box).forEach((b) => b.addEventListener('click', () => act(`/friends/requests/${b.dataset.acc}/accept`, '¡Solicitud aceptada!')));
  $$('[data-rej]', box).forEach((b) => b.addEventListener('click', () => act(`/friends/requests/${b.dataset.rej}/reject`, 'Solicitud rechazada')));
  $$('[data-cancel]', box).forEach((b) => b.addEventListener('click', () => act(`/friends/requests/${b.dataset.cancel}/cancel`, 'Solicitud cancelada')));
  $$('[data-unf]', box).forEach((b) => b.addEventListener('click', async () => {
    if (!(await confirmSheet({ title: '¿Eliminar amigo?', text: `Dejarás de ser amigo/a de <b>@${esc(b.dataset.name)}</b>.` }))) return;
    try { await api('/friends/' + b.dataset.unf, { method: 'DELETE' }); toast('Amigo eliminado'); drawFriendLists(); } catch (e) { fail(e); }
  }));
}

// ───────────── Perfil ─────────────
async function renderProfile() {
  let me;
  try { me = await api('/me'); } catch (e) { return fail(e); }
  const { user, stats } = me;
  const since = new Date(user.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  let meta = null;
  try { meta = await api('/meta'); } catch { /* opcional */ }
  app.innerHTML = topbar('Perfil') + `
    <div class="card profile-hero fade-in">
      <div class="avatar" style="${avatarStyle(user.username)}">${esc(user.username[0].toUpperCase())}</div>
      <h2>@${esc(user.username)}</h2>
      <div class="muted">Miembro desde el ${since}</div>
      <div class="stats">
        <div><b>${stats.lists}</b><span>Tablas</span></div>
        <div><b>${stats.friends}</b><span>Amigos</span></div>
        <div><b>${stats.requests}</b><span>Solicitudes</span></div>
      </div>
    </div>
    <div class="card section">
      <h2>Dónde ver</h2>
      <div class="plat-list" style="justify-content:flex-start">${Object.keys(PLATFORMS).map((k) => platBadge(k)).join('')}</div>
      <p class="muted" style="font-size:13px;margin:10px 0 0">Disponibilidad e idiomas para <b>España</b> 🇪🇸${meta?.catalog?.count ? ` · ${meta.catalog.count} animes en el catálogo` : ''}. Se consulta en directo al elegir un anime.</p>
    </div>
    <button class="btn danger block" data-logout>${ICON.logout} Cerrar sesión</button>`;
  $('[data-logout]', app).addEventListener('click', async () => {
    if (!(await confirmSheet({ title: '¿Cerrar sesión?', text: 'Tendrás que volver a entrar con tu usuario y contraseña.', ok: 'Cerrar sesión', icon: ICON.logout }))) return;
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* da igual */ }
    state.user = null;
    location.hash = '#/login';
  });
}

// ───────────── Arranque ─────────────
loadBackdrop();
route();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
