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
      characters: 'Characters', balls: 'Balls', supers: 'Supers', paused: 'Paused', resume: 'Resume', menu: 'Menu',
      noThanks: 'No, thanks', youWin: 'You win!', youLose: 'You lose', p1Wins: 'Player 1 wins!', p2Wins: 'Player 2 wins!',
      next: 'Next rival', retry: 'Retry', rematch: 'Rematch', double: 'Double coins', coinsEarned: '+{n} coins',
      champion: 'Tour champion!', locked: 'Beat the previous rival', select: 'Select', selected: 'Selected',
      adUnavailable: 'Ad not available, try again later', serve: 'Serve!', point: 'Point!', superReady: 'SUPER',
      controls: '1P: A/D or arrows to move, W / up / space to jump  ·  2P: A/D/W vs arrows',
      rival: 'Rival {n}', beach: 'beach', gym: 'warehouse', rooftop: 'rooftop', snow: 'snow', jungle: 'jungle', volcano: 'volcano',
      career: 'Spike Career', world: 'World {n}', level: 'Level {n}', boss: 'BOSS', nextLevel: 'Next level',
      newTour: 'New tournament', round: 'Round {n} of 8', tourRule: 'Rivals change every tournament. Lose once and you start again from round 1.',
      backToStart: 'Back to round 1', tourPrize: '+{n} champion bonus', play: 'Play', beaten: 'Beaten', careerDone: 'All levels cleared!',
      superHint: 'Fill the bar, then spike in the air', go: 'GO!', free: 'Free',
      s_fire: 'Fire', s_fire_d: 'A blazing fast spike',
      s_sticky: 'Bubblegum', s_sticky_d: 'Whoever stops it can\'t jump this point',
      s_shrink: 'Shrink', s_shrink_d: 'Whoever stops it shrinks this point',
      s_heavy: 'Meteor', s_heavy_d: 'Falls hard and barely bounces back',
      s_ice: 'Ice', s_ice_d: 'Whoever stops it freezes for 2 seconds',
      s_zerog: 'Zero Gravity', s_zerog_d: 'Whoever stops it floats this point',
      s_lightning: 'Lightning', s_lightning_d: 'Zigzags and stuns for 1 second',
      s_ghost: 'Ghost', s_ghost_d: 'Turns invisible past the net',
      s_clones: 'Clones', s_clones_d: 'Splits into 3 balls; only one is real',
      s_confusion: 'Confusion', s_confusion_d: 'Whoever stops it gets reversed controls this point',
      e_sticky: 'Stuck!', e_shrink: 'Tiny!', e_heavy: 'Too heavy!', e_ice: 'Frozen!', e_zerog: 'Floating!',
      e_lightning: 'Zapped!', e_confusion: 'Confused!',
      s_tornado: 'Tornado', s_tornado_d: 'Spins in wild loops through the air',
      s_magnet: 'Magnet', s_magnet_d: 'Bends away from whoever tries to stop it',
      s_teleport: 'Teleport', s_teleport_d: 'Vanishes past the net and pops up somewhere else',
      s_bomb: 'Bomb', s_bomb_d: 'Explodes on touch and blasts the rival back',
      s_snail: 'Snail', s_snail_d: 'Whoever stops it moves at half speed this point',
      s_ink: 'Ink', s_ink_d: 'Splats ink over the rival\'s side for 3 seconds',
      s_boomerang: 'Boomerang', s_boomerang_d: 'Flies deep, then swings back towards the net',
      s_wind: 'Gale', s_wind_d: 'Whoever stops it is blown back this point',
      s_balloon: 'Balloon', s_balloon_d: 'Whoever stops it puffs up and can barely jump this point',
      s_quake: 'Earthquake', s_quake_d: 'Launches whoever stops it into the air, out of control',
      e_bomb: 'Boom!', e_snail: 'So slow!', e_ink: 'Splat!', e_wind: 'Blown away!', e_balloon: 'Puffed up!', e_quake: 'Earthquake!',
    },
    es: {
      tagline: 'Salta. Remata. Conquista la playa.', tour: 'Torneo', twoPlayers: '2 Jugadores', shop: 'Tienda', back: 'Volver',
      characters: 'Personajes', balls: 'Balones', supers: 'Súpers', paused: 'Pausa', resume: 'Seguir', menu: 'Menú',
      noThanks: 'No, gracias', youWin: '¡Has ganado!', youLose: 'Has perdido', p1Wins: '¡Gana el jugador 1!', p2Wins: '¡Gana el jugador 2!',
      next: 'Siguiente rival', retry: 'Reintentar', rematch: 'Revancha', double: 'Duplicar monedas', coinsEarned: '+{n} monedas',
      champion: '¡Campeón del torneo!', locked: 'Gana al rival anterior', select: 'Elegir', selected: 'Elegido',
      adUnavailable: 'Anuncio no disponible, prueba más tarde', serve: '¡Saca!', point: '¡Punto!', superReady: 'SÚPER',
      controls: '1J: A/D o flechas para moverte, W / arriba / espacio para saltar  ·  2J: A/D/W contra flechas',
      rival: 'Rival {n}', beach: 'playa', gym: 'almacén', rooftop: 'azotea', snow: 'nieve', jungle: 'selva', volcano: 'volcán',
      career: 'Spike Career', world: 'Mundo {n}', level: 'Nivel {n}', boss: 'JEFE', nextLevel: 'Siguiente nivel',
      newTour: 'Nuevo torneo', round: 'Ronda {n} de 8', tourRule: 'Los rivales cambian en cada torneo. Si pierdes, vuelves a la ronda 1.',
      backToStart: 'Vuelves a la ronda 1', tourPrize: '+{n} de premio de campeón', play: 'Jugar', beaten: 'Ganado', careerDone: '¡Todos los niveles superados!',
      superHint: 'Llena la barra y remata en el aire', go: '¡YA!', free: 'Gratis',
      s_fire: 'Fuego', s_fire_d: 'Un remate rapidísimo',
      s_sticky: 'Chicle', s_sticky_d: 'Quien la para no puede saltar en este punto',
      s_shrink: 'Encoger', s_shrink_d: 'Quien la para se encoge en este punto',
      s_heavy: 'Meteorito', s_heavy_d: 'Cae a plomo y apenas rebota',
      s_ice: 'Hielo', s_ice_d: 'Quien la para se congela 2 segundos',
      s_zerog: 'Gravedad cero', s_zerog_d: 'Quien la para flota en este punto',
      s_lightning: 'Rayo', s_lightning_d: 'Va en zigzag y paraliza 1 segundo',
      s_ghost: 'Fantasma', s_ghost_d: 'Se vuelve invisible al pasar la red',
      s_clones: 'Clones', s_clones_d: 'Se divide en 3 balones; solo uno es real',
      s_confusion: 'Confusión', s_confusion_d: 'Quien la para tiene los controles al revés en este punto',
      e_sticky: '¡Pegado!', e_shrink: '¡Mini!', e_heavy: '¡Pesa mucho!', e_ice: '¡Congelado!', e_zerog: '¡Flotando!',
      e_lightning: '¡Electrocutado!', e_confusion: '¡Confundido!',
      s_tornado: 'Tornado', s_tornado_d: 'Da vueltas locas por el aire',
      s_magnet: 'Imán', s_magnet_d: 'Se aparta de quien intenta pararla',
      s_teleport: 'Teletransporte', s_teleport_d: 'Desaparece al pasar la red y aparece en otro sitio',
      s_bomb: 'Bomba', s_bomb_d: 'Explota al tocarla y lanza al rival hacia atrás',
      s_snail: 'Caracol', s_snail_d: 'Quien la para va a media velocidad en este punto',
      s_ink: 'Tinta', s_ink_d: 'Mancha de tinta el campo rival durante 3 segundos',
      s_boomerang: 'Bumerán', s_boomerang_d: 'Va al fondo y vuelve de golpe hacia la red',
      s_wind: 'Vendaval', s_wind_d: 'Quien la para sale empujado por el viento en este punto',
      s_balloon: 'Globo', s_balloon_d: 'Quien la para se hincha y apenas salta en este punto',
      s_quake: 'Terremoto', s_quake_d: 'Lanza por los aires a quien la para, sin control',
      e_bomb: '¡Bum!', e_snail: '¡Qué lento!', e_ink: '¡Splash!', e_wind: '¡Por los aires!', e_balloon: '¡Hinchado!', e_quake: '¡Terremoto!',
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
    // accessories are cosmetic only: the hitbox stays the same half circle
    { name: 'Rider', body: '#d00000', band: '#d00000', acc: 'helmet', accColor: '#111111', price: 600 },
    { name: 'Spiky', body: '#2ec4b6', band: '#011627', acc: 'spikes', accColor: '#e0e1dd', price: 650 },
    { name: 'Cyborg', body: '#5c677d', band: '#5c677d', acc: 'shades', accColor: '#ff1f3d', price: 700 },
    { name: 'Inked', body: '#f2cc8f', band: '#f2cc8f', acc: 'tattoo', accColor: '#9d4edd', price: 750 },
    { name: 'King', body: '#3a86ff', band: '#3a86ff', acc: 'crown', price: 850 },
    { name: 'Pirate', body: '#bc6c25', band: '#d62828', acc: 'pirate', price: 900 },
    { name: 'DJ', body: '#8338ec', band: '#8338ec', acc: 'headphones', accColor: '#00f5d4', price: 950 },
    { name: 'Ninja', body: '#343a40', band: '#343a40', acc: 'ninja', accColor: '#d00000', price: 1000 },
  ];
  const BALLS = [
    { name: 'Classic', a: '#ffffff', b: '#ffd23f', c: '#2a9df4', price: 0 },
    { name: 'Beach', a: '#ffffff', b: '#ff3b30', c: '#2ec27e', price: 50 },
    { name: 'Lava', type: 'lava', price: 150 },
    { name: 'Water', type: 'water', price: 150 },
    { name: 'Galaxy', type: 'galaxy', price: 200 },
    { name: 'Melon', type: 'melon', price: 280 },
    { name: 'Gold', type: 'gold', price: 450 },
    { name: 'Sun', type: 'sun', price: 320 },
    { name: 'Moon', type: 'moon', price: 340 },
    { name: 'Earth', type: 'earth', price: 380 },
    { name: 'Disco', type: 'disco', price: 420 },
    { name: 'Basket', type: 'basket', price: 260 },
    { name: 'Soccer', type: 'soccer', price: 260 },
    { name: 'Donut', type: 'donut', price: 300 },
    { name: 'Eyeball', type: 'eye', price: 360 },
    { name: 'Crystal', type: 'crystal', price: 400 },
  ];
  // Supers: the spike you throw when the power bar is full. `effect` is applied to
  // the opponent who touches the ball; flight behaviours live in updateBallSuper.
  const SUPERS = [
    { id: 'fire', price: 0, color: '#ff6b35', glow: '#ffb627', speed: 1180 },
    { id: 'sticky', price: 80, color: '#f72585', glow: '#ffb3c6', speed: 1040 },
    { id: 'shrink', price: 120, color: '#6bd425', glow: '#d8f3dc', speed: 1040 },
    { id: 'heavy', price: 160, color: '#495057', glow: '#e85d04', speed: 1000 },
    { id: 'ice', price: 200, color: '#48cae4', glow: '#caf0f8', speed: 1040 },
    { id: 'zerog', price: 250, color: '#c77dff', glow: '#f3d9ff', speed: 1040 },
    { id: 'lightning', price: 300, color: '#ffd60a', glow: '#fff3b0', speed: 1100 },
    { id: 'ghost', price: 360, color: '#e9ecef', glow: '#ffffff', speed: 1040 },
    { id: 'clones', price: 420, color: '#2a9df4', glow: '#a2d2ff', speed: 1040 },
    { id: 'confusion', price: 500, color: '#9d4edd', glow: '#e0aaff', speed: 1040 },
    { id: 'tornado', price: 550, color: '#90a4ae', glow: '#eceff1', speed: 1000 },
    { id: 'snail', price: 600, color: '#8d6e63', glow: '#d7ccc8', speed: 1040 },
    { id: 'magnet', price: 650, color: '#e63946', glow: '#a8dadc', speed: 1040 },
    { id: 'ink', price: 700, color: '#212529', glow: '#6c757d', speed: 1040 },
    { id: 'wind', price: 760, color: '#4dd0e1', glow: '#e0f7fa', speed: 1040 },
    { id: 'balloon', price: 820, color: '#ff8fab', glow: '#ffe5ec', speed: 1040 },
    { id: 'boomerang', price: 880, color: '#f4a261', glow: '#ffe8d6', speed: 1060 },
    { id: 'teleport', price: 940, color: '#00f5d4', glow: '#c8fff4', speed: 1040 },
    { id: 'bomb', price: 1000, color: '#343a40', glow: '#ff6b35', speed: 1040 },
    { id: 'quake', price: 1100, color: '#7f5539', glow: '#ddb892', speed: 1040 },
  ];
  const SUPER = id => SUPERS.find(s => s.id === id);
  // TEMPORARY for playtesting: everything in the shop costs 0. Prices above are kept;
  // set this back to false to restore them.
  const FREE_SHOP = true;
  const VENUES = ['beach', 'gym', 'rooftop', 'snow', 'jungle', 'volcano'];
  const NICKS = ['Wave', 'Lime', 'Coral', 'Tank', 'Frost', 'Volt', 'Shadow', 'Ace', 'Blaze', 'Storm', 'Pixel', 'Rocket',
    'Nova', 'Bolt', 'Kiwi', 'Mango', 'Turbo', 'Ziggy', 'Sunny', 'Echo'];
  const BOSSES = ['Magma King', 'Obsidian', 'Inferno', 'Eclipse', 'Dark Ace'];
  const BOSS_SUPERS = [4, 13, 18, 9, 19];          // ice, ink, bomb, confusion, earthquake
  const WORLD_VENUES = ['beach', 'jungle', 'snow', 'rooftop', 'gym'];
  const TOUR_SIZE = 8, CAREER_LEVELS = 50;

  function rng(seed) { // mulberry32
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let x = Math.imul(a ^ (a >>> 15), 1 | a);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  // Rivals are called by their skin's name; bosses keep their title.
  const rivalName = r => (r.boss ? '☠ ' + r.nick : CHARS[r.char].name);

  // A fresh tournament: 8 random rivals, each one tougher and with a stronger super.
  function newTourRun() {
    const r = rng((Math.random() * 1e9) | 0);
    const nicks = NICKS.slice().sort(() => r() - 0.5);
    const rivals = [];
    for (let i = 0; i < TOUR_SIZE; i++) {
      const lo = Math.max(0, Math.floor(i * 2.4) - 2), hi = Math.min(SUPERS.length - 1, Math.floor(i * 2.4) + 2);
      rivals.push({
        nick: nicks[i], char: Math.floor(r() * CHARS.length),
        venue: pick(r, VENUES.slice(0, 5)), super: lo + Math.floor(r() * (hi - lo + 1)), ai: i + 1,
      });
    }
    return { rivals, round: 0 };
  }

  // Career levels are fixed (seeded by level number); every 10th is a boss on the volcano.
  function careerRival(level) {
    const r = rng(level * 7919 + 13);
    const world = Math.floor((level - 1) / 10);
    if (level % 10 === 0) {
      return { nick: BOSSES[world], char: Math.floor(r() * CHARS.length), venue: 'volcano', super: BOSS_SUPERS[world],
        ai: Math.min(9.5, 3.2 + world * 1.6), boss: true };
    }
    const cap = Math.min(SUPERS.length - 1, Math.floor(level / 2.5));
    return {
      nick: pick(r, NICKS), char: Math.floor(r() * CHARS.length), venue: WORLD_VENUES[world],
      super: Math.max(0, cap - 4) + Math.floor(r() * (Math.min(cap, 4) + 1)), ai: 1 + (level - 1) * 7 / 49,
    };
  }

  // ---------- Save ----------
  const save = { coins: 0, chars: [0], balls: [0], supers: [0], char: 0, ball: 0, superSel: 0, muted: false,
    tourRun: null, career: 1, cstars: {} };
  function loadSave() {
    try {
      const raw = Platform.load(SAVE_KEY);
      if (raw) Object.assign(save, JSON.parse(raw));
    } catch (e) { /* corrupt save: start fresh */ }
    if (!Array.isArray(save.supers) || !save.supers.includes(0)) save.supers = [0].concat(save.supers || []);
    if (!save.supers.includes(save.superSel)) save.superSel = 0;
    if (!save.chars.includes(save.char)) save.char = 0;
    if (!save.balls.includes(save.ball)) save.ball = 0;
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
      effect: () => { tone(900, 0.25, 'square', 0.12, 150); tone(220, 0.3, 'triangle', 0.2, 440); },
      jump: () => tone(420, 0.08, 'sine', 0.12, 620),
      point: () => { tone(660, 0.12, 'triangle', 0.2); setTimeout(() => tone(880, 0.16, 'triangle', 0.2), 110); },
      lose: () => tone(300, 0.3, 'triangle', 0.2, 120),
      win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'triangle', 0.22), i * 120)),
      click: () => tone(700, 0.05, 'sine', 0.12),
      count: go => tone(go ? 1046 : 523, go ? 0.3 : 0.15, 'square', 0.12),
    };
  })();

  // ---------- Canvas & layout ----------
  const stage = document.getElementById('stage');
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  function fit() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const scale = Math.min(vw / W, vh / H);
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
  window.addEventListener('resize', () => { fit(); if (careerOpen) sizeMap(); });

  // ---------- Input ----------
  const input = [{ left: false, right: false, jump: false }, { left: false, right: false, jump: false }];
  const keys = new Set();
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const GAME_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyA', 'KeyD', 'KeyW'];
  window.addEventListener('keydown', e => {
    if (GAME_KEYS.includes(e.code)) e.preventDefault();
    keys.add(e.code);
    if ((e.code === 'Escape' || e.code === 'KeyP') && (state === 'playing' || state === 'countdown')) pauseGame();
    Sound.unlock();
  });
  window.addEventListener('keyup', e => keys.delete(e.code));
  window.addEventListener('blur', () => { keys.clear(); if (state === 'playing') pauseGame(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'playing') pauseGame(); });

  const touchHeld = new Map(); // pointerId -> [player, key, button]
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
    if (mode === 'duo') {
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
  let kind = 'tour';       // tour | career | duo
  let rival = null;        // the AI opponent of a solo match
  let careerLevel = 1;
  let venue = 'beach';
  let players = [], ball = null, fakes = [], particles = [];
  let score = [0, 0];
  let server = 0;
  let pointTimer = 0, banner = '', bannerTimer = 0, bannerColor = '#ffb627';
  let shake = 0, time = 0;
  let adPlaying = false;
  let lastResult = null;

  function freshFx() {
    return { confused: false, frozen: 0, stunned: 0, float: false, shrink: false, sticky: false,
      slow: false, ink: 0, wind: false, balloon: false, knock: 0 };
  }

  function makePlayer(side, charIdx, isAI, level, superIdx) {
    return {
      side, x: side === 0 ? 200 : 760, y: GROUND, vx: 0, vy: 0, onGround: true,
      char: CHARS[charIdx], dark: false, isAI, level: level || 1,
      superId: SUPERS[superIdx || 0].id,
      power: 0, hitCooldown: 0, squash: 0, r: PR, baseR: PR, boss: false, powerMul: 1, fx: freshFx(),
      ai: { target: side === 0 ? 200 : 760, think: 0, jumpPlan: null, err: 0, follow: null },
    };
  }

  function resetRally() {
    ball = { x: server === 0 ? 200 : 760, y: 170, vx: 0, vy: 0, spin: 0, angle: 0, trail: [], lastTouch: -1,
      super: null, superOwner: -1, superTime: 0, zig: 0, crossed: false, flight: 0, serveLock: server };
    fakes = [];
    for (const p of players) {
      p.x = p.side === 0 ? 200 : 760; p.y = GROUND; p.vx = p.vy = 0; p.onGround = true; p.hitCooldown = 0;
      p.ai.jumpPlan = null; p.ai.err = 0; p.ai.follow = null;
      p.fx = freshFx(); p.r = p.baseR;
    }
    if (players[server].isAI) players[server].x += 10; // AI serves with a slight forward push
    showBanner(t('serve'), 0.8);
  }

  function startMatch(newKind, level) {
    careerOpen = false;
    kind = newKind;
    mode = kind === 'duo' ? 'duo' : 'solo';
    score = [0, 0];
    server = 0;
    particles = [];
    if (mode === 'solo') {
      if (kind === 'career') { careerLevel = level; rival = careerRival(level); }
      else rival = save.tourRun.rivals[save.tourRun.round];
      venue = rival.venue;
      players = [makePlayer(0, save.char, false, 1, save.superSel), makePlayer(1, rival.char, true, rival.ai, rival.super)];
      const opp = players[1];
      opp.dark = !!rival.boss || rival.char === save.char;
      if (rival.boss) { opp.boss = true; opp.baseR = PR * 1.15; opp.powerMul = 1.5; }
    } else {
      venue = VENUES[Math.floor(Math.random() * VENUES.length)];
      const other = save.char === 1 ? 0 : 1;
      players = [makePlayer(0, save.char, false, 1, save.superSel), makePlayer(1, other, false, 1, save.superSel)];
    }
    resetRally();
    showScreen(null);
    const touch = document.getElementById('touch');
    touch.classList.toggle('hidden', !isTouch);
    touch.classList.toggle('solo', mode === 'solo');
    touch.classList.toggle('duo', mode === 'duo');
    document.getElementById('hud').classList.remove('hidden');
    startCountdown('playing');
    Platform.gameplayStart();
  }

  // 3, 2, 1 before a match starts and after resuming from pause.
  let countdown = 0, countdownTo = 'playing';
  function startCountdown(next) {
    countdownTo = next; countdown = 3; state = 'countdown';
    bannerTimer = 0; Sound.count(false);
  }

  function showBanner(text, dur, color) { banner = text; bannerTimer = dur; bannerColor = color || '#ffb627'; }

  // ---------- Physics ----------
  function updatePlayer(p, inp, dt) {
    const fx = p.fx;
    fx.frozen = Math.max(0, fx.frozen - dt);
    fx.stunned = Math.max(0, fx.stunned - dt);
    fx.ink = Math.max(0, fx.ink - dt);
    const locked = fx.frozen > 0 || fx.stunned > 0;
    let dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (fx.confused) dir = -dir;
    if (locked) dir = 0;
    let speed = p.isAI ? P_SPEED * aiSpeed(p) : P_SPEED;
    if (fx.slow) speed *= 0.5;
    if (fx.balloon) speed *= 0.75;
    p.vx = dir * speed;
    if (fx.wind) p.vx += (p.side === 0 ? -1 : 1) * 170;   // blown towards the back wall
    if (fx.knock) { p.vx += fx.knock; fx.knock *= Math.pow(0.02, dt); if (Math.abs(fx.knock) < 20) fx.knock = 0; }
    const canJump = !locked && !fx.sticky;
    if (inp.jump && p.onGround && canJump) {
      p.vy = fx.float ? -P_JUMP * 0.75 : fx.balloon ? -P_JUMP * 0.6 : -P_JUMP;
      p.onGround = false; Sound.jump();
    }
    p.vy += P_GRAV * (fx.float ? 0.28 : 1) * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.y < 150) { p.y = 150; p.vy = Math.max(p.vy, 0); }
    const floor = fx.float ? GROUND - 26 - Math.sin(time * 3 + p.side * 2) * 8 : GROUND;
    if (p.y >= floor) {
      if (fx.float) { p.y = Math.max(floor, p.y - 90 * dt); }      // rise slowly and hover, bobbing
      else { if (!p.onGround && p.vy > 300) p.squash = 0.18; p.y = GROUND; }
      p.vy = 0; p.onGround = true;
    }
    const target = fx.shrink ? p.baseR * 0.6 : fx.balloon ? p.baseR * 1.3 : p.baseR;
    p.r += (target - p.r) * Math.min(1, dt * 10);
    const minX = p.side === 0 ? p.r : NET_X + NET_HALF + p.r;
    const maxX = p.side === 0 ? NET_X - NET_HALF - p.r : W - p.r;
    p.x = Math.max(minX, Math.min(maxX, p.x));
    p.hitCooldown = Math.max(0, p.hitCooldown - dt);
    p.squash = Math.max(0, p.squash - dt);
  }

  function clampBall(b) {
    const sp = Math.hypot(b.vx, b.vy);
    const max = b.super ? B_MAX * 1.25 : B_MAX;
    if (sp > max) { b.vx *= max / sp; b.vy *= max / sp; }
  }

  // Direction from the ball that clears the net and lands on the opponent's side.
  function spikeDirection(p, b) {
    const towards = p.side === 0 ? 1 : -1;
    const clearY = NET_TOP - BR - 14;
    const nearNet = Math.abs(p.x - NET_X) < 190;
    let tx, ty;
    if (nearNet && b.y < NET_TOP - 30) {
      tx = NET_X + towards * 230; ty = GROUND;
      const k = (NET_X - b.x) / (tx - b.x);
      const yAtNet = b.y + (ty - b.y) * k;
      if (k > 0 && k < 1 && yAtNet < clearY) return norm(tx - b.x, ty - b.y);
    }
    tx = NET_X; ty = clearY - 30;
    if ((tx - b.x) * towards <= 10) return norm(towards, -0.6);
    const d = norm(tx - b.x, ty - b.y);
    if (d.y > -0.15) d.y = -0.15;
    return norm(d.x, d.y);
  }
  function norm(x, y) { const l = Math.hypot(x, y) || 1; return { x: x / l, y: y / l }; }

  // Applies the effect of a super ball to the player who touched it.
  function applySuperEffect(p, id) {
    const fx = p.fx;
    const s = SUPER(id);
    let key = null;
    if (id === 'confusion') { fx.confused = true; key = 'e_confusion'; }
    else if (id === 'ice') { fx.frozen = 2; key = 'e_ice'; burst(p.x, p.y - 20, 18, ['#caf0f8', '#48cae4', '#ffffff']); }
    else if (id === 'lightning') { fx.stunned = 1; key = 'e_lightning'; burst(p.x, p.y - 20, 16, ['#ffd60a', '#ffffff']); }
    else if (id === 'zerog') { fx.float = true; key = 'e_zerog'; }
    else if (id === 'shrink') { fx.shrink = true; key = 'e_shrink'; }
    else if (id === 'sticky') { fx.sticky = true; key = 'e_sticky'; }
    else if (id === 'heavy') { key = 'e_heavy'; }
    else if (id === 'snail') { fx.slow = true; key = 'e_snail'; }
    else if (id === 'ink') { fx.ink = 3; key = 'e_ink'; burst(p.x, p.y - 30, 20, ['#212529', '#343a40']); }
    else if (id === 'wind') { fx.wind = true; key = 'e_wind'; }
    else if (id === 'balloon') { fx.balloon = true; key = 'e_balloon'; }
    else if (id === 'bomb') {
      fx.knock = (p.side === 0 ? -1 : 1) * 900; fx.stunned = 0.5; key = 'e_bomb'; shake = 0.4;
      burst(ball.x, ball.y, 34, ['#ff6b35', '#ffd60a', '#343a40', '#ffffff']);
    } else if (id === 'quake') {
      p.vy = -1000; p.onGround = false; fx.stunned = 0.9; key = 'e_quake'; shake = 0.5;
      sand(p.x);
    }
    if (key) { showBanner(t(key), 1.1, s.color); Sound.effect(); }
    return id === 'heavy';
  }

  function collidePlayer(p) {
    const dx = ball.x - p.x, dy = ball.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist >= p.r + BR || dist === 0 || p.hitCooldown > 0) return;
    const nx = dx / dist, ny = dy / dist;
    ball.x = p.x + nx * (p.r + BR + 0.5);
    ball.y = p.y + ny * (p.r + BR + 0.5);
    p.hitCooldown = 0.08;

    // a super from the other side hits this player first
    let weak = false;
    if (ball.super && ball.superOwner !== p.side) {
      weak = applySuperEffect(p, ball.super);
      endSuper();
    }

    const towards = p.side === 0 ? 1 : -1;
    const onOwnSide = (ball.x - NET_X) * towards < 0;
    const canSpike = !weak && !p.onGround && ny < -0.25 && nx * towards > -0.55 && onOwnSide;

    if (canSpike) {
      const isSuper = p.power >= 1;
      const d = spikeDirection(p, ball);
      if (isSuper) {
        const s = SUPER(p.superId);
        ball.vx = d.x * s.speed; ball.vy = d.y * s.speed;
        startSuper(p, s);
      } else {
        ball.vx = d.x * 820; ball.vy = d.y * 820;
        if (ball.serveLock !== p.side) p.power = Math.min(1, p.power + 0.06 * p.powerMul);
        shake = 0.12; Sound.spike();
        burst(ball.x, ball.y, 12, ['#ffffff', '#ffd23f']);
      }
    } else {
      // reflect relative velocity, keep a minimum pop so rallies stay lively
      let rvx = ball.vx - p.vx, rvy = ball.vy - p.vy;
      const vn = rvx * nx + rvy * ny;
      if (vn < 0) { rvx -= 1.85 * vn * nx; rvy -= 1.85 * vn * ny; }
      ball.vx = rvx + p.vx * 0.6; ball.vy = rvy + Math.min(0, p.vy) * 0.4;
      const minHit = weak ? B_MIN_HIT * 0.45 : B_MIN_HIT;
      const out = ball.vx * nx + ball.vy * ny;
      if (out < minHit) { ball.vx += nx * (minHit - out); ball.vy += ny * (minHit - out); }
      if (weak) { ball.vx *= 0.45; ball.vy *= 0.45; }
      else if (ball.vy > -260 && ny < 0) ball.vy = Math.min(ball.vy, -420);
      if (ball.serveLock !== p.side) p.power = Math.min(1, p.power + 0.1 * p.powerMul);
      Sound.hit();
      burst(ball.x - nx * BR, ball.y - ny * BR, 5, ['#ffffff']);
    }
    if (p.side !== ball.serveLock) ball.serveLock = -1;
    ball.spin = ball.vx / 40;
    ball.lastTouch = p.side;
    p.squash = 0.12;
    clampBall(ball);
  }

  function startSuper(p, s) {
    p.power = 0; shake = 0.35; Sound.superSpike();
    ball.super = s.id; ball.superOwner = p.side; ball.superTime = 3; ball.zig = 0;
    ball.crossed = false; ball.flight = 0; ball.teleported = false; ball.turned = false; ball.returned = false;
    burst(ball.x, ball.y, 26, [s.color, s.glow, '#ffffff']);
    fakes = [];
    if (s.id === 'clones') {
      for (const a of [-0.16, 0.13]) {
        const c = Math.cos(a), sn = Math.sin(a);
        fakes.push({ x: ball.x, y: ball.y, vx: ball.vx * c - ball.vy * sn, vy: ball.vx * sn + ball.vy * c,
          angle: 0, spin: ball.spin, fake: true });
      }
      // weaker AIs often chase a fake
      for (const q of players) {
        if (q.isAI && q.side !== p.side && Math.random() < 0.6 - q.level * 0.06) q.ai.follow = fakes[Math.random() < 0.5 ? 0 : 1];
      }
    }
  }
  function endSuper() { ball.super = null; ball.superOwner = -1; ball.superTime = 0; }

  function collideNet(b) {
    const left = NET_X - NET_HALF, right = NET_X + NET_HALF;
    const cx = Math.max(left, Math.min(right, b.x));
    const cy = Math.max(NET_TOP, Math.min(GROUND, b.y));
    let dx = b.x - cx, dy = b.y - cy;
    const d = Math.hypot(dx, dy);
    if (d >= BR) return false;
    if (d === 0) { dx = b.vx > 0 ? -1 : 1; dy = 0; } else { dx /= d; dy /= d; }
    b.x = cx + dx * (BR + 0.5);
    b.y = cy + dy * (BR + 0.5);
    const vn = b.vx * dx + b.vy * dy;
    if (vn < 0) { b.vx -= 1.6 * vn * dx; b.vy -= 1.6 * vn * dy; }
    b.vx *= 0.85;
    return true;
  }

  function stepBall(b, dt, withNet, gravMul) {
    b.vy += B_GRAV * (gravMul || 1) * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x < BR) { b.x = BR; b.vx = Math.abs(b.vx) * 0.85; }
    if (b.x > W - BR) { b.x = W - BR; b.vx = -Math.abs(b.vx) * 0.85; }
    if (withNet && b.y > NET_TOP - BR && Math.abs(b.x - NET_X) < NET_HALF + BR) {
      b.vx = -b.vx * 0.85; b.x = NET_X + Math.sign(b.x - NET_X || -b.vx) * (NET_HALF + BR + 0.5);
    }
  }

  // Flight behaviour of super balls.
  function updateBallSuper(dt) {
    if (!ball.super) return 1;
    if (ball.super === 'lightning' && !ball.returned) {
      ball.zig -= dt;
      if (ball.zig <= 0) {
        ball.zig = 0.11;
        const side = Math.random() < 0.5 ? -1 : 1;
        ball.vx += side * 300;
        ball.vy += 120;
        if (Math.random() < 0.6) burst(ball.x, ball.y, 3, ['#ffd60a', '#ffffff']);
      }
    }
    const towards = ball.superOwner === 0 ? 1 : -1;
    const past = (ball.x - NET_X) * towards > 0;     // on the receiving side
    if (past && !ball.crossed) { ball.crossed = true; ball.flight = 0; }
    if (ball.crossed && !past) ball.returned = true;   // came back over the net: stop flight tricks
    if (ball.crossed) ball.flight += dt;
    if (ball.returned) return 1;
    const rec = players[1 - ball.superOwner];
    if (ball.super === 'tornado') {
      ball.vx += Math.sin(time * 16) * 2600 * dt;
      ball.vy += Math.cos(time * 16) * 1800 * dt;
      if (Math.random() < dt * 30) particles.push({ x: ball.x, y: ball.y, vx: Math.sin(time * 16) * 200, vy: -100,
        life: 0.4, max: 0.4, color: '#cfd8dc', r: 3 });
    } else if (ball.super === 'magnet' && past && rec) {
      ball.vx += Math.sign(ball.x - rec.x || towards) * 1500 * dt;
    } else if (ball.super === 'teleport' && ball.crossed && ball.flight > 0.12 && !ball.teleported) {
      ball.teleported = true;
      burst(ball.x, ball.y, 16, ['#00f5d4', '#ffffff']);
      const far = rec && Math.abs(rec.x - NET_X) > 240 ? NET_X + towards * 110 : NET_X + towards * 380;
      ball.x = far; ball.y = Math.min(ball.y, 220); ball.vx = towards * 120; ball.vy = 150;
      burst(ball.x, ball.y, 16, ['#00f5d4', '#ffffff']);
    } else if (ball.super === 'boomerang' && ball.crossed && !ball.turned && (ball.flight > 0.35 || Math.abs(ball.x - NET_X) > 360)) {
      ball.turned = true;
      ball.vx = -towards * Math.max(360, Math.abs(ball.vx) * 0.8);
      ball.vy = Math.min(ball.vy, 100);
      burst(ball.x, ball.y, 10, ['#f4a261', '#ffe8d6']);
    }
    if (ball.super === 'heavy') return 2.2;
    return 1;
  }

  // ---------- AI ----------
  // Rival 1 is gentle; each rival moves faster, misjudges less and spikes more.
  function aiSpeed(p) { return Math.min(1.05, 0.56 + p.level * 0.06); }

  function predictLanding(src, hitY) {
    const b = { x: src.x, y: src.y, vx: src.vx, vy: src.vy };
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
    if (ai.follow && !fakes.includes(ai.follow)) ai.follow = null;
    const tracked = ai.follow || ball;
    ai.think -= dt;
    if (ai.think <= 0) {
      ai.think = Math.max(0.03, 0.24 - p.level * 0.025);
      const coming = ownSide(tracked.x) || tracked.vx * towards < 0;
      if (coming) {
        const land = predictLanding(tracked, GROUND - p.r - 10);
        const ghost = (ball.super === 'ghost' && ball.superOwner !== p.side) || p.fx.ink > 0;
        if (Math.random() < 0.15 || ghost) ai.err = (Math.random() - 0.5) * Math.max(8, 90 - p.level * 10) * (ghost ? 2 : 1);
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
      if (ai.jumpPlan === null) ai.jumpPlan = Math.random() < 0.08 + p.level * 0.11;
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
    const c = venue === 'snow' ? ['#ffffff', '#dfefff'] : venue === 'beach' ? ['#f4d58d', '#e6be6a']
      : venue === 'volcano' ? ['#ff8c1a', '#3a2a26'] : venue === 'jungle' ? ['#9c6644', '#52b788'] : ['#cccccc', '#999999'];
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

    if (state === 'countdown') {
      const before = Math.ceil(countdown);
      countdown -= dt;
      if (countdown <= 0) { state = countdownTo; showBanner(t('go'), 0.6); Sound.count(true); }
      else if (Math.ceil(countdown) !== before) Sound.count(false);
      return;
    }
    if (state === 'point') {
      pointTimer -= dt;
      if (ball) ball.vx *= 0.96;
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
    const grav = updateBallSuper(dt);
    stepBall(ball, dt, false, grav);
    if (collideNet(ball)) Sound.hit();
    for (const p of players) collidePlayer(p);
    ball.angle += ball.spin * dt;
    clampBall(ball);
    const skin = BALLS[save.ball];
    const sp = Math.hypot(ball.vx, ball.vy);
    if ((skin.type === 'lava' || skin.type === 'water' || skin.type === 'sun') && sp > 150 && Math.random() < dt * (sp / 40)) {
      particles.push(skin.type !== 'water'
        ? { x: ball.x, y: ball.y, vx: (Math.random() - 0.5) * 60, vy: -60 - Math.random() * 60, life: 0.5, max: 0.5,
            color: Math.random() < 0.5 ? '#ff8c1a' : '#ffe066', r: 1.5 + Math.random() * 2 }
        : { x: ball.x, y: ball.y, vx: (Math.random() - 0.5) * 80, vy: -20 - Math.random() * 60, life: 0.45, max: 0.45,
            color: Math.random() < 0.5 ? '#90e0ef' : '#ffffff', r: 1.5 + Math.random() * 2.5 });
    }
    if (ball.y < -600) ball.y = -600;

    // fake clones vanish when they touch anything
    for (const f of fakes) {
      stepBall(f, dt, false);
      f.angle += f.spin * dt;
      collideNet(f);
      for (const p of players) if (Math.hypot(f.x - p.x, f.y - p.y) < p.r + BR) f.dead = true;
      if (f.y + BR >= GROUND) f.dead = true;
      if (f.dead) burst(f.x, f.y, 10, ['#a2d2ff', '#ffffff']);
    }
    fakes = fakes.filter(f => !f.dead);

    if (ball.y + BR >= GROUND) {
      ball.y = GROUND - BR;
      const loser = ball.x < NET_X ? 0 : 1;
      const winner = 1 - loser;
      score[winner]++;
      server = winner;
      sand(ball.x);
      ball.vy = -Math.abs(ball.vy) * 0.35; ball.vx *= 0.5;
      endSuper();
      fakes = [];
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
    let note = '';
    if (kind === 'tour') {
      const run = save.tourRun;
      if (won) {
        coins = 25 + run.round * 8 + (score[1] === 0 ? 10 : 0);
        run.round++;
        if (run.round >= TOUR_SIZE) {
          coins += 150; note = t('tourPrize', { n: 150 });
          title = t('champion'); save.tourRun = null;
        } else title = t('youWin');
        Sound.win();
        Platform.happytime();
      } else {
        coins = 4 + score[0];
        title = t('youLose'); note = t('backToStart');
        save.tourRun = null;
      }
    } else if (kind === 'career') {
      if (won) {
        coins = 20 + careerLevel * 2 + (rival.boss ? 80 : 0);
        const stars = score[1] <= 2 ? 3 : score[1] <= 4 ? 2 : 1;
        save.cstars[careerLevel] = Math.max(save.cstars[careerLevel] || 0, stars);
        if (save.career === careerLevel) save.career = Math.min(CAREER_LEVELS + 1, careerLevel + 1);
        title = careerLevel === CAREER_LEVELS ? t('careerDone') : t('youWin');
        note = '★'.repeat(stars) + '☆'.repeat(3 - stars);
        Sound.win();
        Platform.happytime();
      } else {
        coins = 3 + score[0];
        title = t('youLose');
      }
    } else {
      coins = 5;
      title = won ? t('p1Wins') : t('p2Wins');
      Sound.win();
    }
    save.coins += coins;
    persist();
    lastResult = { won, coins, title, note };

    // A win in the tour offers an optional rewarded ad instead of a midgame ad,
    // so the two are never combined on the same transition.
    const offerReward = kind !== 'duo' && won;
    if (!offerReward) await runAd('midgame');
    showResult(offerReward);
  }

  async function runAd(type) {
    state = 'ad';
    const ok = await Platform.showAd(type, () => { adPlaying = true; });
    adPlaying = false;
    state = 'result';
    return ok;
  }

  function showResult(offerReward) {
    const r = lastResult;
    document.getElementById('resTitle').textContent = r.title;
    document.getElementById('resScore').textContent = score[0] + ' - ' + score[1];
    document.getElementById('resCoins').textContent = t('coinsEarned', { n: r.coins });
    document.getElementById('resNote').textContent = r.note || '';
    document.getElementById('rewardRow').classList.toggle('hidden', !offerReward);
    document.getElementById('btnDouble').textContent = t('double') + ' (+' + r.coins + ')';
    const next = document.getElementById('btnNext');
    if (kind === 'duo') next.textContent = t('rematch');
    else if (kind === 'career') next.textContent = r.won ? (careerLevel < CAREER_LEVELS ? t('nextLevel') : t('career')) : t('retry');
    else if (r.won && save.tourRun) next.textContent = t('next');
    else next.textContent = t('newTour');
    showScreen('result');
  }

  // ---------- Pause ----------
  let pausedFrom = 'playing';
  function pauseGame() {
    if (state !== 'playing' && state !== 'point' && state !== 'countdown') return;
    pausedFrom = state === 'countdown' ? countdownTo : state;
    state = 'paused';
    Platform.gameplayStop();
    showScreen('pause');
  }
  function resumeGame() {
    showScreen(null);
    keys.clear();
    startCountdown(pausedFrom);
    Platform.gameplayStart();
  }

  // ---------- Drawing ----------
  function drawBackground() {
    let g;
    if (venue === 'beach') {
      g = ctx.createLinearGradient(0, 0, 0, 330);
      g.addColorStop(0, '#3a9bdc'); g.addColorStop(0.7, '#8fd3f4'); g.addColorStop(1, '#fbe7c6');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, 330);
      // sun with a soft halo
      const sg = ctx.createRadialGradient(780, 110, 20, 780, 110, 130);
      sg.addColorStop(0, '#fff8d6'); sg.addColorStop(0.3, 'rgba(255,240,180,0.6)'); sg.addColorStop(1, 'rgba(255,240,180,0)');
      ctx.fillStyle = sg; ctx.fillRect(620, 0, 320, 260);
      ctx.fillStyle = '#fffbe6'; circle(780, 110, 38);
      cloud(130 + Math.sin(time * 0.1) * 20, 70); cloud(470 + Math.sin(time * 0.07) * 15, 120);
      // far island
      ctx.fillStyle = '#5f8f7a';
      ctx.beginPath(); ctx.moveTo(300, 330); ctx.quadraticCurveTo(360, 300, 420, 312); ctx.quadraticCurveTo(470, 300, 530, 330); ctx.fill();
      // sea: deep at the horizon, turquoise near the shore
      g = ctx.createLinearGradient(0, 330, 0, GROUND - 26);
      g.addColorStop(0, '#0a4d8c'); g.addColorStop(0.5, '#1683c7'); g.addColorStop(1, '#3fd0d4');
      ctx.fillStyle = g; ctx.fillRect(0, 330, W, GROUND - 26 - 330);
      // sun glitter on the water
      for (let i = 0; i < 26; i++) {
        const gx = 780 + Math.sin(i * 7.3) * (20 + i * 4), gy = 336 + i * 4;
        ctx.fillStyle = 'rgba(255,250,220,' + (0.25 + 0.6 * Math.abs(Math.sin(time * 3 + i))) + ')';
        ctx.fillRect(gx, gy, 10 + (i % 3) * 6, 2);
      }
      // wave lines drifting
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
      for (let r = 0; r < 5; r++) {
        const y = 350 + r * 18, off = (time * (12 + r * 6)) % 120;
        ctx.beginPath();
        for (let x = -120 + off; x < W; x += 120) { ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 15, y - 4, x + 30, y); }
        ctx.stroke();
      }
      // shore: wet sand and a foam line that washes in and out
      const wash = Math.sin(time * 1.4) * 6;
      ctx.fillStyle = '#d9b46c'; ctx.fillRect(0, GROUND - 26, W, 26);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.moveTo(0, GROUND - 28 + wash);
      for (let x = 0; x <= W; x += 30) ctx.quadraticCurveTo(x + 15, GROUND - 22 + wash + Math.sin(x * 0.05 + time * 2) * 3, x + 30, GROUND - 28 + wash);
      ctx.lineTo(W, GROUND - 34 + wash); ctx.lineTo(0, GROUND - 34 + wash); ctx.fill();
      palm(70, GROUND + 6, false); palm(890, GROUND + 6, true);
      // dry sand with grain, ripples and shells
      g = ctx.createLinearGradient(0, GROUND, 0, H);
      g.addColorStop(0, '#f6d88f'); g.addColorStop(1, '#e8bf6a');
      ctx.fillStyle = g; ctx.fillRect(0, GROUND, W, H - GROUND);
      for (let i = 0; i < 160; i++) {
        ctx.fillStyle = i % 3 ? 'rgba(160,110,40,0.25)' : 'rgba(255,255,255,0.35)';
        ctx.fillRect((i * 137.5) % W, GROUND + 4 + (i * 53.3) % (H - GROUND - 6), 2, 2);
      }
      ctx.strokeStyle = 'rgba(170,120,50,0.35)'; ctx.lineWidth = 2;
      for (let r = 0; r < 3; r++) {
        ctx.beginPath();
        for (let x = 0; x < W; x += 40) { const y = GROUND + 20 + r * 18; ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 20, y - 4, x + 40, y); }
        ctx.stroke();
      }
      for (const [sx, sy, col] of [[150, GROUND + 40, '#ffb4a2'], [610, GROUND + 52, '#fff1e6'], [820, GROUND + 30, '#ffcdb2']]) {
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(sx, sy, 7, Math.PI, 0); ctx.fill();
        ctx.strokeStyle = 'rgba(150,90,60,0.6)'; ctx.lineWidth = 1;
        ctx.beginPath(); for (let k = -2; k <= 2; k++) { ctx.moveTo(sx, sy); ctx.lineTo(sx + k * 3, sy - 6); } ctx.stroke();
      }
    } else if (venue === 'gym') { // industrial warehouse
      g = ctx.createLinearGradient(0, 0, 0, GROUND);
      g.addColorStop(0, '#2b2d33'); g.addColorStop(1, '#4b4f58');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, GROUND);
      // corrugated metal wall
      for (let x = 0; x < W; x += 16) { ctx.fillStyle = (x / 16) % 2 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.12)'; ctx.fillRect(x, 90, 8, GROUND - 90); }
      // high windows letting light in
      for (let i = 0; i < 4; i++) {
        const wx = 90 + i * 230;
        ctx.fillStyle = '#9ec5e8'; ctx.fillRect(wx, 110, 130, 60);
        ctx.strokeStyle = '#1f2125'; ctx.lineWidth = 4; ctx.strokeRect(wx, 110, 130, 60);
        ctx.beginPath(); ctx.moveTo(wx + 65, 110); ctx.lineTo(wx + 65, 170); ctx.moveTo(wx, 140); ctx.lineTo(wx + 130, 140); ctx.stroke();
        ctx.fillStyle = 'rgba(200,225,255,0.07)';
        ctx.beginPath(); ctx.moveTo(wx, 170); ctx.lineTo(wx + 130, 170); ctx.lineTo(wx + 190, GROUND); ctx.lineTo(wx + 40, GROUND); ctx.fill();
      }
      // steel roof truss
      ctx.strokeStyle = '#6c757d'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(W, 30); ctx.moveTo(0, 82); ctx.lineTo(W, 82); ctx.stroke();
      ctx.lineWidth = 3; ctx.beginPath();
      for (let x = 0; x < W; x += 60) { ctx.moveTo(x, 30); ctx.lineTo(x + 30, 82); ctx.lineTo(x + 60, 30); }
      ctx.stroke();
      // hanging lamps with light cones
      for (let i = 0; i < 3; i++) {
        const lx = 180 + i * 300;
        ctx.strokeStyle = '#1f2125'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, 82); ctx.lineTo(lx, 190); ctx.stroke();
        ctx.fillStyle = '#343a40'; ctx.beginPath(); ctx.moveTo(lx - 26, 210); ctx.lineTo(lx - 10, 190); ctx.lineTo(lx + 10, 190); ctx.lineTo(lx + 26, 210); ctx.fill();
        const lg = ctx.createLinearGradient(0, 210, 0, GROUND);
        lg.addColorStop(0, 'rgba(255,220,140,0.28)'); lg.addColorStop(1, 'rgba(255,220,140,0)');
        ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(lx - 24, 210); ctx.lineTo(lx + 24, 210); ctx.lineTo(lx + 120, GROUND); ctx.lineTo(lx - 120, GROUND); ctx.fill();
        ctx.fillStyle = '#ffe8a3'; circle(lx, 211, 6);
      }
      // stacked crates, pallets and a barrel
      const crate = (cx, cy, w) => {
        ctx.fillStyle = '#b07a3a'; ctx.fillRect(cx, cy, w, w);
        ctx.strokeStyle = '#7a4f22'; ctx.lineWidth = 4; ctx.strokeRect(cx + 2, cy + 2, w - 4, w - 4);
        ctx.beginPath(); ctx.moveTo(cx + 4, cy + 4); ctx.lineTo(cx + w - 4, cy + w - 4); ctx.stroke();
      };
      crate(14, GROUND - 70, 70); crate(84, GROUND - 56, 56); crate(28, GROUND - 130, 60);
      crate(W - 90, GROUND - 76, 76); crate(W - 150, GROUND - 52, 52);
      ctx.fillStyle = '#c1121f'; ctx.fillRect(W - 210, GROUND - 64, 44, 64);
      ctx.fillStyle = '#780000'; ctx.fillRect(W - 210, GROUND - 48, 44, 5); ctx.fillRect(W - 210, GROUND - 20, 44, 5);
      ctx.fillStyle = '#ffd60a'; ctx.font = '900 14px "Trebuchet MS",sans-serif'; ctx.textAlign = 'center'; ctx.fillText('⚠', W - 188, GROUND - 28);
      // hazard stripe along the wall base
      for (let x = 0; x < W; x += 24) { ctx.fillStyle = (x / 24) % 2 ? '#1b1b1b' : '#ffb627'; ctx.fillRect(x, GROUND - 10, 24, 10); }
      // polished concrete floor with painted court lines
      g = ctx.createLinearGradient(0, GROUND, 0, H);
      g.addColorStop(0, '#8d9199'); g.addColorStop(1, '#5c6068');
      ctx.fillStyle = g; ctx.fillRect(0, GROUND, W, H - GROUND);
      for (let i = 0; i < 90; i++) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect((i * 151.7) % W, GROUND + 6 + (i * 41.3) % 60, 3, 2); }
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2;
      for (let x = 0; x < W; x += 160) { ctx.beginPath(); ctx.moveTo(x, GROUND); ctx.lineTo(x - 40, H); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(40, GROUND + 4, W - 80, 4);
      ctx.fillStyle = 'rgba(255,182,39,0.8)'; ctx.fillRect(NET_X - 170, GROUND + 4, 4, 30); ctx.fillRect(NET_X + 166, GROUND + 4, 4, 30);
    } else if (venue === 'rooftop') { // neon night city
      g = ctx.createLinearGradient(0, 0, 0, GROUND);
      g.addColorStop(0, '#07001a'); g.addColorStop(0.6, '#240046'); g.addColorStop(1, '#5a189a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, GROUND);
      ctx.fillStyle = '#ffffffaa'; for (let i = 0; i < 40; i++) ctx.fillRect((i * 131) % W, (i * 53) % 200, 2, 2);
      ctx.fillStyle = '#f8f9fa22'; circle(150, 80, 34); ctx.fillStyle = '#f1f3f5cc'; circle(150, 80, 26);
      // far skyline
      ctx.fillStyle = '#1a0038';
      for (let i = 0; i < 16; i++) { const bh = 150 + (i * 97) % 140; ctx.fillRect(i * 62 - 10, GROUND - bh, 56, bh); }
      // near buildings with neon edges and coloured windows
      const NEON = ['#ff2e88', '#00f0ff', '#ffe600', '#7cff4f', '#b14dff'];
      for (let i = 0; i < 10; i++) {
        const bw = 70 + (i * 37) % 40, bh = 120 + (i * 71) % 170, bx = i * 98 - 10;
        ctx.fillStyle = '#12002b'; ctx.fillRect(bx, GROUND - bh, bw, bh);
        const nc = NEON[i % NEON.length];
        const pulse = 0.35 + 0.25 * Math.sin(time * 1.6 + i * 1.3);
        ctx.strokeStyle = nc; ctx.globalAlpha = pulse; ctx.lineWidth = 2;
        ctx.strokeRect(bx + 1, GROUND - bh + 1, bw - 2, bh);
        ctx.globalAlpha = 1;
        for (let wy = GROUND - bh + 14; wy < GROUND - 20; wy += 22)
          for (let wx = bx + 9; wx < bx + bw - 9; wx += 16)
            if (((wx * 3 + wy) * 7) % 5 < 2) { ctx.fillStyle = ((wx + wy) % 3 ? '#ffd60a' : nc) + '66'; ctx.fillRect(wx, wy, 7, 9); }
      }
      // neon signs that breathe (and one that flickers)
      const signs = [[70, 250, 'BAR', '#ff2e88'], [300, 205, 'PIZZA', '#ffe600'], [520, 238, 'HOTEL', '#00f0ff'],
        [700, 190, '24H', '#7cff4f'], [850, 260, '★ SPIKE ★', '#b14dff']];
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '900 18px "Trebuchet MS",sans-serif';
      signs.forEach(([sx, sy, txt, col], i) => {
        let a = 0.55 + 0.35 * Math.sin(time * (1.2 + i * 0.35) + i);
        if (i === 2 && Math.sin(time * 23) > 0.93) a = 0.15;          // the faulty one
        const w = ctx.measureText(txt).width + 22;
        ctx.globalAlpha = a;
        ctx.shadowColor = col; ctx.shadowBlur = 14;
        ctx.strokeStyle = col; ctx.lineWidth = 2.5; roundRect(sx - w / 2, sy - 15, w, 30, 8); ctx.stroke();
        ctx.fillStyle = col; ctx.fillText(txt, sx, sy + 1);
      });
      ctx.restore();
      // rooftop floor with a ledge and puddle reflections
      ctx.fillStyle = '#2b2d42'; ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = '#3d405b'; ctx.fillRect(0, GROUND, W, 8);
      for (let i = 0; i < 5; i++) {
        const col = NEON[i % NEON.length];
        ctx.globalAlpha = 0.18 + 0.1 * Math.sin(time * 1.6 + i);
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(90 + i * 200, GROUND + 38, 50, 6, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffb627'; ctx.fillRect(0, GROUND + 8, W, 3);
    } else if (venue === 'jungle') {
      g = ctx.createLinearGradient(0, 0, 0, GROUND);
      g.addColorStop(0, '#1b4332'); g.addColorStop(0.6, '#40916c'); g.addColorStop(1, '#95d5b2');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, GROUND);
      // light shafts through the canopy
      ctx.fillStyle = '#fff3b022';
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(150 + i * 220, 0); ctx.lineTo(210 + i * 220, 0); ctx.lineTo(120 + i * 220, GROUND); ctx.lineTo(40 + i * 220, GROUND); ctx.fill(); }
      // trunks
      for (const [tx, tw, col] of [[40, 34, '#3e2a1e'], [250, 22, '#4a3424'], [700, 26, '#4a3424'], [890, 40, '#3e2a1e']]) {
        ctx.fillStyle = col; ctx.fillRect(tx, 40, tw, GROUND - 40);
      }
      // canopy
      for (let i = 0; i < 16; i++) {
        ctx.fillStyle = ['#081c15', '#1b4332', '#2d6a4f'][i % 3];
        circle((i * 67) % (W + 60) - 20, 20 + (i * 29) % 60, 60 + (i * 13) % 30);
      }
      // hanging vines with leaves
      ctx.strokeStyle = '#2d6a4f'; ctx.lineWidth = 4;
      for (let i = 0; i < 7; i++) {
        const vx = 90 + i * 135, len = 120 + (i * 53) % 140, sway = Math.sin(time * 1.2 + i) * 8;
        ctx.beginPath(); ctx.moveTo(vx, 60); ctx.quadraticCurveTo(vx + sway, 60 + len / 2, vx + sway * 1.5, 60 + len); ctx.stroke();
        ctx.fillStyle = '#52b788';
        for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.ellipse(vx + sway * k / 3 + 6, 60 + len * k / 4, 8, 4, 0.6, 0, Math.PI * 2); ctx.fill(); }
      }
      // ferns on the ground line
      ctx.fillStyle = '#2d6a4f';
      for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.ellipse(i * 85 + 20, GROUND - 6, 34, 12, (i % 2 ? 0.3 : -0.3), 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#40916c'; ctx.fillRect(0, GROUND, W, 10);
      ctx.fillStyle = '#7f5539'; ctx.fillRect(0, GROUND + 10, W, H - GROUND - 10);
      ctx.fillStyle = '#9c6644'; for (let i = 0; i < 30; i++) ctx.fillRect((i * 101) % W, GROUND + 22 + (i * 31) % 40, 6, 3);
    } else if (venue === 'volcano') {
      g = ctx.createLinearGradient(0, 0, 0, GROUND);
      g.addColorStop(0, '#120202'); g.addColorStop(0.55, '#4a0808'); g.addColorStop(1, '#c1440e');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, GROUND);
      // volcanoes with glowing craters and lava streams
      for (const [vx, vw, vh] of [[170, 260, 300], [780, 300, 340]]) {
        ctx.fillStyle = '#1f0b08';
        ctx.beginPath(); ctx.moveTo(vx - vw, GROUND); ctx.lineTo(vx - 34, GROUND - vh); ctx.lineTo(vx + 34, GROUND - vh); ctx.lineTo(vx + vw, GROUND); ctx.fill();
        const glow = 0.6 + Math.sin(time * 3 + vx) * 0.3;
        ctx.fillStyle = 'rgba(255,120,0,' + glow + ')';
        ctx.beginPath(); ctx.ellipse(vx, GROUND - vh, 36, 9, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ff6b00'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(vx - 10, GROUND - vh + 4); ctx.quadraticCurveTo(vx - 40, GROUND - vh / 2, vx - 70, GROUND - 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(vx + 14, GROUND - vh + 4); ctx.quadraticCurveTo(vx + 30, GROUND - vh / 2, vx + 90, GROUND - 30); ctx.stroke();
      }
      // floating embers
      for (let i = 0; i < 30; i++) {
        const ex = (i * 97 + Math.sin(time + i) * 20) % W, ey = GROUND - ((time * (30 + (i % 5) * 12) + i * 53) % GROUND);
        ctx.fillStyle = i % 2 ? '#ffb627' : '#ff6b35'; ctx.fillRect(ex, ey, 3, 3);
      }
      // lava river behind the court
      g = ctx.createLinearGradient(0, GROUND - 40, 0, GROUND);
      g.addColorStop(0, '#ffd60a'); g.addColorStop(1, '#e85d04');
      ctx.fillStyle = g; ctx.fillRect(0, GROUND - 34, W, 34);
      ctx.fillStyle = '#ff8c1a';
      for (let i = 0; i < 10; i++) ctx.fillRect(((i * 120 + time * 50) % (W + 80)) - 80, GROUND - 26 + (i % 2) * 10, 60, 4);
      // basalt floor with glowing cracks
      ctx.fillStyle = '#211a19'; ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.strokeStyle = 'rgba(255,110,0,' + (0.55 + Math.sin(time * 4) * 0.25) + ')'; ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 9; i++) { const cx = 40 + i * 110; ctx.moveTo(cx, GROUND + 4); ctx.lineTo(cx + 18, GROUND + 26); ctx.lineTo(cx + 6, GROUND + 48); ctx.moveTo(cx + 18, GROUND + 26); ctx.lineTo(cx + 46, GROUND + 34); }
      ctx.stroke();
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
    const sway = Math.sin(time * 0.9) * 0.04;
    // segmented, curved trunk
    const pts = [];
    for (let i = 0; i <= 12; i++) { const k = i / 12; pts.push([Math.sin(k * 1.6) * 46, -k * 250]); }
    for (let i = 0; i < 12; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      const w = 15 - i * 0.6;
      ctx.fillStyle = i % 2 ? '#8b5e3c' : '#a47148';
      ctx.beginPath(); ctx.moveTo(x1 - w, y1); ctx.lineTo(x2 - w + 1, y2); ctx.lineTo(x2 + w - 1, y2); ctx.lineTo(x1 + w, y1); ctx.fill();
      ctx.strokeStyle = 'rgba(60,35,20,0.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x2 - w + 1, y2); ctx.lineTo(x2 + w - 1, y2 + 3); ctx.stroke();
    }
    const [cx, cy] = pts[12];
    ctx.translate(cx, cy); ctx.rotate(sway);
    // fronds: arching leaves with leaflets on both sides
    const frond = (ang, len, col) => {
      ctx.save(); ctx.rotate(ang);
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, -len * 0.25, len, len * 0.25); ctx.stroke();
      for (let k = 1; k < 10; k++) {
        const tt = k / 10, px = len * tt, py = -len * 0.25 * 2 * tt * (1 - tt) * 2 + len * 0.25 * tt * tt;
        const l = 26 * (1 - tt * 0.6);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 6, py - l); ctx.lineTo(px + 10, py - l + 4); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 6, py + l); ctx.lineTo(px + 10, py + l - 4); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    };
    for (const [a, l, col] of [[-2.8, 120, '#1b5e20'], [-2.0, 130, '#2e7d32'], [-1.2, 125, '#2e7d32'], [-0.4, 135, '#1b5e20'],
      [0.3, 120, '#388e3c'], [-3.4, 110, '#388e3c'], [-1.6, 105, '#43a047']]) frond(a, l, col);
    // coconuts
    ctx.fillStyle = '#5d4037';
    for (const [dx, dy] of [[-8, 8], [6, 10], [-1, 16]]) { ctx.beginPath(); ctx.arc(dx, dy, 8, 0, Math.PI * 2); ctx.fill(); }
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
    const fx = p.fx || freshFx();
    const size = (p.r || PR) / PR;
    const sq = p.squash > 0 ? 1 - p.squash * 1.2 : 1;
    const stretch = !p.onGround ? 1.06 : 1;
    if (!cv) { // shadow
      const h = Math.max(0, GROUND - p.y);
      c.fillStyle = 'rgba(0,0,0,' + Math.max(0.08, 0.28 - h / 900) + ')';
      c.beginPath(); c.ellipse(x, GROUND + 2, PR * size * (1 - h / 700), 8, 0, 0, Math.PI * 2); c.fill();
      if (fx.sticky) { // bubblegum puddle at the feet
        c.fillStyle = '#f72585cc'; c.beginPath(); c.ellipse(x, GROUND + 1, PR * size * 1.1, 9, 0, 0, Math.PI * 2); c.fill();
      }
    }
    if (p.boss && !cv) { // dark flickering aura
      for (let i = 0; i < 7; i++) {
        const a = Math.PI + (i / 6) * Math.PI;
        const fl = 10 + Math.sin(time * 9 + i * 1.7) * 6;
        c.fillStyle = i % 2 ? 'rgba(20,0,0,0.45)' : 'rgba(120,0,0,0.35)';
        c.beginPath(); c.arc(x + Math.cos(a) * PR * size * 0.9, y + Math.sin(a) * PR * size * 0.9, fl, 0, Math.PI * 2); c.fill();
      }
    }
    c.save();
    c.translate(x, y);
    c.scale(sc * size / sq, sc * size * sq * stretch);
    if (p.boss) { // horns
      c.fillStyle = '#1b1b1b';
      c.beginPath(); c.moveTo(-26, -30); c.lineTo(-36, -62); c.lineTo(-12, -38); c.fill();
      c.beginPath(); c.moveTo(26, -30); c.lineTo(36, -62); c.lineTo(12, -38); c.fill();
    }
    if (!p.boss && ch.acc === 'crown') drawCape(c, p.side === 0 ? 1 : -1, !!cv);
    const body = p.boss ? '#1b1b1b' : p.dark ? shade(ch.body, -0.45) : ch.body;
    c.fillStyle = body;
    c.beginPath(); c.arc(0, 0, PR, Math.PI, 0); c.lineTo(PR, 0); c.closePath(); c.fill();
    c.lineWidth = 3; c.strokeStyle = '#1b1b1bcc'; c.stroke();
    c.fillStyle = '#ffffff33';
    c.beginPath(); c.ellipse(-14, -26, 10, 6, -0.5, 0, Math.PI * 2); c.fill();
    const facing = p.side === 0 ? 1 : -1;
    const acc = p.boss ? null : ch.acc;
    if (!acc) {
      c.fillStyle = ch.band;
      c.beginPath(); c.arc(0, 0, PR, Math.PI * 1.13, Math.PI * 1.87); c.arc(0, 0, PR - 9, Math.PI * 1.87, Math.PI * 1.13, true); c.fill();
    }
    if (acc) drawAccessoryBack(c, ch, acc, facing);
    // eyes follow the ball; spirals when confused, crosses when zapped
    const ex = 10 * facing, ey = -16;
    c.fillStyle = '#fff'; c.beginPath(); c.arc(ex, ey, 8, 0, Math.PI * 2); c.fill();
    if (fx.confused) {
      c.strokeStyle = '#9d4edd'; c.lineWidth = 2; c.beginPath();
      for (let a = 0; a < 12; a += 0.4) c.lineTo(ex + Math.cos(a + time * 8) * a * 0.55, ey + Math.sin(a + time * 8) * a * 0.55);
      c.stroke();
    } else if (fx.stunned > 0) {
      c.strokeStyle = '#1b1b1b'; c.lineWidth = 2.5; c.beginPath();
      c.moveTo(ex - 4, ey - 4); c.lineTo(ex + 4, ey + 4); c.moveTo(ex + 4, ey - 4); c.lineTo(ex - 4, ey + 4); c.stroke();
    } else {
      let lx = lookX - (x + ex * sc), ly = lookY - (y + ey * sc);
      const ll = Math.hypot(lx, ly) || 1; lx /= ll; ly /= ll;
      c.fillStyle = p.boss ? '#ff3b30' : '#1b1b1b'; c.beginPath(); c.arc(ex + lx * 4, ey + ly * 4, 4, 0, Math.PI * 2); c.fill();
    }
    if (acc) drawAccessoryFront(c, ch, acc, facing, ex, ey);
    c.restore();
    if (cv) return;

    // status effects on top
    const top = y - PR * size;
    if (fx.frozen > 0) {
      c.save();
      c.globalAlpha = 0.75;
      c.fillStyle = '#caf0f8';
      c.fillRect(x - PR * size - 8, top - 12, (PR * size + 8) * 2, PR * size + 12);
      c.globalAlpha = 1;
      c.strokeStyle = '#48cae4'; c.lineWidth = 3;
      c.strokeRect(x - PR * size - 8, top - 12, (PR * size + 8) * 2, PR * size + 12);
      c.strokeStyle = '#ffffffcc'; c.lineWidth = 2; c.beginPath();
      c.moveTo(x - PR * size, top - 4); c.lineTo(x - PR * size + 18, top + 10); c.stroke();
      c.restore();
    }
    if (fx.confused) {
      c.fillStyle = '#9d4edd'; c.font = '900 22px "Trebuchet MS",sans-serif'; c.textAlign = 'center';
      for (let i = 0; i < 3; i++) {
        const a = time * 4 + i * 2.1;
        c.fillText('?', x + Math.cos(a) * 30, top - 12 + Math.sin(a) * 8);
      }
    }
    if (fx.stunned > 0) {
      c.strokeStyle = '#ffd60a'; c.lineWidth = 3; c.beginPath();
      for (let i = 0; i < 3; i++) {
        const bx = x - 30 + i * 30 + Math.sin(time * 40 + i) * 4;
        c.moveTo(bx, top - 26); c.lineTo(bx + 6, top - 16); c.lineTo(bx - 2, top - 14); c.lineTo(bx + 4, top - 2);
      }
      c.stroke();
    }
    if (fx.wind) {
      c.strokeStyle = '#e0f7facc'; c.lineWidth = 3; c.lineCap = 'round';
      const back = p.side === 0 ? -1 : 1;
      for (let i = 0; i < 3; i++) {
        const ox = ((time * 300 + i * 40) % 80) * back;
        c.beginPath(); c.moveTo(x + ox - 30 * back, top + 6 + i * 14); c.lineTo(x + ox + 10 * back, top + 6 + i * 14); c.stroke();
      }
    }
    if (fx.slow) { // a little snail shell on the head
      c.fillStyle = '#d4a373'; c.beginPath(); c.arc(x, top - 6, 10, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#7f5539'; c.lineWidth = 2; c.beginPath();
      for (let a = 0; a < 10; a += 0.4) c.lineTo(x + Math.cos(a) * a * 0.9, top - 6 + Math.sin(a) * a * 0.9);
      c.stroke();
    }
    if (fx.float) { // soft sparkles drifting under the hovering player
      for (let i = 0; i < 4; i++) {
        const ph = (time * 0.8 + i * 0.25) % 1;
        c.fillStyle = 'rgba(199,125,255,' + (0.7 * (1 - ph)) + ')';
        c.beginPath(); c.arc(x + (i - 1.5) * 16, y + 4 + ph * 18, 3 - ph * 2, 0, Math.PI * 2); c.fill();
      }
    }
  }
  // Cosmetic extras, drawn in the player's local space (body = half circle of radius PR).
  // Back = drawn before the eye (so the eye shows on top); front = drawn over the eye.
  function drawAccessoryBack(c, ch, acc, f) {
    const col = ch.accColor || '#ffffff';
    if (acc === 'spikes') {
      c.fillStyle = col; c.strokeStyle = '#1b1b1bcc'; c.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * (1.12 + i * 0.12);
        const ang = f > 0 ? a : Math.PI * 3 - a;   // spikes along the back of the head
        const bx = Math.cos(ang) * PR, by = Math.sin(ang) * PR;
        const tx = Math.cos(ang) * (PR + 16), ty = Math.sin(ang) * (PR + 16);
        const nx = -Math.sin(ang) * 7, ny = Math.cos(ang) * 7;
        c.beginPath(); c.moveTo(bx + nx, by + ny); c.lineTo(tx, ty); c.lineTo(bx - nx, by - ny); c.closePath(); c.fill(); c.stroke();
      }
    } else if (acc === 'helmet') {
      // full-face motorbike helmet: glossy shell, spoiler, vents and a wide visor
      const shell = c.createLinearGradient(-PR, -PR, PR * 0.4, 0);
      shell.addColorStop(0, '#ff5a5f'); shell.addColorStop(0.5, ch.body); shell.addColorStop(1, '#6a040f');
      c.fillStyle = shell; c.strokeStyle = '#111'; c.lineWidth = 3;
      c.beginPath(); c.arc(0, 0, PR + 3, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
      // rear spoiler
      c.fillStyle = '#111';
      c.beginPath(); c.moveTo(-26 * f, -36); c.lineTo(-44 * f, -40); c.lineTo(-40 * f, -30); c.closePath(); c.fill();
      // graphic stripes sweeping back
      c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-36 * f, -12); c.quadraticCurveTo(-24 * f, -34, 4 * f, -42); c.stroke();
      c.strokeStyle = '#111'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-38 * f, -4); c.quadraticCurveTo(-24 * f, -28, 0, -36); c.stroke();
      // chin bar with vents
      c.fillStyle = '#111';
      c.beginPath(); c.moveTo(-4 * f, 0); c.lineTo(-4 * f, -6); c.quadraticCurveTo(20 * f, -6, (PR + 3) * f, -2); c.lineTo((PR + 3) * f, 0); c.closePath(); c.fill();
      c.fillStyle = '#495057'; for (let i = 0; i < 3; i++) c.fillRect((16 + i * 6) * f - 1.5, -5, 3, 3);
      // visor: smoked, iridescent glass; the eye shows through it
      const vg = c.createLinearGradient(0, -32, 0, -6);
      vg.addColorStop(0, 'rgba(90,24,154,0.55)'); vg.addColorStop(0.5, 'rgba(255,0,110,0.35)'); vg.addColorStop(1, 'rgba(255,190,11,0.45)');
      c.fillStyle = '#0b0b0f';
      c.beginPath(); c.moveTo(-4 * f, -8); c.quadraticCurveTo(-6 * f, -30, 18 * f, -32); c.quadraticCurveTo(36 * f, -28, (PR + 2) * f, -10); c.lineTo((PR + 2) * f, -8); c.closePath(); c.fill();
      c.fillStyle = vg; c.fill();
      c.strokeStyle = '#111'; c.lineWidth = 2.5; c.stroke();
      c.fillStyle = '#ffffff'; c.font = '900 11px "Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('07', -24 * f, -22);
    } else if (acc === 'tattoo') {
      // punk: purple-to-green mohawk, a small snake tattoo and piercings (front layer)
      const spikes = 7;
      for (let i = 0; i < spikes; i++) {
        const a = Math.PI * (1.18 + i * 0.105);
        const ang = f > 0 ? Math.PI * 3 - a : a;               // crest runs front to back over the top
        const bx = Math.cos(ang) * (PR - 4), by = Math.sin(ang) * (PR - 4);
        const len = 20 + Math.sin(i * 1.7) * 4;
        const tx = Math.cos(ang) * (PR + len), ty = Math.sin(ang) * (PR + len) + Math.sin(time * 6 + i) * 1.2;
        const nx = -Math.sin(ang) * 6, ny = Math.cos(ang) * 6;
        const gcr = c.createLinearGradient(bx, by, tx, ty);
        gcr.addColorStop(0, '#7b2cbf'); gcr.addColorStop(0.6, '#9d4edd'); gcr.addColorStop(1, '#70e000');
        c.fillStyle = gcr; c.strokeStyle = '#240046'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(bx + nx, by + ny); c.lineTo(tx, ty); c.lineTo(bx - nx, by - ny); c.closePath(); c.fill(); c.stroke();
      }
      // shaved sides
      c.fillStyle = 'rgba(60,40,30,0.25)';
      c.beginPath(); c.arc(0, 0, PR - 2, Math.PI * 1.05, Math.PI * 1.95); c.arc(0, 0, PR - 10, Math.PI * 1.95, Math.PI * 1.05, true); c.fill();
      // snake tattoo on the back of the head
      const P = [[-14, -28], [-30, -22], [-18, -14], [-32, -6], [-22, -1]].map(([x, y]) => [x * f, y]);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const path = () => { c.beginPath(); c.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) c.lineTo(P[i][0], P[i][1]); };
      c.strokeStyle = '#081c15'; c.lineWidth = 7; path(); c.stroke();
      c.strokeStyle = '#2d6a4f'; c.lineWidth = 4; path(); c.stroke();
      c.fillStyle = '#081c15'; c.beginPath(); c.ellipse(P[0][0] + 3 * f, P[0][1], 6, 4.5, 0.4 * f, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#e63946'; c.beginPath(); c.arc(P[0][0] + 5 * f, P[0][1] - 1, 1.3, 0, Math.PI * 2); c.fill();
    } else if (acc === 'shades') {
      // cyborg: riveted metal plating over the back of the head and an antenna
      c.fillStyle = '#adb5bd'; c.strokeStyle = '#343a40'; c.lineWidth = 2;
      c.beginPath(); c.arc(0, 0, PR, Math.PI * (f > 0 ? 1 : 1.5), Math.PI * (f > 0 ? 1.5 : 2)); c.lineTo(0, 0); c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = '#6c757d'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(-PR * 0.7 * f, -PR * 0.7); c.lineTo(-8 * f, -10); c.moveTo(-PR * f, -4); c.lineTo(-10 * f, -4); c.stroke();
      c.fillStyle = '#343a40';
      for (const [dx, dy] of [[-30, -10], [-20, -30], [-8, -36], [-32, -24]]) { c.beginPath(); c.arc(dx * f, dy, 1.8, 0, Math.PI * 2); c.fill(); }
      c.strokeStyle = '#343a40'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-14 * f, -38); c.lineTo(-18 * f, -56); c.stroke();
      c.fillStyle = 'rgba(255,31,61,' + (0.4 + 0.6 * Math.abs(Math.sin(time * 4))) + ')'; c.beginPath(); c.arc(-18 * f, -57, 3.5, 0, Math.PI * 2); c.fill();
    } else if (acc === 'ninja') {
      c.fillStyle = '#111111';
      c.fillRect(-PR + 3, -24, PR * 2 - 6, 14);
      c.fillStyle = ch.accColor;   // headband tails flapping behind
      c.beginPath(); c.moveTo(-34 * f, -22); c.lineTo(-56 * f, -30 + Math.sin(time * 12) * 4); c.lineTo(-52 * f, -20); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(-34 * f, -18); c.lineTo(-58 * f, -14 + Math.sin(time * 12 + 1) * 4); c.lineTo(-50 * f, -10); c.closePath(); c.fill();
    } else if (acc === 'pirate') {
      c.fillStyle = ch.band;   // bandana with a knot at the back
      c.beginPath(); c.arc(0, 0, PR, Math.PI * 1.08, Math.PI * 1.92); c.arc(0, 0, PR - 12, Math.PI * 1.92, Math.PI * 1.08, true); c.fill();
      c.beginPath(); c.arc(-36 * f, -20, 6, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(-38 * f, -18); c.lineTo(-52 * f, -10); c.lineTo(-44 * f, -6); c.closePath(); c.fill();
      c.fillStyle = '#ffffff';
      for (const [dx, dy] of [[-10, -34], [8, -36], [22, -30]]) { c.beginPath(); c.arc(dx * f, dy, 2.2, 0, Math.PI * 2); c.fill(); }
    }
  }
  function drawAccessoryFront(c, ch, acc, f, ex, ey) {
    const col = ch.accColor || '#ffffff';
    if (acc === 'shades') {
      // glowing red robotic visor with a moving scan line
      c.fillStyle = '#1b1b1b';
      c.beginPath(); c.ellipse(ex + 4 * f, ey, 20, 9, 0, 0, Math.PI * 2); c.fill();
      const pulse = 0.65 + Math.sin(time * 5) * 0.3;
      const glow = c.createRadialGradient(ex + 2 * f, ey, 1, ex + 2 * f, ey, 22);
      glow.addColorStop(0, 'rgba(255,60,80,' + pulse + ')'); glow.addColorStop(1, 'rgba(255,0,40,0)');
      c.fillStyle = glow; c.beginPath(); c.ellipse(ex + 2 * f, ey, 26, 14, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = col; c.beginPath(); c.ellipse(ex + 4 * f, ey, 15, 5, 0, 0, Math.PI * 2); c.fill();
      const sx = ex + 4 * f + Math.sin(time * 3) * 11;
      c.fillStyle = '#ffd1d8'; c.fillRect(sx - 1.5, ey - 4, 3, 8);
      c.fillStyle = '#ffffffaa'; c.beginPath(); c.arc(ex + 9 * f, ey - 2, 1.8, 0, Math.PI * 2); c.fill();
    } else if (acc === 'pirate') {
      c.fillStyle = '#111111';
      c.beginPath(); c.arc(ex, ey, 9, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#111111'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(ex - 8, ey - 6); c.lineTo(-30 * f, -30); c.moveTo(ex + 6 * f, ey - 7); c.lineTo(14 * f, -38); c.stroke();
    } else if (acc === 'helmet') {
      c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 2.5; c.lineCap = 'round';   // glare on the visor
      c.beginPath(); c.moveTo(ex - 4 * f, ey - 7); c.quadraticCurveTo(ex + 6 * f, ey - 11, ex + 16 * f, ey - 7); c.stroke();
    } else if (acc === 'crown') {
      drawCollar(c, f);
      c.fillStyle = '#ffd60a'; c.strokeStyle = '#b8860b'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-20, -36); c.lineTo(-22, -58); c.lineTo(-10, -46); c.lineTo(0, -62); c.lineTo(10, -46); c.lineTo(22, -58); c.lineTo(20, -36); c.closePath();
      c.fill(); c.stroke();
      for (const [dx, colr] of [[-11, '#e63946'], [0, '#3a86ff'], [11, '#2ec27e']]) { c.fillStyle = colr; c.beginPath(); c.arc(dx, -41, 3, 0, Math.PI * 2); c.fill(); }
    } else if (acc === 'headphones') {
      // only the near ear cup is visible in side view
      const cx = -12 * f, cy = -20;
      c.strokeStyle = '#1b1b1b'; c.lineWidth = 8; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx, cy - 14); c.quadraticCurveTo(cx + 2 * f, -PR - 12, cx + 26 * f, -PR - 4); c.stroke();
      c.strokeStyle = '#6c757d'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(cx, cy - 14); c.quadraticCurveTo(cx + 2 * f, -PR - 12, cx + 26 * f, -PR - 4); c.stroke();
      // cup: cushion, metal ring, glowing accent and logo
      c.fillStyle = '#111'; c.beginPath(); c.ellipse(cx, cy, 15, 18, 0, 0, Math.PI * 2); c.fill();
      const metal = c.createLinearGradient(cx - 12, cy - 14, cx + 12, cy + 14);
      metal.addColorStop(0, '#dee2e6'); metal.addColorStop(0.5, '#868e96'); metal.addColorStop(1, '#343a40');
      c.fillStyle = metal; c.beginPath(); c.ellipse(cx, cy, 12, 15, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#1b1b1b'; c.beginPath(); c.ellipse(cx, cy, 9, 12, 0, 0, Math.PI * 2); c.fill();
      const led = 0.55 + 0.45 * Math.sin(time * 6);
      c.strokeStyle = col; c.globalAlpha = led; c.lineWidth = 2.5;
      c.beginPath(); c.ellipse(cx, cy, 7, 10, 0, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1;
      c.fillStyle = col; c.font = '900 9px "Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('DJ', cx, cy + 1);
      // microphone boom towards the mouth
      c.strokeStyle = '#1b1b1b'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(cx + 6 * f, cy + 12); c.quadraticCurveTo(cx + 14 * f, cy + 22, cx + 28 * f, cy + 16); c.stroke();
      c.fillStyle = '#1b1b1b'; c.beginPath(); c.arc(cx + 29 * f, cy + 15, 3, 0, Math.PI * 2); c.fill();
    } else if (acc === 'tattoo') {
      // piercings: brow rings, a nose ring and a lip stud
      c.strokeStyle = '#ced4da'; c.lineWidth = 1.8;
      c.beginPath(); c.arc(ex + 6 * f, ey - 11, 3, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(ex + 1 * f, ey - 12, 2.5, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc((PR - 6) * f, -10, 3.2, 0, Math.PI * 2); c.stroke();
      c.fillStyle = '#e9ecef'; c.beginPath(); c.arc((PR - 10) * f, -4, 1.8, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(-20 * f, -36, 1.6, 0, Math.PI * 2); c.arc(-24 * f, -32, 1.6, 0, Math.PI * 2); c.fill();
    }
  }

  // King's royal cape: red velvet flaring out behind the body down to the ground.
  function drawCape(c, f, still) {
    const sway = still ? 0 : Math.sin(time * 3) * 4;
    const back = -f;
    const g = c.createLinearGradient(0, -PR, back * (PR + 30), 0);
    g.addColorStop(0, '#d00000'); g.addColorStop(1, '#6a040f');
    c.fillStyle = g; c.strokeStyle = '#370617'; c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(back * 4, -PR + 4);
    c.bezierCurveTo(back * (PR + 6), -PR + 2, back * (PR + 30 + sway), -PR * 0.4, back * (PR + 34 + sway * 1.5), 0);
    c.lineTo(back * (PR - 6), 0);
    c.closePath(); c.fill(); c.stroke();
    // velvet folds and a gold hem
    c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 2;
    for (const k of [0.45, 0.7]) {
      c.beginPath(); c.moveTo(back * (8 + k * 20), -PR + 8); c.quadraticCurveTo(back * (PR + k * 20), -PR * 0.4, back * (PR + k * 30 + sway), -2); c.stroke();
    }
    c.strokeStyle = '#ffd60a'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(back * (PR - 4), -1.5); c.lineTo(back * (PR + 33 + sway * 1.5), -1.5); c.stroke();
  }
  // ermine collar over the shoulders, drawn on top of the body
  function drawCollar(c, f) {
    const back = -f;
    c.fillStyle = '#f8f9fa'; c.strokeStyle = '#ced4da'; c.lineWidth = 1.5;
    c.beginPath(); c.ellipse(back * 18, -PR + 12, 22, 8, back * 0.6, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = '#111';
    for (const [dx, dy] of [[8, -PR + 8], [17, -PR + 13], [26, -PR + 16], [22, -PR + 7]]) {
      c.beginPath(); c.ellipse(back * dx, dy, 1.6, 2.8, 0, 0, Math.PI * 2); c.fill();
    }
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    r = Math.round(r * (1 + amt)); g = Math.round(g * (1 + amt)); b = Math.round(b * (1 + amt));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  // Glowing cracks of the lava ball, in unit-circle coordinates.
  const LAVA_CRACKS = [
    [[-0.9, -0.2], [-0.45, -0.1], [-0.2, -0.45], [0.15, -0.5], [0.55, -0.8]],
    [[-0.2, -0.45], [-0.05, 0.05], [0.4, 0.15], [0.85, 0.35]],
    [[-0.05, 0.05], [-0.35, 0.4], [-0.25, 0.9]],
    [[0.4, 0.15], [0.35, 0.55], [0.6, 0.75]],
    [[-0.45, -0.1], [-0.75, 0.35]],
  ];
  function drawLavaBall(c, R) {
    const g = c.createRadialGradient(-R * 0.3, -R * 0.35, R * 0.1, 0, 0, R);
    g.addColorStop(0, '#5c3a2e'); g.addColorStop(0.7, '#2e1b16'); g.addColorStop(1, '#140b09');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.fill();
    c.save(); c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.clip();
    const pulse = 0.65 + Math.sin(time * 6) * 0.25;
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (const [w, col] of [[R * 0.32, 'rgba(255,90,0,' + (0.45 * pulse) + ')'], [R * 0.14, '#ff8c1a'], [R * 0.06, '#ffe066']]) {
      c.strokeStyle = col; c.lineWidth = w;
      for (const line of LAVA_CRACKS) {
        c.beginPath();
        line.forEach(([x, y], i) => (i ? c.lineTo(x * R, y * R) : c.moveTo(x * R, y * R)));
        c.stroke();
      }
    }
    // a few rough rock bumps
    c.fillStyle = '#ffffff14';
    for (const [x, y, rr] of [[-0.5, -0.55, 0.18], [0.45, -0.25, 0.14], [-0.6, 0.55, 0.16], [0.2, 0.6, 0.12]]) {
      c.beginPath(); c.arc(x * R, y * R, rr * R, 0, Math.PI * 2); c.fill();
    }
    c.restore();
    c.strokeStyle = '#000000aa'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.stroke();
  }
  function drawWaterBall(c, R) {
    const wob = Math.sin(time * 9) * 0.07;
    c.save();
    c.scale(1 + wob, 1 - wob);
    const g = c.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.05, 0, 0, R);
    g.addColorStop(0, 'rgba(230,248,255,0.95)'); g.addColorStop(0.45, 'rgba(76,201,240,0.85)'); g.addColorStop(1, 'rgba(0,95,170,0.9)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.fill();
    c.save(); c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.clip();
    // swirling current inside
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = R * 0.12;
    c.beginPath(); c.arc(R * 0.1, R * 0.15, R * 0.55, time * 2, time * 2 + 2.2); c.stroke();
    // rising bubbles
    c.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 4; i++) {
      const ph = (time * 0.6 + i * 0.27) % 1;
      c.beginPath(); c.arc((i - 1.5) * R * 0.35, R * (0.8 - ph * 1.6), R * (0.06 + i * 0.02), 0, Math.PI * 2); c.fill();
    }
    c.restore();
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.beginPath(); c.ellipse(-R * 0.38, -R * 0.45, R * 0.28, R * 0.14, -0.6, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(0,70,140,0.6)'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.stroke();
    c.restore();
  }

  function ballDisc(c, R, fill, edge) {
    c.fillStyle = fill; c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.fill();
    if (edge) { c.strokeStyle = edge; c.lineWidth = 1.5; c.stroke(); }
  }
  function clipDisc(c, R) { c.save(); c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.clip(); }
  function shine(c, R, a) {
    c.fillStyle = 'rgba(255,255,255,' + (a || 0.55) + ')';
    c.beginPath(); c.ellipse(-R * 0.38, -R * 0.42, R * 0.26, R * 0.13, -0.6, 0, Math.PI * 2); c.fill();
  }
  const STARS = Array.from({ length: 22 }, (_, i) => [Math.cos(i * 2.4) * (0.15 + (i * 37 % 80) / 100), Math.sin(i * 2.4) * (0.15 + (i * 53 % 80) / 100), i]);
  const BALL_DRAW = {
    galaxy(c, R) { // a whole universe in a ball: deep space, nebula, twinkling stars and a ringed planet
      const g = c.createRadialGradient(R * 0.2, R * 0.1, 1, 0, 0, R);
      g.addColorStop(0, '#3c096c'); g.addColorStop(0.6, '#10002b'); g.addColorStop(1, '#03001c');
      ballDisc(c, R, g);
      clipDisc(c, R);
      for (const [x, y, rr, col] of [[-0.3, 0.2, 0.7, 'rgba(255,0,170,0.35)'], [0.35, -0.25, 0.6, 'rgba(76,201,240,0.35)'], [0.1, 0.5, 0.5, 'rgba(155,93,229,0.4)']]) {
        const ng = c.createRadialGradient(x * R, y * R, 0, x * R, y * R, rr * R);
        ng.addColorStop(0, col); ng.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = ng; c.fillRect(-R, -R, R * 2, R * 2);
      }
      for (const [x, y, i] of STARS) {
        c.fillStyle = 'rgba(255,255,255,' + (0.4 + 0.6 * Math.abs(Math.sin(time * 3 + i))) + ')';
        c.fillRect(x * R, y * R, R * 0.07, R * 0.07);
      }
      c.fillStyle = '#ffd166'; c.beginPath(); c.arc(R * 0.3, -R * 0.3, R * 0.17, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#ffe8a3'; c.lineWidth = R * 0.05; c.beginPath(); c.ellipse(R * 0.3, -R * 0.3, R * 0.3, R * 0.08, -0.4, 0, Math.PI * 2); c.stroke();
      c.restore();
      c.strokeStyle = '#7b2cbf'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.stroke();
    },
    melon(c, R) { // a real melon: striped green rind
      const g = c.createRadialGradient(-R * 0.3, -R * 0.3, 1, 0, 0, R);
      g.addColorStop(0, '#80b918'); g.addColorStop(1, '#2b9348');
      ballDisc(c, R, g);
      clipDisc(c, R);
      c.strokeStyle = '#1b4332'; c.lineWidth = R * 0.16;
      for (let i = -2; i <= 2; i++) {
        c.beginPath();
        for (let y = -R; y <= R; y += R / 6) c.lineTo(i * R * 0.42 + Math.sin(y / R * 6) * R * 0.06 * (1 - Math.abs(y) / R), y);
        c.stroke();
      }
      c.restore();
      c.fillStyle = '#5c3d2e'; c.beginPath(); c.ellipse(0, -R * 0.95, R * 0.12, R * 0.08, 0, 0, Math.PI * 2); c.fill();
      shine(c, R, 0.35);
      c.strokeStyle = '#1b4332'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.stroke();
    },
    gold(c, R) { // the Golden Ball trophy look: polished metal with panels and a glint
      const g = c.createRadialGradient(-R * 0.35, -R * 0.35, 1, 0, 0, R);
      g.addColorStop(0, '#fff6c2'); g.addColorStop(0.35, '#ffd60a'); g.addColorStop(0.8, '#c99700'); g.addColorStop(1, '#7a5a00');
      ballDisc(c, R, g);
      c.strokeStyle = '#8a6a00'; c.lineWidth = R * 0.07;
      c.beginPath(); c.arc(0, 0, R * 0.95, -0.4, 1.5); c.stroke();
      c.beginPath(); c.moveTo(-R * 0.95, 0); c.quadraticCurveTo(0, -R * 0.4, R * 0.7, -R * 0.68); c.stroke();
      c.beginPath(); c.moveTo(-R * 0.4, R * 0.86); c.quadraticCurveTo(-R * 0.2, 0, -R * 0.75, -R * 0.62); c.stroke();
      shine(c, R, 0.8);
      const tw = Math.max(0, Math.sin(time * 4));
      c.fillStyle = 'rgba(255,255,255,' + tw + ')';
      c.beginPath(); c.moveTo(R * 0.45, -R * 0.75); c.lineTo(R * 0.52, -R * 0.52); c.lineTo(R * 0.75, -R * 0.45); c.lineTo(R * 0.52, -R * 0.38);
      c.lineTo(R * 0.45, -R * 0.15); c.lineTo(R * 0.38, -R * 0.38); c.lineTo(R * 0.15, -R * 0.45); c.lineTo(R * 0.38, -R * 0.52); c.closePath(); c.fill();
    },
    sun(c, R) {
      c.fillStyle = '#ff9f1c';
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6 + time * 2, l = R * (1.25 + Math.sin(time * 10 + i) * 0.1);
        c.beginPath(); c.moveTo(Math.cos(a - 0.18) * R * 0.9, Math.sin(a - 0.18) * R * 0.9); c.lineTo(Math.cos(a) * l, Math.sin(a) * l);
        c.lineTo(Math.cos(a + 0.18) * R * 0.9, Math.sin(a + 0.18) * R * 0.9); c.fill();
      }
      const g = c.createRadialGradient(0, 0, 1, 0, 0, R);
      g.addColorStop(0, '#fff3b0'); g.addColorStop(0.6, '#ffd60a'); g.addColorStop(1, '#ff9f1c');
      ballDisc(c, R, g);
    },
    moon(c, R) {
      const g = c.createRadialGradient(-R * 0.3, -R * 0.3, 1, 0, 0, R);
      g.addColorStop(0, '#f8f9fa'); g.addColorStop(1, '#868e96');
      ballDisc(c, R, g, '#495057');
      for (const [x, y, rr] of [[-0.3, 0.2, 0.22], [0.35, -0.2, 0.16], [0.2, 0.5, 0.12], [-0.45, -0.4, 0.1], [0.5, 0.25, 0.09]]) {
        c.fillStyle = '#adb5bd'; c.beginPath(); c.arc(x * R, y * R, rr * R, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#6c757d'; c.beginPath(); c.arc(x * R + rr * R * 0.2, y * R + rr * R * 0.2, rr * R * 0.75, 0, Math.PI * 2); c.fill();
      }
    },
    earth(c, R) {
      const g = c.createRadialGradient(-R * 0.3, -R * 0.3, 1, 0, 0, R);
      g.addColorStop(0, '#48cae4'); g.addColorStop(1, '#0353a4');
      ballDisc(c, R, g);
      clipDisc(c, R);
      c.fillStyle = '#2b9348';
      for (const pts of [[[-0.8, -0.3], [-0.3, -0.6], [0, -0.3], [-0.2, 0.1], [-0.6, 0.2]], [[0.2, 0.0], [0.7, -0.2], [0.8, 0.3], [0.4, 0.7], [0.15, 0.4]], [[-0.4, 0.5], [-0.1, 0.55], [-0.2, 0.9]]]) {
        c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x * R, y * R) : c.moveTo(x * R, y * R))); c.closePath(); c.fill();
      }
      c.fillStyle = 'rgba(255,255,255,0.7)';
      c.fillRect(-R, -R * 0.95, R * 2, R * 0.18);
      c.beginPath(); c.ellipse(R * 0.1, -R * 0.1, R * 0.4, R * 0.07, 0.3, 0, Math.PI * 2); c.fill();
      c.restore();
      shine(c, R, 0.3);
    },
    disco(c, R) {
      ballDisc(c, R, '#adb5bd');
      clipDisc(c, R);
      const n = 7, step = (R * 2) / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const v = Math.sin(time * 6 + i * 1.3 + j * 0.7);
        c.fillStyle = v > 0.7 ? '#ffffff' : v > 0.2 ? '#dee2e6' : v > -0.4 ? '#adb5bd' : ['#ff70a6', '#70d6ff', '#ffd670'][(i + j) % 3];
        c.fillRect(-R + i * step + 0.6, -R + j * step + 0.6, step - 1.2, step - 1.2);
      }
      c.restore();
      c.strokeStyle = '#495057'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.stroke();
    },
    basket(c, R) {
      const g = c.createRadialGradient(-R * 0.3, -R * 0.3, 1, 0, 0, R);
      g.addColorStop(0, '#ff9e40'); g.addColorStop(1, '#d35400');
      ballDisc(c, R, g);
      c.strokeStyle = '#2b1a0e'; c.lineWidth = R * 0.08;
      c.beginPath(); c.moveTo(-R, 0); c.lineTo(R, 0); c.moveTo(0, -R); c.lineTo(0, R); c.stroke();
      c.beginPath(); c.arc(-R * 1.25, 0, R * 0.9, -0.8, 0.8); c.stroke();
      c.beginPath(); c.arc(R * 1.25, 0, R * 0.9, Math.PI - 0.8, Math.PI + 0.8); c.stroke();
      c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.stroke();
    },
    soccer(c, R) {
      ballDisc(c, R, '#ffffff');
      clipDisc(c, R);
      c.fillStyle = '#1b1b1b';
      const pent = (cx, cy, rr) => {
        c.beginPath();
        for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
        c.closePath(); c.fill();
      };
      pent(0, 0, R * 0.32);
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; pent(Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95, R * 0.3); }
      c.strokeStyle = '#1b1b1b'; c.lineWidth = 1.2;
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
        c.beginPath(); c.moveTo(Math.cos(a) * R * 0.32, Math.sin(a) * R * 0.32); c.lineTo(Math.cos(a) * R * 0.7, Math.sin(a) * R * 0.7); c.stroke();
      }
      c.restore();
      c.strokeStyle = '#495057'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.stroke();
    },
    donut(c, R) {
      ballDisc(c, R, '#d4a373', '#7f5539');
      c.fillStyle = '#ff70a6';
      c.beginPath();
      for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, rr = R * (0.86 + Math.sin(i * 2.7) * 0.06); c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      c.fill();
      const cols = ['#ffffff', '#70d6ff', '#ffd670', '#2ec27e', '#9b5de5'];
      for (let i = 0; i < 14; i++) {
        const a = i * 2.2, rr = R * (0.45 + (i % 3) * 0.12);
        c.save(); c.translate(Math.cos(a) * rr, Math.sin(a) * rr); c.rotate(i);
        c.fillStyle = cols[i % 5]; c.fillRect(-R * 0.08, -R * 0.025, R * 0.16, R * 0.05); c.restore();
      }
      c.fillStyle = '#7f5539'; c.beginPath(); c.arc(0, 0, R * 0.26, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#5c3d2e'; c.beginPath(); c.arc(0, 0, R * 0.2, 0, Math.PI * 2); c.fill();
    },
    eye(c, R) {
      ballDisc(c, R, '#fdfdfd', '#adb5bd');
      c.strokeStyle = '#e63946aa'; c.lineWidth = 1;
      for (let i = 0; i < 6; i++) { const a = i * 1.05; c.beginPath(); c.moveTo(Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95); c.quadraticCurveTo(Math.cos(a + 0.3) * R * 0.7, Math.sin(a + 0.3) * R * 0.7, Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5); c.stroke(); }
      c.fillStyle = '#2a9d8f'; c.beginPath(); c.arc(R * 0.2, 0, R * 0.42, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#111'; c.beginPath(); c.arc(R * 0.25, 0, R * 0.2, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(R * 0.15, -R * 0.12, R * 0.08, 0, Math.PI * 2); c.fill();
    },
    crystal(c, R) {
      const pts = [];
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8; pts.push([Math.cos(a) * R, Math.sin(a) * R]); }
      const colors = ['#caf0f8', '#90e0ef', '#48cae4', '#ade8f4', '#00b4d8', '#e0fbfc', '#48cae4', '#90e0ef'];
      for (let i = 0; i < 8; i++) {
        const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % 8];
        c.fillStyle = colors[i]; c.beginPath(); c.moveTo(0, 0); c.lineTo(x1, y1); c.lineTo(x2, y2); c.closePath(); c.fill();
      }
      c.strokeStyle = '#ffffffcc'; c.lineWidth = 1;
      c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.stroke();
      c.beginPath(); for (const [x, y] of pts) { c.moveTo(0, 0); c.lineTo(x, y); } c.stroke();
      c.fillStyle = 'rgba(255,255,255,' + (0.4 + Math.sin(time * 5) * 0.3) + ')';
      c.beginPath(); c.arc(-R * 0.3, -R * 0.3, R * 0.12, 0, Math.PI * 2); c.fill();
    },
  };

  function drawBall(b, skin, cv, r) {
    const c = cv || ctx;
    const R = r || BR;
    c.save(); c.translate(b.x, b.y); c.rotate(b.angle || 0);
    if (skin.type === 'lava') { drawLavaBall(c, R); c.restore(); return; }
    if (BALL_DRAW[skin.type]) {
      // keep highlights fixed in light: undo the spin for shiny skins
      if (skin.type === 'gold' || skin.type === 'galaxy' || skin.type === 'sun' || skin.type === 'disco') c.rotate(-(b.angle || 0));
      BALL_DRAW[skin.type](c, R); c.restore(); return;
    }
    if (skin.type === 'water') { c.rotate(-(b.angle || 0)); drawWaterBall(c, R); c.restore(); return; }
    c.fillStyle = skin.a; c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.fill();
    c.fillStyle = skin.b;
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, -0.3, 1.5); c.closePath(); c.fill();
    c.fillStyle = skin.c;
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, 2.0, 3.6); c.closePath(); c.fill();
    c.strokeStyle = '#00000044'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.stroke();
    c.restore();
  }

  // Small emblem for each super, used in the shop, tour cards and HUD.
  function drawSuperIcon(c, id, x, y, R) {
    const s = SUPER(id);
    c.save(); c.translate(x, y);
    c.fillStyle = s.color; c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#00000055'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#ffffff'; c.strokeStyle = '#ffffff'; c.lineWidth = R * 0.14; c.lineCap = 'round'; c.lineJoin = 'round';
    const k = R / 20;
    c.beginPath();
    if (id === 'fire') {
      c.moveTo(0, -12 * k); c.quadraticCurveTo(10 * k, -2 * k, 7 * k, 7 * k); c.quadraticCurveTo(0, 13 * k, -7 * k, 7 * k);
      c.quadraticCurveTo(-10 * k, -1 * k, 0, -12 * k); c.fillStyle = '#ffd23f'; c.fill();
    } else if (id === 'sticky') {
      c.arc(0, 0, 8 * k, 0, Math.PI * 2); c.fillStyle = '#ffb3c6'; c.fill();
      c.beginPath(); c.arc(-3 * k, -3 * k, 2.5 * k, 0, Math.PI * 2); c.fillStyle = '#fff'; c.fill();
    } else if (id === 'shrink') {
      c.moveTo(-9 * k, -9 * k); c.lineTo(-2 * k, -2 * k); c.moveTo(9 * k, 9 * k); c.lineTo(2 * k, 2 * k);
      c.moveTo(-2 * k, -7 * k); c.lineTo(-2 * k, -2 * k); c.lineTo(-7 * k, -2 * k);
      c.moveTo(2 * k, 7 * k); c.lineTo(2 * k, 2 * k); c.lineTo(7 * k, 2 * k); c.stroke();
    } else if (id === 'heavy') {
      c.arc(2 * k, 2 * k, 7 * k, 0, Math.PI * 2); c.fillStyle = '#e85d04'; c.fill();
      c.beginPath(); c.moveTo(-4 * k, -4 * k); c.lineTo(-12 * k, -12 * k); c.moveTo(0, -7 * k); c.lineTo(-5 * k, -14 * k); c.stroke();
    } else if (id === 'ice') {
      for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; c.moveTo(Math.cos(a) * 11 * k, Math.sin(a) * 11 * k); c.lineTo(-Math.cos(a) * 11 * k, -Math.sin(a) * 11 * k); }
      c.stroke();
    } else if (id === 'zerog') {
      c.arc(0, 2 * k, 6 * k, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(-9 * k, -6 * k); c.lineTo(0, -12 * k); c.lineTo(9 * k, -6 * k); c.stroke();
    } else if (id === 'lightning') {
      c.moveTo(3 * k, -13 * k); c.lineTo(-6 * k, 2 * k); c.lineTo(1 * k, 2 * k); c.lineTo(-3 * k, 13 * k); c.lineTo(7 * k, -3 * k);
      c.lineTo(0, -3 * k); c.closePath(); c.fillStyle = '#1b1b1b'; c.fill();
    } else if (id === 'ghost') {
      c.moveTo(-8 * k, 10 * k); c.lineTo(-8 * k, -2 * k); c.arc(0, -2 * k, 8 * k, Math.PI, 0); c.lineTo(8 * k, 10 * k);
      c.lineTo(4 * k, 6 * k); c.lineTo(0, 10 * k); c.lineTo(-4 * k, 6 * k); c.closePath(); c.fillStyle = '#6c757d'; c.fill();
      c.beginPath(); c.arc(-3 * k, -2 * k, 1.8 * k, 0, Math.PI * 2); c.arc(3 * k, -2 * k, 1.8 * k, 0, Math.PI * 2); c.fillStyle = '#fff'; c.fill();
    } else if (id === 'clones') {
      c.arc(-6 * k, 4 * k, 5 * k, 0, Math.PI * 2); c.arc(6 * k, 4 * k, 5 * k, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(0, -6 * k, 5 * k, 0, Math.PI * 2); c.fill();
    } else if (id === 'confusion') {
      c.font = '900 ' + Math.round(22 * k) + 'px "Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('?', 0, 1 * k);
    } else if (id === 'tornado') {
      for (let i = 0; i < 4; i++) { c.moveTo(-10 * k + i * 2 * k, -9 * k + i * 6 * k); c.lineTo(10 * k - i * 3 * k, -9 * k + i * 6 * k); }
      c.stroke();
    } else if (id === 'snail') {
      c.arc(2 * k, -1 * k, 7 * k, 0, Math.PI * 2); c.fillStyle = '#d4a373'; c.fill();
      c.beginPath(); c.moveTo(-11 * k, 7 * k); c.lineTo(10 * k, 7 * k); c.stroke();
      c.beginPath(); c.moveTo(-8 * k, 6 * k); c.lineTo(-10 * k, -6 * k); c.stroke();
    } else if (id === 'magnet') {
      c.lineWidth = R * 0.28; c.lineCap = 'butt';
      c.arc(0, -1 * k, 7 * k, Math.PI, 0); c.lineTo(7 * k, 9 * k); c.moveTo(-7 * k, -1 * k); c.lineTo(-7 * k, 9 * k); c.stroke();
      c.fillStyle = '#a8dadc'; c.fillRect(-10.5 * k, 6 * k, 7 * k, 4 * k); c.fillRect(3.5 * k, 6 * k, 7 * k, 4 * k);
    } else if (id === 'ink') {
      c.arc(0, 2 * k, 7 * k, 0, Math.PI * 2); c.moveTo(0, -12 * k); c.lineTo(-5 * k, -1 * k); c.lineTo(5 * k, -1 * k); c.closePath(); c.fill();
    } else if (id === 'wind') {
      c.moveTo(-10 * k, -5 * k); c.lineTo(5 * k, -5 * k); c.arc(5 * k, -9 * k, 4 * k, Math.PI / 2, -Math.PI);
      c.moveTo(-10 * k, 1 * k); c.lineTo(9 * k, 1 * k); c.moveTo(-10 * k, 7 * k); c.lineTo(3 * k, 7 * k); c.arc(3 * k, 11 * k, 4 * k, -Math.PI / 2, Math.PI);
      c.stroke();
    } else if (id === 'balloon') {
      c.ellipse(0, -3 * k, 7 * k, 9 * k, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(0, 6 * k); c.quadraticCurveTo(-4 * k, 10 * k, 1 * k, 14 * k); c.stroke();
    } else if (id === 'boomerang') {
      c.lineWidth = R * 0.26;
      c.moveTo(-10 * k, 8 * k); c.lineTo(0, -8 * k); c.lineTo(10 * k, 8 * k); c.stroke();
    } else if (id === 'teleport') {
      c.arc(0, 0, 9 * k, 0, Math.PI * 1.5); c.stroke();
      c.beginPath(); c.arc(0, 0, 4 * k, Math.PI, Math.PI * 2.5); c.stroke();
    } else if (id === 'bomb') {
      c.arc(-1 * k, 3 * k, 8 * k, 0, Math.PI * 2); c.fillStyle = '#111'; c.fill();
      c.beginPath(); c.moveTo(4 * k, -4 * k); c.quadraticCurveTo(8 * k, -10 * k, 11 * k, -9 * k); c.stroke();
      c.fillStyle = '#ffd60a'; c.beginPath(); c.arc(11 * k, -10 * k, 2.5 * k, 0, Math.PI * 2); c.fill();
    } else if (id === 'quake') {
      c.moveTo(-12 * k, 0); c.lineTo(-6 * k, -6 * k); c.lineTo(-2 * k, 5 * k); c.lineTo(3 * k, -8 * k); c.lineTo(7 * k, 4 * k); c.lineTo(12 * k, -2 * k);
      c.stroke();
    }
    c.restore();
  }

  function drawSuperBall(b) {
    const s = SUPER(b.super);
    let alpha = 1;
    if (b.super === 'ghost' && (b.x - NET_X) * (b.superOwner === 0 ? 1 : -1) > 0) {
      alpha = (time % 0.6) < 0.08 ? 0.7 : 0.04; // blinks now and then once past the net
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    b.trail.forEach((tp, i) => {
      ctx.globalAlpha = alpha * (i / b.trail.length) * 0.8;
      ctx.fillStyle = i % 2 ? s.color : s.glow;
      circle(tp.x, tp.y, BR * (0.4 + i / b.trail.length * 0.7));
    });
    ctx.globalAlpha = alpha;
    if (b.super === 'lightning') {
      ctx.strokeStyle = '#ffd60a'; ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2;
        ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + Math.cos(a) * 22, b.y + Math.sin(a) * 22); ctx.lineTo(b.x + Math.cos(a + 0.4) * 32, b.y + Math.sin(a + 0.4) * 32);
      }
      ctx.stroke();
    }
    ctx.fillStyle = s.glow; ctx.globalAlpha = alpha * 0.5; circle(b.x, b.y, BR + 7);
    ctx.globalAlpha = alpha;
    drawBall(b, BALLS[save.ball]);
    drawSuperIcon(ctx, b.super, b.x, b.y, BR * 0.75);
    ctx.restore();
  }

  const INK_BLOTS = [[0.25, 0.3, 70], [0.6, 0.5, 90], [0.4, 0.75, 60], [0.8, 0.25, 55], [0.15, 0.65, 50], [0.7, 0.8, 45]];
  function drawInk(p) {
    const x0 = p.side === 0 ? 0 : NET_X, w = NET_X;
    ctx.save();
    ctx.globalAlpha = Math.min(1, p.fx.ink) * 0.92;
    ctx.fillStyle = '#111014';
    for (const [bx, by, r] of INK_BLOTS) {
      const cx = x0 + bx * w, cy = 40 + by * (GROUND - 60);
      circle(cx, cy, r);
      for (let k = 0; k < 6; k++) { const a = k * 1.05 + bx * 5; circle(cx + Math.cos(a) * r * 1.05, cy + Math.sin(a) * r * 1.05, r * 0.28); }
    }
    ctx.restore();
  }

  function drawCountdown() {
    const n = Math.ceil(countdown);
    const f = countdown - Math.floor(countdown);          // 1 -> 0 within each second
    const sc = 1 + f * 0.6;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 0, W, H);
    ctx.translate(W / 2, 250); ctx.scale(sc, sc);
    ctx.globalAlpha = Math.min(1, 0.3 + (1 - f) * 1.5);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '900 130px "Trebuchet MS",sans-serif';
    ctx.lineWidth = 12; ctx.strokeStyle = '#1b1b1b'; ctx.strokeText(String(n), 0, 0);
    ctx.fillStyle = n === 1 ? '#ff6b35' : n === 2 ? '#ffb627' : '#ffffff'; ctx.fillText(String(n), 0, 0);
    ctx.restore();
  }

  function drawHUD() {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0008';
    roundRect(W / 2 - 90, 12, 180, 56, 14); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '900 40px "Trebuchet MS",sans-serif';
    ctx.fillText(score[0] + ' : ' + score[1], W / 2, 54);
    if (kind === 'career' || kind === 'tour') {
      ctx.font = '700 13px "Trebuchet MS",sans-serif'; ctx.fillStyle = '#ffffffcc';
      ctx.fillText(kind === 'career' ? t('level', { n: careerLevel }) : t('round', { n: save.tourRun ? save.tourRun.round + 1 : TOUR_SIZE }), W / 2, 84);
    }
    ctx.font = '700 15px "Trebuchet MS",sans-serif';
    const n0 = mode === 'duo' ? 'P1' : CHARS[save.char].name;
    const n1 = mode === 'duo' ? 'P2' : rivalName(rival);
    ctx.textAlign = 'left'; ctx.fillText(n0, 20, 28);
    ctx.textAlign = 'right'; ctx.fillText(n1, W - 76, 28);
    powerBar(44, 38, players[0], false);
    powerBar(W - 76 - 140 - 24, 38, players[1], true);
    if (bannerTimer > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, bannerTimer * 3);
      ctx.textAlign = 'center'; ctx.font = '900 54px "Trebuchet MS",sans-serif';
      ctx.fillStyle = '#0006'; ctx.fillText(banner, W / 2 + 3, 173);
      ctx.fillStyle = bannerColor; ctx.fillText(banner, W / 2, 170);
      ctx.restore();
    }
  }
  function powerBar(x, y, p, right) {
    const v = p.power;
    const s = SUPER(p.superId);
    drawSuperIcon(ctx, p.superId, right ? x + 140 + 14 : x - 14, y + 7, 11);
    ctx.fillStyle = '#0007'; roundRect(x, y, 140, 14, 7); ctx.fill();
    const full = v >= 1;
    ctx.fillStyle = full ? (Math.sin(time * 12) > 0 ? s.color : s.glow) : '#ffd23f';
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
      for (const f of fakes) drawSuperBall(Object.assign({}, f, { super: 'clones', trail: [] }));
      if (ball.super) {
        drawSuperBall(ball);
      } else {
        ball.trail.forEach((tp, i) => {
          ctx.globalAlpha = i / ball.trail.length * 0.18; ctx.fillStyle = '#fff'; circle(tp.x, tp.y, BR * 0.7);
        });
        ctx.globalAlpha = 1;
        drawBall(ball, BALLS[save.ball]);
      }
      // marker when the ball is above the screen
      if (ball.y < -BR && ball.super !== 'ghost') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(ball.x, 6); ctx.lineTo(ball.x - 8, 20); ctx.lineTo(ball.x + 8, 20); ctx.fill(); }
      for (const pt of particles) { ctx.globalAlpha = Math.max(0, pt.life / pt.max); ctx.fillStyle = pt.color; circle(pt.x, pt.y, pt.r); }
      ctx.globalAlpha = 1;
      for (const p of players) if (p.fx.ink > 0) drawInk(p);
      if (state === 'playing' || state === 'point' || state === 'paused' || state === 'countdown') drawHUD();
      if (state === 'countdown') drawCountdown();
    }
    ctx.restore();
  }

  // ---------- Menus ----------
  const screens = ['menu', 'tour', 'career', 'shop', 'pause', 'result'];
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
    careerOpen = false;
    state = 'menu';
    players = []; ball = null; fakes = [];
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

  function openTour() {
    if (!save.tourRun) { save.tourRun = newTourRun(); persist(); }
    state = 'menu'; players = []; ball = null;
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('touch').classList.add('hidden');
    buildTour(); showScreen('tour');
  }

  function buildTour() {
    const run = save.tourRun;
    const grid = document.getElementById('rivals');
    grid.innerHTML = '';
    document.getElementById('tourNote').textContent = t('round', { n: run.round + 1 }) + ' · ' + t('tourRule');
    run.rivals.forEach((r, i) => {
      const card = document.createElement('button');
      const done = i < run.round, current = i === run.round;
      card.className = 'card' + (i > run.round ? ' locked' : '') + (current ? ' current' : '');
      const fake = { char: CHARS[r.char], dark: r.char === save.char, side: 1, squash: 0, onGround: true, y: GROUND };
      card.appendChild(previewCanvas(g => {
        drawPlayer(fake, 45, 62, 0.85, 10, 30, g);
        drawSuperIcon(g, SUPERS[r.super].id, 76, 18, 11);
      }));
      const name = document.createElement('div'); name.textContent = rivalName(r); card.appendChild(name);
      const info = document.createElement('small');
      info.textContent = t('rival', { n: i + 1 }) + ' · ' + t(r.venue);
      card.appendChild(info);
      const sup = document.createElement('small');
      sup.textContent = t('s_' + SUPERS[r.super].id);
      card.appendChild(sup);
      const st = document.createElement('div'); st.className = 'stars';
      st.textContent = done ? '✔ ' + t('beaten') : current ? '▶ ' + t('play') : '';
      card.appendChild(st);
      card.addEventListener('click', () => {
        if (!current) { if (i > run.round) toast(t('locked')); return; }
        Sound.click(); startMatch('tour');
      });
      grid.appendChild(card);
    });
  }

  // ---------- Career map ----------
  let careerWorld = 0, careerOpen = false;
  const mapCanvas = document.getElementById('careerMap');
  const mapCtx = mapCanvas.getContext('2d');
  const MAP_W = 860, MAP_H = 300;
  function tilePos(i) { // snake through the map, left to right
    return { x: 70 + i * 80, y: 160 + Math.sin(i * 0.95 + 0.4) * 78 };
  }
  function openCareer() {
    state = 'menu'; players = []; ball = null;
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('touch').classList.add('hidden');
    careerWorld = Math.min(4, Math.floor((Math.min(save.career, CAREER_LEVELS) - 1) / 10));
    careerOpen = true;
    showScreen('career');
    sizeMap();
    updateWorldBar();
  }
  function sizeMap() {
    const r = mapCanvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    mapCanvas.width = Math.max(1, Math.round(r.width * dpr));
    mapCanvas.height = Math.max(1, Math.round(r.height * dpr));
  }
  function updateWorldBar() {
    const v = WORLD_VENUES[careerWorld];
    document.getElementById('worldName').textContent = t('world', { n: careerWorld + 1 }) + ' · ' + t(v);
    document.getElementById('worldPrev').style.visibility = careerWorld > 0 ? 'visible' : 'hidden';
    document.getElementById('worldNext').style.visibility = careerWorld < 4 ? 'visible' : 'hidden';
  }
  const WORLD_TINT = {
    beach: ['#4cc9f0', '#f4d58d'], jungle: ['#2d6a4f', '#74c69d'], snow: ['#90e0ef', '#f8f9fa'],
    rooftop: ['#240046', '#7b2cbf'], gym: ['#3d405b', '#d8a35d'],
  };
  function drawCareerMap() {
    const c = mapCtx;
    c.setTransform(mapCanvas.width / MAP_W, 0, 0, mapCanvas.height / MAP_H, 0, 0);
    const [top, bottom] = WORLD_TINT[WORLD_VENUES[careerWorld]];
    const g = c.createLinearGradient(0, 0, 0, MAP_H);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    c.fillStyle = g; c.fillRect(0, 0, MAP_W, MAP_H);
    // volcano glow behind the boss tile
    const bossPos = tilePos(9);
    const rg = c.createRadialGradient(bossPos.x, bossPos.y, 10, bossPos.x, bossPos.y, 140);
    rg.addColorStop(0, '#ff6b35aa'); rg.addColorStop(1, '#ff6b3500');
    c.fillStyle = rg; c.fillRect(0, 0, MAP_W, MAP_H);
    // dotted path
    c.strokeStyle = '#ffffffaa'; c.lineWidth = 6; c.setLineDash([2, 14]); c.lineCap = 'round';
    c.beginPath();
    for (let i = 0; i < 10; i++) { const q = tilePos(i); if (i) c.lineTo(q.x, q.y); else c.moveTo(q.x, q.y); }
    c.stroke(); c.setLineDash([]);
    for (let i = 0; i < 10; i++) {
      const level = careerWorld * 10 + i + 1;
      const q = tilePos(i);
      const boss = level % 10 === 0;
      const done = level < save.career, current = level === save.career, locked = level > save.career;
      const R = boss ? 34 : 25;
      c.fillStyle = '#0005'; c.beginPath(); c.ellipse(q.x, q.y + R * 0.75, R, R * 0.35, 0, 0, Math.PI * 2); c.fill();
      if (current) {
        c.fillStyle = '#ffffff55'; c.beginPath(); c.arc(q.x, q.y, R + 8 + Math.sin(time * 5) * 3, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = boss ? '#1b1b1b' : done ? '#2ec27e' : current ? '#ff6b35' : '#6c757d';
      c.beginPath(); c.arc(q.x, q.y, R, 0, Math.PI * 2); c.fill();
      c.lineWidth = 4; c.strokeStyle = boss ? '#ff3b30' : '#ffffff'; c.stroke();
      c.textAlign = 'center'; c.textBaseline = 'middle';
      if (boss) {
        // horns and glowing eyes
        c.fillStyle = '#1b1b1b';
        c.beginPath(); c.moveTo(q.x - 22, q.y - 20); c.lineTo(q.x - 30, q.y - 46); c.lineTo(q.x - 8, q.y - 30); c.fill();
        c.beginPath(); c.moveTo(q.x + 22, q.y - 20); c.lineTo(q.x + 30, q.y - 46); c.lineTo(q.x + 8, q.y - 30); c.fill();
        c.fillStyle = '#ff3b30'; c.beginPath(); c.arc(q.x - 10, q.y - 4, 5, 0, Math.PI * 2); c.arc(q.x + 10, q.y - 4, 5, 0, Math.PI * 2); c.fill();
        c.font = '900 12px "Trebuchet MS",sans-serif'; c.fillStyle = '#ffd60a'; c.fillText(t('boss'), q.x, q.y + 15);
      } else {
        c.fillStyle = '#fff'; c.font = '900 18px "Trebuchet MS",sans-serif';
        c.fillText(locked ? '🔒' : String(level), q.x, q.y + 1);
      }
      const st = save.cstars[level] || 0;
      if (done) {
        c.font = '900 13px "Trebuchet MS",sans-serif'; c.fillStyle = '#ffd60a';
        c.fillText('★'.repeat(st) + '☆'.repeat(3 - st), q.x, q.y + R + 14);
      }
      if (current) { // your character waiting on the tile
        drawPlayer({ char: CHARS[save.char], dark: false, side: 0, squash: 0, onGround: true, y: GROUND }, q.x, q.y - R - 2, 0.5, q.x + 40, q.y, c);
      }
    }
  }
  mapCanvas.addEventListener('click', e => {
    const r = mapCanvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * MAP_W, y = (e.clientY - r.top) / r.height * MAP_H;
    for (let i = 0; i < 10; i++) {
      const q = tilePos(i), level = careerWorld * 10 + i + 1;
      if (Math.hypot(x - q.x, y - q.y) < 38) {
        if (level > save.career) { toast(t('locked')); return; }
        Sound.click(); careerOpen = false; startMatch('career', level);
        return;
      }
    }
  });

  let shopTab = 'chars';
  function buildShop() {
    const grid = document.getElementById('items');
    grid.innerHTML = '';
    grid.classList.add('five');
    const keepScroll = buildShop.lastTab === shopTab ? grid.scrollTop : 0;
    buildShop.lastTab = shopTab;
    document.getElementById('tabChars').classList.toggle('on', shopTab === 'chars');
    document.getElementById('tabBalls').classList.toggle('on', shopTab === 'balls');
    document.getElementById('tabSupers').classList.toggle('on', shopTab === 'supers');
    const cfg = {
      chars: { list: CHARS, owned: save.chars, cur: 'char' },
      balls: { list: BALLS, owned: save.balls, cur: 'ball' },
      supers: { list: SUPERS, owned: save.supers, cur: 'superSel' },
    }[shopTab];
    cfg.list.forEach((it, i) => {
      const card = document.createElement('button');
      const has = cfg.owned.includes(i);
      const isCur = save[cfg.cur] === i;
      card.className = 'card' + (isCur ? ' sel' : '');
      card.appendChild(previewCanvas(g => {
        if (shopTab === 'chars') drawPlayer({ char: it, dark: false, side: 0, squash: 0, onGround: true, y: GROUND }, 45, 62, 0.85, 80, 30, g);
        else if (shopTab === 'balls') drawBall({ x: 45, y: 36, angle: 0.4 }, it, g, 26);
        else drawSuperIcon(g, it.id, 45, 36, 26);
      }));
      const name = document.createElement('div');
      name.textContent = shopTab === 'supers' ? t('s_' + it.id) : it.name;
      card.appendChild(name);
      if (shopTab === 'supers') {
        const desc = document.createElement('small'); desc.className = 'desc'; desc.textContent = t('s_' + it.id + '_d');
        card.appendChild(desc);
      }
      const info = document.createElement('small');
      info.className = 'price';
      info.textContent = isCur ? t('selected') : has ? t('select') : FREE_SHOP ? t('free') + ' (● ' + it.price + ')' : '● ' + it.price;
      card.appendChild(info);
      card.addEventListener('click', () => {
        if (!has) {
          const cost = FREE_SHOP ? 0 : it.price;
          if (save.coins < cost) { toast('● ' + cost); return; }
          save.coins -= cost; cfg.owned.push(i);
        }
        save[cfg.cur] = i;
        persist(); Sound.click(); buildShop(); refreshCoins();
      });
      grid.appendChild(card);
    });
    grid.scrollTop = keepScroll;
  }

  function updateMute() { document.getElementById('btnMute').textContent = save.muted ? '🔇' : '🔊'; }

  function wireUI() {
    document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
    const on = (id, fn) => document.getElementById(id).addEventListener('click', () => { Sound.unlock(); fn(); });
    on('btnTour', () => { Sound.click(); openTour(); });
    on('btnCareer', () => { Sound.click(); openCareer(); });
    on('worldPrev', () => { careerWorld = Math.max(0, careerWorld - 1); updateWorldBar(); });
    on('worldNext', () => { careerWorld = Math.min(4, careerWorld + 1); updateWorldBar(); });
    on('btn2p', () => { Sound.click(); startMatch('duo'); });
    on('btnShop', () => { Sound.click(); shopTab = 'chars'; buildShop(); showScreen('shop'); });
    on('tabChars', () => { shopTab = 'chars'; buildShop(); });
    on('tabBalls', () => { shopTab = 'balls'; buildShop(); });
    on('tabSupers', () => { shopTab = 'supers'; buildShop(); });
    on('btnMute', () => { save.muted = !save.muted; persist(); updateMute(); });
    on('btnPause', pauseGame);
    on('btnResume', resumeGame);
    on('btnQuit', () => { Platform.gameplayStop(); goMenu(); });
    on('btnMenu', goMenu);
    on('btnNext', () => {
      const r = lastResult;
      if (kind === 'duo') startMatch('duo');
      else if (kind === 'career') {
        if (r.won && careerLevel < CAREER_LEVELS) startMatch('career', careerLevel + 1);
        else if (r.won) openCareer();
        else startMatch('career', careerLevel);
      } else if (r.won && save.tourRun) startMatch('tour');
      else openTour();
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
    if (careerOpen) drawCareerMap();
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
    get players() { return players; }, get fakes() { return fakes; }, startMatch, save, openCareer, openTour,
    newTourRun, careerRival,
    tick(n) { for (let i = 0; i < n; i++) update(STEP); },
    effect(side, id) { applySuperEffect(players[side], id); },
  };

  boot();
})();
