// Motor de juego: pista en perspectiva muy abierta, monedas doradas, notas largas y slides,
// láseres, medidor RAVE, carta que puntúa y cut-in del miembro. Todo el arte se dibuja aquí.

export const JUDGE_NAMES = ['S·PERFECT', 'PERFECT', 'GOOD', 'BAD', 'MISS'];
const MULT = [1, 0.85, 0.5, 0.2, 0];
// ventanas de tiempo (s): iguales antes y después de la nota; fuera de 0,18 s ya es MISS
const WIN = { sp: 0.042, p: 0.085, gEarly: 0.135, bEarly: 0.18, late: 0.18 };
const RAVE_NAMES = ['ENERGY', 'RAVE', 'SUPER RAVE', 'HYPER RAVE', 'ULTRA RAVE'];
const RAVE_GAIN = [0.03, 0.024, 0.008, -0.06, -0.2];
const KEYS = {
  3: ['KeyF', 'Space', 'KeyJ'],
  4: ['KeyD', 'KeyF', 'KeyJ', 'KeyK'],
  7: ['KeyS', 'KeyD', 'KeyF', 'Space', 'KeyJ', 'KeyK', 'KeyL'],
};
const POS = 13;          // posiciones a lo ancho de la barra
const HIT = 2.2;         // distancia (en posiciones) a la que un toque cuenta (zona amplia: más fácil acertar)
const KEYPOS = [1.5, 4.5, 7.5, 10.5];
// Convierte una partitura de N carriles a posiciones libres 0..12, con una ligera variación
// (determinista) para que las notas no caigan siempre en los mismos sitios.
function toPositions(srcL) {
  if (srcL === POS) return notes => notes.map(n => ({ ...n }));
  const k = (POS - 1) / Math.max(1, srcL - 1);
  const jit = t => [0, 1, -1, 0, 1, -1, 0][Math.floor(t * 7.31) % 7];
  return notes => {
    const byT = new Map(); for (const n of notes) byT.set(n.t, (byT.get(n.t) || 0) + 1);
    const P = (l, t, single) => Math.max(0, Math.min(POS - 1, Math.round(l * k) + (single ? jit(t) : 0)));
    return notes.map(n => {
      const single = byT.get(n.t) === 1 && !n.end;
      const o = { ...n, lane: P(n.lane, n.t, single) };
      if (n.lane2 !== undefined) o.lane2 = P(n.lane2, n.end, false);
      if (n.path) o.path = n.path.map(([t, l]) => [t, P(l, t, false)]);
      return o;
    });
  };
}

// HARD: menos zigzags y más cortos. Se queda uno de cada dos (el resto pasan a notas
// sueltas en los mismos tiempos), con 3 monedas como mucho y poco ancho de lado a lado.
function tameChains(notes) {
  const out = []; let keep = false;
  for (const n of notes) {
    if (!n.path) { out.push(n); continue; }
    keep = !keep;
    if (!keep) { for (const [t, l] of n.path) out.push({ t, lane: l }); continue; }
    const pts = n.path.slice(0, 3), rest = n.path.slice(3);
    const mid = pts.reduce((a, q) => a + q[1], 0) / pts.length;
    const MAXW = 4;   // ancho máximo del zigzag (en posiciones, de 13)
    const c = Math.max(MAXW / 2, Math.min(POS - 1 - MAXW / 2, mid));
    const ls = pts.map(q => q[1]), lo = Math.min(...ls), hi = Math.max(...ls), w = Math.max(1, hi - lo);
    const path = pts.map(([t, l]) => [t, Math.round(c + ((l - lo) / w - 0.5) * Math.min(MAXW, w))]);
    out.push({ ...n, path, lane: path[0][1], end: path[path.length - 1][0], lane2: path[path.length - 1][1] });
    for (const [t, l] of rest) out.push({ t, lane: l });
  }
  return out.sort((x, y) => x.t - y.t);
}
const FONT = '"Saira Condensed", "Arial Narrow", Poppins, system-ui, sans-serif';

const imgCache = new Map();
function loadImg(src) {
  if (!src) return null;
  if (!imgCache.has(src)) { const im = new Image(); im.src = src; imgCache.set(src, im); }
  return imgCache.get(src);
}

export class Game {
  constructor(canvas, opts) {
    this.cv = canvas;
    this.g = canvas.getContext('2d');
    this.o = opts; // {ctx, buffer, chart, settings, maxScore, title, theme, deck:[{photo,name,grade}], bgPhotos:[src], onEnd, onPause}
    this.ctx = opts.ctx;
    // Sin carriles fijos: 13 posiciones a lo ancho de la barra (como el original).
    // Las partituras de 3/4/7 carriles se reparten a lo ancho con pequeñas variaciones.
    const srcL = opts.chart.lanes || 4;
    this.L = POS;
    this.keys = KEYS[4];
    const conv = toPositions(srcL);
    let cn = conv(opts.chart.notes || []);
    if (opts.diff === 'hard') cn = tameChains(cn);
    opts = { ...opts, chart: { ...opts.chart, notes: cn } };
    this.o = opts;
    const byT = new Map();
    for (const n of opts.chart.notes) byT.set(n.t, (byT.get(n.t) || 0) + 1);
    this.notes = opts.chart.notes.map((n, i) => ({ ...n, i, gem: byT.get(n.t) > 1, head: -1, tail: -1, holding: false, done: false, pid: null }));
    // cadenas (path): cada parada intermedia también se juzga
    this.total = this.notes.reduce((a, n) => a + (n.end ? 2 : 1) + (n.path ? Math.max(0, n.path.length - 2) : 0), 0);
    let mr = 0;
    for (let k = 0; k < this.total; k++) mr += 1 + Math.min(k, 100) / 400;
    this.maxRaw = mr || 1;
    this.unit = opts.maxScore / this.maxRaw;
    this.raw = 0; this.combo = 0; this.maxCombo = 0;
    this.counts = [0, 0, 0, 0, 0];
    this.judged = 0;
    this.bonus = 0; this.rave = 0; this.raveLv = 0;
    // la dificultad sólo cambia la velocidad de caída (EASY más lenta, HARD más rápida)
    this.approach = (2.7 - opts.settings.speed * 0.21) * (opts.speedMul || 1);
    this.laneDown = new Array(this.L).fill(0);
    this.laneFlash = new Array(this.L).fill(-9);
    this.pointers = new Map();
    this.particles = []; this.blooms = []; this.lasers = [];
    this.judgeFx = null; this.ptsFx = null; this.cutin = null;
    this.paused = false; this.ended = false;
    this.scoreShown = 0; this.bonusShown = 0;
    this.nextIdx = 0;
    this.lastT = this.notes.length ? Math.max(...this.notes.map(n => n.end || n.t)) : 0;
    // recorte: la canción empieza en chart.start (salta intros de videoclip) y acaba en chart.end
    this.off = opts.chart.start || 0;
    this.endT = Math.min(opts.chart.end || opts.buffer.duration, opts.buffer.duration);
    this.deck = (opts.deck || []).filter(Boolean);
    this.deckImgs = this.deck.map(c => loadImg(c.photo));
    this.bgImgs = (opts.bgPhotos || []).map(loadImg);
    this.bpm = opts.chart.bpm || 0;
    this.phase = opts.chart.phase || 0;
    this.th = opts.theme || { c1: '#2a0f5c', c2: '#ff7ad9' };
    this.intensity = opts.chart.intensity || null;
    this.climax = false; this.climaxT = -9; this.sparks = []; this.Ishown = 0.4;
    this.coin = mkCoin('#ffd54a', '#c98a00');
    this.coinHold = mkCoin('#ffe37a', '#d39a10', true);
    this.gem = mkGem();
    // notas sueltas de colores (las doradas son las que van unidas)
    this.coinBlue = mkCoin('#8fe3ff', '#2d86d8');
    this.coinPink = mkCoin('#ffb3e6', '#e0479e');
    const PAL = { 3: 'bpb', 4: 'bppb', 7: 'bpbpbpb' }[this.L] || 'bppb';
    this.tapSpr = l => (PAL[l] === 'p' ? this.coinPink : this.coinBlue);
    // ---- modo grabar partitura ----
    this.rate = opts.rate || 1;
    this.rec = opts.record ? { taps: [], open: new Map(), stop: false } : null;
    this.ghost = toPositions(opts.guideLanes || 4)(opts.guide || []);
    this._raf = 0;
    this._bind();
    this.resize();
    for (const im of this.bgImgs) if (im && !im.complete) im.addEventListener('load', () => this._buildBg(), { once: true });
    this._makeSfx();
  }

