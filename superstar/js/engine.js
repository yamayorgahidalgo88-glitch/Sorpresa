// Motor de juego: notas que caen por carriles en perspectiva hacia los botones.

export const JUDGE_NAMES = ['S.PERFECT', 'PERFECT', 'GOOD', 'BAD', 'MISS'];
const MULT = [1, 0.85, 0.5, 0.2, 0];
const WIN = { sp: 0.042, p: 0.085, gEarly: 0.135, bEarly: 0.18, late: 0.12 };

const LANE_COLORS = {
  3: ['#7bdcff', '#ff7ad9', '#7bdcff'],
  4: ['#7bdcff', '#ff7ad9', '#ff7ad9', '#7bdcff'],
  7: ['#7bdcff', '#c59bff', '#ff7ad9', '#ffe27a', '#ff7ad9', '#c59bff', '#7bdcff'],
};
const KEYS = {
  3: ['KeyF', 'Space', 'KeyJ'],
  4: ['KeyD', 'KeyF', 'KeyJ', 'KeyK'],
  7: ['KeyS', 'KeyD', 'KeyF', 'Space', 'KeyJ', 'KeyK', 'KeyL'],
};

export class Game {
  constructor(canvas, opts) {
    this.cv = canvas;
    this.g = canvas.getContext('2d');
    this.o = opts; // {ctx, buffer, chart, settings, maxScore, title, theme:{c1,c2}, onEnd, onPause}
    this.ctx = opts.ctx;
    this.L = opts.chart.lanes;
    this.colors = LANE_COLORS[this.L] || LANE_COLORS[4];
    this.keys = KEYS[this.L] || KEYS[4];
    this.notes = opts.chart.notes.map((n, i) => ({ ...n, i, head: -1, tail: -1, holding: false, done: false }));
    this.total = this.notes.reduce((a, n) => a + (n.end ? 2 : 1), 0);
    let mr = 0;
    for (let k = 0; k < this.total; k++) mr += 1 + Math.min(k, 100) / 400;
    this.maxRaw = mr || 1;
    this.raw = 0; this.combo = 0; this.maxCombo = 0;
    this.counts = [0, 0, 0, 0, 0];
    this.judged = 0;
    this.approach = 2.7 - opts.settings.speed * 0.21; // speed 1..10
    this.laneDown = new Array(this.L).fill(0);
    this.laneFlash = new Array(this.L).fill(-9);
    this.pointers = new Map();
    this.particles = [];
    this.rings = [];
    this.judgeFx = null;
    this.paused = false;
    this.ended = false;
    this.scoreShown = 0;
    this.nextIdx = 0;
    this.lastT = this.notes.length ? Math.max(...this.notes.map(n => n.end || n.t)) : 0;
    this._raf = 0;
    this._initVisuals();
    this._bind();
    this.resize();
    this._makeSfx();
  }

