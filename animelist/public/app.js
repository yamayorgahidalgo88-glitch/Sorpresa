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
  grip: '<svg viewBox="0 0 24 24"><path d="M5 8h14M5 12h14M5 16h14"/></svg>',
  palette: '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 100 18c1.1 0 1.6-.8 1.6-1.6 0-.9-.7-1.3-.7-2.2 0-.9.8-1.6 1.7-1.6H17a4 4 0 004-4c0-4.7-4-8.6-9-8.6z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="14.5" cy="7" r="1"/></svg>',
  pencil: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  columns: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/></svg>',
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
const avatarStyle = (name, color) => {
  if (color) return `--a1:${color};--a2:color-mix(in srgb, ${color} 55%, #000)`;
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
const state = { user: null, list: null, filter: 'all', query: '', friendsBadge: 0, rankKey: null, rankKind: 'show', dragging: false };
let pollTimer = null;

function go(hash) { if (location.hash !== hash) location.hash = hash; else route(); }

async function route() {
  clearInterval(pollTimer);
  const hash = location.hash || '#/tablas';
  if (!state.user) {
    try { state.user = (await api('/me')).user; } catch { state.user = null; }
  }
  if (!state.user) return renderAuth();
  if (!state.user.quizDone) return renderQuiz();
  if (hash === '#/test') return renderQuiz({ again: true });
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
// ───────────── Dispositivo y «Recordar usuario» ─────────────
function deviceName() {
  const ua = navigator.userAgent || '';
  const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? (/Mobile/.test(ua) ? 'Móvil Android' : 'Tablet Android')
    : /Macintosh/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'PC Windows' : /Linux/.test(ua) ? 'Linux' : 'este dispositivo';
  const br = /EdgA?\//.test(ua) ? 'Edge' : /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /CriOS|Chrome\//.test(ua) ? 'Chrome'
    : /FxiOS|Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : '';
  return br ? `${os} · ${br}` : os;
}
const DEVICE_ICON = () => (/iPhone|Android.*Mobile/.test(navigator.userAgent) ? '📱' : /iPad|Android/.test(navigator.userAgent) ? '📲' : '💻');
const pref = {
  get: (k) => { try { return localStorage.getItem('animelist:' + k); } catch { return null; } },
  set: (k, v) => { try { if (v == null) localStorage.removeItem('animelist:' + k); else localStorage.setItem('animelist:' + k, v); } catch { /* nada */ } },
};

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
        <label class="toggle remember"><span>Recordar usuario<small>${DEVICE_ICON()} En ${esc(deviceName())} entrarás directamente</small></span>
          <span class="switch"><input type="checkbox" name="remember" checked><i></i></span></label>
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
  const last = pref.get('lastUser');
  if (last && mode === 'login') { form.username.value = last; setTimeout(() => form.password.focus(), 50); }
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
      const remember = form.remember.checked;
      const { user } = await api('/auth/' + mode, { body: { username, password, remember } });
      state.user = user;
      pref.set('remember', remember ? '1' : '0');
      pref.set('lastUser', remember ? user.username : null);
      toast(mode === 'register' ? `¡Bienvenido/a, ${user.username}!` : `Hola de nuevo, ${user.username}`);
      go('#/tablas');
    } catch (ex) {
      err.textContent = ex.message;
    } finally { btn.disabled = false; }
  });
}

// ───────────── Colores y test de personalidad ─────────────
const COLORS = [
  { hex: '#ff4d5e', name: 'Rojo' }, { hex: '#ff8a1f', name: 'Naranja' }, { hex: '#ffd23f', name: 'Amarillo' },
  { hex: '#8bc34a', name: 'Verde', reservedFor: 'yhm' }, { hex: '#2ed3c6', name: 'Turquesa' }, { hex: '#4aa8ff', name: 'Azul' },
  { hex: '#a77bff', name: 'Morado' }, { hex: '#ff6fb5', name: 'Rosa' },
];
const colorName = (hex) => COLORS.find((c) => c.hex === hex)?.name || 'tu color';
const isReservedFor = (c, user) => c.reservedFor && c.reservedFor !== user.username.toLowerCase();

const CHARACTERS = {
  rengoku: { name: 'Kyojuro Rengoku', anime: 'Kimetsu no Yaiba', color: '#ff4d5e',
    why: 'Vas de frente y con el corazón en llamas. Proteges a los tuyos y contagias tu energía a todo el que tienes cerca.' },
  jinwoo: { name: 'Sung Jinwoo', anime: 'Solo Leveling', color: '#a77bff',
    why: 'Tranquilidad por fuera, fuerza imparable por dentro. Vas a tu ritmo, subes de nivel en silencio y cuando apareces, arrasas.' },
  hinata: { name: 'Shoyo Hinata', anime: 'Haikyu!!', color: '#ff8a1f',
    why: 'Pura energía. No te rindes nunca y saltas más alto que nadie aunque te digan que no puedes.' },
  mitsuri: { name: 'Mitsuri Kanroji', anime: 'Kimetsu no Yaiba', color: '#ff6fb5',
    why: 'Cariño a lo grande, risas y un apetito legendario. Pareces dulce, pero cuando toca proteger a los tuyos eres de las más fuertes.' },
  kageyama: { name: 'Tobio Kageyama', anime: 'Haikyu!!', color: '#4aa8ff',
    why: 'Estrategia y perfeccionismo. Ves la jugada antes que nadie y pones el balón justo donde hace falta.' },
  zenitsu: { name: 'Zenitsu Agatsuma', anime: 'Kimetsu no Yaiba', color: '#ffd23f',
    why: 'Un poquito de drama y bastante miedo… hasta que toca de verdad. Entonces eres un rayo.' },
  tanjiro: { name: 'Tanjiro Kamado', anime: 'Kimetsu no Yaiba', color: '#8bc34a',
    why: 'Amabilidad, esfuerzo y lealtad. Nunca abandonas a tu familia ni a tus amigos, pase lo que pase.' },
};

