// Análisis de audio y generación de partituras (charts).
// 1) Se separa la canción en 3 bandas (graves, medios, agudos) con un OfflineAudioContext.
// 2) Se detectan los golpes (onsets) por flujo de energía.
// 3) Se estima el tempo (BPM) y la fase del compás para cuadrar las notas al ritmo.
// 4) Para cada dificultad se eligen los golpes más fuertes, se asignan carriles y notas largas.

export const ANALYSIS_VERSION = 10;

const SR = 22050;
const HOP = 256;               // ~11.6 ms por frame
const FPS = SR / HOP;
// El detector marca el golpe al principio de la subida de energía; el oído lo percibe un poco
// después. Medido con clics de tiempo exacto y con una canción real: +25 ms lo centra.
const ONSET_BIAS = 0.025;

const yieldUI = () => new Promise(r => setTimeout(r, 0));

export async function analyzeAudio(buffer, onProgress = () => {}) {
  onProgress(0.05, 'Separando bandas…');
  const len = Math.max(1, Math.ceil(buffer.duration * SR));
  const off = new OfflineAudioContext(3, len, SR);
  const src = off.createBufferSource();
  src.buffer = buffer;
  const merger = off.createChannelMerger(3);
  const mk = (type, f, q) => { const n = off.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; return n; };
  const lp = mk('lowpass', 170, 0.7), bp = mk('bandpass', 750, 0.45), hp = mk('highpass', 5200, 0.7);
  src.connect(lp); src.connect(bp); src.connect(hp);
  lp.connect(merger, 0, 0); bp.connect(merger, 0, 1); hp.connect(merger, 0, 2);
  merger.connect(off.destination);
  src.start();
  const rendered = await off.startRendering();
  onProgress(0.35, 'Buscando el ritmo…');
  await yieldUI();

  const nf = Math.floor(len / HOP) - 1;
  const bands = [0, 1, 2].map(b => {
    const x = rendered.getChannelData(b);
    const e = new Float32Array(nf);
    for (let i = 0; i < nf; i++) {
      let s = 0;
      const o = i * HOP, end = o + HOP * 2; // ventana de 512 con solape
      for (let j = o; j < end; j++) { const v = x[j] || 0; s += v * v; }
      e[i] = s / (HOP * 2);
    }
    return e;
  });
  await yieldUI();

  const mean = a => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s / Math.max(1, a.length); };
  const bandMean = bands.map(mean);
  const total = new Float32Array(nf);
  for (let i = 0; i < nf; i++) total[i] = bands[0][i] + bands[1][i] + bands[2][i];
  const totalMean = mean(total);

  // Flujo espectral simplificado: subida del log de energía por banda.
  const W = [1.0, 0.85, 0.65];
  const flux = bands.map((e, b) => {
    const eps = bandMean[b] * 0.02 + 1e-12;
    const f = new Float32Array(nf);
    let prev = Math.log(e[0] + eps);
    for (let i = 1; i < nf; i++) {
      const l = Math.log(e[i] + eps);
      f[i] = Math.max(0, l - prev);
      prev = l;
    }
    return f;
  });
  const fluxMean = flux.map(mean);
  const env = new Float32Array(nf);
  for (let i = 0; i < nf; i++) {
    env[i] = W[0] * flux[0][i] / (fluxMean[0] + 1e-9) + W[1] * flux[1][i] / (fluxMean[1] + 1e-9) + W[2] * flux[2][i] / (fluxMean[2] + 1e-9);
  }
  // suavizado leve
  const envS = new Float32Array(nf);
  for (let i = 1; i < nf - 1; i++) envS[i] = 0.25 * env[i - 1] + 0.5 * env[i] + 0.25 * env[i + 1];
  onProgress(0.55, 'Detectando golpes…');
  await yieldUI();

  // Umbral adaptativo con media móvil (±0.4 s)
  const R = Math.round(0.4 * FPS);
  const pre = new Float64Array(nf + 1);
  for (let i = 0; i < nf; i++) pre[i + 1] = pre[i] + envS[i];
  const gMean = pre[nf] / nf;
  const silent = totalMean * 0.04;

  let firstSound = -1, lastSound = 0;
  for (let i = 0; i < nf; i++) if (total[i] > silent) { if (firstSound < 0) firstSound = i; lastSound = i; }
  if (firstSound < 0) firstSound = 0;

  const midS = new Float32Array(nf);
  { const m = bands[1]; let acc = 0; const Wn = 5;
    for (let i = 0; i < nf; i++) { acc += m[i]; if (i >= Wn) acc -= m[i - Wn]; midS[i] = acc / Math.min(i + 1, Wn); } }
  const raw = [];
  for (let i = 3; i < nf - 3; i++) {
    const v = envS[i];
    if (v <= 0) continue;
    if (total[i] < silent) continue;
    const a = Math.max(0, i - R), z = Math.min(nf, i + R);
    const ma = (pre[z] - pre[a]) / (z - a);
    if (v < ma * 1.35 + gMean * 0.04) continue;
    let isMax = true;
    for (let k = -4; k <= 4; k++) if (k && envS[i + k] > v) { isMax = false; break; }
    if (!isMax) continue;
    // banda dominante
    let bb = 0, bv = -1;
    for (let b = 0; b < 3; b++) { const n = flux[b][i] / (fluxMean[b] + 1e-9) * W[b]; if (n > bv) { bv = n; bb = b; } }
    // sostenido: cuánto sigue sonando la voz/sinte (banda media suavizada) hasta caer ~9 dB
    // o hasta que empieza la siguiente sílaba
    let peak = 0;
    for (let k = 0; k < 9 && i + k < nf; k++) peak = Math.max(peak, midS[i + k]);
    let j = i + 9;
    const limit = Math.min(nf, i + Math.round(4 * FPS));
    while (j < limit && midS[j] > peak * 0.12 && !(flux[1][j] > fluxMean[1] * 4 && midS[j] > midS[j - 1] * 1.6)) j++;
    raw.push({ i, t: i / FPS + ONSET_BIAS, s: v, b: bb, sus: (j - i) / FPS });
  }
  // normaliza fuerza respecto al percentil 90
  const sorted = raw.map(o => o.s).sort((x, y) => x - y);
  const p90 = sorted[Math.floor(sorted.length * 0.9)] || 1;
  // fuerza = mezcla de global y local (±5 s), para que las partes suaves también tengan notas
  const localMax = new Float32Array(raw.length);
  for (let a = 0, i = 0; i < raw.length; i++) {
    let m = 0;
    while (raw[a].t < raw[i].t - 5) a++;
    for (let k = a; k < raw.length && raw[k].t <= raw[i].t + 5; k++) m = Math.max(m, raw[k].s);
    localMax[i] = m || 1;
  }
  for (let i = 0; i < raw.length; i++) {
    const o = raw[i];
    o.s = 0.5 * Math.min(1.5, o.s / p90) + 0.5 * Math.min(1, o.s / localMax[i]);
  }
  onProgress(0.7, 'Calculando el tempo…');
  await yieldUI();

  // ---- Tempo por autocorrelación del envolvente ----
  const minLag = Math.floor(60 * FPS / 190), maxLag = Math.ceil(60 * FPS / 60);
  const a0 = firstSound, a1 = Math.max(a0 + 10, lastSound);
  // envolvente sin componente continua (si no, la autocorrelación premia cualquier retardo)
  let em = 0; for (let i = a0; i < a1; i++) em += envS[i]; em /= Math.max(1, a1 - a0);
  const ec = new Float32Array(nf); for (let i = a0; i < a1; i++) ec[i] = envS[i] - em;
  const maxL4 = maxLag * 4 + 2;
  const ac = new Float64Array(maxL4 + 2);
  for (let lag = minLag; lag <= maxL4; lag++) {
    let s = 0;
    for (let i = a0; i + lag < a1; i++) s += ec[i] * ec[i + lag];
    ac[lag] = s;
  }
  const acAt = x => { const i = Math.floor(x), f = x - i; return (ac[i] || 0) * (1 - f) + (ac[i + 1] || 0) * f; };
  // "peine": el pulso real se repite en 1, 2, 3 y 4 periodos; uno falso (p. ej. 4/3 del real) no
  let bestLag = minLag, bestScore = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag += 0.25) {
    const bpm = 60 * FPS / lag;
    const comb = acAt(lag) + 0.75 * acAt(2 * lag) + 0.6 * acAt(3 * lag) + 0.5 * acAt(4 * lag);
    const prior = Math.exp(-0.5 * Math.pow(Math.log2(bpm / 105) / 0.9, 2));
    const sc = comb * prior;
    if (sc > bestScore) { bestScore = sc; bestLag = lag; }
  }
  let bpm0 = 60 * FPS / bestLag;
  // tempo "cómodo" para jugar: entre 70 y 160
  while (bpm0 < 70) bpm0 *= 2;
  while (bpm0 > 160) bpm0 /= 2;

  // Afinado fino de BPM + fase maximizando la energía en los pulsos
  const envAt = t => { const f = t * FPS; const i = Math.floor(f); if (i < 0 || i + 1 >= nf) return 0; const fr = f - i; return envS[i] * (1 - fr) + envS[i + 1] * fr; };
  const t0 = firstSound / FPS, t1 = lastSound / FPS;
  let best = { bpm: bpm0, phase: 0, sc: -1 };
  for (let db = -1.6; db <= 1.6; db += 0.04) {
    const bpm = bpm0 + db;
    const period = 60 / bpm;
    const nPh = 48;
    for (let p = 0; p < nPh; p++) {
      const phase = (p / nPh) * period;
      let s = 0;
      const kStart = Math.ceil((t0 - phase) / period);
      for (let t = phase + kStart * period; t < t1; t += period) s += envAt(t) + 0.5 * envAt(t + period / 2);
      if (s > best.sc) best = { bpm, phase, sc: s };
    }
  }
  await yieldUI();

  // ---- Seguimiento de pulsos uno a uno (programación dinámica, estilo Ellis 2007) ----
  // En vez de una rejilla fija (que se desfasa si el tempo no es exacto), cada pulso se elige
  // para caer en un golpe real manteniendo un periodo regular.
  const P = 60 * FPS / best.bpm;
  let sd = 0; for (let i = a0; i < a1; i++) sd += ec[i] * ec[i]; sd = Math.sqrt(sd / Math.max(1, a1 - a0)) || 1;
  const sc = new Float64Array(nf), from = new Int32Array(nf).fill(-1);
  const TIGHT = 100;
  for (let i = 0; i < nf; i++) {
    const loc = envS[i] / sd;
    let bv = -Infinity, bp = -1;
    const lo = Math.max(0, Math.floor(i - 2 * P)), hi = i - Math.round(P / 2);
    for (let q = lo; q <= hi; q++) {
      const pen = Math.log((i - q) / P);
      const v = sc[q] - TIGHT * pen * pen;
      if (v > bv) { bv = v; bp = q; }
    }
    if (bp >= 0 && bv > 0) { sc[i] = loc + bv; from[i] = bp; } else sc[i] = loc;
  }
  let last = a1 - 1, lv = -Infinity;
  for (let i = Math.max(0, Math.floor(a1 - P)); i < a1; i++) if (sc[i] > lv) { lv = sc[i]; last = i; }
  const bf = [];
  for (let i = last; i >= 0; i = from[i]) { bf.push(i); if (from[i] < 0) break; }
  bf.reverse();
  // ajuste fino de cada pulso al máximo local del envolvente (±2 frames) con interpolación
  const beats = bf.map(i => {
    let m = i; for (let k = -2; k <= 2; k++) if (envS[i + k] > envS[m]) m = i + k;
    const y0 = envS[m - 1] || 0, y1 = envS[m], y2 = envS[m + 1] || 0, dn = y0 - 2 * y1 + y2;
    return Math.round(((m + (dn ? 0.5 * (y0 - y2) / dn : 0)) / FPS + ONSET_BIAS) * 1000) / 1000;
  }).filter(t => t >= t0 - 0.5);
  if (beats.length > 8) {
    const ibis = beats.slice(1).map((t, k) => t - beats[k]).sort((x, y) => x - y);
    best.bpm = 60 / ibis[Math.floor(ibis.length / 2)];
    best.phase = beats[0];
  }

  // ¿Encajan los golpes con las corcheas de los pulsos?
  const sub8 = beatGrid(beats, 2);
  let near = 0, strong = 0;
  for (const o of raw) {
    if (o.s < 0.5) continue;
    strong++;
    if (Math.abs(nearestIn(sub8, o.t) - o.t) < 0.045) near++;
  }
  const gridFit = strong ? near / strong : 0;

  // ---- Intensidad por tramos (cada 0,5 s): estribillos y raps suben, estrofas suaves bajan ----
  onProgress(0.9, 'Buscando estribillos…');
  const STEP = 0.5, nS = Math.ceil(buffer.duration / STEP);
  const loud = new Float64Array(nS), dens = new Float64Array(nS), voc = new Float64Array(nS);
  for (let k = 0; k < nS; k++) {
    const a = Math.floor(k * STEP * FPS), z = Math.min(nf, Math.floor((k + 1) * STEP * FPS));
    let s = 0; for (let i = a; i < z; i++) s += total[i];
    loud[k] = Math.log(1e-9 + s / Math.max(1, z - a));
  }
  for (const o of raw) {
    // cuenta golpes en ±2 s alrededor de cada tramo
    const k0 = Math.max(0, Math.floor((o.t - 2) / STEP)), k1 = Math.min(nS - 1, Math.floor((o.t + 2) / STEP));
    for (let k = k0; k <= k1; k++) { dens[k] += o.s; if (o.b === 1) voc[k] += 1; }
  }
  const rankNorm = arr => {
    const s = [...arr].sort((x, y) => x - y);
    const lo = s[Math.floor(s.length * 0.08)], hi = s[Math.floor(s.length * 0.95)];
    return arr.map(v => Math.max(0, Math.min(1, (v - lo) / ((hi - lo) || 1))));
  };
  const nL = rankNorm(loud), nD = rankNorm(dens), nV = rankNorm(voc);
  let inten = nL.map((v, k) => 0.5 * v + 0.28 * nD[k] + 0.22 * nV[k]);
  // suavizado ±2 s para que siga secciones, no golpes sueltos
  const R2 = 4;
  inten = inten.map((_, k) => { let s = 0, c = 0; for (let j = k - R2; j <= k + R2; j++) if (j >= 0 && j < nS) { s += inten[j]; c++; } return s / c; });
  inten = rankNorm(inten);
  // "rap": muchos golpes de voz cortos (sílabas rápidas)
  const rap = nV.map((v, k) => (v > 0.7 && nD[k] > 0.55 ? 1 : 0));

  onProgress(0.95, 'Listo');
  return {
    intensity: { step: STEP, v: inten.map(x => Math.round(x * 100) / 100), rap },
    v: ANALYSIS_VERSION,
    duration: buffer.duration,
    bpm: Math.round(best.bpm * 100) / 100,
    phase: best.phase,
    beats,
    gridFit,
    firstSound: firstSound / FPS,
    lastSound: lastSound / FPS,
    onsets: raw.map(o => [Math.round(o.t * 1000) / 1000, Math.round(o.s * 1000) / 1000, o.b, Math.round(o.sus * 100) / 100]),
  };
}

