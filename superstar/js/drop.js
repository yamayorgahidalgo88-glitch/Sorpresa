// Apertura de sobres: el sobre tiembla y estalla, y cada carta sale boca abajo.
// Hay que tocar la carta 3 veces: si sube de rango, la luz cambia de color y hay que volver a
// tocarla 3 veces; cuando ya no sube, se da la vuelta (como los Star Drops).

export const RARITY = {
  C: { name: 'COMÚN', color: '#b7c0cc', lvl: 0 },
  B: { name: 'RARA', color: '#7fd1ff', lvl: 1 },
  A: { name: 'ÉPICA', color: '#ffd166', lvl: 2 },
  S: { name: 'SÚPER RARA', color: '#ff7eb6', lvl: 3 },
  R: { name: 'LEGENDARIA', color: '#c18cff', lvl: 4 },
};
const TAPS = 3;
const ORDER = ['C', 'B', 'A', 'S', 'R'];

const IMG = 'img/drop/';
const TEAR = 0.125;   // altura de la línea de corte del sobre (fracción del alto)
let preloaded = false;
function preload() {
  if (preloaded) return; preloaded = true;
  for (const f of ['pack.webp', 'card-back.webp', 'space.jpg', ...ORDER.map(g => `glow-${g}.webp`)]) { const im = new Image(); im.src = IMG + f; }
}

