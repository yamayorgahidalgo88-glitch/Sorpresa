// anYMe — frontend (vanilla JS, sin build)
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
// Súbelo al cambiar imágenes: obliga a los móviles a descargar las nuevas
const ASSET_V = '3';
const avatarImg = (key) => `/img/avatars/${key}.jpg?v=${ASSET_V}`;
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
  stopTriviaTimer();
  const hash = location.hash || '#/tablas';
  if (!state.user) {
    try { state.user = (await api('/me')).user; } catch { state.user = null; }
  }
  if (!state.user) return renderAuth();
  if (!state.user.quizDone) return renderQuiz();
  if (hash === '#/test') return renderQuiz({ again: true });
  document.body.classList.remove('auth');
  $('#tabbar').hidden = false;
  const [, section, id, sub, subId] = hash.split('/');
  const tab = section === 'tabla' ? 'tablas' : section === 'amigo' ? 'amigos' : section;
  $$('#tabbar a').forEach((a) => a.classList.toggle('on', a.dataset.tab === tab));
  refreshBadge();
  if (section === 'perfil') return renderProfile();
  if (section === 'amigos') return renderFriends();
  if (section === 'quiz') return renderTrivia();
  if (section === 'tabla' && id) return renderList(Number(id));
  if (section === 'amigo' && id && sub === 'tabla' && subId) return renderList(Number(subId), Number(id));
  if (section === 'amigo' && id) return renderFriendProfile(Number(id));
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
      <div class="auth-title" aria-label="anYMe"><small>an</small><em>YM</em><small>e</small></div>
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
  { hex: '#8bc34a', name: 'Verde' }, { hex: '#2ed3c6', name: 'Turquesa' }, { hex: '#4aa8ff', name: 'Azul' },
  { hex: '#a77bff', name: 'Morado' }, { hex: '#ff6fb5', name: 'Rosa' },
];
const colorName = (hex) => COLORS.find((c) => c.hex === hex)?.name || 'tu color';

// Cada color = una forma de ser, con 5 personajes que la comparten. El test da el color y,
// al azar, uno de sus 5 personajes como foto de perfil.
const PERSONAS = {
  rojo: { color: '#ff4d5e', why: 'Vas de frente y con el corazón en llamas. Proteges a los tuyos y contagias tu energía a todo el que tienes cerca.',
    chars: [['rengoku', 'Kyojuro Rengoku', 'Kimetsu no Yaiba'], ['kirishima', 'Eijiro Kirishima', 'My Hero Academia'], ['asta', 'Asta', 'Black Clover'], ['yuji', 'Yuji Itadori', 'Jujutsu Kaisen'], ['eren', 'Eren Yeager', 'Ataque a los titanes']] },
  naranja: { color: '#ff8a1f', why: 'Pura energía. No te rindes nunca y saltas más alto que nadie aunque te digan que no puedes.',
    chars: [['hinata', 'Shoyo Hinata', 'Haikyu!!'], ['naruto', 'Naruto Uzumaki', 'Naruto'], ['deku', 'Izuku Midoriya', 'My Hero Academia'], ['gon', 'Gon Freecss', 'Hunter x Hunter'], ['bokuto', 'Kotaro Bokuto', 'Haikyu!!']] },
  amarillo: { color: '#ffd23f', why: 'Un poquito de drama y bastante miedo… hasta que toca de verdad. Entonces eres un rayo.',
    chars: [['zenitsu', 'Zenitsu Agatsuma', 'Kimetsu no Yaiba'], ['okarun', 'Okarun', 'Dan Da Dan'], ['kafka', 'Kafka Hibino', 'Kaiju No. 8'], ['subaru', 'Subaru Natsuki', 'Re:Zero'], ['denji', 'Denji', 'Chainsaw Man']] },
  verde: { color: '#8bc34a', why: 'Amabilidad, esfuerzo y lealtad. Nunca abandonas a tu familia ni a tus amigos, pase lo que pase.',
    chars: [['tanjiro', 'Tanjiro Kamado', 'Kimetsu no Yaiba'], ['alphonse', 'Alphonse Elric', 'Fullmetal Alchemist'], ['armin', 'Armin Arlert', 'Ataque a los titanes'], ['kuroko', 'Tetsuya Kuroko', 'Kuroko no Basket'], ['thorfinn', 'Thorfinn', 'Vinland Saga']] },
  turquesa: { color: '#2ed3c6', why: 'Calma total. Nada te altera, vas a tu ritmo y cuando hace falta resuelves sin despeinarte.',
    chars: [['frieren', 'Frieren', 'Frieren'], ['rimuru', 'Rimuru Tempest', 'Tensei Slime'], ['kenma', 'Kenma Kozume', 'Haikyu!!'], ['giyu', 'Giyu Tomioka', 'Kimetsu no Yaiba'], ['saitama', 'Saitama', 'One Punch Man']] },
  azul: { color: '#4aa8ff', why: 'Estrategia y perfeccionismo. Ves la jugada antes que nadie y siempre tienes un plan.',
    chars: [['kageyama', 'Tobio Kageyama', 'Haikyu!!'], ['light', 'Light Yagami', 'Death Note'], ['l', 'L', 'Death Note'], ['isagi', 'Yoichi Isagi', 'Blue Lock'], ['akashi', 'Seijuro Akashi', 'Kuroko no Basket']] },
  morado: { color: '#a77bff', why: 'Tranquilidad por fuera, fuerza imparable por dentro. Vas por libre, subes de nivel en silencio y cuando apareces, arrasas.',
    chars: [['jinwoo', 'Sung Jinwoo', 'Solo Leveling'], ['levi', 'Levi', 'Ataque a los titanes'], ['itachi', 'Itachi Uchiha', 'Naruto'], ['killua', 'Killua Zoldyck', 'Hunter x Hunter'], ['nagi', 'Seishiro Nagi', 'Blue Lock']] },
  rosa: { color: '#ff6fb5', why: 'Cariño a lo grande y risas aseguradas. Pareces dulce, pero cuando toca proteger a los tuyos eres de lo más fuerte.',
    chars: [['mitsuri', 'Mitsuri Kanroji', 'Kimetsu no Yaiba'], ['anya', 'Anya Forger', 'Spy x Family'], ['uraraka', 'Ochaco Uraraka', 'My Hero Academia'], ['nezuko', 'Nezuko Kamado', 'Kimetsu no Yaiba'], ['rem', 'Rem', 'Re:Zero']] },
};

