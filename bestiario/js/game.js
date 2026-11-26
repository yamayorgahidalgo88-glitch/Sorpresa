import { createCharacter, createProp, setupScene, THREE } from './models.js';
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
    abilName: 'Reno fantasma', desc: 'Súper (se carga con 4 impactos del hueso): invoca un reno fantasma que pelea a cabezazos. El reno cae de un solo golpe, pero golpea cada 0,4 segundos.',
    lv: ['Desbloquea el súper: invoca un reno fantasma. Se carga con 4 impactos.', 'El súper se carga con 3 impactos.', 'El súper invoca 2 renos.'],
    all: ['pose', 'front', 'back', 'left', 'right', 'iso', 'top', 'bottom'] },
  gloop: { name: 'Aly', cost: 4, role: 'Asesino', color: '#7fbf1f', hp: 650, atk: 55, range: 1, as: 1.0, ms: 0.65, abil: 'super', charge: 5, sheet: true,
    atkName: 'Puñetazo radiactivo', atkDesc: 'golpea al enemigo de la casilla de al lado. Daño medio.',
    abilName: 'Portal radiactivo', desc: 'Súper (se carga con 5 básicos): teletransporta a su lado al rival con menos vida y le asesta un puñetazo radiactivo de daño medio-alto.',
    lv: ['Desbloquea el súper: trae a su lado al rival con menos vida y le da un puñetazo de daño medio-alto.', 'Los básicos pasan a hacer daño medio-alto.', 'El portal quita además un 10% de la vida del rival antes del golpe.'],
    all: ['pose', 'front', 'back', 'left', 'right', 'iso', 'top', 'bottom'] },
  tanko: { name: 'Mory', cost: 4, role: 'Artillero', color: '#7d86c8', hp: 850, atk: 100, range: 4, fwd: true, as: 1.25, ms: 0.9, abil: 'clash', sheet: true,
    atkName: 'Cañonazo', atkDesc: 'dispara una bala de cañón hacia delante (en línea recta o en diagonal), hasta 4 casillas. Daño alto. No atraviesa.',
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
  ayew: { name: 'Ayew', cost: 4, role: 'Rematador', color: '#ff9a3c', hp: 650, atk: 115, range: 4, ortho: true, as: 1.5, ms: 0.7, abil: 'clash',
    atkName: 'Toque y remate', atkDesc: 'alterna dos golpes: primero un toque de dedos que le cura un 5% de vida, y después un remate con el balón a 4 casillas en línea recta (nunca en diagonal). Daño muy alto.',
    abilName: 'Saque bombeado', desc: 'No tiene súper. Al empezar cada ronda lanza un balón bombeado al rival más alejado: tarda 2 segundos en caer y, si el rival se ha movido de su casilla, falla. Daño muy alto.',
    lv: ['Saque bombeado al rival más alejado al empezar la ronda.', 'El remate rebota contra los que estén detrás del objetivo en la misma línea, y el toque de dedos cura un 10%.', 'El saque lanza 3 balones a los 3 rivales más alejados, con daño medio.'],
    all: ['pose', 'front', 'back', 'left', 'right', 'iso', 'top', 'bottom'] },
  paira: { name: 'Paira', cost: 5, role: 'Luchador', color: '#e8282e', hp: 560, atk: 45, range: 1, front3: true, as: 1.8, ms: 0.65, abil: 'clash',
    atkName: 'Batazo', atkDesc: 'golpea con su bate la casilla de enfrente y una de las esquinas de delante, alternando izquierda y derecha. Daño medio-bajo. Empieza lento (1,8 s) y cada batazo es más rápido, hasta 0,25 s.',
    abilName: 'Deslizada', desc: 'No tiene súper. Al empezar cada ronda se desliza de rodillas, como al llegar a una base, hasta el rival más lejano, y manda por los aires a todos los que se cruzan (sin daño).',
    lv: ['Deslizada hacia el rival más lejano al empezar la ronda.', 'Los que se cruza quedan aturdidos 1 segundo.', 'Los batazos van siempre a la máxima velocidad, pero con daño bajo.'],
    all: ['pose', 'front', 'back', 'left', 'right', 'iso', 'top', 'bottom'] },
  jaspe: { name: 'Jaspe', cost: 3, role: 'Tanque', color: '#9b5cf0', hp: 900, atk: 40, range: 1, as: 1.3, ms: 0.85, abil: 'super', charge: 5,
    atkName: 'Terremoto', atkDesc: 'levanta los dos puños y golpea el suelo: el terremoto alcanza todas las casillas de alrededor. Daño bajo-medio en las de los lados, arriba y abajo, y daño medio en las diagonales.',
    abilName: 'Gran terremoto', desc: 'Súper (se carga con 5 básicos): un golpe al suelo con salto que hace daño medio-alto a todos los rivales de alrededor y los deja aturdidos 1,5 segundos (sin moverse ni atacar).',
    lv: ['Desbloquea el súper: Gran terremoto, con aturdimiento de 1,5 segundos.', 'Furia de amatista: si su vida baja del 30%, golpea cada 1 segundo y sus ojos se vuelven morados.', 'El súper hace daño alto.'],
    all: ['pose', 'front', 'back', 'left', 'right', 'iso', 'top', 'bottom'] },
  peipo: { name: 'Peipo', cost: 3, role: 'Luchador', color: '#e8452e', hp: 650, atk: 40, range: 1, as: 0.5, ms: 0.7, abil: 'super', charge: 8,
    atkName: 'Cuchilladas cruzadas', atkDesc: 'golpea muy rápido con su cuchillo de carnicero en golpes cruzados al enemigo de al lado. Daño bajo-medio.',
    abilName: 'Postre estrella', desc: 'Súper (se carga con 8 básicos): lanza el postre explosivo de su otra mano. Explota en cruz (la casilla donde cae y las 4 de alrededor) con daño medio y deja un charco pringoso 1,5 segundos: los enemigos atrapados no pueden moverse ni atacar.',
    lv: ['Desbloquea el súper: Postre estrella, explosión en cruz y charco pringoso.', 'El básico se recarga en 0,4 segundos.', 'El charco pringoso hace daño bajo cada 0,75 segundos a quien esté dentro.'],
    all: ['pose', 'front', 'back', 'left', 'right', 'iso', 'top', 'bottom'] },
  orion: { name: 'Orión', cost: 2, role: 'Lanzador', color: '#a46bff', hp: 560, atk: 6, range: 3, ortho: true, as: 0.4, ms: 0.7, abil: 'super', charge: 23,
    atkName: 'Ráfaga de rocas', atkDesc: 'lanza hacia delante una ráfaga de 5 de las rocas que flotan a su alrededor, hasta 3 casillas en línea recta (nunca en diagonal). Daño bajo por roca. Se recarga en 0,4 segundos.',
    abilName: 'Dardo paralizante', desc: 'Súper (se carga con 23 impactos de roca): lanza un dardo que atraviesa a todos los rivales en línea recta hasta 5 casillas. Daño bajo, pero los deja paralizados 1,5 segundos.',
    lv: ['Desbloquea el súper: Dardo paralizante, que perfora y paraliza 1,5 segundos.', 'La ráfaga lanza 8 rocas.', 'El básico se recarga en 0,25 segundos.'],
    all: ['pose', 'front', 'back', 'left', 'right', 'iso', 'top', 'bottom'] },
  sevora: { name: 'Sevora', cost: 5, role: 'Imitadora', color: '#8fd23a', hp: 560, atk: 55, range: 2, as: 0.9, ms: 0.75, abil: 'super', charge: 6, sheet: true,
    atkName: 'Mordida de raíz', atkDesc: 'la planta carnívora de su brazo se estira con su raíz y muerde a 2 casillas. Daño medio.',
    abilName: 'Mordida radiante', desc: 'Súper (se carga con 6 básicos): sus raíces brillan en verde hasta su siguiente mordisco. Al rival que muerda le copia el súper, un 5% más fuerte, y lo lanza en cuanto vuelve la planta.',
    lv: ['Desbloquea el súper: copia el súper del rival que muerda, un 5% más fuerte.', 'El básico y el súper llegan a 4 casillas.', 'El súper copiado es un 10% más fuerte.'],
    all: ['pose', 'front', 'back', 'left', 'right', 'iso', 'top', 'bottom'] },
};
const SUMMONS = {
  reno: { name: 'Reno fantasma', cost: 0, role: 'Invocación', color: '#5dffb8', hp: 1, fixedHp: true, atk: 45, range: 1, as: 0.4, ms: 0.42, abil: 'none' },
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
const PACE = 1, MOVE_PACE = 1.35;   // PACE: las recargas son exactamente las del diseño
const LVL_MULT = [0, 1, 1.3, 1.6], LVL_SCALE = [0, 0.66, 0.71, 0.77];
const FRONT_ROLES = ['Tanque', 'Luchador', 'Defensor', 'Asesino', 'Pistolera'];
const PAIRA_MIN = .25;
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
let ac = null;
// AJUSTES DE SONIDO (se guardan en el móvil). Volúmenes de 0 a 100.
const SET_KEY = 'bdb_ajustes_v1';
const SET = Object.assign({ mute: false, master: 100, music: 100, battle: 100, chars: 100, ui: 100 },
  (() => { try { return JSON.parse(localStorage.getItem(SET_KEY)) || {}; } catch (e) { return {}; } })());
const saveSet = () => { try { localStorage.setItem(SET_KEY, JSON.stringify(SET)); } catch (e) { } };
let sfxCat = 'ui';
function tone(f, d = 0.08, type = 'square', v = 0.04, slide = 1, delay = 0) {
  v *= SET.mute ? 0 : (SET.master / 100) * ((SET[sfxCat] ?? 100) / 100);
  if (!ac || v < 0.0002) return;
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
// cada sonido pertenece a una categoría de los ajustes
const SFX_CAT = { click: 'ui', place: 'ui', merge: 'ui', no: 'ui', hit: 'battle', boom: 'battle', die: 'battle', win: 'battle', lose: 'battle', round: 'battle', slash: 'chars', shoot: 'chars', super: 'chars' };
for (const k in sfx) { const f = sfx[k]; sfx[k] = (...a) => { sfxCat = SFX_CAT[k] || 'ui'; f(...a); }; }
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
  d.innerHTML = '<div class="row"><div class="st"></div><div class="hp"><b></b><i></i></div></div><div class="en"><i></i></div>';
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
  u.maxHp = u.def.fixedHp ? u.def.hp : Math.round(u.def.hp * m); u.atk = Math.round(u.def.atk * m);   // los ciervos de Wyrex caen de un golpe
  u.range = rangeOf(u.type, u.level); u.as = (u.type === 'peipo' && u.level >= 2 ? .4 : u.type === 'orion' && u.level >= 3 ? .25 : u.def.as) * PACE; u.baseAs = u.as; u.ms = u.def.ms * MOVE_PACE;
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
  Object.assign(ST, { renderer, scene, camera, rigs, w: 0, h: 0, mode: null });
}
const HOME_POS = { tanko: [-2.0, -1.2, 0.35], ogul: [-1.2, -1.2, 0.2], jess: [-0.4, -1.2, 0.07], denton: [0.4, -1.2, -0.07], sevora: [1.2, -1.2, -0.2], osko: [2.0, -1.2, -0.35], bolab: [-1.75, 0.35, 0.35], bushi: [-0.95, 0.5, 0.15], pomona: [0, 0.75, 0], rogue: [0.95, 0.5, -0.15], gloop: [1.75, 0.35, -0.35] };
function stageMount(mode) {
  const box = mode === 'home' ? $('#homeStage') : $('#viewer');
  if (ST.renderer.domElement.parentNode !== box) box.insertBefore(ST.renderer.domElement, box.querySelector('.tip'));
  ST.mode = mode; ST.w = 0;
  // solo se carga el modelo de la criatura que se está viendo (ahorra memoria en el móvil)
  for (const t of Object.keys(ST.rigs)) if (!VW || t !== VW.t) { ST.scene.remove(ST.rigs[t].pv); for (const m of Object.values(ST.rigs[t].rig.mats)) m.dispose && m.dispose(); delete ST.rigs[t]; }
  if (VW && !ST.rigs[VW.t]) { const pv = new THREE.Group(), rig = createCharacter(VW.t); pv.add(rig.root); ST.scene.add(pv); ST.rigs[VW.t] = { rig, pv, next: 2 }; }
  if (VW) { const { pv, rig } = ST.rigs[VW.t]; rig.atkT = rig.supT = -1; pv.visible = true; pv.position.set(0, 0, 0); }
}
function stageRender(dt) {
  const { renderer, scene, camera, rigs } = ST, box = renderer.domElement.parentNode; if (!box) return;
  const w = box.clientWidth, h = box.clientHeight; if (!w || !h) return;
  if (w !== ST.w || h !== ST.h) { ST.w = w; ST.h = h; renderer.setSize(w, h, false); camera.aspect = w / h; }
  if (ST.mode === 'home') {
    const d = Math.max(5.6, 4.9 / (0.4618 * camera.aspect));
    camera.position.set(0, 3.9, d * 0.92); camera.lookAt(0, 0.55, -0.35);
    for (const t of Object.keys(rigs)) {
      const r = rigs[t]; r.next -= dt;
      if (r.next <= 0) { r.rig.play(t === 'ogul' && Math.random() < .4 ? 'super' : 'attack'); r.next = rand(2.5, 5.5); }
      r.rig.update(dt);
    }
  } else if (VW) {
    const r = rigs[VW.t]; if (!r) return; const p = VW.pitch * Math.PI / 180, dist = 4.7;
    camera.position.set(0, 0.68 + Math.sin(p) * dist, Math.cos(p) * dist); camera.lookAt(0, 0.68, 0);
    r.pv.rotation.set(0, VW.yaw * Math.PI / 180, 0);
    if (VW.anim === 'attack' || VW.anim === 'super') { VW.loop -= dt; if (VW.loop <= 0) { r.rig.play(VW.anim); if (VW.anim === 'attack' && r.rig.tongueTo) setTimeout(() => r.rig.tongueTo(null), 60); VW.loop = 1.35; } }
    r.rig.update(dt, { moving: VW.anim === 'walk' });
  }
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
}

/* =========================================================
   NAVEGACIÓN ENTRE PANTALLAS
   ========================================================= */
const SCREENS = ['home', 'decks', 'detail', 'prebattle', 'shop-page', 'user', 'settings'];
const TAB_SCREEN = { shop: 'shop-page', bestiary: 'decks', battle: 'home', user: 'user', settings: 'settings' };
function show(screen) {
  G.screen = screen;
  for (const id of SCREENS) $('#' + id).classList.toggle('hide', id !== screen);
  const tab = Object.keys(TAB_SCREEN).find(k => TAB_SCREEN[k] === screen);
  $('#nav').classList.toggle('hide', !tab);
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  const battle = screen === 'battle';
  $('#battleHud').classList.toggle('hide', !battle);
  $('#scene').style.visibility = labelsEl.style.visibility = battle ? 'visible' : 'hidden';
  if (screen !== 'detail') VW = null;
  if (screen === 'detail') stageMount(screen);
  if (battle) layout();
  if (screen === 'home') { renderWallet(); renderHomeDeck(); syncHomeDeck(); setTimeout(openPendingPacks, 350); }
}
let decksScroll = 0;
document.querySelectorAll('[data-back]').forEach(b => b.onclick = () => {
  sfx.click();
  if (b.dataset.back === 'decks') { renderDecks(); show('decks'); $('#decks').scrollTop = decksScroll; } else show(b.dataset.back);
});
$('#goBattle').onclick = () => { initAudio(); sfx.click(); openPrebattle(); };
$('#pbDecks').onclick = () => { sfx.click(); openDecks(); };
$('#pbGo').onclick = () => { if (deckTypes().length < DECK_MAX) return sfx.no(); sfx.click(); show('battle'); newMatch(); };
document.querySelectorAll('#nav button').forEach(b => b.onclick = () => {
  initAudio(); sfx.click();
  const t = b.dataset.tab;
  if (G.screen === TAB_SCREEN[t]) return;
  if (t === 'bestiary') openDecks();
  else if (t === 'settings') { renderSettings(); show('settings'); }
  else show(TAB_SCREEN[t]);
});
$('#exit').onclick = () => { sfx.click(); stopMatch(); show('home'); };
$('#endMenu').onclick = () => { $('#end').classList.add('hide'); stopMatch(); show('home'); };
$('#again').onclick = () => { $('#end').classList.add('hide'); newMatch(); };

/* =========================================================
   BESTIARIO
   ========================================================= */
/* =========================================================
   PROGRESO DEL JUGADOR (se guarda en el móvil con localStorage)
   ========================================================= */
// Criaturas con las que se empieza. El resto se consiguen en sobres.
const STARTER = ['bolab', 'bushi', 'rogue', 'ogul', 'jess', 'sevora'];
// desbloqueados para todos, también en partidas guardadas de antes
// PRUEBAS: de momento todos desbloqueados (para volver a bloquearlos, deja aquí solo los que quieras)
const ALWAYS_UNLOCKED = Object.keys(CHARS);
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
      art = `<div class="rw-coin"><img src="assets/moneda.webp" alt=""></div>`;
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
let editDeck = 0;
function miniCard(t, extra = '') {
  const ch = CHARS[t], c = COLLECTION[t];
  return `<div class="dcard${c ? '' : ' locked'}" data-t="${t}" style="--fam:${ch.color}"><img src="${src(t, 'pose')}" alt=""><div class="dcost">${ch.cost}</div>${c ? `<div class="dlv">Nv.${c.level}</div>` : '<div class="dlock">🔒</div>'}<div class="band"><div class="nm">${ch.name}</div></div>${extra}</div>`;
}
function slotsHtml(deck) {
  return Array.from({ length: DECK_MAX }, (_, i) => deck[i] ? miniCard(deck[i]) : '<div class="dslot"><span>+</span></div>').join('');
}
const deckFull = deck => deck.filter(owns).length >= DECK_MAX;   // solo se puede jugar con el mazo completo
function deckInfo(deck) {
  if (!deck.length) return 'Mazo vacío · <span class="warn">añade 6 bestias para poder jugar</span>';
  const avg = deck.reduce((a, t) => a + CHARS[t].cost, 0) / deck.length;
  return `${deck.length}/${DECK_MAX} · Coste medio <b>${avg.toFixed(1).replace('.', ',')}</b>` + (deck.length < DECK_MAX ? ` · <span class="warn">${DECK_MAX - deck.length === 1 ? 'falta 1' : 'faltan ' + (DECK_MAX - deck.length)} para poder jugar</span>` : '');
}
function openDecks() {
  editDeck = PROG.deck; renderDecks(); show('decks'); $('#decks').scrollTop = 0;
}
function renderDecks() {
  const deck = PROG.decks[editDeck];
  $('#dkCount').textContent = `Mazo ${PROG.deck + 1} en uso · ${TYPES.filter(owns).length}/${TYPES.length} personajes`;
  $('#dtabs').innerHTML = PROG.decks.map((d, i) => `<button class="dtab${i === editDeck ? ' on' : ''}${i === PROG.deck ? ' sel' : ''}" data-i="${i}">${i + 1}${i === PROG.deck ? '<i>✓</i>' : ''}</button>`).join('');
  $('#dslots').innerHTML = slotsHtml(deck);
  $('#dkInfo').innerHTML = deckInfo(deck);
  const sb = $('#dkSelect'), isSel = editDeck === PROG.deck;
  sb.textContent = isSel ? '✓ Seleccionado' : 'Seleccionar'; sb.disabled = isSel || !deckFull(deck);
  sb.className = 'btn ' + (isSel ? 'gold' : 'green');
  $('#dcoll').innerHTML = TYPES.map(t => miniCard(t, (deck.includes(t) ? '<div class="inDeck o">✓</div>' : '') + '<button class="dinfo" aria-label="Ver datos">i</button>')).join('');
  document.querySelectorAll('#dcoll .dcard').forEach(el => { if (deck.includes(el.dataset.t)) el.classList.add('used'); });
  document.querySelectorAll('.dtab').forEach(b => b.onclick = () => { sfx.click(); editDeck = +b.dataset.i; renderDecks(); });
  document.querySelectorAll('#dslots .dcard').forEach(el => el.onclick = () => {
    sfx.click(); deck.splice(deck.indexOf(el.dataset.t), 1); saveProg(); renderDecks();
  });
  document.querySelectorAll('#dcoll .dinfo').forEach(b => b.onclick = e => { e.stopPropagation(); decksScroll = $('#decks').scrollTop; sfx.click(); openDetail(b.parentElement.dataset.t); });
  document.querySelectorAll('#dcoll .dcard').forEach(el => el.onclick = () => {
    const tp = el.dataset.t;
    if (!owns(tp)) { decksScroll = $('#decks').scrollTop; sfx.click(); openDetail(tp); return; }   // sin desbloquear: solo se puede ver
    if (deck.includes(tp)) { deck.splice(deck.indexOf(tp), 1); sfx.click(); }
    else if (deck.length >= DECK_MAX) { sfx.no(); $('#dkInfo').innerHTML = '<span class="warn">¡Mazo lleno! Quita una bestia primero</span>'; return; }
    else { deck.push(tp); sfx.place(); }
    saveProg(); renderDecks();
  });
}
$('#dkSelect').onclick = () => {
  if (!deckFull(PROG.decks[editDeck])) return sfx.no();
  PROG.deck = editDeck; saveProg(); sfx.merge(); renderDecks();
};
/* =========================================================
   AJUSTES
   ========================================================= */
const SND_ROWS = [
  ['master', '🔊', 'Volumen general', 'Todo el juego a la vez', 'click'],
  ['music', '🎵', 'Música de fondo', 'Aún no hay música; el ajuste ya queda guardado', 'click'],
  ['battle', '⚔️', 'Sonidos de batalla', 'Golpes, explosiones, victoria y derrota', 'hit'],
  ['chars', '🐾', 'Sonidos de personajes', 'Ataques, disparos y trucos', 'slash'],
  ['ui', '👆', 'Botones y menús', 'Clics, colocar y subir de nivel', 'click'],
];
function renderSettings() {
  $('#sndBox').innerHTML = `<div class="setrow mute"><div class="stxt"><b>Silenciar todo</b><small>Apaga todos los sonidos del juego</small></div>
    <button class="switch${SET.mute ? ' on' : ''}" id="muteAll" role="switch" aria-checked="${!!SET.mute}"><i></i></button></div>` +
    SND_ROWS.map(([k, ic, nm, sub]) => `<div class="setrow vol" data-k="${k}"><span class="sic">${ic}</span><div class="stxt"><b>${nm}</b><small>${sub}</small>
      <div class="sl"><input type="range" min="0" max="100" step="5" value="${SET[k]}" aria-label="${nm}"><output class="o">${SET[k]}</output></div></div></div>`).join('');
  const refresh = () => $('#sndBox').classList.toggle('muted', !!SET.mute);
  refresh();
  $('#muteAll').onclick = e => {
    SET.mute = !SET.mute; saveSet(); e.currentTarget.classList.toggle('on', SET.mute); e.currentTarget.setAttribute('aria-checked', SET.mute); refresh(); initAudio(); sfx.click();
  };
  document.querySelectorAll('#sndBox .vol').forEach(row => {
    const k = row.dataset.k, inp = row.querySelector('input'), out = row.querySelector('output'), probe = SND_ROWS.find(r => r[0] === k)[4];
    inp.oninput = () => { SET[k] = +inp.value; out.textContent = inp.value; inp.style.setProperty('--v', inp.value + '%'); };
    inp.onchange = () => { saveSet(); initAudio(); if (SET.mute) { SET.mute = false; saveSet(); renderSettings(); return; } sfx[probe](); };
    inp.style.setProperty('--v', inp.value + '%');
  });
  const rb = $('#resetBtn'); let armed = 0;
  rb.onclick = () => {
    if (!armed) { armed = 1; rb.textContent = '¿Seguro?'; sfx.no(); setTimeout(() => { armed = 0; rb.textContent = 'Borrar'; }, 3000); return; }
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { }
    location.reload();
  };
}
function openPrebattle() {
  const deck = PROG.decks[PROG.deck];
  $('#pbName').textContent = `Mazo ${PROG.deck + 1}`;
  $('#pbSlots').innerHTML = slotsHtml(deck);
  $('#pbNote').innerHTML = deckFull(deck) ? deckInfo(deck) : `<span class="warn">Tu mazo tiene ${deck.length}/${DECK_MAX} bestias: complétalo en Mazos para poder jugar</span>`;
  $('#pbGo').disabled = !deckFull(deck);
  show('prebattle');
}
(function embers() {
  const box = $('#embers'); if (!box) return;
  box.innerHTML = Array.from({ length: 18 }, () => {
    const s = 3 + Math.random() * 6;
    return `<i style="left:${Math.random() * 100}%;width:${s}px;height:${s}px;animation-duration:${7 + Math.random() * 7}s;animation-delay:${-Math.random() * 14}s;--dx:${(Math.random() - .5) * 80}px"></i>`;
  }).join('');
})();
/* ---------- Pantalla de inicio: imagen animada con el mazo sobre las rocas ---------- */
// Coordenadas sobre la imagen inicio.webp (941x1672). La primera roca (la de arriba) es para la primera bestia del mazo.
const HIMG = { w: 941, h: 1672 };
const HROCKS = [[480, 372], [470, 692], [200, 812], [760, 862], [210, 1148], [735, 1162]];
const HFALLS = [   // cascadas: [arriba-izq, arriba-dcha, abajo-dcha, abajo-izq]
  [[592, 332], [822, 332], [802, 565], [600, 565]],
  [[664, 596], [812, 596], [802, 812], [668, 812]],
  [[522, 852], [654, 852], [612, 1140], [487, 1140]],
];
const HGLOW = [[207, 440, '120,230,255', 150], [867, 800, '120,230,255', 110], [333, 1093, '120,230,255', 70],
  [93, 547, '220,140,255', 70], [120, 1027, '220,140,255', 95], [887, 987, '220,140,255', 95], [887, 1267, '220,140,255', 85], [117, 1280, '220,140,255', 45],
  [710, 450, '120,255,200', 210], [735, 700, '120,255,220', 160], [560, 1000, '120,255,200', 170], [500, 1185, '100,230,255', 140]];
const HS = { ready: false, rigs: {}, types: [], t: 0 };
function initHome() {
  const gl = $('#hGL'), renderer = new THREE.WebGLRenderer({ canvas: gl, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const scene = new THREE.Scene(); setupScene(renderer, scene, { shadows: false });
  const camera = new THREE.OrthographicCamera(0, 1, 0, -1, -2000, 2000); camera.position.z = 1000;
  const flies = Array.from({ length: 26 }, () => ({ x: Math.random() * HIMG.w, y: 180 + Math.random() * 1150, p: Math.random() * 7, s: .4 + Math.random() * .8, r: 2 + Math.random() * 2.5 }));
  const stars = Array.from({ length: 30 }, () => ({ x: 330 + Math.random() * 450, y: 5 + Math.random() * 210, p: Math.random() * 7, s: .6 + Math.random() * 1.6, r: .8 + Math.random() * 1.4 }));
  const streaks = HFALLS.map(() => Array.from({ length: 22 }, () => ({ u: Math.random(), v: Math.random(), w: .02 + Math.random() * .05, l: .12 + Math.random() * .25, sp: .55 + Math.random() * .5 })));
  Object.assign(HS, { renderer, scene, camera, flies, stars, streaks, bk: $('#hFxB').getContext('2d'), fr: $('#hFxF').getContext('2d'), ready: true, w: 0, h: 0 });
}
function homeMap() {   // misma colocación que object-fit:cover centrado
  const W = innerWidth, H = innerHeight, s = Math.max(W / HIMG.w, H / HIMG.h);
  return { s, ox: (W - HIMG.w * s) / 2, oy: (H - HIMG.h * s) / 2, W, H };
}
function syncHomeDeck() {
  if (!HS.ready) initHome();
  const types = deckTypes().slice(0, HROCKS.length);
  for (const k of Object.keys(HS.rigs)) if (!types.includes(HS.rigs[k].type) || types.indexOf(HS.rigs[k].type) !== +k) { HS.scene.remove(HS.rigs[k].rig.root); delete HS.rigs[k]; }
  types.forEach((t, i) => { if (!HS.rigs[i]) { const rig = createCharacter(t); HS.scene.add(rig.root); HS.rigs[i] = { type: t, rig, yaw: (Math.random() - .5) * .5, next: 3 + Math.random() * 6, cheer: 0 }; } });
}
function homeTick(dt) {
  if (!HS.ready) return;
  HS.t += dt; const T = HS.t, M = homeMap(), { s, ox, oy, W, H } = M, P = (x, y) => [ox + x * s, oy + y * s];
  const dpr = Math.min(devicePixelRatio || 1, 2);
  if (W !== HS.w || H !== HS.h) {
    HS.w = W; HS.h = H; HS.renderer.setSize(W, H, false);
    for (const c of [$('#hFxB'), $('#hFxF')]) { c.width = W * dpr; c.height = H * dpr; }
    Object.assign(HS.camera, { left: 0, right: W, top: 0, bottom: -H }); HS.camera.updateProjectionMatrix();
  }
  // ---- fondo: agua de las cascadas, brillos de cristales y setas, sombras
  const b = HS.bk; b.setTransform(dpr, 0, 0, dpr, 0, 0); b.clearRect(0, 0, W, H);
  b.globalCompositeOperation = 'lighter';
  for (const [x, y, col, r] of HGLOW) { const a = .18 + .14 * Math.sin(T * 1.6 + x * .01 + y * .003), [px, py] = P(x, y), R = r * s;
    const g = b.createRadialGradient(px, py, 0, px, py, R); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); b.fillStyle = g; b.fillRect(px - R, py - R, R * 2, R * 2); }
  HFALLS.forEach((q, fi) => {
    const pt = (u, v) => { const tx = q[0][0] + (q[1][0] - q[0][0]) * u, ty = q[0][1] + (q[1][1] - q[0][1]) * u, bx = q[3][0] + (q[2][0] - q[3][0]) * u, by = q[3][1] + (q[2][1] - q[3][1]) * u; return P(tx + (bx - tx) * v, ty + (by - ty) * v); };
    b.save(); b.beginPath(); q.forEach(([x, y], i) => { const [px, py] = P(x, y); i ? b.lineTo(px, py) : b.moveTo(px, py); }); b.closePath(); b.clip();
    for (const st of HS.streaks[fi]) {
      st.v += dt * st.sp; if (st.v > 1 + st.l) { st.v = -st.l; st.u = Math.random(); }
      const [x0, y0] = pt(st.u, st.v - st.l), [x1, y1] = pt(st.u, st.v), wpx = st.w * Math.abs(q[1][0] - q[0][0]) * s;
      const g = b.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.7, 'rgba(235,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,.05)');
      b.strokeStyle = g; b.lineWidth = Math.max(1.5, wpx); b.lineCap = 'round'; b.beginPath(); b.moveTo(x0, y0); b.lineTo(x1, y1); b.stroke();
    }
    b.restore();
    // espuma al pie de cada cascada
    const [fx0, fy0] = P(q[3][0], q[3][1]), [fx1] = P(q[2][0], q[2][1]);
    for (let i = 0; i < 7; i++) { const k = (i + .5) / 7, ph = T * 3 + i * 1.7, px = fx0 + (fx1 - fx0) * k, r = s * (14 + 8 * Math.sin(ph));
      const g = b.createRadialGradient(px, fy0, 0, px, fy0, r); g.addColorStop(0, 'rgba(240,255,255,.45)'); g.addColorStop(1, 'rgba(200,255,255,0)'); b.fillStyle = g; b.beginPath(); b.arc(px, fy0 - r * .2, r, 0, 6.283); b.fill(); }
  });
  // ondas en la poza
  b.strokeStyle = 'rgba(220,255,255,.35)'; b.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) { const k = ((T * .35 + i / 4) % 1), [px, py] = P(510, 1175); b.globalAlpha = 1 - k; b.beginPath(); b.ellipse(px, py, (20 + 90 * k) * s, (6 + 24 * k) * s, 0, 0, 6.283); b.stroke(); }
  b.globalAlpha = 1; b.globalCompositeOperation = 'source-over';
  // sombras bajo las bestias
  for (const k of Object.keys(HS.rigs)) { const [x, y] = HROCKS[k], [px, py] = P(x, y); b.fillStyle = 'rgba(10,30,10,.35)'; b.beginPath(); b.ellipse(px, py + 4 * s, 62 * s, 16 * s, 0, 0, 6.283); b.fill(); }
  // ---- bestias en sus rocas (3D)
  for (const k of Object.keys(HS.rigs)) {
    const R = HS.rigs[k], [x, y] = HROCKS[k], [px, py] = P(x, y), size = 165 * s * (0.92 + y / HIMG.h * .16);
    R.next -= dt; if (R.next <= 0) { R.cheer = 1.4; R.next = 7 + Math.random() * 9; }
    if (R.cheer > 0) R.cheer -= dt;
    R.rig.root.position.set(px, -py, y * .1); R.rig.root.scale.setScalar(size); R.rig.root.rotation.set(.32, R.yaw + Math.sin(T * .4 + +k) * .12, 0);
    R.rig.update(dt, { cheer: R.cheer > 0 });
  }
  HS.renderer.render(HS.scene, HS.camera);
  // ---- delante: luciérnagas y estrellas que se encienden y apagan
  const f = HS.fr; f.setTransform(dpr, 0, 0, dpr, 0, 0); f.clearRect(0, 0, W, H); f.globalCompositeOperation = 'lighter';
  for (const st of HS.stars) { const a = Math.max(0, Math.sin(T * st.s + st.p)) ** 3, [px, py] = P(st.x, st.y); if (a < .02) continue;
    f.fillStyle = `rgba(255,255,240,${a})`; f.beginPath(); f.arc(px, py, st.r * Math.max(s, .5), 0, 6.283); f.fill();
    f.strokeStyle = `rgba(255,255,240,${a * .6})`; f.lineWidth = 1; const L = st.r * 4 * a * Math.max(s, .5); f.beginPath(); f.moveTo(px - L, py); f.lineTo(px + L, py); f.moveTo(px, py - L); f.lineTo(px, py + L); f.stroke(); }
  for (const fl of HS.flies) {
    fl.x += Math.sin(T * .7 * fl.s + fl.p) * 18 * dt; fl.y += Math.cos(T * .5 * fl.s + fl.p * 1.3) * 14 * dt - 4 * dt;
    if (fl.y < 150) fl.y = 1330; if (fl.x < -10) fl.x = HIMG.w + 10; if (fl.x > HIMG.w + 10) fl.x = -10;
    const a = .25 + .75 * Math.max(0, Math.sin(T * 1.8 * fl.s + fl.p)) ** 2, [px, py] = P(fl.x, fl.y), r = fl.r * Math.max(s, .55);
    const g = f.createRadialGradient(px, py, 0, px, py, r * 5); g.addColorStop(0, `rgba(255,240,140,${a})`); g.addColorStop(.25, `rgba(255,220,90,${a * .55})`); g.addColorStop(1, 'rgba(255,200,60,0)');
    f.fillStyle = g; f.beginPath(); f.arc(px, py, r * 5, 0, 6.283); f.fill();
  }
  f.globalCompositeOperation = 'source-over';
}
function renderHomeDeck() {
  // (el resumen del mazo ya no se muestra en el inicio)
}