  // ---------- audio y tiempo ----------
  start() {
    const ctx = this.ctx;
    const first = this.notes.length ? this.notes[0].t : 0;
    const lead = Math.max(1.6, this.approach - first + 0.6);
    this.gain = ctx.createGain();
    this.gain.gain.value = this.o.settings.music;
    this.gain.connect(ctx.destination);
    this.src = ctx.createBufferSource();
    this.src.buffer = this.o.buffer;
    this.src.connect(this.gain);
    this.startAt = ctx.currentTime + lead;
    this.src.start(this.startAt);
    this.latency = (ctx.outputLatency || 0) + (ctx.baseLatency || 0);
    this._loop = this._loop.bind(this);
    this._raf = requestAnimationFrame(this._loop);
  }
  now() {
    return this.ctx.currentTime - this.startAt - this.latency + (this.o.settings.offset || 0) / 1000;
  }
  pause() {
    if (this.paused || this.ended) return;
    this.paused = true;
    this.ctx.suspend();
    for (const k of this.pointers.keys()) this._release(this.pointers.get(k));
    this.pointers.clear();
  }
  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.ctx.resume();
  }
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
    this.W = w; this.H = h;
    this.cx = w / 2;
    this.bw = Math.min(w * 0.98, h * 0.66);
    this.tw = this.bw * 0.3;
    this.topY = h * 0.13;
    this.hitY = h * 0.8;
    this.dpr = dpr;
    this._buildBg();
  }
  f(p) { return p * p * 0.42 + p * 0.58; }         // aceleración hacia abajo (perspectiva)
  yAt(p) { return this.topY + (this.hitY - this.topY) * this.f(p); }
  wAt(p) { return this.tw + (this.bw - this.tw) * this.f(p); }
  xAt(lane, p) { return this.cx + ((lane + 0.5) / this.L - 0.5) * this.wAt(p); }
  edgeX(k, p) { return this.cx + (k / this.L - 0.5) * this.wAt(p); }
  pOf(t, now) { return 1 - (t - now) / this.approach; }
  laneAt(x) {
    const l = Math.floor(((x - this.cx) / this.bw + 0.5) * this.L);
    return Math.max(0, Math.min(this.L - 1, l));
  }

  // ---------- entrada ----------
  _bind() {
    this._pd = e => {
      if (this.paused || this.ended) return;
      e.preventDefault();
      const r = this.cv.getBoundingClientRect();
      const lane = this.laneAt(e.clientX - r.left);
      this.pointers.set(e.pointerId, lane);
      try { this.cv.setPointerCapture(e.pointerId); } catch {}
      this._press(lane);
    };
    this._pm = e => {
      if (!this.pointers.has(e.pointerId) || this.paused) return;
      const r = this.cv.getBoundingClientRect();
      const lane = this.laneAt(e.clientX - r.left);
      const old = this.pointers.get(e.pointerId);
      if (lane !== old) {
        // deslizar: si no se está manteniendo una nota larga, cambia de carril
        const holding = this.notes.some(n => n.holding && n.lane === old);
        if (!holding) { this.pointers.set(e.pointerId, lane); this._release(old); this._press(lane, true); }
      }
    };
    this._pu = e => {
      if (!this.pointers.has(e.pointerId)) return;
      const lane = this.pointers.get(e.pointerId);
      this.pointers.delete(e.pointerId);
      this._release(lane);
    };
    this._kd = e => {
      if (e.repeat) return;
      if (e.code === 'Escape' || e.code === 'KeyP') { this.o.onPause && this.o.onPause(); return; }
      const lane = this.keys.indexOf(e.code);
      if (lane < 0 || this.paused || this.ended) return;
      e.preventDefault();
      this._press(lane);
    };
    this._ku = e => {
      const lane = this.keys.indexOf(e.code);
      if (lane >= 0) this._release(lane);
    };
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

  _press(lane, slide = false) {
    const now = this.now();
    this.laneDown[lane]++;
    this.laneFlash[lane] = now;
    if (!slide) this._sfx();
    // nota más cercana sin juzgar en ese carril
    let best = null, bd = 1e9;
    for (let k = this.nextIdx; k < this.notes.length; k++) {
      const n = this.notes[k];
      if (n.t - now > WIN.bEarly) break;
      if (n.lane !== lane || n.head >= 0) continue;
      const d = now - n.t;
      if (d < -WIN.bEarly || d > WIN.late) continue;
      if (Math.abs(d) < bd) { bd = Math.abs(d); best = n; }
    }
    if (!best) return;
    const d = now - best.t;
    // deslizando sólo cuentan aciertos buenos (no castiga pasar por encima)
    let j;
    const a = Math.abs(d);
    if (a <= WIN.sp) j = 0;
    else if (a <= WIN.p) j = 1;
    else if (d < 0) j = a <= WIN.gEarly ? 2 : 3;
    else j = 2;
    if (slide && j > 1) return;
    best.head = j;
    this._judge(j, lane);
    if (best.end) best.holding = true; else best.done = true;
  }

  _release(lane) {
    this.laneDown[lane] = Math.max(0, this.laneDown[lane] - 1);
    if (this.laneDown[lane] > 0) return;
    const now = this.now();
    for (const n of this.notes) {
      if (!n.holding || n.lane !== lane) continue;
      n.holding = false; n.done = true;
      const d = now - n.end;
      // las largas se juzgan con más cariño
      const j = d >= -0.1 ? 0 : d >= -0.18 ? 1 : d >= -0.3 ? 2 : 4;
      n.tail = j;
      this._judge(j, lane);
    }
  }

  _judge(j, lane) {
    this.counts[j]++;
    this.judged++;
    if (j <= 2) {
      this.raw += MULT[j] * (1 + Math.min(this.combo, 100) / 400);
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
    } else {
      this.raw += MULT[j];
      this.combo = 0;
    }
    this.judgeFx = { j, t: performance.now() };
    if (j <= 2 && lane >= 0 && this.o.settings.fx !== false) this._burst(lane, j);
  }

  score() { return Math.round(this.o.maxScore * Math.min(1, this.raw / this.maxRaw)); }

  _burst(lane, j) {
    const x = this.xAt(lane, 1), y = this.hitY;
    const col = j === 0 ? '#ffffff' : this.colors[lane];
    this.rings.push({ x, y, t: performance.now(), col, big: j === 0 });
    if (j === 0) this.flashes.push({ lane, t: performance.now() });
    const n = j === 0 ? 16 : 9;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3, s = 160 + Math.random() * 300;
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.45 + Math.random() * 0.35, age: 0, rot: Math.random() * 6, star: Math.random() < (j === 0 ? 0.55 : 0.3), col: Math.random() < 0.45 ? '#fff' : this.colors[lane], r: 1.5 + Math.random() * 2.5 });
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

  _update(now) {
    for (let k = this.nextIdx; k < this.notes.length; k++) {
      const n = this.notes[k];
      if (n.t - now > 0) break;
      if (n.head < 0 && now - n.t > WIN.late) {
        n.head = 4; this._judge(4, -1);
        if (n.end) { n.tail = 4; this._judge(4, -1); }
        n.done = true;
      }
      if (n.holding && now >= n.end) {
        n.holding = false; n.done = true; n.tail = 0; this._judge(0, n.lane);
      }
    }
    while (this.nextIdx < this.notes.length && this.notes[this.nextIdx].done) this.nextIdx++;
    const dur = this.o.buffer.duration;
    const allDone = this.nextIdx >= this.notes.length;
    if (!this.ended && ((allDone && now > this.lastT + 2.2) || now > dur + 0.3)) this._finish();
  }

  _finish() {
    this.ended = true;
    if (this.gain) {
      const t = this.ctx.currentTime;
      this.gain.gain.setValueAtTime(this.gain.gain.value, t);
      this.gain.gain.linearRampToValueAtTime(0, t + 1.2);
    }
    const res = {
      score: this.score(),
      maxCombo: this.maxCombo,
      counts: [...this.counts],
      total: this.total,
      ratio: this.raw / this.maxRaw,
      fc: this.counts[3] === 0 && this.counts[4] === 0 && this.total > 0,
      ap: this.counts[0] === this.total && this.total > 0,
    };
    setTimeout(() => this.o.onEnd(res), 1300);
  }

  // ---------- dibujo ----------
  _initVisuals() {
    const th = this.o.theme || { c1: '#2a0f5c', c2: '#b38cff' };
    this.th = th;
    this.bpm = this.o.chart.bpm || 0;
    this.phase = this.o.chart.phase || 0;
    this.flashes = [];
    this.sprites = {};
    for (const col of new Set(this.colors)) this.sprites[col] = { tap: mkNote(col, false), head: mkNote(col, true) };
    // público con lightsticks (posiciones fijas, se mueven al ritmo)
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    this.crowd = [];
    for (let i = 0; i < 90; i++) {
      this.crowd.push({ side: i % 2 ? 1 : -1, p: 0.05 + rnd() * 0.75, off: rnd(), ph: rnd() * 6.28, col: ['#c59bff', '#ff7ad9', '#ffffff', '#9fd8ff'][Math.floor(rnd() * 4)] });
    }
    this.eq = Array.from({ length: 14 }, () => rnd());
  }

  _buildBg() {
    const W = this.W, H = this.H, dpr = this.dpr;
    const c = document.createElement('canvas');
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    // cielo del estadio
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, mix(this.th.c1, '#05010f', 0.55));
    sky.addColorStop(0.45, mix(this.th.c2, '#0b0420', 0.78));
    sky.addColorStop(1, '#05010d');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    // resplandor del escenario en el horizonte
    const hz = g.createRadialGradient(this.cx, this.topY, 0, this.cx, this.topY, W * 0.75);
    hz.addColorStop(0, hexA(mix(this.th.c2, '#ffffff', 0.35), 0.55));
    hz.addColorStop(0.35, hexA(this.th.c2, 0.18));
    hz.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = hz; g.fillRect(0, 0, W, H);
    // estructura del escenario (truss)
    g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 1;
    const ty = this.topY - 34;
    g.beginPath(); g.moveTo(this.cx - this.tw * 1.6, ty); g.lineTo(this.cx + this.tw * 1.6, ty); g.stroke();
    for (let k = -8; k <= 8; k++) { const x = this.cx + k * this.tw * 0.2; g.beginPath(); g.moveTo(x, ty - 6); g.lineTo(x + this.tw * 0.1, ty); g.lineTo(x + this.tw * 0.2, ty - 6); g.stroke(); }
    // suelo del estadio fuera de la pista: rejilla en perspectiva
    g.strokeStyle = 'rgba(180,140,255,0.07)';
    for (let k = -14; k <= 14; k++) {
      g.beginPath(); g.moveTo(this.cx + k * this.tw * 0.25, this.topY); g.lineTo(this.cx + k * this.bw * 0.45, H); g.stroke();
    }
    // pista: suelo de cristal
    const L = this.L;
    g.beginPath();
    g.moveTo(this.edgeX(0, 0), this.yAt(0)); g.lineTo(this.edgeX(L, 0), this.yAt(0));
    g.lineTo(this.edgeX(L, 1.14), this.yAt(1.14)); g.lineTo(this.edgeX(0, 1.14), this.yAt(1.14)); g.closePath();
    const fl = g.createLinearGradient(0, this.topY, 0, this.hitY);
    fl.addColorStop(0, 'rgba(12,6,34,0.25)'); fl.addColorStop(0.5, 'rgba(10,5,30,0.72)'); fl.addColorStop(1, 'rgba(8,3,24,0.9)');
    g.fillStyle = fl; g.fill();
    // carriles alternos
    for (let l = 0; l < L; l++) {
      if (l % 2) continue;
      g.beginPath();
      g.moveTo(this.edgeX(l, 0), this.yAt(0)); g.lineTo(this.edgeX(l + 1, 0), this.yAt(0));
      g.lineTo(this.edgeX(l + 1, 1.14), this.yAt(1.14)); g.lineTo(this.edgeX(l, 1.14), this.yAt(1.14)); g.closePath();
      g.fillStyle = 'rgba(255,255,255,0.025)'; g.fill();
    }
    // separadores
    for (let k = 1; k < L; k++) {
      const gr = g.createLinearGradient(0, this.topY, 0, this.hitY);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,0.16)');
      g.strokeStyle = gr; g.lineWidth = 1;
      g.beginPath(); g.moveTo(this.edgeX(k, 0), this.yAt(0)); g.lineTo(this.edgeX(k, 1.14), this.yAt(1.14)); g.stroke();
    }
    // bordes de neón
    for (const k of [0, L]) {
      const col = k === 0 ? '#7bdcff' : '#ff7ad9';
      const gr = g.createLinearGradient(0, this.topY, 0, this.hitY);
      gr.addColorStop(0, hexA(col, 0)); gr.addColorStop(0.4, hexA(col, 0.5)); gr.addColorStop(1, hexA(col, 0.95));
      g.strokeStyle = gr;
      for (const [w, a] of [[9, 0.12], [4, 0.3], [1.6, 1]]) {
        g.globalAlpha = a; g.lineWidth = w;
        g.beginPath(); g.moveTo(this.edgeX(k, 0), this.yAt(0)); g.lineTo(this.edgeX(k, 1.14), this.yAt(1.14)); g.stroke();
      }
      g.globalAlpha = 1;
    }
    // zona inferior (bajo los botones)
    const bot = g.createLinearGradient(0, this.hitY, 0, H);
    bot.addColorStop(0, 'rgba(5,1,13,0)'); bot.addColorStop(0.5, 'rgba(5,1,13,0.55)'); bot.addColorStop(1, 'rgba(5,1,13,0.9)');
    g.fillStyle = bot; g.fillRect(0, this.hitY, W, H - this.hitY);
    this.bg = c;

    // botones pre-renderizados (reposo y pulsado) por color
    const r = (this.bw / L) * 0.37;
    this.rBtn = r;
    this.btnSpr = {};
    for (const col of new Set(this.colors)) this.btnSpr[col] = [mkButton(col, r, false, dpr), mkButton(col, r, true, dpr)];
  }

  _beat(now) {
    if (!this.bpm) return { pulse: 0, idx: 0 };
    const period = 60 / this.bpm;
    const x = (now - this.phase) / period;
    const frac = x - Math.floor(x);
    return { pulse: Math.exp(-frac * 5), idx: Math.floor(x) };
  }

  _draw(now, dt) {
    const g = this.g, W = this.W, H = this.H, L = this.L;
    const tnow = performance.now();
    const T = tnow / 1000;
    const { pulse, idx } = this._beat(now);
    const live = now > 0 && !this.paused;
    const pz = live ? pulse : 0;

    g.drawImage(this.bg, 0, 0, W, H);

    // ---- focos del escenario (aditivos) ----
    g.save();
    g.globalCompositeOperation = 'lighter';
    const spots = [0.08, 0.32, 0.68, 0.92];
    spots.forEach((sx, i) => {
      const x0 = W * sx, y0 = -10;
      const ang = Math.PI / 2 + (i < 2 ? -1 : 1) * (0.25 + 0.22 * Math.sin(T * 0.7 + i * 1.7));
      const len = H * 0.95, spread = 0.11;
      const col = i % 2 ? this.th.c2 : '#9fd8ff';
      const a = 0.07 + 0.1 * pz;
      const gr = g.createLinearGradient(x0, y0, x0 + Math.cos(ang) * len, y0 + Math.sin(ang) * len);
      gr.addColorStop(0, hexA(col, a * 2.2)); gr.addColorStop(1, hexA(col, 0));
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(x0, y0);
      g.lineTo(x0 + Math.cos(ang - spread) * len, y0 + Math.sin(ang - spread) * len);
      g.lineTo(x0 + Math.cos(ang + spread) * len, y0 + Math.sin(ang + spread) * len);
      g.closePath(); g.fill();
    });

    // ---- ecualizador del escenario ----
    const eqW = this.tw * 1.5, n = this.eq.length, bwid = eqW / n;
    for (let k = 0; k < n; k++) {
      const v = 0.25 + 0.75 * Math.abs(Math.sin(T * (1.3 + this.eq[k] * 2) + k)) * (0.45 + 0.55 * pz);
      const h = 26 * v;
      const x = this.cx - eqW / 2 + k * bwid;
      const gr = g.createLinearGradient(0, this.topY - h, 0, this.topY);
      gr.addColorStop(0, hexA('#ff7ad9', 0.75)); gr.addColorStop(1, hexA('#7bdcff', 0.35));
      g.fillStyle = gr;
      g.fillRect(x + 1, this.topY - 4 - h, bwid - 2, h);
    }

    // ---- público con lightsticks ----
    for (const c of this.crowd) {
      const y = this.yAt(c.p) + 10;
      const edge = c.side < 0 ? this.edgeX(0, c.p) : this.edgeX(L, c.p);
      const room = c.side < 0 ? edge : W - edge;
      if (room < 12) continue;
      const x = c.side < 0 ? edge - 8 - c.off * (room - 10) : edge + 8 + c.off * (room - 10);
      const s = 0.6 + c.p * 1.6;
      const sway = Math.sin(T * (this.bpm ? this.bpm / 60 * Math.PI : 3) + c.ph) * 4 * s;
      const a = 0.35 + 0.45 * pz;
      g.globalAlpha = a;
      g.strokeStyle = c.col; g.lineWidth = 1.2 * s;
      g.beginPath(); g.moveTo(x, y + 6 * s); g.lineTo(x + sway, y - 3 * s); g.stroke();
      g.fillStyle = c.col;
      g.beginPath(); g.arc(x + sway, y - 4 * s, 2.2 * s, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
    g.restore();

    // ---- líneas de compás que bajan con la música ----
    if (this.bpm) {
      const period = 60 / this.bpm;
      const k0 = Math.ceil((now - this.phase - period) / period);
      for (let k = k0; ; k++) {
        const t = this.phase + k * period;
        const p = this.pOf(t, now);
        if (p < 0) break;
        if (p > 1.02) continue;
        const down = k % 4 === 0;
        g.strokeStyle = `rgba(255,255,255,${(down ? 0.2 : 0.07) * Math.min(1, p * 2.5)})`;
        g.lineWidth = down ? 2 : 1;
        g.beginPath(); g.moveTo(this.edgeX(0, p), this.yAt(p)); g.lineTo(this.edgeX(L, p), this.yAt(p)); g.stroke();
      }
    }

    // ---- haces de carril pulsado ----
    for (let l = 0; l < L; l++) {
      const age = now - this.laneFlash[l];
      const on = this.laneDown[l] > 0;
      const a = on ? 0.5 : Math.max(0, 0.42 - age * 2.2);
      if (a <= 0) continue;
      g.beginPath();
      g.moveTo(this.edgeX(l, 0.2), this.yAt(0.2)); g.lineTo(this.edgeX(l + 1, 0.2), this.yAt(0.2));
      g.lineTo(this.edgeX(l + 1, 1), this.yAt(1)); g.lineTo(this.edgeX(l, 1), this.yAt(1)); g.closePath();
      const bg = g.createLinearGradient(0, this.yAt(0.2), 0, this.hitY);
      bg.addColorStop(0, 'rgba(255,255,255,0)'); bg.addColorStop(1, hexA(this.colors[l], a));
      g.fillStyle = bg; g.fill();
    }
    // destellos de S.PERFECT (pilar de luz)
    this.flashes = this.flashes.filter(f => tnow - f.t < 260);
    for (const f of this.flashes) {
      const k = 1 - (tnow - f.t) / 260;
      g.beginPath();
      g.moveTo(this.edgeX(f.lane + 0.15, 0.05), this.yAt(0.05)); g.lineTo(this.edgeX(f.lane + 0.85, 0.05), this.yAt(0.05));
      g.lineTo(this.edgeX(f.lane + 0.85, 1), this.hitY); g.lineTo(this.edgeX(f.lane + 0.15, 1), this.hitY); g.closePath();
      const gr = g.createLinearGradient(0, this.yAt(0.05), 0, this.hitY);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, `rgba(255,255,255,${0.55 * k})`);
      g.fillStyle = gr; g.fill();
    }

    // ---- línea de golpeo ----
    const hl = g.createLinearGradient(this.edgeX(0, 1), 0, this.edgeX(L, 1), 0);
    hl.addColorStop(0, 'rgba(123,220,255,0.2)'); hl.addColorStop(0.5, `rgba(255,255,255,${0.75 + 0.25 * pz})`); hl.addColorStop(1, 'rgba(255,122,217,0.2)');
    g.fillStyle = hl;
    g.fillRect(this.edgeX(0, 1), this.hitY - 1.5, this.edgeX(L, 1) - this.edgeX(0, 1), 3);
    const glow = g.createLinearGradient(0, this.hitY - 22, 0, this.hitY + 22);
    glow.addColorStop(0, 'rgba(255,255,255,0)'); glow.addColorStop(0.5, `rgba(255,200,240,${0.12 + 0.12 * pz})`); glow.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = glow;
    g.fillRect(this.edgeX(0, 1), this.hitY - 22, this.edgeX(L, 1) - this.edgeX(0, 1), 44);

    // ---- botones ----
    const R = this.rBtn;
    for (let l = 0; l < L; l++) {
      const x = this.xAt(l, 1), y = this.hitY;
      const on = this.laneDown[l] > 0;
      const spr = this.btnSpr[this.colors[l]][on ? 1 : 0];
      const sc = (on ? 0.93 : 1) * (1 + 0.035 * pz);
      const s = spr.width / this.dpr * sc;
      g.drawImage(spr, x - s / 2, y - s / 2, s, s);
    }

    // ---- notas (de atrás hacia delante) ----
    const vis = [];
    for (let k = this.nextIdx; k < this.notes.length; k++) {
      const n = this.notes[k];
      const p = this.pOf(n.t, now);
      if (p < -0.02) break;
      if (n.done && !n.holding) continue;
      vis.push(n);
    }
    for (let k = vis.length - 1; k >= 0; k--) if (vis[k].end) this._drawHold(vis[k], now, T);
    for (let k = vis.length - 1; k >= 0; k--) {
      const n = vis[k];
      if (n.holding) continue;
      const p = this.pOf(n.t, now);
      if (p > 1.15) continue;
      const fade = p < 0.08 ? Math.max(0, p / 0.08) : 1;
      this._drawNote(this.xAt(n.lane, p), this.yAt(p), (this.wAt(p) / L) * 0.36, this.colors[n.lane], !!n.end, fade);
    }

    // ---- anillos y partículas ----
    this.rings = this.rings.filter(r => tnow - r.t < 420);
    for (const r of this.rings) {
      const k = (tnow - r.t) / 420;
      g.beginPath(); g.arc(r.x, r.y, R * (1 + k * (r.big ? 1.25 : 0.85)), 0, Math.PI * 2);
      g.strokeStyle = hexA(r.col, (1 - k) * 0.9); g.lineWidth = (r.big ? 6 : 3.5) * (1 - k) + 0.5; g.stroke();
      if (r.big) {
        g.beginPath(); g.arc(r.x, r.y, R * (0.8 + k * 0.7), 0, Math.PI * 2);
        g.strokeStyle = hexA('#ffffff', (1 - k) * 0.6); g.lineWidth = 2; g.stroke();
      }
    }
    for (const p of this.particles) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 650 * dt; p.rot += dt * 6; }
    this.particles = this.particles.filter(p => p.age < p.life);
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (const p of this.particles) {
      g.globalAlpha = 1 - p.age / p.life;
      g.fillStyle = p.col;
      if (p.star) drawStar(g, p.x, p.y, p.r * 2.2, p.rot);
      else { g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill(); }
    }
    g.restore();
    g.globalAlpha = 1;

    this._drawHUD(now, tnow, pz, idx);
  }

  _drawNote(x, y, r, col, isHoldHead, alpha = 1) {
    const spr = this.sprites[col][isHoldHead ? 'head' : 'tap'];
    const s = r * (160 / 48);
    if (alpha < 1) this.g.globalAlpha = alpha;
    this.g.drawImage(spr, x - s / 2, y - s / 2, s, s);
    if (alpha < 1) this.g.globalAlpha = 1;
  }

  _drawHold(n, now, T) {
    const g = this.g, L = this.L;
    let p0 = this.pOf(n.t, now), p1 = this.pOf(n.end, now);
    if (n.holding) p0 = 1;
    if (p0 < 0 || p1 > 1.12) return;
    p0 = Math.min(p0, 1.12); p1 = Math.max(p1, 0);
    const half = k => (this.wAt(k) / L) * 0.24;
    const x0 = this.xAt(n.lane, p0), y0 = this.yAt(p0), x1 = this.xAt(n.lane, p1), y1 = this.yAt(p1);
    const col = this.colors[n.lane];
    const path = () => { g.beginPath(); g.moveTo(x1 - half(p1), y1); g.lineTo(x1 + half(p1), y1); g.lineTo(x0 + half(p0), y0); g.lineTo(x0 - half(p0), y0); g.closePath(); };
    path();
    const gr = g.createLinearGradient(0, y1, 0, y0);
    gr.addColorStop(0, hexA(col, n.holding ? 0.45 : 0.22));
    gr.addColorStop(1, hexA(col, n.holding ? 0.95 : 0.6));
    g.fillStyle = gr; g.fill();
    // núcleo brillante
    g.beginPath();
    g.moveTo(x1 - half(p1) * 0.25, y1); g.lineTo(x1 + half(p1) * 0.25, y1); g.lineTo(x0 + half(p0) * 0.25, y0); g.lineTo(x0 - half(p0) * 0.25, y0); g.closePath();
    g.fillStyle = `rgba(255,255,255,${n.holding ? 0.75 : 0.35})`; g.fill();
    // energía que fluye mientras se mantiene
    if (n.holding) {
      g.save(); path(); g.clip();
      for (let k = 0; k < 6; k++) {
        const q = ((T * 1.6 + k / 6) % 1);
        const pp = p1 + (p0 - p1) * q;
        const yy = this.yAt(pp);
        g.fillStyle = `rgba(255,255,255,${0.5 * q})`;
        g.fillRect(this.xAt(n.lane, pp) - half(pp), yy - 1.5, half(pp) * 2, 3);
      }
      g.restore();
    }
    path(); g.strokeStyle = hexA('#ffffff', n.holding ? 0.9 : 0.5); g.lineWidth = 1.5; g.stroke();
    this._drawNote(x1, y1, (this.wAt(p1) / L) * 0.24, col, false);
    if (n.holding) this._drawNote(x0, y0, (this.wAt(1) / L) * 0.36, col, true);
  }

  _drawHUD(now, tnow, pz = 0, beatIdx = 0) {
    const g = this.g, W = this.W, H = this.H;
    // puntuación con rodillo
    const target = this.score();
    this.scoreShown += (target - this.scoreShown) * 0.25;
    if (Math.abs(target - this.scoreShown) < 1) this.scoreShown = target;

    // panel de cristal
    const panW = Math.min(220, W * 0.55);
    g.fillStyle = 'rgba(10,4,30,0.45)'; roundRect(g, 8, 8, panW, 66, 14); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.14)'; g.lineWidth = 1; g.stroke();
    g.textAlign = 'left'; g.textBaseline = 'top';
    g.fillStyle = 'rgba(255,255,255,0.7)';
    g.font = '700 11px Poppins, system-ui, sans-serif';
    g.fillText('SCORE', 16, 14 + safeTop());
    g.fillStyle = '#fff';
    g.font = '800 24px Poppins, system-ui, sans-serif';
    g.fillText(Math.round(this.scoreShown).toLocaleString('es-ES'), 16, 28 + safeTop());

    // barra de progreso
    const dur = this.o.buffer.duration;
    const prog = Math.max(0, Math.min(1, now / dur));
    const bx = 18, by = 62 + safeTop(), bw = Math.min(220, W * 0.55) - 20;
    g.fillStyle = 'rgba(255,255,255,0.15)'; roundRect(g, bx, by, bw, 4, 2); g.fill();
    const pg = g.createLinearGradient(bx, 0, bx + bw, 0);
    pg.addColorStop(0, '#7bdcff'); pg.addColorStop(1, '#ff7ad9');
    g.fillStyle = pg; roundRect(g, bx, by, bw * prog, 4, 2); g.fill();

    // juicio
    const jf = this.judgeFx;
    const midY = this.topY + (this.hitY - this.topY) * 0.42;
    if (jf) {
      const age = (tnow - jf.t) / 1000;
      if (age < 0.6) {
        const sc = age < 0.08 ? 0.7 + age / 0.08 * 0.45 : 1.15 - Math.min(0.15, (age - 0.08) * 0.8);
        g.save();
        g.globalAlpha = age > 0.4 ? 1 - (age - 0.4) / 0.2 : 1;
        g.translate(W / 2, midY); g.scale(sc, sc);
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = '900 30px Poppins, system-ui, sans-serif';
        const name = JUDGE_NAMES[jf.j];
        if (jf.j === 0) {
          const hue = (tnow / 4) % 360;
          const tgx = g.createLinearGradient(-110, 0, 110, 0);
          tgx.addColorStop(0, `hsl(${hue},100%,80%)`);
          tgx.addColorStop(0.5, '#ffffff');
          tgx.addColorStop(1, `hsl(${(hue + 140) % 360},100%,80%)`);
          g.fillStyle = tgx;
          g.shadowColor = 'rgba(255,255,255,0.8)'; g.shadowBlur = 14;
        } else {
          g.fillStyle = ['#fff', '#ffd65a', '#7bf0b2', '#ff9f6b', '#9aa0b4'][jf.j];
          g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 8;
        }
        g.fillText(name, 0, 0);
        g.restore();
      }
    }
    if (this.combo >= 2) {
      g.save();
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = 'rgba(255,255,255,0.95)';
      const big = 44 * (1 + 0.08 * pz);
      g.font = `900 ${big.toFixed(1)}px Poppins, system-ui, sans-serif`;
      const cg = g.createLinearGradient(0, midY + 26, 0, midY + 66);
      cg.addColorStop(0, '#ffffff'); cg.addColorStop(1, this.combo >= 100 ? '#ffd65a' : this.combo >= 50 ? '#ffb3ec' : '#d8ccff');
      g.fillStyle = cg;
      g.shadowColor = 'rgba(255,122,217,0.7)'; g.shadowBlur = 16;
      g.fillText(String(this.combo), W / 2, midY + 46);
      g.shadowBlur = 0;
      g.font = '700 11px Poppins, system-ui, sans-serif';
      g.fillStyle = 'rgba(255,255,255,0.75)';
      g.fillText('COMBO', W / 2, midY + 76);
      g.restore();
    }

    // cuenta atrás de entrada
    if (now < 0) {
      g.save();
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = 'rgba(255,255,255,0.9)';
      g.font = '800 15px Poppins, system-ui, sans-serif';
      g.fillText('¡PREPÁRATE!', W / 2, H * 0.5);
      g.restore();
    }
    if (this.ended) {
      g.save();
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = '900 34px Poppins, system-ui, sans-serif';
      const label = this.counts[0] === this.total && this.total ? 'ALL S.PERFECT!' : (this.counts[3] + this.counts[4] === 0 && this.total ? 'FULL COMBO!' : 'CLEAR!');
      g.fillStyle = '#fff'; g.shadowColor = '#ff7ad9'; g.shadowBlur = 20;
      g.fillText(label, W / 2, H * 0.45);
      g.restore();
    }
  }
}

