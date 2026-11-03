// Generación de secuencias de notas (charts).
// 1) buildBuiltinChart: secuencia estructurada derivada de la partitura de la
//    pista original (melodía -> notas cian, ritmo/arpegio -> amarillas,
//    acordes y notas largas -> rosas).
// 2) analyzeAudio + buildCustomChart: para canciones que carga el usuario,
//    detecta BPM/fase y coloca notas sobre la rejilla rítmica donde hay ataques.
import { LANES, NOTE_TYPES } from './constants.js';
import { BAR, BEAT, STEP, SONG, buildMelody, buildArpeggio, sectionOfBar } from './song.js';

const MIN_SAME_LANE_GAP = 0.11;

function note(time, lane, color, type = NOTE_TYPES.TAP, duration = 0, source = '') {
  return { time, lane, color, type, duration, source };
}

const mirror = (lane) => (lane === 2 ? 1 : LANES - 1 - lane);

// ---------------------------------------------------------------------------
// Chart integrado
// ---------------------------------------------------------------------------
export function buildBuiltinChart(difficulty = 'normal') {
  const easy = difficulty === 'easy';
  const hard = difficulty === 'hard';
  const raw = [];

  // Calentamiento: los 4 tiempos del compás 1 (bombo)
  [1, 2, 3, 2].forEach((lane, i) => raw.push(note(BAR + i * BEAT, lane, 'yellow', 'tap', 0, 'kick')));

  // Rango de grados por sección para repartir la melodía en los 5 carriles
  const melody = buildMelody();
  const ranges = {};
  for (const n of melody) {
    const r = (ranges[n.section] ||= { min: Infinity, max: -Infinity });
    r.min = Math.min(r.min, n.degree);
    r.max = Math.max(r.max, n.degree);
  }
  const laneOf = (n) => {
    const r = ranges[n.section];
    if (r.max === r.min) return 2;
    return Math.round(((n.degree - r.min) / (r.max - r.min)) * (LANES - 1));
  };

  for (const n of melody) {
    const step = Math.round((n.time % (BAR * 2)) / STEP); // paso dentro del motivo de 2 compases
    const bar = Math.floor(n.time / BAR + 1e-6);
    const lane = laneOf(n);
    const isMotifStart = step === 0;
    const isBarStart = step % 16 === 0;

    if (n.section === 'verse') {
      if (easy && step % 8 !== 0) continue;
      const long = n.dur >= 6 * STEP;
      if (long && !easy) raw.push(note(n.time, lane, 'pink', 'hold', n.dur - STEP, 'melody'));
      else raw.push(note(n.time, lane, 'cyan', 'tap', 0, 'melody'));
      if (hard && isMotifStart) raw.push(note(n.time, mirror(lane), 'pink', 'tap', 0, 'chord'));
    } else if (n.section === 'chorus1' || n.section === 'chorus2') {
      if (easy && step % 4 !== 0) continue;
      const long = n.dur >= 6 * STEP;
      const star = n.section === 'chorus2' && isMotifStart && !easy;
      if (star) raw.push(note(n.time, lane, 'yellow', 'star', 0, 'melody'));
      else if (long && !easy) raw.push(note(n.time, lane, 'pink', 'hold', n.dur - STEP, 'melody'));
      else raw.push(note(n.time, lane, 'cyan', 'tap', 0, 'melody'));
      // acordes en los tiempos fuertes
      const chordHere = easy ? isMotifStart : isBarStart;
      if (chordHere) raw.push(note(n.time, mirror(lane), 'pink', 'tap', 0, 'chord'));
      if (hard && isMotifStart) raw.push(note(n.time, 2, 'pink', 'tap', 0, 'chord'));
    } else if (n.section === 'bridge') {
      raw.push(note(n.time, lane, 'pink', 'hold', n.dur - STEP, 'melody'));
      if (!easy) {
        // tap en el tiempo 3 mientras se mantiene la nota larga
        const other = lane <= 2 ? 4 - (bar % 2) : bar % 2;
        raw.push(note(n.time + BEAT * 2, other, 'yellow', 'tap', 0, 'kick'));
        if (hard) raw.push(note(n.time + BEAT * 3, other === 4 ? 3 : other + 1, 'cyan', 'tap', 0, 'hat'));
      }
    } else if (n.section === 'outro') {
      const lanes = easy ? [1, 3] : [0, 2, 4];
      lanes.forEach((l) => raw.push(note(n.time, l, 'pink', 'tap', 0, 'chord')));
    }
  }

  // Arpegio (sección build): notas amarillas consecutivas
  for (const a of buildArpeggio()) {
    if (a.section !== 'build') continue;
    const i = Math.round((a.time - a.bar * BAR) / (BEAT / 2));
    if (easy && i % 2 !== 0) continue;
    const lane = Math.min(LANES - 1, a.rank + (a.bar % 2));
    raw.push(note(a.time, lane, 'yellow', 'tap', 0, 'arp'));
  }
  // Redoble final del build en difícil: semicorcheas alternas
  if (hard) {
    for (let k = 0; k < 8; k++) {
      raw.push(note(17 * BAR + (2 * k + 1) * STEP, k % 2 ? 0 : 4, 'cyan', 'tap', 0, 'snare'));
    }
  }
  // Caja en estribillos (difícil)
  if (hard) {
    for (let bar = 18; bar < 38; bar++) {
      const sec = sectionOfBar(bar).id;
      if (!sec.startsWith('chorus')) continue;
      raw.push(note(bar * BAR + BEAT, bar % 2 ? 1 : 3, 'yellow', 'tap', 0, 'snare'));
    }
  }
  // Normal: golpe de caja a mitad de cada compás del verso para más ritmo
  if (!easy) {
    for (let bar = 2; bar < 10; bar++) {
      if (bar % 2 === 1) raw.push(note(bar * BAR + BEAT * 3.5, bar % 4 === 1 ? 4 : 0, 'yellow', 'tap', 0, 'snare'));
    }
  }

  return finalizeChart(raw);
}