const charImg = (key) => `/img/characters/${key}.jpg`;

const QUIZ = [
  { anime: 'Kimetsu no Yaiba', q: 'Es de noche y te encuentras con un demonio. ¿Qué haces?', a: [
    ['Desenvaino la espada y voy a por él', { rengoku: 3, tanjiro: 1 }],
    ['Aviso a mis compañeros y lo rodeamos', { kageyama: 2, tanjiro: 2 }],
    ['Me escondo y estudio cómo se mueve', { jinwoo: 3 }],
    ['¡Huyo gritando! …y luego vuelvo a por él', { zenitsu: 3, mitsuri: 1 }],
  ] },
  { anime: 'Haikyu!!', q: 'Partido de vóley. ¿En qué posición juegas?', a: [
    ['Rematador: quiero el último toque', { hinata: 3, rengoku: 1 }],
    ['Colocador: yo dirijo el juego', { kageyama: 3 }],
    ['Líbero: que no caiga ni un balón', { tanjiro: 2, zenitsu: 1 }],
    ['Saque: un buen saque y punto directo', { jinwoo: 2, zenitsu: 1 }],
  ] },
  { anime: 'Solo Leveling', q: 'Se abre una mazmorra de rango S delante de ti.', a: [
    ['Entro sin nadie: así subo de nivel', { jinwoo: 3 }],
    ['Monto un equipo y reparto los roles', { kageyama: 2, tanjiro: 1 }],
    ['Entro en primera fila para proteger al resto', { rengoku: 3, hinata: 1 }],
    ['Me quedo fuera con snacks a ver qué pasa', { zenitsu: 2, mitsuri: 2 }],
  ] },
  { anime: 'Tokyo Ghoul', q: 'Despiertas en el hospital y, como Kaneki, ahora eres medio ghoul. ¿Qué haces?', a: [
    ['Lucho por seguir siendo humano y proteger a mis amigos', { tanjiro: 2, rengoku: 1 }],
    ['Me refugio en Anteiku y aprendo de Touka y del jefe', { mitsuri: 2, kageyama: 1 }],
    ['Acepto mi lado ghoul y me hago más fuerte en solitario', { jinwoo: 3 }],
    ['Me encierro con un café de Anteiku… y que me rescaten', { zenitsu: 3 }],
  ] },
  { anime: 'Naruto', q: '¿Cuál es tu camino ninja?', a: [
    ['No rendirme jamás, ¡dattebayo!', { hinata: 3 }],
    ['Proteger a los míos cueste lo que cueste', { tanjiro: 2, rengoku: 2 }],
    ['Ser el más fuerte, aunque sea en solitario', { jinwoo: 2, kageyama: 1 }],
    ['Disfrutar del camino con mis amigos', { mitsuri: 2, zenitsu: 1, hinata: 1 }],
  ] },
];

function quizResult(answers, user) {
  const order = Object.keys(CHARACTERS).filter((k) => !isReservedFor(COLORS.find((c) => c.hex === CHARACTERS[k].color), user));
  const score = Object.fromEntries(order.map((k) => [k, 0]));
  answers.forEach((ai, qi) => Object.entries(QUIZ[qi].a[ai][1]).forEach(([k, v]) => { if (k in score) score[k] += v; }));
  return order.reduce((best, k) => (score[k] > score[best] ? k : best), order[0]);
}

function renderQuiz({ again = false } = {}) {
  document.body.classList.add('auth');
  $('#tabbar').hidden = true;
  const user = state.user;
  const answers = [];
  const intro = () => {
    app.innerHTML = `<div class="quiz fade-in">
      <img class="quiz-logo" src="/img/logo-256.png" alt="">
      <div class="quiz-kicker">${again ? 'Repetir test' : `¡Hola, ${esc(user.username)}!`}</div>
      <h1 class="quiz-title">¿Qué color<br><em>te representa?</em></h1>
      <p class="muted">5 preguntas sobre nuestros animes. Al final sabrás tu color y a qué personaje te pareces. Lo podrás cambiar cuando quieras en tu perfil.</p>
      <button class="btn primary block" data-start>Empezar el test</button>
      ${again ? '<button class="btn ghost block" data-skip>Volver al perfil</button>' : ''}
    </div>`;
    $('[data-start]', app).addEventListener('click', () => step(0));
    $('[data-skip]', app)?.addEventListener('click', () => go('#/perfil'));
  };
  const step = (i) => {
    const q = QUIZ[i];
    app.innerHTML = `<div class="quiz fade-in">
      <div class="quiz-progress">${QUIZ.map((_, k) => `<i class="${k < i ? 'done' : k === i ? 'now' : ''}"></i>`).join('')}</div>
      <div class="quiz-kicker">Pregunta ${i + 1} de ${QUIZ.length} · <span class="chip orange">${esc(q.anime)}</span></div>
      <h2 class="quiz-q">${esc(q.q)}</h2>
      <div class="quiz-options">${q.a.map(([t], k) => `<button class="quiz-opt" data-a="${k}"><b>${'ABCD'[k]}</b><span>${esc(t)}</span></button>`).join('')}</div>
      ${i > 0 ? '<button class="btn ghost" data-back>← Anterior</button>' : ''}
    </div>`;
    $$('[data-a]', app).forEach((b) => b.addEventListener('click', () => {
      b.classList.add('picked');
      answers[i] = Number(b.dataset.a);
      setTimeout(() => (i + 1 < QUIZ.length ? step(i + 1) : result()), 220);
    }));
    $('[data-back]', app)?.addEventListener('click', () => step(i - 1));
  };
  const result = async () => {
    const key = quizResult(answers, user);
    const ch = CHARACTERS[key];
    const keep = user.color && user.color !== ch.color ? user.color : null;
    app.innerHTML = `<div class="quiz result fade-in" style="--c:${ch.color}">
      <div class="quiz-kicker">Tu color es</div>
      <h1 class="quiz-title color-name">${esc(colorName(ch.color))}</h1>
      <div class="result-card">
        <div class="result-poster"><img src="${charImg(key)}" alt="${esc(ch.name)}"></div>
        <div class="result-txt">
          <small>Te pareces a</small>
          <b>${esc(ch.name)}</b>
          <span class="chip">${esc(ch.anime)}</span>
          <p>${esc(ch.why)}</p>
        </div>
      </div>
      <button class="btn primary block" data-use style="background:${ch.color};color:#111">Usar el ${esc(colorName(ch.color).toLowerCase())}</button>
      ${keep ? `<button class="btn block" data-keep><i class="swatch" style="background:${keep}"></i> Mantener mi ${esc(colorName(keep).toLowerCase())}</button>` : ''}
      <button class="btn ghost block" data-other>Elegir otro color</button>
    </div>`;
    const finish = async (color) => {
      try {
        state.user = (await api('/me', { method: 'PATCH', body: { quizResult: key, color } })).user;
        toast(`¡Listo! Tu color es el ${colorName(color).toLowerCase()}`);
        go(again ? '#/perfil' : '#/tablas');
      } catch (e) { fail(e); }
    };
    $('[data-use]', app).addEventListener('click', () => finish(ch.color));
    $('[data-keep]', app)?.addEventListener('click', () => finish(keep));
    $('[data-other]', app).addEventListener('click', async () => {
      const c = await colorSheet(ch.color);
      if (c) finish(c);
    });
  };
  intro();
}

