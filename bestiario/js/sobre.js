/* =========================================================
   SOBRE DE RECOMPENSAS – animación de apertura con zarpazos
   ---------------------------------------------------------
   Uso:
     import { abrirSobre, cerrarSobre } from './sobre.js';
     await abrirSobre();      // muestra el sobre; el jugador lo araña 3 veces (en cualquier dirección);
                              // se resuelve cuando la luz blanca cubre la pantalla
     // ...aquí mostrar las recompensas...
     cerrarSobre();           // quita la pantalla blanca con un fundido

   También queda disponible como window.abrirSobre / window.cerrarSobre.
   TODAVÍA NO SE LLAMA DESDE EL JUEGO: falta decidir cuándo aparece.
   ========================================================= */

export const SOBRE_CONFIG = {
  imagen: new URL('../assets/sobre.png', import.meta.url).href,
  firstScratchDelay: 250,    // ms tras el toque
  timeBetweenScratches: 750, // ms entre zarpazos
  slashDuration: 140,        // ms que tarda en dibujarse cada zarpazo
  splitDuration: 650,        // ms que tardan las mitades en separarse
  flashDuration: 550,        // ms que tarda la luz en cubrir la pantalla
  textoToca: '¡ARAÑA EL SOBRE!',
  minLen: 360, maxLen: 700,  // largo del zarpazo (en píxeles de la imagen 556x640)
};

/* Los zarpazos los hace el jugador deslizando el dedo: cada uno se crea con la dirección y el largo de su gesto
   (coordenadas de la imagen 556x640). Al tercero el sobre se rompe a lo largo de ese zarpazo. */
const CLAW_SPACING = 54;
/* 4 marcas: [desplazamiento lateral, longitud relativa, desfase a lo largo, grosor] */
const CLAWS = [
  [-1.5, 0.70,  0.10, 0.80],
  [-0.5, 1.00, -0.04, 1.00],
  [ 0.5, 0.95,  0.02, 0.95],
  [ 1.5, 0.74,  0.12, 0.80],
];
const W = 556, H = 640;

const CSS = `
.sb-root{position:fixed;inset:0;z-index:200;overflow:hidden;user-select:none;cursor:pointer;touch-action:manipulation;
  background:radial-gradient(circle at 50% 45%,#a43cff 0%,#6a16d6 40%,#2a0660 100%);
  font-family:'Lilita One',system-ui,sans-serif;-webkit-tap-highlight-color:transparent;transition:opacity .45s}
.sb-root *{box-sizing:border-box}
.sb-scene{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.sb-rays{position:absolute;width:150vmax;height:150vmax;left:50%;top:50%;margin:-75vmax 0 0 -75vmax;opacity:0;pointer-events:none;
  will-change:transform,opacity;animation:sb-spin 14s linear infinite;transition:opacity .35s}
@keyframes sb-spin{to{transform:rotate(360deg)}}
.sb-halo{position:absolute;width:90vmin;height:90vmin;left:50%;top:50%;margin:-45vmin 0 0 -45vmin;border-radius:50%;pointer-events:none;
  background:radial-gradient(circle,rgba(255,255,255,.9) 0%,rgba(240,220,255,.35) 35%,transparent 70%);opacity:0;transition:opacity .35s;will-change:opacity}
.sb-stage{position:relative;width:min(68vw,52vh);aspect-ratio:556/640;will-change:transform;animation:sb-idle 2.4s ease-in-out infinite}
.sb-stage.sb-opening{animation:none}
@keyframes sb-idle{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-2.5%) rotate(1deg)}}
.sb-glow{position:absolute;left:-20%;top:-20%;width:140%;height:140%;pointer-events:none}
.sb-pack,.sb-half{position:absolute;inset:0}
.sb-half{display:none;will-change:transform,opacity}
.sb-pack img,.sb-half img,.sb-cuts{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none}
.sb-hint{position:absolute;bottom:9vh;left:0;right:0;text-align:center;color:#fff;letter-spacing:.08em;font-size:clamp(18px,4.6vw,28px);
  text-shadow:0 0 12px #c8ff2e,0 2px 0 #3a0a7a;animation:sb-pulse 1.2s ease-in-out infinite}
@keyframes sb-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.07);opacity:.75}}
.sb-fx{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.sb-flash{position:absolute;left:0;top:0;width:200px;height:200px;margin:-100px 0 0 -100px;border-radius:50%;pointer-events:none;
  transform:scale(0);will-change:transform;background:radial-gradient(circle,#fff 0%,#fff 55%,rgba(255,255,255,0) 70%)}
.sb-white{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;will-change:opacity}
`;