// Resuelve colisiones (mismo carril ocupado por otra nota o por una nota larga)
export function finalizeChart(raw) {
  const sorted = raw
    .filter((n) => n.time >= 0)
    .sort((a, b) => a.time - b.time || priority(b) - priority(a) || a.lane - b.lane);
  const busyUntil = new Array(LANES).fill(-Infinity);
  const out = [];
  for (const n of sorted) {
    let lane = n.lane;
    if (!isFree(lane, n.time)) {
      lane = -1;
      for (let d = 1; d < LANES && lane < 0; d++) {
        for (const cand of [n.lane - d, n.lane + d]) {
          if (cand >= 0 && cand < LANES && isFree(cand, n.time)) {
            lane = cand;
            break;
          }
        }
      }
    }
    if (lane < 0) continue; // sin hueco -> se descarta
    const end = n.time + (n.type === 'hold' ? n.duration : 0);
    busyUntil[lane] = end + MIN_SAME_LANE_GAP;
    out.push({ ...n, lane });
  }
  return out.map((n, i) => ({ ...n, id: i }));

  function isFree(lane, t) {
    return t >= busyUntil[lane] - 1e-6;
  }
}
function priority(n) {
  return n.type === 'hold' ? 3 : n.type === 'star' ? 2 : n.source === 'melody' ? 1 : 0;
}

// ---------------------------------------------------------------------------
// Canción del usuario: análisis de audio
// ---------------------------------------------------------------------------
const FPS = 100; // tramas por segundo del envolvente

