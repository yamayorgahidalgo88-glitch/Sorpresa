// Sintetizador de la pista de prueba "Starlight Highway".
// Genera las muestras directamente en JavaScript (osciladores, filtros,
// envolventes, delay y limitador) a partir de la misma partitura que usa el
// generador de notas. Es mucho más rápido que un grafo de OfflineAudioContext
// con miles de nodos y no depende de ningún audio externo ni comercial.
import {
  SONG, BAR, BEAT, SONG_DURATION, SECTIONS,
  sectionOfBar, chordOfBar, buildMelody, buildArpeggio, buildDrums,
} from './song.js';

const SR = 32000;
const TAU = Math.PI * 2;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

let cached = null;
let pending = null;

export function renderSong() {
  if (cached) return Promise.resolve(cached);
  if (!pending) {
    pending = synthesize().then((buf) => {
      cached = buf;
      return buf;
    });
  }
  return pending;
}

const yieldUI = () => new Promise((r) => setTimeout(r, 0));

// polyBLEP para osciladores sin tanto aliasing
function blep(t, dt) {
  if (t < dt) {
    t /= dt;
    return t + t - t * t - 1;
  }
  if (t > 1 - dt) {
    t = (t - 1) / dt;
    return t * t + t + t + 1;
  }
  return 0;
}

function makeNoise(len) {
  const n = new Float32Array(len);
  let s = 1234567;
  for (let i = 0; i < len; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    n[i] = (s / 0x3fffffff) - 1;
  }
  return n;
}

