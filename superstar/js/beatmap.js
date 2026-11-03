// Análisis de audio y generación de partituras (charts).
// 1) Se separa la canción en 3 bandas (graves, medios, agudos) con un OfflineAudioContext.
// 2) Se detectan los golpes (onsets) por flujo de energía.
// 3) Se estima el tempo (BPM) y la fase del compás para cuadrar las notas al ritmo.
// 4) Para cada dificultad se eligen los golpes más fuertes, se asignan carriles y notas largas.

export const ANALYSIS_VERSION = 5;

const SR = 22050;
const HOP = 256;               // ~11.6 ms por frame
const FPS = SR / HOP;

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
    // sostenido: cuánto aguanta la energía de medios (voces/sintes)
    const mid = bands[1];
    let peak = 0;
    for (let k = 0; k < 6 && i + k < nf; k++) peak = Math.max(peak, mid[i + k] + bands[0][i + k] * 0.5);
    let j = i + 6;
    const limit = Math.min(nf, i + Math.round(4 * FPS));
    while (j < limit && (mid[j] + bands[0][j] * 0.5) > peak * 0.42) j++;
    raw.push({ i, t: i / FPS, s: v, b: bb, sus: (j - i) / FPS });
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
  const minLag = Math.floor(60 * FPS / 190), maxLag = Math.ceil(60 * FPS / 65);
  const ac = new Float64Array(maxLag * 2 + 2);
  const a0 = firstSound, a1 = Math.max(a0 + 10, lastSound);
  for (let lag = minLag; lag <= maxLag * 2 + 1; lag++) {
    let s = 0;
    for (let i = a0; i + lag < a1; i += 1) s += envS[i] * envS[i + lag];
    ac[lag] = s;
  }
  let bestLag = minLag, bestScore = -1;
  for (let lag = minLag; lag <= maxLag; lag++) {
    const bpm = 60 * FPS / lag;
    const prior = Math.exp(-0.5 * Math.pow(Math.log2(bpm / 118) / 0.55, 2));
    const sc = (ac[lag] + 0.5 * (ac[lag * 2] || 0)) * prior;
    if (sc > bestScore) { bestScore = sc; bestLag = lag; }
  }
  // interpolación parabólica
  const y0 = ac[bestLag - 1] || 0, y1 = ac[bestLag], y2 = ac[bestLag + 1] || 0;
  const den = (y0 - 2 * y1 + y2);
  const lagF = bestLag + (den ? 0.5 * (y0 - y2) / den : 0);
  let bpm0 = 60 * FPS / lagF;

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

  // ¿Encaja la rejilla? % de golpes fuertes cerca de una corchea
  const period = 60 / best.bpm;
  const step = period / 2;
  let near = 0, strong = 0;
  for (const o of raw) {
    if (o.s < 0.5) continue;
    strong++;
    const k = Math.round((o.t - best.phase) / step);
    if (Math.abs(best.phase + k * step - o.t) < 0.045) near++;
  }
  const gridFit = strong ? near / strong : 0;

  onProgress(0.95, 'Listo');
  return {
    v: ANALYSIS_VERSION,
    duration: buffer.duration,
    bpm: Math.round(best.bpm * 100) / 100,
    phase: best.phase,
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
  easy:   { lanes: 3, nps: 1.3, gap: 0.36, sub: 2, holdMin: 0.9, holdP: 0.55, chord: 0,    jack: 0.45 },
  normal: { lanes: 4, nps: 2.25, gap: 0.19, sub: 2, holdMin: 0.7, holdP: 0.5, chord: 0.05, jack: 0.3 },
  hard:   { lanes: 7, nps: 3.7, gap: 0.105, sub: 4, holdMin: 0.55, holdP: 0.45, chord: 0.13, jack: 0.2 },
};