function safeTop() { return 0; }
function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (p, sh) => (p >> sh) & 255;
  const m = sh => Math.round(ch(pa, sh) * (1 - t) + ch(pb, sh) * t);
  return '#' + [16, 8, 0].map(sh => m(sh).toString(16).padStart(2, '0')).join('');
}
function drawStar(g, x, y, r, rot) {
  g.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = rot + i * Math.PI / 4, rr = i % 2 ? r * 0.28 : r;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath(); g.fill();
}
// Nota tipo gema, pre-renderizada (radio 48 en un lienzo de 160).
function mkNote(col, hold) {
  const c = document.createElement('canvas'); c.width = c.height = 160;
  const g = c.getContext('2d'); const x = 80, y = 80, r = 48;
  const halo = g.createRadialGradient(x, y, r * 0.5, x, y, r * 1.65);
  halo.addColorStop(0, hexA(col, 0.6)); halo.addColorStop(1, hexA(col, 0));
  g.fillStyle = halo; g.fillRect(0, 0, 160, 160);
  const body = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.05, x, y, r);
  body.addColorStop(0, '#ffffff'); body.addColorStop(0.3, mix(col, '#ffffff', 0.45));
  body.addColorStop(0.75, col); body.addColorStop(1, mix(col, '#1a0b3d', 0.45));
  g.fillStyle = body; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  g.lineWidth = r * 0.13; g.strokeStyle = 'rgba(255,255,255,0.95)';
  g.beginPath(); g.arc(x, y, r * 0.93, 0, Math.PI * 2); g.stroke();
  g.lineWidth = r * 0.05; g.strokeStyle = 'rgba(255,255,255,0.45)';
  g.beginPath(); g.arc(x, y, r * 0.62, 0, Math.PI * 2); g.stroke();
  g.save(); g.translate(x - r * 0.28, y - r * 0.45); g.rotate(-0.45);
  g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.ellipse(0, 0, r * 0.36, r * 0.15, 0, 0, Math.PI * 2); g.fill();
  g.restore();
  if (hold) { g.fillStyle = '#ffffff'; drawStar(g, x, y + 2, r * 0.42, 0); }
  return c;
}
// Botón con efecto 3D: aro metálico, cristal oscuro y borde de color.
function mkButton(col, r, pressed, dpr) {
  const S = Math.ceil(r * 2.9), c = document.createElement('canvas');
  c.width = c.height = Math.round(S * dpr);
  const g = c.getContext('2d'); g.scale(dpr, dpr);
  const x = S / 2, y = S / 2;
  const halo = g.createRadialGradient(x, y, r * 0.8, x, y, r * 1.45);
  halo.addColorStop(0, hexA(col, pressed ? 0.75 : 0.28)); halo.addColorStop(1, hexA(col, 0));
  g.fillStyle = halo; g.fillRect(0, 0, S, S);
  // aro metálico
  const ring = g.createLinearGradient(x, y - r, x, y + r);
  ring.addColorStop(0, '#ffffff'); ring.addColorStop(0.45, mix(col, '#ffffff', 0.35)); ring.addColorStop(1, mix(col, '#1a0b3d', 0.5));
  g.fillStyle = ring; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  // cristal interior
  const glass = g.createRadialGradient(x, y - r * 0.25, r * 0.1, x, y, r * 0.84);
  if (pressed) { glass.addColorStop(0, '#ffffff'); glass.addColorStop(0.4, mix(col, '#ffffff', 0.3)); glass.addColorStop(1, col); }
  else { glass.addColorStop(0, 'rgba(70,40,120,0.95)'); glass.addColorStop(1, 'rgba(14,6,36,0.98)'); }
  g.fillStyle = glass; g.beginPath(); g.arc(x, y, r * 0.84, 0, Math.PI * 2); g.fill();
  // borde de color y anillo interno
  g.lineWidth = r * 0.07; g.strokeStyle = pressed ? '#ffffff' : col;
  g.beginPath(); g.arc(x, y, r * 0.84, 0, Math.PI * 2); g.stroke();
  g.lineWidth = r * 0.04; g.strokeStyle = hexA(pressed ? '#ffffff' : col, 0.5);
  g.beginPath(); g.arc(x, y, r * 0.5, 0, Math.PI * 2); g.stroke();
  // brillo superior
  const sh = g.createLinearGradient(x, y - r * 0.84, x, y);
  sh.addColorStop(0, 'rgba(255,255,255,0.35)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = sh; g.beginPath(); g.ellipse(x, y - r * 0.42, r * 0.62, r * 0.36, 0, 0, Math.PI * 2); g.fill();
  return c;
}
