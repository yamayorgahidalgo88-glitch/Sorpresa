// Shows what is inside a house: texts, "vale" tickets, calendars, mini games and passwords.
// renderContent(n, element) draws ticket n; interactive steps remember their progress on this phone.
import {TICKETS, VACACIONES} from './tickets.js';

const KEY = 'progreso-v1';
const loadP = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
let prog = loadP();
const saveP = () => { try { localStorage.setItem(KEY, JSON.stringify(prog)); } catch {} };
export function resetProgress() { prog = {}; saveP(); }

// Sends an answer to his private page. Only on her real site (the test copy never sends anything).
export function report(casita, tipo, datos = {}) {
  if (!location.hostname.includes('mi-vida') || location.hostname.includes('pruebas')) return;
  const T = TICKETS[casita - 1] || {};
  try {
    fetch('/api/guardar', {method: 'POST', keepalive: true, headers: {'content-type': 'application/json'},
      body: JSON.stringify({casita, titulo: T.titulo, tipo, datos})}).catch(() => {});
  } catch {}
}

const esc = t => String(t).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const h = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
const sha256 = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))]
  .map(b => b.toString(16).padStart(2, '0')).join('');

/* ---------- the "vale" ticket (beige ticket with black + red border, perforated stub) ---------- */
const W = 460, H = 200, STUB = 362;
function shape(i, r) {
  return `M${i + r},${i}H${W - i - r}A${r},${r} 0 0 0 ${W - i},${i + r}V${H - i - r}A${r},${r} 0 0 0 ${W - i - r},${H - i}` +
         `H${i + r}A${r},${r} 0 0 0 ${i},${H - i - r}V${i + r}A${r},${r} 0 0 0 ${i + r},${i}Z`;
}
function star(cx, cy, r, fill) {
  let d = '';
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * .45 : r; d += (k ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ',' + (cy + Math.sin(a) * rr).toFixed(1); }
  return `<path d="${d}Z" fill="${fill}"/>`;
}
function flake(cx, cy, r) {
  let s = '';
  for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3, dx = Math.cos(a) * r, dy = Math.sin(a) * r; s += `M${cx - dx},${cy - dy}L${cx + dx},${cy + dy}`; }
  return `<path d="${s}" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>`;
}
const STAR_COLS = ['#9b1c1c', '#1f6b2e', '#c8902a'];
function valeSVG() {
  let stars = '';
  for (let k = 0; k < 8; k++) stars += star(411, 30 + k * 20, 6.5, STAR_COLS[k % 3]);
  const flakes = [[70, 160, 9], [300, 40, 7], [250, 170, 6], [130, 34, 5], [330, 150, 8]].map(f => flake(...f)).join('');
  return `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
    <defs><linearGradient id="vg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ecd9b0"/><stop offset="1" stop-color="#e0c592"/></linearGradient></defs>
    <path d="${shape(0, 24)}" fill="url(#vg)"/>
    ${flakes}
    <path d="${shape(9, 17)}" fill="none" stroke="#1d1410" stroke-width="4"/>
    <path d="${shape(16, 12)}" fill="none" stroke="#9b1c1c" stroke-width="2"/>
    <line x1="${STUB}" y1="16" x2="${STUB}" y2="${H - 16}" stroke="#9b1c1c" stroke-width="2.4" stroke-dasharray="7 6"/>
    <circle cx="${STUB}" cy="0" r="11" fill="var(--vale-bg,#fbf3e6)"/><circle cx="${STUB}" cy="${H}" r="11" fill="var(--vale-bg,#fbf3e6)"/>
    ${stars}
    <g transform="translate(36 34) rotate(-20)">
      <path d="M0 0C10-12 26-10 30 0C22-3 14 6 4 4Z" fill="#1f6b2e"/><path d="M0 0C-4 14 4 28 14 30C10 22 16 12 6 6Z" fill="#2e7d3f"/>
      <circle cx="2" cy="-3" r="4.2" fill="#c4161c"/><circle cx="9" cy="2" r="4.2" fill="#d42a2f"/><circle cx="-4" cy="4" r="4.2" fill="#b3121a"/>
    </g>
  </svg>`;
}
function vale(text, top) {
  const len = text.length;
  const size = len <= 14 ? 9 : len <= 24 ? 7.4 : len <= 36 ? 6 : 5;
  return h(`<div class="vale"><div class="vale-in">${valeSVG()}
    <div class="vale-txt"><span class="vale-top">${esc(top || 'Vale por')}</span><span class="vale-main" style="font-size:${size}cqw">${esc(text)}</span></div></div></div>`);
}