// ---------- Generación de chart ----------

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

const CFG = {
  // Reglas sacadas del HARD original: ~5,4 pulsaciones/s, pico 6,5 en 1 s, separación mínima 130 ms.
  // NORMAL y EASY escalan a partir de ahí.
  easy:   { lanes: 3, nps: 1.4, gap: 0.42, minGap: 0.33, peak: 2.5, sub: 2, holdMin: 0.6, holdP: 0.6, chord: 0,    jack: 0.5, slideP: 0 },
  normal: { lanes: 4, nps: 2.4, gap: 0.27, minGap: 0.2,  peak: 4,   sub: 2, holdMin: 0.5, holdP: 0.5, chord: 0.08, jack: 0.3, slideP: 0.4 },
  hard:   { lanes: 7, nps: 3.6, gap: 0.18, minGap: 0.13, peak: 6.5, sub: 4, holdMin: 0.4, holdP: 0.5, chord: 0.2,  jack: 0.2, slideP: 0.7 },
};

export function makeChart(an, diffId, seedStr = '') {
  const cfg = CFG[diffId];
  const L = cfg.lanes;
  const rng = mulberry32(hashStr(seedStr + '|' + diffId));
  const period = 60 / an.bpm;
  const useGrid = an.gridFit >= 0.4 && an.beats && an.beats.length > 8;
  const step = period / cfg.sub;
  const grid = useGrid ? beatGrid(an.beats, cfg.sub) : [];
  const beatStep = period;

  // 1) candidatos ajustados a la rejilla
  const map = new Map();
  for (const [t, s, b, sus] of an.onsets) {
    if (s < 0.12) continue;
    let tt = t, onBeat = false;
    if (useGrid) {
      // sólo se cuadra al pulso si el golpe real está muy cerca; si no, se respeta su momento exacto
      const g = nearestIn(grid, t);
      if (Math.abs(g - t) <= 0.035) { tt = g; onBeat = Math.abs(nearestIn(an.beats, g) - g) < 1e-3; }
    }
    if (tt < 0.25 || tt > an.duration - 0.2) continue;
    const key = Math.round(tt * 1000);
    const I = intensityAt(an, tt);
    // la voz manda (como en el original las notas siguen la letra); en raps aún más
    const w = s * (onBeat ? (diffId === 'hard' ? 1.1 : 1.3) : 1) * (b === 1 ? 1.3 + 0.3 * rapAt(an, tt) : 1) * (0.75 + 0.5 * I);
    const prev = map.get(key);
    if (!prev || prev.w < w) map.set(key, { t: tt, s, w, b, sus, I });
  }
  const cand = [...map.values()].sort((a, b) => b.w - a.w);

  // 2) selección greedy por fuerza respetando el hueco mínimo
  const active = Math.max(10, an.lastSound - an.firstSound);
  const target = Math.round(active * cfg.nps);
  const picked = [];
  const times = []; // ordenados
  // en partes intensas (estribillo, rap) las notas pueden ir más juntas; en las suaves, más separadas
  const gapFor = I => Math.max(cfg.minGap, cfg.gap * Math.max(0.6, 1.3 - 0.7 * I));
  const fits = (t, I) => {
    const gp = gapFor(I);
    let lo = 0, hi = times.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (times[m] < t) lo = m + 1; else hi = m; }
    if (lo < times.length && times[lo] - t < gp - 1e-6) return -1;
    if (lo > 0 && t - times[lo - 1] < gp - 1e-6) return -1;
    // nunca más de "peak" pulsaciones en ningún segundo (se pueda tocar)
    let c = 1;
    for (let k = lo - 1; k >= 0 && t - times[k] < 1; k--) c++;
    for (let k = lo; k < times.length && times[k] - t < 1; k++) c++;
    if (c > cfg.peak * 1.6) return -1;
    let w0 = 0; // ventana exacta de 1 s centrada
    for (let k = lo - 1; k >= 0 && t - times[k] < 0.5; k--) w0++;
    for (let k = lo; k < times.length && times[k] - t < 0.5; k++) w0++;
    if (w0 + 1 > cfg.peak) return -1;
    return lo;
  };
  // reparto por ventanas de 4 s: cada tramo recibe su cuota (las partes suaves no se quedan vacías)
  const WIN = 4;
  const nWin = Math.ceil(an.duration / WIN) + 1;
  const wSum = new Float64Array(nWin), wCnt = new Int32Array(nWin);
  for (const c of cand) { const k = Math.floor(c.t / WIN); wSum[k] += c.w; wCnt[k]++; }
  const used = [...wSum].filter(x => x > 0);
  const meanW = used.length ? used.reduce((a, b) => a + b, 0) / used.length : 1;
  const quota = new Int32Array(nWin), got = new Int32Array(nWin);
  for (let k = 0; k < nWin; k++) {
    if (!wCnt[k]) continue;
    let Iw = 0; for (let q = 0; q < 8; q++) Iw += intensityAt(an, k * WIN + q * 0.5); Iw /= 8;
    const rel = diffId === 'easy' ? 0.6 + 0.75 * Iw : 0.35 + 1.3 * Iw;
    quota[k] = Math.max(1, Math.round(cfg.nps * WIN * rel * (0.85 + 0.3 * Math.min(1.5, wSum[k] / meanW) / 1.5)));
  }
  for (const c of cand) {
    if (picked.length >= target * 1.3) break;
    const k = Math.floor(c.t / WIN);
    if (got[k] >= quota[k]) continue;
    const pos = fits(c.t, c.I);
    if (pos < 0) continue;
    times.splice(pos, 0, c.t);
    picked.push(c); got[k]++;
  }
  picked.sort((a, b) => a.t - b.t);
  const chordCut = cfg.chord ? quantile(picked.map(p => p.w), 1 - cfg.chord) : Infinity;

  // 3) carriles, notas largas y acordes
  const notes = [];
  const freeAt = new Array(L).fill(-1);
  const holdEnds = []; let lastHoldT = -9;
  let prevLane = Math.floor(L / 2), prevLane2 = -1, lastDir = 0, prevT = -10;
  for (let i = 0; i < picked.length; i++) {
    const p = picked[i];
    const next = picked[i + 1] ? picked[i + 1].t : an.duration;
    const dt = p.t - prevT;
    // Movimiento entre botones con las probabilidades medidas en 152 partituras originales:
    // cuanto más rápido, más saltos de lado a lado y menos repeticiones.
    const nl = nextLane(prevLane, prevLane2, lastDir, dt, L, rng, 0);
    let lane = nl[0]; lastDir = nl[1];
    lane = freeLane(lane, p.t, freeAt, L, prevLane, dt < cfg.jack);
    if (lane < 0) continue;

    const note = { t: round3(p.t), lane };
    // Notas largas en sonidos sostenidos (voz alargada, sintes). En EASY necesitan hueco;
    // en NORMAL/HARD pueden convivir con notas en otros carriles (máx. 1 o 2 largas a la vez).
    const room = diffId === 'easy' ? next - p.t - 0.12 : 3.2;
    const activeHolds = holdEnds.filter(e => e > p.t).length;
    const maxHolds = diffId === 'hard' ? 2 : 1;
    if (p.sus >= cfg.holdMin && room >= cfg.holdMin * 0.85 && activeHolds < maxHolds && p.t - lastHoldT > 1.2 && rng() < cfg.holdP) {
      let end = p.t + Math.min(p.sus, room, 2.6);
      if (useGrid) { const g = nearestIn(grid, end); if (g <= end + 0.01) end = g; }
      if (end - p.t >= cfg.holdMin * 0.8) {
        note.end = round3(end); freeAt[lane] = end + 0.08; holdEnds.push(end); lastHoldT = p.t;
        // slide: la nota larga termina en otro carril (hay que arrastrar el dedo)
        if (cfg.slideP && rng() < cfg.slideP) {
          const d = (rng() < 0.5 ? -1 : 1) * (L >= 7 && rng() < 0.4 ? 2 : 1);
          let l2 = lane + d; if (l2 < 0 || l2 >= L) l2 = lane - d;
          if (l2 >= 0 && l2 < L && freeAt[l2] < p.t) { note.lane2 = l2; freeAt[l2] = end + 0.08; }
        }
      }
    }
    notes.push(note);
    if (!note.end) freeAt[lane] = p.t + 0.02;

    if ((p.w >= chordCut || (cfg.chord && p.I > 0.8 && rng() < cfg.chord * 0.5)) && !note.end && L >= 4) {
      let l2 = L - 1 - lane;
      if (l2 === lane || Math.abs(l2 - lane) < 1) l2 = (lane + 2) % L;
      l2 = freeLane(l2, p.t, freeAt, L, lane, false);
      if (l2 >= 0 && l2 !== lane) { notes.push({ t: round3(p.t), lane: l2 }); freeAt[l2] = p.t + 0.02; }
    }
    prevLane2 = prevLane; prevLane = lane; prevT = p.t;
  }
  notes.sort((a, b) => a.t - b.t || a.lane - b.lane);

  // nivel (estrellas) por densidad máxima en ventanas de 4 s
  let peak = 0, j = 0;
  for (let i = 0; i < notes.length; i++) {
    while (notes[i].t - notes[j].t > 4) j++;
    peak = Math.max(peak, (i - j + 1) / 4);
  }
  const level = Math.max(1, Math.min(15, Math.round(peak * 1.9 + (L - 3) * 0.9)));
  return { lanes: L, notes, level, bpm: an.bpm, phase: an.phase, beats: an.beats, grid: useGrid, intensity: an.intensity };
}