function colorSheet(current) {
  return new Promise((resolve) => {
    let done = false;
    const s = openSheet(`
      <h3>Elige tu color</h3>
      <p class="muted" style="margin-top:-8px;font-size:14px">Es el color de tu columna de check y nota en todas las tablas.</p>
      <div class="swatches">${COLORS.map((c) => {
        const taken = isReservedFor(c, state.user);
        return `<button class="sw ${c.hex === current ? 'on' : ''}" data-c="${c.hex}" style="--c:${c.hex}" ${taken ? 'disabled' : ''}>
          <i></i><span>${c.name}</span>${taken ? '<small>Reservado</small>' : ''}</button>`;
      }).join('')}</div>
      <div class="actions"><button class="btn" data-close>Cancelar</button></div>`, { onClose: () => !done && resolve(null) });
    $$('[data-c]', s).forEach((b) => b.addEventListener('click', () => { done = true; s.close(); resolve(b.dataset.c); }));
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
    extra: `<label class="toggle"><span>Empezar con nuestros <b>animes para ver juntos</b><br><small class="muted">Los 9 de la lista M&amp;Y, con sus checks y notas</small></span>
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
    if (document.visibilityState !== 'visible' || $('.sheet') || state.dragging || location.hash !== '#/tabla/' + id) return;
    const prev = state.list.list.updated_at;
    try { await loadList(id); if (state.list.list.updated_at !== prev) drawList(true); } catch { /* reintenta luego */ }
  }, 8000);
}

// Ranking: podio por persona (o media) y por tipo (series / películas)
function rankingFor(key, kind, people, entries) {
  const score = (e) => {
    if (key !== 'avg') return e.marks[key]?.rating ?? null;
    const rs = people.map((p) => e.marks[p.id]?.rating).filter((r) => r != null);
    return rs.length ? Math.round((rs.reduce((a, b) => a + b, 0) / rs.length) * 100) / 100 : null;
  };
  return entries.filter((e) => (e.kind === 'movie' ? 'movie' : 'show') === kind)
    .map((e) => ({ e, r: score(e) })).filter((x) => x.r != null).sort((a, b) => b.r - a.r).slice(0, 3);
}

const LANG_FLAG = { 'Español': '🇪🇸', 'Japonés': '🇯🇵', 'Inglés': '🇬🇧', 'Catalán': '🏴', 'Francés': '🇫🇷', 'Italiano': '🇮🇹', 'Alemán': '🇩🇪', 'Portugués': '🇵🇹', 'Coreano': '🇰🇷', 'Chino': '🇨🇳' };
const isMine = (p) => p.user_id === state.user.id;

function podiumHtml() {
  const { people, entries } = state.list;
  const tabs = [...people.map((p) => ({ key: p.id, name: p.name, color: p.color })), ...(people.length > 1 ? [{ key: 'avg', name: 'Media', color: 'var(--orange)' }] : [])];
  if (!tabs.some((t) => t.key === state.rankKey)) state.rankKey = people.find(isMine)?.id ?? tabs[0]?.key;
  const tab = tabs.find((t) => t.key === state.rankKey);
  if (!tab) return '';
  const kind = state.rankKind;
  const top = rankingFor(tab.key, kind, people, entries);
  const slot = (place) => {
    const x = top[place - 1];
    const medal = ['', 'gold', 'silver', 'bronze'][place];
    return `<div class="pod pod-${place} ${medal}">
      ${x ? `<button class="pod-card" data-open-entry="${x.e.id}">
          <span class="pod-poster">${x.e.poster ? `<img src="${esc(x.e.poster)}" alt="" referrerpolicy="no-referrer">` : `<span class="ph">${esc(x.e.title[0] || '?')}</span>`}<i class="medal">${place}</i></span>
          <span class="pod-title">${esc(x.e.title)}</span>
          <span class="pod-score">${fmtRating(x.r)}</span>
        </button>` : '<div class="pod-card empty"><span class="pod-poster"><span class="ph">?</span></span><span class="pod-title muted">Sin nota</span></div>'}
      <div class="pod-base"><span>${place}</span></div>
    </div>`;
  };
  const who = tab.key === 'avg' ? 'pongáis' : isMine(people.find((p) => p.id === tab.key) || {}) ? 'pongas' : `${tab.name} ponga`;
  return `
    <div class="rank-head">
      <h2>🏆 Ranking</h2>
      <div class="rank-tabs" role="tablist">${tabs.map((t) => `<button role="tab" data-rank="${t.key}" class="${t.key === tab.key ? 'on' : ''}" style="--c:${t.color}">${esc(t.name)}</button>`).join('')}</div>
    </div>
    <div class="kind-tabs">${[['show', '📺 Series'], ['movie', '🎬 Películas']].map(([k, t]) => `<button data-kind="${k}" class="${kind === k ? 'on' : ''}">${t}</button>`).join('')}</div>
    ${top.length ? `<div class="podium">${slot(2)}${slot(1)}${slot(3)}</div>`
      : `<div class="empty" style="padding:18px 8px 22px">Cuando ${esc(who)} notas a ${kind === 'movie' ? 'alguna película' : 'alguna serie'}, aquí saldrá el podio.</div>`}`;
}

function progressHtml() {
  const { people, entries } = state.list;
  if (!entries.length) return '';
  return `<div class="progress">${people.map((p) => {
    const n = entries.filter((e) => e.marks[p.id]?.seen).length;
    return `<div class="prog" style="--c:${p.color}"><div class="prog-top"><span><i class="dot"></i>${esc(p.name)}${isMine(p) ? ' <small class="muted">(tú)</small>' : ''}</span><b>${n}<small>/${entries.length}</small></b></div>
      <div class="bar"><i style="width:${(n / entries.length) * 100}%"></i></div></div>`;
  }).join('')}</div>`;
}

function visibleEntries() {
  const { entries, people, pendingOrder } = state.list;
  const q = state.query.trim().toLowerCase();
  const rows = entries.filter((e) => {
    if (q && !e.title.toLowerCase().includes(q)) return false;
    const seenAll = people.length && people.every((p) => e.marks[p.id]?.seen);
    const seenAny = people.some((p) => e.marks[p.id]?.seen);
    if (state.filter === 'pending') return !seenAll;
    if (state.filter === 'seen') return seenAny;
    return true;
  });
  if (state.filter !== 'pending') return rows;
  // En «Pendientes» manda tu orden personal; lo nuevo va al final
  const pos = new Map((pendingOrder || []).map((id, i) => [id, i]));
  return rows.map((e, i) => ({ e, k: pos.has(e.id) ? pos.get(e.id) : 1e6 + i })).sort((a, b) => a.k - b.k).map((x) => x.e);
}

function drawList(keepScroll = false) {
  const { list, people, entries, members } = state.list;
  const scroll = keepScroll ? $('.table-wrap')?.scrollLeft : 0;
  const owner = list.role === 'owner';
  const others = members.filter((m) => m.id !== state.user.id);
  const head = (p, label) => `<th class="p" style="--c:${p.color}"><span class="ph-head" title="${esc(p.name)}"><i>${esc(p.name[0]?.toUpperCase() || '?')}</i>${label}</span>
    <small class="ph-name">${isMine(p) ? 'Tú' : esc(p.name)}${p.user_id ? '' : ' · sin unir'}</small></th>`;

  app.innerHTML = topbar(list.name, {
    back: '#/tablas',
    sub: `${entries.length} animes${others.length ? ` · con ${others.map((m) => '@' + esc(m.username)).join(', ')}` : ''}`,
    right: `${owner ? `<button class="iconbtn" data-share aria-label="Compartir">${ICON.share}</button>` : ''}<button class="iconbtn" data-menu aria-label="Opciones">${ICON.dots}</button>`,
  }) + `
  <div class="fade-in">
    <div class="card section rank-card" data-podium>${podiumHtml()}</div>
    ${progressHtml()}

    <div class="toolbar">
      <label class="search">${ICON.search}<input class="input" type="search" placeholder="Buscar en la tabla…" value="${esc(state.query)}" data-q></label>
      <div class="filters">
        ${[['all', 'Todos'], ['pending', 'Pendientes'], ['seen', 'Vistos']].map(([k, t]) =>
          `<button data-f="${k}" class="${state.filter === k ? 'on' : ''}">${t}</button>`).join('')}
      </div>
    </div>
    <div class="order-hint" data-hint ${state.filter === 'pending' ? '' : 'hidden'}>${ICON.grip} Arrastra desde las rayas para ordenar qué ver primero. Este orden es solo tuyo.</div>

    <div class="table-wrap"><table class="anime">
      <thead><tr>
        ${people.map((p) => head(p, 'Visto')).join('')}
        <th class="name">Anime</th><th>Plataforma</th><th>Idioma</th>
        ${people.map((p) => head(p, 'Nota')).join('')}
      </tr></thead>
      <tbody></tbody>
    </table></div>

    <div class="add-row"><button class="btn primary block" data-add>${ICON.plus} Añadir anime</button></div>
  </div>`;

  drawRows();
  if (scroll) $('.table-wrap').scrollLeft = scroll;
  bindPodium();

  $('[data-add]', app).addEventListener('click', () => entrySheet());
  $('[data-menu]', app).addEventListener('click', listMenu);
  $('[data-share]', app)?.addEventListener('click', shareSheet);
  $('[data-q]', app).addEventListener('input', (e) => { state.query = e.target.value; drawRows(); });
  $$('[data-f]', app).forEach((b) => b.addEventListener('click', () => {
    state.filter = b.dataset.f;
    $$('[data-f]', app).forEach((x) => x.classList.toggle('on', x === b));
    $('[data-hint]', app).hidden = state.filter !== 'pending';
    drawRows();
  }));
}

function bindPodium() {
  const box = $('[data-podium]', app);
  const redraw = () => { box.innerHTML = podiumHtml(); bindPodium(); };
  $$('[data-rank]', box).forEach((b) => b.addEventListener('click', () => {
    state.rankKey = b.dataset.rank === 'avg' ? 'avg' : Number(b.dataset.rank);
    redraw();
  }));
  $$('[data-kind]', box).forEach((b) => b.addEventListener('click', () => { state.rankKind = b.dataset.kind; redraw(); }));
  $$('[data-open-entry]', box).forEach((b) => b.addEventListener('click', () =>
    entrySheet(state.list.entries.find((e) => e.id === Number(b.dataset.openEntry)))));
}

function drawRows() {
  const { people } = state.list;
  const rows = visibleEntries();
  const sortable = state.filter === 'pending' && !state.query.trim();
  const tbody = $('table.anime tbody', app);
  const cols = people.length * 2 + 3;
  tbody.innerHTML = rows.length ? rows.map((e) => {
    const pk = platKey(e.platform);
    const done = people.length && people.every((p) => e.marks[p.id]?.seen);
    const kind = e.kind === 'movie' ? 'Película' : 'Serie';
    const dur = e.duration && e.duration !== 'Película' ? e.duration : '';
    const lock = (p) => (isMine(p) ? '' : 'locked');
    return `<tr data-id="${e.id}" class="${done ? 'done' : ''}">
      ${people.map((p) => `<td class="p" style="--c:${p.color}"><button class="check ${e.marks[p.id]?.seen ? 'on' : ''} ${lock(p)}" data-seen="${p.id}" aria-label="Visto por ${esc(p.name)}" aria-pressed="${!!e.marks[p.id]?.seen}">${ICON.check}</button></td>`).join('')}
      <td class="name" data-open><div class="wrap">
        ${sortable ? `<span class="grip" data-grip aria-label="Arrastrar para ordenar">${ICON.grip}</span>` : ''}
        <span class="poster">${e.poster ? `<img src="${esc(e.poster)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<span class="ph">${esc(e.title[0] || '?')}</span>`}${done ? `<i class="done-badge">${ICON.check}</i>` : ''}</span>
        <div class="txt"><span class="t">${esc(e.title)}</span><span class="meta-line">${kind}${dur ? ` · ${esc(dur)}` : ''}</span></div></div></td>
      <td>${e.platform ? platBadge(pk, e.platform) : '<span class="muted">—</span>'}</td>
      <td>${e.language ? `<span class="lang">${LANG_FLAG[e.language] ? `<span class="flag">${LANG_FLAG[e.language]}</span>` : ''}${esc(e.language)}</span>` : '<span class="muted">—</span>'}</td>
      ${people.map((p) => {
        const r = e.marks[p.id]?.rating;
        return `<td class="p" style="--c:${p.color}">${r == null
          ? `<button class="rate empty-r ${lock(p)}" data-rate="${p.id}" aria-label="Nota de ${esc(p.name)}">${isMine(p) ? '+ nota' : '—'}</button>`
          : `<button class="rate ${lock(p)}" data-rate="${p.id}" style="--pct:${r * 10}%" aria-label="Nota de ${esc(p.name)}: ${fmtRating(r)}"><b>${fmtRating(r)}</b><small>/10</small><i class="rbar"></i></button>`}</td>`;
      }).join('')}
    </tr>`;
  }).join('') : `<tr class="empty-row"><td colspan="${cols}" class="empty">${state.list.entries.length ? (state.filter === 'pending' ? '¡No queda nada pendiente! 🎉' : 'Nada coincide con el filtro') : 'Tabla vacía. Pulsa «Añadir anime» para empezar.'}</td></tr>`;

  $$('tr[data-id]', tbody).forEach((tr) => {
    const entry = state.list.entries.find((x) => x.id === Number(tr.dataset.id));
    $('[data-open]', tr).addEventListener('click', () => entrySheet(entry));
    $$('[data-seen]', tr).forEach((b) => b.addEventListener('click', () => toggleSeen(entry, Number(b.dataset.seen), b)));
    $$('[data-rate]', tr).forEach((b) => b.addEventListener('click', () => ratingSheet(entry, Number(b.dataset.rate))));
    const grip = $('[data-grip]', tr);
    if (grip) grip.addEventListener('pointerdown', (ev) => startDrag(ev, tr));
    grip?.addEventListener('click', (ev) => ev.stopPropagation());
  });
}

// Arrastrar filas en «Pendientes» (ratón y dedo)
function startDrag(ev, tr) {
  ev.preventDefault();
  ev.stopPropagation();
  const tbody = tr.parentElement;
  state.dragging = true;
  tr.classList.add('dragging');
  let y0 = ev.pageY;
  const move = (e) => {
    let dy = e.pageY - y0;
    const prev = tr.previousElementSibling, next = tr.nextElementSibling;
    const swap = (other, after) => {
      const before = tr.getBoundingClientRect().top;
      if (after) other.after(tr); else other.before(tr);
      y0 += tr.getBoundingClientRect().top - before;
      dy = e.pageY - y0;
      navigator.vibrate?.(8);
    };
    if (next && dy > next.offsetHeight / 2) swap(next, true);
    else if (prev && dy < -prev.offsetHeight / 2) swap(prev, false);
    tr.style.transform = `translateY(${dy}px)`;
    if (e.clientY < 90) scrollBy(0, -12);
    else if (e.clientY > innerHeight - 140) scrollBy(0, 12);
  };
  const end = async () => {
    removeEventListener('pointermove', move);
    removeEventListener('pointerup', end);
    removeEventListener('pointercancel', end);
    tr.classList.remove('dragging');
    tr.style.transform = '';
    state.dragging = false;
    const visible = $$('tr[data-id]', tbody).map((x) => Number(x.dataset.id));
    const rest = (state.list.pendingOrder || []).filter((id) => !visible.includes(id));
    state.list.pendingOrder = [...visible, ...rest];
    try { await api(`/lists/${state.list.list.id}/pending-order`, { method: 'PUT', body: { ids: state.list.pendingOrder } }); } catch (e) { fail(e); }
  };
  addEventListener('pointermove', move);
  addEventListener('pointerup', end);
  addEventListener('pointercancel', end);
}

function lockedToast(personId) {
  const p = state.list.people.find((x) => x.id === personId);
  if (!p || isMine(p)) return false;
  toast(p.user_id ? `Solo ${p.name} puede cambiar su check y su nota` : `${p.name} aún no se ha unido a la tabla`, true);
  return true;
}

async function toggleSeen(entry, personId, btn) {
  if (lockedToast(personId)) return;
  const cur = entry.marks[personId] || { seen: false, rating: null };
  const seen = !cur.seen;
  entry.marks[personId] = { ...cur, seen };
  btn.classList.toggle('on', seen);
  btn.setAttribute('aria-pressed', seen);
  try {
    await api(`/entries/${entry.id}/marks/${personId}`, { method: 'PUT', body: { seen } });
    state.list.list.updated_at = Date.now();
    const people = state.list.people;
    btn.closest('tr')?.classList.toggle('done', people.every((p) => entry.marks[p.id]?.seen));
    const prog = $('.progress', app);
    if (prog) prog.outerHTML = progressHtml();
    if (seen) btn.animate?.([{ transform: 'scale(.6)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' });
  } catch (e) {
    entry.marks[personId] = cur;
    btn.classList.toggle('on', cur.seen);
    fail(e);
  }
}

function ratingSheet(entry, personId) {
  if (lockedToast(personId)) return;
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
  const { list, people } = state.list;
  const owner = list.role === 'owner';
  const free = people.filter((p) => !p.user_id);
  const s = openSheet(`
    <h3>${esc(list.name)}</h3>
    <div style="display:grid;gap:8px">
      <button class="btn block" data-a="rename" style="justify-content:flex-start">${ICON.pencil} Cambiar nombre</button>
      ${owner ? `<button class="btn block" data-a="share" style="justify-content:flex-start">${ICON.share} Compartir con un amigo</button>` : ''}
      ${owner && free.length ? `<button class="btn block" data-a="people" style="justify-content:flex-start">${ICON.columns} Columnas sin unir (${free.length})</button>` : ''}
      <button class="btn block" data-a="color" style="justify-content:flex-start">${ICON.palette} Cambiar mi color</button>
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
    else if (a === 'color') {
      if (await changeColor()) { await loadList(list.id); drawList(true); }
    } else if (a === 'delete') {
      const ok = await confirmSheet(owner
        ? { title: '¿Eliminar tabla?', text: `Se borrará <b>${esc(list.name)}</b> para todos. No se puede deshacer.` }
        : { title: '¿Salir de la tabla?', text: `Dejarás de ver <b>${esc(list.name)}</b>. Tus checks y notas se quedan en la tabla.`, ok: 'Salir' });
      if (!ok) return;
      try { await api('/lists/' + list.id, { method: 'DELETE' }); toast(owner ? 'Tabla eliminada' : 'Has salido'); go('#/tablas'); } catch (e) { fail(e); }
    }
  }));
}