export function analyzeAudio(buffer) {
  const sr = buffer.sampleRate;
  const hop = Math.round(sr / FPS);
  const len = buffer.length;
  const frames = Math.floor(len / hop);
  const chs = [];
  for (let c = 0; c < buffer.numberOfChannels; c++) chs.push(buffer.getChannelData(c));
  const energy = new Float32Array(frames);
  const hf = new Float32Array(frames);
  let prev = 0;
  for (let f = 0; f < frames; f++) {
    let e = 0, h = 0;
    const start = f * hop;
    for (let i = start; i < start + hop; i++) {
      let s = 0;
      for (const ch of chs) s += ch[i];
      s /= chs.length;
      e += s * s;
      const d = s - prev; // diferencia -> acentúa agudos/ataques
      h += d * d;
      prev = s;
    }
    energy[f] = Math.sqrt(e / hop);
    hf[f] = Math.sqrt(h / hop);
  }
  // flujo de ataque (onset strength)
  const flux = new Float32Array(frames);
  for (let f = 1; f < frames; f++) {
    const a = Math.log1p(hf[f] * 1000) - Math.log1p(hf[f - 1] * 1000);
    const b = Math.log1p(energy[f] * 1000) - Math.log1p(energy[f - 1] * 1000);
    flux[f] = Math.max(0, a) * 0.6 + Math.max(0, b) * 0.4;
  }
  // normalizar
  let mx = 0;
  for (const v of flux) mx = Math.max(mx, v);
  if (mx > 0) for (let f = 0; f < frames; f++) flux[f] /= mx;

  // BPM por autocorrelación (70-180 BPM, preferencia suave por ~120)
  const maxF = Math.min(frames, FPS * 90);
  let bestLag = 50, bestScore = -1;
  const minLag = Math.floor((60 / 180) * FPS);
  const maxLag = Math.ceil((60 / 70) * FPS);
  const scores = [];
  for (let lag = minLag; lag <= maxLag; lag++) {
    let s = 0;
    for (let i = 0; i + lag < maxF; i++) s += flux[i] * flux[i + lag];
    const bpm = (60 * FPS) / lag;
    const w = Math.exp(-0.5 * Math.pow(Math.log2(bpm / 120) / 0.6, 2));
    scores[lag] = s * w;
    if (scores[lag] > bestScore) {
      bestScore = scores[lag];
      bestLag = lag;
    }
  }
  // refinamiento parabólico
  let lagF = bestLag;
  const s0 = scores[bestLag - 1], s1 = scores[bestLag], s2 = scores[bestLag + 1];
  if (s0 !== undefined && s2 !== undefined) {
    const den = s0 - 2 * s1 + s2;
    if (den !== 0) lagF = bestLag + (0.5 * (s0 - s2)) / den;
  }
  let bpm = (60 * FPS) / lagF;
  bpm = Math.round(bpm * 10) / 10;
  const offset = findPhase(flux, (60 / bpm) * FPS);
  return { bpm, offset, flux, energy, duration: buffer.duration };
}

function findPhase(flux, lagF) {
  let best = 0, bestScore = -1;
  for (let p = 0; p < Math.ceil(lagF); p++) {
    let s = 0;
    for (let k = 0; ; k++) {
      const i = Math.round(p + k * lagF);
      if (i >= flux.length) break;
      s += flux[i] + 0.5 * (flux[i - 1] || 0) + 0.5 * (flux[i + 1] || 0);
    }
    if (s > bestScore) {
      bestScore = s;
      best = p;
    }
  }
  return best / FPS;
}

// Patrones de carriles deterministas (nada aleatorio)
const LANE_PATTERNS = [
  [0, 1, 2, 3, 4, 3, 2, 1],
  [2, 1, 2, 3, 2, 1, 0, 1],
  [4, 3, 2, 1, 0, 1, 2, 3],
  [1, 3, 1, 3, 0, 4, 0, 4],
  [2, 0, 2, 4, 1, 3, 1, 3],
  [0, 2, 4, 2, 1, 3, 2, 1],
];

function percentile(arr, p) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
}