  // ---------- audio y tiempo ----------
  start() {
    const ctx = this.ctx;
    const first = this.notes.length ? this.notes[0].t : this.off;   // al grabar desde un punto, la cuenta atrás es corta
    const lead = Math.max(2.2, this.approach - (first - this.off) + 0.6);
    this.gain = ctx.createGain();
    this.gain.gain.value = this.o.settings.music;
    this.gain.connect(ctx.destination);
    this.src = ctx.createBufferSource();
    this.src.buffer = this.o.buffer;
    this.src.connect(this.gain);
    this.startAt = ctx.currentTime + lead;
    this.src.playbackRate.value = this.rate;
    this.src.start(this.startAt, this.off);
    this.latency = (ctx.outputLatency || 0) + (ctx.baseLatency || 0);
    this._loop = this._loop.bind(this);
    this._raf = requestAnimationFrame(this._loop);
  }
  now() { return (this.ctx.currentTime - this.startAt - this.latency) * this.rate + (this.o.settings.offset || 0) / 1000 + (this.off || 0); }
  pause() {
    if (this.paused || this.ended) return;
    this.paused = true;
    this.ctx.suspend();
    for (const pid of [...this.pointers.keys()]) this._up(pid);
  }
  resume() { if (!this.paused) return; this.paused = false; this.ctx.resume(); }
  destroy() {
    cancelAnimationFrame(this._raf);
    try { this.src && this.src.stop(); } catch {}
    try { this.gain && this.gain.disconnect(); } catch {}
    this._unbind();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  _makeSfx() {
    const ctx = this.ctx, sr = ctx.sampleRate, n = Math.floor(sr * 0.07);
    const b = ctx.createBuffer(1, n, sr), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) {
      const t = i / sr, env = Math.exp(-t * 70);
      d[i] = env * (0.55 * Math.sin(2 * Math.PI * 1650 * t) + 0.25 * Math.sin(2 * Math.PI * 3300 * t) + 0.2 * (Math.random() * 2 - 1) * Math.exp(-t * 200));
    }
    this.sfxBuf = b;
  }
  _sfx() {
    if (!this.o.settings.sfx) return;
    const s = this.ctx.createBufferSource(), g = this.ctx.createGain();
    g.gain.value = this.o.settings.sfxVol;
    s.buffer = this.sfxBuf; s.connect(g); g.connect(this.ctx.destination); s.start();
  }