/* ---------- interactive steps ---------- */
const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const fmt = d => d.toLocaleDateString('es-ES', {weekday: 'long', day: 'numeric', month: 'short'});
function calendar(max, st, done) {
  const from = new Date(VACACIONES.desde + 'T12:00'), to = new Date(VACACIONES.hasta + 'T12:00');
  const start = new Date(from); start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(to); end.setDate(end.getDate() + (6 - (end.getDay() + 6) % 7));
  const box = h(`<div class="cal"><div class="cal-head">${DAYS.map(d => `<span>${d}</span>`).join('')}</div><div class="cal-grid"></div>
    <div class="cal-info">Elige entre 1 y ${max} días</div><button class="redeem cal-ok" disabled>CONFIRMAR</button></div>`);
  const grid = box.querySelector('.cal-grid'), ok = box.querySelector('.cal-ok'), info = box.querySelector('.cal-info');
  const sel = new Set();
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const inside = d >= from && d <= to, iso = d.toISOString().slice(0, 10);
    const b = h(`<button class="cal-d${inside ? '' : ' off'}" ${inside ? '' : 'disabled'} data-d="${iso}">${d.getDate()}${d.getDate() === 1 || +d === +start ? `<small>${d.toLocaleDateString('es-ES', {month: 'short'})}</small>` : ''}</button>`);
    grid.append(b);
  }
  const refresh = () => {
    grid.querySelectorAll('.cal-d:not(.off)').forEach(b => { b.classList.toggle('on', sel.has(b.dataset.d)); b.disabled = !sel.has(b.dataset.d) && sel.size >= max; });
    ok.disabled = sel.size === 0;
    info.textContent = sel.size ? `${sel.size} de ${max} días elegidos` : `Elige entre 1 y ${max} días`;
  };
  grid.addEventListener('click', e => { const b = e.target.closest('.cal-d'); if (!b || b.classList.contains('off')) return; const d = b.dataset.d; sel.has(d) ? sel.delete(d) : sel.add(d); refresh(); });
  ok.onclick = () => { if (sel.size) done({dias: [...sel].sort()}); };
  return box;
}
function calendarDone(data) {
  const ds = (data.dias || []).map(d => fmt(new Date(d + 'T12:00')));
  return h(`<div class="chosen">📅 ${ds.length > 1 ? 'Días elegidos' : 'Día elegido'}: <b>${esc(ds.join(' · '))}</b></div>`);
}
function game(done) {
  const box = h(`<div class="game"><div class="game-art">🎮</div><p>Aquí irá el minijuego <b>pixel art</b> tipo Subway Surfers.<br>¡Consigue el objetivo para ver tu premio!</p>
    <button class="redeem">¡LO HE CONSEGUIDO!</button><small>(botón provisional hasta que esté el juego)</small></div>`);
  box.querySelector('button').onclick = () => done({});
  return box;
}
function swipe(cards, done) {
  const box = h(`<div class="swipe"><div class="sw-stack"></div><div class="sw-btns"><button class="sw-no" aria-label="No">✕</button><button class="sw-yes" aria-label="Sí">♥</button></div></div>`);
  const stack = box.querySelector('.sw-stack'), likes = [], nopes = []; let k = 0;
  const show = () => {
    stack.innerHTML = '';
    if (k >= cards.length) return done({likes, nopes});
    const c = h(`<div class="sw-card"><div class="sw-pic">🍳</div><b>${esc(cards[k])}</b><small>${k + 1} / ${cards.length}</small><i class="sw-tag yes">SÍ</i><i class="sw-tag no">NO</i></div>`);
    stack.append(c);
    let x0 = null, dx = 0;
    c.addEventListener('pointerdown', e => { x0 = e.clientX; c.setPointerCapture?.(e.pointerId); c.style.transition = 'none'; });
    c.addEventListener('pointermove', e => { if (x0 === null) return; dx = e.clientX - x0; c.style.transform = `translateX(${dx}px) rotate(${dx / 14}deg)`;
      c.querySelector('.yes').style.opacity = Math.max(0, dx / 90); c.querySelector('.no').style.opacity = Math.max(0, -dx / 90); });
    const end = () => { if (x0 === null) return; x0 = null; c.style.transition = '';
      if (Math.abs(dx) > 80) decide(dx > 0); else { c.style.transform = ''; c.querySelectorAll('.sw-tag').forEach(t => t.style.opacity = 0); } dx = 0; };
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
  };
  const decide = yes => {
    const c = stack.firstElementChild; if (!c) return;
    (yes ? likes : nopes).push(cards[k]);
    c.style.transform = `translateX(${yes ? 140 : -140}%) rotate(${yes ? 25 : -25}deg)`; c.style.opacity = 0;
    k++; setTimeout(show, 260);
  };
  box.querySelector('.sw-yes').onclick = () => decide(true);
  box.querySelector('.sw-no').onclick = () => decide(false);
  show();
  return box;
}
function choose(rounds, done) {
  const box = h(`<div class="pick"></div>`), picks = []; let k = 0;
  const show = () => {
    if (k >= rounds.length) return done({picks});
    const [a, b] = rounds[k];
    box.innerHTML = `<div class="pick-n">Ronda ${k + 1} de ${rounds.length}</div><div class="pick-row"><button>${esc(a)}</button><span>o</span><button>${esc(b)}</button></div>`;
    box.querySelectorAll('.pick-row button').forEach((btn, i) => btn.onclick = () => { btn.classList.add('on'); picks.push(rounds[k][i]); k++; setTimeout(show, 280); });
  };
  show();
  return box;
}
function password(hash, done) {
  const box = h(`<form class="pass"><p>🔐 Este necesita una contraseña que solo sé yo…</p><input type="password" placeholder="Contraseña" autocomplete="off"><button class="redeem">ABRIR</button><div class="pass-err"></div></form>`);
  box.onsubmit = async e => {
    e.preventDefault();
    const v = box.querySelector('input').value;
    if (await sha256(v) === hash) done({});
    else { const er = box.querySelector('.pass-err'); er.textContent = 'Esa no es 😜'; box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); }
  };
  return box;
}