export function buildCustomChart(analysis, difficulty = 'normal', bpmOverride, offsetOverride) {
  const { flux, energy, duration } = analysis;
  const bpm = bpmOverride || analysis.bpm;
  const offset = offsetOverride ?? analysis.offset;
  const beat = 60 / bpm;
  const sub = difficulty === 'hard' ? 4 : 2; // subdivisiones por pulso
  const slot = beat / sub;
  const strengthAt = (t) => {
    const c = Math.round(t * FPS);
    let m = 0;
    for (let i = c - 3; i <= c + 3; i++) if (i >= 0 && i < flux.length) m = Math.max(m, flux[i]);
    return m;
  };
  const energyAt = (t) => energy[Math.min(energy.length - 1, Math.max(0, Math.round(t * FPS)))] || 0;
  const avgEnergy = energy.reduce((a, b) => a + b, 0) / Math.max(1, energy.length);

  const slots = [];
  for (let t = offset, k = 0; t < duration - 1; t += slot, k++) {
    slots.push({ t, k, pos: k % sub, strength: strengthAt(t), energy: energyAt(t) });
  }
  const onBeat = slots.filter((s) => s.pos === 0).map((s) => s.strength);
  const offBeat = slots.filter((s) => s.pos !== 0).map((s) => s.strength);
  const th = {
    easy: { beat: percentile(onBeat, 0.45), off: Infinity, accent: percentile(onBeat, 0.95) },
    normal: { beat: percentile(onBeat, 0.3), off: percentile(offBeat, 0.75), accent: percentile(onBeat, 0.9) },
    hard: { beat: percentile(onBeat, 0.18), off: percentile(offBeat, 0.6), accent: percentile(onBeat, 0.85) },
  }[difficulty];

  const chosen = [];
  for (const s of slots) {
    if (s.t < 1 || s.energy < avgEnergy * 0.15) continue; // silencio
    if (easy(s)) continue;
    const ok = s.pos === 0 ? s.strength >= th.beat : s.strength >= th.off && (sub === 2 || s.pos === 2 || s.strength >= th.off * 1.3);
    if (ok) chosen.push(s);
  }
  function easy(s) {
    return difficulty === 'easy' && s.pos !== 0;
  }

  const raw = [];
  const beatsPerBar = 4;
  let counter = 0;
  let lastBar = -1;
  for (let i = 0; i < chosen.length; i++) {
    const s = chosen[i];
    const beatIndex = Math.floor(s.k / sub);
    const bar = Math.floor(beatIndex / beatsPerBar);
    if (bar !== lastBar) {
      counter = 0;
      lastBar = bar;
    }
    const pattern = LANE_PATTERNS[(bar + Math.floor(bar / 8)) % LANE_PATTERNS.length];
    const lane = pattern[counter % pattern.length];
    counter++;
    const color = s.pos === 0 ? 'yellow' : 'cyan';
    // nota larga si no hay ataques durante 1,5 pulsos y la energía se mantiene
    const next = chosen[i + 1];
    const gap = next ? next.t - s.t : Infinity;
    const sustained = energyAt(s.t + beat) > s.energy * 0.6;
    if (s.pos === 0 && gap >= beat * 1.5 && sustained && difficulty !== 'easy') {
      raw.push(note(s.t, lane, 'pink', 'hold', Math.min(gap - slot, beat * 2), 'custom'));
    } else {
      raw.push(note(s.t, lane, color, 'tap', 0, 'custom'));
    }
    if (s.pos === 0 && s.strength >= th.accent && beatIndex % 2 === 0) {
      raw.push(note(s.t, mirror(lane), 'pink', 'tap', 0, 'custom'));
    }
  }
  return finalizeChart(raw);
}

export function chartStats(chart) {
  const holds = chart.filter((n) => n.type === 'hold').length;
  return { notes: chart.length, holds, judgments: chart.length + holds };
}

export const BUILTIN_SONG = SONG;