  // ---------- geometría ----------
  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = this.cv.clientWidth, h = this.cv.clientHeight;
    this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr);
    this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.dpr = dpr; this.W = w; this.H = h; this.cx = w / 2;
    this.land = w > h;
    if (this.land) { this.bw = w * 0.98; this.tw = this.bw * 0.1; this.topY = h * 0.13; this.hitY = h * 0.83; }
    else { this.bw = Math.min(w, h * 0.7); this.tw = this.bw * 0.16; this.topY = h * 0.22; this.hitY = h * 0.8; }
    this.laneW = this.bw / this.L;
    this._buildBg();
  }
  f(p) { return p * p * 0.55 + p * 0.45; }
  yAt(p) { return this.topY + (this.hitY - this.topY) * this.f(p); }
  wAt(p) { return this.tw + (this.bw - this.tw) * this.f(p); }
  xAt(lane, p) { return this.cx + ((lane + 0.5) / this.L - 0.5) * this.wAt(p); }
  edgeX(k, p) { return this.cx + (k / this.L - 0.5) * this.wAt(p); }
  pOf(t, now) { return 1 - (t - now) / this.approach; }
  _pAtY(y) {
    const fv = (y - this.topY) / (this.hitY - this.topY);
    return (-0.45 + Math.sqrt(0.2025 + 2.2 * Math.max(0, fv))) / 1.1;
  }
  laneAt(x, y) {
    // se mide en la línea donde llegan las notas: tocar más arriba o más abajo en la barra
    // (o por debajo) no cambia la posición, cuenta lo mismo que tocar justo encima de la nota
    const l = ((x - this.cx) / this.wAt(1) + 0.5) * this.L - 0.5;
    return Math.max(0, Math.min(this.L - 1, l));
  }

  // ---------- entrada ----------
  _bind() {
    // con la app girada (móvil en vertical sin giro automático) se pasan las coordenadas a las de la pista
    const pos = e => {
      if (document.body.classList.contains('rot')) return [innerHeight - e.clientY, e.clientX];
      const r = this.cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top];
    };
    this._pd = e => {
      if (this.paused || this.ended) return;
      e.preventDefault();
      const [x, y] = pos(e);
      if (y < this.barY0 - 18) return;   // sólo cuentan los toques en la barra de colores (con un pequeño margen arriba)
      const lane = this.laneAt(x, y);
      this.pointers.set(e.pointerId, lane);
      try { this.cv.setPointerCapture(e.pointerId); } catch {}
      this._press(lane, e.pointerId);
    };
    this._pm = e => {
      if (!this.pointers.has(e.pointerId) || this.paused) return;
      const [x, y] = pos(e);
      const lane = this.laneAt(x, y);
      const old = this.pointers.get(e.pointerId);
      this.pointers.set(e.pointerId, lane);
      if (Math.round(lane) === Math.round(old)) return;
      this.laneDown[Math.round(old)] = Math.max(0, this.laneDown[Math.round(old)] - 1);
      this.laneDown[Math.round(lane)]++;
      this.laneFlash[Math.round(lane)] = this.now();
      if (this.rec) { const o = this.rec.open.get(e.pointerId); if (o) o.lane2 = lane; return; }
      if (!this.notes.some(n => n.holding && n.pid === e.pointerId)) this._press(lane, e.pointerId, true, false);
    };
    this._pu = e => { if (this.pointers.has(e.pointerId)) this._up(e.pointerId); };
    this._kd = e => {
      if (e.repeat) return;
      if (e.code === 'Escape' || e.code === 'KeyP') { this.o.onPause && this.o.onPause(); return; }
      const lane = this.keys.indexOf(e.code);
      if (lane < 0 || this.paused || this.ended) return;
      e.preventDefault();
      const kp = KEYPOS[lane];
      this.pointers.set('k' + lane, kp);
      this._press(kp, 'k' + lane);
    };
    this._ku = e => { const lane = this.keys.indexOf(e.code); if (lane >= 0 && this.pointers.has('k' + lane)) this._up('k' + lane); };
    this._rs = () => this.resize();
    this.cv.addEventListener('pointerdown', this._pd);
    this.cv.addEventListener('pointermove', this._pm);
    this.cv.addEventListener('pointerup', this._pu);
    this.cv.addEventListener('pointercancel', this._pu);
    window.addEventListener('keydown', this._kd);
    window.addEventListener('keyup', this._ku);
    window.addEventListener('resize', this._rs);
  }
  _unbind() {
    this.cv.removeEventListener('pointerdown', this._pd);
    this.cv.removeEventListener('pointermove', this._pm);
    this.cv.removeEventListener('pointerup', this._pu);
    this.cv.removeEventListener('pointercancel', this._pu);
    window.removeEventListener('keydown', this._kd);
    window.removeEventListener('keyup', this._ku);
    window.removeEventListener('resize', this._rs);
  }

  _press(lane, pid, slide = false, count = true) {
    const now = this.now();
    if (count) { this.laneDown[Math.round(lane)]++; this.laneFlash[Math.round(lane)] = now; this._sfx(); }
    if (this.rec) {
      if (!slide && now >= this.off - 0.2) { this.rec.open.set(pid, { t: now, lane, lane2: lane }); this.blooms.push({ x: this.xAt(lane, 1), y: this.hitY, t: performance.now(), big: false }); }
      return;
    }
    let best = null, bd = 1e9;
    for (let k = this.nextIdx; k < this.notes.length; k++) {
      const n = this.notes[k];
      if (n.t - now > WIN.bEarly) break;
      if (Math.abs(n.lane - lane) > HIT || n.head >= 0) continue;   // vale tocar cerca de la nota
      const d = now - n.t;
      if (d < -WIN.bEarly || d > WIN.late) continue;
      if (Math.abs(d) < bd) { bd = Math.abs(d); best = n; }
    }
    if (!best) return;
    const d = now - best.t, a = Math.abs(d);
    let j;
    if (a <= WIN.sp) j = 0; else if (a <= WIN.p) j = 1; else j = a <= WIN.gEarly ? 2 : 3;
    if (slide && j > 1) return;
    best.head = j;
    this._judge(j, lane);
    if (best.end) { best.holding = true; best.pid = pid; best.ni = 1; } else best.done = true;
  }

  _up(pid) {
    const lane = this.pointers.get(pid);
    this.pointers.delete(pid);
    if (lane !== undefined) this.laneDown[Math.round(lane)] = Math.max(0, this.laneDown[Math.round(lane)] - 1);
    const now = this.now();
    if (this.rec) { this._closeTap(pid, now); return; }
    for (const n of this.notes) {
      if (!n.holding || n.pid !== pid) continue;
      n.holding = false; n.done = true;
      if (n.path) for (; n.ni < n.path.length - 1; n.ni++) this._judge(4, -1);
      const d = now - n.end;
      let j = d >= -0.1 ? 0 : d >= -0.18 ? 1 : d >= -0.3 ? 2 : 4;
      if (n.lane2 !== undefined && j < 4 && !this._onTarget(n, lane)) j = 2;
      n.tail = j;
      this._judge(j, n.lane2 ?? n.lane);
    }
  }
  _onTarget(n, lane) {
    if (typeof n.pid === 'string') return true; // con teclado no se puede deslizar: se perdona
    return lane !== undefined && Math.abs(lane - n.lane2) <= HIT + 0.4;
  }

  _judge(j, lane) {
    this.counts[j]++;
    this.judged++;
    let pts;
    if (j <= 2) {
      pts = MULT[j] * (1 + Math.min(this.combo, 100) / 400);
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      if (this.combo % 100 === 0) this._cutin();
    } else { pts = MULT[j]; this.combo = 0; }
    this.raw += pts;
    const gained = Math.round(pts * this.unit);
    this.bonus += Math.round(gained * 0.12 * this.raveLv);
    this.rave += RAVE_GAIN[j];
    if (this.rave >= 1) {
      if (this.raveLv < 4) { this.raveLv++; this.rave = 0; this._cutin(); } else this.rave = 1;
    } else if (this.rave < 0) {
      if (this.raveLv > 0) { this.raveLv--; this.rave = 0.85; } else this.rave = 0;
    }
    this.judgeFx = { j, t: performance.now() };
    if (j <= 2) {
      this.ptsFx = { v: gained, card: this.deck.length ? (this.judged - 1) % this.deck.length : -1, t: performance.now() };
      if (lane >= 0 && this.o.settings.fx !== false) this._burst(lane, j);
    }
  }
  _cutin() {
    if (!this.deck.length) return;
    this.cutin = { i: Math.floor(Math.random() * this.deck.length), t: performance.now() };
  }

  score() { return Math.round(this.o.maxScore * Math.min(1, this.raw / this.maxRaw)); }

  _burst(lane, j) {
    const x = this.xAt(lane, 1), y = this.hitY;
    this.blooms.push({ x, y, t: performance.now(), big: j === 0 });
    const n = j === 0 ? 14 : 8;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2, s = 140 + Math.random() * 280;
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.4 + Math.random() * 0.35, age: 0, rot: Math.random() * 6,
        star: Math.random() < 0.5, col: ['#ffffff', '#ffe37a', '#ff9ad5', '#9fe8ff'][Math.floor(Math.random() * 4)], r: 1.5 + Math.random() * 2.5 });
    }
  }

  // ---------- bucle ----------
  _loop(ts) {
    this._raf = requestAnimationFrame(this._loop);
    const dt = this._lastTs ? Math.min(0.05, (ts - this._lastTs) / 1000) : 0.016;
    this._lastTs = ts;
    if (this.paused) { this._draw(this._frozenNow ?? this.now(), 0); return; }
    const now = this.now();
    this._frozenNow = now;
    this._update(now);
    this._draw(now, dt);
  }

  _closeTap(pid, now) {
    const o = this.rec.open.get(pid);
    if (!o) return;
    this.rec.open.delete(pid);
    const n = { t: o.t, lane: Math.round(o.lane) };
    if (now - o.t >= 0.35) { n.end = now; if (Math.abs(o.lane2 - o.lane) >= 1) n.lane2 = Math.round(o.lane2); }   // mantener = nota larga; arrastrar = slide
    this.rec.taps.push(n);
  }
  stopRecording() { if (this.rec) this.rec.stop = true; }
  _update(now) {
    if (this.rec) {
      if (!this.ended && (this.rec.stop || now > this.endT + 0.2)) {
        for (const pid of [...this.rec.open.keys()]) this._closeTap(pid, now);
        this.ended = true;
        try { this.src.stop(); } catch {}
        this.o.onEnd({ recorded: this.rec.taps.sort((a, b) => a.t - b.t), from: this.off, to: Math.min(now, this.endT) });
      }
      return;
    }
    for (let k = this.nextIdx; k < this.notes.length; k++) {
      const n = this.notes[k];
      if (n.t - now > 0) break;
      if (n.head < 0 && now - n.t > WIN.late) {
        n.head = 4; this._judge(4, -1);
        if (n.path) for (let q = 1; q < n.path.length - 1; q++) this._judge(4, -1);
        if (n.end) { n.tail = 4; this._judge(4, -1); }
        n.done = true;
      }
      if (n.holding && n.path) {
        while (n.ni < n.path.length - 1 && now >= n.path[n.ni][0]) {
          const tgt = n.path[n.ni][1], ln = this.pointers.get(n.pid);
          const ok = typeof n.pid === 'string' || (ln !== undefined && Math.abs(ln - tgt) <= HIT + 0.4);
          this._judge(ok ? 0 : 2, tgt);
          n.ni++;
        }
      }
      if (n.holding && now >= n.end) {
        n.holding = false; n.done = true;
        const j = n.lane2 !== undefined && !this._onTarget(n, this.pointers.get(n.pid)) ? 2 : 0;
        n.tail = j; this._judge(j, n.lane2 ?? n.lane);
      }
    }
    while (this.nextIdx < this.notes.length && this.notes[this.nextIdx].done) this.nextIdx++;
    const allDone = this.nextIdx >= this.notes.length;
    if (!this.ended && ((allDone && now > this.lastT + 2.2) || now > this.endT + 0.3)) this._finish();
  }

  _finish() {
    this.ended = true;
    if (this.gain) {
      const t = this.ctx.currentTime;
      this.gain.gain.setValueAtTime(this.gain.gain.value, t);
      this.gain.gain.linearRampToValueAtTime(0, t + 1.2);
    }
    const base = this.score();
    const res = {
      score: base + this.bonus, baseScore: base, bonus: this.bonus,
      maxCombo: this.maxCombo, counts: [...this.counts], total: this.total,
      ratio: this.raw / this.maxRaw,
      fc: this.counts[3] === 0 && this.counts[4] === 0 && this.total > 0,
      ap: this.counts[0] === this.total && this.total > 0,
    };
    setTimeout(() => this.o.onEnd(res), 1400);
  }

  // ---------- fondo pre-renderizado ----------
  _buildBg() {
    const W = this.W, H = this.H, dpr = this.dpr, L = this.L;
    if (!W || !H) return;
    const c = document.createElement('canvas');
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#2a0c2e'; g.fillRect(0, 0, W, H);
    // los retratos de los miembros en fila, como una foto de grupo
    const ims = this.bgImgs.filter(im => im && im.complete && im.naturalWidth);
    if (ims.length) {
      const n = ims.length, cw = W / n;
      ims.forEach((im, i) => {
        const s = Math.max(cw / im.naturalWidth, (H * 0.95) / im.naturalHeight);
        const dw = im.naturalWidth * s, dh = im.naturalHeight * s;
        g.save(); g.beginPath(); g.rect(i * cw, 0, cw, H); g.clip();
        g.globalAlpha = 0.85;
        g.drawImage(im, i * cw + (cw - dw) / 2, H * 0.04, dw, dh);
        g.restore();
      });
    }
    const tint = g.createLinearGradient(0, 0, 0, H);
    tint.addColorStop(0, 'rgba(120,40,110,0.62)');
    tint.addColorStop(0.5, 'rgba(150,50,120,0.55)');
    tint.addColorStop(1, 'rgba(60,20,90,0.8)');
    g.fillStyle = tint; g.fillRect(0, 0, W, H);
    const thg = g.createRadialGradient(this.cx, this.topY, 0, this.cx, this.topY, W * 0.6);
    thg.addColorStop(0, hexA(this.th.c2, 0.25)); thg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = thg; g.fillRect(0, 0, W, H);

    const P1 = 1.14;
    g.beginPath(); g.moveTo(this.edgeX(0, 0), this.yAt(0)); g.lineTo(this.edgeX(L, 0), this.yAt(0)); g.lineTo(this.edgeX(L, P1), this.yAt(P1)); g.lineTo(this.edgeX(0, P1), this.yAt(P1)); g.closePath();
    const fl = g.createLinearGradient(0, this.topY, 0, this.hitY);
    fl.addColorStop(0, 'rgba(40,10,60,0.15)'); fl.addColorStop(1, 'rgba(30,10,70,0.5)');
    g.fillStyle = fl; g.fill();
    for (let k = 1; k < L; k++) {
      const gr = g.createLinearGradient(0, this.topY, 0, this.hitY);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,0.08)');
      g.strokeStyle = gr; g.lineWidth = 1;
      g.beginPath(); g.moveTo(this.edgeX(k, 0), this.yAt(0)); g.lineTo(this.edgeX(k, P1), this.yAt(P1)); g.stroke();
    }
    for (const k of [0, L]) {
      for (const [w, a] of [[8, 0.15], [3.5, 0.4], [1.6, 1]]) {
        const gr = g.createLinearGradient(0, this.topY, 0, this.hitY);
        gr.addColorStop(0, `rgba(255,255,255,${a * 0.2})`); gr.addColorStop(1, `rgba(220,240,255,${a})`);
        g.strokeStyle = gr; g.lineWidth = w;
        g.beginPath(); g.moveTo(this.edgeX(k, 0), this.yAt(0)); g.lineTo(this.edgeX(k, P1), this.yAt(P1)); g.stroke();
      }
    }
    // barra arcoíris bajo los botones
    const B0 = 0.9, y0 = this.yAt(B0), y1 = this.yAt(P1);
    this.barY0 = y0;
    g.beginPath(); g.moveTo(this.edgeX(0, B0), y0); g.lineTo(this.edgeX(L, B0), y0); g.lineTo(this.edgeX(L, P1), y1); g.lineTo(this.edgeX(0, P1), y1); g.closePath();
    const rb = g.createLinearGradient(this.edgeX(0, 1), 0, this.edgeX(L, 1), 0);
    rb.addColorStop(0, 'rgba(255,120,200,0.75)'); rb.addColorStop(0.3, 'rgba(160,140,255,0.7)');
    rb.addColorStop(0.55, 'rgba(120,220,255,0.7)'); rb.addColorStop(0.8, 'rgba(255,240,150,0.75)'); rb.addColorStop(1, 'rgba(255,140,210,0.75)');
    g.fillStyle = rb; g.fill();
    const sh = g.createLinearGradient(0, y0, 0, y1);
    sh.addColorStop(0, 'rgba(255,255,255,0.55)'); sh.addColorStop(0.35, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(40,10,80,0.5)');
    g.fillStyle = sh; g.fill();
    g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(this.edgeX(0, B0), y0 - 1, this.edgeX(L, B0) - this.edgeX(0, B0), 2);
    if (y1 < H) { g.fillStyle = 'rgba(30,8,50,0.85)'; g.fillRect(0, y1, W, H - y1); }
    this.bg = c;
  }

  _I(t) {
    const it = this.intensity; if (!it) return 0.45;
    const k = t / it.step, i = Math.floor(k);
    if (i < 0) return it.v[0] ?? 0.45;
    if (i >= it.v.length - 1) return it.v[it.v.length - 1] ?? 0.45;
    return it.v[i] + (it.v[i + 1] - it.v[i]) * (k - i);
  }
  _beat(now) {
    const bt = this.o.chart.beats;
    if (bt && bt.length > 1) {
      let lo = 0, hi = bt.length - 1;
      while (lo < hi) { const m = (lo + hi + 1) >> 1; if (bt[m] <= now) lo = m; else hi = m - 1; }
      const prev = bt[lo], per = (bt[Math.min(lo + 1, bt.length - 1)] - prev) || 0.5;
      if (now < prev) return 0;
      return Math.exp(-((now - prev) / per) * 5);
    }
    if (!this.bpm) return 0;
    const x = (now - this.phase) / (60 / this.bpm);
    return Math.exp(-(x - Math.floor(x)) * 5);
  }

  // ---------- dibujo ----------
  _draw(now, dt) {
    const g = this.g, W = this.W, L = this.L;
    const tnow = performance.now();
    const pz = now > this.off && !this.paused ? this._beat(now) : 0;
    if (this.bg) g.drawImage(this.bg, 0, 0, W, this.H);

    // intensidad de la canción en este momento (estribillo / rap = alta)
    const Iraw = this._I(now);
    this.Ishown += (Iraw - this.Ishown) * Math.min(1, dt * 3);
    const I = this.Ishown;
    if (!this.climax && I > 0.72 && now > this.off) { this.climax = true; this.climaxT = tnow; }
    else if (this.climax && I < 0.55) this.climax = false;
    // brillo general del escenario
    g.save(); g.globalCompositeOperation = 'lighter';
    const glowA = 0.04 + 0.32 * I * (0.65 + 0.35 * pz);
    const sg = g.createRadialGradient(this.cx, this.topY, 0, this.cx, this.topY, Math.max(W, this.H) * 0.8);
    sg.addColorStop(0, `rgba(255,170,230,${glowA})`); sg.addColorStop(0.5, `rgba(180,120,255,${glowA * 0.45})`); sg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sg; g.fillRect(0, 0, W, this.H);
    // bordes de la pista encendidos en el clímax
    if (I > 0.5) {
      const a = (I - 0.5) * 1.6 * (0.6 + 0.4 * pz);
      for (const k of [0, L]) {
        g.strokeStyle = k ? `rgba(255,120,220,${a})` : `rgba(120,230,255,${a})`;
        for (const [w2, f] of [[14, 0.25], [6, 0.6]]) {
          g.globalAlpha = f; g.lineWidth = w2;
          g.beginPath(); g.moveTo(this.edgeX(k, 0), this.yAt(0)); g.lineTo(this.edgeX(k, 1.1), this.yAt(1.1)); g.stroke();
        }
      }
      g.globalAlpha = 1;
    }
    // destellos que caen en el clímax
    if (this.climax && !this.paused && Math.random() < dt * 40) {
      this.sparks.push({ x: Math.random() * W, y: -10, vy: 120 + Math.random() * 220, r: 1 + Math.random() * 2.5, life: 1.5 + Math.random(), age: 0, col: ['#fff', '#ffd6f5', '#bfefff', '#fff2a8'][Math.floor(Math.random() * 4)] });
    }
    for (const sp of this.sparks) { sp.age += dt; sp.y += sp.vy * dt; }
    this.sparks = this.sparks.filter(sp => sp.age < sp.life && sp.y < this.H);
    for (const sp of this.sparks) { g.globalAlpha = Math.min(1, (sp.life - sp.age) * 2) * 0.9; g.fillStyle = sp.col; drawStar(g, sp.x, sp.y, sp.r * 2.2, sp.age * 3); }
    g.globalAlpha = 1;
    g.restore();

    // láseres
    const ox = this.cx, oy = this.topY + (this.hitY - this.topY) * 0.12;
    const want = Math.round(10 + 40 * I + this.raveLv * 4);
    if (!this.paused) {
      while (this.lasers.length < want) {
        const right = Math.random() < 0.5, a = Math.random() * 0.55 - 0.42;
        this.lasers.push({ ang: right ? a : Math.PI - a, d: Math.random() * W * 0.5, v: 300 + Math.random() * 500, len: 30 + Math.random() * 90,
          col: ['#ff3d7f', '#ff3d7f', '#3de8ff', '#ffffff'][Math.floor(Math.random() * 4)], w: 1.5 + Math.random() * 2.5 });
      }
      for (const l of this.lasers) l.d += l.v * dt * (0.6 + 0.9 * I + this.raveLv * 0.15 + pz * 0.8);
      this.lasers = this.lasers.filter(l => l.d < W * 0.8);
    }
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    for (const l of this.lasers) {
      const ca = Math.cos(l.ang), sa = Math.sin(l.ang);
      const x1 = ox + ca * l.d, y1 = oy + sa * l.d, x2 = ox + ca * (l.d + l.len), y2 = oy + sa * (l.d + l.len);
      const gr = g.createLinearGradient(x1, y1, x2, y2);
      gr.addColorStop(0, hexA(l.col, 0)); gr.addColorStop(1, hexA(l.col, 0.75));
      g.strokeStyle = gr; g.lineWidth = l.w;
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    }
    g.restore();

    // haz de carril pulsado
    for (let l = 0; l < L; l++) {
      const on = this.laneDown[l] > 0;
      const a = on ? 0.45 : Math.max(0, 0.35 - (now - this.laneFlash[l]) * 2);
      if (a <= 0) continue;
      g.beginPath();
      g.moveTo(this.edgeX(l - 0.6, 0.3), this.yAt(0.3)); g.lineTo(this.edgeX(l + 1.6, 0.3), this.yAt(0.3));
      g.lineTo(this.edgeX(l + 1.6, 1), this.hitY); g.lineTo(this.edgeX(l - 0.6, 1), this.hitY); g.closePath();
      const bg = g.createLinearGradient(0, this.yAt(0.3), 0, this.hitY);
      bg.addColorStop(0, 'rgba(255,255,255,0)'); bg.addColorStop(1, `rgba(255,230,255,${a})`);
      g.fillStyle = bg; g.fill();
    }

    // botones: aros planos sobre la barra
    for (let l = 0; l < L; l++) {
      const x = this.xAt(l, 1), y = this.hitY + this.laneW * 0.05;
      const rx = this.laneW * 1.15, ry = rx * 0.3;
      const on = this.laneDown[l] > 0;
      if (on) {
        const gl = g.createRadialGradient(x, y, 0, x, y, rx * 1.2);
        gl.addColorStop(0, 'rgba(255,255,255,0.9)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gl; g.beginPath(); g.ellipse(x, y, rx * 1.2, ry * 1.4, 0, 0, Math.PI * 2); g.fill();
      }
      // sin aros fijos: el aro sólo aparece un instante donde tocas
      const fade = on ? 1 : Math.max(0, 1 - (now - this.laneFlash[l]) * 4);
      if (fade <= 0) continue;
      g.lineWidth = 3; g.strokeStyle = `rgba(255,255,255,${0.95 * fade})`;
      g.beginPath(); g.ellipse(x, y, rx * (1.15 - 0.15 * fade), ry * (1.15 - 0.15 * fade), 0, 0, Math.PI * 2); g.stroke();
      g.lineWidth = 1.5; g.strokeStyle = `rgba(255,255,255,${0.45 * fade})`;
      g.beginPath(); g.ellipse(x, y, rx * 0.72, ry * 0.72, 0, 0, Math.PI * 2); g.stroke();
    }

    // notas
    const vis = [];
    for (let k = this.nextIdx; k < this.notes.length; k++) {
      const n = this.notes[k];
      if (this.pOf(n.t, now) < -0.02) break;
      if (n.done && !n.holding) continue;
      vis.push(n);
    }
    if (this.ghost.length) {
      this.g.globalAlpha = 0.32;
      for (const n of this.ghost) {
        const p = this.pOf(n.t, now);
        if (p < 0 || p > 1.08) continue;
        this._drawCoin(this.xAt(n.lane, p), this.yAt(p), p, this.coin);
      }
      this.g.globalAlpha = 1;
    }
    for (let k = vis.length - 1; k >= 0; k--) if (vis[k].end) this._drawHold(vis[k], now);
    for (let k = vis.length - 1; k >= 0; k--) {
      const n = vis[k];
      if (n.holding) continue;
      const p = this.pOf(n.t, now);
      if (p > 1.12) continue;
      this._drawCoin(this.xAt(n.lane, p), this.yAt(p), p, n.gem ? this.gem : n.end ? this.coinHold : this.tapSpr(n.lane));
    }

    // destellos y partículas
    this.blooms = this.blooms.filter(b => tnow - b.t < 380);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const b of this.blooms) {
      const k = (tnow - b.t) / 380;
      const r = this.laneW * (b.big ? 0.9 : 0.65) * (0.6 + k * 0.7);
      const gr = g.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
      gr.addColorStop(0, `rgba(255,255,255,${0.95 * (1 - k)})`); gr.addColorStop(0.4, `rgba(255,220,250,${0.5 * (1 - k)})`); gr.addColorStop(1, 'rgba(255,200,255,0)');
      g.fillStyle = gr; g.beginPath(); g.ellipse(b.x, b.y - r * 0.15, r, r * 0.6, 0, 0, Math.PI * 2); g.fill();
      if (b.big) {
        g.strokeStyle = `rgba(255,255,255,${0.9 * (1 - k)})`; g.lineWidth = 3 * (1 - k) + 0.5;
        g.beginPath(); g.ellipse(b.x, b.y, this.laneW * 0.4 * (1 + k), this.laneW * 0.12 * (1 + k), 0, 0, Math.PI * 2); g.stroke();
      }
    }
    for (const p of this.particles) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 650 * dt; p.rot += dt * 6; }
    this.particles = this.particles.filter(p => p.age < p.life);
    for (const p of this.particles) {
      g.globalAlpha = 1 - p.age / p.life; g.fillStyle = p.col;
      if (p.star) drawStar(g, p.x, p.y, p.r * 2.2, p.rot); else { g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill(); }
    }
    g.restore(); g.globalAlpha = 1;

    this._drawHUD(now, tnow, pz);
  }

  _drawCoin(x, y, p, spr) {
    const w = this.wAt(Math.min(p, 1.05)) / this.L * 2.1;
    const h = w * (spr.height / spr.width) * (0.75 + 0.25 * Math.min(1, p));
    const a = p < 0.06 ? Math.max(0, p / 0.06) : 1;
    if (a < 1) this.g.globalAlpha = a;
    this.g.drawImage(spr, x - w / 2, y - h * 0.4, w, h);
    if (a < 1) this.g.globalAlpha = 1;
  }

  _drawChain(n, now) {
    const P = n.path;
    const laneAt = t => {
      for (let i = 0; i < P.length - 1; i++) if (t <= P[i + 1][0]) { const f = (t - P[i][0]) / ((P[i + 1][0] - P[i][0]) || 1); return P[i][1] + (P[i + 1][1] - P[i][1]) * Math.max(0, Math.min(1, f)); }
      return P[P.length - 1][1];
    };
    const tTop = now + this.approach * 1.0, tBot = n.holding ? now : now - this.approach * 0.1;
    for (let i = 0; i < P.length - 1; i++) {
      let ta = P[i][0], tb = P[i + 1][0];
      if (tb < tBot || ta > tTop) continue;
      ta = Math.max(ta, tBot); tb = Math.min(tb, tTop);
      this._band(laneAt(ta), this.pOf(ta, now), laneAt(tb), this.pOf(tb, now), n.holding);
    }
    for (let i = n.holding ? (n.ni || 1) : 0; i < P.length; i++) {
      const p = this.pOf(P[i][0], now);
      if (p < 0 || p > 1.1) continue;
      this._drawCoin(this.xAt(P[i][1], p), this.yAt(p), p, this.coinHold);
    }
    if (n.holding) this._drawCoin(this.xAt(laneAt(now), 1), this.hitY, 1, this.coinHold);
  }

  _drawHold(n, now) {
    if (n.path) return this._drawChain(n, now);
    let p0 = this.pOf(n.t, now), p1 = this.pOf(n.end, now);
    const l2 = n.lane2 ?? n.lane;
    if (n.holding) {
      const k = Math.max(0, Math.min(1, (now - n.t) / (n.end - n.t)));
      const cur = n.lane + (l2 - n.lane) * k;
      if (p1 > 1.1) return;
      p1 = Math.max(p1, 0);
      this._band(cur, 1, l2, p1, true);
      this._drawCoin(this.xAt(l2, p1), this.yAt(p1), p1, this.coinHold);
      this._drawCoin(this.xAt(cur, 1), this.hitY, 1, this.coinHold);
      return;
    }
    if (p0 < 0 || p1 > 1.1) return;
    p0 = Math.min(p0, 1.1); p1 = Math.max(p1, 0);
    this._band(n.lane, p0, l2, p1, false);
    this._drawCoin(this.xAt(l2, p1), this.yAt(p1), p1, this.coinHold);
  }
  // banda dorada entre la cabeza (carril a, p0) y la cola (carril b, p1)
  // banda RECTA entre dos monedas (como en el original): de (carril a, p0) a (carril b, p1)
  _band(la, p0, lb, p1, active) {
    const g = this.g, L = this.L;
    const x0 = this.xAt(la, p0), y0 = this.yAt(p0), h0 = this.wAt(p0) / L * 0.85;
    const x1 = this.xAt(lb, p1), y1 = this.yAt(p1), h1 = this.wAt(p1) / L * 0.85;
    g.beginPath();
    g.moveTo(x1 - h1, y1); g.lineTo(x1 + h1, y1); g.lineTo(x0 + h0, y0); g.lineTo(x0 - h0, y0); g.closePath();
    const gr = g.createLinearGradient(0, y1, 0, y0);
    gr.addColorStop(0, `rgba(255,205,60,${active ? 0.6 : 0.45})`);
    gr.addColorStop(1, `rgba(255,225,110,${active ? 0.95 : 0.8})`);
    g.fillStyle = gr; g.fill();
    // brillo central
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x0, y0);
    g.strokeStyle = `rgba(255,250,210,${active ? 0.9 : 0.55})`; g.lineWidth = Math.max(1.5, (h0 + h1) * 0.12); g.stroke();
    if (active) { g.beginPath(); g.moveTo(x1 - h1, y1); g.lineTo(x1 + h1, y1); g.lineTo(x0 + h0, y0); g.lineTo(x0 - h0, y0); g.closePath(); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.5; g.stroke(); }
  }

  _drawHUD(now, tnow, pz) {
    const g = this.g, W = this.W, H = this.H;
    if (this.rec) {
      const S2 = this.land ? Math.min(1.25, H / 380) : Math.min(1.1, W / 420);
      g.save(); g.textBaseline = 'top'; g.textAlign = 'left';
      g.fillStyle = Math.floor(tnow / 500) % 2 ? '#ff3b5c' : 'rgba(255,59,92,0.5)';
      g.beginPath(); g.arc(70, 22 * S2, 7 * S2, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff'; g.font = `800 ${18 * S2}px ${FONT}`;
      const tt = Math.max(0, now); const mm = Math.floor(tt / 60), ss = Math.floor(tt % 60);
      g.fillText(`GRABANDO  ${mm}:${String(ss).padStart(2, '0')}  ·  ${this.rec.taps.length + this.rec.open.size} notas${this.rate < 1 ? '  ·  lenta' : ''}`, 84, 12 * S2);
      const prog = Math.max(0, Math.min(1, (now - this.off) / (this.endT - this.off)));
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(62, 38 * S2, 220 * S2, 3);
      g.fillStyle = '#ff3b5c'; g.fillRect(62, 38 * S2, 220 * S2 * prog, 3);
      if (now < this.off) { g.textAlign = 'center'; g.font = `800 ${26 * S2}px ${FONT}`; g.fillText('Prepárate… toca al ritmo', this.cx, H * 0.42); }
      g.restore();
      return;
    }
    const S = this.land ? Math.min(1.25, H / 380) : Math.min(1.1, W / 420);
    const target = this.score() + this.bonus;
    this.scoreShown += (target - this.scoreShown) * 0.25;
    if (Math.abs(target - this.scoreShown) < 1) this.scoreShown = target;
    this.bonusShown += (this.bonus - this.bonusShown) * 0.25;

    // marcador (arriba izquierda, junto a la pausa)
    const sx = 62, sy = 12;
    g.save();
    g.textBaseline = 'top'; g.textAlign = 'left';
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.font = `700 ${12 * S}px ${FONT}`;
    g.fillText('Ⓢ SCORE', sx, sy);
    g.font = `800 ${24 * S}px ${FONT}`;
    g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 6;
    skewText(g, fmtNum(this.scoreShown), sx + 64 * S, sy + 1);
    g.shadowBlur = 0;
    const lw = (this.land ? 200 : 150) * S;
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(sx, sy + 34 * S); g.lineTo(sx + lw, sy + 34 * S); g.lineTo(sx + lw + 18 * S, sy + 14 * S); g.stroke();
    const prog = Math.max(0, Math.min(1, (now - this.off) / (this.endT - this.off)));
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(sx, sy + 38 * S, lw, 3);
    g.fillStyle = '#7ce8ff'; g.fillRect(sx, sy + 38 * S, lw * prog, 3);
    g.restore();

    // medidor RAVE (arriba derecha)
    const rw = this.land ? Math.min(W * 0.3, 300 * S) : W * 0.3, ry = this.land ? 12 : 64 * S;
    const rx = W - rw - 14;
    g.save();
    g.textBaseline = 'top'; g.textAlign = 'right';
    g.font = `700 ${12 * S}px ${FONT}`; g.fillStyle = '#fff';
    g.fillText('⚡ ' + RAVE_NAMES[this.raveLv], W - 14, ry);
    const by = ry + 17 * S, bh = 7 * S;
    g.fillStyle = 'rgba(20,0,40,0.55)'; g.fillRect(rx, by, rw, bh);
    const lvCols = ['#9fe8ff', '#7cf0b5', '#ffd65a', '#ff7ad9', '#c49bff'];
    if (this.raveLv > 0) { g.fillStyle = hexA(lvCols[this.raveLv - 1], 0.55); g.fillRect(rx, by, rw, bh); }
    const bgr = g.createLinearGradient(rx, 0, rx + rw, 0);
    bgr.addColorStop(0, lvCols[this.raveLv]); bgr.addColorStop(1, '#ffffff');
    g.fillStyle = bgr; g.fillRect(rx, by, rw * this.rave, bh);
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 1; g.strokeRect(rx, by, rw, bh);
    if (this.raveLv > 0) {
      g.font = `700 ${11 * S}px ${FONT}`;
      g.fillText(`RAVE BONUS x${this.raveLv}`, W - 14, by + bh + 7 * S);
      g.font = `800 ${17 * S}px ${FONT}`; g.fillStyle = '#9ff0ff';
      g.fillText('+' + fmtNum(this.bonusShown), W - 14, by + bh + 20 * S);
    }
    g.restore();

    // carta que puntúa (arriba centro) + puntos ganados
    const pf = this.ptsFx;
    const cardH = (this.land ? 58 : 50) * S, cardW = cardH * 0.75, cxp = this.cx, cyp = this.land ? 6 : 58 * S;
    if (this.deck.length) {
      const ci = pf && pf.card >= 0 ? pf.card : 0;
      const im = this.deckImgs[ci];
      const age = pf ? (tnow - pf.t) / 1000 : 9;
      const pop = age < 0.12 ? 1 + 0.12 * (1 - age / 0.12) : 1;
      g.save();
      g.translate(cxp, cyp + cardH / 2); g.scale(pop, pop); g.translate(-cxp, -(cyp + cardH / 2));
      g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(cxp - cardW / 2 + 7, cyp + 4, cardW, cardH);
      g.fillStyle = '#fff'; g.fillRect(cxp - cardW / 2 - 2, cyp - 2, cardW + 4, cardH + 4);
      if (im && im.complete && im.naturalWidth) g.drawImage(im, cxp - cardW / 2, cyp, cardW, cardH);
      else { g.fillStyle = '#c49bff'; g.fillRect(cxp - cardW / 2, cyp, cardW, cardH); }
      g.strokeStyle = { C: '#b7c0cc', B: '#7fd1ff', A: '#ffd166', S: '#ff7eb6', R: '#c18cff' }[this.deck[ci].grade] || '#fff';
      g.lineWidth = 2; g.strokeRect(cxp - cardW / 2, cyp, cardW, cardH);
      g.restore();
      if (pf && tnow - pf.t < 700) {
        g.save(); g.textAlign = 'center'; g.textBaseline = 'top';
        g.font = `700 ${15 * S}px ${FONT}`; g.fillStyle = '#fff';
        g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 4;
        g.fillText('+' + fmtNum(pf.v), cxp, cyp + cardH + 5 * S);
        g.restore();
      }
    }

    // juicio y combo
    const midY = this.land ? H * 0.42 : this.topY + (this.hitY - this.topY) * 0.3;
    const jf = this.judgeFx;
    if (jf) {
      const age = (tnow - jf.t) / 1000;
      if (age < 0.7) {
        const sc = age < 0.07 ? 0.75 + age / 0.07 * 0.35 : 1.1 - Math.min(0.1, (age - 0.07) * 0.6);
        g.save();
        g.globalAlpha = age > 0.5 ? 1 - (age - 0.5) / 0.2 : 1;
        g.translate(this.cx, midY); g.scale(sc, sc);
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = `800 ${36 * S}px ${FONT}`;
        const name = JUDGE_NAMES[jf.j];
        let fill;
        if (jf.j === 0) { fill = g.createLinearGradient(-100 * S, 0, 100 * S, 0); fill.addColorStop(0, '#ff5fa8'); fill.addColorStop(0.5, '#c88bff'); fill.addColorStop(1, '#5fd0ff'); }
        else fill = ['#fff', '#ffd65a', '#7bf0b2', '#ff9f6b', '#ff6b9a'][jf.j];
        g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,0.85)';
        skewText(g, name, 0, 0, true);
        g.fillStyle = fill; skewText(g, name, 0, 0);
        g.restore();
      }
    }
    if (this.combo >= 2) {
      g.save();
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `800 ${(52 * S * (1 + 0.07 * pz)).toFixed(1)}px ${FONT}`;
      const cg = g.createLinearGradient(0, midY + 20 * S, 0, midY + 80 * S);
      cg.addColorStop(0, '#ffffff'); cg.addColorStop(1, this.combo >= 100 ? '#ff9bd2' : '#7fd8ff');
      g.lineWidth = 4; g.strokeStyle = 'rgba(40,0,80,0.45)';
      g.translate(this.cx, midY + 48 * S);
      skewText(g, String(this.combo), 0, 0, true);
      g.fillStyle = cg; skewText(g, String(this.combo), 0, 0);
      g.restore();
    }

    // cut-in del miembro
    if (this.cutin) {
      const age = (tnow - this.cutin.t) / 1000;
      if (age > 1.8) this.cutin = null;
      else {
        const c = this.deck[this.cutin.i], im2 = this.deckImgs[this.cutin.i];
        const bw = this.land ? Math.min(W * 0.32, 300 * S) : W * 0.55, bh2 = bw * 0.36;
        const slide = age < 0.25 ? 1 - age / 0.25 : age > 1.5 ? (age - 1.5) / 0.3 : 0;
        const x0 = -bw * slide, y0 = midY - bh2 * 0.6;
        g.save();
        g.globalAlpha = 1 - Math.max(0, (age - 1.5) / 0.3);
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + bw, y0); g.lineTo(x0 + bw - bh2 * 0.35, y0 + bh2); g.lineTo(x0, y0 + bh2); g.closePath();
        g.save(); g.clip();
        g.fillStyle = '#fff'; g.fillRect(x0, y0, bw, bh2);
        if (im2 && im2.complete && im2.naturalWidth) {
          const s = bw / im2.naturalWidth;
          g.drawImage(im2, x0, y0 - im2.naturalHeight * s * 0.12, bw, im2.naturalHeight * s);
        }
        const fade = g.createLinearGradient(x0, 0, x0 + bw, 0);
        fade.addColorStop(0, 'rgba(60,140,255,0.55)'); fade.addColorStop(0.5, 'rgba(255,255,255,0)');
        g.fillStyle = fade; g.fillRect(x0, y0, bw, bh2);
        g.restore();
        g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 2; g.stroke();
        g.font = `800 ${15 * S}px ${FONT}`; g.textBaseline = 'bottom'; g.textAlign = 'left';
        g.fillStyle = '#fff'; g.shadowColor = 'rgba(0,40,120,0.8)'; g.shadowBlur = 6;
        skewText(g, (c.name || '').toUpperCase(), x0 + 10, y0 + bh2 - 4);
        g.restore();
      }
    }

    const ca = (tnow - this.climaxT) / 1000;
    if (ca < 1.2) {
      g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
      g.globalAlpha = ca < 0.15 ? ca / 0.15 : Math.max(0, 1 - (ca - 0.7) / 0.5);
      const sc = 1 + 0.25 * Math.max(0, 1 - ca / 0.25);
      g.translate(this.cx, this.land ? H * 0.24 : this.topY + 20 * S); g.scale(sc, sc);
      g.font = `800 ${30 * S}px ${FONT}`;
      const cg2 = g.createLinearGradient(-90 * S, 0, 90 * S, 0); cg2.addColorStop(0, '#ffe37a'); cg2.addColorStop(0.5, '#ffffff'); cg2.addColorStop(1, '#ff8ad8');
      g.shadowColor = '#ff5fa8'; g.shadowBlur = 20; g.fillStyle = cg2;
      skewText(g, '✦ CLIMAX ✦', 0, 0);
      g.restore();
    }
    if (now < this.off) {
      g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#fff'; g.font = `800 ${30 * S}px ${FONT}`;
      g.shadowColor = '#ff5fa8'; g.shadowBlur = 16;
      skewText(g, this.o.title || '', this.cx, H * 0.45);
      g.font = `700 ${14 * S}px ${FONT}`; g.shadowBlur = 0;
      g.fillText('READY?', this.cx, H * 0.45 + 30 * S);
      g.restore();
    }
    if (this.ended) {
      g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `800 ${44 * S}px ${FONT}`;
      const label = this.counts[0] === this.total && this.total ? 'ALL S·PERFECT!' : (this.counts[3] + this.counts[4] === 0 && this.total ? 'FULL COMBO!' : 'CLEAR!');
      g.fillStyle = '#fff'; g.shadowColor = '#ff5fa8'; g.shadowBlur = 24;
      skewText(g, label, this.cx, H * 0.5);
      g.restore();
    }
  }
}

