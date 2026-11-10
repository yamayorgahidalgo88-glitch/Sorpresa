import { createCharacter, setupScene, THREE } from './models.js';

/* =========================================================
   DATOS
   ========================================================= */
// Estadísticas y habilidades PROVISIONALES: las definirá el diseñador.
const CHARS = {
  bushi: { name: 'Bushi', cost: 3, role: 'Luchador', color: '#2fbf86', hp: 600, atk: 75, range: 1, as: 0.95, ms: 0.6, abil: 'super',
    abilName: 'Tajo de jade', desc: 'Súper: un tajo giratorio de su espada de jade golpea a todos los enemigos a su alrededor.',
    all: ['pose', 'front', 'q', 'bq', 'back', 'top', 'bottom'] },
  bolab: { name: 'Bolab', cost: 2, role: 'Tanque', color: '#f08a2c', hp: 950, atk: 45, range: 1, as: 1.3, ms: 0.92, abil: 'clash',
    abilName: 'Coraza de lava', desc: 'Clash: al empezar el combate se cubre con una coraza de roca volcánica (35% de su vida).',
    all: ['pose', 'front', 'q', 'side', 'back', 'top', 'fronttop', 'bottom'] },
  ogul: { name: 'Ogul', cost: 4, role: 'Mago', color: '#8b4fd8', hp: 400, atk: 70, range: 3, as: 1.5, ms: 0.8, abil: 'super', proj: '#ff7a4a',
    abilName: 'Ojo estelar', desc: 'Súper: su ojo lanza un orbe de energía que estalla y daña a los enemigos de alrededor.',
    all: ['pose', 'front', 'q', 'side', 'back', 'top', 'top2', 'frontbottom'] },
};
const VIEW_NAMES = { pose: 'Pose', front: 'Frente', q: '3/4', bq: '3/4 espalda', side: 'Perfil', back: 'Espalda', top: 'Arriba', top2: 'Arriba 2', bottom: 'Abajo', fronttop: 'Abajo frente', frontbottom: 'Abajo frente' };
const VIEW_ANGLES = { pose: [-25, 12], front: [0, 6], q: [-45, 6], bq: [-135, 6], side: [-90, 6], back: [180, 6], top: [0, 70], top2: [180, 70], bottom: [0, -35], fronttop: [0, -30], frontbottom: [0, -30] };
const TYPES = Object.keys(CHARS);
const COLS = 5, ROWS = 8, MAX_UNITS = 7, WIN_ROUNDS = 3, ROUND_CAP = 40, ELIXIR_CAP = 20;
const LVL_MULT = [0, 1, 1.6, 2.4], LVL_SCALE = [0, 0.84, 0.95, 1.07];
const FRONT_ROLES = ['Tanque', 'Luchador'];
// Tablero: imagen, esquinas de la rejilla 5x8 y cámara 3D ajustada a su perspectiva
const BOARD = { src: 'assets/tablero.webp', w: 962, h: 1024, corners: [[280, 267], [694, 266], [742, 780], [225, 781]],
  cam: { pos: [0.2313, 17.934, 18.81], rot: [-0.768588, 0.014848, -0.012653], fov: 24.1817 } };
const src = (t, v) => `assets/${t}_${v}.webp`;

/* =========================================================
   UTILIDADES
   ========================================================= */
const $ = s => document.querySelector(s);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const key = (c, r) => c + ',' + r;
const cheb = (a, b) => Math.max(Math.abs(a.c - b.c), Math.abs(a.r - b.r));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const angDiff = (a, b) => { let d = (a - b) % 360; if (d > 180) d -= 360; if (d < -180) d += 360; return d; };

function solveHomography(dst) {
  const sp = [[0, 0], [1, 0], [1, 1], [0, 1]], A = [], b = [];
  for (let i = 0; i < 4; i++) { const [x, y] = sp[i], [u, v] = dst[i]; A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u); A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v); }
  for (let i = 0; i < 8; i++) {
    let p = i; for (let j = i + 1; j < 8; j++) if (Math.abs(A[j][i]) > Math.abs(A[p][i])) p = j;
    [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]];
    for (let j = i + 1; j < 8; j++) { const f = A[j][i] / A[i][i]; for (let k = i; k < 8; k++) A[j][k] -= f * A[i][k]; b[j] -= f * b[i]; }
  }
  const h = new Array(8);
  for (let i = 7; i >= 0; i--) { let s = b[i]; for (let k = i + 1; k < 8; k++) s -= A[i][k] * h[k]; h[i] = s / A[i][i]; }
  return [...h, 1];
}
function invert3(m) {
  const [a, b, c, d, e, f, g, h, i] = m, A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C;
  return [A / det, -(b * i - c * h) / det, (b * f - c * e) / det, B / det, (a * i - c * g) / det, -(a * f - c * d) / det, C / det, -(a * h - b * g) / det, (a * e - b * d) / det];
}
const Hm = solveHomography(BOARD.corners), Hinv = invert3(Hm);
const apply = (m, x, y) => { const w = m[6] * x + m[7] * y + m[8]; return [(m[0] * x + m[1] * y + m[2]) / w, (m[3] * x + m[4] * y + m[5]) / w]; };
const IMG = {};
const load = url => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(url); i.src = url; });

/* =========================================================
   SONIDO
   ========================================================= */
let ac = null, muted = false;
function tone(f, d = 0.08, type = 'square', v = 0.04, slide = 1, delay = 0) {
  if (!ac || muted) return;
  const t0 = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0);
  if (slide !== 1) o.frequency.exponentialRampToValueAtTime(f * slide, t0 + d);
  g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + d + 0.02);
}
const sfx = {
  place: () => { tone(520, .08, 'triangle', .07, 1.5); tone(780, .08, 'triangle', .05, 1.3, .06); },
  merge: () => [660, 880, 1100, 1320].forEach((f, i) => tone(f, .1, 'triangle', .06, 1, i * .06)),
  no: () => tone(180, .15, 'sawtooth', .04, .7),
  click: () => tone(700, .04, 'square', .03),
  hit: () => tone(rand(150, 220), .06, 'square', .025, .5),
  slash: () => tone(rand(1400, 1700), .09, 'sawtooth', .018, .35),
  shoot: () => tone(rand(900, 1100), .07, 'triangle', .02, .5),
  super: () => { tone(300, .25, 'sawtooth', .05, 3); tone(600, .25, 'triangle', .04, 2, .05); },
  boom: () => tone(120, .3, 'sawtooth', .06, .3),
  die: () => tone(400, .2, 'triangle', .05, .3),
  win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, .18, 'triangle', .07, 1, i * .11)),
  lose: () => [440, 392, 330, 262].forEach((f, i) => tone(f, .2, 'triangle', .06, 1, i * .13)),
  round: () => { tone(392, .12, 'square', .04); tone(523, .16, 'square', .04, 1, .12); },
};
function initAudio() { if (!ac) try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } }

/* =========================================================
   LIENZOS Y PROYECCIÓN DEL TABLERO
   ========================================================= */