export function makeChart(an, diffId, seedStr = '') {
  const cfg = CFG[diffId];
  const L = cfg.lanes;
  const rng = mulberry32(hashStr(seedStr + '|' + diffId));
  const period = 60 / an.bpm;
  const useGrid = an.gridFit >= 0.45;
  const step = period / cfg.sub;
  const beatStep = period;

  // 1) candidatos ajustados a la rejilla
  const map = new Map();
  for (const [t, s, b, sus] of an.onsets) {
    if (s < 0.12) continue;
    let tt = t, onBeat = false;
    if (useGrid) {
      const k = Math.round((t - an.phase) / step);
      tt = an.phase + k * step;
      const kb = (tt - an.phase) / beatStep;
      onBeat = Math.abs(kb - Math.round(kb)) < 1e-3;
    }
    if (tt < 0.25 || tt > an.duration - 0.2) continue;
    const key = Math.round(tt * 1000);
    const w = s * (onBeat ? (diffId === 'hard' ? 1.1 : 1.3) : 1);
    const prev = map.get(key);
    if (!prev || prev.w < w) map.set(key, { t: tt, s, w, b, sus });
  }
  const cand = [...map.values()].sort((a, b) => b.w - a.w);

  // 2) selección greedy por fuerza respetando el hueco mínimo
  const active = Math.max(10, an.lastSound - an.firstSound);
  const target = Math.round(active * cfg.nps);
  const picked = [];
  const times = []; // ordenados
  const fits = (t) => {
    let lo = 0, hi = times.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (times[m] < t) lo = m + 1; else hi = m; }
    if (lo < times.length && times[lo] - t < cfg.gap - 1e-6) return -1;
    if (lo > 0 && t - times[lo - 1] < cfg.gap - 1e-6) return -1;
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
    const rel = Math.max(0.45, Math.min(1.35, 0.4 + 0.6 * wSum[k] / meanW));
    quota[k] = Math.max(1, Math.round(cfg.nps * WIN * rel));
  }
  for (const c of cand) {
    if (picked.length >= target * 1.15) break;
    const k = Math.floor(c.t / WIN);
    if (got[k] >= quota[k]) continue;
    const pos = fits(c.t);
    if (pos < 0) continue;
    times.splice(pos, 0, c.t);
    picked.push(c); got[k]++;
  }
  picked.sort((a, b) => a.t - b.t);
  const chordCut = cfg.chord ? quantile(picked.map(p => p.w), 1 - cfg.chord) : Infinity;

  // 3) carriles, notas largas y acordes
  const notes = [];
  const freeAt = new Array(L).fill(-1);
  let prevLane = Math.floor(L / 2), prevT = -10, dir = rng() < 0.5 ? -1 : 1;
  for (let i = 0; i < picked.length; i++) {
    const p = picked[i];
    const next = picked[i + 1] ? picked[i + 1].t : an.duration;
    const dt = p.t - prevT;
    // zona según banda: graves a la izquierda, agudos a la derecha
    const zone = (p.b / 2) * (L - 1);
    let walk = prevLane + dir * (1 + Math.floor(rng() * Math.min(2, L - 1)));
    if (walk < 0 || walk > L - 1) { dir = -dir; walk = prevLane + dir; }
    if (rng() < 0.2) dir = -dir;
    let lane = Math.round(0.4 * zone + 0.6 * walk + (rng() - 0.5) * 0.8);
    lane = Math.max(0, Math.min(L - 1, lane));
    if (lane === prevLane && dt < cfg.jack) lane = (lane + 1 + Math.floor(rng() * (L - 1))) % L;
    lane = freeLane(lane, p.t, freeAt, L, prevLane, dt < cfg.jack);
    if (lane < 0) continue;

    const note = { t: round3(p.t), lane };
    const room = next - p.t - 0.12;
    if (p.sus >= cfg.holdMin && room >= cfg.holdMin * 0.85 && rng() < cfg.holdP) {
      let end = p.t + Math.min(p.sus, room, 3.2);
      if (useGrid) end = an.phase + Math.floor((end - an.phase) / step) * step;
      if (end - p.t >= cfg.holdMin * 0.8) { note.end = round3(end); freeAt[lane] = end + 0.08; }
    }
    notes.push(note);
    if (!note.end) freeAt[lane] = p.t + 0.02;

    if (p.w >= chordCut && !note.end && L >= 4) {
      let l2 = L - 1 - lane;
      if (l2 === lane || Math.abs(l2 - lane) < 1) l2 = (lane + 2) % L;
      l2 = freeLane(l2, p.t, freeAt, L, lane, false);
      if (l2 >= 0 && l2 !== lane) { notes.push({ t: round3(p.t), lane: l2 }); freeAt[l2] = p.t + 0.02; }
    }
    prevLane = lane; prevT = p.t;
  }
  notes.sort((a, b) => a.t - b.t || a.lane - b.lane);

  // nivel (estrellas) por densidad máxima en ventanas de 4 s
  let peak = 0, j = 0;
  for (let i = 0; i < notes.length; i++) {
    while (notes[i].t - notes[j].t > 4) j++;
    peak = Math.max(peak, (i - j + 1) / 4);
  }
  const level = Math.max(1, Math.min(15, Math.round(peak * 1.9 + (L - 3) * 0.9)));
  return { lanes: L, notes, level, bpm: an.bpm, phase: an.phase, grid: useGrid };
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
