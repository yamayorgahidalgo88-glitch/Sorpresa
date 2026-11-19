import { createCharacter, setupScene, THREE } from './models.js';
import { abrirSobre, cerrarSobre, precargarSobre } from './sobre.js';

/* =========================================================
   DATOS
   ========================================================= */
// Estadísticas y habilidades PROVISIONALES: las definirá el diseñador.
const CHARS = {
  bushi: { name: 'Bushi', cost: 3, role: 'Luchador', color: '#2fbf86', hp: 560, atk: 55, range: 1, as: 1.0, ms: 0.6, abil: 'super', charge: 5,
    atkName: 'Tajo', atkDesc: 'golpea con su espada al enemigo de la casilla de al lado. Daño medio.',
    abilName: 'Giro de jade', desc: 'Súper (se carga con 5 básicos): gira con su espada y golpea a todos los rivales en un círculo de 1 casilla de radio. Daño medio-alto.',
    lv: ['Desbloquea el súper: Giro de jade.', 'El Giro de jade también cura un 15% de la vida a los aliados que estén en su radio.', 'Al empezar cada ronda lanza un corte de 3 casillas de ancho que avanza 2 casillas. Daño medio-alto.'],
    all: ['pose', 'front', 'q', 'bq', 'back', 'top', 'bottom'] },
  bolab: { name: 'Bolab', cost: 2, role: 'Tanque', color: '#f08a2c', hp: 850, atk: 40, range: 1, as: 0.8, ms: 0.92, abil: 'clash', melee: true,
    atkName: 'Cabezazo', atkDesc: 'golpea con la cabeza al enemigo de la casilla de al lado. Daño bajo-medio.',
    abilName: 'Placaje', desc: 'No tiene súper. Al empezar cada ronda embiste 3 casillas hacia delante y vuelve, arrastrando a los rivales que golpea hasta el final del placaje.',
    lv: ['Placaje: al empezar la ronda embiste 3 casillas en vertical, ida y vuelta. Empuja a los rivales golpeados hasta el final. Daño bajo.', 'El básico pasa a ser un lengüetazo: 2 casillas de alcance y daño medio.', 'Empieza cada ronda con un escudo del 10% de su vida.'],
    all: ['pose', 'front', 'q', 'side', 'back', 'top', 'fronttop', 'bottom'] },
  ogul: { name: 'Ogul', cost: 4, role: 'Mago', color: '#8b4fd8', hp: 380, atk: 55, range: 3, as: 1.2, ms: 0.8, abil: 'super', charge: 5,
    atkName: 'Rayo ocular', atkDesc: 'dispara un rayo láser con el ojo a 3 casillas. Daño medio.',
    abilName: 'Bola láser', desc: 'Súper (se carga con 5 básicos que impacten): dispara una bola láser que explota en un radio de 2 casillas. Daño medio.',
    lv: ['Desbloquea el súper: bola láser que explota en un radio de 2 casillas.', 'El rayo básico atraviesa a los rivales y puede golpear a varios a la vez.', 'La explosión deja 3 segundos una superficie de fuego que hace daño bajo-medio a los rivales que estén encima.'],
    all: ['pose', 'front', 'q', 'side', 'back', 'top', 'top2', 'frontbottom'] },
  rogue: { name: 'Rogue', cost: 3, role: 'Defensor', color: '#3a5fa8', hp: 650, atk: 55, range: 1, as: 0.75, ms: 0.7, abil: 'super', charge: 4, charge3: 3,
    atkName: 'Puñetazo', atkDesc: 'golpea al enemigo de la casilla de al lado. Daño medio.',
    abilName: 'Ráfaga de puños', desc: 'Súper (se carga con 4 golpes): lanza puñetazos a bocajarro sobre las 3 casillas en horizontal que tiene delante. Daño medio-alto.',
    lv: ['Desbloquea el súper: ráfaga de puñetazos sobre las 3 casillas de delante.', 'Al empezar cada ronda gana un escudo del 10% de su vida.', 'Cada súper le da un escudo del 25% de su vida actual, y se carga con 3 golpes.'],
    all: ['pose', 'front', 'side', 'bq', 'back', 'top', 'bottom'] },
  osko: { name: 'Wyrex', cost: 3, role: 'Invocador', color: '#2fc592', hp: 480, atk: 30, range: 2, ortho: true, as: 0.9, ms: 0.7, abil: 'super', charge: 4, charge2: 3, sheet: true,
    atkName: 'Bumerán óseo', atkDesc: 'lanza un hueso en línea recta (nunca en diagonal) que atraviesa a los rivales, llega a 2 casillas y vuelve. Daño bajo. No vuelve a lanzar hasta que el hueso regresa.',
    abilName: 'Reno fantasma', desc: 'Súper (se carga con 4 impactos del hueso): invoca un reno fantasma que pelea a cabezazos. El reno tiene muy poca vida, pero golpea cada 0,4 segundos.',
    lv: ['Desbloquea el súper: invoca un reno fantasma. Se carga con 4 impactos.', 'El súper se carga con 3 impactos.', 'El súper invoca 2 renos.'],
    all: ['pose', 'front', 'back', 'left', 'right', 'iso', 'top', 'bottom'] },
  gloop: { name: 'Aly', cost: 4, role: 'Asesino', color: '#7fbf1f', hp: 650, atk: 55, range: 1, as: 1.0, ms: 0.65, abil: 'super', charge: 5, sheet: true,
    atkName: 'Puñetazo radiactivo', atkDesc: 'golpea al enemigo de la casilla de al lado. Daño medio.',
    abilName: 'Portal radiactivo', desc: 'Súper (se carga con 5 básicos): teletransporta a su lado al rival con menos vida y le asesta un puñetazo radiactivo de daño medio-alto.',
    lv: ['Desbloquea el súper: trae a su lado al rival con menos vida y le da un puñetazo de daño medio-alto.', 'Los básicos pasan a hacer daño medio-alto.', 'El portal quita además un 10% de la vida del rival antes del golpe.'],
    all: ['pose', 'front', 'back', 'left', 'right', 'iso', 'top', 'bottom'] },
  tanko: { name: 'Mory', cost: 4, role: 'Artillero', color: '#7d86c8', hp: 850, atk: 100, range: 4, fwd: true, as: 1.25, ms: 0.9, abil: 'clash', sheet: true,
    atkName: 'Cañonazo', atkDesc: 'dispara una bala de cañón hacia delante, hasta 4 casillas. Daño alto. No atraviesa.',
    abilName: 'Cubo de hielo', desc: 'No tiene súper. Al empezar cada ronda lanza un cubo de hielo hacia delante que avanza hasta dar a alguien o salir del tablero, y ralentiza 2 segundos al enemigo golpeado. Daño muy bajo.',
    lv: ['Cubo de hielo al empezar la ronda: ralentiza 2 segundos al enemigo que golpee.', 'El cubo congela 1 segundo y después ralentiza 2 segundos.', 'El hielo también ralentiza 2 segundos a los enemigos cercanos (sin daño).'],
    all: ['pose', 'front', 'back', 'left', 'right', 'iso', 'top', 'bottom'] },
  denton: { name: 'Lodon', cost: 3, role: 'Tanque', color: '#4a62c0', hp: 850, atk: 45, range: 1, as: 1.0, ms: 0.75, abil: 'clash', sheet: true,
    atkName: 'Mordisco', atkDesc: 'muerde al enemigo de la casilla de al lado. Daño medio-bajo.',
    abilName: 'Tiburón de cuerda', desc: 'No tiene súper. Al empezar cada ronda lanza un tiburón de cuerda 2 casillas en línea recta: al que golpea lo hace retroceder 2 casillas (1 si hay alguien detrás, ninguna si tampoco puede).',
    lv: ['Tiburón de cuerda al empezar la ronda: empuja 2 casillas al rival golpeado. Sin daño.', 'El tiburón hace daño medio-bajo.', 'El tiburón hace daño medio-alto y paraliza 1 segundo.'],
    all: ['pose', 'front', 'back', 'left', 'right', 'iso', 'top', 'bottom'] },
  pomona: { name: 'Pomona', cost: 3, role: 'Protectora', color: '#e0a83a', hp: 560, atk: 45, range: 2, as: 0.5, ms: 0.8, abil: 'super', charge: 7, charge3: 5, sheet: true,
    atkName: 'Manzana pétrea', atkDesc: 'lanza una manzana de piedra a 2 casillas. Daño medio-bajo. No atraviesa.',
    abilName: 'Escudo del Jardín', desc: 'Súper (se carga con 7 golpes): se vuelve invencible 1 segundo, pero no puede moverse mientras dura.',
    lv: ['Desbloquea el súper: invencible 1 segundo, sin poder moverse.', 'El súper también protege a los aliados de alrededor.', 'El súper protege a TODOS los aliados y se carga con 5 golpes.'],
    all: ['pose', 'front', 'back', 'left', 'right', 'iso', 'top', 'bottom'] },
  jess: { name: 'Jess', cost: 3, role: 'Pistolera', color: '#3fc7c9', hp: 560, atk: 55, range: 1, cone: true, as: 1.3, ms: 0.7, abil: 'clash', sheet: true,
    atkName: 'Disparo de perdigones', atkDesc: 'dispara con su trabuco una ráfaga que cubre la fila de delante: 3 casillas de ancho y 1 de fondo. Golpea a todos los rivales de esa zona. Daño medio.',
    abilName: 'Furia fantasma', desc: 'No tiene súper. Cada vez que cae un aliado, entra en furia y el daño de su básico sube un 10%. La furia se reinicia en cada ronda.',
    lv: ['Furia fantasma: +10% de daño del básico por cada aliado derrotado en la ronda.', 'El disparo llega a 2 casillas de fondo.', 'La furia sube un 15% por cada aliado derrotado.'],
    all: ['pose', 'front', 'back', 'left', 'right', 'iso', 'top', 'bottom'] },
  sevora: { name: 'Sevora', cost: 5, role: 'Imitadora', color: '#8fd23a', hp: 560, atk: 55, range: 2, as: 0.9, ms: 0.75, abil: 'super', charge: 6, sheet: true,
    atkName: 'Mordida de raíz', atkDesc: 'la planta carnívora de su brazo se estira con su raíz y muerde a 2 casillas. Daño medio.',
    abilName: 'Mordida radiante', desc: 'Súper (se carga con 6 básicos): sus raíces brillan en verde hasta su siguiente mordisco. Al rival que muerda le copia el súper, un 5% más fuerte, y lo lanza en cuanto vuelve la planta.',
    lv: ['Desbloquea el súper: copia el súper del rival que muerda, un 5% más fuerte.', 'El básico y el súper llegan a 4 casillas.', 'El súper copiado es un 10% más fuerte.'],
    all: ['pose', 'front', 'back', 'left', 'right', 'iso', 'top', 'bottom'] },
};
const SUMMONS = {
  reno: { name: 'Reno fantasma', cost: 0, role: 'Invocación', color: '#5dffb8', hp: 120, atk: 45, range: 1, as: 0.4, ms: 0.42, abil: 'none' },
};
const PROJ = {
  osko: { kind: 'bone', color: '#5dffb8', size: .1, arc: .25, speed: 6, back: true },
  tanko: { kind: 'ball', color: '#ffb347', size: .09, arc: .5, speed: 7 },
  denton: { kind: 'shark', color: '#6fe8ff', size: .12, arc: .02, speed: 4.5 },
  pomona: { kind: 'apple', color: '#ffc54a', size: .1, arc: .45, speed: 6.5 },
};
const HIT_COLOR = { bolab: '#ff8a2a', rogue: '#45f5cf', gloop: '#b6ff2e', bushi: '#5dffb0' };
const VIEW_NAMES = { pose: 'Pose', left: 'Lateral izquierda', right: 'Lateral derecha', iso: 'Isométrica', front: 'Frente', q: '3/4', bq: '3/4 espalda', side: 'Perfil', back: 'Espalda', top: 'Arriba', top2: 'Arriba 2', bottom: 'Abajo', fronttop: 'Abajo frente', frontbottom: 'Abajo frente' };
const VIEW_ANGLES = { pose: [-25, 12], left: [-90, 6], right: [90, 6], iso: [-35, 30], front: [0, 6], q: [-45, 6], bq: [-135, 6], side: [-90, 6], back: [180, 6], top: [0, 70], top2: [180, 70], bottom: [0, -35], fronttop: [0, -30], frontbottom: [0, -30] };
const TYPES = Object.keys(CHARS);
const COLS = 5, ROWS = 8, MAX_UNITS = 7, WIN_ROUNDS = 3, ROUND_CAP = 60, ELIXIR_CAP = 20;
// ritmo de combate: todas las recargas x1,5 y los pasos x1,35 (mismas proporciones entre personajes)
const PACE = 1.5, MOVE_PACE = 1.35;
const LVL_MULT = [0, 1, 1.3, 1.6], LVL_SCALE = [0, 0.84, 0.95, 1.07];
const FRONT_ROLES = ['Tanque', 'Luchador', 'Defensor', 'Asesino', 'Pistolera'];
const rangeOf = (type, L) => { const d = CHARS[type] || SUMMONS[type]; return d.range + (L >= 2 && (type === 'bolab' || type === 'jess') ? 1 : 0) + (L >= 2 && type === 'sevora' ? 2 : 0); };
const rangeTxt = (d, r) => d.cone ? `3×${r}` : r === 1 ? 'Melé' : r;
const rangeTag = (d, r) => d.cone ? 'Corta distancia' : r === 1 ? 'Cuerpo a cuerpo' : 'A distancia';
const paceTxt = d => +(d.as * PACE).toFixed(2) + 's';
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
  const u = { id: ++uid, type, def: CHARS[type] || SUMMONS[type], team: tm, level, hc: c, hr: r, c, r, gx: c + .5, gy: r + .5, alive: true, hp: 1, maxHp: 1, atk: 1,
    energy: 0, shield: 0, domeT: 0, domeAmt: 0, stun: 0, cd: 0, move: null, lunge: 0, flash: 0, dying: 0, pop: 0.0001, face: 0, faceT: null, occKey: null, sx: 0, sy: 0, top: 0, dw: 40, lx: 0, ly: 0 };
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
  u.range = rangeOf(u.type, u.level); u.as = u.def.as * PACE; u.ms = u.def.ms * MOVE_PACE;
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
const HOME_POS = { tanko: [-2.0, -1.2, 0.35], ogul: [-1.2, -1.2, 0.2], jess: [-0.4, -1.2, 0.07], denton: [0.4, -1.2, -0.07], sevora: [1.2, -1.2, -0.2], osko: [2.0, -1.2, -0.35], bolab: [-1.75, 0.35, 0.35], bushi: [-0.95, 0.5, 0.15], pomona: [0, 0.75, 0], rogue: [0.95, 0.5, -0.15], gloop: [1.75, 0.35, -0.35] };
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
    const d = Math.max(5.6, 4.9 / (0.4618 * camera.aspect));
    camera.position.set(0, 3.9, d * 0.92); camera.lookAt(0, 0.55, -0.35);
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
  for (const id of ['home', 'bestiary', 'detail', 'decks', 'prebattle']) $('#' + id).classList.toggle('hide', id !== screen);
  const battle = screen === 'battle';
  $('#battleHud').classList.toggle('hide', !battle);
  $('#scene').style.visibility = labelsEl.style.visibility = battle ? 'visible' : 'hidden';
  if (screen !== 'detail') VW = null;
  if (screen === 'detail') stageMount(screen);
  if (battle) layout();
  if (screen === 'home') { renderWallet(); renderHomeDeck(); setTimeout(openPendingPacks, 350); }
}
document.querySelectorAll('[data-back]').forEach(b => b.onclick = () => { sfx.click(); show(b.dataset.back); });
$('#goBattle').onclick = () => { initAudio(); sfx.click(); openPrebattle(); };
$('#goDecks').onclick = () => { initAudio(); sfx.click(); openDecks('home'); };
$('#pbDecks').onclick = () => { sfx.click(); openDecks('prebattle'); };
$('#pbGo').onclick = () => { if (!deckTypes().length) return sfx.no(); sfx.click(); show('battle'); newMatch(); };
$('#dkBack').onclick = () => { sfx.click(); decksReturn === 'prebattle' ? openPrebattle() : show('home'); };
$('#goBestiary').onclick = () => { initAudio(); sfx.click(); renderBestiary(); show('bestiary'); };
$('#exit').onclick = () => { sfx.click(); stopMatch(); show('home'); };
$('#endMenu').onclick = () => { $('#end').classList.add('hide'); stopMatch(); show('home'); };
$('#again').onclick = () => { $('#end').classList.add('hide'); newMatch(); };
$('#mute').onclick = () => { muted = !muted; $('#mute').textContent = muted ? '🔇' : '🔊'; };

