(function () {
  'use strict';

  // ---------- Constants ----------
  const W = 960, H = 540;
  const GROUND = 470;
  const NET_X = 480, NET_HALF = 5, NET_TOP = 330;
  const PR = 42;                  // player radius
  const BR = 17;                  // ball radius
  const P_SPEED = 400, P_JUMP = 780, P_GRAV = 2200;
  const B_GRAV = 1000, B_MAX = 980, B_MIN_HIT = 560;
  const WIN_POINTS = 7;
  const STEP = 1 / 120;
  const SAVE_KEY = 'spikeduel.save.v1';

  // ---------- Text ----------
  const LANG = (navigator.language || 'en').toLowerCase().startsWith('es') ? 'es' : 'en';
  const TEXT = {
    en: {
      tagline: 'Jump. Spike. Win the beach.', tour: 'Tour', twoPlayers: '2 Players', shop: 'Shop', back: 'Back',
      characters: 'Characters', balls: 'Balls', paused: 'Paused', resume: 'Resume', menu: 'Menu',
      noThanks: 'No, thanks', youWin: 'You win!', youLose: 'You lose', p1Wins: 'Player 1 wins!', p2Wins: 'Player 2 wins!',
      next: 'Next rival', retry: 'Retry', rematch: 'Rematch', double: 'Double coins', coinsEarned: '+{n} coins',
      champion: 'Tour champion!', locked: 'Beat the previous rival', select: 'Select', selected: 'Selected',
      adUnavailable: 'Ad not available, try again later', serve: 'Serve!', point: 'Point!', superReady: 'SUPER',
      controls: '1P: A/D or arrows to move, W / up / space to jump  ·  2P: A/D/W vs arrows',
      rival: 'Rival {n}', beach: 'beach', gym: 'gym', rooftop: 'rooftop', snow: 'snow',
    },
    es: {
      tagline: 'Salta. Remata. Conquista la playa.', tour: 'Torneo', twoPlayers: '2 Jugadores', shop: 'Tienda', back: 'Volver',
      characters: 'Personajes', balls: 'Balones', paused: 'Pausa', resume: 'Seguir', menu: 'Menú',
      noThanks: 'No, gracias', youWin: '¡Has ganado!', youLose: 'Has perdido', p1Wins: '¡Gana el jugador 1!', p2Wins: '¡Gana el jugador 2!',
      next: 'Siguiente rival', retry: 'Reintentar', rematch: 'Revancha', double: 'Duplicar monedas', coinsEarned: '+{n} monedas',
      champion: '¡Campeón del torneo!', locked: 'Gana al rival anterior', select: 'Elegir', selected: 'Elegido',
      adUnavailable: 'Anuncio no disponible, prueba más tarde', serve: '¡Saca!', point: '¡Punto!', superReady: 'SÚPER',
      controls: '1J: A/D o flechas para moverte, W / arriba / espacio para saltar  ·  2J: A/D/W contra flechas',
      rival: 'Rival {n}', beach: 'playa', gym: 'pabellón', rooftop: 'azotea', snow: 'nieve',
    },
  };
  const t = (k, vars) => {
    let s = TEXT[LANG][k] || TEXT.en[k] || k;
    if (vars) for (const v in vars) s = s.replace('{' + v + '}', vars[v]);
    return s;
  };

  // ---------- Content ----------
  const CHARS = [
    { name: 'Rookie', body: '#ff6b35', band: '#ffffff', price: 0 },
    { name: 'Wave', body: '#2a9df4', band: '#ffd23f', price: 60 },
    { name: 'Lime', body: '#6bd425', band: '#1b4332', price: 100 },
    { name: 'Coral', body: '#ff5d8f', band: '#fff1a8', price: 150 },
    { name: 'Tank', body: '#8d6e63', band: '#ff3b30', price: 220 },
    { name: 'Volt', body: '#ffd60a', band: '#3a0ca3', price: 300 },
    { name: 'Frost', body: '#a2d2ff', band: '#0077b6', price: 400 },
    { name: 'Ace', body: '#7b2cbf', band: '#ffb627', price: 550 },
  ];
  const BALLS = [
    { name: 'Classic', a: '#ffffff', b: '#ffd23f', c: '#2a9df4', price: 0 },
    { name: 'Beach', a: '#ffffff', b: '#ff3b30', c: '#2ec27e', price: 50 },
    { name: 'Lava', a: '#ffb627', b: '#ff3b30', c: '#7a1f00', price: 120 },
    { name: 'Galaxy', a: '#3a0ca3', b: '#7209b7', c: '#4cc9f0', price: 200 },
    { name: 'Melon', a: '#2ec27e', b: '#1b7d50', c: '#ff5d8f', price: 280 },
    { name: 'Gold', a: '#ffd60a', b: '#e09b00', c: '#fff1a8', price: 450 },
  ];
  const VENUES = ['beach', 'gym', 'rooftop', 'snow'];
  const RIVALS = [
    { char: 1, venue: 0, nick: 'Wave' },
    { char: 2, venue: 1, nick: 'Lime' },
    { char: 3, venue: 0, nick: 'Coral' },
    { char: 4, venue: 2, nick: 'Tank' },
    { char: 6, venue: 3, nick: 'Frost' },
    { char: 5, venue: 1, nick: 'Volt' },
    { char: 0, venue: 2, nick: 'Shadow', dark: true },
    { char: 7, venue: 3, nick: 'Ace' },
  ];

  // ---------- Save ----------
  const save = Object.assign(
    { coins: 0, tour: 0, stars: [], chars: [0], balls: [0], char: 0, ball: 0, muted: false },
    {}
  );
  function loadSave() {
    try {
      const raw = Platform.load(SAVE_KEY);
      if (raw) Object.assign(save, JSON.parse(raw));
    } catch (e) { /* corrupt save: start fresh */ }
  }
  function persist() { Platform.save(SAVE_KEY, JSON.stringify(save)); }

  // ---------- Audio ----------
  const Sound = (() => {
    let ctx = null;
    function ensure() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctx = new AC();
      }
      if (ctx && ctx.state === 'suspended') ctx.resume();
    }
    function tone(freq, dur, type, vol, slide) {
      if (!ctx || save.muted || adPlaying) return;
      const o = ctx.createOscillator(), g = ctx.createGain();
      const now = ctx.currentTime;
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, now);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, now + dur);
      g.gain.setValueAtTime(vol || 0.2, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      o.connect(g).connect(ctx.destination);
      o.start(now); o.stop(now + dur);
    }
    return {
      unlock: ensure,
      hit: () => tone(320, 0.09, 'triangle', 0.25, 180),
      spike: () => { tone(160, 0.18, 'sawtooth', 0.22, 60); tone(900, 0.08, 'square', 0.08, 300); },
      superSpike: () => { tone(120, 0.35, 'sawtooth', 0.3, 40); tone(1400, 0.2, 'square', 0.1, 200); },
      jump: () => tone(420, 0.08, 'sine', 0.12, 620),
      point: () => { tone(660, 0.12, 'triangle', 0.2); setTimeout(() => tone(880, 0.16, 'triangle', 0.2), 110); },
      lose: () => tone(300, 0.3, 'triangle', 0.2, 120),
      win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'triangle', 0.22), i * 120)),
      click: () => tone(700, 0.05, 'sine', 0.12),
    };
  })();

  // ---------- Canvas & layout ----------
  const stage = document.getElementById('stage');
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let scale = 1;
  function fit() {
    const vw = window.innerWidth, vh = window.innerHeight;
    scale = Math.min(vw / W, vh / H);
    const cw = Math.round(W * scale), ch = Math.round(H * scale);
    stage.style.width = cw + 'px';
    stage.style.height = ch + 'px';
    stage.style.left = Math.round((vw - cw) / 2) + 'px';
    stage.style.top = Math.round((vh - ch) / 2) + 'px';
    stage.style.setProperty('--u', scale + 'px');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  }
  window.addEventListener('resize', fit);

  // ---------- Input ----------
  const input = [{ left: false, right: false, jump: false }, { left: false, right: false, jump: false }];
  const keys = new Set();
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const GAME_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyA', 'KeyD', 'KeyW'];
  window.addEventListener('keydown', e => {
    if (GAME_KEYS.includes(e.code)) e.preventDefault();
    keys.add(e.code);
    if ((e.code === 'Escape' || e.code === 'KeyP') && state === 'playing') pauseGame();
    Sound.unlock();
  });
  window.addEventListener('keyup', e => keys.delete(e.code));
  window.addEventListener('blur', () => { keys.clear(); if (state === 'playing') pauseGame(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'playing') pauseGame(); });

  const touchHeld = new Map(); // pointerId -> [player, key]
  document.querySelectorAll('#touch button').forEach(b => {
    const p = +b.dataset.p, k = b.dataset.k;
    b.addEventListener('pointerdown', e => {
      e.preventDefault(); Sound.unlock();
      touchHeld.set(e.pointerId, [p, k, b]); b.classList.add('on');
      try { b.setPointerCapture(e.pointerId); } catch (_) {}
    });
    const up = e => {
      const h = touchHeld.get(e.pointerId);
      if (h) { h[2].classList.remove('on'); touchHeld.delete(e.pointerId); }
    };
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('lostpointercapture', up);
  });

  function readInput() {
    for (const i of input) i.left = i.right = i.jump = false;
    const two = mode === 'duo';
    if (two) {
      input[0].left = keys.has('KeyA'); input[0].right = keys.has('KeyD'); input[0].jump = keys.has('KeyW');
      input[1].left = keys.has('ArrowLeft'); input[1].right = keys.has('ArrowRight'); input[1].jump = keys.has('ArrowUp');
    } else {
      input[0].left = keys.has('KeyA') || keys.has('ArrowLeft');
      input[0].right = keys.has('KeyD') || keys.has('ArrowRight');
      input[0].jump = keys.has('KeyW') || keys.has('ArrowUp') || keys.has('Space');
    }
    for (const [p, k] of touchHeld.values()) input[p][k] = true;
  }

  // ---------- Game state ----------
  let state = 'loading';   // loading | menu | playing | point | paused | result | ad
  let mode = 'solo';       // solo | duo
  let rivalIndex = 0;
  let venue = 'beach';
  let players = [], ball = null, particles = [];
  let score = [0, 0];
  let server = 0;
  let pointTimer = 0, banner = '', bannerTimer = 0;
  let shake = 0, time = 0;
  let adPlaying = false;
  let lastResult = null;

  function makePlayer(side, charIdx, isAI, level) {
    return {
      side, x: side === 0 ? 200 : 760, y: GROUND, vx: 0, vy: 0, onGround: true,
      char: CHARS[charIdx], dark: false, isAI, level: level || 1,
      power: 0, hitCooldown: 0, squash: 0,
      ai: { target: side === 0 ? 200 : 760, think: 0, jumpPlan: null, err: 0 },
    };
  }

  function resetRally() {
    const s = players[server];
    ball = { x: server === 0 ? 200 : 760, y: 170, vx: 0, vy: 0, spin: 0, angle: 0, fire: 0, trail: [], lastTouch: -1 };
    for (const p of players) {
      p.x = p.side === 0 ? 200 : 760; p.y = GROUND; p.vx = p.vy = 0; p.onGround = true; p.hitCooldown = 0;
      p.ai.jumpPlan = null; p.ai.err = 0;
    }
    if (s.isAI) s.x += 10; // AI serves with a slight forward push
    showBanner(t('serve'), 0.8);
  }

  function startMatch(newMode, rival) {
    mode = newMode;
    score = [0, 0];
    server = 0;
    particles = [];
    if (mode === 'solo') {
      rivalIndex = rival;
      const r = RIVALS[rival];
      venue = VENUES[r.venue];
      players = [makePlayer(0, save.char, false), makePlayer(1, r.char, true, rival + 1)];
      players[1].dark = !!r.dark;
      if (players[1].char === players[0].char && !r.dark) players[1].dark = true;
    } else {
      venue = VENUES[Math.floor(Math.random() * VENUES.length)];
      const other = save.char === 1 ? 0 : 1;
      players = [makePlayer(0, save.char, false), makePlayer(1, other, false)];
    }
    resetRally();
    showScreen(null);
    const touch = document.getElementById('touch');
    touch.classList.toggle('hidden', !isTouch);
    touch.classList.toggle('solo', mode === 'solo');
    touch.classList.toggle('duo', mode === 'duo');
    document.getElementById('hud').classList.remove('hidden');
    state = 'playing';
    Platform.gameplayStart();
  }

  function showBanner(text, dur) { banner = text; bannerTimer = dur; }

  // ---------- Physics ----------
  function updatePlayer(p, inp, dt) {
    let dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    const speed = p.isAI ? P_SPEED * aiSpeed(p) : P_SPEED;
    p.vx = dir * speed;
    if (inp.jump && p.onGround) { p.vy = -P_JUMP; p.onGround = false; Sound.jump(); }
    p.vy += P_GRAV * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.y >= GROUND) {
      if (!p.onGround && p.vy > 300) p.squash = 0.18;
      p.y = GROUND; p.vy = 0; p.onGround = true;
    }
    const minX = p.side === 0 ? PR : NET_X + NET_HALF + PR;
    const maxX = p.side === 0 ? NET_X - NET_HALF - PR : W - PR;
    p.x = Math.max(minX, Math.min(maxX, p.x));
    p.hitCooldown = Math.max(0, p.hitCooldown - dt);
    p.squash = Math.max(0, p.squash - dt);
  }

  function clampBall() {
    const sp = Math.hypot(ball.vx, ball.vy);
    const max = ball.fire > 0 ? B_MAX * 1.25 : B_MAX;
    if (sp > max) { ball.vx *= max / sp; ball.vy *= max / sp; }
  }

  // Direction from the ball that clears the net and lands on the opponent's side.
  function spikeDirection(p) {
    const towards = p.side === 0 ? 1 : -1;
    const clearY = NET_TOP - BR - 14;
    const nearNet = Math.abs(p.x - NET_X) < 190;
    let tx, ty;
    if (nearNet && ball.y < NET_TOP - 30) {
      // steep spike aimed deep into the opponent court, if the line clears the net
      tx = NET_X + towards * 230; ty = GROUND;
      const k = (NET_X - ball.x) / (tx - ball.x);
      const yAtNet = ball.y + (ty - ball.y) * k;
      if (k > 0 && k < 1 && yAtNet < clearY) return norm(tx - ball.x, ty - ball.y);
    }
    // otherwise aim over the top of the net
    tx = NET_X; ty = clearY - 30;
    if ((tx - ball.x) * towards <= 10) return norm(towards, -0.6);
    const d = norm(tx - ball.x, ty - ball.y);
    if (d.y > -0.15) d.y = -0.15;
    return norm(d.x, d.y);
  }
  function norm(x, y) { const l = Math.hypot(x, y) || 1; return { x: x / l, y: y / l }; }

  function collidePlayer(p) {
    const dx = ball.x - p.x, dy = ball.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist >= PR + BR || dist === 0 || p.hitCooldown > 0) return;
    const nx = dx / dist, ny = dy / dist;
    ball.x = p.x + nx * (PR + BR + 0.5);
    ball.y = p.y + ny * (PR + BR + 0.5);
    p.hitCooldown = 0.08;

    const towards = p.side === 0 ? 1 : -1;
    const onOwnSide = (ball.x - NET_X) * towards < 0;
    const canSpike = !p.onGround && ny < -0.25 && nx * towards > -0.55 && onOwnSide;

    if (canSpike) {
      const isSuper = p.power >= 1;
      const d = spikeDirection(p);
      const sp = isSuper ? 1180 : 820;
      ball.vx = d.x * sp; ball.vy = d.y * sp;
      ball.fire = isSuper ? 1.6 : 0;
      if (isSuper) {
        p.power = 0; shake = 0.35; Sound.superSpike();
        burst(ball.x, ball.y, 26, ['#ffb627', '#ff6b35', '#fff1a8']);
      } else {
        p.power = Math.min(1, p.power + 0.12); shake = 0.12; Sound.spike();
        burst(ball.x, ball.y, 12, ['#ffffff', '#ffd23f']);
      }
    } else {
      // reflect relative velocity, keep a minimum pop so rallies stay lively
      let rvx = ball.vx - p.vx, rvy = ball.vy - p.vy;
      const vn = rvx * nx + rvy * ny;
      if (vn < 0) { rvx -= 1.85 * vn * nx; rvy -= 1.85 * vn * ny; }
      ball.vx = rvx + p.vx * 0.6; ball.vy = rvy + Math.min(0, p.vy) * 0.4;
      const out = ball.vx * nx + ball.vy * ny;
      if (out < B_MIN_HIT) { ball.vx += nx * (B_MIN_HIT - out); ball.vy += ny * (B_MIN_HIT - out); }
      if (ball.vy > -260 && ny < 0) ball.vy = Math.min(ball.vy, -420);
      ball.fire = 0;
      p.power = Math.min(1, p.power + 0.25);
      Sound.hit();
      burst(ball.x - nx * BR, ball.y - ny * BR, 5, ['#ffffff']);
    }
    ball.spin = (ball.vx) / 40;
    ball.lastTouch = p.side;
    p.squash = 0.12;
    clampBall();
  }

  function collideNet() {
    const left = NET_X - NET_HALF, right = NET_X + NET_HALF;
    const cx = Math.max(left, Math.min(right, ball.x));
    const cy = Math.max(NET_TOP, Math.min(GROUND, ball.y));
    let dx = ball.x - cx, dy = ball.y - cy;
    const d = Math.hypot(dx, dy);
    if (d >= BR) return;
    if (d === 0) { dx = ball.vx > 0 ? -1 : 1; dy = 0; } else { dx /= d; dy /= d; }
    ball.x = cx + dx * (BR + 0.5);
    ball.y = cy + dy * (BR + 0.5);
    const vn = ball.vx * dx + ball.vy * dy;
    if (vn < 0) { ball.vx -= 1.6 * vn * dx; ball.vy -= 1.6 * vn * dy; }
    ball.vx *= 0.85;
    if (ball.fire > 0) ball.fire = 0;
    Sound.hit();
  }

  function stepBall(b, dt, withNet) {
    b.vy += B_GRAV * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x < BR) { b.x = BR; b.vx = Math.abs(b.vx) * 0.85; }
    if (b.x > W - BR) { b.x = W - BR; b.vx = -Math.abs(b.vx) * 0.85; }
    if (withNet && b.y > NET_TOP - BR && Math.abs(b.x - NET_X) < NET_HALF + BR) {
      b.vx = -b.vx * 0.85; b.x = NET_X + Math.sign(b.x - NET_X || -b.vx) * (NET_HALF + BR + 0.5);
    }
  }

  // ---------- AI ----------
  function aiSpeed(p) { return Math.min(1.05, 0.66 + p.level * 0.05); }

  function predictLanding(hitY) {
    const b = { x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy };
    for (let i = 0; i < 240; i++) {
      stepBall(b, 1 / 60, true);
      if (b.y >= hitY && b.vy > 0) return b.x;
    }
    return b.x;
  }

  function updateAI(p, inp, dt) {
    const ai = p.ai;
    const towards = p.side === 0 ? 1 : -1;
    const home = p.side === 0 ? 240 : 720;
    const ownSide = x => (x - NET_X) * towards < 0;
    ai.think -= dt;
    if (ai.think <= 0) {
      ai.think = Math.max(0.03, 0.2 - p.level * 0.02);
      const coming = ownSide(ball.x) || ball.vx * towards < 0;
      if (coming) {
        const land = predictLanding(GROUND - PR - 10);
        if (Math.random() < 0.15) ai.err = (Math.random() - 0.5) * Math.max(6, 70 - p.level * 8);
        // stand slightly behind the ball so the touch sends it towards the net
        ai.target = ownSide(land) ? land - towards * (16 + (8 - p.level) * 2) + ai.err : home;
      } else {
        ai.target = home;
      }
    }
    const dx = ai.target - p.x;
    inp.left = dx < -6; inp.right = dx > 6;

    // jump to spike when the ball drops near the net on our side
    const near = Math.abs(ball.x - p.x) < 80 && ownSide(ball.x);
    const height = GROUND - ball.y;
    if (p.onGround && near && height > 150 && height < 300 && ball.vy > -120) {
      if (ai.jumpPlan === null) ai.jumpPlan = Math.random() < 0.15 + p.level * 0.1;
      if (ai.jumpPlan && Math.abs(p.x - NET_X) < 260) inp.jump = true;
    }
    if (!ownSide(ball.x)) ai.jumpPlan = null;
  }

  // ---------- Effects ----------
  function burst(x, y, n, colors) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 80 + Math.random() * 260;
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: 0.5 + Math.random() * 0.4,
        max: 0.9, color: colors[i % colors.length], r: 2 + Math.random() * 3 });
    }
  }
  function sand(x) {
    const c = venue === 'snow' ? ['#ffffff', '#dfefff'] : venue === 'beach' ? ['#f4d58d', '#e6be6a'] : ['#cccccc', '#999999'];
    for (let i = 0; i < 14; i++) {
      particles.push({ x: x + (Math.random() - 0.5) * 30, y: GROUND - 2, vx: (Math.random() - 0.5) * 260,
        vy: -120 - Math.random() * 260, life: 0.6, max: 0.6, color: c[i % 2], r: 2 + Math.random() * 3 });
    }
  }

  // ---------- Update ----------
  function update(dt) {
    time += dt;
    if (bannerTimer > 0) bannerTimer -= dt;
    shake = Math.max(0, shake - dt);
    for (const pt of particles) { pt.vy += 900 * dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.life -= dt; }
    particles = particles.filter(pt => pt.life > 0);

    if (state === 'point') {
      pointTimer -= dt;
      if (ball) { ball.vx *= 0.96; }
      if (pointTimer <= 0) {
        if (score[0] >= WIN_POINTS || score[1] >= WIN_POINTS) endMatch();
        else { resetRally(); state = 'playing'; }
      }
      return;
    }
    if (state !== 'playing') return;

    readInput();
    for (const p of players) if (p.isAI) updateAI(p, input[p.side], dt);
    for (const p of players) updatePlayer(p, input[p.side], dt);

    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > 10) ball.trail.shift();
    stepBall(ball, dt, false);
    collideNet();
    for (const p of players) collidePlayer(p);
    ball.angle += ball.spin * dt;
    ball.fire = Math.max(0, ball.fire - dt);
    if (ball.y < -600) ball.y = -600;

    if (ball.y + BR >= GROUND) {
      ball.y = GROUND - BR;
      const loser = ball.x < NET_X ? 0 : 1;
      const winner = 1 - loser;
      score[winner]++;
      server = winner;
      sand(ball.x);
      ball.vy = -Math.abs(ball.vy) * 0.35; ball.vx *= 0.5;
      shake = Math.max(shake, 0.15);
      state = 'point';
      pointTimer = 1.1;
      const humanWon = mode === 'duo' || winner === 0;
      if (humanWon) Sound.point(); else Sound.lose();
      showBanner(t('point'), 1);
    }
  }

  // ---------- Match end, ads, rewards ----------
  async function endMatch() {
    state = 'result';
    Platform.gameplayStop();
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('touch').classList.add('hidden');
    const won = score[0] > score[1];
    let coins = 0, title;
    if (mode === 'solo') {
      if (won) {
        coins = 20 + rivalIndex * 6 + (score[1] === 0 ? 10 : 0);
        const stars = score[1] <= 2 ? 3 : score[1] <= 4 ? 2 : 1;
        save.stars[rivalIndex] = Math.max(save.stars[rivalIndex] || 0, stars);
        if (save.tour === rivalIndex && save.tour < RIVALS.length) save.tour = rivalIndex + 1;
        title = rivalIndex === RIVALS.length - 1 ? t('champion') : t('youWin');
        Sound.win();
        Platform.happytime();
      } else {
        coins = 4 + score[0];
        title = t('youLose');
      }
    } else {
      coins = 5;
      title = won ? t('p1Wins') : t('p2Wins');
      Sound.win();
    }
    save.coins += coins;
    persist();
    lastResult = { won, coins, title };

    // A win in the tour offers an optional rewarded ad instead of a midgame ad,
    // so the two are never combined on the same transition.
    const offerReward = mode === 'solo' && won;
    if (!offerReward) await runAd('midgame');
    showResult(offerReward);
  }

  async function runAd(type) {
    const prev = state;
    state = 'ad';
    const ok = await Platform.showAd(type, () => { adPlaying = true; });
    adPlaying = false;
    state = prev === 'ad' ? 'result' : prev;
    return ok;
  }

  function showResult(offerReward) {
    const r = lastResult;
    document.getElementById('resTitle').textContent = r.title;
    document.getElementById('resScore').textContent = score[0] + ' - ' + score[1];
    document.getElementById('resCoins').textContent = t('coinsEarned', { n: r.coins });
    const rewardRow = document.getElementById('rewardRow');
    rewardRow.classList.toggle('hidden', !offerReward);
    document.getElementById('btnDouble').textContent = t('double') + ' (+' + r.coins + ')';
    const next = document.getElementById('btnNext');
    if (mode === 'duo') next.textContent = t('rematch');
    else if (r.won && rivalIndex < RIVALS.length - 1) next.textContent = t('next');
    else if (r.won) next.textContent = t('tour');
    else next.textContent = t('retry');
    showScreen('result');
  }

  // ---------- Pause ----------
  function pauseGame() {
    if (state !== 'playing' && state !== 'point') return;
    pausedFrom = state;
    state = 'paused';
    Platform.gameplayStop();
    showScreen('pause');
  }
  let pausedFrom = 'playing';
  function resumeGame() {
    showScreen(null);
    state = pausedFrom;
    keys.clear();
    Platform.gameplayStart();
  }

  // ---------- Drawing ----------
  function drawBackground() {
    let g;
    if (venue === 'beach') {
      g = ctx.createLinearGradient(0, 0, 0, GROUND);
      g.addColorStop(0, '#4cc9f0'); g.addColorStop(1, '#bde8f6');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, GROUND);
      ctx.fillStyle = '#fff6c2'; circle(820, 90, 46);
      ctx.fillStyle = '#2a9df4'; ctx.fillRect(0, GROUND - 70, W, 70);
      ctx.fillStyle = '#ffffff55';
      for (let i = 0; i < 6; i++) ctx.fillRect(((i * 190 + time * 30) % (W + 120)) - 120, GROUND - 52 + (i % 2) * 18, 90, 4);
      cloud(160 + Math.sin(time * 0.1) * 20, 80); cloud(560, 120);
      palm(60, GROUND); palm(910, GROUND, true);
      ctx.fillStyle = '#f4d58d'; ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = '#e6be6a'; for (let i = 0; i < 40; i++) ctx.fillRect((i * 97) % W, GROUND + 12 + (i * 37) % 50, 4, 3);
    } else if (venue === 'gym') {
      ctx.fillStyle = '#3d405b'; ctx.fillRect(0, 0, W, GROUND);
      ctx.fillStyle = '#4a4e6d';
      for (let r = 0; r < 4; r++) ctx.fillRect(0, 150 + r * 60, W, 30);
      ctx.fillStyle = '#ffffff14'; for (let i = 0; i < 5; i++) { ctx.fillRect(80 + i * 200, 20, 120, 16); }
      ctx.fillStyle = '#ffb627'; ctx.fillRect(0, GROUND - 8, W, 8);
      g = ctx.createLinearGradient(0, GROUND, 0, H);
      g.addColorStop(0, '#d8a35d'); g.addColorStop(1, '#b07a3a');
      ctx.fillStyle = g; ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.strokeStyle = '#00000022'; ctx.lineWidth = 2;
      for (let x = 0; x < W; x += 64) { ctx.beginPath(); ctx.moveTo(x, GROUND); ctx.lineTo(x - 30, H); ctx.stroke(); }
    } else if (venue === 'rooftop') {
      g = ctx.createLinearGradient(0, 0, 0, GROUND);
      g.addColorStop(0, '#10002b'); g.addColorStop(1, '#5a189a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, GROUND);
      ctx.fillStyle = '#ffffffaa'; for (let i = 0; i < 40; i++) ctx.fillRect((i * 131) % W, (i * 53) % 220, 2, 2);
      for (let i = 0; i < 12; i++) {
        const bw = 60 + (i * 37) % 50, bh = 120 + (i * 71) % 180, bx = i * 82;
        ctx.fillStyle = '#240046'; ctx.fillRect(bx, GROUND - bh, bw, bh);
        ctx.fillStyle = '#ffd60a55';
        for (let wy = GROUND - bh + 12; wy < GROUND - 20; wy += 22)
          for (let wx = bx + 8; wx < bx + bw - 8; wx += 16) if (((wx + wy) * 7) % 5 < 2) ctx.fillRect(wx, wy, 7, 9);
      }
      ctx.fillStyle = '#3c3c50'; ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = '#ffb627'; ctx.fillRect(0, GROUND, W, 5);
    } else {
      g = ctx.createLinearGradient(0, 0, 0, GROUND);
      g.addColorStop(0, '#90e0ef'); g.addColorStop(1, '#e0fbfc');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, GROUND);
      ctx.fillStyle = '#caf0f8';
      ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(180, 220); ctx.lineTo(360, GROUND); ctx.fill();
      ctx.beginPath(); ctx.moveTo(560, GROUND); ctx.lineTo(780, 180); ctx.lineTo(W, GROUND); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(140, 270); ctx.lineTo(180, 220); ctx.lineTo(220, 270); ctx.fill();
      ctx.beginPath(); ctx.moveTo(735, 235); ctx.lineTo(780, 180); ctx.lineTo(825, 235); ctx.fill();
      ctx.fillStyle = '#ffffffcc';
      for (let i = 0; i < 50; i++) circle((i * 113 + time * 20 * (1 + i % 3)) % W, (i * 71 + time * 40 * (1 + i % 2)) % GROUND, 2);
      ctx.fillStyle = '#f8f9fa'; ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = '#dee2e6'; ctx.fillRect(0, GROUND, W, 6);
    }
  }
  function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  function cloud(x, y) { ctx.fillStyle = '#ffffffdd'; circle(x, y, 26); circle(x + 28, y - 10, 30); circle(x + 58, y, 24); }
  function palm(x, y, flip) {
    ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
    ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(20, -100, 6, -190); ctx.stroke();
    ctx.fillStyle = '#2d6a4f';
    for (let i = 0; i < 5; i++) {
      ctx.save(); ctx.translate(6, -190); ctx.rotate(-1.2 + i * 0.6);
      ctx.beginPath(); ctx.ellipse(40, 0, 46, 10, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    ctx.restore();
  }

  function drawNet() {
    ctx.fillStyle = '#00000033'; ctx.fillRect(NET_X - 30, GROUND - 2, 60, 6);
    ctx.fillStyle = '#e9ecef'; ctx.fillRect(NET_X - NET_HALF, NET_TOP, NET_HALF * 2, GROUND - NET_TOP);
    ctx.strokeStyle = '#adb5bd'; ctx.lineWidth = 1;
    for (let y = NET_TOP + 10; y < GROUND; y += 12) { ctx.beginPath(); ctx.moveTo(NET_X - NET_HALF, y); ctx.lineTo(NET_X + NET_HALF, y); ctx.stroke(); }
    ctx.fillStyle = '#ff3b30'; ctx.fillRect(NET_X - NET_HALF - 2, NET_TOP - 6, NET_HALF * 2 + 4, 10);
  }

  function drawPlayer(p, x, y, sc, lookX, lookY, cv) {
    const c = cv || ctx;
    const ch = p.char;
    const sq = p.squash > 0 ? 1 - p.squash * 1.2 : 1;
    const stretch = !p.onGround ? 1.06 : 1;
    c.save();
    c.translate(x, y);
    c.scale(sc / sq, sc * sq * stretch);
    if (!cv) { // shadow
      c.save(); c.scale(1 / (sc / sq), 1 / (sc * sq * stretch));
      const h = Math.max(0, GROUND - p.y);
      c.fillStyle = 'rgba(0,0,0,' + Math.max(0.08, 0.28 - h / 900) + ')';
      c.beginPath(); c.ellipse(0, GROUND - p.y + 2, PR * (1 - h / 700), 8, 0, 0, Math.PI * 2); c.fill();
      c.restore();
    }
    const body = p.dark ? shade(ch.body, -0.45) : ch.body;
    c.fillStyle = body;
    c.beginPath(); c.arc(0, 0, PR, Math.PI, 0); c.lineTo(PR, 0); c.closePath(); c.fill();
    c.lineWidth = 3; c.strokeStyle = '#1b1b1bcc'; c.stroke();
    c.fillStyle = '#ffffff33';
    c.beginPath(); c.ellipse(-14, -26, 10, 6, -0.5, 0, Math.PI * 2); c.fill();
    // headband
    c.fillStyle = ch.band;
    c.beginPath(); c.arc(0, 0, PR, Math.PI * 1.13, Math.PI * 1.87); c.arc(0, 0, PR - 9, Math.PI * 1.87, Math.PI * 1.13, true); c.fill();
    // eyes follow the ball
    const facing = p.side === 0 ? 1 : -1;
    const ex = 10 * facing, ey = -16;
    let lx = lookX - (x + ex * sc), ly = lookY - (y + ey * sc);
    const ll = Math.hypot(lx, ly) || 1; lx /= ll; ly /= ll;
    c.fillStyle = '#fff'; c.beginPath(); c.arc(ex, ey, 8, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#1b1b1b'; c.beginPath(); c.arc(ex + lx * 4, ey + ly * 4, 4, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    r = Math.round(r * (1 + amt)); g = Math.round(g * (1 + amt)); b = Math.round(b * (1 + amt));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function drawBall(b, skin, cv, r) {
    const c = cv || ctx;
    const R = r || BR;
    c.save(); c.translate(b.x, b.y); c.rotate(b.angle || 0);
    c.fillStyle = skin.a; c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.fill();
    c.fillStyle = skin.b;
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, -0.3, 1.5); c.closePath(); c.fill();
    c.fillStyle = skin.c;
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, 2.0, 3.6); c.closePath(); c.fill();
    c.strokeStyle = '#00000044'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.stroke();
    c.restore();
  }

  function drawHUD() {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0008';
    roundRect(W / 2 - 90, 12, 180, 56, 14); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '900 40px "Trebuchet MS",sans-serif';
    ctx.fillText(score[0] + ' : ' + score[1], W / 2, 54);
    ctx.font = '700 15px "Trebuchet MS",sans-serif';
    const n0 = mode === 'duo' ? 'P1' : CHARS[save.char].name;
    const n1 = mode === 'duo' ? 'P2' : RIVALS[rivalIndex].nick;
    ctx.textAlign = 'left'; ctx.fillText(n0, 20, 28);
    ctx.textAlign = 'right'; ctx.fillText(n1, W - 76, 28);
    powerBar(20, 38, players[0].power, false);
    powerBar(W - 76 - 140, 38, players[1].power, true);
    if (bannerTimer > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, bannerTimer * 3);
      ctx.textAlign = 'center'; ctx.font = '900 54px "Trebuchet MS",sans-serif';
      ctx.fillStyle = '#0006'; ctx.fillText(banner, W / 2 + 3, 173);
      ctx.fillStyle = '#ffb627'; ctx.fillText(banner, W / 2, 170);
      ctx.restore();
    }
  }
  function powerBar(x, y, v, right) {
    ctx.fillStyle = '#0007'; roundRect(x, y, 140, 14, 7); ctx.fill();
    const full = v >= 1;
    ctx.fillStyle = full ? (Math.sin(time * 12) > 0 ? '#ffb627' : '#ff6b35') : '#ffd23f';
    const w = 140 * Math.min(1, v);
    roundRect(right ? x + 140 - w : x, y, Math.max(w, 0.1), 14, 7); ctx.fill();
    if (full) {
      ctx.fillStyle = '#1b1b1b'; ctx.font = '900 11px "Trebuchet MS",sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(t('superReady'), x + 70, y + 11);
    }
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function render() {
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 30, (Math.random() - 0.5) * shake * 30);
    drawBackground();
    if (players.length) {
      drawNet();
      for (const p of players) drawPlayer(p, p.x, p.y, 1, ball.x, ball.y);
      if (ball.fire > 0) {
        ball.trail.forEach((tp, i) => {
          ctx.globalAlpha = i / ball.trail.length * 0.8;
          ctx.fillStyle = i % 2 ? '#ff6b35' : '#ffb627';
          circle(tp.x, tp.y, BR * (0.4 + i / ball.trail.length * 0.7));
        });
        ctx.globalAlpha = 1;
      } else {
        ball.trail.forEach((tp, i) => {
          ctx.globalAlpha = i / ball.trail.length * 0.18; ctx.fillStyle = '#fff'; circle(tp.x, tp.y, BR * 0.7);
        });
        ctx.globalAlpha = 1;
      }
      // marker when the ball is above the screen
      if (ball.y < -BR) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(ball.x, 6); ctx.lineTo(ball.x - 8, 20); ctx.lineTo(ball.x + 8, 20); ctx.fill(); }
      drawBall(ball, BALLS[save.ball]);
      for (const pt of particles) { ctx.globalAlpha = Math.max(0, pt.life / pt.max); ctx.fillStyle = pt.color; circle(pt.x, pt.y, pt.r); }
      ctx.globalAlpha = 1;
      if (state === 'playing' || state === 'point' || state === 'paused') drawHUD();
    }
    ctx.restore();
  }

  // ---------- Menus ----------
  const screens = ['menu', 'tour', 'shop', 'pause', 'result'];
  function showScreen(id) {
    for (const s of screens) document.getElementById(s).classList.toggle('hidden', s !== id);
    if (id) refreshCoins();
  }
  function refreshCoins() { document.querySelectorAll('.coins').forEach(e => { e.textContent = save.coins; }); }
  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg; el.classList.remove('hidden');
    clearTimeout(toast.h); toast.h = setTimeout(() => el.classList.add('hidden'), 2200);
  }
  function goMenu() {
    state = 'menu';
    players = []; ball = null;
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('touch').classList.add('hidden');
    venue = 'beach';
    updateMute();
    showScreen('menu');
  }

  function previewCanvas(drawFn) {
    const c = document.createElement('canvas');
    c.width = 180; c.height = 140;
    const g = c.getContext('2d');
    g.scale(2, 2);
    drawFn(g);
    return c;
  }

  function buildTour() {
    const grid = document.getElementById('rivals');
    grid.innerHTML = '';
    RIVALS.forEach((r, i) => {
      const card = document.createElement('button');
      const locked = i > save.tour;
      card.className = 'card' + (locked ? ' locked' : '');
      const fake = { char: CHARS[r.char], dark: !!r.dark, side: 1, squash: 0, onGround: true, y: GROUND };
      card.appendChild(previewCanvas(g => drawPlayer(fake, 45, 62, 0.85, 10, 30, g)));
      const name = document.createElement('div'); name.textContent = r.nick; card.appendChild(name);
      const info = document.createElement('small');
      info.textContent = locked ? t('locked') : t('rival', { n: i + 1 }) + ' · ' + t(VENUES[r.venue]);
      card.appendChild(info);
      const st = document.createElement('div'); st.className = 'stars';
      const s = save.stars[i] || 0; st.textContent = '★'.repeat(s) + '☆'.repeat(3 - s);
      card.appendChild(st);
      card.addEventListener('click', () => {
        if (locked) { toast(t('locked')); return; }
        Sound.click(); startMatch('solo', i);
      });
      grid.appendChild(card);
    });
  }

  let shopTab = 'chars';
  function buildShop() {
    const grid = document.getElementById('items');
    grid.innerHTML = '';
    document.getElementById('tabChars').classList.toggle('on', shopTab === 'chars');
    document.getElementById('tabBalls').classList.toggle('on', shopTab === 'balls');
    const list = shopTab === 'chars' ? CHARS : BALLS;
    const owned = shopTab === 'chars' ? save.chars : save.balls;
    const current = shopTab === 'chars' ? save.char : save.ball;
    list.forEach((it, i) => {
      const card = document.createElement('button');
      const has = owned.includes(i);
      card.className = 'card' + (i === current ? ' sel' : '');
      card.appendChild(previewCanvas(g => {
        if (shopTab === 'chars') drawPlayer({ char: it, dark: false, side: 0, squash: 0, onGround: true, y: GROUND }, 45, 62, 0.85, 80, 30, g);
        else drawBall({ x: 45, y: 36, angle: 0.4 }, it, g, 26);
      }));
      const name = document.createElement('div'); name.textContent = it.name; card.appendChild(name);
      const info = document.createElement('small');
      info.textContent = i === current ? t('selected') : has ? t('select') : '● ' + it.price;
      card.appendChild(info);
      card.addEventListener('click', () => {
        if (!has) {
          if (save.coins < it.price) { toast('● ' + it.price); return; }
          save.coins -= it.price; owned.push(i);
        }
        if (shopTab === 'chars') save.char = i; else save.ball = i;
        persist(); Sound.click(); buildShop(); refreshCoins();
      });
      grid.appendChild(card);
    });
  }

  function updateMute() { document.getElementById('btnMute').textContent = save.muted ? '🔇' : '🔊'; }

  function wireUI() {
    document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
    const on = (id, fn) => document.getElementById(id).addEventListener('click', () => { Sound.unlock(); fn(); });
    on('btnTour', () => { Sound.click(); buildTour(); showScreen('tour'); });
    on('btn2p', () => { Sound.click(); startMatch('duo'); });
    on('btnShop', () => { Sound.click(); shopTab = 'chars'; buildShop(); showScreen('shop'); });
    on('tabChars', () => { shopTab = 'chars'; buildShop(); });
    on('tabBalls', () => { shopTab = 'balls'; buildShop(); });
    on('btnMute', () => { save.muted = !save.muted; persist(); updateMute(); });
    on('btnPause', pauseGame);
    on('btnResume', resumeGame);
    on('btnQuit', () => { Platform.gameplayStop(); goMenu(); });
    on('btnMenu', goMenu);
    on('btnNext', () => {
      if (mode === 'duo') startMatch('duo');
      else if (lastResult.won && rivalIndex < RIVALS.length - 1) startMatch('solo', rivalIndex + 1);
      else if (lastResult.won) { buildTour(); showScreen('tour'); state = 'menu'; }
      else startMatch('solo', rivalIndex);
    });
    on('btnDouble', async () => {
      const ok = await runAd('rewarded');
      if (ok) {
        save.coins += lastResult.coins; persist();
        document.getElementById('resCoins').textContent = t('coinsEarned', { n: lastResult.coins * 2 });
        Sound.win();
      } else {
        toast(t('adUnavailable'));
      }
      document.getElementById('rewardRow').classList.add('hidden');
      refreshCoins();
    });
    on('btnNoThanks', () => { document.getElementById('rewardRow').classList.add('hidden'); });
    document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => { Sound.click(); goMenu(); }));
    if (isTouch) document.querySelector('#menu .hint').classList.add('hidden');
  }

  // ---------- Loop ----------
  let last = 0, acc = 0;
  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;
    if (state === 'menu') time += dt;
    acc += dt;
    while (acc >= STEP) { update(STEP); acc -= STEP; }
    render();
    requestAnimationFrame(frame);
  }

  async function boot() {
    fit();
    await Platform.init();
    Platform.loadingStart();
    loadSave();
    wireUI();
    Platform.loadingStop();
    goMenu();
    requestAnimationFrame(frame);
  }

  // Exposed for automated tests only.
  window.__spike = {
    get state() { return state; }, get score() { return score; }, get ball() { return ball; },
    get players() { return players; }, startMatch, save,
    tick(n) { for (let i = 0; i < n; i++) update(STEP); },
  };

  boot();
})();