async function synthesize() {
  const N = Math.ceil(SONG_DURATION * SR);
  const L = new Float32Array(N);
  const R = new Float32Array(N);
  const pumpL = new Float32Array(N); // pads + bajo (con sidechain)
  const pumpR = new Float32Array(N);
  const send = new Float32Array(N); // envío al delay
  const noise = makeNoise(SR);
  const NL = noise.length;

  const idx = (t) => Math.floor(t * SR);

  // ------------------------------------------------------------ batería
  const kick = (t) => {
    const i0 = idx(t), len = Math.floor(0.4 * SR);
    let ph = 0;
    for (let k = 0; k < len && i0 + k < N; k++) {
      const tt = k / SR;
      const f = 42 + 118 * Math.exp(-tt / 0.03);
      ph += (TAU * f) / SR;
      const env = Math.min(1, tt / 0.003) * Math.exp(-tt / 0.11);
      const click = noise[(i0 + k) % NL] * Math.exp(-tt / 0.002) * 0.25;
      const v = Math.sin(ph) * env * 0.95 + click;
      L[i0 + k] += v;
      R[i0 + k] += v;
    }
  };
  const snare = (t, vel = 1) => {
    const i0 = idx(t), len = Math.floor(0.22 * SR);
    let lp = 0, prev = 0, ph = 0;
    for (let k = 0; k < len && i0 + k < N; k++) {
      const tt = k / SR;
      const nz = noise[(i0 * 7 + k) % NL];
      lp += 0.35 * (nz - lp);
      const hp = lp - prev; // banda media-alta
      prev = lp;
      ph += (TAU * (190 + 60 * Math.exp(-tt / 0.02))) / SR;
      const tone = (Math.abs(((ph / TAU) % 1) * 4 - 2) - 1) * Math.exp(-tt / 0.03) * 0.35;
      const v = (hp * 1.6 * Math.exp(-tt / 0.06) + tone) * 0.55 * vel;
      L[i0 + k] += v * 0.95;
      R[i0 + k] += v;
    }
  };
  const hat = (t, open, vel = 1) => {
    const i0 = idx(t), dec = open ? 0.06 : 0.014, len = Math.floor(dec * 6 * SR);
    let prev = 0;
    for (let k = 0; k < len && i0 + k < N; k++) {
      const nz = noise[(i0 * 3 + k) % NL];
      const hp = nz - prev;
      prev = nz;
      const v = hp * Math.exp(-k / SR / dec) * (open ? 0.09 : 0.08) * vel;
      L[i0 + k] += v * 0.8;
      R[i0 + k] += v * 1.1;
    }
  };
  const crash = (t) => {
    const i0 = idx(t), len = Math.floor(1.8 * SR);
    let prev = 0;
    for (let k = 0; k < len && i0 + k < N; k++) {
      const nz = noise[(i0 * 5 + k) % NL];
      const hp = nz - prev;
      prev = nz;
      const v = hp * Math.exp(-k / SR / 0.45) * 0.11;
      L[i0 + k] += v;
      R[i0 + k] += v * 0.9;
    }
  };
  const riser = (t, dur) => {
    const i0 = idx(t), len = Math.floor(dur * SR);
    let lp = 0;
    for (let k = 0; k < len && i0 + k < N; k++) {
      const x = k / len;
      const a = 0.02 + 0.6 * x * x;
      lp += a * (noise[(i0 + k) % NL] - lp);
      const v = lp * x * x * 0.22;
      L[i0 + k] += v;
      R[i0 + k] += v;
    }
  };

  // ------------------------------------------------------------ tonales
  // voz genérica: tipo de onda, filtro paso bajo de 2 polos con envolvente
  const voice = (outL, outR, t, dur, freq, opt) => {
    const {
      wave = 'saw', gain = 0.1, attack = 0.005, release = 0.08, decay = 0, sustain = 1,
      cut0 = 4000, cut1 = cut0, cutTime = dur, pan = 0, detune = 0, vib = 0, sendAmt = 0,
    } = opt;
    const i0 = idx(t);
    const len = Math.floor((dur + release) * SR);
    const f = freq * Math.pow(2, detune / 1200);
    let ph = Math.random();
    let y1 = 0, y2 = 0;
    const gl = gain * (pan <= 0 ? 1 : 1 - pan);
    const gr = gain * (pan >= 0 ? 1 : 1 + pan);
    for (let k = 0; k < len && i0 + k < N; k++) {
      const tt = k / SR;
      // envolvente ADSR
      let env;
      if (tt < attack) env = tt / attack;
      else if (tt < dur) env = decay > 0 ? sustain + (1 - sustain) * Math.exp(-(tt - attack) / decay) : 1;
      else env = (decay > 0 ? sustain : 1) * Math.max(0, 1 - (tt - dur) / release);
      if (env <= 0 && tt > dur) break;
      const fv = vib && tt > 0.3 ? f * (1 + 0.006 * Math.sin(TAU * 5.5 * tt) * Math.min(1, (tt - 0.3) * 3)) : f;
      const dt = fv / SR;
      ph += dt;
      if (ph >= 1) ph -= 1;
      let s;
      if (wave === 'saw') s = 2 * ph - 1 - blep(ph, dt);
      else if (wave === 'square') {
        s = ph < 0.5 ? 1 : -1;
        s += blep(ph, dt);
        s -= blep((ph + 0.5) % 1, dt);
      } else if (wave === 'tri') s = Math.abs(ph * 4 - 2) - 1;
      else s = Math.sin(TAU * ph);
      // filtro
      const fc = cut1 + (cut0 - cut1) * Math.exp(-tt / Math.max(0.01, cutTime));
      const a = 1 - Math.exp((-TAU * Math.min(fc, SR * 0.45)) / SR);
      y1 += a * (s - y1);
      y2 += a * (y1 - y2);
      const v = y2 * env;
      outL[i0 + k] += v * gl;
      outR[i0 + k] += v * gr;
      if (sendAmt) send[i0 + k] += v * gain * sendAmt;
    }
  };

  // ------------------------------------------------------------ programación
  for (const d of buildDrums()) {
    if (d.kind === 'kick') kick(d.time);
    else if (d.kind === 'snare') snare(d.time, d.section === 'build' && d.bar >= 16 ? 0.55 + (d.bar - 16) * 0.25 : 1);
    else hat(d.time, d.kind === 'openhat', d.step % 4 === 0 ? 1 : 0.7);
  }
  const build = SECTIONS.find((s) => s.id === 'build');
  riser((build.to - 2) * BAR, BAR * 2);
  riser(29 * BAR, BAR);
  for (const s of SECTIONS) if (['verse', 'chorus1', 'chorus2', 'outro'].includes(s.id)) crash(s.from * BAR);
  await yieldUI();

  for (let bar = 0; bar < SONG.bars; bar++) {
    const sec = sectionOfBar(bar).id;
    const chord = chordOfBar(bar);
    const t0 = bar * BAR;
    const padVel = sec === 'bridge' ? 1.5 : sec === 'intro' ? 0.8 : sec.startsWith('chorus') ? 1.15 : 1;
    const padDur = sec === 'outro' ? (bar === 38 ? BAR * 2 : 0) : BAR;
    if (padDur) {
      for (const m of chord.notes) {
        for (const [det, pan] of [[-9, -0.6], [9, 0.6]]) {
          voice(pumpL, pumpR, t0, padDur - 0.05, mtof(m), {
            wave: 'saw', gain: 0.045 * padVel, attack: 0.22, release: 0.3, cut0: 1500, detune: det, pan,
          });
        }
      }
    }
    if (sec === 'intro') continue;
    if (sec === 'outro') {
      if (bar === 38) voice(pumpL, pumpR, t0, BAR * 1.5, mtof(chord.bass), { wave: 'saw', gain: 0.22, release: 0.5, cut0: 700, cut1: 250, cutTime: 0.8 });
      continue;
    }
    if (sec === 'bridge') {
      voice(pumpL, pumpR, t0, BAR * 0.95, mtof(chord.bass), { wave: 'saw', gain: 0.2, release: 0.1, cut0: 600, cut1: 250, cutTime: 0.6 });
      continue;
    }
    for (let i = 0; i < 8; i++) {
      const midi = chord.bass + (i % 2 === 1 && sec !== 'verse' ? 12 : 0);
      const tt = t0 + i * BEAT * 0.5;
      voice(pumpL, pumpR, tt, BEAT * 0.42, mtof(midi), { wave: 'saw', gain: sec === 'verse' ? 0.2 : 0.24, release: 0.03, cut0: 1100, cut1: 220, cutTime: 0.08 });
      voice(pumpL, pumpR, tt, BEAT * 0.42, mtof(midi - 12), { wave: 'square', gain: 0.1, release: 0.03, cut0: 400 });
    }
    if (bar % 4 === 3) await yieldUI();
  }

  for (const n of buildMelody()) {
    const ch = n.section.startsWith('chorus');
    const f = mtof(n.midi + 12);
    const dur = Math.max(0.08, n.dur * 0.9);
    const common = { gain: ch ? 0.075 : 0.065, attack: 0.01, decay: 0.12, sustain: 0.65, release: 0.09, cut0: 5200, cut1: 1900, cutTime: 0.25, vib: n.dur > 0.6, sendAmt: 0.9 };
    voice(L, R, n.time, dur, f, { ...common, wave: 'square', detune: -7, pan: -0.15 });
    voice(L, R, n.time, dur, f, { ...common, wave: 'saw', detune: 7, pan: 0.15 });
  }
  await yieldUI();
  for (const a of buildArpeggio()) {
    const vel = a.section === 'build' ? 0.8 + (a.bar - 10) * 0.04 : 0.7;
    voice(L, R, a.time, 0.06, mtof(a.midi), { wave: 'tri', gain: 0.09 * vel, attack: 0.003, release: 0.16, cut0: 4000, cut1: 600, cutTime: 0.06, pan: a.rank % 2 ? 0.35 : -0.35, sendAmt: 1 });
  }
  await yieldUI();

  // ------------------------------------------------------------ mezcla
  // sidechain: los pads/bajo bajan en cada pulso de los estribillos y el build
  for (let bar = 0; bar < SONG.bars; bar++) {
    const sec = sectionOfBar(bar).id;
    const pumping = sec === 'chorus1' || sec === 'chorus2' || sec === 'build';
    const a = idx(bar * BAR), b = Math.min(N, idx((bar + 1) * BAR));
    const beatLen = BEAT * SR;
    for (let i = a; i < b; i++) {
      let g = 1;
      if (pumping) {
        const ph = ((i - a) % beatLen) / beatLen;
        g = ph < 0.6 ? 0.35 + 0.65 * (ph / 0.6) : 1;
      }
      L[i] += pumpL[i] * g;
      R[i] += pumpR[i] * g;
    }
  }
  for (let i = idx(SONG.bars * BAR); i < N; i++) {
    L[i] += pumpL[i];
    R[i] += pumpR[i];
  }
  // delay ping-pong a 3/8
  const D = Math.floor(BEAT * 0.75 * SR);
  const dl = new Float32Array(N), dr = new Float32Array(N);
  let lpL = 0, lpR = 0;
  for (let i = 0; i < N; i++) {
    const inL = send[i] + (i >= D ? dr[i - D] * 0.38 : 0);
    const inR = i >= D ? dl[i - D] : 0;
    lpL += 0.4 * (inL - lpL);
    lpR += 0.4 * (inR - lpR);
    dl[i] = lpL;
    dr[i] = lpR;
    L[i] += dl[i] * 0.4;
    R[i] += dr[i] * 0.4;
  }
  // limitador suave
  let peak = 0;
  for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const pre = 1.2 / Math.max(0.5, peak * 0.7);
  for (let i = 0; i < N; i++) {
    L[i] = Math.tanh(L[i] * pre) * 0.88;
    R[i] = Math.tanh(R[i] * pre) * 0.88;
  }

  let buffer;
  try {
    buffer = new AudioBuffer({ length: N, numberOfChannels: 2, sampleRate: SR });
  } catch {
    const Off = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    buffer = new Off(2, 1, SR).createBuffer(2, N, SR);
  }
  buffer.copyToChannel(L, 0);
  buffer.copyToChannel(R, 1);
  return buffer;
}