export function openDrop(results, { cardHTML, ctx }) {
  preload();
  return new Promise(resolve => {
    const el = document.createElement('div');
    el.className = 'drop';
    el.innerHTML = `
      <div class="drop-bg"></div>
      <div class="drop-tint"></div>
      <canvas class="drop-fx"></canvas>
      <div class="drop-rays"></div>
      <div class="drop-stage"></div>
      <div class="drop-label"></div>
      <div class="drop-hint">Pasa el dedo por la línea para abrirlo</div>
      <div class="drop-count"></div>
      <div class="drop-flash"></div>`;
    document.getElementById('app').appendChild(el);
    const stage = el.querySelector('.drop-stage');
    const label = el.querySelector('.drop-label');
    const hint = el.querySelector('.drop-hint');
    const count = el.querySelector('.drop-count');
    const flash = el.querySelector('.drop-flash');
    const fx = makeFx(el.querySelector('.drop-fx'));
    const sfx = makeSfx(ctx);

    let phase = 'pack', i = 0, lvl = 0, taps = 0, busy = false;
    const setAura = c => el.style.setProperty('--aura', c);
    setAura('#c9a6ff');

    // ---------- el sobre: se abre pasando el dedo por la línea de puntos ----------
    stage.innerHTML = `
      <div class="pk">
        <div class="pk-light"></div>
        <div class="pk-body"><img src="${IMG}pack.webp" alt=""></div>
        <div class="pk-top"><img src="${IMG}pack.webp" alt=""></div>
        <div class="pk-line" style="top:${TEAR * 100}%"><b class="pk-cut"></b></div>
        <div class="pk-scissors" style="top:${TEAR * 100}%"><svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.6 7.6 20 17M8.6 16.4 20 7M14.5 12h.01"/></svg></div>
        <div class="pk-zone" style="top:${(TEAR - 0.11) * 100}%;height:22%"></div>
      </div>`;
    const pk = stage.querySelector('.pk'), zone = stage.querySelector('.pk-zone'), cut = stage.querySelector('.pk-cut');
    let lo = null, hi = null, cutting = false, lastSnd = 0;
    const at = e => Math.max(0, Math.min(1, e.offsetX / zone.clientWidth));
    const drawCut = () => { cut.style.left = (lo * 100) + '%'; cut.style.width = ((hi - lo) * 100) + '%'; pk.style.setProperty('--open', (hi - lo).toFixed(3)); };
    zone.addEventListener('pointerdown', e => {
      if (phase !== 'pack' || busy) return;
      e.preventDefault(); e.stopPropagation();
      cutting = true; try { zone.setPointerCapture(e.pointerId); } catch {}
      const x = at(e); lo = lo === null ? x : Math.min(lo, x); hi = hi === null ? x : Math.max(hi, x);
      pk.classList.add('cutting'); drawCut();
    });
    zone.addEventListener('pointermove', e => {
      if (!cutting || busy) return;
      const x = at(e); lo = Math.min(lo, x); hi = Math.max(hi, x); drawCut();
      const now = performance.now();
      if (now - lastSnd > 45) { sfx.rip(); lastSnd = now; }
      const r = pk.getBoundingClientRect();
      if (Math.random() < 0.5) fx.spark(e.clientX, e.clientY);
      if (hi - lo >= 0.8) openPack();
    });
    const stopCut = () => { cutting = false; };
    zone.addEventListener('pointerup', stopCut); zone.addEventListener('pointercancel', stopCut);

    const openPack = () => {
      if (busy) return;
      busy = true; cutting = false; hint.textContent = '';
      lo = 0; hi = 1; drawCut();
      pk.classList.add('opened');      // la tira de arriba sale volando y sale luz de dentro
      sfx.boom(); doFlash('#ffffff');
      setTimeout(() => { pk.classList.add('glowing'); sfx.rumble(); }, 250);
      setTimeout(() => {
        doFlash('#ffffff', true);       // fogonazo que ocupa toda la pantalla
        fx.burst(AW() / 2, AH() / 2, '#ffffff', 120, 1.8);
        fx.rain('#e6c8ff', 60);
      }, 1050);
      setTimeout(() => { phase = 'card'; busy = false; el.classList.add('cards'); showCard(); }, 1400);
    };

    // ---------- cada carta: boca abajo con el brillo de su rango ----------
    const showCard = () => {
      const r = results[i];
      lvl = 0; taps = 0;
      setAura(RARITY.C.color);
      label.textContent = RARITY.C.name;
      count.textContent = results.length > 1 ? `${i + 1} / ${results.length}` : '';
      hint.innerHTML = pips();
      stage.innerHTML = `
        <div class="dc enter lv0">
          <div class="dc-glow"><img src="${IMG}glow-C.webp" alt=""><img class="echo" src="${IMG}glow-C.webp" alt=""></div>
          <div class="dc-swirl"><i></i><i></i><i></i></div>
          <div class="dc-in">
            <div class="dc-back"><img src="${IMG}card-back.webp" alt=""><div class="dc-sheen"></div></div>
            <div class="dc-front">${cardHTML(r.card, { size: 'lg' })}
              <div class="dc-tag ${r.dup ? '' : 'new'}">${r.dup ? (r.maxed ? '+800 ♪' : 'NIVEL +1') : 'NUEVA'}</div></div>
          </div>
        </div>`;
      sfx.whoosh();
      setTimeout(() => emitAt(0), 60);
    };
    const setGlow = g => {
      const dc = stage.querySelector('.dc'); if (!dc) return;
      dc.querySelectorAll('.dc-glow img').forEach(im => { im.src = `${IMG}glow-${g}.webp`; });
      const gl = dc.querySelector('.dc-glow'); gl.classList.remove('up'); void gl.offsetWidth; gl.classList.add('up');
      dc.className = dc.className.replace(/\blv\d\b/, 'lv' + RARITY[g].lvl);
    };
    // chispas que salen sin parar del borde de la carta (más cuanto más alto el rango)
    const emitAt = l => {
      const c = stage.querySelector('.dc'); if (!c) return;
      const rc = c.getBoundingClientRect();
      let x = rc.left, y = rc.top, w = rc.width, h = rc.height;
      if (document.body.classList.contains('rot')) { x = innerHeight - rc.bottom; y = rc.left; w = rc.height; h = rc.width; }
      fx.emitter({ x, y, w, h, col: RARITY[ORDER[l]].color, rate: 10 + l * 16 });
    };

    const bump = (big = false) => {
      const c = stage.querySelector('.dc');
      if (!c) return;
      c.classList.remove('bump', 'bigbump'); void c.offsetWidth; c.classList.add(big ? 'bigbump' : 'bump');
    };
    const doFlash = (color, strong = false) => {
      flash.style.background = color;
      flash.classList.remove('on', 'strong'); void flash.offsetWidth; flash.classList.add('on'); if (strong) flash.classList.add('strong');
    };

    // tres puntos: cuántos toques quedan antes de ver si sube de rango
    const pips = () => `<span class="taps">${[0, 1, 2].map(k => `<i class="${k < taps ? 'on' : ''}"></i>`).join('')}</span>`;

    const onTap = () => {
      if (busy) return;
      if (phase === 'pack') return;   // el sobre se abre deslizando, no tocando
      if (phase === 'card') {
        const r = results[i];
        const target = RARITY[r.card.grade].lvl;
        const c = stage.querySelector('.dc');
        const rect = c.getBoundingClientRect();
        let cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
        if (document.body.classList.contains('rot')) [cx, cy] = [innerHeight - cy, cx];
        if (taps < TAPS - 1) {
          // toque: la carta tiembla y se enciende un punto
          taps++;
          hint.innerHTML = pips();
          bump(false);
          fx.burst(cx, cy, RARITY[ORDER[lvl]].color, 10 + lvl * 4, 0.7);
          sfx.tick(taps);
          return;
        }
        taps = 0;
        if (lvl < target) {
          // al tercer toque sube de rango: otro brillo y vuelta a empezar los 3 toques
          lvl++;
          hint.innerHTML = pips();
          const g = RARITY[ORDER[lvl]];
          setAura(g.color);
          setGlow(ORDER[lvl]);
          emitAt(lvl);
          label.textContent = g.name;
          label.classList.remove('pop'); void label.offsetWidth; label.classList.add('pop');
          bump(lvl >= 3);
          doFlash(g.color, lvl >= 3);
          fx.burst(cx, cy, g.color, 30 + lvl * 18, 1 + lvl * 0.25);
          sfx.up(lvl);
          return;
        }
        // se da la vuelta
        busy = true;
        const g = RARITY[r.card.grade];
        label.textContent = g.name;
        c.classList.add('flip');
        setTimeout(() => {
          fx.burst(cx, cy, g.color, 50 + target * 25, 1.2 + target * 0.3);
          if (target >= 2) fx.rain(g.color, 40 + target * 30);
          doFlash(g.color, target >= 3);
          sfx.reveal(target);
        }, 260);
        setTimeout(() => { busy = false; phase = 'shown'; hint.textContent = i + 1 < results.length ? 'Toca para la siguiente' : 'Toca para terminar'; }, 700);
        return;
      }
      if (phase === 'shown') {
        i++;
        if (i < results.length) { phase = 'card'; showCard(); return; }
        // resumen
        phase = 'summary'; fx.emitter(null);
        setAura('#c9a6ff'); label.textContent = ''; count.textContent = ''; hint.textContent = '';
        stage.innerHTML = `<div class="drop-sum">
          <h2>¡Conseguido!</h2>
          <div class="drop-grid">${results.map((r, k) => `<div class="drop-mini" style="--d:${k * 0.07}s">${cardHTML(r.card, { size: 'sm' })}<div class="dc-tag small ${r.dup ? '' : 'new'}">${r.dup ? (r.maxed ? '+800 ♪' : 'Lv +1') : 'NUEVA'}</div></div>`).join('')}</div>
          <button class="btn primary" data-done>Genial</button></div>`;
        stage.querySelector('[data-done]').onclick = e => { e.stopPropagation(); close(); };
        return;
      }
    };
    const close = () => { fx.stop(); el.classList.add('out'); setTimeout(() => { el.remove(); resolve(); }, 250); };
    el.addEventListener('pointerdown', e => { if (e.target.closest('[data-done]') || e.target.closest('.pk-zone')) return; e.preventDefault(); onTap(); });
  });
}