/* =========================================================
   BESTIARIO
   ========================================================= */
/* =========================================================
   PROGRESO DEL JUGADOR (se guarda en el móvil con localStorage)
   ========================================================= */
// Criaturas con las que se empieza. El resto se consiguen en sobres.
const STARTER = ['bolab', 'bushi', 'rogue', 'ogul', 'jess', 'sevora'];
// desbloqueados para todos, también en partidas guardadas de antes
const ALWAYS_UNLOCKED = ['jess', 'sevora'];
// Coste PROVISIONAL para subir de nivel en el bestiario: [nivel destino] = { cartas, monedas }
const LEVEL_COST = { 2: { cards: 10, coins: 100 }, 3: { cards: 25, coins: 300 } };
const MAX_LEVEL = 3;
// Contenido de los sobres. PROBABILIDADES PROVISIONALES (pendientes de definir).
const PACK = {
  odds: { nuevo: 20, cartas: 45, monedas: 35 },   // en %, se normalizan
  cards: [3, 8],                                  // cartas de un personaje que ya tienes (mín, máx)
  coins: [40, 120],                               // monedas (mín, máx)
};
const SAVE_KEY = 'bdb_progreso_v1';
const PROG = (() => {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.chars) return s; } catch (e) { }
  return { coins: 0, packs: 0, chars: Object.fromEntries(STARTER.map(t => [t, { level: 1, cards: 0 }])) };
})();
for (const k in PROG.chars) if (!CHARS[k]) delete PROG.chars[k];
for (const t of ALWAYS_UNLOCKED) if (!PROG.chars[t]) PROG.chars[t] = { level: 1, cards: 0 };
const COLLECTION = PROG.chars;
// MAZOS: 5 mazos de hasta 6 bestias; el seleccionado es el que se usa en batalla
const DECK_COUNT = 5, DECK_MAX = 6;
if (!Array.isArray(PROG.decks)) PROG.decks = [Object.keys(PROG.chars).slice(0, DECK_MAX)];
while (PROG.decks.length < DECK_COUNT) PROG.decks.push([]);
PROG.decks = PROG.decks.slice(0, DECK_COUNT).map(d => [...new Set(d)].filter(t => PROG.chars[t]).slice(0, DECK_MAX));
if (!(PROG.deck >= 0 && PROG.deck < DECK_COUNT)) PROG.deck = 0;
const owns = t => !!COLLECTION[t];
function saveProg() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(PROG)); } catch (e) { } renderWallet(); }
const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
function renderWallet() { const w = $('#coinNum'); if (w) w.textContent = PROG.coins; }

function rollPack() {
  const locked = TYPES.filter(t => !owns(t)), owned = TYPES.filter(owns);
  const odds = { ...PACK.odds }; if (!locked.length) odds.nuevo = 0;
  let r = Math.random() * Object.values(odds).reduce((a, b) => a + b, 0), kind = 'monedas';
  for (const [k, v] of Object.entries(odds)) { if ((r -= v) < 0) { kind = k; break; } }
  let res;
  if (kind === 'nuevo') { const t = pick(locked); COLLECTION[t] = { level: 1, cards: 0 }; res = { kind, t }; }
  else if (kind === 'cartas') { const t = pick(owned), n = randInt(...PACK.cards); COLLECTION[t].cards += n; res = { kind, t, n }; }
  else { const n = randInt(...PACK.coins); PROG.coins += n; res = { kind, n }; }
  PROG.packs = Math.max(0, PROG.packs - 1);
  saveProg();
  return res;
}
function cardBar(t) {
  const c = COLLECTION[t], next = LEVEL_COST[c.level + 1];
  if (!next) return `<div class="cbar max"><i style="width:100%"></i><span>Nivel máx.</span></div>`;
  const ok = c.cards >= next.cards;
  return `<div class="cbar${ok ? ' ok' : ''}"><i style="width:${Math.min(100, c.cards / next.cards * 100)}%"></i><span>${c.cards}/${next.cards}</span></div>`;
}

/* ---------- Sobres pendientes: se abren al volver al inicio ---------- */
let packBusy = false;
async function openPendingPacks() {
  if (packBusy || !PROG.packs || G.screen !== 'home') return;
  packBusy = true;
  try {
    while (PROG.packs > 0 && G.screen === 'home') {
      await abrirSobre();
      const res = rollPack();
      await showReward(res);
      cerrarSobre();
      await new Promise(r => setTimeout(r, 500));
    }
  } finally { packBusy = false; }
}
function showReward(res) {
  return new Promise(done => {
    const el = document.createElement('div');
    el.id = 'reward';
    let art, title, sub, extra = '';
    if (res.kind === 'monedas') {
      art = `<div class="rw-coin"><img src="assets/moneda.svg" alt=""></div>`;
      title = `+${res.n} monedas`; sub = `Ahora tienes ${PROG.coins}`;
    } else {
      const ch = CHARS[res.t];
      art = `<div class="bcard rw-card" style="--fam:${ch.color}"><img src="${src(res.t, 'pose')}" alt=""><div class="band"><div class="nm">${ch.name}</div></div>${res.kind === 'cartas' ? `<div class="rw-x o">x${res.n}</div>` : ''}</div>`;
      if (res.kind === 'nuevo') { title = '¡Nuevo personaje!'; sub = `${ch.name} se une a tu bestiario`; }
      else { title = `+${res.n} cartas`; sub = `de ${ch.name}`; extra = cardBar(res.t); }
    }
    el.innerHTML = `<div class="rw-rays"></div><div class="rw-in">${res.kind === 'nuevo' ? '<div class="rw-tag o">NUEVO</div>' : ''}${art}
      <h2 class="o">${title}</h2><p>${sub}</p>${extra}<button class="btn green" id="rwOk">¡Genial!</button></div>`;
    document.body.appendChild(el);
    sfx.merge();
    el.querySelector('#rwOk').onclick = () => { sfx.click(); el.classList.add('out'); setTimeout(() => el.remove(), 350); done(); };
  });
}
/* =========================================================
   MAZOS Y PANTALLA PREVIA A LA BATALLA
   ========================================================= */
const deckTypes = () => PROG.decks[PROG.deck].filter(owns);
let editDeck = 0, decksReturn = 'home';
function miniCard(t, extra = '') {
  const ch = CHARS[t], c = COLLECTION[t];
  return `<div class="dcard" data-t="${t}" style="--fam:${ch.color}"><img src="${src(t, 'pose')}" alt=""><div class="dcost">${ch.cost}</div><div class="dlv">Nv.${c ? c.level : 1}</div><div class="band"><div class="nm">${ch.name}</div></div>${extra}</div>`;
}
function slotsHtml(deck) {
  return Array.from({ length: DECK_MAX }, (_, i) => deck[i] ? miniCard(deck[i]) : '<div class="dslot"><span>+</span></div>').join('');
}
function deckInfo(deck) {
  if (!deck.length) return 'Mazo vacío';
  const avg = deck.reduce((a, t) => a + CHARS[t].cost, 0) / deck.length;
  return `${deck.length}/${DECK_MAX} · Coste medio <b>${avg.toFixed(1).replace('.', ',')}</b>`;
}
function openDecks(from) {
  decksReturn = from; editDeck = PROG.deck; renderDecks(); show('decks'); $('#decks').scrollTop = 0;
}
function renderDecks() {
  const deck = PROG.decks[editDeck];
  $('#dkCount').textContent = `Mazo ${PROG.deck + 1} en uso`;
  $('#dtabs').innerHTML = PROG.decks.map((d, i) => `<button class="dtab${i === editDeck ? ' on' : ''}${i === PROG.deck ? ' sel' : ''}" data-i="${i}">${i + 1}${i === PROG.deck ? '<i>✓</i>' : ''}</button>`).join('');
  $('#dslots').innerHTML = slotsHtml(deck);
  $('#dkInfo').innerHTML = deckInfo(deck);
  const sb = $('#dkSelect'), isSel = editDeck === PROG.deck;
  sb.textContent = isSel ? '✓ Seleccionado' : 'Seleccionar'; sb.disabled = isSel || !deck.length;
  sb.className = 'btn ' + (isSel ? 'gold' : 'green');
  $('#dcoll').innerHTML = TYPES.filter(owns).map(t => miniCard(t, deck.includes(t) ? '<div class="inDeck o">✓</div>' : '')).join('');
  document.querySelectorAll('#dcoll .dcard').forEach(el => { if (deck.includes(el.dataset.t)) el.classList.add('used'); });
  document.querySelectorAll('.dtab').forEach(b => b.onclick = () => { sfx.click(); editDeck = +b.dataset.i; renderDecks(); });
  document.querySelectorAll('#dslots .dcard').forEach(el => el.onclick = () => {
    sfx.click(); deck.splice(deck.indexOf(el.dataset.t), 1); saveProg(); renderDecks();
  });
  document.querySelectorAll('#dcoll .dcard').forEach(el => el.onclick = () => {
    const tp = el.dataset.t;
    if (deck.includes(tp)) { deck.splice(deck.indexOf(tp), 1); sfx.click(); }
    else if (deck.length >= DECK_MAX) { sfx.no(); $('#dkInfo').innerHTML = '<span class="warn">¡Mazo lleno! Quita una bestia primero</span>'; return; }
    else { deck.push(tp); sfx.place(); }
    saveProg(); renderDecks();
  });
}
$('#dkSelect').onclick = () => {
  if (!PROG.decks[editDeck].length) return sfx.no();
  PROG.deck = editDeck; saveProg(); sfx.merge(); renderDecks();
};
function openPrebattle() {
  const deck = PROG.decks[PROG.deck];
  $('#pbName').textContent = `Mazo ${PROG.deck + 1}`;
  $('#pbSlots').innerHTML = slotsHtml(deck);
  $('#pbNote').innerHTML = deck.length ? deckInfo(deck) : '<span class="warn">Tu mazo está vacío: añade bestias en Mazos</span>';
  $('#pbGo').disabled = !deck.length;
  show('prebattle');
}
(function embers() {
  const box = $('#embers'); if (!box) return;
  box.innerHTML = Array.from({ length: 18 }, () => {
    const s = 3 + Math.random() * 6;
    return `<i style="left:${Math.random() * 100}%;width:${s}px;height:${s}px;animation-duration:${7 + Math.random() * 7}s;animation-delay:${-Math.random() * 14}s;--dx:${(Math.random() - .5) * 80}px"></i>`;
  }).join('');
})();
function renderHomeDeck() {
  const n = PROG.decks[PROG.deck].length;
  $('#homeDeck').innerHTML = `<span>🃏 Mazo ${PROG.deck + 1}</span><b>${n}/${DECK_MAX} bestias</b>`;
}