/* ---------- main ---------- */
export function renderContent(n, el) {
  const T = TICKETS[n - 1]; if (!T) return;
  const st = prog[n] || (prog[n] = {done: {}, data: {}});
  el.innerHTML = '';
  el.classList.add('contenido');
  for (let i = 0; i < T.bloques.length; i++) {
    const b = T.bloques[i];
    const finish = data => {
      report(n, b.calendario ? 'calendario' : b.juego ? 'juego' : b.desliza ? 'desliza' : b.elige ? 'elige' : 'clave', data);
      st.done[i] = true; st.data[i] = data; saveP(); renderContent(n, el); el.dispatchEvent(new CustomEvent('paso', {bubbles: true})); };
    const isStep = b.calendario || b.juego || b.desliza || b.elige || b.clave;
    if (isStep && !st.done[i]) {
      el.append(b.calendario ? calendar(b.calendario, st, finish) : b.juego ? game(finish) : b.desliza ? swipe(b.desliza, finish)
        : b.elige ? choose(b.elige, finish) : password(b.clave, finish));
      return;                                   // the rest stays hidden until this step is done
    }
    if (b.calendario) el.append(calendarDone(st.data[i] || {}));
    else if (b.texto) el.append(h(`<p class="${b.pista ? 'pista' : 'txt'}">${esc(b.texto)}</p>`));
    else if (b.vale) el.append(vale(b.vale, b.arriba));
    else if (typeof b.carta === 'string') el.append(h(`<article class="carta-papel"><div class="carta-sello">💌</div>
      ${b.carta.split(/\n\s*\n/).map(p => `<p>${esc(p)}</p>`).join('')}
      ${b.despedida ? `<p class="carta-desp">${esc(b.despedida)}</p>` : ''}${b.firma ? `<p class="carta-firma">${esc(b.firma)}</p>` : ''}</article>`));
    else if (b.carta) el.append(h(`<div class="carta"><div class="env">✉️</div><p>Tu carta llegará muy pronto…</p></div>`));
  }
}