/* ---------- Utilidades ---------- */
const wait = ms => new Promise(r => setTimeout(r, ms));
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function vibrate(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} }

let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

function clawShapes(s, sizeMul, smooth) {
  seed = 7 + Math.round(s.cx + s.cy);
  const a = s.angle * Math.PI / 180;
  const dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
  return CLAWS.map(([lat, lenK, shift, wK]) => {
    const L = s.len * lenK;
    const cx = s.cx + nx * lat * CLAW_SPACING + dx * shift * s.len;
    const cy = s.cy + ny * lat * CLAW_SPACING + dy * shift * s.len;
    let p0 = [cx - dx * L / 2, cy - dy * L / 2], p2 = [cx + dx * L / 2, cy + dy * L / 2];
    const p1 = [cx + nx * s.curve, cy + ny * s.curve];
    if (s.reverse) [p0, p2] = [p2, p0];
    const N = 26, left = [], right = [], maxW = 38 * wK * sizeMul;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const x = (1-u)*(1-u)*p0[0] + 2*(1-u)*u*p1[0] + u*u*p2[0];
      const y = (1-u)*(1-u)*p0[1] + 2*(1-u)*u*p1[1] + u*u*p2[1];
      let tx = 2*(1-u)*(p1[0]-p0[0]) + 2*u*(p2[0]-p1[0]);
      let ty = 2*(1-u)*(p1[1]-p0[1]) + 2*u*(p2[1]-p1[1]);
      const tl = Math.hypot(tx, ty); tx /= tl; ty /= tl;
      const qx = -ty, qy = tx;
      const uu = s.reverse ? 1 - u : u;
      const prof = Math.pow(Math.sin(Math.PI * Math.pow(uu, 0.8)), 1.6);
      const jag = () => smooth ? 1 : (rnd() < 0.28 ? 0.55 + rnd() * 0.2 : 0.95 + rnd() * 0.12);
      const wl = maxW * prof * jag(), wr = maxW * prof * jag();
      left.push([x + qx * wl, y + qy * wl]);
      right.push([x - qx * wr, y - qy * wr]);
    }
    return { left, right };
  });
}
function polyPath(ctx, c, upTo = 1) {
  const n = c.left.length - 1, k = Math.max(1, Math.ceil(n * upTo));
  ctx.moveTo(c.left[0][0], c.left[0][1]);
  for (let i = 1; i <= k; i++) ctx.lineTo(c.left[i][0], c.left[i][1]);
  for (let i = k; i >= 0; i--) ctx.lineTo(c.right[i][0], c.right[i][1]);
  ctx.closePath();
}
/* Relleno difuminado con shadowBlur (se hace una sola vez, al preparar) */
function glowFill(ctx, shapes, color, blur, k, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = color; ctx.shadowBlur = blur * k; ctx.shadowOffsetX = 10000 * k;
  ctx.translate(-10000, 0);
  ctx.fillStyle = color;
  ctx.beginPath(); shapes.forEach(c => polyPath(ctx, c)); ctx.fill();
  ctx.restore();
}