// ---------- utilidades de dibujo ----------
function skewText(g, text, x, y, stroke = false) {
  g.save(); g.translate(x, y); g.transform(1, 0, -0.18, 1, 0, 0);
  if (stroke) g.strokeText(text, 0, 0); else g.fillText(text, 0, 0);
  g.restore();
}
function fmtNum(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function drawStar(g, x, y, r, rot) {
  g.beginPath();
  for (let i = 0; i < 8; i++) { const a = rot + i * Math.PI / 4, rr = i % 2 ? r * 0.28 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath(); g.fill();
}
// Moneda dorada en perspectiva: cara elíptica + canto.
function mkCoin(c1, c2, ring = false) {
  const W = 220, H = 110, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const cx = W / 2, cy = 44, rx = 100, ry = 36, th = 16;
  const halo = g.createRadialGradient(cx, cy + 8, 10, cx, cy + 8, rx * 1.1);
  halo.addColorStop(0, hexA(c1, 0.45)); halo.addColorStop(1, hexA(c1, 0));
  g.fillStyle = halo; g.fillRect(0, 0, W, H);
  g.fillStyle = c2;
  g.beginPath(); g.ellipse(cx, cy + th, rx, ry, 0, 0, Math.PI); g.lineTo(cx - rx, cy); g.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true); g.closePath(); g.fill();
  const edge = g.createLinearGradient(cx - rx, 0, cx + rx, 0);
  edge.addColorStop(0, 'rgba(120,60,0,0.6)'); edge.addColorStop(0.5, 'rgba(255,230,140,0.4)'); edge.addColorStop(1, 'rgba(120,60,0,0.6)');
  g.fillStyle = edge; g.fill();
  const face = g.createRadialGradient(cx - rx * 0.3, cy - ry * 0.5, 4, cx, cy, rx);
  face.addColorStop(0, '#fffbe0'); face.addColorStop(0.35, c1); face.addColorStop(1, c2);
  g.fillStyle = face; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(255,250,220,0.95)'; g.lineWidth = 4;
  g.beginPath(); g.ellipse(cx, cy, rx * 0.97, ry * 0.94, 0, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = hexA(c2, 0.45); g.lineWidth = 3;
  g.beginPath(); g.ellipse(cx, cy, rx * 0.7, ry * 0.66, 0, 0, Math.PI * 2); g.stroke();
  if (ring) { g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 5; g.beginPath(); g.ellipse(cx, cy, rx * 0.42, ry * 0.4, 0, 0, Math.PI * 2); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,0.75)';
  g.beginPath(); g.ellipse(cx - rx * 0.35, cy - ry * 0.45, rx * 0.32, ry * 0.16, -0.1, 0, Math.PI * 2); g.fill();
  return c;
}
// Gema morada facetada (notas dobles).
function mkGem() {
  const W = 220, H = 110, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const cx = W / 2, cy = 46, rx = 100, ry = 34, th = 20;
  const halo = g.createRadialGradient(cx, cy, 10, cx, cy, rx * 1.1);
  halo.addColorStop(0, 'rgba(230,140,255,0.5)'); halo.addColorStop(1, 'rgba(230,140,255,0)');
  g.fillStyle = halo; g.fillRect(0, 0, W, H);
  g.fillStyle = '#7a2bd6';
  g.beginPath(); g.ellipse(cx, cy + th, rx * 0.9, ry * 0.9, 0, 0, Math.PI); g.lineTo(cx - rx, cy); g.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true); g.closePath(); g.fill();
  const face = g.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry);
  face.addColorStop(0, '#f6d4ff'); face.addColorStop(0.4, '#c56bff'); face.addColorStop(0.7, '#9a3df0'); face.addColorStop(1, '#ff8ae0');
  g.fillStyle = face; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    g.beginPath(); g.moveTo(cx + Math.cos(a) * rx * 0.45, cy + Math.sin(a) * ry * 0.45); g.lineTo(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry); g.stroke();
  }
  g.beginPath(); g.ellipse(cx, cy, rx * 0.45, ry * 0.45, 0, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 3;
  g.beginPath(); g.ellipse(cx, cy, rx * 0.98, ry * 0.95, 0, 0, Math.PI * 2); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.8)';
  g.beginPath(); g.ellipse(cx - rx * 0.3, cy - ry * 0.4, rx * 0.25, ry * 0.14, -0.1, 0, Math.PI * 2); g.fill();
  return c;
}