function freeLane(lane, t, freeAt, L, avoid, mustAvoid) {
  if (freeAt[lane] < t && !(mustAvoid && lane === avoid)) return lane;
  for (let d = 1; d < L; d++) {
    for (const c of [lane - d, lane + d]) {
      if (c < 0 || c >= L) continue;
      if (freeAt[c] < t && !(mustAvoid && c === avoid)) return c;
    }
  }
  return -1;
}
function quantile(arr, q) { if (!arr.length) return Infinity; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; }
function round3(x) { return Math.round(x * 1000) / 1000; }

export function intensityAt(an, t) {
  const it = an.intensity; if (!it) return 0.5;
  const k = t / it.step, i = Math.floor(k);
  if (i < 0) return it.v[0] ?? 0.5;
  if (i >= it.v.length - 1) return it.v[it.v.length - 1] ?? 0.5;
  return it.v[i] + (it.v[i + 1] - it.v[i]) * (k - i);
}
function rapAt(an, t) { const it = an.intensity; if (!it || !it.rap) return 0; return it.rap[Math.max(0, Math.min(it.rap.length - 1, Math.round(t / it.step)))] || 0; }

// subdivisiones entre pulsos consecutivos (sub=2 corcheas, 4 semicorcheas)
export function beatGrid(beats, sub) {
  const g = [];
  if (!beats || beats.length < 2) return g;
  for (let k = 0; k < beats.length - 1; k++) {
    const a = beats[k], d = (beats[k + 1] - a) / sub;
    for (let j = 0; j < sub; j++) g.push(a + j * d);
  }
  g.push(beats[beats.length - 1]);
  // extiende un poco antes y después con el periodo de los extremos
  const p0 = beats[1] - beats[0], p1 = beats[beats.length - 1] - beats[beats.length - 2];
  for (let j = 1; j <= 8 * sub; j++) { g.unshift(beats[0] - j * p0 / sub); g.push(beats[beats.length - 1] + j * p1 / sub); }
  return g;
}
export function nearestIn(arr, t) {
  if (!arr || !arr.length) return Infinity;
  let lo = 0, hi = arr.length - 1;
  while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] < t) lo = m + 1; else hi = m; }
  const c = arr[lo], d = lo > 0 ? arr[lo - 1] : c;
  return Math.abs(c - t) < Math.abs(d - t) ? c : d;
}