// tamaño de la app (con el móvil en vertical la app va girada)
const AW = () => document.getElementById('app').clientWidth, AH = () => document.getElementById('app').clientHeight;
// ---------- partículas ----------
function makeFx(cv) {
  const g = cv.getContext('2d');
  let parts = [], raf = 0, last = 0, alive = true, em = null, tw = 0;
  const resize = () => { const d = Math.min(2, devicePixelRatio || 1); cv.width = AW() * d; cv.height = AH() * d; g.setTransform(d, 0, 0, d, 0, 0); };
  resize(); addEventListener('resize', resize);
  const loop = ts => {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts;
    g.clearRect(0, 0, AW(), AH());
    g.globalCompositeOperation = 'lighter';
    // estrellas del fondo que titilan
    tw += dt * 6;
    while (tw > 1) { tw--; parts.push({ x: Math.random() * AW(), y: Math.random() * AH(), vx: 0, vy: 0, gr: 0, age: 0, life: 1.6 + Math.random() * 1.6, r: 0.8 + Math.random() * 1.6, rot: 0, star: Math.random() < 0.4, col: '#ffffff', fade: true }); }
    // chispas que salen del borde de la carta
    if (em) {
      em.acc = (em.acc || 0) + em.rate * dt;
      while (em.acc > 1) {
        em.acc--;
        const side = Math.random() * 4 | 0, u = Math.random();
        const x = side === 0 ? em.x + u * em.w : side === 1 ? em.x + em.w : side === 2 ? em.x + u * em.w : em.x;
        const y = side === 0 ? em.y : side === 1 ? em.y + u * em.h : side === 2 ? em.y + em.h : em.y + u * em.h;
        const ang = Math.atan2(y - (em.y + em.h / 2), x - (em.x + em.w / 2)), sp = 20 + Math.random() * 60;
        parts.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 30, gr: -20, age: 0, life: 0.8 + Math.random() * 0.9, r: 1 + Math.random() * 2.2, rot: Math.random() * 6, star: Math.random() < 0.6, col: Math.random() < 0.3 ? '#ffffff' : em.col });
      }
    }
    for (const p of parts) {
      p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.gr * dt; p.vx *= 0.985; p.rot += dt * 5;
      const a = p.fade ? Math.sin(Math.PI * Math.min(1, p.age / p.life)) * 0.8 : Math.max(0, 1 - p.age / p.life);
      g.globalAlpha = a; g.fillStyle = p.col;
      if (p.star) star(g, p.x, p.y, p.r * 2.4, p.rot); else { g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill(); }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    parts = parts.filter(p => p.age < p.life);
  };
  raf = requestAnimationFrame(loop);
  return {
    burst(x, y, col, n, power = 1) {
      for (let k = 0; k < n; k++) {
        const a = Math.random() * Math.PI * 2, s = (180 + Math.random() * 520) * power;
        parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, gr: 260, age: 0, life: 0.6 + Math.random() * 0.8, r: 1.5 + Math.random() * 3, rot: Math.random() * 6, star: Math.random() < 0.5, col: Math.random() < 0.35 ? '#ffffff' : col });
      }
    },
    spark(sx, sy) {
      let [x, y] = document.body.classList.contains('rot') ? [innerHeight - sy, sx] : [sx, sy];
      for (let k = 0; k < 3; k++) { const a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 200; parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, gr: 300, age: 0, life: 0.35 + Math.random() * 0.3, r: 1 + Math.random() * 1.5, rot: 0, star: false, col: Math.random() < 0.5 ? '#ffffff' : '#ffd6f5' }); }
    },
    emitter(e) { em = e; },
    rain(col, n) {
      for (let k = 0; k < n; k++) {
        parts.push({ x: Math.random() * AW(), y: -20 - Math.random() * 200, vx: (Math.random() - 0.5) * 40, vy: 120 + Math.random() * 240, gr: 60, age: 0, life: 2.2 + Math.random(), r: 1.5 + Math.random() * 2.5, rot: Math.random() * 6, star: true, col: Math.random() < 0.3 ? '#ffffff' : col });
      }
    },
    stop() { alive = false; cancelAnimationFrame(raf); removeEventListener('resize', resize); },
  };
}
function star(g, x, y, r, rot) {
  g.beginPath();
  for (let i = 0; i < 8; i++) { const a = rot + i * Math.PI / 4, rr = i % 2 ? r * 0.3 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath(); g.fill();
}

// ---------- sonidos sintetizados ----------
function makeSfx(ctx) {
  const ok = ctx && ctx.state !== 'closed';
  const tone = (f, t0, d, type = 'sine', v = 0.18, f2) => {
    if (!ok) return;
    const o = ctx.createOscillator(), gn = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, ctx.currentTime + t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, ctx.currentTime + t0 + d);
    gn.gain.setValueAtTime(0.0001, ctx.currentTime + t0);
    gn.gain.exponentialRampToValueAtTime(v, ctx.currentTime + t0 + 0.02);
    gn.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t0 + d);
    o.connect(gn); gn.connect(ctx.destination); o.start(ctx.currentTime + t0); o.stop(ctx.currentTime + t0 + d + 0.05);
  };
  const noise = (t0, d, v = 0.25, hp = 800) => {
    if (!ok) return;
    const n = Math.floor(ctx.sampleRate * d), b = ctx.createBuffer(1, n, ctx.sampleRate), x = b.getChannelData(0);
    for (let i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), gn = ctx.createGain();
    f.type = 'highpass'; f.frequency.value = hp; gn.gain.value = v;
    s.buffer = b; s.connect(f); f.connect(gn); gn.connect(ctx.destination); s.start(ctx.currentTime + t0);
  };
  const SCALE = [523, 659, 784, 988, 1319];
  return {
    whoosh() { noise(0, 0.35, 0.12, 1500); },
    rumble() { tone(70, 0, 0.9, 'sawtooth', 0.08, 140); noise(0.1, 0.8, 0.08, 300); },
    boom() { tone(120, 0, 0.6, 'sine', 0.3, 40); noise(0, 0.5, 0.3, 200); tone(1046, 0.05, 0.6, 'triangle', 0.1); },
    rip() { noise(0, 0.06, 0.06, 2500 + Math.random() * 2500); },
    tick(k) { tone(520 + k * 90, 0, 0.12, 'square', 0.05); noise(0, 0.05, 0.05, 3000); },
    up(l) { const f = SCALE[Math.min(4, l)]; tone(f, 0, 0.4, 'triangle', 0.16); tone(f * 1.5, 0.06, 0.45, 'sine', 0.1); noise(0, 0.15, 0.08, 4000); },
    reveal(l) { [0, 2, 4].forEach((k, j) => tone(SCALE[Math.min(4, k)] * (1 + l * 0.12), j * 0.07, 0.6, 'triangle', 0.14)); if (l >= 3) tone(1568, 0.25, 0.9, 'sine', 0.12); },
  };
}
