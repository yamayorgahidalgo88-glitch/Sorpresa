// Reproducción de audio + reloj central del juego.
// El tiempo de canción se deriva SIEMPRE del reloj del AudioContext, por lo que
// música y notas avanzan juntas; al pausar (ctx.suspend) el reloj se congela y
// al reanudar continúa desde el mismo punto.

let sharedCtx = null;

export function getAudioContext() {
  if (!sharedCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    sharedCtx = new AC({ latencyHint: 'interactive' });
  }
  return sharedCtx;
}

export class AudioClock {
  constructor(ctx) {
    this.ctx = ctx;
    this.source = null;
    this.gain = null;
    this.startAt = 0; // tiempo de contexto en el que la canción vale 0
    this.calibration = 0; // segundos (ajuste de latencia del usuario)
    this.lastReturned = -Infinity;
    this.playing = false;
  }

  play(buffer, leadIn = 0) {
    this.stop();
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.value = 1;
    src.connect(g).connect(ctx.destination);
    // Analizador para que los efectos visuales reaccionen a la música
    if (!this.analyser) {
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.75;
      this.freq = new Uint8Array(this.analyser.frequencyBinCount);
    }
    g.connect(this.analyser);
    const when = ctx.currentTime + 0.12;
    this.startAt = when + leadIn;
    src.start(this.startAt);
    this.source = src;
    this.gain = g;
    this.lastReturned = -Infinity;
    this.playing = true;
  }

  stop(fade = 0) {
    if (!this.source) return;
    const src = this.source;
    const g = this.gain;
    try {
      if (fade > 0) {
        const t = this.ctx.currentTime;
        g.gain.setValueAtTime(g.gain.value, t);
        g.gain.linearRampToValueAtTime(0, t + fade);
        src.stop(t + fade + 0.02);
      } else {
        src.stop();
      }
    } catch {
      /* ya detenido */
    }
    this.source = null;
    this.playing = false;
  }

  // Tiempo de contexto "audible" en el instante perfNow (ms de performance.now)
  contextTimeAt(perfNow) {
    const ctx = this.ctx;
    if (ctx.state !== 'running') return ctx.currentTime;
    let t = ctx.currentTime;
    if (ctx.getOutputTimestamp) {
      const ts = ctx.getOutputTimestamp();
      if (ts && ts.performanceTime > 0 && ts.contextTime > 0) {
        const extra = (perfNow - ts.performanceTime) / 1000;
        t = ts.contextTime + Math.max(-0.05, Math.min(0.1, extra));
      }
    }
    return t;
  }

  // Tiempo de canción (s). Monótono mientras suena.
  songTime(perfNow = performance.now()) {
    let t = this.contextTimeAt(perfNow) - this.startAt - this.calibration;
    if (this.ctx.state === 'running' && t < this.lastReturned && this.lastReturned - t < 0.03) {
      t = this.lastReturned;
    }
    this.lastReturned = t;
    return t;
  }

  // Tiempo de canción para un evento de entrada que ocurrió en eventPerf
  songTimeAtEvent(eventPerf) {
    const now = performance.now();
    const base = this.songTime(now);
    if (this.ctx.state !== 'running') return base;
    const age = Math.max(0, Math.min(0.1, (now - eventPerf) / 1000));
    return base - age;
  }

  suspend() {
    return this.ctx.state === 'running' ? this.ctx.suspend() : Promise.resolve();
  }

  resume() {
    return this.ctx.state !== 'running' ? this.ctx.resume() : Promise.resolve();
  }
}

export async function decodeFile(file) {
  const ctx = getAudioContext();
  const data = await file.arrayBuffer();
  return await new Promise((resolve, reject) => {
    const p = ctx.decodeAudioData(data, resolve, reject);
    if (p && p.then) p.then(resolve, reject);
  });
}
