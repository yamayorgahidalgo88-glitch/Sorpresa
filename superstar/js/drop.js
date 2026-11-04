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

export function openDrop(results, { cardHTML, ctx }) {
  return new Promise(resolve => {
    const el = document.createElement('div');
    el.className = 'drop';
    el.innerHTML = `
      <canvas class="drop-fx"></canvas>
      <div class="drop-rays"></div>
      <div class="drop-stage"></div>
      <div class="drop-label"></div>
      <div class="drop-hint">Toca el sobre</div>
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

    stage.innerHTML = `
      <div class="pk">
        <div class="pk-half pk-top"></div><div class="pk-half pk-bot"></div>
        <div class="pk-face">
          <div class="pk-shine"></div>
          <div class="pk-star">★</div>
          <div class="pk-logo">SUPERSTAR</div>
          <div class="pk-sub">CARD DROP</div>
        </div>
      </div>`;

    const showCard = () => {
      const r = results[i];
      lvl = 0; taps = 0;
      setAura(RARITY.C.color);
      label.textContent = RARITY.C.name;
      count.textContent = results.length > 1 ? `${i + 1} / ${results.length}` : '';
      hint.innerHTML = pips();
      stage.innerHTML = `
        <div class="dc enter">
          <div class="dc-in">
            <div class="dc-back"><div class="dc-back-star">★</div><div class="dc-back-logo">SUPERSTAR</div></div>
            <div class="dc-front">${cardHTML(r.card, { size: 'lg' })}
              <div class="dc-tag ${r.dup ? '' : 'new'}">${r.dup ? (r.maxed ? '+800 ♪' : 'NIVEL +1') : 'NUEVA'}</div></div>
          </div>
        </div>`;
      sfx.whoosh();
    };

    const bump = (big = false) => {
      const c = stage.querySelector('.dc') || stage.querySelector('.pk');
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
      if (phase === 'pack') {
        busy = true; hint.textContent = '';
        const pk = stage.querySelector('.pk');
        pk.classList.add('shake');
        sfx.rumble();
        setTimeout(() => {
          pk.classList.add('burst');
          doFlash('#ffffff', true);
          fx.burst(AW() / 2, AH() / 2, '#ffffff', 90, 1.6);
          sfx.boom();
        }, 900);
        setTimeout(() => { phase = 'card'; busy = false; showCard(); }, 1500);
        return;
      }
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
          // al tercer toque sube de rango: otra luz y vuelta a empezar los 3 toques
          lvl++;
          hint.innerHTML = pips();
          const g = RARITY[ORDER[lvl]];
          setAura(g.color);
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
        phase = 'summary';
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
    el.addEventListener('pointerdown', e => { if (e.target.closest('[data-done]')) return; e.preventDefault(); onTap(); });
  });
}

// tamaño de la app (con el móvil en vertical la app va girada)
const AW = () => document.getElementById('app').clientWidth, AH = () => document.getElementById('app').clientHeight;
// ---------- partículas ----------
function makeFx(cv) {
  const g = cv.getContext('2d');
  let parts = [], raf = 0, last = 0, alive = true;
  const resize = () => { const d = Math.min(2, devicePixelRatio || 1); cv.width = AW() * d; cv.height = AH() * d; g.setTransform(d, 0, 0, d, 0, 0); };
  resize(); addEventListener('resize', resize);
  const loop = ts => {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts;
    g.clearRect(0, 0, AW(), AH());
    g.globalCompositeOperation = 'lighter';
    for (const p of parts) {
      p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.gr * dt; p.vx *= 0.985; p.rot += dt * 5;
      const a = Math.max(0, 1 - p.age / p.life);
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
    tick(k) { tone(520 + k * 90, 0, 0.12, 'square', 0.05); noise(0, 0.05, 0.05, 3000); },
    up(l) { const f = SCALE[Math.min(4, l)]; tone(f, 0, 0.4, 'triangle', 0.16); tone(f * 1.5, 0.06, 0.45, 'sine', 0.1); noise(0, 0.15, 0.08, 4000); },
    reveal(l) { [0, 2, 4].forEach((k, j) => tone(SCALE[Math.min(4, k)] * (1 + l * 0.12), j * 0.07, 0.6, 'triangle', 0.14)); if (l >= 3) tone(1568, 0.25, 0.9, 'sine', 0.12); },
  };
}