function renderBestiary() {
  $('#bcount').textContent = `${TYPES.filter(owns).length}/${TYPES.length}`;
  $('#bgrid').innerHTML = TYPES.map(t => {
    const ch = CHARS[t], own = COLLECTION[t];
    return `<div class="bcard${own ? '' : ' locked'}" data-t="${t}" style="--fam:${own ? ch.color : '#55536e'}"><img src="${src(t, 'pose')}" alt="">${own ? `<div class="lv">Nv. ${own.level}</div>${cardBar(t)}` : '<div class="lock o">🔒</div>'}<div class="band"><div class="nm">${own ? ch.name : '???'}</div></div></div>`;
  }).join('');
  document.querySelectorAll('.bcard').forEach(el => el.onclick = () => {
    if (!owns(el.dataset.t)) { sfx.no(); return; }
    sfx.click(); openDetail(el.dataset.t);
  });
}
function levelPanel(t) {
  const c = COLLECTION[t], next = LEVEL_COST[c.level + 1];
  if (!next) return `<div class="lvup"><div class="lvrow"><b>Nivel máximo</b></div>${cardBar(t)}</div>`;
  const okC = c.cards >= next.cards, okM = PROG.coins >= next.coins;
  return `<div class="lvup"><div class="lvrow"><b>Subir a nivel ${c.level + 1}</b><span class="lvcoins${okM ? '' : ' no'}"><img src="assets/moneda.svg" alt="">${next.coins} <small>(tienes ${PROG.coins})</small></span></div>
    ${cardBar(t)}<button class="btn gold" id="lvBtn"${okC && okM ? '' : ' disabled'}>${okC ? (okM ? '⬆ Subir de nivel' : 'Faltan monedas') : `Faltan ${next.cards - c.cards} cartas`}</button></div>`;
}
function levelUp(t) {
  const c = COLLECTION[t], next = LEVEL_COST[c.level + 1];
  if (!next || c.cards < next.cards || PROG.coins < next.coins) return sfx.no();
  c.cards -= next.cards; PROG.coins -= next.coins; c.level++;
  saveProg(); sfx.merge(); openDetail(t);
}
function setAnim(a) {
  if (!VW) return; VW.anim = a; VW.loop = 0;
  const rig = ST.rigs[VW.t].rig; rig.atkT = rig.supT = -1;
  document.querySelectorAll('#anims .btn').forEach(b => b.classList.toggle('on', b.dataset.a === a));
}
function openDetail(t) {
  const ch = CHARS[t], lvl = (COLLECTION[t] || { level: 1 }).level, m = LVL_MULT[lvl];
  $('#dName').textContent = ch.name; $('#dLevel').textContent = 'Nivel ' + lvl;
  const anims = [['idle', 'Reposo'], ['walk', 'Andar'], ['attack', 'Atacar']]; if (ch.abil === 'super') anims.push(['super', 'Truco']);
  $('#anims').innerHTML = anims.map(([a, n]) => `<button class="btn blue" data-a="${a}">${n}</button>`).join('');
  $('#views').innerHTML = ch.all.map(v => `<button data-v="${v}" title="${VIEW_NAMES[v]}"><img src="${src(t, v)}" alt="${VIEW_NAMES[v]}"></button>`).join('');
  $('#dInfo').innerHTML = levelPanel(t) + `
    <div class="itags"><span style="background:${ch.color};color:#fff">${ch.role}</span><span>${ch.cost} de elíxir</span><span>${rangeTag(ch, rangeOf(t, lvl))}</span></div>
    <div class="istats"><div>Vida<b>${Math.round(ch.hp * m)}</b></div><div>Ataque<b>${Math.round(ch.atk * m)}</b></div><div>Alcance<b>${rangeTxt(ch, rangeOf(t, lvl))}</b></div><div>Ritmo<b>${paceTxt(ch)}</b></div></div>
    <p class="idesc"><b>${ch.abilName}</b> · ${ch.desc}<br><em>Estadísticas provisionales.</em></p>${ch.lv ? `<div class="ilv">${ch.lv.map((x, i) => `<p class="${i < lvl ? 'on' : ''}"><b>${'★'.repeat(i + 1)}</b>${x}</p>`).join('')}</div>` : ''}${ch.atkName ? `<p class="idesc"><b>Ataque básico: ${ch.atkName}</b> · ${ch.atkDesc}</p>` : ''}${ch.sheet ? `<img class="atkimg" src="assets/${t}_ataques.webp" alt="Ataques">` : ''}`;
  VW = { t, yaw: -20, pitch: 8, auto: true, vel: 0, goal: null, dragging: false, anim: 'idle', loop: 0 };
  show('detail'); setAnim('idle'); $('#detail').scrollTop = 0;
  const lb = $('#lvBtn'); if (lb) lb.onclick = () => levelUp(t);
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
// subir de ★2 a ★3 cuesta 1 de elíxir más
const priceFor = (type, target) => CHARS[type].cost + (target && target.level === 2 ? 1 : 0);
// El jugador solo recibe en la tienda las bestias de su mazo seleccionado; la máquina puede usar todas.
const drawShop = (tm = 'p') => { const pool = tm === 'p' ? deckTypes() : TYPES; return [0, 1, 2].map(() => pick(pool.length ? pool : TYPES)); };
function renderShop(fresh = false) {
  cards.forEach((el, i) => {
    const t = G.shop[i];
    if (!t) { el.className = 'card empty'; el.innerHTML = 'Comprado'; return; }
    const d = CHARS[t], ex = bestUpgrade('p', t);
    const price = priceFor(t, ex);
    el.className = 'card' + (G.elixir.p < price ? ' poor' : '') + (fresh ? ' fresh' : '');
    el.style.setProperty('--fam', d.color);
    el.innerHTML = `<img src="${src(t, 'front')}" alt=""><div class="cost">${price}</div>${ex ? `<div class="up">★${ex.level + 1}</div>` : ''}<div class="inf">i</div><div class="band"><div class="nm">${d.name}</div><div class="role">${d.role}</div></div>`;
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
  if (G.state === 'fight') { rd.disabled = true; rd.className = 'btn blue'; rd.textContent = '⚔️ ¡Luchando!'; }
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
  const tgt = tile ? unitAtHome(tile.c, tile.r) : bestUpgrade('p', type), price = priceFor(type, tgt && tgt.type === type ? tgt : null);
  if (G.elixir.p < price) { bumpElixir(false); return fail('No tienes suficiente elíxir'); }
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
  G.elixir.p -= price; G.shop[i] = null; bumpElixir();
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
    <div class="istats"><div>Vida<b>${u ? u.maxHp : Math.round(d.hp * m)}</b></div><div>Ataque<b>${u ? u.atk : Math.round(d.atk * m)}</b></div><div>Alcance<b>${rangeTxt(d, rangeOf(type, lvl))}</b></div><div>Ritmo<b>${paceTxt(d)}</b></div></div>
    <p class="idesc"><b>${d.abilName}</b> · ${d.desc}</p>${d.lv ? `<div class="ilv">${d.lv.map((x, i) => `<p class="${i < lvl ? 'on' : ''}"><b>${'★'.repeat(i + 1)}</b>${x}</p>`).join('')}</div>` : ''}<div class="ibtns">`;
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
  else if (!u.summon) openInfo(u.type, u);
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
};

/* =========================================================
   IA DEL RIVAL
   ========================================================= */
function aiPlan() {
  let shop = drawShop('e'), free = 1;
  for (let guard = 0; guard < 14; guard++) {
    const opts = [];
    shop.forEach((t, i) => {
      if (!t) return; const d = CHARS[t], ex = bestUpgrade('e', t), cost = priceFor(t, ex); if (cost > G.elixir.e) return;
      if (ex) opts.push({ i, kind: 'up', u: ex, cost, score: 2.6 + ex.level * .4 + Math.random() });
      else if (team('e').length < MAX_UNITS && autoTile('e', t)) opts.push({ i, kind: 'new', type: t, cost: d.cost, score: 2.4 + Math.random() * 1.2 });
    });
    if (!opts.length) {
      if (free && G.elixir.e >= 2) { free = 0; shop = drawShop('e'); continue; }
      if (G.elixir.e >= 4 && Math.random() < .5) { G.elixir.e -= 1; shop = drawShop('e'); continue; }
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
const newSim = () => ({ t: 0, events: [], proj: [], domes: [], beams: [], zones: [], vfx: [] });
const fwd = u => u.team === 'p' ? 1 : -1;
const vfx = o => sim.vfx.push({ t: 0, dur: .6, ...o });
let occ = new Map(), sim = newSim(), timers = [];
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
  occ.clear(); sim = newSim(); for (const u of units.filter(u => u.summon)) removeUnit(u);
  for (const u of units) { Object.assign(u, { c: u.hc, r: u.hr, alive: true, hp: u.maxHp, energy: 0, shield: 0, domeT: 0, domeAmt: 0, stun: 0, stunKind: null, slow: 0, inv: 0, root: 0, anyDir: false, hold: 0, bone: false, dash: null, rage: 0, glow: false, lungeAmp: 0, move: null, faceT: null, cd: rand(.3, .8), occKey: null }); u.rig.tint && u.rig.tint(1, 1, 1); setOcc(u, u.c, u.r); }
  for (const u of units) {
    const L = u.level;
    if (u.type === 'bolab') {
      if (L >= 3) { u.shield = Math.round(u.maxHp * .1); burstAt(u.gx, u.gy, .4, '#ff8a2a', 12, { glow: true, spd: 1, up: 1.5 }); }
      u.hold = 1; schedule(.12, () => placaje(u));
    } else if (u.type === 'rogue' && L >= 2) { u.shield = Math.round(u.maxHp * .1); burstAt(u.gx, u.gy, .4, '#45f5cf', 12, { glow: true, spd: 1, up: 1.5 }); }
    else if (u.type === 'tanko') { u.hold = .7; schedule(.2, () => iceCube(u)); }
    else if (u.type === 'denton') { u.hold = .8; schedule(.15, () => windShark(u)); }
    else if (u.type === 'bushi' && L >= 3) { u.hold = .7; schedule(.15, () => jadeWave(u)); }
  }
  G.state = 'fight'; renderHud();
}
const DIRS_P = [[0, 1], [-1, 1], [1, 1], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1]], DIRS_E = DIRS_P.map(([c, r]) => [c, -r]);
const inRange = (u, v, c = u.c, r = u.r) => {
  const dc = Math.abs(v.c - c), dr = Math.abs(v.r - r);
  if (u.def.cone) return dc <= 1 && dr >= 1 && dr <= u.range;   // fila(s) de delante o de detrás, 3 de ancho
  if (u.def.fwd) return dc === 0 && dr >= 1 && dr <= u.range && ((v.r - r) * fwd(u) > 0 || u.anyDir);   // solo en línea recta hacia delante
  return u.def.ortho ? (dc === 0 || dr === 0) && dc + dr <= u.range : Math.max(dc, dr) <= u.range;
};
function nextStep(u) {
  const en = enemiesOf(u); if (!en.length) return null;
  const start = key(u.c, u.r), prev = new Map([[start, null]]), q = [[u.c, u.r]], dirs = u.team === 'p' ? DIRS_P : DIRS_E;
  for (let h = 0; h < q.length; h++) {
    const [c, r] = q[h], k = key(c, r);
    if (k !== start && en.some(v => inRange(u, v, c, r))) {
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
  if (u.faceT && u.faceT.alive && u.faceT.team !== u.team && inRange(u, u.faceT)) return u.faceT;
  let best = null, bd = 1e9;
  for (const v of enemiesOf(u)) { const d = cheb(u, v); if (inRange(u, v) && d * 1e4 + v.hp < bd) { bd = d * 1e4 + v.hp; best = v; } }
  return best;
}
function updateUnit(u, dt) {
  if (u.domeT > 0) { u.domeT -= dt; if (u.domeT <= 0) { u.shield = Math.max(0, u.shield - u.domeAmt); u.domeAmt = 0; } }
  if (u.inv > 0) u.inv -= dt;
  if (u.root > 0) u.root -= dt;
  if (u.stun > 0) { u.stun -= dt; return; }
  if (u.slow > 0) { u.slow -= dt; dt *= .5; }
  if (u.hold > 0) { u.hold -= dt; return; }
  if (u.bone) return;
  u.cd -= dt;
  if (u.move) { u.move.t += dt / u.ms; if (u.move.t >= 1) { u.c = u.move.c; u.r = u.move.r; u.move = null; } return; }
  const t = targetInRange(u);
  if (t) {
    u.faceT = t;
    if (u.cd <= 0) { u.cd = u.as; if (u.def.abil === 'super' && u.energy >= 99.9) { u.energy = 0; doSuper(u, t); } else attack(u, t); }
  } else {
    const s = u.root > 0 ? null : nextStep(u);
    if (!s && u.def.fwd && u.root <= 0) u.anyDir = true;   // nadie delante: puede disparar hacia atrás
    if (s) { setOcc(u, s.c, s.r); u.move = { fc: u.c, fr: u.r, c: s.c, r: s.r, t: 0 }; }
    const en = enemiesOf(u); if (en.length) u.faceT = en.reduce((a, b) => cheb(u, a) <= cheb(u, b) ? a : b);
  }
}
function shoot(u, t, o) { sim.proj.push({ gx: u.gx, gy: u.gy, t, tgx: t.gx, tgy: t.gy, p: 0, dur: Math.max(.2, Math.hypot(t.gx - u.gx, t.gy - u.gy) / (o.speed || 6)), ...o }); }
function updateProjectiles(dt) {
  for (const p of sim.proj) {
    if (p.free) { p.upd(p, dt); if (Math.random() < .7) burstAt(p.x, p.y, p.h, p.color, 1, { spd: .15, up: .1, life: .35, size: p.size * .7, g: 0, glow: true }); continue; }
    p.p += dt / p.dur; if (p.t.alive) { p.tgx = p.t.gx; p.tgy = p.t.gy; }
    const k = Math.min(1, p.p); p.x = p.gx + (p.tgx - p.gx) * k; p.y = p.gy + (p.tgy - p.gy) * k; p.h = .75 + Math.sin(Math.PI * k) * (p.arc ?? .6);
    if (Math.random() < .7) burstAt(p.x, p.y, p.h, p.color, 1, { spd: .15, up: .1, life: .35, size: p.size * .7, g: 0, glow: true });
    if (p.p >= 1) { p.done = true; p.onHit(p); }
  }
  sim.proj = sim.proj.filter(p => !p.done);
}
function drawProjectiles() {
  for (const p of sim.proj) {
    if (p.x == null) continue;
    const [x, y0] = gridToScreen(p.x, p.y), tw = tileW(p.y), y = y0 - p.h * tw * .72, r = p.size * tw;
    const [tx] = gridToScreen(p.tgx, p.tgy), [sx0] = gridToScreen(p.gx, p.gy), dir = tx >= sx0 ? 1 : -1;
    fx.save(); fx.translate(x, y);
    const glow = (rad, col) => { fx.globalCompositeOperation = 'lighter'; const g = fx.createRadialGradient(0, 0, 0, 0, 0, rad); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); fx.fillStyle = g; fx.beginPath(); fx.arc(0, 0, rad, 0, Math.PI * 2); fx.fill(); fx.globalCompositeOperation = 'source-over'; };
    if (p.kind === 'bone') {
      glow(r * 2.4, 'rgba(93,255,184,.55)'); fx.rotate(sim.t * 18); fx.fillStyle = '#efe4d2'; fx.strokeStyle = '#3a3040'; fx.lineWidth = 1.5;
      fx.beginPath(); fx.roundRect(-r * 1.2, -r * .28, r * 2.4, r * .56, r * .2); fx.fill(); fx.stroke();
      for (const [ex, ey] of [[-1.25, -.3], [-1.25, .3], [1.25, -.3], [1.25, .3]]) { fx.beginPath(); fx.arc(ex * r, ey * r, r * .36, 0, Math.PI * 2); fx.fill(); fx.stroke(); }
    } else if (p.kind === 'ball') {
      glow(r * 2, 'rgba(255,170,60,.45)'); fx.fillStyle = '#23222c'; fx.beginPath(); fx.arc(0, 0, r, 0, Math.PI * 2); fx.fill();
      fx.fillStyle = 'rgba(255,255,255,.45)'; fx.beginPath(); fx.arc(-r * .3, -r * .35, r * .3, 0, Math.PI * 2); fx.fill();
    } else if (p.kind === 'apple') {
      glow(r * 2.4, 'rgba(255,190,70,.55)'); fx.rotate(sim.t * 9); fx.fillStyle = '#b9a9a6'; fx.strokeStyle = '#ffd36a'; fx.lineWidth = 1.5;
      fx.beginPath(); fx.arc(-r * .32, 0, r * .8, 0, Math.PI * 2); fx.arc(r * .32, 0, r * .8, 0, Math.PI * 2); fx.fill(); fx.stroke();
      fx.fillStyle = '#b9a9a6'; fx.beginPath(); fx.arc(0, r * .08, r * .8, 0, Math.PI * 2); fx.fill();
      fx.fillStyle = 'rgba(255,255,255,.4)'; fx.beginPath(); fx.arc(-r * .4, -r * .3, r * .25, 0, Math.PI * 2); fx.fill();
      fx.fillStyle = '#f0b63c'; fx.beginPath(); fx.ellipse(r * .35, -r * 1.05, r * .5, r * .22, -.6, 0, Math.PI * 2); fx.fill();
      fx.strokeStyle = '#8a6a2a'; fx.lineWidth = 2; fx.beginPath(); fx.moveTo(0, -r * .7); fx.lineTo(r * .05, -r * 1.1); fx.stroke();
    } else if (p.kind === 'cube') {
      glow(r * 2.6, 'rgba(120,200,255,.6)'); fx.rotate(sim.t * 5); fx.fillStyle = 'rgba(170,225,255,.92)'; fx.strokeStyle = '#fff'; fx.lineWidth = 2;
      fx.beginPath(); fx.rect(-r, -r, r * 2, r * 2); fx.fill(); fx.stroke(); fx.strokeStyle = 'rgba(255,255,255,.7)'; fx.beginPath(); fx.moveTo(-r * .5, -r * .5); fx.lineTo(r * .3, -r * .5); fx.stroke();
    } else if (p.kind === 'shark') {
      glow(r * 2, 'rgba(110,230,255,.35)'); fx.scale(dir, 1); fx.fillStyle = '#3f5199';
      fx.beginPath(); fx.ellipse(0, 0, r * 1.3, r * .75, 0, 0, Math.PI * 2); fx.fill();
      fx.beginPath(); fx.moveTo(-r * 1.1, 0); fx.lineTo(-r * 1.9, -r * .7); fx.lineTo(-r * 1.9, r * .7); fx.fill();
      fx.beginPath(); fx.moveTo(-r * .2, -r * .6); fx.lineTo(r * .1, -r * 1.4); fx.lineTo(r * .5, -r * .6); fx.fill();
      fx.fillStyle = '#fff'; fx.beginPath(); fx.moveTo(r * .3, r * .1); for (let i = 0; i < 4; i++) { fx.lineTo(r * (.42 + i * .22), r * .5); fx.lineTo(r * (.52 + i * .22), r * .1); } fx.fill();
      fx.beginPath(); fx.arc(r * .55, -r * .2, r * .16, 0, Math.PI * 2); fx.fill();
      fx.strokeStyle = '#ffcf3a'; fx.lineWidth = 2; fx.beginPath(); fx.arc(-r * .5, -r * 1.05, r * .28, 0, Math.PI * 2); fx.stroke();
    } else glow(r * 2.2, p.color), (fx.fillStyle = '#fff', fx.beginPath(), fx.arc(0, 0, r * .5, 0, Math.PI * 2), fx.fill());
    fx.restore();
  }
  fx.globalCompositeOperation = 'source-over';
}
function drawDeer(r, run) {
  fx.globalCompositeOperation = 'lighter'; fx.fillStyle = 'rgba(120,255,200,.85)'; fx.strokeStyle = 'rgba(150,255,215,.95)'; fx.lineWidth = Math.max(2, r * .22); fx.lineCap = 'round';
  fx.beginPath(); fx.ellipse(0, 0, r * 1.2, r * .55, 0, 0, Math.PI * 2); fx.fill();
  fx.beginPath(); fx.ellipse(r * 1.35, -r * .65, r * .45, r * .36, -.4, 0, Math.PI * 2); fx.fill();
  fx.beginPath(); for (const [lx, k] of [[-.8, 1], [-.4, -1], [.5, 1], [.9, -1]]) { fx.moveTo(lx * r, r * .3); fx.lineTo((lx + run * k * .6) * r, r * 1.25); }
  fx.moveTo(r * 1.3, -r); fx.lineTo(r * 1.1, -r * 1.8); fx.moveTo(r * 1.2, -r * 1.4); fx.lineTo(r * .8, -r * 1.7); fx.moveTo(r * 1.5, -r); fx.lineTo(r * 1.8, -r * 1.8); fx.moveTo(r * 1.65, -r * 1.4); fx.lineTo(r * 2.05, -r * 1.55); fx.stroke();
  fx.fillStyle = '#eafff5'; fx.beginPath(); fx.arc(r * 1.45, -r * .7, r * .09, 0, Math.PI * 2); fx.fill();
}
function drawSummons(time) {
  for (const u of units) {
    if (!u.summon || u.dying >= 1) continue;
    const [x, y] = gridToScreen(u.gx + u.lx, u.gy + u.ly), tw = tileW(u.gy), r = tw * .2 * (u.pop > 0 ? Math.min(1, u.pop) : 1);
    const dir = u.faceT ? (gridToScreen(u.faceT.gx, u.faceT.gy)[0] >= x ? 1 : -1) : 1;
    fx.save(); fx.translate(x, y - tw * .3 + Math.sin(time * 5 + u.id) * tw * .03); fx.globalAlpha = u.dying > 0 ? 1 - u.dying : (u.flash > 0 ? 1 : .92);
    fx.globalCompositeOperation = 'lighter'; const g = fx.createRadialGradient(0, 0, 0, 0, 0, r * 2.6); g.addColorStop(0, 'rgba(60,255,170,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); fx.fillStyle = g; fx.beginPath(); fx.arc(0, 0, r * 2.6, 0, Math.PI * 2); fx.fill();
    fx.scale(dir, 1); drawDeer(r, u.move ? Math.sin(time * 22) * .5 : Math.sin(time * 3) * .08); fx.restore();
  }
  fx.globalAlpha = 1; fx.globalCompositeOperation = 'source-over';
}
function drawBeams(dt) {
  for (const b of sim.beams) {
    b.t += dt; const k = 1 - b.t / b.dur; if (k <= 0) continue;
    const [x0, y0] = gridToScreen(b.ax, b.ay), [x1, y1] = gridToScreen(b.bx, b.by), t0 = tileW(b.ay), t1 = tileW(b.by);
    fx.save(); fx.globalCompositeOperation = 'lighter'; fx.lineCap = 'round';
    for (const [w, a] of [[b.w * 3, .25], [b.w * 1.5, .6]]) { fx.strokeStyle = `rgba(${b.color},${a * k})`; fx.lineWidth = w * t0; fx.beginPath(); fx.moveTo(x0, y0 - b.h * t0 * .72); fx.lineTo(x1, y1 - b.h * t1 * .72); fx.stroke(); }
    fx.strokeStyle = `rgba(255,255,255,${k})`; fx.lineWidth = b.w * .5 * t0; fx.beginPath(); fx.moveTo(x0, y0 - b.h * t0 * .72); fx.lineTo(x1, y1 - b.h * t1 * .72); fx.stroke(); fx.restore();
  }
  sim.beams = sim.beams.filter(b => b.t < b.dur);
}
function drawZones(time) {
  for (const z of sim.zones) {
    const [x, y] = gridToScreen(z.gx, z.gy), rx = Math.abs(gridToScreen(z.gx + z.rad, z.gy)[0] - x), ry = Math.abs(gridToScreen(z.gx, z.gy + z.rad)[1] - y);
    const a = Math.min(1, z.t / .25, (z.dur - z.t) / .4) * (.8 + Math.sin(time * 9) * .12);
    fx.save(); fx.globalCompositeOperation = 'lighter'; fx.translate(x, y); fx.scale(1, ry / rx);
    const g = fx.createRadialGradient(0, 0, rx * .1, 0, 0, rx); g.addColorStop(0, `rgba(255,190,70,${.34 * a})`); g.addColorStop(.7, `rgba(255,100,30,${.3 * a})`); g.addColorStop(1, 'rgba(255,60,20,0)');
    fx.fillStyle = g; fx.beginPath(); fx.arc(0, 0, rx, 0, Math.PI * 2); fx.fill(); fx.restore();
    if (Math.random() < .8) { const an = Math.random() * 6.283, d = Math.sqrt(Math.random()) * z.rad; burstAt(z.gx + Math.cos(an) * d, z.gy + Math.sin(an) * d, .05, pick(['#ff9a3c', '#ffd24a', '#ff5a2a']), 1, { spd: .2, up: 1.6, g: -1, life: .5, size: .06, glow: true }); }
  }
}
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).join(',');
function drawVfx(dt, time) {
  for (const e of sim.vfx) {
    e.t += dt; const k = Math.min(1, e.t / e.dur), gx = e.u ? e.u.gx : e.gx, gy = e.u ? e.u.gy : e.gy;
    const [x, y] = gridToScreen(gx ?? e.ax, gy ?? e.ay), tw = tileW(gy ?? e.ay), C = a => `rgba(${e.color},${Math.max(0, a)})`;
    fx.save(); fx.globalCompositeOperation = 'lighter'; fx.lineCap = 'round';
    if (e.kind === 'portal') {
      const open = Math.min(1, k / .2) * Math.min(1, (1 - k) / .25), R = tw * .62 * (e.s || 1) * (open * (2 - open));
      // columna de luz
      const pg = fx.createLinearGradient(0, y, 0, y - tw * 2.2); pg.addColorStop(0, C(.55 * open)); pg.addColorStop(1, C(0));
      fx.fillStyle = pg; fx.beginPath(); fx.moveTo(x - R * .8, y); fx.lineTo(x - R * .45, y - tw * 2.2); fx.lineTo(x + R * .45, y - tw * 2.2); fx.lineTo(x + R * .8, y); fx.fill();
      fx.translate(x, y); fx.scale(1, .62);
      const g = fx.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, `rgba(10,30,10,${.0})`); g.addColorStop(.55, C(.35 * open)); g.addColorStop(.9, C(.9 * open)); g.addColorStop(1, C(0));
      fx.fillStyle = g; fx.beginPath(); fx.arc(0, 0, R, 0, Math.PI * 2); fx.fill();
      fx.strokeStyle = `rgba(255,255,255,${.85 * open})`; fx.lineWidth = Math.max(1.5, tw * .035);
      for (let i = 0; i < 3; i++) { fx.beginPath(); const a0 = time * 7 + i * 2.094; for (let j = 0; j <= 14; j++) { const a = a0 + j * .2, rr = R * (1 - j / 16); j ? fx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : fx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } fx.stroke(); }
      fx.strokeStyle = C(open); fx.lineWidth = Math.max(2, tw * .07); fx.beginPath(); fx.arc(0, 0, R * .96, 0, Math.PI * 2); fx.stroke();
    } else if (e.kind === 'vine') {
      const tg = e.tgt, ext = k < .42 ? 1 - Math.pow(1 - k / .42, 3) : k < .58 ? 1 : 1 - (k - .58) / .42;
      const [x1, y1] = gridToScreen(tg.gx, tg.gy), t1 = tileW(tg.gy), sx = x, sy = y - tw * .5, ex = sx + (x1 - sx) * ext, ey = sy + (y1 - t1 * .5 - sy) * ext;
      const nx = -(ey - sy), ny = ex - sx, nl = Math.hypot(nx, ny) || 1, wig = Math.sin(time * 14) * tw * .18;
      const cx1 = sx + (ex - sx) * .33 + nx / nl * wig, cy1 = sy + (ey - sy) * .33 + ny / nl * wig, cx2 = sx + (ex - sx) * .66 - nx / nl * wig, cy2 = sy + (ey - sy) * .66 - ny / nl * wig;
      const path = () => { fx.beginPath(); fx.moveTo(sx, sy); fx.bezierCurveTo(cx1, cy1, cx2, cy2, ex, ey); };
      if (e.glow) { fx.strokeStyle = 'rgba(182,255,46,.45)'; fx.lineWidth = tw * .28; path(); fx.stroke(); }
      fx.globalCompositeOperation = 'source-over';
      fx.strokeStyle = e.glow ? '#9cff3a' : '#3f6b22'; fx.lineWidth = tw * .11; path(); fx.stroke();
      fx.strokeStyle = e.glow ? '#eaffb0' : '#86b84a'; fx.lineWidth = tw * .045; path(); fx.stroke();
      // cabeza de planta carnívora
      const ang = Math.atan2(ey - cy2, ex - cx2), open = ext >= .98 ? Math.abs(Math.sin(k * 40)) * .5 : .6, R = tw * .2;
      fx.translate(ex, ey); fx.rotate(ang);
      if (e.glow) { fx.globalCompositeOperation = 'lighter'; fx.fillStyle = 'rgba(182,255,46,.5)'; fx.beginPath(); fx.arc(0, 0, R * 1.9, 0, Math.PI * 2); fx.fill(); fx.globalCompositeOperation = 'source-over'; }
      for (const sgn of [-1, 1]) {
        fx.save(); fx.rotate(sgn * open); fx.fillStyle = '#e8cf95'; fx.strokeStyle = '#3a2a3a'; fx.lineWidth = 1.5;
        fx.beginPath(); fx.ellipse(R * .2, 0, R, R * .55, 0, sgn < 0 ? Math.PI : 0, sgn < 0 ? Math.PI * 2 : Math.PI); fx.closePath(); fx.fill(); fx.stroke();
        fx.fillStyle = '#8e3aa8'; fx.beginPath(); fx.ellipse(R * .1, sgn * R * .3, R * .26, R * .14, .3, 0, Math.PI * 2); fx.fill();
        fx.fillStyle = '#fff'; for (let i = 0; i < 4; i++) { fx.beginPath(); const tx0 = -R * .45 + i * R * .38; fx.moveTo(tx0, 0); fx.lineTo(tx0 + R * .16, sgn * R * .22); fx.lineTo(tx0 + R * .32, 0); fx.fill(); }
        fx.restore();
      }
      fx.fillStyle = e.glow ? '#eaff7a' : '#c6ff4a'; fx.beginPath(); fx.arc(-R * .1, -R * .12, R * .1, 0, Math.PI * 2); fx.arc(R * .25, -R * .12, R * .1, 0, Math.PI * 2); fx.fill();
      if (ext >= .98 && k < .62) { fx.globalCompositeOperation = 'lighter'; fx.fillStyle = `rgba(${e.glow ? '200,255,80' : '220,255,150'},.7)`; for (let i = 0; i < 8; i++) { const an = i * .785; fx.beginPath(); fx.moveTo(R, 0); fx.lineTo(R + Math.cos(an) * R * 1.4, Math.sin(an) * R * 1.4); fx.lineTo(R + Math.cos(an + .2) * R * .5, Math.sin(an + .2) * R * .5); fx.fill(); } }
    } else if (e.kind === 'link') {
      const [x1, y1] = gridToScreen(e.bx, e.by), mx = (x + x1) / 2, my = Math.min(y, y1) - tw * 1.6;
      for (const [w, a] of [[.22, .25], [.1, .7], [.04, 1]]) { fx.strokeStyle = w < .05 ? `rgba(255,255,255,${1 - k})` : C(a * (1 - k)); fx.lineWidth = w * tw; fx.beginPath(); fx.moveTo(x, y - tw * .4); fx.quadraticCurveTo(mx, my, x1, y1 - tw * .4); fx.stroke(); }
    } else if (e.kind === 'pillar') {
      const a = Math.sin(k * Math.PI), R = tw * (.35 + k * .25), H = tw * (1.6 + k * .8);
      const pg = fx.createLinearGradient(0, y, 0, y - H); pg.addColorStop(0, C(.6 * a)); pg.addColorStop(1, C(0));
      fx.fillStyle = pg; fx.fillRect(x - R, y - H, R * 2, H);
      fx.strokeStyle = C(a); fx.lineWidth = Math.max(2, tw * .06); fx.beginPath(); fx.ellipse(x, y, tw * (.3 + k * .7), tw * (.3 + k * .7) * .66, 0, 0, Math.PI * 2); fx.stroke();
    } else if (e.kind === 'spin') {
      const a1 = k * Math.PI * 4, R = tw * e.r, fade = Math.min(1, (1 - k) / .3);
      fx.translate(x, y - tw * .35); fx.scale(1, .66);
      for (let i = 0; i < 10; i++) { fx.strokeStyle = i ? C((1 - i / 10) * .75 * fade) : `rgba(255,255,255,${fade})`; fx.lineWidth = tw * (.2 - i * .015); fx.beginPath(); fx.arc(0, 0, R * (1 - i * .012), a1 - (i + 1) * .26, a1 - i * .26); fx.stroke(); }
      fx.fillStyle = C(.12 * fade); fx.beginPath(); fx.arc(0, 0, R, 0, Math.PI * 2); fx.fill();
    } else if (e.kind === 'wave') {
      for (let i = 0; i < 5; i++) {
        const kk = Math.max(0, k - i * .07), yy = e.gy + (e.gy1 - e.gy) * kk, [xa, ya] = gridToScreen(e.gx - e.w, yy), [xb, yb] = gridToScreen(e.gx + e.w, yy), [, yc] = gridToScreen(e.gx, yy + e.f * .9), t2 = tileW(yy), fade = Math.min(1, (1 - k) / .25);
        fx.strokeStyle = i ? C((.6 - i * .12) * fade) : `rgba(255,255,255,${fade})`; fx.lineWidth = t2 * (i ? .26 - i * .04 : .1);
        fx.beginPath(); fx.moveTo(xa, ya - t2 * .3); fx.quadraticCurveTo((xa + xb) / 2, yc - t2 * .3, xb, yb - t2 * .3); fx.stroke();
      }
    } else if (e.kind === 'star') {
      const R = tw * e.r * (.3 + k * .7), a = 1 - k * k; fx.translate(x, y - (e.h || .5) * tw * .72); fx.rotate(k * .6);
      fx.fillStyle = C(a * .9); fx.beginPath(); for (let i = 0; i < 16; i++) { const an = i * Math.PI / 8, rr = i % 2 ? R * .38 : R; fx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } fx.closePath(); fx.fill();
      fx.fillStyle = `rgba(255,255,255,${a})`; fx.beginPath(); fx.arc(0, 0, R * .3, 0, Math.PI * 2); fx.fill();
    } else if (e.kind === 'flash') {
      const R = tw * e.r * (.5 + k * .6); fx.translate(x, y); fx.scale(1, .66);
      const g = fx.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, `rgba(255,255,255,${.8 * (1 - k)})`); g.addColorStop(.5, C(.6 * (1 - k))); g.addColorStop(1, C(0));
      fx.fillStyle = g; fx.beginPath(); fx.arc(0, 0, R, 0, Math.PI * 2); fx.fill();
    } else if (e.kind === 'dome') {
      const grow = 1 - Math.pow(1 - Math.min(1, k / .25), 3), out = Math.min(1, (1 - k) / .2), rx = tw * e.r * grow, ry = rx * .82, cy = y + tw * .1;
      if (rx > 2 && e.r < 3) {
        fx.globalAlpha = out; fx.beginPath(); fx.ellipse(x, cy, rx, ry, 0, Math.PI, 0); fx.ellipse(x, cy, rx, rx * .3, 0, 0, Math.PI); fx.closePath();
        const g = fx.createRadialGradient(x, cy - ry * .3, rx * .1, x, cy, rx); g.addColorStop(0, C(.04)); g.addColorStop(.8, C(.18)); g.addColorStop(1, 'rgba(255,240,180,.6)'); fx.fillStyle = g; fx.fill();
        fx.strokeStyle = 'rgba(255,240,180,.95)'; fx.lineWidth = 2.5; fx.beginPath(); fx.ellipse(x, cy, rx, ry, 0, Math.PI, 0); fx.stroke();
        fx.strokeStyle = C(.8); fx.lineWidth = 3; fx.beginPath(); fx.ellipse(x, cy, rx, rx * .3, 0, 0, Math.PI * 2); fx.stroke();
        fx.strokeStyle = 'rgba(255,255,255,.7)'; fx.lineWidth = 2; fx.beginPath(); fx.ellipse(x, cy, rx * .78, ry * .8, 0, Math.PI * 1.15, Math.PI * 1.45); fx.stroke();
      } else if (e.r >= 3) {   // onda dorada que recorre todo el tablero
        fx.strokeStyle = C(.9 * (1 - k)); fx.lineWidth = tw * .12; fx.beginPath(); fx.ellipse(x, y, tw * e.r * k, tw * e.r * k * .66, 0, 0, Math.PI * 2); fx.stroke();
      }
    }
    fx.restore();
  }
  sim.vfx = sim.vfx.filter(e => e.t < e.dur);
}
// burbuja dorada de invencibilidad, hielo de ralentización y chispas de parálisis
function drawStatus(time) {
  for (const u of units) {
    if (!u.alive) continue;
    const h = u.sy - u.top, cx = u.sx, cy = u.sy - h * .5;
    if (u.inv > 0) {
      const rx = u.dw * .72, ry = h * .68, a = Math.min(1, u.inv / .2) * (.85 + Math.sin(time * 10) * .1);
      fx.save(); fx.globalCompositeOperation = 'lighter'; fx.globalAlpha = a;
      fx.beginPath(); fx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      const g = fx.createRadialGradient(cx - rx * .3, cy - ry * .4, rx * .1, cx, cy, Math.max(rx, ry)); g.addColorStop(0, 'rgba(255,250,210,.28)'); g.addColorStop(.75, 'rgba(255,200,80,.2)'); g.addColorStop(1, 'rgba(255,225,130,.75)');
      fx.fillStyle = g; fx.fill(); fx.save(); fx.clip();
      fx.strokeStyle = 'rgba(255,235,160,.45)'; fx.lineWidth = 1.2; const hs = u.dw * .2; fx.beginPath();
      for (let j = -5; j <= 5; j++) for (let i = -4; i <= 4; i++) { const hx = cx + (i + (j & 1) * .5) * hs * 1.73, hy = cy + j * hs * 1.5; for (let q = 0; q < 6; q++) { const an = Math.PI / 3 * q + Math.PI / 6, px = hx + Math.cos(an) * hs, py = hy + Math.sin(an) * hs; q ? fx.lineTo(px, py) : fx.moveTo(px, py); } fx.closePath(); }
      fx.stroke();
      const sw = ((time * 1.6) % 1) * 2 - .5; fx.fillStyle = 'rgba(255,255,255,.22)'; fx.beginPath(); fx.moveTo(cx - rx + rx * 2 * sw, cy - ry); fx.lineTo(cx - rx + rx * 2 * sw + rx * .35, cy - ry); fx.lineTo(cx - rx + rx * 2 * sw - rx * .2, cy + ry); fx.lineTo(cx - rx + rx * 2 * sw - rx * .55, cy + ry); fx.fill();
      fx.restore(); fx.strokeStyle = 'rgba(255,240,190,.95)'; fx.lineWidth = 2.5; fx.beginPath(); fx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); fx.stroke(); fx.restore();
    }
    if (u.rage > 0 || u.glow) {   // furia morada de Jess / raíces radiantes de Sevora
      const c = u.glow ? '182,255,46' : '190,110,255', pul = .75 + Math.sin(time * 8) * .2;
      fx.save(); fx.globalCompositeOperation = 'lighter';
      const g = fx.createRadialGradient(cx, cy, 0, cx, cy, u.dw * .8); g.addColorStop(0, `rgba(${c},${.28 * pul})`); g.addColorStop(1, `rgba(${c},0)`);
      fx.fillStyle = g; fx.beginPath(); fx.ellipse(cx, cy, u.dw * .8, h * .75, 0, 0, Math.PI * 2); fx.fill();
      fx.strokeStyle = `rgba(${c},${.9 * pul})`; fx.lineWidth = 2.5; fx.beginPath(); fx.ellipse(cx, u.sy, u.dw * .48, u.dw * .32, 0, 0, Math.PI * 2); fx.stroke(); fx.restore();
      if (Math.random() < .35) burstAt(u.gx + rand(-.3, .3), u.gy + rand(-.2, .2), rand(.1, .6), u.glow ? pick(['#b6ff2e', '#eaff7a']) : pick(['#b06bff', '#e0a8ff']), 1, { spd: .2, up: 1.4, g: -1.5, life: .55, size: .07, glow: true });
    }
    if (u.slow > 0 && !(u.stun > 0)) {
      fx.save(); fx.globalCompositeOperation = 'lighter'; fx.strokeStyle = 'rgba(150,215,255,.8)'; fx.lineWidth = 2.5;
      fx.beginPath(); fx.ellipse(cx, u.sy, u.dw * .5, u.dw * .33, 0, 0, Math.PI * 2); fx.stroke(); fx.fillStyle = 'rgba(150,215,255,.16)'; fx.fill();
      fx.fillStyle = 'rgba(225,245,255,.95)'; for (let i = 0; i < 5; i++) { const an = time * 1.5 + i * 1.256; fx.beginPath(); fx.arc(cx + Math.cos(an) * u.dw * .45, cy + Math.sin(an * 1.3 + i) * h * .35, 2.2, 0, Math.PI * 2); fx.fill(); }
      fx.restore();
    }
    if (u.stun > 0 && u.stunKind === 'para') {
      fx.save(); fx.globalCompositeOperation = 'lighter'; fx.strokeStyle = 'rgba(255,235,90,.95)'; fx.lineWidth = 2.5; fx.lineJoin = 'round';
      for (let i = 0; i < 3; i++) { const an = time * 6 + i * 2.094, px = cx + Math.cos(an) * u.dw * .42, py = u.top + h * .12 + Math.sin(an) * h * .08, z = u.dw * .12; fx.beginPath(); fx.moveTo(px - z, py - z); fx.lineTo(px + z * .2, py - z * .1); fx.lineTo(px - z * .2, py + z * .1); fx.lineTo(px + z, py + z); fx.stroke(); }
      fx.restore();
    }
  }
}
function drawFrozen() {
  for (const u of units) {
    if (!(u.stun > 0 && u.alive) || u.stunKind === 'para') continue;
    const h = u.sy - u.top, w = u.dw * .95;
    fx.save(); fx.globalAlpha = .55; fx.fillStyle = '#a8dcff'; fx.strokeStyle = '#fff'; fx.lineWidth = 2;
    fx.beginPath(); fx.roundRect(u.sx - w / 2, u.top + h * .08, w, h * .98, 8); fx.fill(); fx.globalAlpha = .9; fx.stroke(); fx.restore();
  }
}
const basicDmg = u => u.atk * ((u.type === 'gloop' || u.type === 'bolab') && u.level >= 2 ? 1.36 : 1);
// carga del súper por número de básicos / impactos
function charge(u, n = 1) {
  if (!u.def.charge || !u.alive || u.glow) return;
  const d = u.def, need = (u.level >= 3 && d.charge3) || (u.level >= 2 && (d.charge3 ? 0 : d.charge2)) || (u.level >= 2 && d.charge2) || d.charge;
  u.energy = Math.min(100, u.energy + 100 / need * n);
}
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, k = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return Math.hypot(px - ax - dx * k, py - ay - dy * k);
}
function laser(u, t) {
  schedule(.17, () => {
    if (!u.alive) return;
    let bx = t.gx, by = t.gy, hits = [t];
    if (u.level >= 2) {   // atraviesa: golpea a todos los rivales de la línea
      const dx = t.gx - u.gx, dy = t.gy - u.gy, l = Math.hypot(dx, dy) || 1, L = Math.max(3, l) + .3;
      bx = u.gx + dx / l * L; by = u.gy + dy / l * L;
      hits = enemiesOf(u).filter(v => v === t || segDist(v.gx, v.gy, u.gx, u.gy, bx, by) < .45);
    }
    sim.beams.push({ ax: u.gx, ay: u.gy, bx, by, h: .78, color: '255,60,90', w: .1, t: 0, dur: .22 }); sfx.shoot();
    let any = false;
    for (const v of hits) if (v.alive) { any = true; damage(v, u.atk, u); burstAt(v.gx, v.gy, .6, '#ff5a7a', 7, { glow: true, spd: 1.4 }); }
    if (any) charge(u);
  });
}
function bone(u, t) {
  const dc = Math.sign(t.c - u.c), dr = dc ? 0 : Math.sign(t.r - u.r);
  u.bone = true;   // no vuelve a lanzar hasta que el hueso regresa
  schedule(.15, () => {
    if (!u.alive) { u.bone = false; return; }
    sfx.shoot();
    const ox = u.gx, oy = u.gy, hit = [new Set(), new Set()];
    sim.proj.push({ free: true, kind: 'bone', color: '#5dffb8', size: .1, gx: ox, gy: oy, tgx: ox + dc * 2, tgy: oy + dr * 2, p: 0, x: ox, y: oy, h: .6,
      upd(p, dt) {
        p.p += dt / 1.05; const leg = p.p < .5 ? 0 : 1, k = Math.max(0, leg ? 2 - p.p * 2 : p.p * 2); p.x = ox + dc * 2 * k; p.y = oy + dr * 2 * k;
        for (const v of units) if (v.alive && v.team !== u.team && !hit[leg].has(v) && Math.hypot(v.gx - p.x, v.gy - p.y) < .5) {
          hit[leg].add(v); damage(v, u.atk, u); charge(u); sfx.hit(); burstAt(v.gx, v.gy, .5, '#5dffb8', 6, { glow: true, spd: 1.2 });
        }
        if (p.p >= 1) { p.done = true; u.bone = false; u.cd = .3; }
      } });
  });
}
function placaje(u, o = { A: u.atk }) {
  if (!u.alive) return;
  const dir = u.team === 'p' ? 1 : -1; let n = 0;
  while (n < 3 && u.r + dir * (n + 1) >= 0 && u.r + dir * (n + 1) < ROWS) n++;
  if (!n) return;
  floatText(u, '¡Placaje!', 'sup'); u.dash = { t: 0, dur: .7, dy: dir * n }; u.rig.play('attack'); sfx.slash();
  schedule(.3, () => {
    if (!u.alive) return;
    const end = u.r + dir * n;
    const hit = enemiesOf(u).filter(v => v.c === u.c && (v.r - u.r) * dir >= 1 && (v.r - u.r) * dir <= n).sort((a, b) => (b.r - a.r) * dir);
    for (const v of hit) {
      const r = [end, end + dir, end + 2 * dir, end - dir, end - 2 * dir].filter(r => r >= 0 && r < ROWS && r !== u.r).find(r => { const o = occ.get(key(u.c, r)); return !o || o === v; });
      if (r != null) { v.move = null; setOcc(v, u.c, r); v.c = u.c; v.r = r; }
      damage(v, o.A * .75, u); burstAt(v.gx, v.gy, .4, '#ff8a2a', 10, { glow: true, spd: 1.8 });
    }
    if (hit.length) { sfx.boom(); shake = Math.max(shake, 5); }
  });
}
function iceCube(u, o = { L: u.level, A: u.atk }) {
  if (!u.alive) return;
  const f = fwd(u), L = o.L; floatText(u, '¡Cubo de hielo!', 'sup'); u.rig.play('attack'); sfx.shoot();
  sim.proj.push({ free: true, kind: 'cube', color: '#8fd4ff', size: .14, gx: u.gx, gy: u.gy, tgx: u.gx, tgy: u.gy + f * 8, x: u.gx, y: u.gy, h: .6,
    upd(p, dt) {
      p.y += f * 7 * dt;
      const v = enemiesOf(u).find(v => Math.abs(v.gx - p.x) < .45 && Math.abs(v.gy - p.y) < .45);
      if (v) {
        p.done = true; damage(v, o.A * .15, u); v.slow = 2; if (L >= 2) { v.stun = 1; v.stunKind = 'ice'; floatText(v, '¡Congelado!', 'sup'); }
        if (L >= 3) for (const w of enemiesOf(u)) if (w !== v && cheb(w, v) <= 1) w.slow = Math.max(w.slow || 0, 2);
        vfx({ kind: 'flash', gx: v.gx, gy: v.gy, r: L >= 3 ? 1.5 : .8, color: '170,225,255', dur: .5 }); fxs.push({ gx: v.gx, gy: v.gy, r: L >= 3 ? 1.6 : 1, color: '#8fd4ff', t: 0, dur: .5 });
        burstAt(v.gx, v.gy, .4, '#cfeaff', 20, { spd: 2.6, up: 2, glow: true }); sfx.hit();
      } else if (p.y < -.2 || p.y > ROWS + .2) p.done = true;
    } });
}
function windShark(u, o = { L: u.level, A: u.atk }) {
  if (!u.alive) return;
  const f = fwd(u), L = o.L, oy = u.gy; floatText(u, '¡Tiburón de cuerda!', 'sup'); u.rig.play('attack'); sfx.shoot();
  sim.proj.push({ free: true, kind: 'shark', color: '#6fe8ff', size: .13, gx: u.gx, gy: u.gy, tgx: u.gx + .01 * f, tgy: u.gy + f * 2, x: u.gx, y: u.gy, h: .25,
    upd(p, dt) {
      p.y += f * 4.5 * dt;
      const v = enemiesOf(u).find(v => Math.abs(v.gx - p.x) < .45 && Math.abs(v.gy - p.y) < .45);
      if (v) {
        p.done = true;
        const ok = n => { const r = v.r + f * n; return r >= 0 && r < ROWS && !occ.has(key(v.c, r)); }, n = ok(1) ? (ok(2) ? 2 : 1) : 0;
        if (n) { v.move = null; setOcc(v, v.c, v.r + f * n); v.r += f * n; }
        if (L >= 2) damage(v, o.A * (L >= 3 ? 1.67 : 1), u, L >= 3 ? 'big' : '');
        if (L >= 3 && v.alive) { v.stun = 1; v.stunKind = 'para'; floatText(v, '¡Paralizado!', 'sup'); }
        vfx({ kind: 'star', gx: v.gx, gy: v.gy, h: .5, color: '110,230,255', r: .9, dur: .35 }); burstAt(v.gx, v.gy, .5, '#bff4ff', 16, { spd: 2.6, up: 1.6, glow: true }); sfx.hit(); shake = Math.max(shake, 4);
      } else if (Math.abs(p.y - oy) >= 2.3) { p.done = true; burstAt(p.x, p.y, .2, '#bff4ff', 6, { spd: 1, up: 1 }); }
    } });
}
function jadeWave(u) {
  if (!u.alive) return;
  const f = fwd(u), hit = new Set(); floatText(u, '¡Corte de jade!', 'sup'); u.rig.play('super'); sfx.slash();
  vfx({ kind: 'wave', gx: u.gx, gy: u.gy + f * .4, gy1: u.gy + f * 2.5, w: 1.5, f, color: '93,255,176', dur: .45 });
  for (const [d, row] of [[.14, 1], [.3, 2]]) schedule(d, () => {
    for (const v of enemiesOf(u)) if (!hit.has(v) && Math.abs(v.c - u.c) <= 1 && v.r === u.r + f * row) { hit.add(v); damage(v, u.atk * 1.36, u, 'big'); burstAt(v.gx, v.gy, .5, '#5dffb0', 12, { glow: true, spd: 2 }); sfx.hit(); }
  });
}
// Jess: ráfaga de perdigones sobre la zona de delante (3 de ancho)
const jessDmg = u => u.atk * (1 + u.rage * (u.level >= 3 ? .15 : .10));
function pellets(u, t) {
  const dir = Math.sign(t.r - u.r) || fwd(u), col = u.rage > 0 ? '#c77dff' : '#7ff6ff', rgb = u.rage > 0 ? '199,125,255' : '127,246,255';
  u.lunge = .3; u.lungeAmp = -.12;
  schedule(.16, () => {
    if (!u.alive) return;
    sfx.boom(); vfx({ kind: 'star', gx: u.gx, gy: u.gy + dir * .35, h: .55, color: rgb, r: .55, dur: .22 });
    const ox = u.gx, oy = u.gy;
    for (let i = 0; i < 8; i++) {
      const tx = u.c + .5 + rand(-1.3, 1.3), ty = u.r + .5 + dir * rand(.8, u.range + .3);
      sim.proj.push({ free: true, color: col, size: .05, gx: ox, gy: oy, tgx: tx, tgy: ty, x: ox, y: oy, h: .55, p: 0,
        upd(p, dt) { p.p += dt / .2; const k = Math.min(1, p.p); p.x = ox + (tx - ox) * k; p.y = oy + (ty - oy) * k; if (p.p >= 1) p.done = true; } });
    }
    schedule(.18, () => {
      for (const v of enemiesOf(u)) if (Math.abs(v.c - u.c) <= 1 && (v.r - u.r) * dir >= 1 && (v.r - u.r) * dir <= u.range) {
        damage(v, jessDmg(u), u); burstAt(v.gx, v.gy, .5, col, 8, { glow: true, spd: 1.6 });
      }
      sfx.hit();
    });
  });
}
// Sevora: la planta del brazo se estira con su raíz y muerde
const COPY_START = { bolab: 1, tanko: 1, denton: 1 };
const copyable = v => !v.summon && v.type !== 'sevora' && (v.def.abil === 'super' || COPY_START[v.type]);
function vineBite(u, t) {
  const glow = u.glow;
  vfx({ kind: 'vine', u, tgt: t, glow, dur: .55 });
  schedule(.24, () => {
    if (!u.alive) return;
    if (t.alive) { damage(t, u.atk, u, glow ? 'big' : ''); burstAt(t.gx, t.gy, .55, glow ? '#c8ff4a' : '#9ccf4a', glow ? 16 : 7, { glow: true, spd: 1.6 }); sfx.hit(); }
    if (!glow) return charge(u);
    if (!copyable(t)) return;   // a quien no tiene súper no se le copia nada: sigue brillando
    const cp = { type: t.type, level: t.level, atk: t.atk, pow: u.level >= 3 ? 1.1 : 1.05 };
    vfx({ kind: 'link', ax: t.gx, ay: t.gy, bx: u.gx, by: u.gy, color: '182,255,46', dur: .35 });
    schedule(.3, () => {   // la planta ha vuelto: lanza el súper copiado
      if (!u.alive) return;
      u.glow = false; u.rig.tint && u.rig.tint(1, 1, 1);
      const tg = t.alive ? t : enemiesOf(u).sort((a, b) => cheb(u, a) - cheb(u, b))[0];
      if (tg) doSuper(u, tg, cp);
    });
  });
}
function attack(u, t) {
  if (u.def.abil === 'super' && !u.def.charge) u.energy = Math.min(100, u.energy + 22);
  u.rig.play('attack');
  if (u.type === 'ogul') return laser(u, t);
  if (u.type === 'jess') return pellets(u, t);
  if (u.type === 'sevora') return vineBite(u, t);
  if (u.type === 'osko') return bone(u, t);
  if (u.range <= 1 || u.def.melee) {
    u.lunge = .42; u.lungeAmp = 0;
    if (u.type === 'bushi') sfx.slash();
    if (u.type === 'bolab' && u.level >= 2) schedule(.1, () => u.alive && sim.beams.push({ ax: u.gx, ay: u.gy, bx: t.gx, by: t.gy, h: .42, color: '255,110,150', w: .16, t: 0, dur: .2 }));
    schedule(.19, () => { if (u.alive) { damage(t, basicDmg(u), u); charge(u); sfx.hit(); burstAt(t.gx, t.gy, .5, HIT_COLOR[u.type] || '#ffffff', 6, { glow: true, spd: 1.2 }); } });
  } else schedule(.17, () => {
    if (!u.alive) return;
    const P = PROJ[u.type] || { color: u.def.proj, size: .09, arc: .3 };
    if (P.kind === 'ball') { sfx.boom(); burstAt(u.gx, u.gy, .6, '#c8c8d8', 6, { spd: .8, up: .8, g: 0, life: .5 }); } else sfx.shoot();
    shoot(u, t, { ...P, onHit: () => { if (t.alive) charge(u); damage(t, u.atk, u); if (P.kind) burstAt(t.gx, t.gy, .5, P.color, 6, { glow: true, spd: 1.2 }); if (P.back && u.alive) shoot(t, u, { ...P, onHit() { } }); } });
  });
}
function aoe(source, c, r, rad, dmg) {
  for (const v of units) if (v.alive && v.team !== source.team && Math.max(Math.abs(v.c - c), Math.abs(v.r - r)) <= rad) damage(v, dmg, source, 'big');
}
// cp = súper copiado por Sevora: { type, level, atk, pow }
function doSuper(u, t, cp = null) {
  const T = cp ? cp.type : u.type, L = cp ? cp.level : u.level, P = cp ? cp.pow : 1, A = (cp ? cp.atk : u.atk) * P, D = CHARS[T];
  floatText(u, (cp ? '¡Copia: ' : '¡') + D.abilName + '!', 'sup'); sfx.super(); shake = Math.max(shake, 4); u.rig.play('super');
  vfx({ kind: 'pillar', u, color: hexRgb(D.color), dur: .7 });
  if (T === 'sevora') {   // Mordida radiante: brilla hasta el siguiente mordisco
    u.glow = true; u.rig.tint && u.rig.tint(.75, 1.55, .6); u.cd = Math.min(u.cd, .6);
    burstAt(u.gx, u.gy, .5, '#b6ff2e', 22, { spd: 2, up: 2, glow: true }); return;
  }
  if (T === 'bolab') return placaje(u, { A });
  if (T === 'tanko') return iceCube(u, { L, A });
  if (T === 'denton') return windShark(u, { L, A });
  if (T === 'bushi') {
    vfx({ kind: 'spin', u, r: 1.5, color: '93,255,176', dur: .55 });
    schedule(.28, () => {
      if (!u.alive) return;
      aoe(u, u.c, u.r, 1, A * 1.36); burstAt(u.gx, u.gy, .4, '#5dffb0', 24, { spd: 3, up: .8, glow: true }); sfx.slash();
      if (L >= 2) for (const v of units) if (v.alive && v.team === u.team && cheb(u, v) <= 1 && v.hp < v.maxHp) {
        const h = Math.min(v.maxHp - v.hp, Math.round(v.maxHp * .15 * P)); v.hp += h; floatText(v, '+' + h, 'heal'); burstAt(v.gx, v.gy, .5, '#9dffb0', 10, { glow: true, spd: .8, up: 2.2, g: -2 });
      }
    });
  } else if (T === 'osko') {
    schedule(.3, () => {
      if (!u.alive) return;
      const free = [];
      for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) { const c = u.c + dc, r = u.r + dr; if ((dc || dr) && c >= 0 && c < COLS && r >= 0 && r < ROWS && !occ.has(key(c, r))) free.push({ c, r }); }
      free.sort((a, b) => Math.hypot(a.c - t.c, a.r - t.r) - Math.hypot(b.c - t.c, b.r - t.r));
      for (const s of free.slice(0, L >= 3 ? 2 : 1)) {
        const d = createUnit('reno', u.team, s.c, s.r, L); d.summon = true; d.hp = d.maxHp; d.atk = Math.round(d.atk * P);   // copiados por Sevora: +5% / +10% de daño d.cd = .3; setOcc(d, s.c, s.r);
        vfx({ kind: 'portal', gx: d.gx, gy: d.gy, color: '93,255,184', dur: .8, s: .75 }); burstAt(d.gx, d.gy, .4, '#5dffb8', 20, { spd: 2.4, up: 2, glow: true });
      }
      sfx.boom();
    });
  } else if (T === 'gloop') {
    // trae a su lado al rival con menos vida y le da un puñetazo
    const v = enemiesOf(u).sort((a, b) => a.hp - b.hp)[0] || t; let tgt = v;
    const portal = (gx, gy) => { vfx({ kind: 'portal', gx, gy, color: '182,255,46', dur: .9 }); burstAt(gx, gy, .5, '#b6ff2e', 18, { spd: 2.2, up: 1.5, glow: true }); };
    if (cheb(u, v) > 1 || v.move) {
      const opts = [];
      for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) { const c = u.c + dc, r = u.r + dr; if ((dc || dr) && c >= 0 && c < COLS && r >= 0 && r < ROWS && !occ.has(key(c, r))) opts.push({ c, r }); }
      if (opts.length) {
        const fw = u.team === 'p' ? 1 : -1, s = opts.sort((a, b) => ((b.r - u.r) * fw - Math.abs(b.c - u.c) * .5) - ((a.r - u.r) * fw - Math.abs(a.c - u.c) * .5))[0];
        portal(v.gx, v.gy); vfx({ kind: 'link', ax: v.gx, ay: v.gy, bx: s.c + .5, by: s.r + .5, color: '182,255,46', dur: .45 }); v.move = null; setOcc(v, s.c, s.r); v.c = s.c; v.r = s.r; v.gx = s.c + .5; v.gy = s.r + .5; v.pop = .0001; portal(v.gx, v.gy);
      } else if (cheb(u, v) > 1) tgt = t;
    } else portal(v.gx, v.gy);
    if (tgt === v && L >= 3) damage(v, v.maxHp * .1 * P, u, 'sup');
    u.faceT = tgt; u.lunge = .7; u.lungeAmp = .25;
    schedule(.42, () => { if (!u.alive) return; damage(tgt, A * 1.36, u, 'big'); vfx({ kind: 'star', gx: tgt.gx, gy: tgt.gy, h: .55, color: '182,255,46', r: 1.3, dur: .4 }); burstAt(tgt.gx, tgt.gy, .5, '#b6ff2e', 22, { spd: 3, up: 1.8, glow: true }); sfx.boom(); shake = Math.max(shake, 7); });
  } else if (T === 'pomona') {
    schedule(.22, () => {
      if (!u.alive) return;
      const who = units.filter(v => v.alive && v.team === u.team && (v === u || L >= 3 || (L >= 2 && cheb(u, v) <= 1)));
      for (const v of who) { v.inv = P; burstAt(v.gx, v.gy, .5, '#ffe9a8', 10, { spd: 1.2, up: 1.6, glow: true }); }
      u.root = 1; sfx.boom();
      vfx({ kind: 'dome', u, r: L >= 3 ? 4.5 : L >= 2 ? 1.6 : .8, color: '255,205,90', dur: 1 });
      fxs.push({ gx: u.gx, gy: u.gy, r: L >= 3 ? 4 : L >= 2 ? 1.8 : 1, color: '#ffd36a', t: 0, dur: .6 });
    });
  } else if (T === 'rogue') {
    const dr0 = t.r - u.r, dy = dr0 ? Math.sign(dr0) : 0, dx = dy ? 0 : Math.sign(t.c - u.c), tiles = [-1, 0, 1].map(k => ({ c: u.c + dx + (dy ? k : 0), r: u.r + dy + (dx ? k : 0) }));
    if (L >= 3) u.shield += Math.round(u.hp * .25 * P);
    u.lunge = .7; u.lungeAmp = .3;
    for (let i = 0; i < 6; i++) schedule(.14 + i * .07, () => { if (!u.alive) return; const q = tiles[i % 3]; vfx({ kind: 'star', gx: q.c + .5 + rand(-.2, .2), gy: q.r + .5 + rand(-.2, .2), h: rand(.35, .8), color: '70,245,207', r: .7, dur: .28 }); sfx.hit(); });
    schedule(.3, () => {
      if (!u.alive) return;
      for (const v of enemiesOf(u)) if (tiles.some(q => q.c === v.c && q.r === v.r)) { damage(v, A * 1.36, u, 'big'); burstAt(v.gx, v.gy, .5, '#45f5cf', 14, { spd: 2.5, up: 1.6, glow: true }); }
      sfx.boom(); shake = Math.max(shake, 6);
    });
  } else if (T === 'ogul') {
    schedule(.26, () => u.alive && shoot(u, t, { color: '#ff4a6a', size: .2, speed: 4.5, arc: .9, onHit: p => {
      for (const v of enemiesOf(u)) if (Math.hypot(v.gx - p.tgx, v.gy - p.tgy) <= 2.05) damage(v, A, u, 'big');
      fxs.push({ gx: p.tgx, gy: p.tgy, r: 2.2, color: '#ff9a3c', t: 0, dur: .55 }); vfx({ kind: 'flash', gx: p.tgx, gy: p.tgy, r: 2, color: '255,150,70', dur: .5 });
      burstAt(p.tgx, p.tgy, .3, '#ff6a4a', 30, { spd: 4, up: 2.2, glow: true }); sfx.boom(); shake = Math.max(shake, 7);
      if (L >= 3) sim.zones.push({ gx: p.tgx, gy: p.tgy, rad: 2, t: 0, dur: 3, tick: .5, team: u.team, dmg: A * .36, src: u });
    } }));
  }
}
function damage(t, amt, source, kind = '') {
  if (!t.alive) return;
  if (t.inv > 0) { burstAt(t.gx, t.gy, .6, '#ffe9a8', 3, { glow: true, spd: 1.4, life: .3 }); return; }
  amt = Math.round(amt); let a = amt;
  if (t.shield > 0) { const s = Math.min(t.shield, a); t.shield -= s; a -= s; }
  t.hp -= a; if (t.def.abil === 'super' && !t.def.charge) t.energy = Math.min(100, t.energy + 5);
  t.flash = .12; floatText(t, '-' + amt, kind || (t.team === 'p' ? 'e' : ''));
  if (t.hp <= 0) die(t);
}
function die(t) {
  t.alive = false; t.hp = 0; t.dying = .0001;
  if (occ.get(t.occKey) === t) occ.delete(t.occKey);
  burstAt(t.gx, t.gy, .5, '#ffffff', 16, { spd: 2, up: 2.2, size: .09 });
  burstAt(t.gx, t.gy, .5, t.team === 'p' ? '#3d8bfd' : '#ff4d5e', 8, { spd: 2, up: 2, glow: true });
  sfx.die();
  if (!t.summon && G.state === 'fight') for (const j of units) if (j.type === 'jess' && j.alive && j.team === t.team) {
    j.rage++; j.rig.tint && j.rig.tint(1.25, .8, 1.7); floatText(j, '¡Furia +' + Math.round(j.rage * (j.level >= 3 ? 15 : 10)) + '%!', 'sup');
    burstAt(j.gx, j.gy, .5, '#c77dff', 18, { spd: 1.6, up: 2.4, glow: true });
  }
}
function combatStep(dt) {
  sim.t += dt;
  const due = sim.events.filter(e => e.at <= sim.t); sim.events = sim.events.filter(e => e.at > sim.t); due.forEach(e => e.fn());
  for (const u of units) if (u.alive) updateUnit(u, dt);
  updateProjectiles(dt);
  for (const z of sim.zones) {
    z.t += dt; z.tick -= dt;
    if (z.tick <= 0) { z.tick += .5; for (const v of units) if (v.alive && v.team !== z.team && Math.hypot(v.gx - z.gx, v.gy - z.gy) <= z.rad + .05) damage(v, z.dmg, z.src); }
  }
  sim.zones = sim.zones.filter(z => z.t < z.dur);
  const pA = units.some(u => u.team === 'p' && u.alive), eA = units.some(u => u.team === 'e' && u.alive);
  if (!pA || !eA || sim.t > ROUND_CAP) {
    let w; if (pA && !eA) w = 'p'; else if (eA && !pA) w = 'e';
    else { const f = tm => team(tm).reduce((s, u) => s + Math.max(0, u.hp), 0) / Math.max(1, team(tm).reduce((s, u) => s + u.maxHp, 0)); const a = f('p'), b = f('e'); w = a === b ? pick(['p', 'e']) : a > b ? 'p' : 'e'; }
    endRound(w);
  }
}
function endRound(w) {
  G.state = 'result'; G.score[w]++; G.lastLoser = w === 'p' ? 'e' : 'p'; sim.proj = []; sim.domes = []; sim.beams = []; sim.zones = []; sim.vfx = []; sim.vfx = []; sim.events = [];
  banner(w === 'p' ? '¡Ronda ganada!' : 'Ronda perdida', w === 'p' ? 'win' : 'lose'); (w === 'p' ? sfx.win : sfx.lose)();
  for (const u of units) { u.move = null; if (u.alive && u.team === w) u.cheer = 2; }
  hint(w === 'p' ? '¡Bien hecho! El perdedor recibe más elíxir: ¡prepárate!' : 'Recibes 9 de elíxir para remontar');
  renderHud();
  later(2300, () => { if (G.score[w] >= WIN_ROUNDS) return endMatch(w); resetBoard(); startRound(); });
}
function resetBoard() {
  for (const u of units.filter(u => u.summon)) removeUnit(u);
  for (const u of units) { Object.assign(u, { alive: true, c: u.hc, r: u.hr, gx: u.hc + .5, gy: u.hr + .5, move: null, dying: 0, shield: 0, domeT: 0, domeAmt: 0, stun: 0, slow: 0, inv: 0, root: 0, rage: 0, glow: false, energy: 0, lunge: 0, cheer: 0, faceT: null, face: 0, pop: .0001 }); u.rig.root.visible = true; u.rig.tint && u.rig.tint(1, 1, 1); stats(u); }
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
  if (w === 'p') { PROG.packs++; saveProg(); precargarSobre(); }
  $('#endPack').classList.toggle('hide', w !== 'p');
}
function stopMatch() {
  timers.forEach(clearTimeout); timers = [];
  for (const u of [...units]) removeUnit(u);
  G.state = 'idle'; parts = []; fxs = []; sim.proj = []; sim.domes = []; sim.beams = []; sim.zones = []; closeInfo();
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
    if (u.faceT) { const k = Math.sin(clamp(1 - u.lunge / .42, 0, 1) * Math.PI) * (u.lungeAmp || .22), dx = u.faceT.gx - u.gx, dy = u.faceT.gy - u.gy, l = Math.hypot(dx, dy) || 1; u.lx = dx / l * k; u.ly = dy / l * k; }
  }
  if (u.dash) { u.dash.t += dt / u.dash.dur; u.ly += Math.sin(Math.min(1, u.dash.t) * Math.PI) * u.dash.dy; if (u.dash.t >= 1) u.dash = null; }
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
function drawDomes(time, dt) {
  for (const d of sim.domes) {
    d.t += dt; if (!d.u.alive) d.t = Math.max(d.t, d.dur - .3);
    const u = d.u, tw = tileW(u.gy), k = Math.min(1, d.t / .35), out = Math.min(1, (d.dur - d.t) / .3), e = 1 - (1 - k) ** 3;
    const rx = tw * 2.35 * e, ry = tw * 2.0 * e, cy = u.sy + tw * .25; if (out <= 0 || rx < 2) continue;
    fx.save(); fx.globalCompositeOperation = 'lighter'; fx.globalAlpha = out * (.8 + Math.sin(time * 5) * .08);
    fx.beginPath(); fx.ellipse(u.sx, cy, rx, ry, 0, Math.PI, 0); fx.ellipse(u.sx, cy, rx, rx * .3, 0, 0, Math.PI); fx.closePath();
    const g = fx.createRadialGradient(u.sx, cy, rx * .2, u.sx, cy, rx); g.addColorStop(0, 'rgba(255,200,80,.03)'); g.addColorStop(.75, 'rgba(255,195,70,.16)'); g.addColorStop(1, 'rgba(255,225,130,.5)');
    fx.fillStyle = g; fx.fill(); fx.save(); fx.clip();
    fx.strokeStyle = 'rgba(255,225,140,.28)'; fx.lineWidth = 1.2; const hs = tw * .42; fx.beginPath();
    for (let j = -6; j <= 3; j++) for (let i = -7; i <= 7; i++) { const hx = u.sx + (i + (j & 1) * .5) * hs * 1.73, hy = cy + j * hs * 1.5; for (let a = 0; a < 6; a++) { const an = Math.PI / 3 * a + Math.PI / 6, px = hx + Math.cos(an) * hs, py = hy + Math.sin(an) * hs; a ? fx.lineTo(px, py) : fx.moveTo(px, py); } fx.closePath(); }
    fx.stroke(); fx.restore();
    fx.strokeStyle = 'rgba(255,235,160,.9)'; fx.lineWidth = 2.5; fx.beginPath(); fx.ellipse(u.sx, cy, rx, ry, 0, Math.PI, 0); fx.stroke();
    fx.strokeStyle = 'rgba(255,215,110,.75)'; fx.lineWidth = 3; fx.beginPath(); fx.ellipse(u.sx, cy, rx, rx * .3, 0, 0, Math.PI * 2); fx.stroke();
    fx.restore();
  }
  sim.domes = sim.domes.filter(d => d.t < d.dur);
}
function drawShields(time) {
  for (const u of units) {
    if (!(u.shield > 0 && u.alive)) continue;
    const r = (u.sy - u.top) * .62, cy = u.sy - r * .75;
    fx.save(); fx.globalCompositeOperation = 'lighter'; fx.globalAlpha = .3 + Math.sin(time * 6) * .07;
    const g = fx.createRadialGradient(u.sx, cy, r * .3, u.sx, cy, r);
    const sc = u.domeT > 0 ? '255,205,90' : u.type === 'rogue' ? '70,230,210' : '255,150,50';
    g.addColorStop(0, `rgba(${sc},0)`); g.addColorStop(.8, `rgba(${sc},.65)`); g.addColorStop(1, `rgba(${sc},0)`);
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
    drawZones(time); drawDomes(time, dt); drawSummons(time); drawBeams(dt); drawShields(time); drawStatus(time); drawVfx(dt, time); drawFrozen(); drawProjectiles(); drawParts();
    updateLabels();
  } else if (G.screen === 'detail') { viewerTick(); stageRender(rdt); }
  requestAnimationFrame(loop);
}
addEventListener('resize', () => { if (G.screen === 'battle') layout(); });

load(BOARD.src).then(i => {
  IMG.board = i; initBattle3D(); initStage();
  $('#loading').classList.add('hide'); show('home'); requestAnimationFrame(loop);
}).catch(e => { $('#loading').textContent = 'Error al cargar: ' + e; console.error(e); });

// gancho para pruebas automáticas
window.__game = { G, units: () => units, createUnit, upgrade, sim: () => sim, buy, reroll, startFight, setSpeed: s => { G.speed = s; }, openDetail, setAnim };