const QUIZ = [
  { anime: 'Kimetsu no Yaiba', q: 'Es de noche y te encuentras con un demonio. ¿Qué haces?', a: [
    ['Desenvaino la espada y voy a por él', { rojo: 3, verde: 1 }],
    ['Aviso a mis compañeros y lo rodeamos', { azul: 2, verde: 2 }],
    ['Me escondo y estudio cómo se mueve', { morado: 2, turquesa: 2 }],
    ['¡Huyo gritando! …y luego vuelvo a por él', { amarillo: 3, rosa: 1 }],
  ] },
  { anime: 'Haikyu!!', q: 'Partido de vóley. ¿En qué posición juegas?', a: [
    ['Rematador: quiero el último toque', { naranja: 3, rojo: 1 }],
    ['Colocador: yo dirijo el juego', { azul: 3 }],
    ['Líbero: que no caiga ni un balón', { verde: 2, turquesa: 1 }],
    ['Saque: un buen saque y punto directo', { morado: 2, amarillo: 1 }],
  ] },
  { anime: 'Solo Leveling', q: 'Se abre una mazmorra de rango S delante de ti.', a: [
    ['Entro sin nadie: así subo de nivel', { morado: 3 }],
    ['Monto un equipo y reparto los roles', { azul: 2, verde: 1 }],
    ['Entro en primera fila para proteger al resto', { rojo: 3, naranja: 1 }],
    ['Me quedo fuera con snacks a ver qué pasa', { turquesa: 2, amarillo: 1, rosa: 1 }],
  ] },
  { anime: 'Tokyo Ghoul', q: 'Despiertas en el hospital y, como Kaneki, ahora eres medio ghoul. ¿Qué haces?', a: [
    ['Lucho por seguir siendo humano y proteger a mis amigos', { verde: 2, rojo: 1 }],
    ['Me refugio en Anteiku y aprendo de Touka y del jefe', { rosa: 2, turquesa: 1 }],
    ['Acepto mi lado ghoul y me hago más fuerte en solitario', { morado: 3 }],
    ['Me encierro con un café de Anteiku… y que me rescaten', { amarillo: 3 }],
  ] },
  { anime: 'Naruto', q: '¿Cuál es tu camino ninja?', a: [
    ['No rendirme jamás, ¡dattebayo!', { naranja: 3 }],
    ['Proteger a los míos cueste lo que cueste', { verde: 2, rojo: 2 }],
    ['Ser el más fuerte, aunque sea en solitario', { morado: 2, azul: 1 }],
    ['Disfrutar del camino con mis amigos', { rosa: 2, turquesa: 1, naranja: 1 }],
  ] },
];

// Color según las respuestas (si hay empate, al azar entre los empatados) y personaje al azar de ese color
function quizResult(answers) {
  const score = Object.fromEntries(Object.keys(PERSONAS).map((k) => [k, 0]));
  answers.forEach((ai, qi) => Object.entries(QUIZ[qi].a[ai][1]).forEach(([k, v]) => { score[k] += v; }));
  const max = Math.max(...Object.values(score));
  const tops = Object.keys(score).filter((k) => score[k] === max);
  const key = tops[Math.floor(Math.random() * tops.length)];
  const chars = PERSONAS[key].chars;
  const [avatar, name, anime] = chars[Math.floor(Math.random() * chars.length)];
  return { key, ...PERSONAS[key], avatar, name, anime };
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
      <p class="muted">5 preguntas sobre nuestros animes. Al final te toca un color y un personaje para tu foto de perfil. Los dos se pueden cambiar cuando quieras en tu perfil.</p>
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
  const result = () => {
    const r = quizResult(answers);
    app.innerHTML = `<div class="quiz result fade-in" style="--c:${r.color}">
      <div class="quiz-kicker">Tu color es</div>
      <h1 class="quiz-title color-name">${esc(colorName(r.color))}</h1>
      <div class="result-card">
        <div class="result-poster square"><img src="${avatarImg(r.avatar)}" alt="${esc(r.name)}"></div>
        <div class="result-txt">
          <small>Tu foto de perfil</small>
          <b>${esc(r.name)}</b>
          <span class="chip">${esc(r.anime)}</span>
          <p>${esc(r.why)}</p>
        </div>
      </div>
      <button class="btn primary block" data-use style="background:${r.color};color:#111">¡Me lo quedo!</button>
      <p class="muted center" style="font-size:13px">El color y la foto los puedes cambiar luego en tu perfil.</p>
    </div>`;
    $('[data-use]', app).addEventListener('click', async () => {
      try {
        state.user = (await api('/me', { method: 'PATCH', body: { quizResult: r.key, color: r.color, avatar: r.avatar } })).user;
        toast(`¡Listo! Eres ${colorName(r.color).toLowerCase()} · ${r.name}`);
        go(again ? '#/perfil' : '#/tablas');
      } catch (e) { fail(e); }
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
      <div class="swatches">${COLORS.map((c) => `<button class="sw ${c.hex === current ? 'on' : ''}" data-c="${c.hex}" style="--c:${c.hex}">
          <i></i><span>${c.name}</span></button>`).join('')}</div>
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
  });
  if (!res) return;
  try {
    const { id } = await api('/lists', { body: { name: res.value } });
    toast('Tabla creada');
    go('#/tabla/' + id);
  } catch (e) { fail(e); }
}

// ───────────── Vista de una tabla ─────────────
async function loadList(id, friendId = state.viewOf) {
  const data = await api(friendId ? `/friends/${friendId}/lists/${id}` : '/lists/' + id);
  state.list = data;
  return data;
}

async function renderList(id, friendId = null) {
  state.viewOf = friendId;
  const back = friendId ? `#/amigo/${friendId}` : '#/tablas';
  app.innerHTML = topbar('Cargando…', { back }) + '<div class="skeleton" style="height:320px"></div>';
  try { await loadList(id); } catch (e) { fail(e); return go(back); }
  // Si la tabla del amigo también es tuya, mejor abrirla como tuya (ahí puedes editar lo tuyo)
  if (friendId && state.list.list.role !== 'viewer') return go('#/tabla/' + id);
  drawList();
  if (friendId) { state.syncNow = null; return; }
  // Sincroniza con los cambios de las otras personas de la tabla: pregunta cada 2,5 s si algo ha cambiado
  // (consulta muy ligera) y solo entonces vuelve a cargar la tabla.
  let checking = false;
  const sync = async () => {
    if (checking || document.visibilityState !== 'visible' || location.hash !== '#/tabla/' + id || !state.list || state.viewOf) return;
    // No repintar mientras escribes, arrastras o tienes una ventana abierta
    if ($('.sheet') || state.dragging || (document.activeElement && app.contains(document.activeElement) && document.activeElement.matches('input'))) return;
    checking = true;
    try {
      const { updated_at } = await api(`/lists/${id}/version`);
      if (updated_at !== state.list.list.updated_at) { await loadList(id); drawList(true); }
    } catch { /* reintenta en la siguiente vuelta */ } finally { checking = false; }
  };
  pollTimer = setInterval(sync, 2500);
  state.syncNow = sync;
}
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && state.syncNow?.());
addEventListener('focus', () => state.syncNow?.());