/* Imagen precargada para que aparezca al instante */
let imgPromise = null;
function loadImage() {
  if (!imgPromise) imgPromise = new Promise((res, rej) => {
    const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = SOBRE_CONFIG.imagen;
  });
  return imgPromise;
}
export function precargarSobre() { return loadImage(); }

let current = null;

/* =========================================================
   abrirSobre(): crea la pantalla, espera el toque y anima.
   Devuelve una promesa que se resuelve cuando la pantalla está en blanco.
   ========================================================= */
export async function abrirSobre(opts = {}) {
  if (current) cerrarSobre({ instant: true });
  const C = { ...SOBRE_CONFIG, ...opts };
  const img = await loadImage();
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  if (!document.getElementById('sb-style')) {
    const st = document.createElement('style'); st.id = 'sb-style'; st.textContent = CSS; document.head.appendChild(st);
  }
  const root = document.createElement('div');
  root.className = 'sb-root';
  root.innerHTML = `
    <div class="sb-scene">
      <div class="sb-halo"></div>
      <canvas class="sb-rays" width="1024" height="1024"></canvas>
      <div class="sb-stage">
        <canvas class="sb-glow"></canvas>
        <div class="sb-pack"><img alt="Sobre"><canvas class="sb-cuts"></canvas></div>
        <div class="sb-half sb-top"><img alt=""><canvas class="sb-cuts"></canvas></div>
        <div class="sb-half sb-bot"><img alt=""><canvas class="sb-cuts"></canvas></div>
      </div>
      <div class="sb-hint">${C.textoToca}</div>
    </div>
    <canvas class="sb-fx"></canvas>
    <div class="sb-flash"></div>
    <div class="sb-white"></div>`;
  document.body.appendChild(root);
  const q = s => root.querySelector(s);
  root.querySelectorAll('img').forEach(i => i.src = img.src);
  const stage = q('.sb-stage'), pack = q('.sb-pack'), rays = q('.sb-rays'), halo = q('.sb-halo');
  const hint = q('.sb-hint'), topHalf = q('.sb-top'), botHalf = q('.sb-bot');
  const flash = q('.sb-flash'), whiteout = q('.sb-white'), glow = q('.sb-glow');
  const cuts = q('.sb-pack .sb-cuts'), cctx = cuts.getContext('2d');

  /* ---------- Pre-render ---------- */
  const pw = Math.round(stage.offsetWidth * DPR), ph = Math.round(stage.offsetHeight * DPR);
  const k = pw / W;
  root.querySelectorAll('.sb-cuts').forEach(c => { c.width = pw; c.height = ph; });
  const scratches = [], cache = [], clipShapes = [];
  const prepare = s => {
    const c = makeCanvas(pw, ph), x = c.getContext('2d');
    x.scale(k, k);
    const leak = clawShapes(s, 1.3, true), dark = clawShapes(s, 1, false), inner = clawShapes(s, 0.16, true);
    glowFill(x, leak, 'rgba(255,255,255,1)', 14, k, .75);
    x.fillStyle = '#1c0628'; x.beginPath(); dark.forEach(c => polyPath(x, c)); x.fill();
    x.strokeStyle = 'rgba(243,217,192,.8)'; x.lineWidth = 1.6; x.lineJoin = 'bevel'; x.stroke();
    glowFill(x, inner, '#fff', 5, k);
    x.fillStyle = '#fff'; x.beginPath(); inner.forEach(c => polyPath(x, c)); x.fill();
    scratches.push(s); cache.push(c); clipShapes.push(clawShapes(s, 2.2, true));
  };

  glow.width = Math.round(pw * 1.4); glow.height = Math.round(ph * 1.4);
  const gx = glow.getContext('2d');
  gx.shadowColor = 'rgba(20,0,50,.55)'; gx.shadowBlur = 24 * DPR; gx.shadowOffsetY = 18 * DPR;
  gx.drawImage(img, pw * .2, ph * .2, pw, ph);
  gx.shadowColor = 'rgba(200,255,60,.45)'; gx.shadowBlur = 26 * DPR; gx.shadowOffsetY = 0;
  gx.drawImage(img, pw * .2, ph * .2, pw, ph);

  (() => {
    const x = rays.getContext('2d'), c = 512;
    x.translate(c, c); x.fillStyle = 'rgba(255,255,255,.55)';
    for (let i = 0; i < 360; i += 22) { x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, c, i * Math.PI / 180, (i + 6) * Math.PI / 180); x.closePath(); x.fill(); }
    x.globalCompositeOperation = 'destination-in';
    const gr = x.createRadialGradient(0, 0, 0, 0, 0, c);
    gr.addColorStop(0, '#000'); gr.addColorStop(.36, 'rgba(0,0,0,.6)'); gr.addColorStop(.9, 'rgba(0,0,0,0)');
    x.fillStyle = gr; x.fillRect(-c, -c, 2 * c, 2 * c);
  })();

  /* ---------- Zarpazos animados ---------- */
  let done = 0, anim = null;
  function renderCuts(now) {
    cctx.setTransform(1, 0, 0, 1, 0, 0);
    cctx.clearRect(0, 0, cuts.width, cuts.height);
    for (let i = 0; i < done; i++) cctx.drawImage(cache[i], 0, 0);
    if (anim) {
      const raw = Math.min((now - anim.t0) / C.slashDuration, 1);
      const p = 1 - Math.pow(1 - raw, 3);
      cctx.save(); cctx.scale(k, k); cctx.beginPath();
      clipShapes[anim.i].forEach((c, idx) => {
        const pp = Math.min(Math.max(p * 1.25 - idx * 0.08, 0), 1);
        if (pp > 0) polyPath(cctx, c, pp);
      });
      cctx.clip(); cctx.setTransform(1, 0, 0, 1, 0, 0);
      cctx.drawImage(cache[anim.i], 0, 0);
      cctx.restore();
      if (raw >= 1) { done = anim.i + 1; anim = null; renderCuts(now); }
    }
  }
  const slash = i => new Promise(res => {
    anim = { i, t0: performance.now() };
    const step = now => { renderCuts(now); anim ? requestAnimationFrame(step) : res(); };
    requestAnimationFrame(step);
  });

  /* ---------- Partículas ---------- */
  const cvs = q('.sb-fx'), ctx = cvs.getContext('2d');
  cvs.width = innerWidth * DPR; cvs.height = innerHeight * DPR;
  let parts = [], looping = false, trail = [], drag = null;
  const spark = makeCanvas(32, 32);
  { const x = spark.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, '#fff'); g.addColorStop(.35, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 32, 32); }
  const toScreen = (x, y) => { const r = stage.getBoundingClientRect(); return { x: r.left + x / W * r.width, y: r.top + y / H * r.height }; };
  function burst(s, amount) {
    const a = s.angle * Math.PI / 180;
    for (let i = 0; i < amount; i++) {
      const t = (Math.random() - .5) * s.len;
      const p = toScreen(s.cx + Math.cos(a) * t, s.cy + Math.sin(a) * t);
      const isSpark = Math.random() < .55, sp = (isSpark ? 6 : 3.5) * (0.4 + Math.random()), dir = Math.random() * Math.PI * 2;
      parts.push({ x: p.x, y: p.y, vx: Math.cos(dir) * sp, vy: Math.sin(dir) * sp - 2, life: 1, decay: .02 + Math.random() * .02,
        spark: isSpark, size: isSpark ? 8 + Math.random() * 10 : 5 + Math.random() * 8, rot: Math.random() * 6, vr: (Math.random() - .5) * .4,
        color: ['#e9c7a6', '#d9ad8c', '#5b2a86', '#c8ff2e'][Math.floor(Math.random() * 4)] });
    }
    if (!looping) { looping = true; requestAnimationFrame(loop); }
  }
  function loop() {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cvs.width, cvs.height);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    parts = parts.filter(p => p.life > 0);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.vy += p.spark ? .08 : .25; p.vx *= .98; p.rot += p.vr; p.life -= p.decay;
      ctx.globalAlpha = Math.max(p.life, 0);
      if (p.spark) ctx.drawImage(spark, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      else {
        const c = Math.cos(p.rot), s = Math.sin(p.rot), h = p.size / 2;
        ctx.setTransform(c * DPR, s * DPR, -s * DPR, c * DPR, p.x * DPR, p.y * DPR);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.moveTo(-h, -h * .66); ctx.lineTo(h, -h * .5); ctx.lineTo(h * .66, h * .66); ctx.lineTo(-h * .66, h); ctx.fill();
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      }
    }
    ctx.globalAlpha = 1;
    const now = performance.now(); while (trail.length && now - trail[0].t > 160) trail.shift();
    if (trail.length > 1) { ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const [w, col] of [[14, 'rgba(200,255,46,.25)'], [5, 'rgba(255,255,255,.85)']]) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); trail.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); } }
    if ((parts.length || trail.length || drag) && root.isConnected) requestAnimationFrame(loop);
    else { looping = false; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cvs.width, cvs.height); }
  }

  function shake(power) {
    stage.animate([
      { transform: 'translate(0,0) rotate(0) scale(1)' },
      { transform: `translate(${power}px,${-power * .6}px) rotate(${power * .25}deg) scale(1.04)` },
      { transform: `translate(${-power}px,${power * .5}px) rotate(${-power * .25}deg) scale(.98)` },
      { transform: `translate(${power * .5}px,0) rotate(${power * .1}deg) scale(1.02)` },
      { transform: 'translate(0,0) rotate(0) scale(1)' },
    ], { duration: 280, easing: 'ease-out' });
  }
  function splitClips(s) {
    const a = s.angle * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx, pts = [], R = 900;
    for (let i = 0; i <= 14; i++) { const t = (i / 14 - .5) * 2 * R, j = (i % 2 ? 1 : -1) * 14; pts.push([s.cx + dx * t + nx * j, s.cy + dy * t + ny * j]); }
    const P = p => `${(p[0] / W * 100).toFixed(2)}% ${(p[1] / H * 100).toFixed(2)}%`;
    const far = (p, k) => [p[0] + nx * R * k, p[1] + ny * R * k];
    const sideA = [...pts, far(pts[14], -1), far(pts[0], -1)], sideB = [...pts, far(pts[14], 1), far(pts[0], 1)];
    topHalf.style.clipPath = `polygon(${sideA.map(P).join(',')})`;
    botHalf.style.clipPath = `polygon(${sideB.map(P).join(',')})`;
    return { nx, ny };
  }

  current = { root };

  /* ---------- El jugador araña 3 veces ---------- */
  const toImg = (x, y) => { const r = stage.getBoundingClientRect(); return [(x - r.left) / r.width * W, (y - r.top) / r.height * H]; };
  let first = true, busy = Promise.resolve();   // drag y trail: estela del dedo mientras arrastra
  function scratchFrom(a, b) {
    let [x0, y0] = toImg(a.x, a.y), [x1, y1] = toImg(b.x, b.y);
    let L = Math.hypot(x1 - x0, y1 - y0), ang;
    if (L < 40) { ang = (Math.random() * 2 - 1) * 80; } else ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;   // un toque: zarpazo en dirección al azar
    L = Math.min(C.maxLen, Math.max(C.minLen, L * 1.4));
    const cx = Math.min(W - 130, Math.max(130, (x0 + x1) / 2)), cy = Math.min(H - 130, Math.max(130, (y0 + y1) / 2));
    return { cx, cy, angle: ang, len: L, curve: (Math.random() < .5 ? -1 : 1) * (26 + Math.random() * 14), reverse: false };
  }
  const opened = new Promise(resolveOpen => {
    const down = e => { if (!root.isConnected || scratches.length >= 3) return; drag = { x: e.clientX, y: e.clientY, id: e.pointerId }; trail.length = 0; trail.push({ x: e.clientX, y: e.clientY, t: performance.now() }); };
    const move = e => { if (drag && e.pointerId === drag.id) { trail.push({ x: e.clientX, y: e.clientY, t: performance.now() }); if (!looping) { looping = true; requestAnimationFrame(loop); } } };
    const up = e => {
      if (!drag || e.pointerId !== drag.id) return;
      const a = drag, b = { x: e.clientX, y: e.clientY }; drag = null;
      if (scratches.length >= 3) return;
      const s = scratchFrom(a, b); prepare(s); const i = scratches.length - 1;
      busy = busy.then(async () => {
        if (first) { first = false; stage.classList.add('sb-opening'); hint.style.visibility = 'hidden'; }
        const drawing = slash(i);
        setTimeout(() => {
          shake(8 + i * 5); vibrate(30 + i * 25); burst(s, 22 + i * 14);
          rays.style.opacity = [0.35, 0.65, 1][i];
          halo.style.opacity = [0.25, 0.5, 0.9][i];
        }, C.slashDuration * .6);
        await drawing;
        if (i === 2) { root.removeEventListener('pointerdown', down); removeEventListener('pointermove', move); removeEventListener('pointerup', up); resolveOpen(); }
      });
    };
    root.addEventListener('pointerdown', down); addEventListener('pointermove', move); addEventListener('pointerup', up);
  });
  current = { root };
  await opened;
  if (!root.isConnected) return;
  const last = scratches[2];

  /* ---------- Rotura ---------- */
  await wait(120);
  [topHalf, botHalf].forEach(h => { h.querySelector('.sb-cuts').getContext('2d').drawImage(cuts, 0, 0); h.style.display = 'block'; });
  const { nx, ny } = splitClips(last);
  pack.style.display = 'none'; glow.style.opacity = 0;
  burst(last, 70);
  vibrate([60, 30, 120]);
  const o = { duration: C.splitDuration, easing: 'cubic-bezier(.15,.7,.3,1)', fill: 'forwards' };
  // cada mitad sale despedida hacia su lado del corte
  topHalf.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: `translate(${-nx * 50}%,${-ny * 55}%) rotate(${-22 * Math.sign(nx || 1)}deg)`, opacity: .2 }], o);
  botHalf.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: `translate(${nx * 45}%,${ny * 50}%) rotate(${18 * Math.sign(nx || 1)}deg)`, opacity: .2 }], o);

  /* ---------- Luz blanca ---------- */
  const c = toScreen(last.cx, last.cy);
  flash.style.left = c.x + 'px'; flash.style.top = c.y + 'px';
  const cover = Math.hypot(innerWidth, innerHeight) * 2 / 200 * 1.6;
  flash.animate([
    { transform: 'scale(0)' },
    { transform: `scale(${cover * .3})`, offset: .4 },
    { transform: `scale(${cover})` },
  ], { duration: C.flashDuration, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' });
  whiteout.animate([{ opacity: 0 }, { opacity: 1 }], { duration: C.flashDuration, delay: C.flashDuration * .5, fill: 'forwards' });
  await wait(C.flashDuration * 1.6);

  root.style.background = '#fff';
  document.dispatchEvent(new CustomEvent('sobreAbierto'));
  if (typeof C.onOpened === 'function') C.onOpened();
}

/* Quita la pantalla del sobre (con fundido salvo instant:true) */
export function cerrarSobre({ instant = false } = {}) {
  if (!current) return;
  const { root } = current; current = null;
  if (instant) { root.remove(); return; }
  root.style.opacity = 0;
  setTimeout(() => root.remove(), 480);
}

window.abrirSobre = abrirSobre;
window.cerrarSobre = cerrarSobre;