function levelPanel(t) {
  if (!COLLECTION[t]) return `<div class="lvup"><div class="lvrow"><b>🔒 Aún no lo tienes</b></div><p class="idesc">Se desbloquea al conseguirlo en un sobre.</p></div>`;
  const c = COLLECTION[t], next = LEVEL_COST[c.level + 1];
  if (!next) return `<div class="lvup"><div class="lvrow"><b>Nivel máximo</b></div>${cardBar(t)}</div>`;
  const okC = c.cards >= next.cards, okM = PROG.coins >= next.coins;
  return `<div class="lvup"><div class="lvrow"><b>Subir a nivel ${c.level + 1}</b><span class="lvcoins${okM ? '' : ' no'}"><img src="assets/moneda.webp" alt="">${next.coins} <small>(tienes ${PROG.coins})</small></span></div>
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
  $('#dName').textContent = ch.name; $('#dLevel').textContent = COLLECTION[t] ? 'Nivel ' + lvl : 'Bloqueado';
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
const sellValue = u => Math.max(1, u.def.cost * u.level - 1);
// zona de venta: la tienda de abajo
const overShop = y => { const r = $('#panel').getBoundingClientRect(); return y > r.top - 6; };
function showSell(u) {
  const el = $('#sellDrop');
  if (!u) { el.classList.remove('on'); return; }
  el.querySelector('b').textContent = '+' + sellValue(u); el.classList.add('on');
}
function sell(u) {
  G.elixir.p = Math.min(ELIXIR_CAP, G.elixir.p + sellValue(u));
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
  if (u && u.team === 'p' && G.state === 'plan') html += `<button class="btn red" id="iSell">Vender +${sellValue(u)}</button>`;
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
    const sel = overShop(e.clientY); showSell(sel ? drag.u : null);
    if (sel) { hl = null; return; }
    drag.u.dragG = screenToGrid(e.clientX, e.clientY + 26);
    hl = { fn: (c, r) => isZone('p', r), t: tileAt(e.clientX, e.clientY + 26) };
  }
});
addEventListener('pointerup', e => {
  if (!drag) return;
  const d = drag; drag = null; hl = null; $('#ghost').style.display = 'none';
  if (d.kind === 'card') { if (!d.moved) buy(d.i); else { const t = tileAt(e.clientX, e.clientY + 10); if (t) buy(d.i, t); } return; }
  d.u.dragging = false; showSell(null);
  if (!d.moved) { openInfo(d.u.type, d.u); return; }
  if (overShop(e.clientY) && G.state === 'plan') { sell(d.u); return; }
  const t = tileAt(e.clientX, e.clientY + 26);
  if (!t || !isZone('p', t.r)) return;
  const o = unitAtHome(t.c, t.r); if (o === d.u) return;
  if (o) { o.hc = d.u.hc; o.hr = d.u.hr; o.c = o.hc; o.r = o.hr; }
  d.u.hc = d.u.c = t.c; d.u.hr = d.u.r = t.r; sfx.place();
});
addEventListener('pointercancel', () => { showSell(null); if (drag && drag.u) drag.u.dragging = false; drag = null; hl = null; $('#ghost').style.display = 'none'; });
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

// Formación táctica: el rival NO ve cómo has colocado en esta ronda. Solo recuerda tu formación de la ronda anterior
// (G.seenP) y con ella prevé lo que harás y recoloca sus criaturas, buscando la mejor disposición (prueba miles de cambios y se queda con la que mejor puntúa, como una IA de ajedrez).
const LINE_SHOOTERS = { osko: 1, ayew: 1, orion: 1 };          // solo atacan en línea recta (sin diagonal)
const AOE_TYPES = { ogul: 1, jaspe: 1, peipo: 1, bushi: 1, pomona: 0 };
function aiArrange(P) {
  const E = team('e'); if (E.length < 2 && !P.length) return;
  const D = u => CHARS[u.type] || SUMMONS[u.type];
  const isFront = u => FRONT_ROLES.includes(D(u).role) || D(u).range <= 1;
  const tank = u => D(u).hp >= 650 || D(u).role === 'Tanque' || D(u).role === 'Defensor';
  const imp = u => (D(u).cost || 1) * (1 + .5 * (u.level - 1));
  const frag = u => Math.max(0, 1 - D(u).hp / 900) + (isFront(u) ? 0 : .3);    // lo que le duele recibir daño
  const pType = t => P.filter(p => p.type === t);
  const aoeN = P.filter(p => AOE_TYPES[p.type]).length;
  const far = (from, pos, n) => from.length ? E.map((e, i) => [i, Math.max(...from.map(f => Math.hypot(pos[i].c - f.hc, pos[i].r - f.hr)))]).sort((a, b) => b[1] - a[1]).slice(0, n).map(x => x[0]) : [];
  function score(pos) {
    let s = 0;
    E.forEach((e, i) => {
      const { c, r } = pos[i], depth = r - 4, d = D(e);
      // profundidad: los de cuerpo a cuerpo delante, los de distancia detrás
      s += isFront(e) ? -depth * 1.1 : -(3 - depth) * .8 * Math.min(1, (d.range || 1) / 3);
      // ataque: los que tiran en línea buscan columna con rivales; los de cuerpo a cuerpo van a por los de distancia del jugador
      for (const p of P) {
        const dc = Math.abs(p.hc - c), dr = r - p.hr;
        if (LINE_SHOOTERS[e.type] && dc === 0 && dr <= d.range + 2) s += .9 * imp(p) / 3;
        if (e.type === 'tanko' && (dc === 0 || dc === dr) && dr <= 4) s += 1 * imp(p) / 3;
        if (e.type === 'bolab' && dc === 0 && dr >= 1 && dr <= 3) s += 1.3;
        if (e.type === 'denton' && dc === 0 && dr <= 3) s += .8;
        if (isFront(e) && !isFront(p)) s += .5 * imp(p) / 3 / (1 + dc);
        // defensa: no dejar a los frágiles en la línea de tiro del jugador
        if (LINE_SHOOTERS[p.type] && dc === 0) s -= 1.1 * frag(e);
        if (p.type === 'tanko' && (dc === 0 || dc === dr)) { const first = !E.some((o, j) => j !== i && pos[j].c === c && pos[j].r < r && (dc === 0)); s -= (first ? 1.6 : .4) * frag(e); }
        if (p.type === 'bolab' && dc === 0 && dr >= 1 && dr <= 3) s -= 1 * frag(e) + .3;
        if (p.type === 'denton' && dc === 0 && dr <= 3) s -= .6 * frag(e);
        if (p.type === 'jess' && dc <= 1 && dr <= (p.level >= 2 ? 2 : 1)) s -= .7 * frag(e);
      }
      // protección: un frágil con un tanque aliado delante, en su columna
      if (frag(e) > .4 && E.some((o, j) => j !== i && tank(o) && pos[j].c === c && pos[j].r < r)) s += .9;
      // contra daño en área: no amontonarse
      if (aoeN) E.forEach((o, j) => { if (j > i && Math.max(Math.abs(pos[j].c - c), Math.abs(pos[j].r - r)) === 1) s -= .3 * aoeN; });
    });
    // Ayew (saque) y Paira (deslizada) van a por el más alejado: que sea alguien que aguante
    const ay = pType('ayew'), pa = pType('paira');
    for (const i of far(ay, pos, ay.some(u => u.level >= 3) ? 3 : 1)) s -= 2 * frag(E[i]);
    for (const i of far(pa, pos, 1)) s -= 1.6 * frag(E[i]) - (tank(E[i]) ? .6 : 0);
    return s;
  }
  const tiles = []; for (let r = 4; r < ROWS; r++) for (let c = 0; c < COLS; c++) tiles.push({ c, r });
  const kf = (p) => p.c + ',' + p.r;
  let best = E.map(e => ({ c: e.hc, r: e.hr })), bestS = score(best);
  for (let run = 0; run < 4; run++) {
    let cur = run === 0 ? best.map(p => ({ ...p })) : shuffle(tiles.slice()).slice(0, E.length).map(p => ({ ...p })), cs = score(cur);
    for (let it = 0, T = 1.2; it < 1500; it++, T *= .996) {
      const i = Math.floor(Math.random() * E.length), t = tiles[Math.floor(Math.random() * tiles.length)];
      const j = cur.findIndex(p => p.c === t.c && p.r === t.r); if (j === i) continue;
      const old = cur[i]; cur[i] = { ...t }; if (j >= 0) cur[j] = old;
      const ns = score(cur);
      if (ns >= cs || Math.random() < Math.exp((ns - cs) / T)) { cs = ns; if (cs > bestS + 1e-9) { bestS = cs; best = cur.map(p => ({ ...p })); } }
      else { cur[i] = old; if (j >= 0) cur[j] = { ...t }; }
    }
  }
  E.forEach((e, i) => { e.hc = e.c = best[i].c; e.hr = e.r = best[i].r; });   // se deslizan a su nueva casilla durante el «¡A luchar!»
}

/* =========================================================
   COMBATE
   ========================================================= */
const newSim = () => ({ t: 0, events: [], proj: [], domes: [], beams: [], zones: [], vfx: [], quakes: [], marks: [], trails: [] });
const fwd = u => u.team === 'p' ? 1 : -1;
const vfx = o => sim.vfx.push({ t: 0, dur: .6, ...o });
let occ = new Map(), sim = newSim(), timers = [];
const later = (ms, fn) => timers.push(setTimeout(fn, ms));
function setOcc(u, c, r) { if (u.occKey && occ.get(u.occKey) === u) occ.delete(u.occKey); u.occKey = key(c, r); occ.set(u.occKey, u); }
const enemiesOf = u => units.filter(v => v.alive && v.team !== u.team);
const schedule = (delay, fn) => sim.events.push({ at: sim.t + delay, fn });

function startFight() {
  if (G.state !== 'plan') return;
  closeInfo(); G.state = 'prefight'; aiPlan(); aiArrange(G.seenP || []);
  G.seenP = team('p').map(u => ({ type: u.type, level: u.level, hc: u.hc, hr: u.hr }));   // lo que verá el rival en la ronda siguiente
  renderHud();
  banner('¡A luchar!'); sfx.round(); hint('Combate automático: ¡mira cómo luchan tus criaturas!');
  later(1000, beginCombat);
}
function beginCombat() {
  occ.clear(); dropAllMeshes(); sim = newSim(); for (const u of units.filter(u => u.summon)) removeUnit(u);
  for (const u of units) { Object.assign(u, { c: u.hc, r: u.hr, alive: true, hp: u.maxHp, energy: 0, shield: 0, domeT: 0, domeAmt: 0, stun: 0, stunKind: null, slow: 0, inv: 0, root: 0, air: 0, anyDir: false, slid: false, hold: 0, bone: false, dash: null, rage: 0, glow: false, lungeAmp: 0, move: null, faceT: null, cd: rand(.3, .8), occKey: null }); u.rig.tint && u.rig.tint(1, 1, 1); setOcc(u, u.c, u.r); }
  for (const u of units) {
    const L = u.level;
    if (u.type === 'bolab') {
      if (L >= 3) { u.shield = Math.round(u.maxHp * .1); burstAt(u.gx, u.gy, .4, '#ff8a2a', 12, { glow: true, spd: 1, up: 1.5 }); }
      u.hold = 1; schedule(.12, () => placaje(u));
    } else if (u.type === 'rogue' && L >= 2) { u.shield = Math.round(u.maxHp * .1); burstAt(u.gx, u.gy, .4, '#45f5cf', 12, { glow: true, spd: 1, up: 1.5 }); }
    else if (u.type === 'tanko') { u.hold = .7; schedule(.2, () => iceCube(u)); }
    else if (u.type === 'denton') { u.hold = .8; schedule(.15, () => windShark(u)); }
    else if (u.type === 'bushi' && L >= 3) { u.hold = .7; schedule(.15, () => jadeWave(u)); }
    else if (u.type === 'ayew') { u.setNext = true; u.hold = .6; schedule(.15, () => serveBalls(u)); }
    else if (u.type === 'paira') { u.batAs = (L >= 3 ? PAIRA_MIN : u.def.as) * PACE; u.as = u.batAs; u.batSide = -1; u.hold = .3; schedule(.1, () => paireSlide(u)); }
  }
  G.state = 'fight'; renderHud();
}
const DIRS_P = [[0, 1], [-1, 1], [1, 1], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1]], DIRS_E = DIRS_P.map(([c, r]) => [c, -r]);
const inRange = (u, v, c = u.c, r = u.r) => {
  const dc = Math.abs(v.c - c), dr = Math.abs(v.r - r);
  if (u.def.front3) return u.slid ? Math.max(dc, dr) === 1 : dc <= 1 && (v.r - r) * fwd(u) === 1;   // la de enfrente y las esquinas de delante; tras la deslizada, cualquiera a su lado
  if (u.def.cone) return dc <= 1 && dr >= 1 && dr <= u.range;   // fila(s) de delante o de detrás, 3 de ancho
  if (u.def.fwd) return (dc === 0 || dc === dr) && dr >= 1 && dr <= u.range && ((v.r - r) * fwd(u) > 0 || u.anyDir);   // hacia delante: en línea recta o en diagonal
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
  if (u.type === 'jaspe' && u.level >= 2) {
    const fury = u.hp < u.maxHp * .3;
    if (fury !== !!u.fury) { u.fury = fury; u.as = fury ? 1 * PACE : u.baseAs; u.rig.eyes && u.rig.eyes(fury); if (fury) { floatText(u, '¡Furia de amatista!', 'sup'); burstAt(u.gx, u.gy, .7, '#c77dff', 20, { spd: 1.6, up: 2.2, glow: true }); } }
  }
  if (u.root > 0) u.root -= dt;
  if (u.stun > 0) { u.stun -= dt; return; }
  if (u.goo > 0) { u.goo -= dt; return; }   // pegado en el charco de Peipo: ni se mueve ni ataca
  if (u.slow > 0) { u.slow -= dt; dt *= .5; }
  if (u.hold > 0) { u.hold -= dt; return; }
  if (u.bone) return;
  u.cd -= dt;
  if (u.move) { u.move.t += dt / (u.move.dur || u.ms); if (u.move.t >= 1) { u.c = u.move.c; u.r = u.move.r; u.move = null; } return; }
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
function dropMesh(p) { if (p.mesh) { B3.scene.remove(p.mesh); p.mesh.userData.dispose && p.mesh.userData.dispose(); p.mesh = null; } }
const dropAllMeshes = () => sim.proj.forEach(dropMesh);
function shoot(u, t, o) { sim.proj.push({ gx: u.gx, gy: u.gy, t, tgx: t.gx, tgy: t.gy, p: 0, dur: Math.max(.2, Math.hypot(t.gx - u.gx, t.gy - u.gy) / (o.speed || 6)), ...o }); }
function updateProjectiles(dt) {
  for (const p of sim.proj) {
    if (p.free) { p.upd(p, dt); if (Math.random() < (p.mesh ? .25 : .7)) burstAt(p.x, p.y, p.h, p.color, 1, { spd: .15, up: .1, life: .35, size: p.size * .7, g: 0, glow: true }); continue; }
    p.p += dt / p.dur; if (p.t.alive) { p.tgx = p.t.gx; p.tgy = p.t.gy; }
    const k = Math.min(1, p.p); p.x = p.gx + (p.tgx - p.gx) * k; p.y = p.gy + (p.tgy - p.gy) * k; p.h = .75 + Math.sin(Math.PI * k) * (p.arc ?? .6);
    if (Math.random() < .7) burstAt(p.x, p.y, p.h, p.color, 1, { spd: .15, up: .1, life: .35, size: p.size * .7, g: 0, glow: true });
    if (p.p >= 1) { p.done = true; p.onHit(p); }
  }
  sim.proj = sim.proj.filter(p => !p.done);
}
function drawProjectiles() {
  for (const p of sim.proj) {
    if (p.x == null || p.mesh) continue;
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
    fx.restore();
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
    if (z.kind === 'goo') continue;   // el charco se dibuja en el suelo (drawGoo)
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
    } else if (e.kind === 'healwave') {   // onda sanadora de Pomona
      const tGrow = e.dur - .45, g0 = Math.min(1, e.t / tGrow), Rt = e.r * (1 - Math.pow(1 - g0, 1.6)), fade = e.t < tGrow ? 1 : Math.max(0, 1 - (e.t - tGrow) / .45);
      const rx = Math.abs(gridToScreen(gx + Rt, gy)[0] - x), ry = rx * .66;
      if (rx > 1) {
        fx.translate(x, y); fx.scale(1, ry / rx);
        const g = fx.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, `rgba(255,240,190,${.05 * fade})`); g.addColorStop(.72, C(.14 * fade)); g.addColorStop(.93, C(.5 * fade)); g.addColorStop(1, C(0));
        fx.fillStyle = g; fx.beginPath(); fx.arc(0, 0, rx, 0, Math.PI * 2); fx.fill();
        for (const [w, a] of [[.22, .3], [.09, .75], [.03, 1]]) { fx.strokeStyle = w < .05 ? `rgba(255,252,225,${a * fade})` : C(a * fade); fx.lineWidth = tw * w; fx.beginPath(); fx.arc(0, 0, rx * .98, 0, Math.PI * 2); fx.stroke(); }
        // segunda onda más suave detrás
        const r2 = rx * .62; fx.strokeStyle = C(.45 * fade); fx.lineWidth = tw * .05; fx.beginPath(); fx.arc(0, 0, r2, 0, Math.PI * 2); fx.stroke();
        fx.setTransform(dpr, 0, 0, dpr, 0, 0); fx.globalCompositeOperation = 'lighter';
        if (e.t < tGrow) for (let i = 0; i < 3; i++) { const an = Math.random() * 6.283; burstAt(gx + Math.cos(an) * Rt, gy + Math.sin(an) * Rt, .05, pick(['#ffd36a', '#fff3c0', '#ffe9a8']), 1, { spd: .3, up: 1.6, g: -1, life: .6, size: .06, glow: true }); }
      }
    } else if (e.kind === 'storm') {   // torbellino de jade del Giro de Bushi
      const grow = Math.min(1, k / .2), fade = Math.min(1, (1 - k) / .25), R0 = tw * 1.45;
      fx.save(); fx.translate(x, y); fx.scale(1, .62);
      const g = fx.createRadialGradient(0, 0, 0, 0, 0, R0 * grow); g.addColorStop(0, C(.35 * fade)); g.addColorStop(.7, C(.18 * fade)); g.addColorStop(1, C(0));
      fx.fillStyle = g; fx.beginPath(); fx.arc(0, 0, R0 * grow, 0, Math.PI * 2); fx.fill();
      fx.strokeStyle = C(.9 * fade); fx.lineWidth = tw * .05; fx.beginPath(); fx.arc(0, 0, R0 * grow, 0, Math.PI * 2); fx.stroke();
      for (let i = 0; i < 12; i++) { const an = i * .5236 + k * 3; fx.beginPath(); fx.moveTo(Math.cos(an) * R0 * .3 * grow, Math.sin(an) * R0 * .3 * grow); fx.lineTo(Math.cos(an + .08) * R0 * .95 * grow, Math.sin(an + .08) * R0 * .95 * grow); fx.lineWidth = tw * .015; fx.strokeStyle = C(.5 * fade); fx.stroke(); }
      fx.restore();
      // tres cintas en espiral que suben girando
      for (let i = 0; i < 3; i++) for (const [w, a] of [[.13, .35], [.06, .8], [.022, 1]]) {
        fx.strokeStyle = w < .03 ? `rgba(230,255,240,${a * fade})` : C(a * fade); fx.lineWidth = tw * w; fx.beginPath();
        for (let j = 0; j <= 26; j++) {
          const q = j / 26, h = q * tw * 1.9 * grow, R = tw * (.75 - .25 * q) * grow, an = -time * 13 + i * 2.094 + q * 5.2;
          const px = x + Math.cos(an) * R, py = y - h + Math.sin(an) * R * .38;
          j ? fx.lineTo(px, py) : fx.moveTo(px, py);
        }
        fx.stroke();
      }
      if (Math.random() < .9 * fade) { const an = Math.random() * 6.283; burstAt(gx + Math.cos(an) * .5, gy + Math.sin(an) * .5, rand(.1, 1.2), pick(['#5dffb0', '#b6ffd8', '#2fe08a', '#ffffff']), 2, { spd: 2.6, up: 1.2, g: 1, life: .55, size: .07, glow: true }); }
      if (k > .7 && !e.boom) { e.boom = 1; fxs.push({ gx, gy, r: 1.9, color: '#5dffb0', t: 0, dur: .5 }); burstAt(gx, gy, .2, '#5dffb0', 26, { spd: 4, up: 1.2, glow: true, size: .08 }); }
    } else if (e.kind === 'slash') {   // estela del tajo
      const tg = e.tgt, [x1, y1] = gridToScreen(tg.gx, tg.gy), mx = (x + x1) / 2, my = (y + y1) / 2 - tw * .45, a0 = Math.atan2(y1 - y, x1 - x);
      const R = tw * .55, fade = 1 - k, sweep = Math.min(1, k / .45) * 2.4;
      fx.translate(mx, my); fx.rotate(a0 - Math.PI / 2); if (e.flip) fx.scale(-1, 1);
      for (const [w, a] of [[.2, .35], [.1, .8], [.035, 1]]) { fx.strokeStyle = w < .05 ? `rgba(240,255,245,${fade})` : C(a * fade); fx.lineWidth = tw * w; fx.beginPath(); fx.arc(0, 0, R, -1.9 + sweep - 1.1, -1.9 + sweep); fx.stroke(); }
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
    if (u.rage > 0 || u.glow || u.fury) {   // furia morada de Jess / raíces radiantes de Sevora / furia de amatista de Jaspe
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
    if (u.stun > 0 && u.stunKind === 'daze') {
      fx.save(); for (let i = 0; i < 4; i++) { const an = time * 5 + i * 1.571, px = cx + Math.cos(an) * u.dw * .42, py = u.top + h * .08 + Math.sin(an) * h * .07, r = u.dw * .09;
        fx.fillStyle = i % 2 ? '#ffe46a' : '#d9a8ff'; fx.strokeStyle = '#2a1640'; fx.lineWidth = 1.5; fx.beginPath();
        for (let k = 0; k < 10; k++) { const a2 = k * Math.PI / 5 - Math.PI / 2, rr = k % 2 ? r * .45 : r; fx.lineTo(px + Math.cos(a2) * rr, py + Math.sin(a2) * rr); } fx.closePath(); fx.fill(); fx.stroke(); }
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
    if (!(u.stun > 0 && u.alive) || u.stunKind === 'para' || u.stunKind === 'daze' || u.stunKind === 'air') continue;
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
    const mesh = createProp('wyrex_hueso', .5); B3.scene.add(mesh);
    sim.proj.push({ free: true, kind: 'bone', mesh, color: '#5dffb8', size: .1, gx: ox, gy: oy, tgx: ox + dc * 2, tgy: oy + dr * 2, p: 0, x: ox, y: oy, h: .6,
      upd(p, dt) {
        mesh.position.set(p.x - 2.5, .5, 4 - p.y); mesh.rotation.set(-1.0, 0, (p.spin = (p.spin || 0) + dt * 16));
        p.p += dt / 1.05; const leg = p.p < .5 ? 0 : 1, k = Math.max(0, leg ? 2 - p.p * 2 : p.p * 2); p.x = ox + dc * 2 * k; p.y = oy + dr * 2 * k;
        for (const v of units) if (v.alive && v.team !== u.team && !hit[leg].has(v) && Math.hypot(v.gx - p.x, v.gy - p.y) < .5) {
          hit[leg].add(v); damage(v, u.atk, u); charge(u); sfx.hit(); burstAt(v.gx, v.gy, .5, '#5dffb8', 6, { glow: true, spd: 1.2 });
        }
        if (p.p >= 1) { p.done = true; u.bone = false; u.cd = .3; dropMesh(p); }
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
  if (u.rig.vineTo) u.rig.vineTo(() => { const r = t.rig.root.position; return new THREE.Vector3(r.x, r.y + .32, r.z); });
  else vfx({ kind: 'vine', u, tgt: t, glow, dur: .55 });
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
// Jaspe: golpe al suelo; terremoto en las 8 casillas de alrededor
function quake(u, big, o = {}) {
  const A = o.A ?? u.atk, L = o.L ?? u.level;
  u.rig.play(big ? 'super' : 'attack');
  schedule(big ? .3 : .25, () => {
    if (!u.alive) return;
    const cx = u.c, cy = u.r;
    sim.quakes.push({ gx: cx + .5, gy: cy + .5, t0: sim.t, t: 0, dur: big ? 1 : .75, big });
    shake = Math.max(shake, big ? 9 : 5); sfx.boom();
    burstAt(cx + .5, cy + .5, .05, '#b98cff', big ? 30 : 16, { spd: big ? 3.5 : 2.4, up: 1.8, glow: true });
    burstAt(cx + .5, cy + .5, .05, '#6a5a80', big ? 18 : 10, { spd: 2.6, up: 2.4, size: .08 });
    let hit = false;
    for (const v of enemiesOf(u)) {
      const dc = Math.abs(v.c - cx), dr = Math.abs(v.r - cy); if (Math.max(dc, dr) !== 1) continue;
      hit = true;
      if (big) { damage(v, A * (L >= 3 ? 2.5 : 1.875), u, 'big'); if (v.alive) { v.stun = 1.5 * (o.P || 1); v.stunKind = 'daze'; floatText(v, '¡Aturdido!', 'sup'); } }
      else damage(v, A * (dc && dr ? 1.375 : 1), u);
      v.lunge = .25; v.lungeAmp = -.12; v.faceT = v.faceT || u;
    }
    if (!big && hit) charge(u);
  });
}
// ---------- Ayew ----------
const BALL = 'ayew_pelota';
function ballProj(o) {   // balón 3D que vuela de (ox,oy) a (tx,ty) con una altura; al llegar llama a hit()
  const mesh = createProp(BALL, o.size || .3); B3.scene.add(mesh);
  const p = { free: true, kind: 'ball3d', mesh, color: o.color || '#ffb347', size: .08, gx: o.ox, gy: o.oy, tgx: o.tx, tgy: o.ty, x: o.ox, y: o.oy, h: o.h0 || .7, p: 0,
    upd(p, dt) {
      p.p += dt / o.dur; const k = Math.min(1, p.p);
      p.x = o.ox + (o.tx - o.ox) * k; p.y = o.oy + (o.ty - o.oy) * k; p.h = (o.h0 || .7) + Math.sin(Math.PI * k) * (o.arc || 0) - k * ((o.h0 || .7) - (o.h1 ?? .4));
      mesh.position.set(p.x - 2.5, p.h, 4 - p.y); mesh.rotation.set(p.p * 14, p.p * 9, 0);
      if (p.p >= 1) { p.done = true; dropMesh(p); o.hit && o.hit(); }
    } };
  sim.proj.push(p); return p;
}
function volley(u, t) {
  const L = u.level;
  if (u.setNext !== false) {   // toque de dedos: el balón sube y baja sobre su cabeza y se cura
    u.setNext = false; u.rig.play('set'); u.rig.hideFeet && u.rig.hideFeet(.7);
    const g = u.gx, gy = u.gy;
    ballProj({ ox: g, oy: gy, tx: g, ty: gy, dur: .55, h0: 1.05, h1: 1.05, arc: .55, size: .22, color: '#9dffb0' });
    schedule(.3, () => {
      if (!u.alive) return;
      const h = Math.min(u.maxHp - u.hp, Math.round(u.maxHp * (L >= 2 ? .10 : .05)));
      if (h > 0) { u.hp += h; floatText(u, '+' + h, 'heal'); }
      burstAt(u.gx, u.gy, .9, '#9dffb0', 10, { glow: true, spd: .8, up: 1.6, g: -2 });
    });
    return;
  }
  u.setNext = true; u.rig.play('attack'); u.rig.hideFeet && u.rig.hideFeet(.6);   // remate
  const dc = Math.sign(t.c - u.c), dr = Math.sign(t.r - u.r);
  schedule(.25, () => {
    if (!u.alive) return;
    sfx.shoot();
    ballProj({ ox: u.gx, oy: u.gy, tx: t.gx, ty: t.gy, dur: .14 + Math.hypot(t.gx - u.gx, t.gy - u.gy) * .05, h0: 1.05, h1: .45, size: .26, hit: () => {
      if (t.alive) { damage(t, u.atk, u, 'big'); vfx({ kind: 'star', gx: t.gx, gy: t.gy, h: .5, color: '255,190,90', r: .9, dur: .3 }); burstAt(t.gx, t.gy, .5, '#ffcf6a', 12, { glow: true, spd: 2 }); sfx.hit(); shake = Math.max(shake, 3); }
      if (L >= 2) {   // rebote hacia los que estén detrás en la misma línea
        const behind = enemiesOf(u).filter(v => v !== t && (dc ? v.r === t.r && Math.sign(v.c - t.c) === dc : v.c === t.c && Math.sign(v.r - t.r) === dr)).sort((a, b) => Math.abs(a.c - t.c) + Math.abs(a.r - t.r) - Math.abs(b.c - t.c) - Math.abs(b.r - t.r));
        let from = t, delay = 0;
        for (const v of behind) {
          const f = from; delay += .12;
          schedule(delay, () => ballProj({ ox: f.gx, oy: f.gy, tx: v.gx, ty: v.gy, dur: .16, h0: .45, h1: .45, arc: .35, size: .22, hit: () => { if (v.alive) { damage(v, u.atk * .7, u); burstAt(v.gx, v.gy, .5, '#ffcf6a', 8, { glow: true, spd: 1.6 }); sfx.hit(); } } }));
          from = v;
        }
      }
    } });
  });
}
function serveBalls(u) {   // saque bombeado al rival (o a los 3 rivales) más alejados
  if (!u.alive) return;
  const L = u.level, n = L >= 3 ? 3 : 1, dmg = u.atk * (L >= 3 ? .48 : 1);
  const tg = enemiesOf(u).filter(v => !v.summon).sort((a, b) => Math.hypot(b.gx - u.gx, b.gy - u.gy) - Math.hypot(a.gx - u.gx, a.gy - u.gy)).slice(0, n);
  if (!tg.length) return;
  floatText(u, '¡Saque bombeado!', 'sup'); u.rig.play('super'); u.rig.hideFeet && u.rig.hideFeet(.9); sfx.shoot();
  tg.forEach((v, i) => schedule(.28 + i * .12, () => {
    if (!u.alive) return;
    const c = v.c, r = v.r;
    sim.marks.push({ c, r, t0: sim.t, dur: 2 });
    ballProj({ ox: u.gx, oy: u.gy, tx: c + .5, ty: r + .5, dur: 2, h0: 1, h1: .3, arc: 3.2, size: .3, hit: () => {
      vfx({ kind: 'flash', gx: c + .5, gy: r + .5, r: .9, color: '255,190,90', dur: .35 }); burstAt(c + .5, r + .5, .2, '#ffcf6a', 14, { spd: 2.2, up: 1.8, glow: true }); sfx.boom();
      if (v.alive && v.c === c && v.r === r && !v.move) { damage(v, dmg, u, 'big'); shake = Math.max(shake, 5); }
      else floatText({ sx: gridToScreen(c + .5, r + .5)[0], top: gridToScreen(c + .5, r + .5)[1] - 40 }, '¡Fallo!', '');
    } });
  }));
}
// ---------- Orión ----------
// ráfaga: las rocas que flotan a su alrededor salen una tras otra (alternando las manos) hacia el objetivo
function orionRocks(u, t) {
  const n = u.level >= 2 ? 8 : 5, gap = Math.min(.07, u.as * .8 / n);
  for (let i = 0; i < n; i++) schedule(.05 + i * gap, () => {
    if (!u.alive) return;
    if (i === 0) sfx.shoot();
    const ox = u.gx, oy = u.gy, tx = t.gx, ty = t.gy, len = Math.hypot(tx - ox, ty - oy) || 1, side = (i % 2 ? 1 : -1) * .22;
    const px = -(ty - oy) / len * side, py = (tx - ox) / len * side, dur = .1 + len * .07;
    const mesh = createProp('orion_roca', .19); B3.scene.add(mesh); const spin = [rand(8, 16), rand(6, 12)];
    sim.proj.push({ free: true, kind: 'rock', mesh, color: '#6b4a8a', size: .05, gx: ox, gy: oy, tgx: tx, tgy: ty, x: ox, y: oy, h: .6, p: 0,
      upd(p, dt) {
        p.p += dt / dur; const k = Math.min(1, p.p), w = 1 - k;
        p.x = ox + (tx - ox) * k + px * w; p.y = oy + (ty - oy) * k + py * w; p.h = .6 + Math.sin(Math.PI * k) * .15 - k * .15;
        mesh.position.set(p.x - 2.5, p.h, 4 - p.y); mesh.rotation.set(p.p * spin[0], p.p * spin[1], 0);
        if (p.p >= 1) {
          p.done = true; dropMesh(p);
          if (t.alive && Math.hypot(t.gx - tx, t.gy - ty) < .7) { damage(t, u.atk, u); charge(u); burstAt(t.gx, t.gy, .5, '#b78cff', 4, { glow: true, spd: 1.4 }); if (i % 2 === 0) sfx.hit(); }
          else burstAt(tx, ty, .3, '#5a4470', 4, { spd: 1.2, up: 1 });
        }
      } });
  });
}
// súper: dardo morado que vuela 5 casillas en línea recta, atraviesa y paraliza
function orionDart(u, t, { A, L, P }) {
  let dc = Math.sign(t.c - u.c), dr = Math.sign(t.r - u.r);
  if (dc && dr) { if (Math.abs(t.c - u.c) > Math.abs(t.r - u.r)) dr = 0; else dc = 0; }
  if (!dc && !dr) dr = fwd(u);
  schedule(.3, () => {
    if (!u.alive) return; sfx.shoot();
    const ox = u.gx, oy = u.gy, tx = ox + dc * 5, ty = oy + dr * 5, dur = .45, hit = new Set();
    const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: 0xc58bff }), mat2 = new THREE.MeshBasicMaterial({ color: 0xf2dcff });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .42, 8), mat), tip = new THREE.Mesh(new THREE.ConeGeometry(.06, .16, 10), mat2), fin = new THREE.Mesh(new THREE.ConeGeometry(.07, .1, 4), mat);
    tip.position.y = .29; fin.position.y = -.2; fin.rotation.x = Math.PI; g.add(body, tip, fin);
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dc, 0, -dr).normalize());
    g.userData.dispose = () => { [body, tip, fin].forEach(m => m.geometry.dispose()); mat.dispose(); mat2.dispose(); };
    B3.scene.add(g);
    sim.proj.push({ free: true, kind: 'dart', mesh: g, color: '#c58bff', size: .06, gx: ox, gy: oy, tgx: tx, tgy: ty, x: ox, y: oy, h: .6, p: 0,
      upd(p, dt) {
        p.p += dt / dur; const k = Math.min(1, p.p); p.x = ox + (tx - ox) * k; p.y = oy + (ty - oy) * k;
        g.position.set(p.x - 2.5, p.h, 4 - p.y);
        if (Math.random() < .6) burstAt(p.x, p.y, .6, '#c58bff', 1, { glow: true, spd: .3, up: .3 });
        for (const v of enemiesOf(u)) if (!hit.has(v) && Math.hypot(v.gx - p.x, v.gy - p.y) < .5) {
          hit.add(v); damage(v, A * 3, u, 'big');
          v.stun = Math.max(v.stun || 0, 1.5); v.stunKind = 'para'; floatText(v, '¡Paralizado!', 'sup');
          vfx({ kind: 'flash', gx: v.gx, gy: v.gy, r: .8, color: '197,139,255', dur: .3 }); burstAt(v.gx, v.gy, .5, '#e3c4ff', 10, { glow: true, spd: 2 }); sfx.hit();
        }
        if (p.p >= 1) { p.done = true; dropMesh(p); }
      } });
  });
}
// ---------- Paira ----------
function batSwing(u, t) {
  const side = u.batSide = -(u.batSide || -1);   // alterna una esquina y la otra
  const fc = Math.sign(t.c - u.c), fr = Math.sign(t.r - u.r) || (fc ? 0 : fwd(u));
  const front = { c: u.c + fc, r: u.r + fr };
  // las dos casillas junto a la de enfrente que también tocan a Paira; ordenadas izquierda / derecha
  const cand = [];
  for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) { const c = u.c + dc, r = u.r + dr; if ((dc || dr) && !(c === front.c && r === front.r) && Math.max(Math.abs(c - front.c), Math.abs(r - front.r)) === 1) cand.push({ c, r, x: fc * dr - fr * dc }); }
  cand.sort((a, b) => b.x - a.x);
  const corner = side > 0 ? cand[0] : cand[cand.length - 1], tiles = [front, corner].filter(Boolean);
  u.faceT = t; u.rig.play(side > 0 ? 'attack' : 'attack2'); u.lunge = .3; u.lungeAmp = .12; sfx.slash();
  schedule(.14, () => {
    if (!u.alive) return;
    if (corner) vfx({ kind: 'slash', u, tgt: { gx: (front.c + corner.c) / 2 + .5, gy: (front.r + corner.r) / 2 + .5 }, color: '255,120,90', dur: .2, flip: side > 0 ? 0 : 1 });
    let hit = false;
    for (const v of enemiesOf(u)) if (tiles.some(q => q.c === v.c && q.r === v.r)) { hit = true; damage(v, u.atk * (u.level >= 3 ? .67 : 1), u); burstAt(v.gx, v.gy, .55, '#ff7a5a', 9, { glow: true, spd: 1.8 }); }
    if (hit) sfx.hit();
    if (u.level < 3) { u.batAs = Math.max(PAIRA_MIN * PACE, u.batAs * .8); u.as = u.batAs; }
  });
}
function paireSlide(u) {   // deslizada de rodillas hasta el rival más lejano
  if (!u.alive) return;
  const far = enemiesOf(u).filter(v => !v.summon).sort((a, b) => Math.hypot(b.gx - u.gx, b.gy - u.gy) - Math.hypot(a.gx - u.gx, a.gy - u.gy))[0];
  if (!far) return;
  // casilla libre más cercana a ese rival, en su lado de llegada
  let dest = null, bd = 1e9;
  for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) {
    const c = far.c + dc, r = far.r + dr; if ((!dc && !dr) || c < 0 || c >= COLS || r < 0 || r >= ROWS) continue;
    const o = occ.get(key(c, r)); if (o && o !== u) continue;
    const d = Math.hypot(c - u.c, r - u.r); if (d < bd) { bd = d; dest = { c, r }; }
  }
  if (!dest || (dest.c === u.c && dest.r === u.r)) return;
  const ox = u.gx, oy = u.gy, tx = dest.c + .5, ty = dest.r + .5, len = Math.hypot(tx - ox, ty - oy), dur = .25 + len * .1;
  floatText(u, '¡Deslizada!', 'sup'); u.rig.play('slide'); sfx.slash();
  setOcc(u, dest.c, dest.r); u.move = { fc: u.c, fr: u.r, c: dest.c, r: dest.r, t: 0, dur }; u.faceT = far; u.slid = true;
  sim.trails.push({ u, t0: sim.t, dur: dur + .35 });
  const L = u.level, done = new Set();
  for (const v of enemiesOf(u)) {
    const k = ((v.gx - ox) * (tx - ox) + (v.gy - oy) * (ty - oy)) / (len * len); if (k < 0 || k > 1.05) continue;
    const px = ox + (tx - ox) * k, py = oy + (ty - oy) * k; if (Math.hypot(v.gx - px, v.gy - py) > .62) continue;
    if (done.has(v)) continue; done.add(v);
    schedule(dur * Math.min(1, k), () => {
      if (!v.alive) return;
      v.air = .7; v.stun = Math.max(v.stun || 0, L >= 2 ? 1 : .7); v.stunKind = L >= 2 ? 'daze' : 'air';
      if (L >= 2) floatText(v, '¡Aturdido!', 'sup');
      burstAt(v.gx, v.gy, .2, '#ffffff', 10, { spd: 2.4, up: 2.6 }); burstAt(v.gx, v.gy, .2, '#ff7a5a', 8, { spd: 2, up: 2.2, glow: true }); sfx.hit(); shake = Math.max(shake, 4);
    });
  }
}
function attack(u, t) {
  if (u.def.abil === 'super' && !u.def.charge) u.energy = Math.min(100, u.energy + 22);
  u.rig.play('attack');
  if (u.type === 'ogul') return laser(u, t);
  if (u.type === 'jaspe') return quake(u, false);
  if (u.type === 'ayew') return volley(u, t);
  if (u.type === 'paira') return batSwing(u, t);
  if (u.type === 'orion') return orionRocks(u, t);
  if (u.type === 'jess') return pellets(u, t);
  if (u.type === 'sevora') return vineBite(u, t);
  if (u.type === 'osko') return bone(u, t);
  if (u.range <= 1 || u.def.melee) {
    u.lunge = .42; u.lungeAmp = 0;
    if (u.type === 'peipo') { sfx.slash(); schedule(.08, () => u.alive && vfx({ kind: 'slash', u, tgt: t, color: '255,235,225', dur: .14 })); schedule(.16, () => u.alive && vfx({ kind: 'slash', u, tgt: t, color: '255,120,100', dur: .14, flip: 1 })); }
    if (u.type === 'bushi') { sfx.slash(); schedule(.15, () => u.alive && vfx({ kind: 'slash', u, tgt: t, color: '93,255,176', dur: .24 })); }
    if (u.type === 'bolab' && u.level >= 2) { if (u.rig.tongueTo) schedule(.06, () => u.alive && u.rig.tongueTo(() => { const r = t.rig.root.position; return new THREE.Vector3(r.x, r.y + .25, r.z); })); else schedule(.1, () => u.alive && sim.beams.push({ ax: u.gx, ay: u.gy, bx: t.gx, by: t.gy, h: .42, color: '255,110,150', w: .16, t: 0, dur: .2 })); }
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
  if (T !== 'pomona') vfx({ kind: 'pillar', u, color: hexRgb(D.color), dur: .7 });
  if (T === 'sevora') {   // Mordida radiante: brilla hasta el siguiente mordisco
    u.glow = true; u.rig.tint && u.rig.tint(.75, 1.55, .6); u.cd = Math.min(u.cd, .6);
    burstAt(u.gx, u.gy, .5, '#b6ff2e', 22, { spd: 2, up: 2, glow: true }); return;
  }
  if (T === 'bolab') return placaje(u, { A });
  if (T === 'orion') return orionDart(u, t, { A, L, P });
  if (T === 'tanko') return iceCube(u, { L, A });
  if (T === 'denton') return windShark(u, { L, A });
  if (T === 'bushi') {
    vfx({ kind: 'spin', u, r: 1.5, color: '93,255,176', dur: .55 }); vfx({ kind: 'storm', u, color: '93,255,176', dur: .85 });
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
    // onda sanadora dorada que sale de ella; cada aliado dentro del radio recibe el escudo cuando la onda le llega
    schedule(.22, () => {
      if (!u.alive) return;
      const who = units.filter(v => v.alive && v.team === u.team && (v === u || L >= 3 || (L >= 2 && cheb(u, v) <= 1)));
      const ox = u.gx, oy = u.gy, SPD = 5.5, reach = Math.max(.75, ...who.map(v => Math.hypot(v.gx - ox, v.gy - oy) + .55));
      vfx({ kind: 'healwave', gx: ox, gy: oy, r: reach, color: '255,205,90', dur: reach / SPD + .45 });
      u.root = 1; sfx.boom();
      for (const v of who) schedule(Math.hypot(v.gx - ox, v.gy - oy) / SPD, () => { if (!v.alive) return; v.inv = P; burstAt(v.gx, v.gy, .5, '#ffe9a8', 12, { spd: 1.2, up: 1.8, glow: true }); });
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
  } else if (T === 'jaspe') {
    quake(u, true, { A, L, P });
  } else if (T === 'peipo') {
    // postre estrella: bomba 3D en bombeo hasta la casilla del objetivo; explota en cruz y deja un charco pringoso
    const tc = t.c, tr = t.r, ox = u.gx, oy = u.gy, tx = tc + .5, ty = tr + .5, flight = .55 + Math.hypot(tx - ox, ty - oy) * .06;
    u.rig.hideProp && u.rig.hideProp(.3, flight + .9);
    schedule(.3, () => {
      if (!u.alive) return; sfx.shoot();
      const mesh = createProp('peipo_bomba', .38); B3.scene.add(mesh);
      sim.proj.push({ free: true, kind: 'bomb', mesh, color: '#ffb347', size: .1, gx: ox, gy: oy, tgx: tx, tgy: ty, x: ox, y: oy, h: .7, p: 0,
        upd(p, dt) {
          p.p += dt / flight; const k = Math.min(1, p.p); p.x = ox + (tx - ox) * k; p.y = oy + (ty - oy) * k; p.h = .7 + Math.sin(Math.PI * k) * 1.4 - k * .55;
          mesh.position.set(p.x - 2.5, p.h, 4 - p.y); mesh.rotation.set(k * 9, k * 4, 0);
          if (p.p >= 1) {
            p.done = true; dropMesh(p);
            const tiles = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => ({ c: tc + a, r: tr + b })).filter(q => q.c >= 0 && q.c < COLS && q.r >= 0 && q.r < ROWS);
            for (const v of enemiesOf(u)) if (tiles.some(q => q.c === v.c && q.r === v.r)) damage(v, A * 1.375, u, 'big');
            vfx({ kind: 'flash', gx: tx, gy: ty, r: 1.8, color: '255,170,70', dur: .45 }); fxs.push({ gx: tx, gy: ty, r: 1.6, color: '#ffb347', t: 0, dur: .5 });
            burstAt(tx, ty, .3, '#ff9a3c', 26, { spd: 3.5, up: 2.4, glow: true }); burstAt(tx, ty, .3, '#7a3a14', 14, { spd: 2.6, up: 2, size: .09 }); burstAt(tx, ty, .3, '#ff6fa8', 10, { spd: 3, up: 2.6, size: .06 });
            sfx.boom(); shake = Math.max(shake, 7);
            sim.zones.push({ kind: 'goo', tiles, team: u.team, src: u, t: 0, dur: 1.5 * P, tick: .75, dmg: L >= 3 ? A * .75 : 0, seed: Math.random() * 1000 });
          }
        } });
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
    if (z.kind === 'goo') {
      z.t += dt;
      for (const v of units) if (v.alive && v.team !== z.team && z.tiles.some(q => q.c === v.c && q.r === v.r)) v.goo = .06;
      if (z.dmg) { z.tick -= dt; if (z.tick <= 0) { z.tick += .75; for (const v of units) if (v.alive && v.team !== z.team && z.tiles.some(q => q.c === v.c && q.r === v.r)) damage(v, z.dmg, z.src); } }
      continue;
    }
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
  G.state = 'result'; G.score[w]++; G.lastLoser = w === 'p' ? 'e' : 'p'; dropAllMeshes(); sim.proj = []; sim.domes = []; sim.beams = []; sim.zones = []; sim.vfx = []; sim.quakes = []; sim.marks = []; sim.trails = []; sim.vfx = []; sim.events = [];
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
  G.state = 'idle'; parts = []; fxs = []; dropAllMeshes(); sim.proj = []; sim.domes = []; sim.beams = []; sim.zones = []; closeInfo();
}
function newMatch() {
  stopMatch();
  Object.assign(G, { round: 0, score: { p: 0, e: 0 }, elixir: { p: 0, e: 0 }, lastLoser: null, speed: 1, seenP: null });
  layout(); startRound();
}

/* =========================================================
   DIBUJO DE LA BATALLA
   ========================================================= */
function quad(c0, r0, c1, r1) {
  const p = [gridToScreen(c0, r0), gridToScreen(c1, r0), gridToScreen(c1, r1), gridToScreen(c0, r1)];
  ctx.beginPath(); ctx.moveTo(...p[0]); for (let i = 1; i < 4; i++) ctx.lineTo(...p[i]); ctx.closePath();
}
// charco de caramelo pringoso de Peipo (estilo de la imagen: brillante, naranja, con gotas)
function drawMarks() {
  for (const m of sim.marks) {
    const k = Math.min(1, (sim.t - m.t0) / m.dur), [x, y] = gridToScreen(m.c + .5, m.r + .5), tw = tileW(m.r + .5);
    ctx.save(); ctx.globalAlpha = .45 + .4 * Math.abs(Math.sin(sim.t * 8));
    ctx.strokeStyle = '#ffcf6a'; ctx.lineWidth = Math.max(2, tw * .05); ctx.setLineDash([tw * .12, tw * .08]);
    ctx.beginPath(); ctx.ellipse(x, y, tw * .42, tw * .28, 0, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(20,10,0,.35)'; ctx.beginPath(); ctx.ellipse(x, y, tw * .38 * k, tw * .25 * k, 0, 0, 6.283); ctx.fill(); ctx.restore();
  }
  sim.marks = sim.marks.filter(m => sim.t - m.t0 < m.dur);
  for (const tr of sim.trails) {   // polvo y surco de la deslizada
    const u = tr.u; if (!u.alive) continue;
    if (sim.t - tr.t0 < tr.dur - .3) burstAt(u.gx, u.gy, .02, pick(['#d8c3a5', '#bfa98a', '#fff1d6']), 2, { spd: 1.2, up: .8, life: .5, size: .07 });
  }
  sim.trails = sim.trails.filter(tr => sim.t - tr.t0 < tr.dur);
}
function drawQuakes() {
  for (const q of sim.quakes) {
    q.t = sim.t - q.t0;
    const k = q.t / q.dur, pop = Math.min(1, q.t / .08), a = Math.min(1, (1 - k) / .35);
    if (!IMG.quake || a <= 0) continue;
    const [x, y] = gridToScreen(q.gx, q.gy), tw = tileW(q.gy), w = tw * 3.15 * (.85 + .15 * pop) * (q.big ? 1.08 : 1), h = w * .62;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y + Math.sin(q.t * 70) * (1 - k) * 2); ctx.drawImage(IMG.quake, -w / 2, -h / 2, w, h); ctx.restore();
  }
  sim.quakes = sim.quakes.filter(q => q.t < q.dur);
}
function drawGoo() {
  for (const z of sim.zones) {
    if (z.kind !== 'goo') continue;
    const grow = Math.min(1, z.t / .18), a = Math.min(1, (z.dur - z.t) / .35), sp = 1 - Math.pow(1 - grow, 3);
    let rnd = z.seed; const R = () => (rnd = (rnd * 9301 + 49297) % 233280) / 233280;
    const blobs = z.tiles.map(q => ({ q, pts: Array.from({ length: 10 }, () => .42 + R() * .2) }));
    const drops = Array.from({ length: 9 }, () => { const q = z.tiles[Math.floor(R() * z.tiles.length)], an = R() * 6.283; return { gx: q.c + .5 + Math.cos(an) * (.55 + R() * .25), gy: q.r + .5 + Math.sin(an) * (.55 + R() * .25), s: .05 + R() * .07 }; });
    const path = b => { ctx.beginPath(); for (let i = 0; i <= 10; i++) { const an = (i % 10) / 10 * 6.283, rr = b.pts[i % 10] * sp, [px, py] = gridToScreen(b.q.c + .5 + Math.cos(an) * rr, b.q.r + .5 + Math.sin(an) * rr); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); };
    ctx.save(); ctx.globalAlpha = a; ctx.lineJoin = 'round';
    // sombra/borde oscuro
    ctx.fillStyle = 'rgba(120,40,8,.55)'; for (const b of blobs) { ctx.save(); ctx.translate(0, 3); path(b); ctx.fill(); ctx.restore(); }
    // cuerpo del caramelo
    const [cx, cy] = gridToScreen(z.tiles[0].c + .5, z.tiles[0].r + .5), tw = tileW(z.tiles[0].r + .5);
    const g = ctx.createRadialGradient(cx - tw * .3, cy - tw * .4, tw * .1, cx, cy, tw * 1.8); g.addColorStop(0, '#ffc77a'); g.addColorStop(.45, '#ff9235'); g.addColorStop(1, '#d4561a');
    ctx.fillStyle = g; for (const b of blobs) { path(b); ctx.fill(); }
    // brillos
    ctx.strokeStyle = 'rgba(255,245,225,.75)'; ctx.lineWidth = Math.max(2, tw * .05); ctx.lineCap = 'round';
    for (const b of blobs) { const [hx, hy] = gridToScreen(b.q.c + .38, b.q.r + .4); ctx.beginPath(); ctx.ellipse(hx, hy, tw * .2 * sp, tw * .07 * sp, -.35, Math.PI * 1.05, Math.PI * 1.75); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,250,235,.8)'; for (const b of blobs) { const [hx, hy] = gridToScreen(b.q.c + .66, b.q.r + .62); ctx.beginPath(); ctx.ellipse(hx, hy, tw * .045 * sp, tw * .025 * sp, -.3, 0, 6.283); ctx.fill(); }
    // gotas sueltas alrededor
    for (const d of drops) {
      const [dx, dy] = gridToScreen(d.gx, d.gy), r = tileW(d.gy) * d.s * sp;
      ctx.fillStyle = 'rgba(120,40,8,.5)'; ctx.beginPath(); ctx.ellipse(dx, dy + 2, r, r * .7, 0, 0, 6.283); ctx.fill();
      const gd = ctx.createRadialGradient(dx - r * .35, dy - r * .35, r * .1, dx, dy, r); gd.addColorStop(0, '#ffcf8a'); gd.addColorStop(1, '#d9601e');
      ctx.fillStyle = gd; ctx.beginPath(); ctx.ellipse(dx, dy, r, r * .7, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(dx - r * .35, dy - r * .25, r * .22, 0, 6.283); ctx.fill();
    }
    // burbuja que sube y estalla de vez en cuando
    if (Math.random() < .15) { const q = pick(z.tiles); burstAt(q.c + .5 + rand(-.3, .3), q.r + .5 + rand(-.3, .3), .02, '#ffb055', 1, { spd: .1, up: .5, g: 1, life: .4, size: .05 }); }
    ctx.restore();
  }
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
  drawGoo(); drawQuakes(); drawMarks();
  // marca de equipo en el suelo, discreta (el color fuerte va en la barra de vida)
  for (const u of units) {
    if (u.dying > 0 || u.summon) continue;
    const [x, y] = gridToScreen(u.gx, u.gy), tw = tileW(u.gy);
    ctx.save(); ctx.fillStyle = u.team === 'p' ? 'rgba(74,160,255,.22)' : 'rgba(255,77,94,.22)';
    ctx.beginPath(); ctx.ellipse(x, y, tw * .3, tw * .2, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
}
function updateUnitVisual(u, dt) {
  const fighting = G.state === 'fight' || G.state === 'result';
  let lift = 0;
  if (u.dragging && u.dragG) { u.gx += (u.dragG[0] - u.gx) * .5; u.gy += (u.dragG[1] - u.gy) * .5; lift = .4; }
  else if (u.move) {
    const t = Math.min(1, u.move.t), e = u.move.dur ? 1 - Math.pow(1 - t, 2) : t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    u.gx = u.move.fc + .5 + (u.move.c - u.move.fc) * e; u.gy = u.move.fr + .5 + (u.move.r - u.move.fr) * e;
  } else if (u.dying <= 0) { const k = Math.min(1, dt * 14); u.gx += (u.c + .5 - u.gx) * k; u.gy += (u.r + .5 - u.gy) * k; }
  if (u.air > 0) { u.air -= dt; const k = 1 - Math.max(0, u.air) / .7; lift += Math.sin(k * Math.PI) * 1.3; }
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
  else if (G.screen === 'home') homeTick(rdt);
  requestAnimationFrame(loop);
}
addEventListener('resize', () => { if (G.screen === 'battle') layout(); });

load('assets/jaspe_terremoto.webp').then(i => { IMG.quake = i; }).catch(() => {});
load(BOARD.src).then(i => {
  IMG.board = i; initBattle3D(); initStage();
  show('home'); requestAnimationFrame(loop);
  const L = window.__load || {}; L.finish = () => { const el = $('#loading'); el.classList.add('fade'); setTimeout(() => el.classList.add('hide'), 500); }; L.done = true;
  if (!window.__load) L.finish();
}).catch(e => { $('#loading .ltxt').textContent = 'Error al cargar: ' + e; console.error(e); });

// gancho para pruebas automáticas
window.__game = { G, B3, ST, createProp, units: () => units, createUnit, upgrade, sim: () => sim, buy, reroll, startFight, setSpeed: s => { G.speed = s; }, openDetail, setAnim };