// ---- Modelo de movimiento (probabilidades agregadas de 152 partituras HARD de la serie) ----
const GAP_EDGES = [0.16, 0.26, 0.42];
const JUMP_P = [
  [7.4, 0.9, 53.1, 13.9, 19.5, 1.7, 3.5],
  [9.3, 5.7, 56.1, 8.4, 14.2, 1.6, 4.5],
  [17.9, 10.8, 39.3, 8.2, 14.0, 2.5, 7.3],
  [20.2, 10.7, 28.7, 9.3, 18.6, 2.5, 10.0],
];
const SIDE_CHANGE = [0.65, 0.5, 0.42, 0.52];
const STAIRS = [0.29, 0.4, 0.33, 0.25];
const USE7 = [1, 0.45, 1, 0.7, 1, 0.45, 1];
export function nextLane(prev, prev2, lastDir, gap, L, rng, prefDir = 0) {
  const b = GAP_EDGES.filter(e => gap >= e).length;
  const P = JUMP_P[b], tot = P.reduce((x, y) => x + y, 0);
  for (let tries = 0; tries < 12; tries++) {
    let r = rng() * tot, k = 0;
    while (k < 6 && r >= P[k]) { r -= P[k]; k++; }
    const x = k * (L - 1) / 6;
    let j = Math.floor(x) + (rng() < x - Math.floor(x) ? 1 : 0);
    if (k > 0) j = Math.max(1, j);
    if (j === 0 && (prev === prev2 || (L <= 3 && rng() < 0.5))) continue; // nunca 3 seguidas en el mismo botón
    if (j === 0) return [prev, lastDir];
    const c = (L - 1) / 2;
    const opts = [1, -1].filter(d => prev + d * j >= 0 && prev + d * j < L);
    if (!opts.length) continue;
    let d;
    if (opts.length === 2) {
      if (prefDir && rng() < 0.5) d = prefDir;
      else if (rng() < SIDE_CHANGE[b]) d = prev < c ? 1 : prev > c ? -1 : (rng() < 0.5 ? 1 : -1);
      else d = lastDir ? (rng() < STAIRS[b] ? lastDir : -lastDir) : (rng() < 0.5 ? 1 : -1);
      if (!opts.includes(d)) d = opts[0];
    } else d = opts[0];
    const nw = prev + d * j;
    if (L === 7 && rng() > USE7[nw]) continue;
    return [nw, d];
  }
  return [L > 3 ? (prev + (prev < (L - 1) / 2 ? 2 : -2) + L) % L : (prev + 1) % L, lastDir];
}