// Columnas que aún no son de nadie (p. ej. «Marta» antes de que se una)
function peopleSheet() {
  const { list, people } = state.list;
  const free = people.filter((p) => !p.user_id);
  const s = openSheet(`
    <h3>Columnas sin unir</h3>
    <p class="muted" style="margin-top:-8px;font-size:14px">Guardan los checks y notas de alguien que todavía no está en la tabla. Al compartirle la tabla podrás darle su columna.</p>
    <div class="people-edit">${free.map((p) => `
      <div class="person" data-pid="${p.id}">
        <i class="swatch big" style="background:${p.color}"></i>
        <input class="input" value="${esc(p.name)}" maxlength="24" data-name aria-label="Nombre de la columna">
        <button class="iconbtn danger" data-rm aria-label="Quitar">${ICON.trash}</button>
      </div>`).join('') || '<div class="empty">No hay columnas sin unir</div>'}</div>
    <div class="actions"><button class="btn primary" data-close>Listo</button></div>`, { onClose: async () => { await loadList(list.id); drawList(); } });
  $$('[data-pid]', s).forEach((row) => {
    const pid = row.dataset.pid;
    $('[data-name]', row).addEventListener('change', (e) => e.target.value.trim() && api('/people/' + pid, { method: 'PATCH', body: { name: e.target.value.trim() } }).catch(fail));
    $('[data-rm]', row).addEventListener('click', async () => {
      const name = $('[data-name]', row).value;
      s.close();
      if (!(await confirmSheet({ title: `¿Quitar la columna de ${name}?`, text: 'Se borrarán sus checks y notas de esta tabla.' }))) return;
      try { await api('/people/' + pid, { method: 'DELETE' }); await loadList(list.id); drawList(); } catch (e) { fail(e); }
    });
  });
}

