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
    const n = j === 0 ? 14 : 8;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 120 + Math.random() * 260;
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 120, life: 0.45 + Math.random() * 0.3, age: 0, col: Math.random() < 0.4 ? '#fff' : this.colors[lane], r: 1.5 + Math.random() * 2.5 });
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
  _draw(now, dt) {
    const g = this.g, W = this.W, H = this.H, L = this.L;
    g.clearRect(0, 0, W, H);

    // pista
    g.save();
    g.beginPath();
    g.moveTo(this.edgeX(0, 0), this.yAt(0));
    g.lineTo(this.edgeX(L, 0), this.yAt(0));
    g.lineTo(this.edgeX(L, 1.12), this.yAt(1.12));
    g.lineTo(this.edgeX(0, 1.12), this.yAt(1.12));
    g.closePath();
    const tg = g.createLinearGradient(0, this.topY, 0, this.hitY);
    tg.addColorStop(0, 'rgba(10,6,30,0.0)');
    tg.addColorStop(0.35, 'rgba(10,6,30,0.55)');
    tg.addColorStop(1, 'rgba(10,6,30,0.78)');
    g.fillStyle = tg; g.fill();
    g.restore();

    // haces de carril pulsado
    for (let l = 0; l < L; l++) {
      const age = now - this.laneFlash[l];
      const on = this.laneDown[l] > 0;
      const a = on ? 0.55 : Math.max(0, 0.45 - age * 2.2);
      if (a <= 0) continue;
      g.beginPath();
      g.moveTo(this.edgeX(l, 0.25), this.yAt(0.25));
      g.lineTo(this.edgeX(l + 1, 0.25), this.yAt(0.25));
      g.lineTo(this.edgeX(l + 1, 1), this.yAt(1));
      g.lineTo(this.edgeX(l, 1), this.yAt(1));
      g.closePath();
      const bg = g.createLinearGradient(0, this.yAt(0.25), 0, this.hitY);
      bg.addColorStop(0, 'rgba(255,255,255,0)');
      bg.addColorStop(1, hexA(this.colors[l], a));
      g.fillStyle = bg; g.fill();
    }

    // separadores
    g.lineWidth = 1;
    for (let k = 0; k <= L; k++) {
      g.strokeStyle = k === 0 || k === L ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)';
      g.beginPath(); g.moveTo(this.edgeX(k, 0), this.yAt(0)); g.lineTo(this.edgeX(k, 1.12), this.yAt(1.12)); g.stroke();
    }

    // línea de golpeo
    const hl = g.createLinearGradient(this.edgeX(0, 1), 0, this.edgeX(L, 1), 0);
    hl.addColorStop(0, 'rgba(255,255,255,0)'); hl.addColorStop(0.5, 'rgba(255,255,255,0.9)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    g.strokeStyle = hl; g.lineWidth = 2;
    g.beginPath(); g.moveTo(this.edgeX(0, 1), this.hitY); g.lineTo(this.edgeX(L, 1), this.hitY); g.stroke();

    // botones
    const rBtn = (this.bw / L) * 0.36;
    for (let l = 0; l < L; l++) {
      const x = this.xAt(l, 1), y = this.hitY;
      const on = this.laneDown[l] > 0;
      g.beginPath(); g.arc(x, y, rBtn, 0, Math.PI * 2);
      g.fillStyle = on ? hexA(this.colors[l], 0.45) : 'rgba(255,255,255,0.07)'; g.fill();
      g.lineWidth = on ? 3.5 : 2.5;
      g.strokeStyle = on ? '#fff' : hexA(this.colors[l], 0.85); g.stroke();
      g.beginPath(); g.arc(x, y, rBtn * 0.55, 0, Math.PI * 2);
      g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1.5; g.stroke();
    }

    // notas (de atrás hacia delante)
    const vis = [];
    for (let k = this.nextIdx; k < this.notes.length; k++) {
      const n = this.notes[k];
      const p = this.pOf(n.t, now);
      if (p < -0.02) break;
      if (n.done && !n.holding) continue;
      vis.push(n);
    }
    for (let k = vis.length - 1; k >= 0; k--) {
      const n = vis[k];
      if (n.end) this._drawHold(n, now);
    }
    for (let k = vis.length - 1; k >= 0; k--) {
      const n = vis[k];
      if (n.holding) continue;
      const p = this.pOf(n.t, now);
      if (p > 1.15) continue;
      this._drawNote(this.xAt(n.lane, p), this.yAt(p), (this.wAt(p) / L) * 0.34, this.colors[n.lane], n.end);
    }

    // anillos y partículas
    const tnow = performance.now();
    this.rings = this.rings.filter(r => tnow - r.t < 380);
    for (const r of this.rings) {
      const k = (tnow - r.t) / 380;
      g.beginPath(); g.arc(r.x, r.y, rBtn * (1 + k * (r.big ? 1.1 : 0.8)), 0, Math.PI * 2);
      g.strokeStyle = hexA(r.col, 1 - k); g.lineWidth = (r.big ? 5 : 3) * (1 - k) + 0.5; g.stroke();
    }
    for (const p of this.particles) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; }
    this.particles = this.particles.filter(p => p.age < p.life);
    for (const p of this.particles) {
      g.globalAlpha = 1 - p.age / p.life;
      g.fillStyle = p.col; g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;

    this._drawHUD(now, tnow);
  }

  _drawNote(x, y, r, col, isHoldHead) {
    const g = this.g;
    g.save();
    g.shadowColor = col; g.shadowBlur = r * 0.9;
    const rg = g.createRadialGradient(x - r * 0.25, y - r * 0.3, r * 0.1, x, y, r);
    rg.addColorStop(0, '#ffffff');
    rg.addColorStop(0.45, col);
    rg.addColorStop(1, hexA(col, 0.65));
    g.fillStyle = rg;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.shadowBlur = 0;
    g.lineWidth = Math.max(1.5, r * 0.14);
    g.strokeStyle = 'rgba(255,255,255,0.95)';
    g.stroke();
    if (isHoldHead) {
      g.beginPath(); g.arc(x, y, r * 0.42, 0, Math.PI * 2);
      g.fillStyle = 'rgba(255,255,255,0.9)'; g.fill();
    }
    g.restore();
  }

  _drawHold(n, now) {
    const g = this.g, L = this.L;
    let p0 = this.pOf(n.t, now), p1 = this.pOf(n.end, now);
    if (n.holding) p0 = 1;
    if (p0 < 0 || p1 > 1.12) return;
    p0 = Math.min(p0, 1.12); p1 = Math.max(p1, 0);
    const half = k => (this.wAt(k) / L) * 0.26;
    const x0 = this.xAt(n.lane, p0), y0 = this.yAt(p0), x1 = this.xAt(n.lane, p1), y1 = this.yAt(p1);
    g.beginPath();
    g.moveTo(x1 - half(p1), y1); g.lineTo(x1 + half(p1), y1);
    g.lineTo(x0 + half(p0), y0); g.lineTo(x0 - half(p0), y0); g.closePath();
    const col = this.colors[n.lane];
    const gr = g.createLinearGradient(0, y1, 0, y0);
    gr.addColorStop(0, hexA(col, n.holding ? 0.5 : 0.25));
    gr.addColorStop(1, hexA(col, n.holding ? 0.95 : 0.6));
    g.fillStyle = gr; g.fill();
    g.strokeStyle = hexA('#ffffff', n.holding ? 0.9 : 0.5); g.lineWidth = 1.5; g.stroke();
    // cola
    this._drawNote(x1, y1, (this.wAt(p1) / L) * 0.22, col, false);
    if (n.holding) this._drawNote(x0, y0, (this.wAt(1) / L) * 0.34, col, true);
  }

  _drawHUD(now, tnow) {
    const g = this.g, W = this.W, H = this.H;
    // puntuación con rodillo
    const target = this.score();
    this.scoreShown += (target - this.scoreShown) * 0.25;
    if (Math.abs(target - this.scoreShown) < 1) this.scoreShown = target;

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
    const bx = 16, by = 62 + safeTop(), bw = W - 32 - 54;
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
      g.font = '900 44px Poppins, system-ui, sans-serif';
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