/* ---------- styles ---------- */
const css = `
.contenido{display:flex;flex-direction:column;gap:14px;text-align:left;margin:6px 0 16px}
.contenido .txt{margin:0;font-size:16.5px;line-height:1.5;color:#2a3b30}
.contenido .pista{margin:0;font-size:15px;line-height:1.45;padding:10px 12px;border-radius:12px;background:#fff3cf;border:2px dashed #c8902a;color:#5a3a12}
.vale{width:100%;container-type:inline-size}
.vale-in{position:relative;aspect-ratio:${W}/${H};filter:drop-shadow(0 4px 6px rgba(0,0,0,.22))}
.vale-in svg{position:absolute;inset:0;width:100%;height:100%}
.vale-txt{position:absolute;left:9%;right:24%;top:14%;bottom:14%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:1cqw}
.vale-top{font-family:"Great Vibes",cursive;color:#9b1c1c;font-size:7.2cqw;line-height:1}
.vale-main{font-family:Fredoka,sans-serif;font-weight:700;color:#1d1410;text-transform:uppercase;line-height:1.08;letter-spacing:.2px}
.cal{display:flex;flex-direction:column;align-items:center;gap:8px}
.cal-head,.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;width:100%}
.cal-head span{text-align:center;font-weight:700;font-size:13px;color:#9b1c1c}
.cal-d{aspect-ratio:1;border:0;border-radius:10px;background:#fff8e6;box-shadow:inset 0 0 0 2px #e2b54a;font:700 15px Fredoka,sans-serif;color:#1f4d33;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;padding:0}
.cal-d small{font-size:9px;font-weight:600;color:#9b1c1c}
.cal-d.off{background:transparent;box-shadow:none;color:#c9c2b2;cursor:default}
.cal-d.on{background:#1f6b2e;color:#fff;box-shadow:inset 0 0 0 2px #e2b54a,0 0 10px rgba(31,107,46,.5)}
.cal-d.on small{color:#ffe7a6}
.cal-d:disabled:not(.on):not(.off){opacity:.45}
.cal-info{font-size:14px;color:#5a6a60}
.cal-ok:disabled{filter:grayscale(1);opacity:.55;cursor:default}
.chosen{font-size:15px;line-height:1.45;padding:10px 12px;border-radius:12px;background:#e9f5ec;color:#1f4d33}
.carta{text-align:center;padding:16px;border-radius:14px;background:#fff8e6;box-shadow:inset 0 0 0 2px #e2b54a}
.carta .env{font-size:46px}.carta p{margin:6px 0 0;font-size:16px}
.carta-papel{position:relative;padding:28px 20px 22px;border-radius:6px;color:#3a2a1c;text-align:left;
  background:repeating-linear-gradient(#fffaf0 0 33px,#e9dcc3 33px 34px),#fffaf0;background-position:0 14px;
  box-shadow:0 2px 0 #e2d3b4,0 6px 18px rgba(0,0,0,.18),inset 3px 0 0 #f2b8b8;transform:rotate(-.4deg)}
.carta-papel p{margin:0 0 14px;font-family:Caveat,'Segoe Print',cursive;font-size:23px;line-height:34px;font-weight:500}
.carta-papel p:first-of-type::first-letter{font-family:Caveat,cursive;font-weight:700;font-size:76px;float:left;line-height:66px;height:66px;margin:2px 8px 0 -2px;color:#9b1c1c;text-transform:uppercase}
.carta-sello{position:absolute;top:-14px;right:14px;font-size:30px;transform:rotate(12deg);filter:drop-shadow(0 2px 2px rgba(0,0,0,.25))}
.carta-desp{text-align:center;margin-top:20px!important;color:#1f6b2e;font-weight:700!important}
.carta-firma{text-align:right;font-family:'Great Vibes',cursive!important;font-size:34px!important;color:#9b1c1c;margin:4px 6px 0 0!important}
.game{text-align:center;padding:16px 12px;border-radius:14px;background:#13261c;color:#fff3d6;display:flex;flex-direction:column;align-items:center;gap:10px}
.game-art{font-size:44px}.game p{margin:0;line-height:1.45}.game small{opacity:.6;font-size:11px}
.swipe{display:flex;flex-direction:column;align-items:center;gap:12px}
.sw-stack{position:relative;width:min(100%,240px,34dvh);aspect-ratio:3/4}
.sw-card{position:absolute;inset:0;border-radius:18px;background:linear-gradient(#fff8e6,#f3dfb0);box-shadow:0 8px 20px rgba(0,0,0,.25),inset 0 0 0 3px #e2b54a;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;touch-action:none;transition:transform .26s ease,opacity .26s;user-select:none}
.sw-pic{font-size:64px}.sw-card b{font-size:20px;color:#1f4d33}.sw-card small{color:#8a7a5a}
.sw-tag{position:absolute;top:16px;font-style:normal;font-weight:700;font-size:22px;padding:4px 10px;border-radius:8px;border:3px solid;opacity:0}
.sw-tag.yes{left:14px;color:#1f8a3a;transform:rotate(-14deg)}.sw-tag.no{right:14px;color:#c4161c;transform:rotate(14deg)}
.sw-btns{display:flex;gap:28px}
.sw-btns button{width:58px;height:58px;border-radius:50%;border:0;font-size:26px;cursor:pointer;background:#fff;box-shadow:0 4px 10px rgba(0,0,0,.2),inset 0 0 0 3px #e2b54a}
.sw-no{color:#c4161c}.sw-yes{color:#1f8a3a}
.pick{text-align:center}
.pick-n{font-size:14px;color:#9b1c1c;font-weight:700;margin-bottom:10px}
.pick-row{display:flex;align-items:center;gap:10px}
.pick-row span{font-family:"Great Vibes",cursive;font-size:26px;color:#9b1c1c}
.pick-row button{flex:1;min-height:110px;border:0;border-radius:16px;cursor:pointer;font:700 17px Fredoka,sans-serif;color:#1f4d33;padding:12px;
  background:linear-gradient(#fff8e6,#f3dfb0);box-shadow:0 6px 14px rgba(0,0,0,.2),inset 0 0 0 3px #e2b54a;transition:transform .2s}
.pick-row button.on{transform:scale(1.06);background:#1f6b2e;color:#fff}
.pass{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center}
.pass p{margin:0;font-size:16px}
.pass input{width:100%;font:600 17px Fredoka,sans-serif;text-align:center;padding:12px;border-radius:12px;border:2px solid #e2b54a;background:#fff8e6;outline:none}
.pass-err{color:#c4161c;font-weight:600;min-height:1.2em}
.shake{animation:shake .4s}
@keyframes shake{20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
`;
document.head.append(Object.assign(document.createElement('style'), {textContent: css}));