function pickColumnSheet(friend, free) {
  return new Promise((resolve) => {
    let done = false;
    const s = openSheet(`
      <h3>¿Cuál será la columna de @${esc(friend.username)}?</h3>
      <p class="muted" style="margin-top:-8px;font-size:14px">Si eliges una columna existente, se queda con sus checks y notas.</p>
      <div style="display:grid;gap:8px">
        ${free.map((p) => `<button class="btn block col-pick" data-p="${p.id}"><i class="swatch" style="background:${p.color}"></i> «${esc(p.name)}» <small class="muted">con sus notas</small></button>`).join('')}
        <button class="btn block col-pick" data-p="">${ICON.plus} Una columna nueva</button>
      </div>
      <div class="actions"><button class="btn" data-close>Cancelar</button></div>`, { onClose: () => !done && resolve(undefined) });
    $$('[data-p]', s).forEach((b) => b.addEventListener('click', () => { done = true; s.close(); resolve(b.dataset.p ? Number(b.dataset.p) : null); }));
  });
}

async function shareSheet() {
  const { list, members, invites, people } = state.list;
  let friends;
  try { ({ friends } = await api('/friends')); } catch (e) { return fail(e); }
  const memberIds = new Set(members.map((m) => m.id));
  const invited = new Map(invites.map((i) => [i.to_user, i]));
  const s = openSheet(`
    <h3>Compartir «${esc(list.name)}»</h3>
    <p class="muted" style="margin-top:-8px;font-size:14px">Le llegará una invitación en <b>Amigos</b>. Cuando la acepte, verá la tabla y podrá marcar sus checks y notas (solo los suyos).</p>
    ${friends.length ? friends.map((f) => {
      let action = `<button class="small-btn primary" data-share="${f.id}">Compartir</button>`;
      let sub = '';
      if (memberIds.has(f.id)) { action = `<button class="small-btn danger" data-unshare="${f.id}">Sacar</button>`; sub = 'Está en la tabla'; }
      else if (invited.has(f.id)) { action = `<button class="small-btn" data-unshare="${f.id}">Cancelar</button>`; sub = 'Invitación enviada'; }
      return `<div class="person">${avatarHtml(f)}<div class="name">@${esc(f.username)}${sub ? `<small>${sub}</small>` : ''}</div>${action}</div>`;
    }).join('')
      : `<div class="empty">Todavía no tienes amigos agregados.<br><br><a class="btn primary" href="#/amigos">Buscar amigos</a></div>`}
    <div class="actions"><button class="btn" data-close>Cerrar</button></div>`);
  $$('[data-share]', s).forEach((b) => b.addEventListener('click', async () => {
    const friend = friends.find((f) => f.id === Number(b.dataset.share));
    const free = people.filter((p) => !p.user_id);
    s.close();
    const personId = free.length ? await pickColumnSheet(friend, free) : null;
    if (personId === undefined) return;
    try {
      await api(`/lists/${list.id}/share`, { body: { userId: friend.id, personId } });
      toast(`Invitación enviada a @${friend.username}`);
      await loadList(list.id); drawList(true);
    } catch (e) { fail(e); }
  }));
  $$('[data-unshare]', s).forEach((b) => b.addEventListener('click', async () => {
    const f = friends.find((x) => x.id === Number(b.dataset.unshare));
    if (memberIds.has(f.id)) {
      s.close();
      if (!(await confirmSheet({ title: `¿Sacar a @${f.username}?`, text: 'Dejará de ver la tabla. Sus checks y notas se quedan en su columna.', ok: 'Sacar' }))) return;
    }
    try { await api(`/lists/${list.id}/share/${f.id}`, { method: 'DELETE' }); toast(memberIds.has(f.id) ? 'Ya no está en la tabla' : 'Invitación cancelada'); s.close(); await loadList(list.id); drawList(true); } catch (e) { fail(e); }
  }));
  $('[href="#/amigos"]', s)?.addEventListener('click', () => s.close());
}