// Ranking: podio por persona (o media) y por tipo (series / películas)
// Ranking completo; en empate de nota manda el orden que hayas elegido (podiumPicks) y luego el de la tabla
function rankingFor(key, kind, people, entries, picks = []) {
  const pri = new Map(picks.map((id, i) => [id, i]));
  const score = (e) => {
    if (key !== 'avg') return e.marks[key]?.rating ?? null;
    const rs = people.map((p) => e.marks[p.id]?.rating).filter((r) => r != null);
    return rs.length ? Math.round((rs.reduce((a, b) => a + b, 0) / rs.length) * 100) / 100 : null;
  };
  return entries.filter((e) => (e.kind === 'movie' ? 'movie' : 'show') === kind)
    .map((e) => ({ e, r: score(e) })).filter((x) => x.r != null)
    .sort((a, b) => b.r - a.r || (pri.get(a.e.id) ?? 1e9) - (pri.get(b.e.id) ?? 1e9));
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
  const all = rankingFor(tab.key, kind, people, entries, (state.list.podiumPicks || {})[`${tab.key}:${kind}`]);
  const top = all.slice(0, 3);
  state.podium = { all, pickKey: `${tab.key}:${kind}` };
  const slot = (place) => {
    const x = top[place - 1];
    const ties = x ? all.filter((y) => y.r === x.r && y.e.id !== x.e.id && !top.slice(0, place - 1).some((t) => t.e.id === y.e.id)).length : 0;
    const medal = ['', 'gold', 'silver', 'bronze'][place];
    return `<div class="pod pod-${place} ${medal}">
      ${x ? `<button class="pod-card" data-open-entry="${x.e.id}" ${ties ? `data-tie="${place}"` : ''}>
          ${ties ? `<span class="tie-badge">⇄ ${ties + 1} con ${fmtRating(x.r)}</span>` : ''}
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
  const viewer = list.role === 'viewer';
  const others = members.filter((m) => m.id !== state.user.id);
  const ownerName = members.find((m) => m.id === list.owner_id)?.username || '';
  const head = (p, label) => `<th class="p" style="--c:${p.color}"><span class="ph-head" title="${esc(p.name)}"><i>${p.avatar ? `<img src="${avatarImg(p.avatar)}" alt="">` : esc(p.name[0]?.toUpperCase() || '?')}</i>${label}</span>
    <small class="ph-name">${isMine(p) ? 'Tú' : esc(p.name)}${p.user_id ? '' : ' · sin unir'}</small></th>`;

  app.innerHTML = topbar(list.name, viewer ? {
    back: `#/amigo/${state.viewOf}`,
    sub: `${entries.length} animes · tabla de @${esc(ownerName)}`,
  } : {
    back: '#/tablas',
    sub: `${entries.length} animes${others.length ? ` · con ${others.map((m) => '@' + esc(m.username)).join(', ')}` : ''}`,
    right: `${owner ? `<button class="iconbtn" data-share aria-label="Compartir">${ICON.share}</button>` : ''}<button class="iconbtn" data-menu aria-label="Opciones">${ICON.dots}</button>`,
  }) + `
  ${viewer ? `<div class="viewer-note">👀 Solo puedes mirar esta tabla. Pulsa un anime para ver dónde verlo y <b>añadirlo a una de tus listas</b>.</div>` : ''}
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
    <div class="order-hint" data-hint ${state.filter === 'pending' && !viewer ? '' : 'hidden'}>${ICON.grip} Arrastra desde las rayas para ordenar qué ver primero. El orden lo veis todos los de la tabla.</div>

    <div class="table-wrap"><table class="anime">
      <thead><tr>
        ${people.map((p) => head(p, 'Visto')).join('')}
        <th class="name">Anime</th><th>Plataforma</th><th>Idioma</th>
        ${people.map((p) => head(p, 'Nota')).join('')}
      </tr></thead>
      <tbody></tbody>
    </table></div>

    ${viewer ? '' : `<div class="add-row"><button class="btn primary block" data-add>${ICON.plus} Añadir anime</button></div>`}
  </div>`;

  drawRows();
  if (scroll) $('.table-wrap').scrollLeft = scroll;
  bindPodium();

  $('[data-add]', app)?.addEventListener('click', () => entrySheet());
  $('[data-menu]', app)?.addEventListener('click', listMenu);
  $('[data-share]', app)?.addEventListener('click', shareSheet);
  $('[data-q]', app).addEventListener('input', (e) => { state.query = e.target.value; drawRows(); });
  $$('[data-f]', app).forEach((b) => b.addEventListener('click', () => {
    state.filter = b.dataset.f;
    $$('[data-f]', app).forEach((x) => x.classList.toggle('on', x === b));
    $('[data-hint]', app).hidden = state.filter !== 'pending' || viewer;
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
  $$('[data-open-entry]', box).forEach((b) => b.addEventListener('click', () => {
    const entry = state.list.entries.find((e) => e.id === Number(b.dataset.openEntry));
    if (b.dataset.tie) tieSheet(Number(b.dataset.tie), entry, redraw); else openEntry(entry);
  }));
}

// Empate en el podio: elegir cuál de los animes con la misma nota ocupa este puesto
function tieSheet(place, current, redraw) {
  const { all, pickKey } = state.podium;
  const score = all[place - 1].r;
  const above = all.slice(0, place - 1).map((x) => x.e.id);
  const group = all.filter((x) => x.r === score && !above.includes(x.e.id));
  const s = openSheet(`
    <h3>${['', 'Primer', 'Segundo', 'Tercer'][place]} puesto · empate a ${fmtRating(score)}</h3>
    <p class="muted" style="margin-top:-8px;font-size:14px">Elige cuál quieres que salga en ese puesto del podio. Solo cambia tu podio, no el de los demás.</p>
    <div class="tie-list">${group.map((x) => `
      <button class="tie-opt ${x.e.id === current.id ? 'on' : ''}" data-pick="${x.e.id}">
        ${x.e.poster ? `<img src="${esc(x.e.poster)}" alt="" referrerpolicy="no-referrer">` : `<span class="ph">${esc(x.e.title[0] || '?')}</span>`}
        <span class="t">${esc(x.e.title)}</span><b>${fmtRating(x.r)}</b></button>`).join('')}</div>
    <div class="actions"><button class="btn" data-see>Ver ficha de «${esc(current.title)}»</button><button class="btn" data-close>Cerrar</button></div>`);
  $('[data-see]', s).addEventListener('click', () => { s.close(); openEntry(current); });
  $$('[data-pick]', s).forEach((b) => b.addEventListener('click', async () => {
    const id = Number(b.dataset.pick);
    // Orden del grupo empatado: el elegido pasa al sitio del que estaba en este puesto
    const order = group.map((x) => x.e.id).filter((x) => x !== id);
    order.splice(order.indexOf(current.id) === -1 ? 0 : order.indexOf(current.id), 0, id);
    const tiedIds = all.filter((x) => x.r === score).map((x) => x.e.id);
    const before = above.filter((x) => tiedIds.includes(x));
    const prev = (state.list.podiumPicks[pickKey] || []).filter((x) => !tiedIds.includes(x));
    state.list.podiumPicks = { ...state.list.podiumPicks, [pickKey]: [...before, ...order, ...prev] };
    s.close();
    redraw();
    if (state.list.list.role !== 'viewer') {
      try { await api(`/lists/${state.list.list.id}/podium-picks`, { method: 'PUT', body: { picks: state.list.podiumPicks } }); } catch (e) { fail(e); }
    }
  }));
}

function drawRows() {
  const { people } = state.list;
  const rows = visibleEntries();
  const sortable = state.filter === 'pending' && !state.query.trim() && state.list.list.role !== 'viewer';
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
    $('[data-open]', tr).addEventListener('click', () => openEntry(entry));
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

const openEntry = (entry) => (state.list.list.role === 'viewer' ? viewEntrySheet(entry) : entrySheet(entry));

function lockedToast(personId) {
  if (state.list.list.role === 'viewer') { toast('Es una tabla de tu amigo: solo puedes mirarla', true); return true; }
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
        ${editing ? `<button type="button" class="btn" data-delete style="flex:0 0 auto;color:var(--red)" aria-label="Eliminar">${ICON.trash}</button>
          <button type="button" class="btn" data-copy style="flex:0 0 auto" aria-label="Añadir a otra lista">${ICON.plus} Otra lista</button>` : '<button type="button" class="btn" data-close>Cancelar</button>'}
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

  $('[data-copy]', s)?.addEventListener('click', () => {
    const me = state.list.people.find(isMine);
    const m = me ? entry.marks[me.id] : null;
    s.close();
    addToMyListSheet(entry, { mark: m ? { seen: !!m.seen, rating: m.rating ?? null } : null, exclude: state.list.list.id });
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
const avatarHtml = (u, cls = '') => (u.avatar
  ? `<div class="avatar pic ${cls}" style="--ring:${u.color || 'rgba(255,255,255,.25)'}"><img src="${avatarImg(u.avatar)}" alt="" loading="lazy"></div>`
  : `<div class="avatar ${cls}" style="${avatarStyle(u.username, u.color)}">${esc(u.username[0].toUpperCase())}</div>`);

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
      ${friends.length ? friends.map((f) => `<div class="person friend-row">
          <a class="friend-link" href="#/amigo/${f.id}">${avatarHtml(f)}<div class="name">@${esc(f.username)}<small>Ver sus tablas y notas ›</small></div></a>
          <button class="iconbtn danger" data-unf="${f.id}" data-name="${esc(f.username)}" aria-label="Eliminar amigo">${ICON.trash}</button></div>`).join('')
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
  let meta = null;
  try { meta = await api('/meta'); } catch { /* opcional */ }
  app.innerHTML = topbar('Perfil') + `
    <div class="card profile-hero fade-in" style="--c:${user.color || 'var(--orange)'}">
      <button class="avatar-edit" data-avatar aria-label="Cambiar foto de perfil">${avatarHtml(user)}<span class="avatar-cam">${ICON.pencil}</span></button>
      <h2>@${esc(user.username)}</h2>
      <div class="muted">Miembro desde el ${since}</div>
      <button class="btn avatar-btn" data-avatar2>${ICON.pencil} Cambiar foto de perfil</button>
      <div class="stats">
        <div><b>${stats.lists}</b><span>Tablas</span></div>
        <div><b>${stats.friends}</b><span>Amigos</span></div>
        <div><b>${stats.requests}</b><span>Solicitudes</span></div>
      </div>
    </div>
    <div class="card section me-color" style="--c:${user.color || 'var(--orange)'}">
      <h2>Tu color</h2>
      <div class="me-color-row">
        <i class="swatch big"></i>
        <div class="name"><b>${esc(user.color ? colorName(user.color) : 'Sin elegir')}</b>
          <small>Es el color de tu columna en todas las tablas</small></div>
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
  const pickAvatar = async () => { if (await changeAvatar()) renderProfile(); };
  $('[data-avatar]', app).addEventListener('click', pickAvatar);
  $('[data-avatar2]', app).addEventListener('click', pickAvatar);
  $('[data-logout]', app).addEventListener('click', async () => {
    if (!(await confirmSheet({ title: '¿Cerrar sesión?', text: `Tendrás que volver a entrar con tu contraseña en ${esc(deviceName())}.`, ok: 'Cerrar sesión', icon: ICON.logout }))) return;
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* da igual */ }
    state.user = null;
    location.hash = '#/login';
  });
}

// ───────────── Foto de perfil ─────────────
let avatarsCache = null;
async function changeAvatar() {
  try { avatarsCache ||= (await api('/avatars')).avatars; } catch (e) { fail(e); return false; }
  const groups = [];
  for (const a of avatarsCache) {
    let g = groups.find((x) => x.anime === a.anime);
    if (!g) groups.push((g = { anime: a.anime, items: [] }));
    g.items.push(a);
  }
  const current = state.user.avatar;
  return new Promise((resolve) => {
    let done = false;
    const s = openSheet(`
      <h3>Elige tu foto de perfil</h3>
      <p class="muted" style="margin-top:-8px;font-size:14px">La verán tus amigos y quien te busque. ${avatarsCache.length} personajes.</p>
      <label class="search av-search">${ICON.search}<input class="input" type="search" placeholder="Busca personaje o anime…" data-avq autocomplete="off"></label>
      <div class="av-groups">${groups.map((g) => `
        <div class="av-group" data-anime="${esc(g.anime.toLowerCase())}"><div class="av-anime">${esc(g.anime)}</div>
          <div class="av-grid">${g.items.map((a) => `<button class="av ${a.key === current ? 'on' : ''}" data-av="${a.key}" data-n="${esc(a.name.toLowerCase())}" title="${esc(a.name)}" aria-label="${esc(a.name)}">
            <img src="${avatarImg(a.key)}" alt="" loading="lazy"><span>${esc(a.name.split(' ')[0])}</span></button>`).join('')}</div>
        </div>`).join('')}</div>
      <div class="actions">${current ? '<button class="btn" data-none>Quitar foto</button>' : ''}<button class="btn" data-close>Cancelar</button></div>`,
    { onClose: () => !done && resolve(false) });
    const save = async (avatar) => {
      done = true;
      try {
        state.user = { ...state.user, ...(await api('/me', { method: 'PATCH', body: { avatar } })).user };
        s.close();
        toast(avatar ? `Foto cambiada: ${avatarsCache.find((a) => a.key === avatar).name}` : 'Foto quitada');
        resolve(true);
      } catch (e) { done = false; fail(e); }
    };
    $$('[data-av]', s).forEach((b) => b.addEventListener('click', () => save(b.dataset.av)));
    $('[data-avq]', s).addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      $$('.av-group', s).forEach((g) => {
        const animeHit = g.dataset.anime.includes(q);
        let any = false;
        $$('[data-av]', g).forEach((b) => { const hit = !q || animeHit || b.dataset.n.includes(q); b.hidden = !hit; any ||= hit; });
        g.hidden = !any;
      });
    });
    $('[data-none]', s)?.addEventListener('click', () => save(null));
  });
}

// ───────────── Perfil de un amigo ─────────────
async function renderFriendProfile(id) {
  app.innerHTML = topbar('Amigo', { back: '#/amigos' }) + '<div class="skeleton" style="height:260px"></div>';
  let data;
  try { data = await api(`/friends/${id}/profile`); } catch (e) { fail(e); return go('#/amigos'); }
  const { user, stats, lists } = data;
  app.innerHTML = topbar('@' + user.username, { back: '#/amigos', sub: 'Amigo' }) + `
    <div class="card profile-hero fade-in" style="--c:${user.color || 'var(--orange)'}">
      ${avatarHtml(user)}
      <h2>@${esc(user.username)}</h2>
      <div class="stats" style="grid-template-columns:repeat(2,1fr)">
        <div><b>${stats.lists}</b><span>Tablas</span></div>
        <div><b>${stats.seen}</b><span>Animes vistos</span></div>
      </div>
    </div>
    <div class="card section">
      <h2>Sus tablas</h2>
      <p class="muted" style="margin:-4px 0 12px;font-size:14px">Puedes mirar sus notas y llevarte a tus listas lo que te guste. No puedes cambiar nada de sus tablas.</p>
      <div class="lists-grid">${lists.map((l) => `
        <a class="card list-card" href="${l.mine ? `#/tabla/${l.id}` : `#/amigo/${user.id}/tabla/${l.id}`}">
          <div class="covers">${l.covers.map((c) => `<img src="${esc(c)}" alt="" loading="lazy" referrerpolicy="no-referrer">`).join('')}</div>
          <h3 style="margin-right:0">${esc(l.name)}</h3>
          <div class="meta">
            <span class="chip orange">${ICON.film}${l.count} anime${l.count === 1 ? '' : 's'}</span>
            ${l.mine ? '<span class="chip">✓ También es tuya</span>' : '<span class="chip">👀 Solo mirar</span>'}
          </div>
        </a>`).join('') || '<div class="empty">Todavía no tiene tablas</div>'}</div>
    </div>`;
}

// ───────────── Ficha de un anime de otra persona: mirar y «Añadir a mi lista» ─────────────
function viewEntrySheet(entry) {
  const { people } = state.list;
  const kind = entry.kind === 'movie' ? 'Película' : 'Serie';
  const s = openSheet(`
    <div class="anime-head">
      ${entry.poster ? `<img src="${esc(entry.poster)}" alt="" referrerpolicy="no-referrer">` : '<span class="ph"></span>'}
      <div><h4>${esc(entry.title)}</h4>
        <div class="muted" style="font-size:13px">${kind}${entry.duration && entry.duration !== 'Película' ? ' · ' + esc(entry.duration) : ''}</div>
        <div class="their-marks">${people.map((p) => {
          const m = entry.marks[p.id] || {};
          return `<span class="chip" style="--c:${p.color}"><i class="dot" style="background:${p.color}"></i>${esc(p.name)}: ${m.seen ? '✓ visto' : 'sin ver'}${m.rating != null ? ` · <b>${fmtRating(m.rating)}</b>/10` : ''}</span>`;
        }).join('')}</div>
      </div>
    </div>
    <div class="avail" data-avail>${availabilityHtml(entry.availability || [])}</div>
    <div class="actions"><button class="btn" data-close>Cerrar</button><button class="btn primary" data-add-mine>${ICON.plus} Añadir a mi lista</button></div>`);
  if (entry.jw_id) {
    api('/anime/' + entry.jw_id).then(({ item }) => { const box = $('[data-avail]', s); if (box) box.innerHTML = availabilityHtml(item.platforms); }).catch(() => {});
  }
  $('[data-add-mine]', s).addEventListener('click', () => { s.close(); addToMyListSheet(entry); });
}

// mark = tu check y nota para copiarlos (desde una tabla tuya); exclude = tabla en la que ya estás
async function addToMyListSheet(entry, { mark = null, exclude = null } = {}) {
  let lists;
  try { ({ lists } = await api('/lists')); } catch (e) { return fail(e); }
  lists = lists.filter((l) => l.id !== exclude);
  // Comprueba en qué tablas ya está (por id del catálogo o por nombre)
  const has = {};
  await Promise.all(lists.map(async (l) => {
    try {
      const d = await api('/lists/' + l.id);
      has[l.id] = d.entries.some((e) => (entry.jw_id && e.jw_id === entry.jw_id) || e.title.trim().toLowerCase() === entry.title.trim().toLowerCase());
    } catch { has[l.id] = false; }
  }));
  const s = openSheet(`
    <h3>¿A qué lista lo añades?</h3>
    <p class="muted" style="margin-top:-8px;font-size:14px">${mark && (mark.seen || mark.rating != null)
      ? `«${esc(entry.title)}» se copiará con tu ${mark.seen ? 'check de visto' : ''}${mark.seen && mark.rating != null ? ' y tu ' : ''}${mark.rating != null ? `nota (<b>${fmtRating(mark.rating)}</b>)` : ''}. Luego podrás cambiarla en cada lista por separado.`
      : `«${esc(entry.title)}» se añadirá sin notas ni checks, para que pongáis los vuestros.`}</p>
    <div style="display:grid;gap:8px">${lists.map((l) => `
      <button class="btn block col-pick" data-l="${l.id}" ${has[l.id] ? 'disabled' : ''}>${ICON.film} ${esc(l.name)}
        <small class="muted" style="margin-left:auto">${has[l.id] ? 'Ya está' : `${l.count} animes`}</small></button>`).join('') || '<div class="empty">Aún no tienes tablas. Crea una en «Tablas».</div>'}</div>
    <div class="actions"><button class="btn" data-close>Cancelar</button></div>`);
  $$('[data-l]', s).forEach((b) => b.addEventListener('click', async () => {
    b.disabled = true;
    const { title, jw_id, poster, kind, duration, platform, language, availability } = entry;
    try {
      await api(`/lists/${b.dataset.l}/entries`, { body: { title, jw_id, poster, kind, duration, platform, language, availability, ...(mark ? { myMark: mark } : {}) } });
      s.close();
      toast(`«${title}» añadido a «${lists.find((l) => l.id === Number(b.dataset.l)).name}»`);
    } catch (e) { fail(e); b.disabled = false; }
  }));
}

// ───────────── Quiz tipo Kahoot (animes que has visto) ─────────────
const TILES = [
  { cls: 't-red', shape: '<svg viewBox="0 0 24 24"><path d="M12 4l9 16H3z"/></svg>' },
  { cls: 't-blue', shape: '<svg viewBox="0 0 24 24"><path d="M12 2.5l9.5 9.5-9.5 9.5L2.5 12z"/></svg>' },
  { cls: 't-yellow', shape: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>' },
  { cls: 't-green', shape: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="1.5"/></svg>' },
];
const MEDALS = ['🥇', '🥈', '🥉'];
let triviaTimer = null;
function stopTriviaTimer() { clearInterval(triviaTimer); triviaTimer = null; }
const fmtWhen = (ts) => {
  const d = new Date(ts);
  return `${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })} · ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
};
const fmtSecs = (ms) => { const s = Math.round(ms / 1000); return s >= 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`; };
const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];

function triviaRankingHtml(best, highlight = null) {
  if (!best.length) return '<div class="empty">Aún no has jugado ninguna partida. ¡Estrena el ranking!</div>';
  return `<ol class="tv-rank">${best.map((g, i) => `
    <li class="${g.id === highlight ? 'me' : ''}">
      <span class="pos">${MEDALS[i] || i + 1}</span>
      <b class="sc">${g.score}<small>/10</small></b>
      <span class="when">${fmtWhen(g.finished_at)}<small>${fmtSecs(g.total_ms)} en total</small></span>
    </li>`).join('')}</ol>`;
}

async function renderTrivia() {
  app.innerHTML = topbar('Quiz') + '<div class="skeleton" style="height:260px"></div>';
  let info;
  try { info = await api('/trivia'); } catch (e) { return fail(e); }
  if (location.hash !== '#/quiz') return;
  const can = info.seen > 0;
  app.innerHTML = topbar('Quiz', { sub: 'Al estilo Kahoot' }) + `
    <div class="card tv-hero fade-in">
      <div class="tv-shapes">${TILES.map((t) => `<i class="${t.cls}">${t.shape}</i>`).join('')}</div>
      <h2>¿Cuánto sabes de lo que has visto?</h2>
      <p class="muted">${info.count} preguntas sobre los animes que tienes marcados como vistos. Tienes ${info.seconds} segundos para cada una y 4 respuestas: solo una es la buena.</p>
      <div class="meta">
        <span class="chip orange">${ICON.film}${info.seen} anime${info.seen === 1 ? '' : 's'} visto${info.seen === 1 ? '' : 's'}</span>
        <span class="chip">${info.ai ? '✨ Preguntas creadas con IA' : '🎭 Preguntas de personajes'}</span>
      </div>
      <button class="btn primary block tv-go" data-play ${can ? '' : 'disabled'}>¡Jugar!</button>
      ${can ? '' : '<p class="muted" style="font-size:13px;margin:10px 0 0">Marca con ✓ algún anime en tus tablas para poder jugar.</p>'}
    </div>
    <div class="card section">
      <h2>🏆 Tus mejores puntuaciones ${info.played ? `<span class="count">${info.played}</span>` : ''}</h2>
      ${triviaRankingHtml(info.best)}
    </div>`;
  $('[data-play]', app)?.addEventListener('click', playTrivia);
}

async function playTrivia() {
  $('#tabbar').hidden = true;
  const msgs = ['Repasando tus tablas…', 'Buscando escenas míticas…', 'Llamando a los personajes…', 'Escondiendo las respuestas…', 'Casi listo…'];
  app.innerHTML = `<div class="tv-loading fade-in">
      <div class="tv-shapes spin">${TILES.map((t) => `<i class="${t.cls}">${t.shape}</i>`).join('')}</div>
      <h2>Preparando tu quiz</h2><p class="muted" data-msg>${msgs[0]}</p></div>`;
  let n = 0;
  triviaTimer = setInterval(() => { const m = $('[data-msg]', app); if (m) m.textContent = msgs[Math.min(++n, msgs.length - 1)]; }, 3500);
  let game;
  try { game = await api('/trivia', { method: 'POST' }); } catch (e) {
    stopTriviaTimer();
    fail(e);
    if (location.hash === '#/quiz') { $('#tabbar').hidden = false; renderTrivia(); }
    return;
  }
  stopTriviaTimer();
  if (location.hash !== '#/quiz') return;
  // Precarga de imágenes para que no tarden al salir la pregunta
  for (const q of game.questions) {
    for (const src of [q.image, ...(q.optionImages || [])]) if (src) { const img = new Image(); img.referrerPolicy = 'no-referrer'; img.src = src; }
  }
  showTriviaQuestion({ game, i: 0, score: 0, results: [] });
}

function showTriviaQuestion(st) {
  stopTriviaTimer();
  const q = st.game.questions[st.i];
  const total = st.game.questions.length;
  const secs = st.game.seconds;
  app.innerHTML = `
    <div class="tv-screen fade-in">
      <div class="tv-top">
        <button class="iconbtn" data-quit aria-label="Salir del quiz">${ICON.x}</button>
        <div class="tv-progress">Pregunta <b>${st.i + 1}</b> de ${total}</div>
        <div class="tv-score" data-score>✓ ${st.score}</div>
      </div>
      <div class="tv-timer"><i style="animation-duration:${secs}s"></i></div>
      <div class="card tv-q">
        ${q.image ? `<div class="tv-img${q.optionImages ? ' wide' : ''}"><img src="${esc(q.image)}" alt="" referrerpolicy="no-referrer"></div>` : ''}
        <div class="tv-qhead"><span class="chip orange">${ICON.film}${esc(q.anime)}</span><span class="tv-count" data-count>${secs}</span></div>
        <h2>${esc(q.question)}</h2>
      </div>
      <div class="tv-answers${q.optionImages ? ' faces' : ''}">${q.options.map((o, k) => (q.optionImages ? `
        <button class="tv-ans face ${TILES[k].cls}" data-k="${k}" aria-label="Opción ${k + 1}">
          <img src="${esc(q.optionImages[k])}" alt="" referrerpolicy="no-referrer"><i class="tv-shape">${TILES[k].shape}</i><span class="tv-name">${esc(o)}</span></button>` : `
        <button class="tv-ans ${TILES[k].cls}" data-k="${k}">${TILES[k].shape}<span>${esc(o)}</span></button>`)).join('')}</div>
      <div data-feedback></div>
    </div>`;
  const screen = $('.tv-screen', app);
  const started = performance.now();
  let answered = false;
  const answer = async (k) => {
    if (answered) return;
    answered = true;
    stopTriviaTimer();
    const ms = Math.round(performance.now() - started);
    $$('.tv-ans', screen).forEach((b) => (b.disabled = true));
    $('.tv-timer', screen).classList.add('stop');
    if (k != null) $(`[data-k="${k}"]`, screen).classList.add('picked');
    let r = null;
    for (let tries = 0; tries < 3 && !r; tries++) {
      try { r = await api(`/trivia/${st.game.id}/answer`, { body: { q: st.i, choice: k, ms } }); } catch (e) {
        if (tries === 2 || /terminado|respondida|encontrada/.test(e.message)) { fail(e); break; }
        await new Promise((res) => setTimeout(res, 900));
      }
    }
    if (!app.contains(screen)) return;
    if (!r) { $('#tabbar').hidden = false; return renderTrivia(); }
    if (r.right) st.score++;
    st.results.push({ ...q, choice: k, correct: r.correct, right: r.right });
    $$('.tv-ans', screen).forEach((b, i) => b.classList.add(i === r.correct ? 'good' : 'bad', 'shown'));
    $('[data-score]', screen).textContent = `✓ ${st.score}`;
    const title = r.right ? pickOne(['¡Correcto! 🎉', '¡Bien visto! ✨', '¡Sugoi! 🔥', '¡Eso es! 💥'])
      : k == null ? '⏰ ¡Se acabó el tiempo!' : pickOne(['¡Casi! 😅', '¡Uy, por poco! 🙈', '¡Nooo! 😵']);
    const fb = $('[data-feedback]', screen);
    fb.innerHTML = `<div class="tv-fb ${r.right ? 'ok' : 'ko'}">
        <b>${title}</b>
        ${r.right ? '' : `<span>La respuesta era: <b>${esc(q.options[r.correct])}</b></span>`}
        ${r.fact ? `<p>${esc(r.fact)}</p>` : ''}
        <button class="btn primary block" data-next>${r.done ? 'Ver mi resultado' : 'Siguiente pregunta'}</button>
      </div>`;
    $('[data-next]', fb).addEventListener('click', () => {
      if (r.done) return showTriviaEnd(st, r);
      st.i++;
      showTriviaQuestion(st);
      scrollTo(0, 0);
    });
    fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  const count = $('[data-count]', screen);
  triviaTimer = setInterval(() => {
    const left = Math.max(0, secs - Math.floor((performance.now() - started) / 1000));
    count.textContent = left;
    count.classList.toggle('hurry', left <= 5);
    if (left <= 0) answer(null);
  }, 200);
  $$('.tv-ans', screen).forEach((b) => b.addEventListener('click', () => answer(Number(b.dataset.k))));
  $('[data-quit]', screen).addEventListener('click', async () => {
    if (!(await confirmSheet({ title: '¿Salir del quiz?', text: 'Esta partida no contará para el ranking.', ok: 'Salir', icon: ICON.x }))) return;
    stopTriviaTimer();
    answered = true;
    go('#/quiz');
  });
}

function showTriviaEnd(st, r) {
  stopTriviaTimer();
  $('#tabbar').hidden = false;
  const s = r.score;
  const msg = s === 10 ? '¡Pleno! Te lo sabes todo 👑' : s >= 8 ? '¡Increíble! Eres un crack 🔥' : s >= 6 ? '¡Muy bien! Se nota que lo has visto 😎'
    : s >= 4 ? '¡Nada mal! Pero hay que repasar 📺' : '¡Toca maratón de repaso! 🍿';
  const record = r.rank === 1 && r.played > 1;
  app.innerHTML = topbar('Quiz', { sub: 'Resultado' }) + `
    <div class="card tv-end fade-in">
      ${record ? '<div class="tv-record">🏆 ¡Nuevo récord!</div>' : ''}
      <div class="tv-big">${s}<small>/10</small></div>
      <h2>${msg}</h2>
      <p class="muted">${fmtSecs(r.total_ms)} en total · ${r.played === 1 ? 'Tu primera partida' : `Puesto ${r.rank} de ${r.played} partidas`}</p>
      <div class="tv-dots">${st.results.map((x) => `<i class="${x.right ? 'ok' : 'ko'}"></i>`).join('')}</div>
      <div class="row"><button class="btn primary" data-again>Jugar otra vez</button><button class="btn" data-home>Volver al inicio</button></div>
    </div>
    <div class="card section">
      <h2>Repaso</h2>
      ${st.results.map((x, i) => `<div class="tv-review ${x.right ? 'ok' : 'ko'}">
        <span class="n">${i + 1}</span>
        <div><small>${esc(x.anime)}</small><b>${esc(x.question)}</b>
          ${x.right ? `<span>✓ ${esc(x.options[x.correct])}</span>`
            : `<span>${x.choice == null ? '⏰ Sin responder' : `✗ ${esc(x.options[x.choice])}`} · Era: <b>${esc(x.options[x.correct])}</b></span>`}</div>
      </div>`).join('')}
    </div>
    <div class="card section"><h2>🏆 Tus mejores puntuaciones</h2>${triviaRankingHtml(r.best, st.game.id)}</div>`;
  $('[data-again]', app).addEventListener('click', playTrivia);
  $('[data-home]', app).addEventListener('click', () => { renderTrivia(); scrollTo(0, 0); });
  scrollTo(0, 0);
}

// ───────────── Arranque ─────────────
loadBackdrop();
route();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