const canvas = $('#c'), ctx = canvas.getContext('2d'), fxc = $('#fx'), fx = fxc.getContext('2d');
let W = 0, Hs = 0, dpr = 1, S = 1, OX = 0, OY = 0;
const gridToScreen = (gx, gy) => { const [x, y] = apply(Hm, gx / COLS, 1 - gy / ROWS); return [OX + x * S, OY + y * S]; };
const screenToGrid = (sx, sy) => { const [u, v] = apply(Hinv, (sx - OX) / S, (sy - OY) / S); return [u * COLS, (1 - v) * ROWS]; };
const tileW = gy => { const a = gridToScreen(0, gy), b = gridToScreen(COLS, gy); return Math.hypot(b[0] - a[0], b[1] - a[1]) / COLS; };

// escena 3D de la batalla, superpuesta a la imagen del tablero con su misma perspectiva
const B3 = {};
function initBattle3D() {
  const renderer = new THREE.WebGLRenderer({ canvas: $('#gl'), antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const scene = new THREE.Scene(); setupScene(renderer, scene);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(9, 12), new THREE.ShadowMaterial({ opacity: 0.34 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const camera = new THREE.PerspectiveCamera(BOARD.cam.fov, BOARD.w / BOARD.h, 1, 100);
  camera.position.set(...BOARD.cam.pos); camera.rotation.set(...BOARD.cam.rot, 'YXZ');
  Object.assign(B3, { renderer, scene, camera });
}
function layout() {
  W = innerWidth; Hs = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
  for (const c of [canvas, fxc]) { c.width = Math.round(W * dpr); c.height = Math.round(Hs * dpr); }
  const topH = $('#top').offsetHeight || 60, botH = $('#bottom').offsetHeight || 230, availH = Hs - topH - botH;
  const [x0, x1] = [225, 742], [y0, y1] = [267 - 95, 781];
  S = Math.min(W * 0.94 / (x1 - x0), availH * 0.98 / (y1 - y0));
  OX = W / 2 - (x0 + x1) / 2 * S; OY = topH + availH / 2 - (y0 + y1) / 2 * S;
  B3.renderer.setSize(W, Hs, false);
  B3.camera.setViewOffset(BOARD.w * S, BOARD.h * S, -OX, -OY, W, Hs);
}

/* =========================================================
   EFECTOS 2D (partículas, anillos, textos)
   ========================================================= */
let parts = [], fxs = [], shake = 0;
function burstAt(gx, gy, h, color, n = 10, o = {}) {
  const [x, y] = gridToScreen(gx, gy), tw = tileW(gy), base = y - h * tw * 0.72;
  for (let i = 0; i < n; i++) {
    const sp = (o.spd ?? 2) * tw, life = (o.life ?? .6) * rand(.7, 1.2);
    parts.push({ x: x + rand(-.15, .15) * tw, y: base, vx: rand(-1, 1) * sp, vy: -rand(0.3, 1) * (o.up ?? 2) * tw, life, max: life, color, size: (o.size ?? .07) * tw * rand(.7, 1.3), g: (o.g ?? 6) * tw, glow: o.glow });
  }
}
function updateParts(dt) {
  for (const p of parts) { p.life -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  parts = parts.filter(p => p.life > 0);
  for (const f of fxs) f.t += dt;
  fxs = fxs.filter(f => f.t < f.dur);
}
function drawParts() {
  for (const p of parts) {
    const k = p.life / p.max;
    fx.globalAlpha = Math.min(1, k * 1.6); fx.globalCompositeOperation = p.glow ? 'lighter' : 'source-over';
    fx.fillStyle = p.color; fx.beginPath(); fx.arc(p.x, p.y, Math.max(.5, p.size * (.4 + .6 * k)), 0, Math.PI * 2); fx.fill();
  }
  fx.globalAlpha = 1; fx.globalCompositeOperation = 'lighter';
  for (const f of fxs) {
    const k = f.t / f.dur, [x, y] = gridToScreen(f.gx, f.gy), tw = tileW(f.gy);
    fx.globalAlpha = 1 - k; fx.strokeStyle = f.color; fx.lineWidth = tw * .13 * (1 - k) + 1;
    fx.beginPath(); fx.ellipse(x, y, tw * f.r * (0.3 + k), tw * f.r * (0.3 + k) * .68, 0, 0, Math.PI * 2); fx.stroke();
  }
  fx.globalAlpha = 1; fx.globalCompositeOperation = 'source-over';
}
const labelsEl = $('#labels');
function floatText(u, text, cls = '') {
  const d = document.createElement('div'); d.className = 'ft ' + cls; d.textContent = text;
  d.style.left = (u.sx + rand(-12, 12)) + 'px'; d.style.top = (u.top + 6) + 'px';
  labelsEl.appendChild(d); setTimeout(() => d.remove(), 820);
}
function banner(text, cls = '') { const b = $('#banner'); b.className = 'o ' + cls; b.textContent = text; void b.offsetWidth; b.classList.add('show'); }

/* =========================================================
   ESTADO
   ========================================================= */
const G = { screen: 'load', state: 'idle', round: 0, score: { p: 0, e: 0 }, elixir: { p: 0, e: 0 }, lastLoser: null, shop: [], freeRoll: 1, speed: 1 };
let units = [], uid = 0;
const team = t => units.filter(u => u.team === t);
const unitAtHome = (c, r) => units.find(u => u.hc === c && u.hr === r);
const isZone = (tm, r) => tm === 'p' ? r <= 3 : r >= 4;

function makeLabel(u) {
  const d = document.createElement('div'); d.className = 'lbl ' + u.team;
  d.innerHTML = '<div class="st"></div><div class="hp"><b></b><i></i></div><div class="en"><i></i></div>';
  labelsEl.appendChild(d);
  const en = d.querySelector('.en'); if (u.def.abil !== 'super') en.style.visibility = 'hidden';
  return { el: d, st: d.querySelector('.st'), hp: d.querySelector('.hp i'), sh: d.querySelector('.hp b'), en: en.firstChild };
}
function createUnit(type, tm, c, r, level = 1) {
  const u = { id: ++uid, type, def: CHARS[type], team: tm, level, hc: c, hr: r, c, r, gx: c + .5, gy: r + .5, alive: true, hp: 1, maxHp: 1, atk: 1,
    energy: 0, shield: 0, cd: 0, move: null, lunge: 0, flash: 0, dying: 0, pop: 0.0001, face: 0, faceT: null, occKey: null, sx: 0, sy: 0, top: 0, dw: 40, lx: 0, ly: 0 };
  u.rig = createCharacter(type); B3.scene.add(u.rig.root);
  u.lbl = makeLabel(u); units.push(u); stats(u);
  burstAt(u.gx, u.gy, .2, '#ffffff', 10, { spd: 1.5, up: 1.6, size: .06 });
  return u;
}
function removeUnit(u) {
  u.lbl.el.remove(); B3.scene.remove(u.rig.root);
  for (const m of Object.values(u.rig.mats)) m.dispose();
  units = units.filter(v => v !== u);
}
function stats(u) {
  const m = LVL_MULT[u.level];
  u.maxHp = Math.round(u.def.hp * m); u.atk = Math.round(u.def.atk * m);
  u.range = u.def.range; u.as = u.def.as; u.ms = u.def.ms;
  if (G.state !== 'fight') u.hp = u.maxHp;
}

/* =========================================================
   ESCENARIO 3D DEL MENÚ Y DEL BESTIARIO
   ========================================================= */
const ST = {};
let VW = null;
function initStage() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.domElement.className = 'stage3d';
  const scene = new THREE.Scene(); setupScene(renderer, scene);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.ShadowMaterial({ opacity: 0.32 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50), rigs = {};
  for (const t of TYPES) { const pv = new THREE.Group(), rig = createCharacter(t); pv.add(rig.root); scene.add(pv); rigs[t] = { rig, pv, next: rand(1.5, 4) }; }
  Object.assign(ST, { renderer, scene, camera, rigs, w: 0, h: 0, mode: null });
}
const HOME_POS = { bolab: [-1.0, 0.1, 0.3], bushi: [0, 0.35, 0.2], ogul: [1.0, 0.1, -0.3] };
function stageMount(mode) {
  const box = mode === 'home' ? $('#homeStage') : $('#viewer');
  if (ST.renderer.domElement.parentNode !== box) box.insertBefore(ST.renderer.domElement, box.querySelector('.tip'));
  ST.mode = mode; ST.w = 0;
  for (const t of TYPES) {
    const { pv, rig } = ST.rigs[t]; rig.atkT = rig.supT = -1;
    if (mode === 'home') { pv.visible = true; pv.position.set(HOME_POS[t][0], 0, HOME_POS[t][1]); pv.rotation.set(0, HOME_POS[t][2], 0); }
    else { pv.visible = !!VW && VW.t === t; pv.position.set(0, 0, 0); }
  }
}
function stageRender(dt) {
  const { renderer, scene, camera, rigs } = ST, box = renderer.domElement.parentNode; if (!box) return;
  const w = box.clientWidth, h = box.clientHeight; if (!w || !h) return;
  if (w !== ST.w || h !== ST.h) { ST.w = w; ST.h = h; renderer.setSize(w, h, false); camera.aspect = w / h; }
  if (ST.mode === 'home') {
    const d = Math.max(4.6, 3.5 / (0.4618 * camera.aspect));
    camera.position.set(0, 1.5, d); camera.lookAt(0, 0.62, 0);
    for (const t of TYPES) {
      const r = rigs[t]; r.next -= dt;
      if (r.next <= 0) { r.rig.play(t === 'ogul' && Math.random() < .4 ? 'super' : 'attack'); r.next = rand(2.5, 5.5); }
      r.rig.update(dt);
    }
  } else if (VW) {
    const r = rigs[VW.t], p = VW.pitch * Math.PI / 180, dist = 4.7;
    camera.position.set(0, 0.68 + Math.sin(p) * dist, Math.cos(p) * dist); camera.lookAt(0, 0.68, 0);
    r.pv.rotation.set(0, VW.yaw * Math.PI / 180, 0);
    if (VW.anim === 'attack' || VW.anim === 'super') { VW.loop -= dt; if (VW.loop <= 0) { r.rig.play(VW.anim); VW.loop = 1.35; } }
    r.rig.update(dt, { moving: VW.anim === 'walk' });
  }
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
}

/* =========================================================
   NAVEGACIÓN ENTRE PANTALLAS
   ========================================================= */
function show(screen) {
  G.screen = screen;
  for (const id of ['home', 'bestiary', 'detail']) $('#' + id).classList.toggle('hide', id !== screen);
  const battle = screen === 'battle';
  $('#battleHud').classList.toggle('hide', !battle);
  $('#scene').style.visibility = labelsEl.style.visibility = battle ? 'visible' : 'hidden';
  if (screen !== 'detail') VW = null;
  if (screen === 'home' || screen === 'detail') stageMount(screen);
  if (battle) layout();
}
document.querySelectorAll('[data-back]').forEach(b => b.onclick = () => { sfx.click(); show(b.dataset.back); });
$('#goBattle').onclick = () => { initAudio(); sfx.click(); show('battle'); newMatch(); };
$('#goBestiary').onclick = () => { initAudio(); sfx.click(); renderBestiary(); show('bestiary'); };
$('#exit').onclick = () => { sfx.click(); stopMatch(); show('home'); };
$('#endMenu').onclick = () => { $('#end').classList.add('hide'); stopMatch(); show('home'); };
$('#again').onclick = () => { $('#end').classList.add('hide'); newMatch(); };
$('#mute').onclick = () => { muted = !muted; $('#mute').textContent = muted ? '🔇' : '🔊'; };

/* =========================================================
   BESTIARIO
   ========================================================= */
// Progreso del jugador (de momento: las tres criaturas desbloqueadas a nivel 1)
const COLLECTION = { bushi: { level: 1 }, bolab: { level: 1 }, ogul: { level: 1 } };
function renderBestiary() {
  $('#bcount').textContent = `${Object.keys(COLLECTION).length}/${TYPES.length}`;
  $('#bgrid').innerHTML = TYPES.map(t => {
    const ch = CHARS[t], own = COLLECTION[t];
    return `<div class="bcard" data-t="${t}" style="--fam:${ch.color}"><img src="${src(t, 'pose')}" alt="">${own ? `<div class="lv">Nv. ${own.level}</div>` : ''}<div class="band"><div class="nm">${ch.name}</div></div></div>`;
  }).join('');
  document.querySelectorAll('.bcard').forEach(el => el.onclick = () => { sfx.click(); openDetail(el.dataset.t); });
}
function setAnim(a) {
  if (!VW) return; VW.anim = a; VW.loop = 0;
  const rig = ST.rigs[VW.t].rig; rig.atkT = rig.supT = -1;
  document.querySelectorAll('#anims .btn').forEach(b => b.classList.toggle('on', b.dataset.a === a));
}
function openDetail(t) {
  const ch = CHARS[t], lvl = (COLLECTION[t] || { level: 1 }).level, m = LVL_MULT[lvl];
  $('#dName').textContent = ch.name; $('#dLevel').textContent = 'Nivel ' + lvl;
  const anims = [['idle', 'Reposo'], ['walk', 'Andar'], ['attack', 'Atacar']]; if (ch.abil === 'super') anims.push(['super', 'Súper']);
  $('#anims').innerHTML = anims.map(([a, n]) => `<button class="btn blue" data-a="${a}">${n}</button>`).join('');
  $('#views').innerHTML = ch.all.map(v => `<button data-v="${v}" title="${VIEW_NAMES[v]}"><img src="${src(t, v)}" alt="${VIEW_NAMES[v]}"></button>`).join('');
  $('#dInfo').innerHTML = `
    <div class="itags"><span style="background:${ch.color};color:#fff">${ch.role}</span><span>${ch.cost} de elíxir</span><span>${ch.range === 1 ? 'Cuerpo a cuerpo' : 'A distancia'}</span></div>
    <div class="istats"><div>Vida<b>${Math.round(ch.hp * m)}</b></div><div>Ataque<b>${Math.round(ch.atk * m)}</b></div><div>Alcance<b>${ch.range === 1 ? 'Melé' : ch.range}</b></div><div>Ritmo<b>${ch.as}s</b></div></div>
    <p class="idesc"><b>${ch.abilName}</b> · ${ch.desc}<br><em>Estadísticas y habilidad provisionales.</em></p>`;
  VW = { t, yaw: -20, pitch: 8, auto: true, vel: 0, goal: null, dragging: false, anim: 'idle', loop: 0 };
  show('detail'); setAnim('idle'); $('#detail').scrollTop = 0;
  document.querySelectorAll('#anims .btn').forEach(b => b.onclick = () => { sfx.click(); setAnim(b.dataset.a); });
  document.querySelectorAll('#views button').forEach(b => b.onclick = () => { const [y, p] = VIEW_ANGLES[b.dataset.v] || [0, 6]; VW.auto = false; VW.vel = 0; VW.goal = { yaw: y, pitch: p }; $('#detail').scrollTo({ top: 0, behavior: 'smooth' }); });
}
function viewerTick() {
  if (!VW) return;
  if (VW.goal) { VW.yaw += angDiff(VW.goal.yaw, VW.yaw) * .12; VW.pitch += (VW.goal.pitch - VW.pitch) * .12; if (Math.abs(angDiff(VW.goal.yaw, VW.yaw)) < .3 && Math.abs(VW.goal.pitch - VW.pitch) < .3) VW.goal = null; }
  else if (!VW.dragging) { VW.yaw += VW.auto ? -0.3 : VW.vel; VW.vel *= 0.94; }
}
(function viewerInput() {
  const box = $('#viewer'); let d = null;
  box.addEventListener('pointerdown', e => { if (!VW) return; d = { x: e.clientX, y: e.clientY }; Object.assign(VW, { auto: false, goal: null, dragging: true, vel: 0 }); box.setPointerCapture(e.pointerId); });
  box.addEventListener('pointermove', e => {
    if (!d || !VW) return;
    const dx = (e.clientX - d.x) * 0.6; VW.yaw += dx; VW.vel = dx;
    VW.pitch = clamp(VW.pitch + (e.clientY - d.y) * 0.4, -35, 75);
    d = { x: e.clientX, y: e.clientY };
  });
  const up = () => { d = null; if (VW) VW.dragging = false; };
  box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
})();

/* =========================================================
   TIENDA E INTERFAZ DE BATALLA
   ========================================================= */
const cards = [...document.querySelectorAll('.card')];
const bestUpgrade = (tm, type) => team(tm).filter(u => u.type === type && u.level < 3).sort((a, b) => b.level - a.level)[0];
const drawShop = () => [0, 1, 2].map(() => pick(TYPES));
function renderShop(fresh = false) {
  cards.forEach((el, i) => {
    const t = G.shop[i];
    if (!t) { el.className = 'card empty'; el.innerHTML = 'Comprado'; return; }
    const d = CHARS[t], ex = bestUpgrade('p', t);
    el.className = 'card' + (G.elixir.p < d.cost ? ' poor' : '') + (fresh ? ' fresh' : '');
    el.style.setProperty('--fam', d.color);
    el.innerHTML = `<img src="${src(t, 'front')}" alt=""><div class="cost">${d.cost}</div>${ex ? `<div class="up">★${ex.level + 1}</div>` : ''}<div class="inf">i</div><div class="band"><div class="nm">${d.name}</div><div class="role">${d.role}</div></div>`;
  });
}
function renderHud() {
  $('#elixirNum').textContent = G.elixir.p;
  $('#roundLbl').textContent = 'Ronda ' + Math.max(1, G.round);
  document.querySelectorAll('#pipsP i').forEach((p, i) => p.classList.toggle('on', i < G.score.p));
  document.querySelectorAll('#pipsE i').forEach((p, i) => p.classList.toggle('on', i < G.score.e));
  const plan = G.state === 'plan', rr = $('#reroll');
  rr.disabled = !plan || (!G.freeRoll && G.elixir.p < 1);
  rr.innerHTML = `↻<small>${G.freeRoll ? 'Gratis' : '1 elíxir'}</small>`;
  const rd = $('#ready');
  if (G.state === 'fight') { rd.disabled = false; rd.className = 'btn blue'; rd.textContent = `⏩ x${G.speed}`; }
  else { rd.disabled = !plan; rd.className = 'btn green'; rd.textContent = '¡A luchar!'; }
  renderShop();
}
const hint = t => { $('#hint').textContent = t; };
function bumpElixir(ok = true) { const e = $('#elixir'); e.className = ''; void e.offsetWidth; e.className = ok ? 'bump' : 'no'; }

function autoTile(tm, type) {
  const front = FRONT_ROLES.includes(CHARS[type].role);
  const rows = tm === 'p' ? (front ? [3, 2, 1, 0] : [0, 1, 2, 3]) : (front ? [4, 5, 6, 7] : [7, 6, 5, 4]);
  for (const r of rows) for (const c of (tm === 'p' ? [2, 1, 3, 0, 4] : shuffle([0, 1, 2, 3, 4]))) if (!unitAtHome(c, r)) return { c, r };
  return null;
}
function upgrade(u) {
  u.level++; stats(u); u.pop = 0.0001;
  burstAt(u.hc + .5, u.hr + .5, .6, '#ffd84a', 18, { spd: 1.4, up: 2.6, size: .07, glow: true });
  floatText(u, '★'.repeat(u.level), 'big');
}
function buy(i, tile = null) {
  if (G.state !== 'plan') return false;
  const type = G.shop[i]; if (!type) return false;
  const d = CHARS[type], n = team('p').length;
  const fail = m => { sfx.no(); hint(m); return false; };
  if (G.elixir.p < d.cost) { bumpElixir(false); return fail('No tienes suficiente elíxir'); }
  if (tile) {
    if (!isZone('p', tile.r)) return fail('Solo puedes colocar en tu mitad (abajo)');
    const o = unitAtHome(tile.c, tile.r);
    if (o) { if (o.type === type && o.level < 3) { upgrade(o); sfx.merge(); } else return fail(o.type === type ? 'Ya está al nivel máximo' : 'Casilla ocupada'); }
    else { if (n >= MAX_UNITS) return fail('Tablero lleno: mejora o vende criaturas'); createUnit(type, 'p', tile.c, tile.r); sfx.place(); }
  } else {
    const ex = bestUpgrade('p', type);
    if (ex) { upgrade(ex); sfx.merge(); }
    else { const t = n < MAX_UNITS && autoTile('p', type); if (!t) return fail('Tablero lleno: mejora o vende criaturas'); createUnit(type, 'p', t.c, t.r); sfx.place(); }
  }
  G.elixir.p -= d.cost; G.shop[i] = null; bumpElixir();
  hint('Arrastra tus criaturas para moverlas · tócalas para ver su ficha');
  renderHud(); return true;
}
function reroll() {
  if (G.state !== 'plan') return;
  if (!G.freeRoll) { if (G.elixir.p < 1) return; G.elixir.p -= 1; } else G.freeRoll = 0;
  G.shop = drawShop(); sfx.click(); renderHud(); renderShop(true);
}
function sell(u) {
  G.elixir.p = Math.min(ELIXIR_CAP, G.elixir.p + Math.max(1, u.def.cost * u.level - 1));
  burstAt(u.gx, u.gy, .3, '#c04dff', 14, { spd: 1.5, up: 2, glow: true });
  removeUnit(u); sfx.click(); bumpElixir(); closeInfo(); renderHud();
}
function openInfo(type, u = null) {
  const d = CHARS[type], lvl = u ? u.level : 1, m = LVL_MULT[lvl];
  let html = `<div class="ihead"><img src="${src(type, 'front')}" alt=""><div>
    <div class="iname">${d.name}</div>
    <div class="itags"><span style="background:${d.color};color:#fff">${d.role}</span><span>${d.cost} elíxir</span>${u ? `<span>${u.team === 'p' ? 'Tuyo' : 'Rival'}</span>` : ''}</div>
    <div class="istars">${'★'.repeat(lvl)}${'☆'.repeat(3 - lvl)}</div></div></div>
    <div class="istats"><div>Vida<b>${u ? u.maxHp : Math.round(d.hp * m)}</b></div><div>Ataque<b>${u ? u.atk : Math.round(d.atk * m)}</b></div><div>Alcance<b>${d.range === 1 ? 'Melé' : d.range}</b></div><div>Ritmo<b>${d.as}s</b></div></div>
    <p class="idesc"><b>${d.abilName}</b> · ${d.desc}</p><div class="ibtns">`;
  if (u && u.team === 'p' && G.state === 'plan') html += `<button class="btn red" id="iSell">Vender +${Math.max(1, d.cost * u.level - 1)}</button>`;
  html += '<button class="btn gray" id="iClose">Cerrar</button></div>';
  $('#sheet').innerHTML = html; $('#info').classList.remove('hide');
  $('#iClose').onclick = closeInfo; if ($('#iSell')) $('#iSell').onclick = () => sell(u);
}
function closeInfo() { $('#info').classList.add('hide'); }
$('#info').addEventListener('pointerdown', e => { if (e.target.id === 'info') closeInfo(); });

/* ---------- arrastrar y soltar ---------- */
function tileAt(x, y) {
  const [gx, gy] = screenToGrid(x, y), c = Math.floor(gx), r = Math.floor(gy);
  return c >= 0 && c < COLS && r >= 0 && r < ROWS ? { c, r } : null;
}
function unitAtScreen(x, y) {
  const hit = units.filter(u => u.alive && u.dying <= 0 && x > u.sx - u.dw / 2 && x < u.sx + u.dw / 2 && y > u.top && y < u.sy + 10).sort((a, b) => b.sy - a.sy)[0];
  if (hit) return hit;
  const t = tileAt(x, y); return t ? unitAtHome(t.c, t.r) : null;
}
let drag = null, hl = null;
const cardValid = type => (c, r) => { if (!isZone('p', r)) return false; const o = unitAtHome(c, r); return !o || (o.type === type && o.level < 3); };
cards.forEach((el, i) => el.addEventListener('pointerdown', e => {
  if (G.state !== 'plan' || !G.shop[i]) return;
  if (e.target.classList.contains('inf')) { openInfo(G.shop[i]); return; }
  drag = { kind: 'card', i, sx: e.clientX, sy: e.clientY, moved: false };
}));
canvas.addEventListener('pointerdown', e => {
  if (G.screen !== 'battle') return;
  const u = unitAtScreen(e.clientX, e.clientY); if (!u) return;
  if (G.state === 'plan' && u.team === 'p') drag = { kind: 'unit', u, sx: e.clientX, sy: e.clientY, moved: false };
  else openInfo(u.type, u);
});
addEventListener('pointermove', e => {
  if (!drag) return;
  if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 8) {
    drag.moved = true;
    if (drag.kind === 'card') { const g = $('#ghost'); g.src = src(G.shop[drag.i], 'front'); g.style.display = 'block'; }
    else drag.u.dragging = true;
  }
  if (!drag.moved) return;
  if (drag.kind === 'card') {
    $('#ghost').style.transform = `translate(${e.clientX - 45}px,${e.clientY - 80}px)`;
    hl = { fn: cardValid(G.shop[drag.i]), t: tileAt(e.clientX, e.clientY + 10) };
  } else {
    drag.u.dragG = screenToGrid(e.clientX, e.clientY + 26);
    hl = { fn: (c, r) => isZone('p', r), t: tileAt(e.clientX, e.clientY + 26) };
  }
});
addEventListener('pointerup', e => {
  if (!drag) return;
  const d = drag; drag = null; hl = null; $('#ghost').style.display = 'none';
  if (d.kind === 'card') { if (!d.moved) buy(d.i); else { const t = tileAt(e.clientX, e.clientY + 10); if (t) buy(d.i, t); } return; }
  d.u.dragging = false;
  if (!d.moved) { openInfo(d.u.type, d.u); return; }
  const t = tileAt(e.clientX, e.clientY + 26);
  if (!t || !isZone('p', t.r)) return;
  const o = unitAtHome(t.c, t.r); if (o === d.u) return;
  if (o) { o.hc = d.u.hc; o.hr = d.u.hr; o.c = o.hc; o.r = o.hr; }
  d.u.hc = d.u.c = t.c; d.u.hr = d.u.r = t.r; sfx.place();
});
addEventListener('pointercancel', () => { if (drag && drag.u) drag.u.dragging = false; drag = null; hl = null; $('#ghost').style.display = 'none'; });
$('#reroll').onclick = reroll;
$('#ready').onclick = () => {
  if (G.state === 'plan') startFight();
  else if (G.state === 'fight') { G.speed = G.speed === 1 ? 2 : G.speed === 2 ? 3 : 1; renderHud(); }
};

/* =========================================================
   IA DEL RIVAL
   ========================================================= */
function aiPlan() {
  let shop = drawShop(), free = 1;
  for (let guard = 0; guard < 14; guard++) {
    const opts = [];
    shop.forEach((t, i) => {
      if (!t) return; const d = CHARS[t]; if (d.cost > G.elixir.e) return;
      const ex = bestUpgrade('e', t);
      if (ex) opts.push({ i, kind: 'up', u: ex, cost: d.cost, score: 2.6 + ex.level * .4 + Math.random() });
      else if (team('e').length < MAX_UNITS && autoTile('e', t)) opts.push({ i, kind: 'new', type: t, cost: d.cost, score: 2.4 + Math.random() * 1.2 });
    });
    if (!opts.length) {
      if (free && G.elixir.e >= 2) { free = 0; shop = drawShop(); continue; }
      if (G.elixir.e >= 4 && Math.random() < .5) { G.elixir.e -= 1; shop = drawShop(); continue; }
      break;
    }
    opts.sort((a, b) => b.score - a.score);
    const o = opts[0]; G.elixir.e -= o.cost; shop[o.i] = null;
    if (o.kind === 'up') upgrade(o.u); else { const t = autoTile('e', o.type); createUnit(o.type, 'e', t.c, t.r); }
  }
}

/* =========================================================
   COMBATE
   ========================================================= */
let occ = new Map(), sim = { t: 0, events: [], proj: [] }, timers = [];
const later = (ms, fn) => timers.push(setTimeout(fn, ms));
function setOcc(u, c, r) { if (u.occKey && occ.get(u.occKey) === u) occ.delete(u.occKey); u.occKey = key(c, r); occ.set(u.occKey, u); }
const enemiesOf = u => units.filter(v => v.alive && v.team !== u.team);
const schedule = (delay, fn) => sim.events.push({ at: sim.t + delay, fn });

function startFight() {
  if (G.state !== 'plan') return;
  closeInfo(); G.state = 'prefight'; aiPlan(); renderHud();
  banner('¡A luchar!'); sfx.round(); hint('Combate automático: ¡mira cómo luchan tus criaturas!');
  later(1000, beginCombat);
}
function beginCombat() {
  occ.clear(); sim = { t: 0, events: [], proj: [] };
  for (const u of units) { Object.assign(u, { c: u.hc, r: u.hr, alive: true, hp: u.maxHp, energy: 0, shield: 0, move: null, faceT: null, cd: rand(.15, .5), occKey: null }); setOcc(u, u.c, u.r); }
  for (const u of units) if (u.type === 'bolab') { u.shield = Math.round(u.maxHp * .35); floatText(u, 'Coraza', 'sup'); burstAt(u.gx, u.gy, .4, '#ff8a2a', 12, { glow: true, spd: 1, up: 1.5 }); }
  G.state = 'fight'; renderHud();
}
const DIRS_P = [[0, 1], [-1, 1], [1, 1], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1]], DIRS_E = DIRS_P.map(([c, r]) => [c, -r]);
function nextStep(u) {
  const en = enemiesOf(u); if (!en.length) return null;
  const start = key(u.c, u.r), prev = new Map([[start, null]]), q = [[u.c, u.r]], dirs = u.team === 'p' ? DIRS_P : DIRS_E;
  for (let h = 0; h < q.length; h++) {
    const [c, r] = q[h], k = key(c, r);
    if (k !== start && en.some(v => Math.max(Math.abs(v.c - c), Math.abs(v.r - r)) <= u.range)) {
      let cur = k; while (prev.get(cur) !== start) cur = prev.get(cur);
      const [sc, sr] = cur.split(',').map(Number); return { c: sc, r: sr };
    }
    for (const [dc, dr] of dirs) {
      const nc = c + dc, nr = r + dr; if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
      const nk = key(nc, nr); if (prev.has(nk) || occ.has(nk)) continue; prev.set(nk, k); q.push([nc, nr]);
    }
  }
  return null;
}
function targetInRange(u) {
  if (u.faceT && u.faceT.alive && cheb(u, u.faceT) <= u.range) return u.faceT;
  let best = null, bd = 1e9;
  for (const v of enemiesOf(u)) { const d = cheb(u, v); if (d <= u.range && d * 1e4 + v.hp < bd) { bd = d * 1e4 + v.hp; best = v; } }
  return best;
}
function updateUnit(u, dt) {
  u.cd -= dt;
  if (u.move) { u.move.t += dt / u.ms; if (u.move.t >= 1) { u.c = u.move.c; u.r = u.move.r; u.move = null; } return; }
  const t = targetInRange(u);
  if (t) {
    u.faceT = t;
    if (u.cd <= 0) { u.cd = u.as; if (u.def.abil === 'super' && u.energy >= 100) { u.energy = 0; doSuper(u, t); } else attack(u, t); }
  } else {
    const s = nextStep(u);
    if (s) { setOcc(u, s.c, s.r); u.move = { fc: u.c, fr: u.r, c: s.c, r: s.r, t: 0 }; }
    const en = enemiesOf(u); if (en.length) u.faceT = en.reduce((a, b) => cheb(u, a) <= cheb(u, b) ? a : b);
  }
}
function shoot(u, t, o) { sim.proj.push({ gx: u.gx, gy: u.gy, t, tgx: t.gx, tgy: t.gy, p: 0, dur: Math.max(.2, Math.hypot(t.gx - u.gx, t.gy - u.gy) / (o.speed || 6)), ...o }); }
function updateProjectiles(dt) {
  for (const p of sim.proj) {
    p.p += dt / p.dur; if (p.t.alive) { p.tgx = p.t.gx; p.tgy = p.t.gy; }
    const k = Math.min(1, p.p); p.x = p.gx + (p.tgx - p.gx) * k; p.y = p.gy + (p.tgy - p.gy) * k; p.h = .75 + Math.sin(Math.PI * k) * (p.arc ?? .6);
    if (Math.random() < .7) burstAt(p.x, p.y, p.h, p.color, 1, { spd: .15, up: .1, life: .35, size: p.size * .7, g: 0, glow: true });
    if (p.p >= 1) { p.done = true; p.onHit(p); }
  }
  sim.proj = sim.proj.filter(p => !p.done);
}
function drawProjectiles() {
  fx.globalCompositeOperation = 'lighter';
  for (const p of sim.proj) {
    if (p.x == null) continue;
    const [x, y0] = gridToScreen(p.x, p.y), tw = tileW(p.y), y = y0 - p.h * tw * .72, r = p.size * tw;
    const g = fx.createRadialGradient(x, y, 0, x, y, r * 2.2); g.addColorStop(0, '#fff'); g.addColorStop(.35, p.color); g.addColorStop(1, 'rgba(0,0,0,0)');
    fx.fillStyle = g; fx.beginPath(); fx.arc(x, y, r * 2.2, 0, Math.PI * 2); fx.fill();
  }
  fx.globalCompositeOperation = 'source-over';
}
function attack(u, t) {
  if (u.def.abil === 'super') u.energy = Math.min(100, u.energy + 22);
  u.rig.play('attack');
  if (u.range <= 1) {
    u.lunge = .42;
    if (u.type === 'bushi') sfx.slash();
    schedule(.19, () => { if (u.alive) { damage(t, u.atk, u); sfx.hit(); burstAt(t.gx, t.gy, .5, u.type === 'bolab' ? '#ff8a2a' : '#5dffb0', 6, { glow: true, spd: 1.2 }); } });
  } else schedule(.17, () => { if (u.alive) { sfx.shoot(); shoot(u, t, { color: u.def.proj, size: .09, arc: .3, onHit: () => damage(t, u.atk, u) }); } });
}
function aoe(source, c, r, rad, dmg) {
  for (const v of units) if (v.alive && v.team !== source.team && Math.max(Math.abs(v.c - c), Math.abs(v.r - r)) <= rad) damage(v, dmg, source, 'big');
}
function doSuper(u, t) {
  floatText(u, '¡' + u.def.abilName + '!', 'sup'); sfx.super(); shake = Math.max(shake, 4); u.rig.play('super');
  if (u.type === 'bushi') {
    fxs.push({ gx: u.gx, gy: u.gy, r: 1.5, color: '#5dffb0', t: 0, dur: .6 });
    schedule(.3, () => { if (!u.alive) return; aoe(u, u.c, u.r, 1, u.atk * 1.7); burstAt(u.gx, u.gy, .4, '#5dffb0', 24, { spd: 3, up: .8, glow: true }); sfx.slash(); });
  } else if (u.type === 'ogul') {
    schedule(.26, () => u.alive && shoot(u, t, { color: '#ff4a6a', size: .2, speed: 4.5, arc: .9, onHit: p => {
      aoe(u, Math.floor(p.tgx), Math.floor(p.tgy), 1, u.atk * 2.3); fxs.push({ gx: p.tgx, gy: p.tgy, r: 1.3, color: '#ff9a3c', t: 0, dur: .5 });
      burstAt(p.tgx, p.tgy, .3, '#ff6a4a', 26, { spd: 3, up: 2.2, glow: true }); sfx.boom(); shake = Math.max(shake, 7);
    } }));
  }
}
function damage(t, amt, source, kind = '') {
  if (!t.alive) return;
  amt = Math.round(amt); let a = amt;
  if (t.shield > 0) { const s = Math.min(t.shield, a); t.shield -= s; a -= s; }
  t.hp -= a; if (t.def.abil === 'super') t.energy = Math.min(100, t.energy + 5);
  t.flash = .12; floatText(t, '-' + amt, kind || (t.team === 'p' ? 'e' : ''));
  if (t.hp <= 0) die(t);
}
function die(t) {
  t.alive = false; t.hp = 0; t.dying = .0001;
  if (occ.get(t.occKey) === t) occ.delete(t.occKey);
  burstAt(t.gx, t.gy, .5, '#ffffff', 16, { spd: 2, up: 2.2, size: .09 });
  burstAt(t.gx, t.gy, .5, t.team === 'p' ? '#3d8bfd' : '#ff4d5e', 8, { spd: 2, up: 2, glow: true });
  sfx.die();
}
function combatStep(dt) {
  sim.t += dt;
  const due = sim.events.filter(e => e.at <= sim.t); sim.events = sim.events.filter(e => e.at > sim.t); due.forEach(e => e.fn());
  for (const u of units) if (u.alive) updateUnit(u, dt);
  updateProjectiles(dt);
  const pA = units.some(u => u.team === 'p' && u.alive), eA = units.some(u => u.team === 'e' && u.alive);
  if (!pA || !eA || sim.t > ROUND_CAP) {
    let w; if (pA && !eA) w = 'p'; else if (eA && !pA) w = 'e';
    else { const f = tm => team(tm).reduce((s, u) => s + Math.max(0, u.hp), 0) / Math.max(1, team(tm).reduce((s, u) => s + u.maxHp, 0)); const a = f('p'), b = f('e'); w = a === b ? pick(['p', 'e']) : a > b ? 'p' : 'e'; }
    endRound(w);
  }
}
function endRound(w) {
  G.state = 'result'; G.score[w]++; G.lastLoser = w === 'p' ? 'e' : 'p'; sim.proj = []; sim.events = [];
  banner(w === 'p' ? '¡Ronda ganada!' : 'Ronda perdida', w === 'p' ? 'win' : 'lose'); (w === 'p' ? sfx.win : sfx.lose)();
  for (const u of units) { u.move = null; if (u.alive && u.team === w) u.cheer = 2; }
  hint(w === 'p' ? '¡Bien hecho! El perdedor recibe más elíxir: ¡prepárate!' : 'Recibes 9 de elíxir para remontar');
  renderHud();
  later(2300, () => { if (G.score[w] >= WIN_ROUNDS) return endMatch(w); resetBoard(); startRound(); });
}
function resetBoard() {
  for (const u of units) { Object.assign(u, { alive: true, c: u.hc, r: u.hr, gx: u.hc + .5, gy: u.hr + .5, move: null, dying: 0, shield: 0, energy: 0, lunge: 0, cheer: 0, faceT: null, face: 0, pop: .0001 }); u.rig.root.visible = true; stats(u); }
}
function startRound() {
  G.round++;
  for (const s of ['p', 'e']) G.elixir[s] = Math.min(ELIXIR_CAP, G.elixir[s] + (G.lastLoser === s ? 9 : 6));
  Object.assign(G, { shop: drawShop(), freeRoll: 1, state: 'plan', speed: 1 });
  banner('Ronda ' + G.round); sfx.round();
  hint(G.round === 1 ? 'Arrastra o toca una carta para colocar criaturas en tu mitad' : 'Mejora, coloca o ahorra: el elíxir sobrante se guarda');
  renderHud(); renderShop(true);
}
function endMatch(w) {
  G.state = 'end';
  $('#endTitle').textContent = w === 'p' ? '¡VICTORIA!' : 'DERROTA'; $('#endTitle').style.color = w === 'p' ? '#ffd84a' : '#ff9a9a';
  $('#endScore').textContent = `${G.score.p} - ${G.score.e}`; $('#end').classList.remove('hide');
}
function stopMatch() {
  timers.forEach(clearTimeout); timers = [];
  for (const u of [...units]) removeUnit(u);
  G.state = 'idle'; parts = []; fxs = []; sim.proj = []; closeInfo();
}
function newMatch() {
  stopMatch();
  Object.assign(G, { round: 0, score: { p: 0, e: 0 }, elixir: { p: 0, e: 0 }, lastLoser: null, speed: 1 });
  layout(); startRound();
}

/* =========================================================
   DIBUJO DE LA BATALLA
   ========================================================= */
function quad(c0, r0, c1, r1) {
  const p = [gridToScreen(c0, r0), gridToScreen(c1, r0), gridToScreen(c1, r1), gridToScreen(c0, r1)];
  ctx.beginPath(); ctx.moveTo(...p[0]); for (let i = 1; i < 4; i++) ctx.lineTo(...p[i]); ctx.closePath();
}
function drawBoard() {
  const g = ctx.createLinearGradient(0, 0, 0, Hs); g.addColorStop(0, '#0b2350'); g.addColorStop(1, '#393766');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hs);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(IMG.board, OX, OY, BOARD.w * S, BOARD.h * S);
  if (G.state === 'plan') {
    ctx.fillStyle = 'rgba(255,70,70,.16)'; quad(0, 4, COLS, ROWS); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.moveTo(...gridToScreen(0, 4)); ctx.lineTo(...gridToScreen(COLS, 4)); ctx.stroke(); ctx.setLineDash([]);
  }
  if (hl) for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
    const ok = hl.fn(c, r), hv = hl.t && hl.t.c === c && hl.t.r === r;
    if (!ok && !hv) continue;
    ctx.fillStyle = hv ? (ok ? 'rgba(255,255,180,.5)' : 'rgba(255,60,60,.45)') : 'rgba(255,255,255,.14)';
    quad(c + .04, r + .04, c + .96, r + .96); ctx.fill();
  }
  // aros de equipo bajo cada criatura
  for (const u of units) {
    if (u.dying > 0) continue;
    const [x, y] = gridToScreen(u.gx, u.gy), tw = tileW(u.gy);
    ctx.save(); ctx.strokeStyle = u.team === 'p' ? '#4aa0ff' : '#ff4d5e'; ctx.lineWidth = Math.max(2, tw * .06);
    ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 10; ctx.globalAlpha = .95;
    ctx.beginPath(); ctx.ellipse(x, y, tw * .42, tw * .29, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = .18; ctx.fillStyle = ctx.strokeStyle; ctx.fill(); ctx.restore();
  }
}
function updateUnitVisual(u, dt) {
  const fighting = G.state === 'fight' || G.state === 'result';
  let lift = 0;
  if (u.dragging && u.dragG) { u.gx += (u.dragG[0] - u.gx) * .5; u.gy += (u.dragG[1] - u.gy) * .5; lift = .4; }
  else if (u.move) {
    const t = Math.min(1, u.move.t), e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    u.gx = u.move.fc + .5 + (u.move.c - u.move.fc) * e; u.gy = u.move.fr + .5 + (u.move.r - u.move.fr) * e;
  } else if (u.dying <= 0) { const k = Math.min(1, dt * 14); u.gx += (u.c + .5 - u.gx) * k; u.gy += (u.r + .5 - u.gy) * k; }
  u.lx = u.ly = 0;
  if (u.lunge > 0) {
    u.lunge -= dt;
    if (u.faceT) { const k = Math.sin(clamp(1 - u.lunge / .42, 0, 1) * Math.PI) * .22, dx = u.faceT.gx - u.gx, dy = u.faceT.gy - u.gy, l = Math.hypot(dx, dy) || 1; u.lx = dx / l * k; u.ly = dy / l * k; }
  }
  if (u.cheer > 0) u.cheer -= dt;
  // orientación (0 = mirando a la cámara)
  let want = fighting ? u.face : 0;
  if (fighting && u.faceT) { const dx = u.faceT.gx - u.gx, dz = -(u.faceT.gy - u.gy); if (Math.hypot(dx, dz) > .05) want = Math.atan2(dx, dz) * 180 / Math.PI; }
  if (G.state === 'result' && u.cheer > 0) want = 0;
  u.face += angDiff(want, u.face) * Math.min(1, dt * 9);
  if (u.flash > 0) u.flash -= dt;
  let sc = LVL_SCALE[u.level];
  if (u.pop > 0) { u.pop += dt * 3; const p = Math.min(1, u.pop); sc *= 1 + Math.sin(p * Math.PI) * .3 - (p < .25 ? (1 - p * 4) * .5 : 0); if (u.pop >= 1) u.pop = 0; }
  let spin = 0;
  if (u.dying > 0) { u.dying += dt * 2.6; sc *= Math.max(0.001, 1 - u.dying); spin = u.dying * 6; if (u.dying >= 1) u.rig.root.visible = false; }
  const root = u.rig.root;
  root.position.set(u.gx + u.lx - 2.5, lift, 4 - (u.gy + u.ly));
  root.rotation.y = u.face * Math.PI / 180 + spin; root.scale.setScalar(sc);
  u.rig.flash(u.flash > 0 ? 1 : 0);
  u.rig.update(dt, { moving: !!u.move && !u.dragging, cheer: u.cheer > 0 && u.alive });
  const [sx, sy] = gridToScreen(u.gx, u.gy), tw = tileW(u.gy);
  u.sx = sx; u.sy = sy; u.dw = tw * .9; u.top = sy - (u.rig.height * LVL_SCALE[u.level] * .74 + lift) * tw;
}
function drawShields(time) {
  for (const u of units) {
    if (!(u.shield > 0 && u.alive)) continue;
    const r = (u.sy - u.top) * .62, cy = u.sy - r * .75;
    fx.save(); fx.globalCompositeOperation = 'lighter'; fx.globalAlpha = .3 + Math.sin(time * 6) * .07;
    const g = fx.createRadialGradient(u.sx, cy, r * .3, u.sx, cy, r);
    g.addColorStop(0, 'rgba(255,140,40,0)'); g.addColorStop(.8, 'rgba(255,150,50,.65)'); g.addColorStop(1, 'rgba(255,140,40,0)');
    fx.fillStyle = g; fx.beginPath(); fx.arc(u.sx, cy, r, 0, Math.PI * 2); fx.fill(); fx.restore();
  }
}
function updateLabels() {
  for (const u of units) {
    const L = u.lbl, vis = G.screen === 'battle' && u.dying <= 0 && !u.dragging;
    if (!vis) { if (L.vis !== false) { L.el.style.display = 'none'; L.vis = false; } continue; }
    if (L.vis !== true) { L.el.style.display = ''; L.vis = true; }
    L.el.style.transform = `translate(${u.sx}px,${u.top - 2}px) translate(-50%,-100%)`;
    const stars = '★'.repeat(u.level); if (L.stars !== stars) { L.st.textContent = stars; L.stars = stars; }
    L.hp.style.width = Math.max(0, u.hp / u.maxHp * 100) + '%';
    L.sh.style.width = Math.min(100, u.shield / u.maxHp * 100) + '%';
    L.en.style.width = u.energy + '%';
    L.el.classList.toggle('full', u.energy >= 100);
  }
}
let last = performance.now(), time = 0;
function loop(now) {
  const rdt = Math.min(.05, (now - last) / 1000); last = now; time += rdt;
  if (G.screen === 'battle') {
    const dt = rdt * (G.state === 'fight' ? G.speed : 1);
    if (G.state === 'fight') { let left = dt; while (left > 0 && G.state === 'fight') { const s = Math.min(.03, left); combatStep(s); left -= s; } }
    for (const u of units) updateUnitVisual(u, dt);
    updateParts(dt);
    if (shake > .2) { $('#scene').style.transform = `translate(${rand(-1, 1) * shake}px,${rand(-1, 1) * shake}px)`; shake *= Math.pow(.02, rdt); }
    else if (shake) { shake = 0; $('#scene').style.transform = ''; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); drawBoard();
    B3.renderer.render(B3.scene, B3.camera);
    fx.setTransform(dpr, 0, 0, dpr, 0, 0); fx.clearRect(0, 0, W, Hs);
    drawShields(time); drawProjectiles(); drawParts();
    updateLabels();
  } else if (G.screen === 'home' || G.screen === 'detail') { viewerTick(); stageRender(rdt); }
  requestAnimationFrame(loop);
}
addEventListener('resize', () => { if (G.screen === 'battle') layout(); });

load(BOARD.src).then(i => {
  IMG.board = i; initBattle3D(); initStage();
  $('#loading').classList.add('hide'); show('home'); requestAnimationFrame(loop);
}).catch(e => { $('#loading').textContent = 'Error al cargar: ' + e; console.error(e); });

// gancho para pruebas automáticas
window.__game = { G, units: () => units, buy, reroll, startFight, setSpeed: s => { G.speed = s; }, openDetail, setAnim };