// ───────────── Amigos ─────────────
const avatarHtml = (u, cls = '') => `<div class="avatar ${cls}" style="${avatarStyle(u.username, u.color)}">${esc(u.username[0].toUpperCase())}</div>`;

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
          return `<div class="person">${avatarHtml(u)}<div class="name">@${esc(u.username)}</div>${action}</div>`;
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
  const { friends, incoming, outgoing, invites } = data;
  const person = (u, actions, sub = '') => `<div class="person">${avatarHtml(u)}<div class="name">@${esc(u.username)}${sub ? `<small>${sub}</small>` : ''}</div>${actions}</div>`;
  const total = incoming.length + invites.length;
  box.innerHTML = `
    <div class="card section">
      <h2>Solicitudes ${total ? `<span class="count">${total}</span>` : ''}</h2>
      ${invites.map((i) => `
        <div class="invite">
          ${avatarHtml({ username: i.fromName, color: i.fromColor })}
          <div class="name"><small>@${esc(i.fromName)} te ha compartido una lista</small>
            <span class="inv-list">${ICON.film} ${esc(i.listName)}</span>
            <small>${i.count} anime${i.count === 1 ? '' : 's'}</small></div>
          <button class="round ok" data-iacc="${i.inviteId}" aria-label="Aceptar lista">${ICON.check}</button>
          <button class="round no" data-irej="${i.inviteId}" aria-label="Rechazar lista">${ICON.x}</button>
        </div>`).join('')}
      ${incoming.map((r) => person(r, `
        <button class="round ok" data-acc="${r.requestId}" aria-label="Aceptar">${ICON.check}</button>
        <button class="round no" data-rej="${r.requestId}" aria-label="Rechazar">${ICON.x}</button>`, 'Quiere ser tu amigo/a')).join('')}
      ${total ? '' : '<div class="empty">No tienes solicitudes pendientes</div>'}
      ${outgoing.length ? `<div class="muted" style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin:14px 0 2px">Enviadas</div>
        ${outgoing.map((r) => person(r, `<button class="small-btn" data-cancel="${r.requestId}">Cancelar</button>`, 'Pendiente de aceptar')).join('')}` : ''}
    </div>
    <div class="card section">
      <h2>Mis amigos ${friends.length ? `<span class="count">${friends.length}</span>` : ''}</h2>
      ${friends.length ? friends.map((f) => person(f, `<button class="iconbtn danger" data-unf="${f.id}" data-name="${esc(f.username)}" aria-label="Eliminar amigo">${ICON.trash}</button>`)).join('')
        : '<div class="empty">Busca a alguien por su nombre de usuario para empezar</div>'}
    </div>`;
  const act = async (path, msg) => {
    try { const r = await api(path, { method: 'POST' }); toast(msg); drawFriendLists(); refreshBadge(); return r; } catch (e) { fail(e); return null; }
  };
  $$('[data-iacc]', box).forEach((b) => b.addEventListener('click', async () => {
    const inv = invites.find((i) => i.inviteId === Number(b.dataset.iacc));
    await act(`/invites/${inv.inviteId}/accept`, `«${inv.listName}» ya está en tus tablas`);
  }));
  $$('[data-irej]', box).forEach((b) => b.addEventListener('click', () => act(`/invites/${b.dataset.irej}/reject`, 'Lista rechazada')));
  $$('[data-acc]', box).forEach((b) => b.addEventListener('click', () => act(`/friends/requests/${b.dataset.acc}/accept`, '¡Solicitud aceptada!')));
  $$('[data-rej]', box).forEach((b) => b.addEventListener('click', () => act(`/friends/requests/${b.dataset.rej}/reject`, 'Solicitud rechazada')));
  $$('[data-cancel]', box).forEach((b) => b.addEventListener('click', () => act(`/friends/requests/${b.dataset.cancel}/cancel`, 'Solicitud cancelada')));
  $$('[data-unf]', box).forEach((b) => b.addEventListener('click', async () => {
    if (!(await confirmSheet({ title: '¿Eliminar amigo?', text: `Dejarás de ser amigo/a de <b>@${esc(b.dataset.name)}</b>.` }))) return;
    try { await api('/friends/' + b.dataset.unf, { method: 'DELETE' }); toast('Amigo eliminado'); drawFriendLists(); } catch (e) { fail(e); }
  }));
}

// ───────────── Perfil ─────────────
async function changeColor() {
  const c = await colorSheet(state.user.color);
  if (!c || c === state.user.color) return false;
  try {
    state.user = (await api('/me', { method: 'PATCH', body: { color: c } })).user;
    toast(`Ahora tu color es el ${colorName(c).toLowerCase()}`);
    return true;
  } catch (e) { fail(e); return false; }
}

async function renderProfile() {
  let me;
  try { me = await api('/me'); } catch (e) { return fail(e); }
  const { user, stats } = me;
  state.user = { ...state.user, ...user };
  const since = new Date(user.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  const ch = CHARACTERS[user.quizResult];
  let meta = null;
  try { meta = await api('/meta'); } catch { /* opcional */ }
  app.innerHTML = topbar('Perfil') + `
    <div class="card profile-hero fade-in" style="--c:${user.color || 'var(--orange)'}">
      ${avatarHtml(user)}
      <h2>@${esc(user.username)}</h2>
      <div class="muted">Miembro desde el ${since}</div>
      <div class="stats">
        <div><b>${stats.lists}</b><span>Tablas</span></div>
        <div><b>${stats.friends}</b><span>Amigos</span></div>
        <div><b>${stats.requests}</b><span>Solicitudes</span></div>
      </div>
    </div>
    <div class="card section me-color" style="--c:${user.color || 'var(--orange)'}">
      <h2>Tu color</h2>
      <div class="me-color-row">
        ${ch ? `<img class="char-thumb" src="${charImg(user.quizResult)}" alt="${esc(ch.name)}">` : '<i class="swatch big"></i>'}
        <div class="name"><b>${esc(user.color ? colorName(user.color) : 'Sin elegir')}</b>
          ${ch ? `<small>Te pareces a <b>${esc(ch.name)}</b> · ${esc(ch.anime)}</small>` : ''}</div>
      </div>
      <div class="row" style="margin-top:12px">
        <button class="btn" data-color>${ICON.palette} Cambiar color</button>
        <a class="btn" href="#/test">Repetir el test</a>
      </div>
    </div>
    <div class="card section">
      <h2>Este dispositivo</h2>
      <div class="me-color-row">
        <span class="device-ico">${DEVICE_ICON()}</span>
        <div class="name"><b style="color:var(--text)">${esc(deviceName())}</b>
          <small>${pref.get('remember') === '0' ? 'Sesión solo mientras tengas la app abierta' : 'Usuario recordado: entras directamente sin contraseña'}</small></div>
      </div>
    </div>
    <div class="card section">
      <h2>Dónde ver</h2>
      <div class="plat-list" style="justify-content:flex-start">${Object.keys(PLATFORMS).map((k) => platBadge(k)).join('')}</div>
      <p class="muted" style="font-size:13px;margin:10px 0 0">Disponibilidad e idiomas para <b>España</b> 🇪🇸${meta?.catalog?.count ? ` · ${meta.catalog.count} animes en el catálogo` : ''}. Se consulta en directo al elegir un anime.</p>
    </div>
    <button class="btn danger block" data-logout>${ICON.logout} Cerrar sesión</button>`;
  $('[data-color]', app).addEventListener('click', async () => { if (await changeColor()) renderProfile(); });
  $('[data-logout]', app).addEventListener('click', async () => {
    if (!(await confirmSheet({ title: '¿Cerrar sesión?', text: `Tendrás que volver a entrar con tu contraseña en ${esc(deviceName())}.`, ok: 'Cerrar sesión', icon: ICON.logout }))) return;
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* da igual */ }
    state.user = null;
    location.hash = '#/login';
  });
}

// ───────────── Arranque ─────────────
loadBackdrop();
route();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
