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
      champion: 'Tour champion!', createRoom: 'Create room', joinRoom: 'Join room', join: 'Join', cancel: 'Cancel', roomCode: 'Room code', shareCode: 'Share this code with your friend. Waiting for a rival…', enterCode: 'Type the room code', connecting: 'Connecting…', noRoom: 'That room does not exist', netFail: 'Could not connect. Try another network.', rivalLeft: 'Your rival left the match', waitRival: 'Waiting for your rival…', you: 'You', room: 'Room {c}', claim: 'Claim prize', pickBox: 'Pick a box!', cont: 'Continue', prizeCoins: '+{n} coins', prizeItem: 'New {type}: {name}!', tCharacter: 'character', tBall: 'ball', tSuper: 'super', bossNeed: 'You need {n} ★ in this world to face the boss', locked: 'Beat the previous rival', select: 'Select', selected: 'Selected',
      adUnavailable: 'Ad not available, try again later', serve: 'Serve!', point: 'Point!', superReady: 'SUPER',
      controls: '1P: A/D or arrows to move, W / up / space to jump  ·  2P: A/D/W vs arrows',
      rival: 'Rival {n}', beach: 'beach', gym: 'warehouse', rooftop: 'rooftop', snow: 'snow', jungle: 'jungle', volcano: 'volcano', moon: 'moon',
      career: 'Spike Career', world: 'World {n}', level: 'Level {n}', boss: 'BOSS', nextLevel: 'Next level',
      newTour: 'New tournament', round: 'Round {n} of 8', tourRule: 'Rivals change every tournament. Lose once and you start again from round 1.',
      backToStart: 'Back to round 1', tourPrize: '+{n} champion bonus', play: 'Play', beaten: 'Beaten', careerDone: 'All levels cleared!',
      superHint: 'Fill the bar, then spike in the air', go: 'GO!', watchAd: 'Watch an ad: +{n} coins',
      controlsBtn: 'Buttons', practiceHint: 'Practice · hold a button for 2.5 s to edit it', ctlJump: 'Jump button',
      ctlDir: 'Direction buttons', ctlSize: 'Size', ctlPos: 'Position', ctlGap: 'Spacing', done: 'Done', reset: 'Reset', free: 'Free', rotate: 'Turn your phone sideways to play',
      s_fire: 'Fire', s_fire_d: 'A blazing fast spike',
      s_sticky: 'Bubblegum', s_sticky_d: 'Whoever stops it can\'t jump this point',
      s_shrink: 'Shrink', s_shrink_d: 'Whoever stops it shrinks this point',
      s_heavy: 'Meteor', s_heavy_d: 'Falls hard and barely bounces back',
      s_ice: 'Ice', s_ice_d: 'Whoever stops it freezes for 2 seconds',
      s_zerog: 'Zero Gravity', s_zerog_d: 'Whoever stops it floats for 2 seconds',
      s_lightning: 'Lightning', s_lightning_d: 'Hovers over the net, then strikes a random spot',
      s_ghost: 'Ghost', s_ghost_d: 'Turns invisible past the net',
      s_clones: 'Clones', s_clones_d: 'Splits into 3 balls; only one is real',
      s_confusion: 'Confusion', s_confusion_d: 'Whoever stops it gets reversed controls this point',
      e_sticky: 'Stuck!', e_shrink: 'Tiny!', e_heavy: 'Too heavy!', e_ice: 'Frozen!', e_zerog: 'Floating!',
      e_lightning: 'Zapped!', e_confusion: 'Confused!',
      s_tornado: 'Tornado', s_tornado_d: 'Spins faster and faster as it flies',
      s_magnet: 'Magnet', s_magnet_d: 'Bends away from whoever tries to stop it',
      s_teleport: 'Teleport', s_teleport_d: 'Vanishes past the net and pops up somewhere else',
      s_bomb: 'Bomb', s_bomb_d: 'Explodes on touch and blasts the rival back',
      s_snail: 'Snail', s_snail_d: 'Whoever stops it moves at half speed this point',
      s_ink: 'Ink', s_ink_d: 'Splats ink over the rival\'s side for 3 seconds',
      s_boomerang: 'Boomerang', s_boomerang_d: 'Flies deep, then swings back towards the net',
      s_wind: 'Gale', s_wind_d: 'Whoever stops it is blown back this point',
      s_balloon: 'Balloon', s_balloon_d: 'Whoever stops it puffs up and can barely jump this point',
      s_quake: 'Earthquake', s_quake_d: 'Launches whoever stops it into the air, out of control',
      s_mini: 'Mini Ball', s_mini_d: 'Shrinks the ball to a tiny dot that is hard to return',
      e_bomb: 'Boom!', e_snail: 'So slow!', e_ink: 'Splat!', e_wind: 'Blown away!', e_balloon: 'Puffed up!', e_quake: 'Earthquake!',
    },
    es: {
      tagline: 'Salta. Remata. Conquista la playa.', tour: 'Torneo', twoPlayers: '2 Jugadores', shop: 'Tienda', back: 'Volver',
      characters: 'Personajes', balls: 'Balones', supers: 'Súpers', paused: 'Pausa', resume: 'Seguir', menu: 'Menú',
      noThanks: 'No, gracias', youWin: '¡Has ganado!', youLose: 'Has perdido', p1Wins: '¡Gana el jugador 1!', p2Wins: '¡Gana el jugador 2!',
      next: 'Siguiente rival', retry: 'Reintentar', rematch: 'Revancha', double: 'Duplicar monedas', coinsEarned: '+{n} monedas',
      champion: '¡Campeón del torneo!', createRoom: 'Crear sala', joinRoom: 'Unirse a sala', join: 'Unirse', cancel: 'Cancelar', roomCode: 'Código de sala', shareCode: 'Pásale este código a tu amigo. Esperando rival…', enterCode: 'Escribe el código de la sala', connecting: 'Conectando…', noRoom: 'No existe esa sala', netFail: 'No se pudo conectar. Prueba con otra red.', rivalLeft: 'Tu rival ha salido de la partida', waitRival: 'Esperando al rival…', you: 'Tú', room: 'Sala {c}', claim: 'Reclamar premio', pickBox: '¡Elige una caja!', cont: 'Continuar', prizeCoins: '+{n} monedas', prizeItem: '¡Nuevo {type}: {name}!', tCharacter: 'personaje', tBall: 'balón', tSuper: 'súper', bossNeed: 'Necesitas {n} ★ en este mundo para el jefe', locked: 'Gana al rival anterior', select: 'Elegir', selected: 'Elegido',
      adUnavailable: 'Anuncio no disponible, prueba más tarde', serve: '¡Saca!', point: '¡Punto!', superReady: 'SÚPER',
      controls: '1J: A/D o flechas para moverte, W / arriba / espacio para saltar  ·  2J: A/D/W contra flechas',
      rival: 'Rival {n}', beach: 'playa', gym: 'almacén', rooftop: 'azotea', snow: 'nieve', jungle: 'selva', volcano: 'volcán', moon: 'luna',
      career: 'Spike Career', world: 'Mundo {n}', level: 'Nivel {n}', boss: 'JEFE', nextLevel: 'Siguiente nivel',
      newTour: 'Nuevo torneo', round: 'Ronda {n} de 8', tourRule: 'Los rivales cambian en cada torneo. Si pierdes, vuelves a la ronda 1.',
      backToStart: 'Vuelves a la ronda 1', tourPrize: '+{n} de premio de campeón', play: 'Jugar', beaten: 'Ganado', careerDone: '¡Todos los niveles superados!',
      superHint: 'Llena la barra y remata en el aire', go: '¡YA!', watchAd: 'Ver anuncio: +{n} monedas',
      controlsBtn: 'Botones', practiceHint: 'Práctica · mantén pulsado un botón 2,5 s para editarlo', ctlJump: 'Botón de salto',
      ctlDir: 'Botones de dirección', ctlSize: 'Tamaño', ctlPos: 'Posición', ctlGap: 'Separación', done: 'Listo', reset: 'Restablecer', free: 'Gratis', rotate: 'Gira el móvil en horizontal para jugar',
      s_fire: 'Fuego', s_fire_d: 'Un remate rapidísimo',
      s_sticky: 'Chicle', s_sticky_d: 'Quien la para no puede saltar en este punto',
      s_shrink: 'Encoger', s_shrink_d: 'Quien la para se encoge en este punto',
      s_heavy: 'Meteorito', s_heavy_d: 'Cae a plomo y apenas rebota',
      s_ice: 'Hielo', s_ice_d: 'Quien la para se congela 2 segundos',
      s_zerog: 'Gravedad cero', s_zerog_d: 'Quien la para flota 2 segundos',
      s_lightning: 'Rayo', s_lightning_d: 'Se queda sobre la red y sale disparado a un punto al azar',
      s_ghost: 'Fantasma', s_ghost_d: 'Se vuelve invisible al pasar la red',
      s_clones: 'Clones', s_clones_d: 'Se divide en 3 balones; solo uno es real',
      s_confusion: 'Confusión', s_confusion_d: 'Quien la para tiene los controles al revés en este punto',
      e_sticky: '¡Pegado!', e_shrink: '¡Mini!', e_heavy: '¡Pesa mucho!', e_ice: '¡Congelado!', e_zerog: '¡Flotando!',
      e_lightning: '¡Electrocutado!', e_confusion: '¡Confundido!',
      s_tornado: 'Tornado', s_tornado_d: 'Gira cada vez más rápido mientras vuela',
      s_magnet: 'Imán', s_magnet_d: 'Se aparta de quien intenta pararla',
      s_teleport: 'Teletransporte', s_teleport_d: 'Desaparece al pasar la red y aparece en otro sitio',
      s_bomb: 'Bomba', s_bomb_d: 'Explota al tocarla y lanza al rival hacia atrás',
      s_snail: 'Caracol', s_snail_d: 'Quien la para va a media velocidad en este punto',
      s_ink: 'Tinta', s_ink_d: 'Mancha de tinta el campo rival durante 3 segundos',
      s_boomerang: 'Bumerán', s_boomerang_d: 'Va al fondo y vuelve de golpe hacia la red',
      s_wind: 'Vendaval', s_wind_d: 'Quien la para sale empujado por el viento en este punto',
      s_balloon: 'Globo', s_balloon_d: 'Quien la para se hincha y apenas salta en este punto',
      s_quake: 'Terremoto', s_quake_d: 'Lanza por los aires a quien la para, sin control',
      s_mini: 'Minibola', s_mini_d: 'Encoge el balón hasta hacerlo diminuto y difícil de devolver',
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
    { name: 'Rider', body: '#d00000', band: '#d00000', acc: 'helmet', accColor: '#ffffff', price: 600 },
    { name: 'Spiky', body: '#2ec4b6', band: '#011627', acc: 'spikes', accColor: '#e0e1dd', price: 650 },
    { name: 'Cyborg', body: '#5c677d', band: '#5c677d', acc: 'shades', accColor: '#ff1f3d', price: 700 },
    { name: 'Inked', body: '#161616', band: '#161616', acc: 'tattoo', accColor: '#9d4edd', price: 750 },
    { name: 'King', body: '#3a86ff', band: '#3a86ff', acc: 'crown', price: 850 },
    { name: 'Pirate', body: '#bc6c25', band: '#d62828', acc: 'pirate', price: 900 },
    { name: 'Astro', body: '#e9ecef', band: '#e9ecef', acc: 'astro', skin: 'astro', price: 950 },
    { name: 'Ninja', body: '#343a40', band: '#343a40', acc: 'ninja', accColor: '#d00000', price: 1000 },
    { name: 'Nigiri', body: '#f8f4ea', band: '#f8f4ea', acc: 'nigiri', skin: 'nigiri', price: 1100 },
    { name: 'Slimy', body: '#70e000', band: '#70e000', acc: 'slime', skin: 'slime', price: 900 },
    { name: 'Boot', body: '#0a84ff', band: '#0a84ff', acc: 'boot', skin: 'boot', price: 1000 },
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
    { id: 'mini', price: 650, color: '#06d6a0', glow: '#b9fbc0', speed: 1060 },
  ];
  const SUPER = id => SUPERS.find(s => s.id === id);
  // TEMPORARY for playtesting: everything in the shop costs 0. Prices above are kept;
  // set this back to false to restore them.
  const FREE_SHOP = true;
  const VENUES = ['beach', 'gym', 'rooftop', 'snow', 'jungle', 'volcano', 'moon'];
  const NICKS = ['Wave', 'Lime', 'Coral', 'Tank', 'Frost', 'Volt', 'Shadow', 'Ace', 'Blaze', 'Storm', 'Pixel', 'Rocket',
    'Nova', 'Bolt', 'Kiwi', 'Mango', 'Turbo', 'Ziggy', 'Sunny', 'Echo'];
  const BOSSES = ['Magma King', 'Obsidian', 'Inferno', 'Eclipse', 'Dark Ace'];
  const BOSS_SUPERS = [4, 13, 18, 9, 19];          // ice, ink, bomb, confusion, earthquake
  const WORLD_VENUES = ['beach', 'jungle', 'snow', 'rooftop', 'gym'];
  const TOUR_SIZE = 8, CAREER_LEVELS = 50;
  // stars needed (from the 9 regular levels of a world) to unchain its boss
  const BOSS_NEED = [12, 15, 18, 21, 24];

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
    const chars = CHARS.map((_, i) => i).sort(() => r() - 0.5);   // every rival a different character
    for (let i = 0; i < TOUR_SIZE; i++) {
      const lo = Math.max(0, Math.floor(i * 2.4) - 2), hi = Math.min(SUPERS.length - 1, Math.floor(i * 2.4) + 2);
      rivals.push({
        nick: nicks[i], char: chars[i],
        venue: pick(r, VENUES.filter(v => v !== 'volcano')), super: lo + Math.floor(r() * (hi - lo + 1)), ai: i + 1,
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

  function worldStars(w) {
    let n = 0;
    for (let l = w * 10 + 1; l <= w * 10 + 9; l++) n += save.cstars[l] || 0;
    return n;
  }
  const bossUnlocked = w => worldStars(w) >= BOSS_NEED[w];

  // ---------- Save ----------
  const save = { coins: 0, chars: [0], balls: [0], supers: [0], char: 0, ball: 0, superSel: 0, muted: false,
    tourRun: null, career: 1, cstars: {},
    controls: { dirSize: 92, dirGap: 48, dirX: 20, jumpSize: 92, jumpX: 20 } };
  function loadSave() {
    try {
      const raw = Platform.load(SAVE_KEY);
      if (raw) Object.assign(save, JSON.parse(raw));
    } catch (e) { /* corrupt save: start fresh */ }
    if (!Array.isArray(save.supers) || !save.supers.includes(0)) save.supers = [0].concat(save.supers || []);
    if (!save.supers.includes(save.superSel)) save.superSel = 0;
    if (!save.chars.includes(save.char)) save.char = 0;
    if (!save.balls.includes(save.ball)) save.ball = 0;
    save.controls = Object.assign({ dirSize: 92, dirGap: 48, dirX: 20, jumpSize: 92, jumpX: 20 }, save.controls || {});
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
  let ctx = canvas.getContext('2d');
  // Wider screens (e.g. 20:9 phones) get extra scenery at the sides instead of black bars.
  // courtExt: how far the court walls reach past the 960 court on each side (phones only,
  // a bit inside the screen edge so the court is not too wide to cover).
  let viewW = W, offX = 0, courtExt = 0;
  const WALL_INSET = 70;
  function fit() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const scale = Math.min(vw / W, vh / H);
    viewW = Math.min(W * 1.45, Math.max(W, vw / scale));
    offX = (viewW - W) / 2;
    courtExt = kind === 'online' ? 0 : ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? Math.max(0, offX - WALL_INSET) : offX;
    const cw = Math.round(viewW * scale), ch = Math.round(H * scale);
    stage.style.width = cw + 'px';
    stage.style.height = ch + 'px';
    stage.style.left = Math.round((vw - cw) / 2) + 'px';
    stage.style.top = Math.round((vh - ch) / 2) + 'px';
    stage.style.setProperty('--u', scale + 'px');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    ctx.setTransform(canvas.width / viewW, 0, 0, canvas.height / H, 0, 0);
  }
  const touchDev = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const portraitPhone = () => touchDev && window.innerHeight > window.innerWidth;
  window.addEventListener('resize', () => {
    fit(); if (careerOpen) sizeMap();
    if (portraitPhone() && (state === 'playing' || state === 'countdown')) pauseGame();
  });

  // Fullscreen + landscape lock on phones (outside CrazyGames, which has its own fullscreen).
  const onCrazy = /crazygames/.test(location.hostname);
  const canFull = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
  function goFullscreen() {
    const el = document.documentElement;
    if (document.fullscreenElement || document.webkitFullscreenElement) return;
    const req = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen && el.webkitRequestFullscreen();
    Promise.resolve(req).then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape')).catch(() => {});
  }
  if (touchDev && !onCrazy && canFull) window.addEventListener('pointerdown', goFullscreen, { once: true });

  // ---------- Input ----------
  const input = [{ left: false, right: false, jump: false }, { left: false, right: false, jump: false }];
  const keys = new Set();
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const GAME_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyA', 'KeyD', 'KeyW'];
  window.addEventListener('keydown', e => {
    if (e.target && e.target.tagName === 'INPUT') return;
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
    let hold = null;
    b.addEventListener('pointerdown', e => {
      e.preventDefault(); Sound.unlock();
      touchHeld.set(e.pointerId, [p, k, b]); b.classList.add('on');
      try { b.setPointerCapture(e.pointerId); } catch (_) {}
      if (kind === 'practice' && state === 'playing') {
        b.classList.add('charging');
        hold = setTimeout(() => { b.classList.remove('charging'); openEditor(k === 'jump' ? 'jump' : 'dir'); }, 2500);
      }
    });
    const up = e => {
      clearTimeout(hold); b.classList.remove('charging');
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
    if (kind === 'online' && net && net.role === 'host') Object.assign(input[1], net.rin);
  }

  // ---------- Game state ----------
  let state = 'loading';   // loading | menu | playing | point | paused | result | ad
  let mode = 'solo';       // solo | duo
  let kind = 'tour';       // tour | career | duo | practice | online
  let rival = null;        // the AI opponent of a solo match
  let careerLevel = 1;
  let venue = 'beach';
  let players = [], ball = null, fakes = [], particles = [];
  let score = [0, 0];
  let server = 0;
  let pointTimer = 0, banner = '', bannerTimer = 0, bannerColor = '#ffb627';
  let shake = 0, time = 0;
  const wallFlash = [0, 0];
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
      super: null, superOwner: -1, superTime: 0, zig: 0, crossed: false, flight: 0, serveLock: server, r: BR };
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
    if (kind === 'online') {
      // host: left = me, right = the friend who joined (their own character and super)
      const g = net.guest;
      venue = VENUES[Math.floor(Math.random() * VENUES.length)];
      players = [makePlayer(0, save.char, false, 1, save.superSel), makePlayer(1, g.ch, false, 1, g.su)];
      players[1].dark = g.ch === save.char;
      net.send({ t: 'start', venue, ch: [save.char, g.ch], su: [save.superSel, g.su] });
      fit();
    } else if (mode === 'solo') {
      if (kind === 'career') { careerLevel = level; rival = careerRival(level); }
      else if (kind === 'practice') {
        rival = { nick: '', char: Math.floor(Math.random() * CHARS.length), venue: VENUES[Math.floor(Math.random() * VENUES.length)], super: 0, ai: 1 };   // easiest rival, so you can try the buttons in real rallies
      }
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

  function showBanner(text, dur, color) {
    banner = text; bannerTimer = dur; bannerColor = color || '#ffb627';
    netEvent(['b', text, dur, bannerColor]);
  }

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
    // a slightly faster run on wide screens, where the court reaches the screen edges
    let speed = (p.isAI ? P_SPEED * aiSpeed(p) : P_SPEED) * (1 + 0.6 * courtExt / W);
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
    if (fx.float) {                       // floats for 2 seconds, then drops back down
      fx.float = Math.max(0, fx.float - dt);
      if (!fx.float) p.onGround = false;
    }
    p.vy += P_GRAV * (fx.float ? 0.28 : 1) * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.y < 150) { p.y = 150; p.vy = Math.max(p.vy, 0); }
    const floor = fx.float ? GROUND - 70 - Math.sin(time * 3 + p.side * 2) * 10 : GROUND;
    if (p.y >= floor) {
      if (fx.float) { p.y = Math.max(floor, p.y - 150 * dt); }      // rise slowly and hover, bobbing
      else { if (!p.onGround && p.vy > 300) p.squash = 0.18; p.y = GROUND; }
      p.vy = 0; p.onGround = true;
    }
    const target = fx.shrink ? p.baseR * 0.6 : fx.balloon ? p.baseR * 1.3 : p.baseR;
    p.r += (target - p.r) * Math.min(1, dt * 10);
    const minX = p.side === 0 ? -courtExt + p.r : NET_X + NET_HALF + p.r;
    const maxX = p.side === 0 ? NET_X - NET_HALF - p.r : W + courtExt - p.r;
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
    else if (id === 'zerog') { fx.float = 2; key = 'e_zerog'; }
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
    const BRb = ball.r || BR;
    if (dist >= p.r + BRb || dist === 0 || p.hitCooldown > 0) return;
    const nx = dx / dist, ny = dy / dist;
    ball.x = p.x + nx * (p.r + BRb + 0.5);
    ball.y = p.y + ny * (p.r + BRb + 0.5);
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
    ball.st = 0; ball.tph = 0; ball.hold = 0; ball.struck = false;
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
    const rb = b.r || BR;
    if (d >= rb) return false;
    if (d === 0) { dx = b.vx > 0 ? -1 : 1; dy = 0; } else { dx /= d; dy /= d; }
    b.x = cx + dx * (rb + 0.5);
    b.y = cy + dy * (rb + 0.5);
    const vn = b.vx * dx + b.vy * dy;
    if (vn < 0) { b.vx -= 1.6 * vn * dx; b.vy -= 1.6 * vn * dy; }
    b.vx *= 0.85;
    return true;
  }

  function stepBall(b, dt, withNet, gravMul) {
    b.vy += B_GRAV * (gravMul || 1) * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    const rb = b.r || BR;
    if (b.x < -courtExt + rb) { b.x = -courtExt + rb; b.vx = Math.abs(b.vx) * 0.85; wallFlash[0] = 1; }
    if (b.x > W + courtExt - rb) { b.x = W + courtExt - rb; b.vx = -Math.abs(b.vx) * 0.85; wallFlash[1] = 1; }
    if (withNet && b.y > NET_TOP - BR && Math.abs(b.x - NET_X) < NET_HALF + BR) {
      b.vx = -b.vx * 0.85; b.x = NET_X + Math.sign(b.x - NET_X || -b.vx) * (NET_HALF + BR + 0.5);
    }
  }

  // Flight behaviour of super balls.
  function updateBallSuper(dt) {
    if (!ball.super) return 1;
    const towards = ball.superOwner === 0 ? 1 : -1;
    ball.st = (ball.st || 0) + dt;
    // Lightning: flies spinning to the net, hovers above it for 1-3 s, then strikes a random spot
    if (ball.super === 'lightning' && !ball.returned) {
      ball.spin = 30 * towards;
      if (!ball.hold && !ball.struck && (ball.x - NET_X) * towards >= -12) {
        ball.hold = 1 + Math.random() * 2;
        ball.holdY = Math.max(90, Math.min(ball.y, NET_TOP - 70));
        burst(NET_X, ball.holdY, 14, ['#ffd60a', '#ffffff']);
      }
      if (ball.hold) {
        ball.hold -= dt;
        ball.x = NET_X; ball.y = ball.holdY + Math.sin(ball.st * 9) * 4; ball.vx = 0; ball.vy = 0;
        if (Math.random() < dt * 20) burst(ball.x + (Math.random() - 0.5) * 30, ball.y + (Math.random() - 0.5) * 30, 2, ['#ffd60a', '#ffffff']);
        if (ball.hold <= 0) {
          ball.hold = 0; ball.struck = true;
          const tx = NET_X + towards * (70 + Math.random() * (390 + courtExt - 70)), ty = GROUND;
          const d = norm(tx - ball.x, ty - ball.y);
          ball.vx = d.x * 560; ball.vy = d.y * 560;
          shake = Math.max(shake, 0.2); Sound.superSpike();
          burst(ball.x, ball.y, 20, ['#ffd60a', '#fff3b0', '#ffffff']);
        }
        return 0;
      }
    }
    const past = (ball.x - NET_X) * towards > 0;     // on the receiving side
    if (past && !ball.crossed) { ball.crossed = true; ball.flight = 0; }
    if (ball.crossed && !past) ball.returned = true;   // came back over the net: stop flight tricks
    if (ball.crossed) ball.flight += dt;
    if (ball.returned) return 1;
    const rec = players[1 - ball.superOwner];
    if (ball.super === 'tornado') {
      // starts with slow loops that keep speeding up (capped so it stays playable)
      const w = Math.min(24, 5 + ball.st * 11);
      ball.tph = (ball.tph || 0) + w * dt;
      const amp = Math.min(2300, 1300 + ball.st * 700);
      ball.vx += Math.sin(ball.tph) * amp * dt;
      ball.vy += Math.cos(ball.tph) * amp * 0.7 * dt;
      ball.spin = w * 1.6 * towards;
      if (Math.random() < dt * 30) particles.push({ x: ball.x, y: ball.y, vx: Math.sin(ball.tph) * 200, vy: -100,
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
      // with the super ready even easy rivals go for the spike now and then
      const chance = p.power >= 1 ? Math.max(0.45, 0.3 + p.level * 0.08) : 0.08 + p.level * 0.11;
      if (ai.jumpPlan === null) ai.jumpPlan = Math.random() < chance;
      if (ai.jumpPlan && Math.abs(p.x - NET_X) < (p.power >= 1 ? 340 : 260)) inp.jump = true;
    }
    if (!ownSide(ball.x)) ai.jumpPlan = null;
  }

  // ---------- Effects ----------
  function burst(x, y, n, colors) {
    netEvent(['p', Math.round(x), Math.round(y), n, colors]);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 80 + Math.random() * 260;
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: 0.5 + Math.random() * 0.4,
        max: 0.9, color: colors[i % colors.length], r: 2 + Math.random() * 3 });
    }
  }
  function sand(x) {
    netEvent(['s', Math.round(x)]);
    const c = venue === 'snow' ? ['#ffffff', '#dfefff'] : venue === 'beach' ? ['#f4d58d', '#e6be6a']
      : venue === 'volcano' ? ['#ff8c1a', '#3a2a26'] : venue === 'jungle' ? ['#9c6644', '#52b788'] : venue === 'moon' ? ['#c8c8cc', '#8e8e96'] : ['#cccccc', '#999999'];
    for (let i = 0; i < 14; i++) {
      particles.push({ x: x + (Math.random() - 0.5) * 30, y: GROUND - 2, vx: (Math.random() - 0.5) * 260,
        vy: -120 - Math.random() * 260, life: 0.6, max: 0.6, color: c[i % 2], r: 2 + Math.random() * 3 });
    }
  }

  // ---------- Update ----------
  function update(dt) {
    if (kind === 'online' && net && net.role === 'guest') { guestUpdate(dt); return; }
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
        if ((score[0] >= WIN_POINTS || score[1] >= WIN_POINTS) && kind !== 'practice') endMatch();
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
    const targetR = ball.super === 'mini' ? BR * 0.42 : BR;
    ball.r += (targetR - ball.r) * Math.min(1, dt * 12);
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

    if (ball.y + ball.r >= GROUND) {
      ball.y = GROUND - ball.r;
      const loser = ball.x < NET_X ? 0 : 1;
      const winner = 1 - loser;
      score[winner]++;
      server = winner;
      // comeback: losing a point charges a chunk of the super bar (never all of it)
      const lp = players[loser];
      if (lp.power < 1) lp.power = Math.min(0.95, lp.power + 0.3);
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
    if (kind === 'online') { net.send({ t: 'end', sc: score }); onlineEnd(); return; }
    state = 'result';
    Platform.gameplayStop();
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('touch').classList.add('hidden');
    const won = score[0] > score[1];
    let coins = 0, title, champion = false;
    let note = '';
    if (kind === 'tour') {
      const run = save.tourRun;
      if (won) {
        coins = 25 + run.round * 8 + (score[1] === 0 ? 10 : 0);
        run.round++;
        if (run.round >= TOUR_SIZE) {
          coins += 150; note = t('tourPrize', { n: 150 });
          title = t('champion'); save.tourRun = null; champion = true;
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
    lastResult = { won, coins, title, note, champion };

    // A win in the tour offers an optional rewarded ad instead of a midgame ad,
    // so the two are never combined on the same transition.
    // Solo matches always offer an optional rewarded ad first (never combined with a
    // midgame ad on the same transition); local 2-player matches get a midgame ad.
    const offerReward = kind !== 'duo';
    lastResult.bonus = won ? coins : Math.max(15, coins * 2);
    if (!offerReward) await runAd('midgame');
    if (champion) showTrophy(); else showResult(offerReward);
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
    document.getElementById('nextRow').classList.toggle('hidden', offerReward);
    document.getElementById('btnDouble').textContent = t('watchAd', { n: r.bonus });
    const next = document.getElementById('btnNext');
    if (kind === 'duo' || kind === 'online') next.textContent = t('rematch');
    else if (kind === 'career') next.textContent = r.won ? (careerLevel < CAREER_LEVELS ? t('nextLevel') : t('career')) : t('retry');
    else if (r.won && save.tourRun) next.textContent = t('next');
    else next.textContent = t('newTour');
    showScreen('result');
  }

  // ---------- Tournament trophy: confetti, then pick one of three prize boxes ----------
  let trophyOpen = false, confetti = [], boxPrizes = [];
  function drawCup() {
    const cv = document.getElementById('cup'), c = cv.getContext('2d');
    c.clearRect(0, 0, 320, 320);
    const gold = c.createLinearGradient(70, 0, 250, 0);
    gold.addColorStop(0, '#b8860b'); gold.addColorStop(0.35, '#ffe066'); gold.addColorStop(0.55, '#ffd60a'); gold.addColorStop(1, '#a8740a');
    c.lineWidth = 16; c.strokeStyle = '#d4a017';                                  // handles
    c.beginPath(); c.arc(72, 110, 40, Math.PI * 0.5, Math.PI * 1.5); c.stroke();
    c.beginPath(); c.arc(248, 110, 40, -Math.PI * 0.5, Math.PI * 0.5); c.stroke();
    c.fillStyle = gold;                                                         // bowl
    c.beginPath(); c.moveTo(66, 50); c.lineTo(254, 50); c.bezierCurveTo(254, 150, 210, 196, 160, 200); c.bezierCurveTo(110, 196, 66, 150, 66, 50); c.fill();
    c.fillStyle = '#fff3b0'; c.beginPath(); c.ellipse(160, 50, 94, 12, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#b8860b'; c.beginPath(); c.ellipse(160, 52, 84, 8, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = gold; c.fillRect(146, 196, 28, 44);                          // stem
    c.beginPath(); c.ellipse(160, 240, 40, 10, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#3d2b1f'; c.fillRect(100, 248, 120, 46);                    // base and plaque
    c.fillStyle = gold; c.fillRect(92, 244, 136, 10); c.fillRect(92, 290, 136, 10);
    c.fillStyle = '#ffd60a'; c.fillRect(122, 260, 76, 24);
    c.fillStyle = '#3d2b1f'; c.font = '900 13px "Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.fillText('SPIKE DUEL', 160, 277);
    c.fillStyle = '#fff8dc'; c.save(); c.translate(160, 112); c.beginPath();        // star on the bowl
    for (let k = 0; k < 10; k++) { const r = k % 2 ? 11 : 26, a = -Math.PI / 2 + k * Math.PI / 5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    c.closePath(); c.fill(); c.restore();
    c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.ellipse(105, 100, 10, 34, -0.2, 0, Math.PI * 2); c.fill();
  }
  function confettiLoop() {
    if (!trophyOpen) return;
    const cv = document.getElementById('confetti'), r = cv.getBoundingClientRect();
    if (cv.width !== Math.round(r.width) || cv.height !== Math.round(r.height)) { cv.width = Math.round(r.width); cv.height = Math.round(r.height); }
    const c = cv.getContext('2d'), w = cv.width, h = cv.height;
    if (!confetti.length) for (let i = 0; i < 150; i++) confetti.push({ x: Math.random() * w, y: -Math.random() * h, vy: 60 + Math.random() * 90,
      sw: Math.random() * 6, a: Math.random() * 6, va: (Math.random() - 0.5) * 8, s: 5 + Math.random() * 6,
      col: ['#ff6b35', '#ffd60a', '#2ec27e', '#2a9df4', '#ff5d8f', '#c77dff', '#ffffff'][i % 7] });
    c.clearRect(0, 0, w, h);
    const dt = 1 / 60, k = Math.max(1, h / 400);
    for (const p of confetti) {
      p.y += p.vy * dt * k; p.a += p.va * dt; p.sw += dt * 3;
      const x = p.x + Math.sin(p.sw) * 14 * k;
      if (p.y > h + 20) { p.y = -20; p.x = Math.random() * w; }
      c.save(); c.translate(x, p.y); c.rotate(p.a); c.scale(1, Math.abs(Math.cos(p.a * 1.3)) + 0.2);
      c.fillStyle = p.col; c.fillRect(-p.s * k / 2, -p.s * k / 4, p.s * k, p.s * k / 2); c.restore();
    }
    requestAnimationFrame(confettiLoop);
  }
  function makePrize(taken) {
    const pool = [];
    const add = (list, owned, kind, label) => list.forEach((it, i) => {
      if (!owned.includes(i) && !taken.some(q => q.kind === kind && q.i === i)) pool.push({ kind, i, label });
    });
    add(CHARS, save.chars, 'chars', 'tCharacter'); add(BALLS, save.balls, 'balls', 'tBall'); add(SUPERS, save.supers, 'supers', 'tSuper');
    if (pool.length && Math.random() < 0.2) return pool[Math.floor(Math.random() * pool.length)];
    const amounts = [50, 60, 75, 90, 100, 120, 150, 200];                       // small amounts are the most likely
    return { kind: 'coins', n: amounts[Math.floor(Math.pow(Math.random(), 2) * amounts.length)] };
  }
  function prizeName(q) {
    return q.kind === 'chars' ? CHARS[q.i].name : q.kind === 'balls' ? BALLS[q.i].name : t('s_' + SUPERS[q.i].id);
  }
  function fillBox(box, q) {
    const el = box.querySelector('.prize'); el.innerHTML = '';
    if (q.kind === 'coins') { el.textContent = '● ' + q.n; return; }
    el.appendChild(previewCanvas(g => {
      if (q.kind === 'chars') drawPlayer({ char: CHARS[q.i], dark: false, side: 0, squash: 0, onGround: true, y: GROUND }, 45, 62, 0.8, 80, 30, g);
      else if (q.kind === 'balls') drawBall({ x: 45, y: 36, angle: 0.4 }, BALLS[q.i], g, 26);
      else drawSuperIcon(g, SUPERS[q.i].id, 45, 36, 26);
    }));
    const n = document.createElement('div'); n.textContent = prizeName(q); el.appendChild(n);
  }
  function showTrophy() {
    const tr = document.getElementById('trophy');
    tr.classList.remove('claimed');
    document.getElementById('boxes').classList.add('hidden');
    document.getElementById('boxes').classList.remove('done');
    document.querySelectorAll('#trophy .box').forEach(b => { b.className = 'box'; b.querySelector('.prize').innerHTML = ''; });
    document.getElementById('btnClaim').classList.remove('hidden');
    document.getElementById('btnTrophyGo').classList.add('hidden');
    document.getElementById('boxNote').textContent = lastResult.note;
    drawCup();
    showScreen('trophy');
    trophyOpen = true; confetti = []; requestAnimationFrame(confettiLoop);
  }
  function claimPrize() {
    Sound.click();
    document.getElementById('trophy').classList.add('claimed');
    document.getElementById('btnClaim').classList.add('hidden');
    document.getElementById('boxes').classList.remove('hidden');
    document.getElementById('boxNote').textContent = t('pickBox');
    boxPrizes = [];
    for (let i = 0; i < 3; i++) boxPrizes.push(makePrize(boxPrizes));
  }
  function openBox(i) {
    const row = document.getElementById('boxes');
    if (row.classList.contains('done')) return;
    row.classList.add('done');
    const q = boxPrizes[i];
    if (q.kind === 'coins') { save.coins += q.n; lastResult.coins += q.n; }
    else save[q.kind].push(q.i);
    persist(); Sound.win();
    document.querySelectorAll('#trophy .box').forEach((b, k) => {
      fillBox(b, boxPrizes[k]);
      b.classList.add('open', k === i ? 'chosen' : 'other');
    });
    document.getElementById('boxNote').textContent = q.kind === 'coins' ? t('prizeCoins', { n: q.n })
      : t('prizeItem', { type: t(q.label), name: prizeName(q) });
    document.getElementById('btnTrophyGo').classList.remove('hidden');
    confetti = [];
  }

  function afterRewardChoice() {
    document.getElementById('rewardRow').classList.add('hidden');
    document.getElementById('nextRow').classList.remove('hidden');
    refreshCoins();
  }

  // ---------- Touch button layout + editor ----------
  const CTRL_LIMITS = {
    dirSize: [64, 140], dirGap: [12, 220], dirX: [8, 320], jumpSize: [64, 170], jumpX: [8, 420],
  };
  function applyControls() {
    const c = save.controls, u = v => 'calc(' + v + '*var(--u))';
    const left = document.querySelector('#touch .pad.left');
    left.style.left = u(c.dirX); left.style.gap = u(c.dirGap);
    left.querySelectorAll('button').forEach(b => {
      b.style.width = b.style.height = u(c.dirSize); b.style.fontSize = u(Math.round(c.dirSize * 0.37));
    });
    const right = document.querySelector('#touch .pad.right');
    right.style.right = u(c.jumpX);
    const j = right.querySelector('.solojump');
    j.style.width = j.style.height = u(c.jumpSize); j.style.fontSize = u(Math.round(c.jumpSize * 0.37));
  }
  let editorFrom = 'playing';
  function openEditor(which) {
    if (state !== 'playing' && state !== 'point') return;
    editorFrom = state; state = 'editing';
    touchHeld.clear(); document.querySelectorAll('#touch button').forEach(b => b.classList.remove('on'));
    const list = which === 'jump' ? [['jumpSize', 'ctlSize'], ['jumpX', 'ctlPos']] : [['dirSize', 'ctlSize'], ['dirX', 'ctlPos'], ['dirGap', 'ctlGap']];
    const box = document.getElementById('editorSliders');
    box.innerHTML = '';
    document.getElementById('editorTitle').textContent = t(which === 'jump' ? 'ctlJump' : 'ctlDir');
    for (const [key, label] of list) {
      const [lo, hi] = CTRL_LIMITS[key];
      const row = document.createElement('label'); row.className = 'slider';
      const name = document.createElement('span'); name.textContent = t(label);
      const input = document.createElement('input');
      input.type = 'range'; input.min = lo; input.max = hi; input.step = 1; input.value = save.controls[key]; input.id = 'ctl-' + key;
      input.addEventListener('input', () => { save.controls[key] = +input.value; applyControls(); });
      row.appendChild(name); row.appendChild(input); box.appendChild(row);
    }
    document.getElementById('editor').classList.remove('hidden');
  }
  function closeEditor() {
    document.getElementById('editor').classList.add('hidden');
    persist();
    if (state === 'editing') state = editorFrom;
  }

  // ---------- Pause ----------
  let pausedFrom = 'playing';
  function pauseGame() {
    if (kind === 'online') { if (state !== 'result') showScreen('pause'); return; }
    if (state !== 'playing' && state !== 'point' && state !== 'countdown') return;
    pausedFrom = state === 'countdown' ? countdownTo : state;
    state = 'paused';
    Platform.gameplayStop();
    showScreen('pause');
  }
  function resumeGame() {
    if (kind === 'online') { showScreen(null); return; }
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
    } else if (venue === 'rooftop') { // night city: skyline, sweeping searchlights, neon
      layer('city-back', () => {
        const gg = ctx.createLinearGradient(0, 0, 0, GROUND);
        gg.addColorStop(0, '#050314'); gg.addColorStop(0.55, '#1b0f3a'); gg.addColorStop(1, '#4a2a6e');
        ctx.fillStyle = gg; ctx.fillRect(0, 0, W, GROUND);
        for (let i = 0; i < 70; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + hash(i) * 0.6) + ')'; ctx.fillRect(hash(i + 1) * W, hash(i + 2) * 220, 1.5, 1.5); }
        const mg = ctx.createRadialGradient(140, 80, 10, 140, 80, 90);
        mg.addColorStop(0, 'rgba(255,250,230,0.35)'); mg.addColorStop(1, 'rgba(255,250,230,0)');
        ctx.fillStyle = mg; ctx.fillRect(40, 0, 200, 180);
        ctx.fillStyle = '#f4f1de'; circle(140, 80, 24);
        ctx.fillStyle = 'rgba(0,0,0,0.08)'; circle(132, 74, 6); circle(150, 88, 4);
        // hazy far skyline
        for (let i = 0; i < 26; i++) {
          const bw = 30 + hash(i * 3) * 40, bh = 140 + hash(i * 5) * 160, bx = i * 38 - 10;
          ctx.fillStyle = '#2a1a4d'; ctx.fillRect(bx, GROUND - bh, bw, bh);
          if (hash(i * 7) > 0.6) { ctx.fillRect(bx + bw / 2 - 1, GROUND - bh - 26, 2, 26); }
        }
        const haze = ctx.createLinearGradient(0, 200, 0, GROUND);
        haze.addColorStop(0, 'rgba(120,60,160,0)'); haze.addColorStop(1, 'rgba(150,80,190,0.35)');
        ctx.fillStyle = haze; ctx.fillRect(0, 200, W, GROUND - 200);
      });
      // searchlights sweeping the sky
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      [[160, '0,240,255'], [470, '255,46,136'], [760, '255,230,120'], [900, '124,255,79']].forEach(([sx, col], i) => {
        const a = -Math.PI / 2 + Math.sin(time * (0.35 + i * 0.07) + i * 1.9) * 0.55;
        const len = 520, spread = 0.07;
        const sy = GROUND - 150;
        const bg = ctx.createLinearGradient(sx, sy, sx + Math.cos(a) * len, sy + Math.sin(a) * len);
        bg.addColorStop(0, 'rgba(' + col + ',0.32)'); bg.addColorStop(1, 'rgba(' + col + ',0)');
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(a - spread) * len, sy + Math.sin(a - spread) * len);
        ctx.lineTo(sx + Math.cos(a + spread) * len, sy + Math.sin(a + spread) * len);
        ctx.closePath(); ctx.fill();
      });
      ctx.restore();
      layer('city-front', () => {
        // detailed mid-ground buildings: setbacks, spires, water tanks, lit windows
        const NEON = ['#ff2e88', '#00f0ff', '#ffe600', '#7cff4f', '#b14dff'];
        const blds = [[-10, 90, 250], [85, 70, 190], [160, 110, 300], [275, 80, 220], [360, 95, 270],
          [560, 85, 240], [650, 110, 320], [765, 75, 210], [845, 125, 280]];
        blds.forEach(([bx, bw, bh], i) => {
          const top = GROUND - bh;
          const glass = i % 3 === 1;
          const bgc = ctx.createLinearGradient(bx, 0, bx + bw, 0);
          bgc.addColorStop(0, glass ? '#1c2a4a' : '#191233'); bgc.addColorStop(1, glass ? '#0e1830' : '#0f0a22');
          ctx.fillStyle = bgc; ctx.fillRect(bx, top, bw, bh);
          if (i % 2 === 0) { ctx.fillRect(bx + bw * 0.2, top - 30, bw * 0.6, 30); }            // setback
          if (i === 2 || i === 6) { ctx.fillRect(bx + bw / 2 - 3, top - 80, 6, 50); }          // spire
          if (i === 3 || i === 7) {                                                           // water tank
            ctx.fillStyle = '#2b1f3f'; ctx.fillRect(bx + 14, top - 26, 26, 22);
            ctx.fillRect(bx + 16, top - 4, 3, 4); ctx.fillRect(bx + 35, top - 4, 3, 4);
          }
          // windows
          for (let wy = top + 12; wy < GROUND - 14; wy += glass ? 14 : 20)
            for (let wx = bx + 8; wx < bx + bw - 10; wx += glass ? 10 : 15) {
              const h = hash(wx * 0.37 + wy * 1.31 + i);
              if (glass) { ctx.fillStyle = h > 0.55 ? 'rgba(160,210,255,0.35)' : 'rgba(80,120,190,0.15)'; ctx.fillRect(wx, wy, 7, 10); }
              else if (h > 0.45) { ctx.fillStyle = h > 0.85 ? NEON[i % 5] + 'aa' : 'rgba(255,214,120,' + (0.35 + h * 0.4) + ')'; ctx.fillRect(wx, wy, 8, 11); }
            }
          ctx.strokeStyle = NEON[i % 5] + '55'; ctx.lineWidth = 1.5; ctx.strokeRect(bx + 0.5, top + 0.5, bw - 1, bh);
        });
        // our rooftop: tar floor, parapet, AC units
        ctx.fillStyle = '#26273a'; ctx.fillRect(0, GROUND, W, H - GROUND);
        ctx.fillStyle = '#3a3c55'; ctx.fillRect(0, GROUND, W, 8);
        for (let i = 0; i < 60; i++) { ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(hash(i + 9) * W, GROUND + 12 + hash(i + 3) * 55, 3, 2); }
        for (const ax of [30, 860]) {
          ctx.fillStyle = '#4a4e69'; ctx.fillRect(ax, GROUND - 46, 70, 46);
          ctx.fillStyle = '#22223b'; ctx.beginPath(); ctx.arc(ax + 35, GROUND - 23, 16, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#6c7086'; ctx.lineWidth = 2; ctx.strokeRect(ax, GROUND - 46, 70, 46);
        }
      });
      // spinning AC fans, blinking aircraft lights and neon signs that breathe
      for (const ax of [65, 895]) {
        ctx.strokeStyle = '#8d8fa8'; ctx.lineWidth = 3;
        for (let k = 0; k < 3; k++) { const a = time * 8 + k * 2.09; ctx.beginPath(); ctx.moveTo(ax, GROUND - 23); ctx.lineTo(ax + Math.cos(a) * 13, GROUND - 23 + Math.sin(a) * 13); ctx.stroke(); }
      }
      const blink = Math.sin(time * 4) > 0.6;
      if (blink) { ctx.fillStyle = '#ff3b30'; circle(215, GROUND - 380, 3); circle(705, GROUND - 400, 3); }
      const signs = [[60, 250, 'BAR', '#ff2e88'], [320, 215, 'PIZZA', '#ffe600'], [610, 250, 'HOTEL', '#00f0ff'],
        [805, 200, '24H', '#7cff4f'], [900, 300, '★', '#b14dff']];
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '900 18px "Trebuchet MS",sans-serif';
      signs.forEach(([sx, sy, txt, col], i) => {
        let a = 0.55 + 0.35 * Math.sin(time * (1.2 + i * 0.35) + i);
        if (i === 2 && Math.sin(time * 23) > 0.93) a = 0.15;
        const w = ctx.measureText(txt).width + 22;
        ctx.globalAlpha = a; ctx.shadowColor = col; ctx.shadowBlur = 14;
        ctx.strokeStyle = col; ctx.lineWidth = 2.5; roundRect(sx - w / 2, sy - 15, w, 30, 8); ctx.stroke();
        ctx.fillStyle = col; ctx.fillText(txt, sx, sy + 1);
      });
      ctx.restore();
      for (let i = 0; i < 5; i++) {
        ctx.globalAlpha = 0.16 + 0.1 * Math.sin(time * 1.6 + i);
        ctx.fillStyle = ['#ff2e88', '#00f0ff', '#ffe600', '#7cff4f', '#b14dff'][i];
        ctx.beginPath(); ctx.ellipse(160 + i * 160, GROUND + 40, 46, 5, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (venue === 'jungle') {
      layer('jungle', () => {
        const gg = ctx.createLinearGradient(0, 0, 0, GROUND);
        gg.addColorStop(0, '#a7d7a8'); gg.addColorStop(0.5, '#6fb38a'); gg.addColorStop(1, '#3f7d5c');
        ctx.fillStyle = gg; ctx.fillRect(0, 0, W, GROUND);
        // three misty layers of trees, lighter with distance
        [['#7fb894', 260, 0.9], ['#4f8f6c', 300, 1.1], ['#2e6b4c', 350, 1.3]].forEach(([col, base, sc], L) => {
          ctx.fillStyle = col;
          for (let i = 0; i < 14; i++) {
            const tx = i * 75 + hash(i + L * 20) * 40 - 20;
            ctx.fillRect(tx - 4 * sc, base - 40, 8 * sc, GROUND - base + 40);
            for (let k = 0; k < 4; k++) circle(tx + (hash(i * 4 + k + L) - 0.5) * 50 * sc, base - 60 - k * 18 * sc, (26 + hash(i + k) * 14) * sc);
          }
          const mist = ctx.createLinearGradient(0, base - 80, 0, GROUND);
          mist.addColorStop(0, 'rgba(220,240,225,0)'); mist.addColorStop(1, 'rgba(220,240,225,' + (0.35 - L * 0.08) + ')');
          ctx.fillStyle = mist; ctx.fillRect(0, base - 80, W, GROUND - base + 80);
        });
        // big foreground trunks with bark
        for (const [tx, tw] of [[30, 42], [880, 50]]) {
          const tg = ctx.createLinearGradient(tx, 0, tx + tw, 0);
          tg.addColorStop(0, '#2b1d14'); tg.addColorStop(0.5, '#5a3e2b'); tg.addColorStop(1, '#2b1d14');
          ctx.fillStyle = tg; ctx.fillRect(tx, 0, tw, GROUND);
          ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
          for (let y = 10; y < GROUND; y += 26) { ctx.beginPath(); ctx.moveTo(tx + 6, y); ctx.quadraticCurveTo(tx + tw / 2, y + 8, tx + tw - 6, y + 2); ctx.stroke(); }
        }
        // canopy with leaf texture
        for (let i = 0; i < 26; i++) {
          const cx = hash(i + 50) * W, cy = hash(i + 80) * 70 - 10, r = 40 + hash(i + 90) * 40;
          ctx.fillStyle = ['#0b3d20', '#14532d', '#1f6f3f'][i % 3]; circle(cx, cy, r);
          ctx.fillStyle = 'rgba(160,220,140,0.18)';
          for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(cx + (hash(i * 6 + k) - 0.5) * r, cy + (hash(i * 7 + k) - 0.3) * r * 0.8, 9, 4, hash(k + i), 0, Math.PI * 2); ctx.fill(); }
        }
        // grass and dirt
        ctx.fillStyle = '#3a7d44'; ctx.fillRect(0, GROUND - 4, W, 14);
        const dg = ctx.createLinearGradient(0, GROUND + 10, 0, H);
        dg.addColorStop(0, '#6b4a2f'); dg.addColorStop(1, '#4a3220');
        ctx.fillStyle = dg; ctx.fillRect(0, GROUND + 10, W, H - GROUND - 10);
        for (let i = 0; i < 120; i++) { ctx.fillStyle = hash(i) > 0.5 ? 'rgba(0,0,0,0.18)' : 'rgba(255,220,170,0.12)'; ctx.fillRect(hash(i + 1) * W, GROUND + 14 + hash(i + 2) * 52, 3, 2); }
        ctx.strokeStyle = '#2d6a4f'; ctx.lineWidth = 2;
        for (let i = 0; i < 140; i++) { const gx = hash(i + 300) * W; ctx.beginPath(); ctx.moveTo(gx, GROUND + 6); ctx.lineTo(gx + (hash(i) - 0.5) * 8, GROUND - 6 - hash(i + 7) * 8); ctx.stroke(); }
      });
      // light shafts shimmering
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = 'rgba(255,250,200,' + (0.07 + 0.05 * Math.sin(time * 0.8 + i * 2)) + ')';
        ctx.beginPath(); ctx.moveTo(180 + i * 210, 0); ctx.lineTo(240 + i * 210, 0); ctx.lineTo(150 + i * 210, GROUND); ctx.lineTo(70 + i * 210, GROUND); ctx.fill();
      }
      // swaying vines
      ctx.lineWidth = 4;
      for (let i = 0; i < 7; i++) {
        const vx = 110 + i * 125, len = 120 + (i * 53) % 140, sway = Math.sin(time * 1.2 + i) * 9;
        ctx.strokeStyle = '#1b4332';
        ctx.beginPath(); ctx.moveTo(vx, 40); ctx.quadraticCurveTo(vx + sway, 40 + len / 2, vx + sway * 1.5, 40 + len); ctx.stroke();
        for (let k = 1; k < 5; k++) {
          ctx.fillStyle = k % 2 ? '#40916c' : '#52b788';
          ctx.beginPath(); ctx.ellipse(vx + sway * k / 4 + (k % 2 ? 7 : -7), 40 + len * k / 5, 9, 4, k % 2 ? 0.6 : -0.6, 0, Math.PI * 2); ctx.fill();
        }
      }
      // fireflies and two butterflies
      for (let i = 0; i < 14; i++) {
        const fx = (hash(i) * W + Math.sin(time * 0.7 + i) * 40 + W) % W, fy = 120 + hash(i + 3) * 300 + Math.cos(time * 0.9 + i) * 20;
        ctx.fillStyle = 'rgba(230,255,140,' + (0.3 + 0.6 * Math.abs(Math.sin(time * 2 + i))) + ')'; circle(fx, fy, 2.2);
      }
      for (let i = 0; i < 2; i++) {
        const bx = (time * 40 + i * 430) % (W + 100) - 50, by = 180 + i * 90 + Math.sin(time * 2 + i) * 30;
        const flap = Math.abs(Math.sin(time * 14 + i));
        ctx.fillStyle = i ? '#ffb703' : '#4cc9f0';
        ctx.beginPath(); ctx.ellipse(bx - 5 * flap, by, 6 * flap + 1, 5, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(bx + 5 * flap, by, 6 * flap + 1, 5, 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1b1b1b'; ctx.fillRect(bx - 1, by - 4, 2, 8);
      }
      // big foreground leaves swaying in the corners
      for (const [lx, flip] of [[0, 1], [W, -1]]) {
        ctx.save(); ctx.translate(lx, GROUND + 10); ctx.scale(flip, 1);
        for (let k = 0; k < 3; k++) {
          ctx.save(); ctx.rotate(-0.9 + k * 0.35 + Math.sin(time * 1.3 + k) * 0.05);
          ctx.fillStyle = ['#1b4332', '#2d6a4f', '#40916c'][k];
          ctx.beginPath(); ctx.ellipse(55, 0, 60, 18, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(110, 0); ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }
    } else if (venue === 'volcano') {
      layer('volcano', () => {
        const gg = ctx.createLinearGradient(0, 0, 0, GROUND);
        gg.addColorStop(0, '#0d0202'); gg.addColorStop(0.45, '#3a0909'); gg.addColorStop(0.8, '#8c2a0a'); gg.addColorStop(1, '#d4570e');
        ctx.fillStyle = gg; ctx.fillRect(0, 0, W, GROUND);
        // ash cloud bands
        for (let i = 0; i < 9; i++) { ctx.fillStyle = 'rgba(40,20,20,0.35)'; ctx.beginPath(); ctx.ellipse(hash(i) * W, 40 + hash(i + 4) * 120, 140, 26, 0, 0, Math.PI * 2); ctx.fill(); }
        // distant ridge
        ridge(ctx, 360, 60, 4.2, 10); ctx.fillStyle = '#2a0c08'; ctx.fill();
        // two volcanoes with ridged slopes and glowing lava channels
        for (const [vx, vw, vh] of [[170, 280, 300], [790, 320, 340]]) {
          const sg = ctx.createLinearGradient(vx - vw, 0, vx + vw, 0);
          sg.addColorStop(0, '#1a0806'); sg.addColorStop(0.5, '#3b1510'); sg.addColorStop(1, '#140604');
          ctx.fillStyle = sg;
          ctx.beginPath(); ctx.moveTo(vx - vw, GROUND); ctx.lineTo(vx - 38, GROUND - vh); ctx.lineTo(vx + 38, GROUND - vh); ctx.lineTo(vx + vw, GROUND); ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
          for (let k = -4; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(vx + k * 8, GROUND - vh + 4); ctx.lineTo(vx + k * vw / 4.5, GROUND); ctx.stroke(); }
          ctx.strokeStyle = '#ff6b00'; ctx.lineWidth = 6; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(vx - 10, GROUND - vh + 4); ctx.bezierCurveTo(vx - 30, GROUND - vh * 0.7, vx - 60, GROUND - vh * 0.4, vx - 80, GROUND - 20); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(vx + 14, GROUND - vh + 4); ctx.bezierCurveTo(vx + 26, GROUND - vh * 0.6, vx + 70, GROUND - vh * 0.3, vx + 100, GROUND - 30); ctx.stroke();
          ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(vx - 10, GROUND - vh + 4); ctx.bezierCurveTo(vx - 30, GROUND - vh * 0.7, vx - 60, GROUND - vh * 0.4, vx - 80, GROUND - 20); ctx.stroke();
        }
        ctx.fillStyle = '#1c1514'; ctx.fillRect(0, GROUND, W, H - GROUND);
        for (let i = 0; i < 120; i++) { ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(hash(i + 7) * W, GROUND + 8 + hash(i + 8) * 58, 3, 2); }
      });
      // crater glow and smoke plumes
      for (const [vx, vh, s] of [[170, 300, 0], [790, 340, 1]]) {
        const glow = 0.55 + Math.sin(time * 3 + s * 2) * 0.3;
        const cg = ctx.createRadialGradient(vx, GROUND - vh, 4, vx, GROUND - vh, 70);
        cg.addColorStop(0, 'rgba(255,170,40,' + glow + ')'); cg.addColorStop(1, 'rgba(255,90,0,0)');
        ctx.fillStyle = cg; ctx.fillRect(vx - 70, GROUND - vh - 70, 140, 140);
        for (let k = 0; k < 7; k++) {
          const ph = (time * 0.18 + k / 7 + s * 0.3) % 1;
          const r = 14 + ph * 46;
          ctx.fillStyle = 'rgba(60,45,45,' + (0.55 * (1 - ph)) + ')';
          circle(vx + Math.sin(ph * 4 + k) * 18 + ph * 40, GROUND - vh - 10 - ph * 220, r);
        }
      }
      for (let i = 0; i < 30; i++) {
        const ex = (i * 97 + Math.sin(time + i) * 20) % W, ey = GROUND - ((time * (30 + (i % 5) * 12) + i * 53) % GROUND);
        ctx.fillStyle = i % 2 ? '#ffb627' : '#ff6b35'; ctx.fillRect(ex, ey, 3, 3);
      }
      g = ctx.createLinearGradient(0, GROUND - 40, 0, GROUND);
      g.addColorStop(0, '#ffd60a'); g.addColorStop(1, '#e85d04');
      ctx.fillStyle = g; ctx.fillRect(0, GROUND - 34, W, 34);
      ctx.fillStyle = '#ff8c1a';
      for (let i = 0; i < 10; i++) ctx.fillRect(((i * 120 + time * 50) % (W + 80)) - 80, GROUND - 26 + (i % 2) * 10, 60, 4);
      for (let i = 0; i < 4; i++) { const ph = (time * 0.7 + i * 0.25) % 1; ctx.fillStyle = 'rgba(255,200,80,' + (1 - ph) + ')'; circle(100 + i * 230, GROUND - 30 - Math.sin(ph * Math.PI) * 30, 4); }
      ctx.strokeStyle = 'rgba(255,110,0,' + (0.55 + Math.sin(time * 4) * 0.25) + ')'; ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 9; i++) { const cx = 40 + i * 110; ctx.moveTo(cx, GROUND + 4); ctx.lineTo(cx + 18, GROUND + 26); ctx.lineTo(cx + 6, GROUND + 48); ctx.moveTo(cx + 18, GROUND + 26); ctx.lineTo(cx + 46, GROUND + 34); }
      ctx.stroke();
    } else if (venue === 'moon') {
      layer('moon', () => {
        // deep space
        const sp = ctx.createLinearGradient(0, 0, 0, GROUND);
        sp.addColorStop(0, '#02030a'); sp.addColorStop(0.6, '#0a0f2c'); sp.addColorStop(1, '#1b1f3f');
        ctx.fillStyle = sp; ctx.fillRect(0, 0, W, GROUND);
        // milky way haze
        for (let i = 0; i < 26; i++) {
          ctx.fillStyle = 'rgba(150,140,255,0.05)';
          ctx.beginPath(); ctx.ellipse(i * 40 + hash(i) * 30, 260 - i * 8 + hash(i + 3) * 30, 70, 22, -0.2, 0, Math.PI * 2); ctx.fill();
        }
        for (let i = 0; i < 220; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.25 + hash(i + 9) * 0.6) + ')'; ctx.fillRect(hash(i) * W, hash(i + 1) * 380, 1.4, 1.4); }
        // the Earth: oceans, continents, cloud swirls, night side and atmosphere glow
        const ex = 250, ey = 175, er = 72;
        const glow = ctx.createRadialGradient(ex, ey, er, ex, ey, er + 30);
        glow.addColorStop(0, 'rgba(110,180,255,0.45)'); glow.addColorStop(1, 'rgba(110,180,255,0)');
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(ex, ey, er + 30, 0, Math.PI * 2); ctx.fill();
        const oc = ctx.createRadialGradient(ex - 25, ey - 25, 10, ex, ey, er);
        oc.addColorStop(0, '#4cc9f0'); oc.addColorStop(0.6, '#1d6fb8'); oc.addColorStop(1, '#0b3a75');
        ctx.fillStyle = oc; ctx.beginPath(); ctx.arc(ex, ey, er, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.arc(ex, ey, er, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = '#4f9d4a';
        for (const [cx, cy, rx, ry, a] of [[-30, -20, 26, 18, 0.4], [-10, 8, 16, 26, -0.3], [28, -30, 22, 12, 0.2], [34, 18, 18, 24, 0.6], [-40, 34, 14, 10, 0]]) {
          ctx.beginPath(); ctx.ellipse(ex + cx, ey + cy, rx, ry, a, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#c9a66b';
        ctx.beginPath(); ctx.ellipse(ex + 30, ey - 26, 9, 5, 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        for (const [cx, cy, r, a0] of [[-20, -40, 30, 0.2], [20, 10, 34, 3.6], [-34, 20, 22, 5], [10, 46, 26, 0.8]]) {
          ctx.beginPath(); ctx.arc(ex + cx, ey + cy, r, a0, a0 + 1.4); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.ellipse(ex, ey - er + 6, 24, 7, 0, 0, Math.PI * 2); ctx.fill();
        const night = ctx.createLinearGradient(ex - er, 0, ex + er, 0);
        night.addColorStop(0, 'rgba(2,3,10,0)'); night.addColorStop(0.55, 'rgba(2,3,10,0.15)'); night.addColorStop(1, 'rgba(2,3,10,0.85)');
        ctx.fillStyle = night; ctx.fillRect(ex - er, ey - er, er * 2, er * 2);
        ctx.restore();
        // a small ringed planet far away
        ctx.save(); ctx.translate(720, 200); ctx.rotate(-0.35);
        ctx.strokeStyle = 'rgba(230,200,150,0.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, 40, 10, 0, Math.PI, Math.PI * 2); ctx.stroke();
        const pg = ctx.createRadialGradient(-6, -6, 2, 0, 0, 22);
        pg.addColorStop(0, '#f6d7a7'); pg.addColorStop(1, '#b07d48');
        ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, 0, 40, 10, 0, 0, Math.PI); ctx.stroke();
        ctx.restore();
        // lunar horizon: grey hills with craters
        ridge(ctx, 400, 26, 7.3, 6); ctx.fillStyle = '#6c6f7d'; ctx.fill();
        ridge(ctx, 430, 18, 2.1, 4); ctx.fillStyle = '#8b8e9b'; ctx.fill();
        const gnd = ctx.createLinearGradient(0, GROUND, 0, H);
        gnd.addColorStop(0, '#b9bbc4'); gnd.addColorStop(1, '#7d808c');
        ctx.fillStyle = gnd; ctx.fillRect(0, GROUND, W, H - GROUND);
        const crater = (x, y, r) => {
          ctx.fillStyle = 'rgba(60,62,75,0.45)'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.32, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(x + r * 0.15, y + r * 0.08, r * 0.8, r * 0.22, 0, 0, Math.PI); ctx.fill();
        };
        for (const [x, y, r] of [[60, 448, 22], [300, 452, 14], [640, 446, 26], [880, 450, 18], [120, 500, 30], [420, 515, 20], [720, 498, 34], [930, 520, 16], [250, 530, 12]]) crater(x, y, r);
        for (let i = 0; i < 90; i++) { ctx.fillStyle = 'rgba(40,40,50,0.25)'; ctx.fillRect(hash(i + 70) * W, GROUND + 4 + hash(i + 71) * 64, 2, 2); }
        // a little flag left by an earlier mission
        ctx.strokeStyle = '#d0d0d0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(560, 440); ctx.lineTo(560, 392); ctx.stroke();
        ctx.fillStyle = '#e63946'; ctx.fillRect(561, 392, 22, 14); ctx.fillStyle = '#ffffff'; ctx.fillRect(561, 397, 22, 3);
      });
      // twinkling stars
      for (let i = 0; i < 26; i++) {
        const tw = 0.5 + 0.5 * Math.sin(time * (1.5 + hash(i + 300) * 2) + i);
        ctx.fillStyle = 'rgba(255,255,255,' + tw + ')';
        const sx = hash(i + 200) * W, sy2 = hash(i + 201) * 330;
        ctx.fillRect(sx - 0.5, sy2 - 2.5, 1, 5); ctx.fillRect(sx - 2.5, sy2 - 0.5, 5, 1);
      }
      // a shooting star every few seconds
      const sp = 3.5, sk = Math.floor(time / sp), sph = (time % sp) / 0.9;
      if (sph < 1) {
        const x0 = 150 + hash(sk) * 700, y0 = 20 + hash(sk + 1) * 120, dx = 260 * sph, dy = 110 * sph;
        const g2 = ctx.createLinearGradient(x0 + dx - 90, y0 + dy - 38, x0 + dx, y0 + dy);
        g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(1, 'rgba(255,255,255,' + (1 - sph) + ')');
        ctx.strokeStyle = g2; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x0 + dx - 90, y0 + dy - 38); ctx.lineTo(x0 + dx, y0 + dy); ctx.stroke();
      }
      // now and then a burning meteor crosses the sky
      const mp = 13, mk = Math.floor(time / mp), mph = (time % mp) / 3.2;
      if (mph < 1) {
        const dir = hash(mk + 7) < 0.5 ? 1 : -1;
        const mx = dir > 0 ? -60 + mph * (W + 120) : W + 60 - mph * (W + 120), my = 60 + hash(mk + 3) * 80 + mph * 160;
        for (let k = 0; k < 14; k++) {
          const tx = mx - dir * k * 9, ty = my - k * 1.4 * 1.6;
          ctx.fillStyle = 'rgba(255,' + (200 - k * 10) + ',80,' + (0.55 * (1 - k / 14)) + ')';
          circle(tx, ty, 9 - k * 0.5);
        }
        ctx.fillStyle = '#5a4a40'; circle(mx, my, 7);
        ctx.fillStyle = '#ffd166'; circle(mx + dir * 2, my - 1, 3);
      }
      // floating moon dust
      for (let i = 0; i < 20; i++) {
        const dx = (hash(i + 400) * W + time * 6) % W, dy = GROUND - 10 - ((time * 4 + hash(i + 401) * 120) % 120);
        ctx.fillStyle = 'rgba(220,220,230,0.35)'; ctx.fillRect(dx, dy, 2, 2);
      }
    } else { // snowy mountains
      layer('snow', () => {
        const gg = ctx.createLinearGradient(0, 0, 0, GROUND);
        gg.addColorStop(0, '#5b8fc7'); gg.addColorStop(0.6, '#a9c8e8'); gg.addColorStop(1, '#e6eff8');
        ctx.fillStyle = gg; ctx.fillRect(0, 0, W, GROUND);
        const sg = ctx.createRadialGradient(780, 90, 10, 780, 90, 160);
        sg.addColorStop(0, 'rgba(255,255,240,0.8)'); sg.addColorStop(1, 'rgba(255,255,240,0)');
        ctx.fillStyle = sg; ctx.fillRect(600, 0, 360, 260);
        // mountain range: far and near ridges with snow caps
        [[260, 120, 1.3, '#8aa5c4', 210], [320, 95, 2.9, '#5f7f9f', 270], [370, 50, 5.1, '#41607d', 340]].forEach(([base, amp, seed, col, cap]) => {
          ridge(ctx, base, amp, seed, 14); ctx.fillStyle = col; ctx.fill();
          ctx.save(); ridge(ctx, base, amp, seed, 14); ctx.clip();
          ctx.fillStyle = '#f4f8fc';
          ctx.beginPath(); ctx.moveTo(0, 0);
          for (let x = 0; x <= W; x += 10) ctx.lineTo(x, cap + Math.sin(x * 0.09 + seed) * 8 + Math.sin(x * 0.031) * 10);
          ctx.lineTo(W, 0); ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(120,150,190,0.25)';                // shadowed faces
          for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, cap - 70); ctx.lineTo(x + 30, cap + 40); ctx.lineTo(x + 50, cap + 40); ctx.closePath(); ctx.fill(); }
          ctx.restore();
        });
        // snowy hills and pine trees
        ctx.fillStyle = '#eef4fa';
        ctx.beginPath(); ctx.moveTo(0, GROUND);
        for (let x = 0; x <= W; x += 10) ctx.lineTo(x, 400 - Math.sin(x * 0.012 + 1) * 22 - Math.sin(x * 0.03) * 8);
        ctx.lineTo(W, GROUND); ctx.fill();
        const pine = (px, py, s) => {
          ctx.fillStyle = '#3b2a20'; ctx.fillRect(px - 3 * s, py - 10 * s, 6 * s, 12 * s);
          for (let k = 0; k < 4; k++) {
            const ty = py - 10 * s - k * 16 * s, w = (30 - k * 6) * s;
            ctx.fillStyle = '#1d4a3a'; ctx.beginPath(); ctx.moveTo(px - w, ty); ctx.lineTo(px, ty - 26 * s); ctx.lineTo(px + w, ty); ctx.fill();
            ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(px - w * 0.6, ty - 8 * s); ctx.lineTo(px, ty - 26 * s); ctx.lineTo(px + w * 0.6, ty - 8 * s); ctx.lineTo(px, ty - 14 * s); ctx.fill();
          }
        };
        for (const [px, s] of [[40, 1.1], [110, 0.8], [190, 0.6], [770, 0.65], [850, 0.9], [925, 1.15]]) pine(px, 410 + (1 - s) * 30, s);
        // snow ground with soft blue shadows
        const gnd = ctx.createLinearGradient(0, GROUND, 0, H);
        gnd.addColorStop(0, '#ffffff'); gnd.addColorStop(1, '#d8e6f3');
        ctx.fillStyle = gnd; ctx.fillRect(0, GROUND, W, H - GROUND);
        ctx.fillStyle = 'rgba(140,170,210,0.25)';
        for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.ellipse(hash(i + 40) * W, GROUND + 20 + hash(i + 41) * 40, 60, 6, 0, 0, Math.PI * 2); ctx.fill(); }
        for (let i = 0; i < 80; i++) { ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(hash(i + 60) * W, GROUND + 6 + hash(i + 61) * 60, 2, 2); }
      });
      // snowfall in three depths, drifting with a little wind
      for (let i = 0; i < 140; i++) {
        const depth = i % 3, sp = 25 + depth * 25, sz = 1.2 + depth * 1.1;
        const fx = (hash(i) * W + time * (8 + depth * 6) + Math.sin(time * 0.8 + i) * 12) % W;
        const fy = (hash(i + 500) * H + time * sp) % H;
        ctx.fillStyle = 'rgba(255,255,255,' + (0.5 + depth * 0.2) + ')'; circle(fx, fy, sz);
      }
    }
  }
  // Static scenery is drawn once into an offscreen canvas and reused every frame.
  const layerCache = {};
  function layer(key, fn) {
    let cv = layerCache[key];
    if (!cv) {
      cv = document.createElement('canvas'); cv.width = W * 2; cv.height = H * 2;
      const c2 = cv.getContext('2d'); c2.scale(2, 2);
      const main = ctx; ctx = c2; fn(); ctx = main;
      layerCache[key] = cv;
    }
    ctx.drawImage(cv, 0, 0, W, H);
  }
  function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  // jagged mountain ridge path from layered sines plus a little noise
  function ridge(c, base, amp, seed, rough) {
    c.beginPath(); c.moveTo(0, GROUND);
    for (let x = 0; x <= W; x += 8) {
      const y = base - amp * (0.55 * Math.sin(x * 0.006 + seed) + 0.3 * Math.sin(x * 0.017 + seed * 1.7) + 0.15 * Math.sin(x * 0.051 + seed * 3.1))
        - rough * (hash(Math.floor(x / 8) + seed * 100) - 0.5);
      c.lineTo(x, y);
    }
    c.lineTo(W, GROUND); c.closePath();
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
    const darkPole = venue === 'snow';
    ctx.fillStyle = darkPole ? '#212529' : '#e9ecef'; ctx.fillRect(NET_X - NET_HALF, NET_TOP, NET_HALF * 2, GROUND - NET_TOP);
    ctx.strokeStyle = darkPole ? '#495057' : '#adb5bd'; ctx.lineWidth = 1;
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

    const facing = p.side === 0 ? 1 : -1;
    if (!p.boss && ch.skin) drawSkinBody(c, ch, facing, p.dark);
    else {
      const body = p.boss ? '#1b1b1b' : p.dark ? shade(ch.body, -0.45) : ch.body;
      c.fillStyle = body;
      c.beginPath(); c.arc(0, 0, PR, Math.PI, 0); c.lineTo(PR, 0); c.closePath(); c.fill();
      c.lineWidth = 3; c.strokeStyle = '#1b1b1bcc'; c.stroke();
      c.fillStyle = '#ffffff33';
      c.beginPath(); c.ellipse(-14, -26, 10, 6, -0.5, 0, Math.PI * 2); c.fill();
    }
    const acc = p.boss ? null : ch.acc;
    if (!acc) {
      c.fillStyle = ch.band;
      c.beginPath(); c.arc(0, 0, PR, Math.PI * 1.13, Math.PI * 1.87); c.arc(0, 0, PR - 9, Math.PI * 1.87, Math.PI * 1.13, true); c.fill();
    }
    if (acc) drawAccessoryBack(c, ch, acc, facing);
    // eyes follow the ball; spirals when confused, crosses when zapped
    const ex = 10 * facing, ey = -16;
    c.fillStyle = '#fff'; c.beginPath(); c.arc(ex, ey, 8, 0, Math.PI * 2); c.fill();
    if (ch.skin === 'nigiri' || ch.skin === 'astro' || ch.skin === 'boot') { c.strokeStyle = '#3d3a36'; c.lineWidth = 1.8; c.stroke(); }
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
      // Formula 1 helmet: glossy livery, narrow visor slot, sponsor decals and an air intake
      const shell = c.createLinearGradient(0, -PR - 4, 0, 0);
      shell.addColorStop(0, '#ff4d4d'); shell.addColorStop(0.55, ch.body); shell.addColorStop(1, '#7a0000');
      c.fillStyle = shell; c.strokeStyle = '#111'; c.lineWidth = 3;
      c.beginPath(); c.arc(0, 0, PR + 2, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
      // white and gold livery sweep
      c.fillStyle = '#ffffff';
      c.beginPath(); c.moveTo(-(PR + 1) * f, -6); c.quadraticCurveTo(-10 * f, -46, 30 * f, -30); c.lineTo(26 * f, -24);
      c.quadraticCurveTo(-8 * f, -36, -(PR - 2) * f, 0); c.closePath(); c.fill();
      c.fillStyle = '#ffd60a';
      c.beginPath(); c.moveTo(-(PR - 2) * f, 0); c.quadraticCurveTo(-8 * f, -36, 26 * f, -24); c.lineTo(24 * f, -20);
      c.quadraticCurveTo(-6 * f, -30, -(PR - 6) * f, 0); c.closePath(); c.fill();
      // roof air intake
      c.fillStyle = '#111'; c.beginPath(); c.ellipse(-4 * f, -PR - 1, 9, 4, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#495057'; c.beginPath(); c.ellipse(-4 * f, -PR - 1, 6, 2, 0, 0, Math.PI * 2); c.fill();
      // visor slot: a narrow band of dark glass at eye level (the eye shows through)
      c.fillStyle = '#0b0b0f'; c.strokeStyle = '#111'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-2 * f, -26); c.lineTo((PR + 2) * f, -24); c.lineTo((PR + 1) * f, -8); c.lineTo(-2 * f, -8); c.closePath(); c.fill();
      const vg = c.createLinearGradient(0, -26, 0, -8);
      vg.addColorStop(0, 'rgba(0,180,216,0.55)'); vg.addColorStop(1, 'rgba(114,9,183,0.45)');
      c.fillStyle = vg; c.fill(); c.stroke();
      // sponsor decal and number on the side
      c.fillStyle = '#111'; c.fillRect(-34 * f - (f > 0 ? 0 : 22), -20, 22, 8);
      c.fillStyle = '#ffd60a'; c.font = '900 7px "Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('SPIKE', -23 * f, -16);
      c.fillStyle = '#ffffff'; c.font = '900 10px "Trebuchet MS",sans-serif'; c.fillText('1', -20 * f, -32);
      // chin: black with a small chequered strip
      c.fillStyle = '#111'; c.fillRect(-2 * f - (f > 0 ? 0 : 0), -7, (PR + 1) * f, 7);
      for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#111'; c.fillRect((6 + i * 5) * f - (f > 0 ? 0 : 5), -6, 5, 3); }
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
      c.fillStyle = 'rgba(255,255,255,0.08)';
      c.beginPath(); c.arc(0, 0, PR - 2, Math.PI * 1.05, Math.PI * 1.95); c.arc(0, 0, PR - 10, Math.PI * 1.95, Math.PI * 1.05, true); c.fill();
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
      drawParrot(c, f);
    } else if (acc === 'helmet') {
      c.fillStyle = 'rgba(0,180,216,0.22)';            // tinted glass over the eye
      c.beginPath(); c.moveTo(-2 * f, -26); c.lineTo((PR + 2) * f, -24); c.lineTo((PR + 1) * f, -8); c.lineTo(-2 * f, -8); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 2; c.lineCap = 'round';
      c.beginPath(); c.moveTo(2 * f, -23); c.lineTo(22 * f, -22.5); c.stroke();
    } else if (acc === 'crown') {
      drawCollar(c, f);
      const gold = c.createLinearGradient(-22, -62, 22, -36);
      gold.addColorStop(0, '#fff3b0'); gold.addColorStop(0.35, '#ffd60a'); gold.addColorStop(0.7, '#e0a100'); gold.addColorStop(1, '#a67c00');
      c.fillStyle = gold; c.strokeStyle = '#7a5a00'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-20, -36); c.lineTo(-22, -58); c.lineTo(-10, -46); c.lineTo(0, -62); c.lineTo(10, -46); c.lineTo(22, -58); c.lineTo(20, -36); c.closePath();
      c.fill(); c.stroke();
      c.strokeStyle = '#a67c00'; c.lineWidth = 1.2;                      // engraved band
      c.beginPath(); c.moveTo(-20, -38); c.lineTo(20, -38); c.moveTo(-20, -44); c.lineTo(20, -44); c.stroke();
      for (const [px, py] of [[-22, -58], [0, -62], [22, -58]]) { c.fillStyle = '#fff3b0'; c.beginPath(); c.arc(px, py, 2.5, 0, Math.PI * 2); c.fill(); }
      for (const [dx, colr] of [[-11, '#e63946'], [0, '#3a86ff'], [11, '#2ec27e']]) {
        c.fillStyle = colr; c.beginPath(); c.moveTo(dx, -45); c.lineTo(dx + 3.5, -41); c.lineTo(dx, -37); c.lineTo(dx - 3.5, -41); c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.75)'; c.beginPath(); c.arc(dx - 1, -42, 1, 0, Math.PI * 2); c.fill();
      }
      const tw = Math.max(0, Math.sin(time * 3)); c.fillStyle = 'rgba(255,255,255,' + tw + ')';
      c.beginPath(); c.arc(8, -52, 1.6, 0, Math.PI * 2); c.fill();
    } else if (acc === 'astro') {
      // glass bubble helmet with a gold rim, reflections and an antenna
      c.strokeStyle = '#adb5bd'; c.lineWidth = 2; c.beginPath(); c.moveTo(-8 * f, -54); c.lineTo(-14 * f, -66); c.stroke();
      c.fillStyle = Math.sin(time * 5) > 0 ? '#e63946' : '#ff8fa3'; c.beginPath(); c.arc(-14 * f, -67, 2.5, 0, Math.PI * 2); c.fill();
      const hg = c.createRadialGradient(10 * f, -32, 4, 4 * f, -22, 34);
      hg.addColorStop(0, 'rgba(200,235,255,0.08)'); hg.addColorStop(0.8, 'rgba(120,180,230,0.22)'); hg.addColorStop(1, 'rgba(80,130,200,0.45)');
      c.fillStyle = hg;
      c.beginPath(); c.arc(4 * f, -20, 32, Math.PI * 1.02, Math.PI * 1.98); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 2;
      c.beginPath(); c.arc(4 * f, -20, 32, Math.PI * 1.02, Math.PI * 1.98); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.arc(4 * f, -20, 25, Math.PI * (f > 0 ? 1.55 : 1.15), Math.PI * (f > 0 ? 1.85 : 1.45)); c.stroke();
      const rim = c.createLinearGradient(-30, 0, 30, 0);
      rim.addColorStop(0, '#b08900'); rim.addColorStop(0.5, '#ffd60a'); rim.addColorStop(1, '#b08900');
      c.fillStyle = rim; c.fillRect(4 * f - 31, -10, 62, 5);
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

  // Characters whose whole body is a special material.
  const RICE = Array.from({ length: 34 }, (_, i) => {
    const a = Math.PI + hash(i * 3.1) * Math.PI, d = Math.sqrt(hash(i * 5.7)) * (PR - 5);
    return [Math.cos(a) * d, Math.min(-3, Math.sin(a) * d), hash(i * 2.3) * Math.PI];
  });
  function drawSkinBody(c, ch, f, dark) {
    const half = () => { c.beginPath(); c.arc(0, 0, PR, Math.PI, 0); c.lineTo(PR, 0); c.closePath(); };
    if (ch.skin === 'nigiri') {
      // --- rice bed: lumpy silhouette packed with individual, shaded grains
      const lumpy = () => {
        c.beginPath();
        for (let i = 0; i <= 40; i++) {
          const a = Math.PI + (i / 40) * Math.PI, r = PR + (hash(i * 9.1) - 0.5) * 3.5;
          c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        c.lineTo(PR, 0); c.lineTo(-PR, 0); c.closePath();
      };
      const rg = c.createRadialGradient(-8, -20, 4, 0, -8, PR + 4);
      rg.addColorStop(0, '#fffdf7'); rg.addColorStop(0.7, '#f1ebdd'); rg.addColorStop(1, '#ddd3bf');
      c.fillStyle = rg; lumpy(); c.fill();
      c.save(); lumpy(); c.clip();
      for (const [gx, gy, ga] of RICE) {   // simple cartoon grains
        c.fillStyle = '#ffffff'; c.strokeStyle = 'rgba(175,160,135,0.5)'; c.lineWidth = 0.8;
        c.beginPath(); c.ellipse(gx, gy, 4.5, 2.3, ga, 0, Math.PI * 2); c.fill(); c.stroke();
      }
      c.restore();
      c.strokeStyle = 'rgba(150,135,110,0.8)'; c.lineWidth = 1.5; lumpy(); c.stroke();
      // --- salmon slice draped over the rice, thick in the middle and tapering at both ends
      const slab = () => {
        c.beginPath();
        c.moveTo(-(PR + 7), -2);
        c.bezierCurveTo(-(PR + 8), -PR - 16, PR + 8, -PR - 16, PR + 9, -6);
        c.quadraticCurveTo(PR + 6, -2, PR + 1, -6);                   // rounded front tip
        c.bezierCurveTo(PR - 6, -PR + 8, -PR + 8, -PR + 12, -(PR - 4), -8);
        c.quadraticCurveTo(-(PR + 2), -2, -(PR + 7), -2);
        c.closePath();
      };
      c.save(); c.translate(1, 3); c.fillStyle = 'rgba(80,40,20,0.22)'; slab(); c.fill(); c.restore();   // shadow on the rice
      const sg = c.createLinearGradient(-PR, -PR - 8, PR * 0.6, -4);
      sg.addColorStop(0, '#ff9a62'); sg.addColorStop(0.45, '#fb6f3c'); sg.addColorStop(1, '#e2522a');
      c.fillStyle = sg; slab(); c.fill();
      c.save(); slab(); c.clip();
      // translucent flesh: lighter band through the middle
      const fl = c.createLinearGradient(0, -PR - 8, 0, -8);
      fl.addColorStop(0, 'rgba(255,190,150,0.35)'); fl.addColorStop(0.5, 'rgba(255,190,150,0)'); fl.addColorStop(1, 'rgba(160,40,10,0.25)');
      c.fillStyle = fl; c.fillRect(-PR - 10, -PR - 14, PR * 2 + 20, PR + 12);
      // the characteristic white fat lines, soft-edged and curving with the drape
      for (let k = -3; k <= 3; k++) {
        const x0 = k * 15 - 10, sway = 6;
        const line = () => { c.beginPath(); c.moveTo(x0 - 6, -PR - 14); c.bezierCurveTo(x0 + sway, -PR + 2, x0 + 2, -PR + 18, x0 + 14, -2); };
        c.strokeStyle = 'rgba(255,236,220,0.45)'; c.lineWidth = 5.5; line(); c.stroke();
        c.strokeStyle = 'rgba(255,248,240,0.95)'; c.lineWidth = 1.8; line(); c.stroke();
      }
      // glossy sheen and a few wet highlights
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-PR + 6, -PR + 2); c.quadraticCurveTo(-6, -PR - 8, 18, -PR - 4); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.8)';
      for (const [hx, hy] of [[-18, -PR], [4, -PR - 5], [24, -PR + 2]]) { c.beginPath(); c.arc(hx, hy, 1.4, 0, Math.PI * 2); c.fill(); }
      c.restore();
      c.strokeStyle = '#b8401c'; c.lineWidth = 1.6; slab(); c.stroke();
    } else if (ch.skin === 'slime') {
      // wobbly, translucent goo with bubbles and drips
      const wob = a => PR * (1 + 0.05 * Math.sin(a * 3 + time * 5) + 0.03 * Math.sin(a * 7 - time * 3));
      const shape = () => {
        c.beginPath();
        for (let i = 0; i <= 28; i++) { const a = Math.PI + (i / 28) * Math.PI, r = wob(a); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        c.lineTo(PR + 6, 0); c.lineTo(-PR - 6, 0); c.closePath();
      };
      const gg = c.createRadialGradient(-12, -28, 4, 0, -10, PR + 8);
      gg.addColorStop(0, 'rgba(204,255,144,0.95)'); gg.addColorStop(0.6, dark ? 'rgba(40,110,20,0.92)' : 'rgba(112,224,0,0.9)'); gg.addColorStop(1, 'rgba(38,120,20,0.95)');
      c.fillStyle = gg; shape(); c.fill();
      c.strokeStyle = '#2b7a0b'; c.lineWidth = 2.5; c.stroke();
      // puddle spreading at the base
      c.fillStyle = 'rgba(112,224,0,0.75)'; c.beginPath(); c.ellipse(0, -1, PR + 10, 5, 0, 0, Math.PI * 2); c.fill();
      // bubbles rising inside
      for (let i = 0; i < 5; i++) {
        const ph = (time * 0.4 + i * 0.2) % 1;
        c.fillStyle = 'rgba(255,255,255,' + (0.5 * (1 - ph)) + ')';
        c.beginPath(); c.arc(-26 + i * 12, -4 - ph * 30, 2 + (i % 3), 0, Math.PI * 2); c.fill();
      }
      // drips oozing from the sides
      for (const [dx, sp] of [[-30, 0], [24, 1.7]]) {
        const ph = (time * 0.5 + sp) % 1, len = 4 + ph * 12;
        c.fillStyle = 'rgba(112,224,0,0.9)';
        c.beginPath(); c.moveTo(dx - 4, -8); c.quadraticCurveTo(dx - 3, -8 + len, dx, -6 + len); c.quadraticCurveTo(dx + 3, -8 + len, dx + 4, -8); c.fill();
        c.beginPath(); c.arc(dx, -5 + len, 3, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = 'rgba(255,255,255,0.65)'; c.beginPath(); c.ellipse(-16, -28, 10, 5, -0.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.arc(-24, -22, 2.2, 0, Math.PI * 2); c.fill();
    } else if (ch.skin === 'boot') {
      // football boot wrapped onto the same half-dome every character uses:
      // toe cap at the front, heel counter at the back, ankle opening, laces, stripe, sole and studs
      c.save(); c.scale(f, 1);                                  // front (toe) towards the net
      const ug = c.createLinearGradient(0, -PR, 0, 0);
      ug.addColorStop(0, dark ? '#1b5fc4' : '#5ab4ff'); ug.addColorStop(0.5, dark ? '#0a3f8f' : '#0a84ff'); ug.addColorStop(1, '#063d99');
      c.fillStyle = ug; half(); c.fill();
      c.save(); half(); c.clip();
      c.fillStyle = '#0a2e6e';
      c.beginPath(); c.ellipse(PR + 2, -2, 22, 24, 0, 0, Math.PI * 2); c.fill();          // toe cap
      c.beginPath(); c.ellipse(-PR - 2, -4, 16, 30, 0, 0, Math.PI * 2); c.fill();         // heel counter
      c.fillStyle = 'rgba(255,255,255,0.22)';                                             // grip texture on the toe
      for (let gx = 26; gx < 44; gx += 5) for (let gy = -18; gy < -4; gy += 5) c.fillRect(gx, gy, 2, 2);
      c.setLineDash([3, 3]); c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1;    // stitching
      c.beginPath(); c.ellipse(PR + 2, -2, 25, 27, 0, Math.PI * 0.5, Math.PI * 1.5); c.stroke();
      c.beginPath(); c.ellipse(-PR - 2, -4, 19, 33, 0, -Math.PI * 0.5, Math.PI * 0.5); c.stroke();
      c.setLineDash([]);
      const st = c.createLinearGradient(-PR, 0, PR, 0);                                   // side stripe
      st.addColorStop(0, '#d4ff00'); st.addColorStop(1, '#8cff00');
      c.fillStyle = st;
      c.beginPath(); c.moveTo(-PR, -9); c.bezierCurveTo(-18, -7, 6, -9, 26, -22);
      c.bezierCurveTo(4, -15, -18, -15, -PR, -17); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 3;                         // gloss along the curve
      c.beginPath(); c.arc(0, 0, PR - 9, Math.PI * 1.12, Math.PI * 1.32); c.stroke();
      c.restore();
      c.lineWidth = 3; c.strokeStyle = '#03224f'; half(); c.stroke();
      // pure side view: the ankle collar sits right on top of the dome, with the sock rising out of it
      c.fillStyle = '#f1f3f5'; c.strokeStyle = '#03224f'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(-11, -PR + 3); c.lineTo(-10, -PR - 7); c.quadraticCurveTo(0, -PR - 10, 10, -PR - 7); c.lineTo(11, -PR + 3); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#d4ff00'; c.fillRect(-10, -PR - 5, 20, 2.5);                         // sock stripe
      c.strokeStyle = '#0b1020'; c.lineWidth = 6; c.lineCap = 'round';                     // padded collar on the curve
      c.beginPath(); c.arc(0, 0, PR - 2, Math.PI * 1.40, Math.PI * 1.60); c.stroke();
      c.strokeStyle = '#d4ff00'; c.lineWidth = 1.5;
      c.beginPath(); c.arc(0, 0, PR - 5.5, Math.PI * 1.40, Math.PI * 1.60); c.stroke();
      // laces following the curve of the instep, from the collar down towards the toe
      for (let k = 0; k < 5; k++) {
        const a = Math.PI * (1.635 + k * 0.05), r = PR - 4;
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        const tx = -Math.sin(a), ty = Math.cos(a), nx = Math.cos(a), ny = Math.sin(a);   // tangent and normal
        c.fillStyle = '#03122e';
        c.beginPath(); c.arc(x - nx * 3, y - ny * 3, 1.3, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#ffffff'; c.lineWidth = 2.6;
        c.beginPath();
        c.moveTo(x - tx * 3.5 - nx * 2.5, y - ty * 3.5 - ny * 2.5); c.lineTo(x + tx * 3.5 + nx * 2.5, y + ty * 3.5 + ny * 2.5);
        c.moveTo(x + tx * 3.5 - nx * 2.5, y + ty * 3.5 - ny * 2.5); c.lineTo(x - tx * 3.5 + nx * 2.5, y - ty * 3.5 + ny * 2.5);
        c.stroke();
      }
      // neon soleplate and studs
      c.fillStyle = '#d4ff00'; c.fillRect(-PR, -5, PR * 2, 5);
      c.fillStyle = '#4a5a00'; c.fillRect(-PR, -1, PR * 2, 1.5);
      c.fillStyle = '#f1f3f5'; c.strokeStyle = '#495057'; c.lineWidth = 1;
      for (const sx of [-32, -20, 4, 16, 28, 37]) {
        c.beginPath(); c.moveTo(sx - 4, 0); c.lineTo(sx + 4, 0); c.lineTo(sx + 2.2, 6); c.lineTo(sx - 2.2, 6); c.closePath(); c.fill(); c.stroke();
      }
      c.restore();
    } else if (ch.skin === 'astro') {
      // white space suit with panels, a mission patch and a chest control box
      const sg = c.createLinearGradient(0, -PR, 0, 0);
      sg.addColorStop(0, '#ffffff'); sg.addColorStop(1, '#ced4da');
      c.fillStyle = sg; half(); c.fill();
      c.lineWidth = 3; c.strokeStyle = '#495057'; c.stroke();
      c.strokeStyle = '#adb5bd'; c.lineWidth = 1.5;
      c.beginPath(); c.arc(0, 0, PR - 10, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
      c.beginPath(); c.moveTo(-PR + 2, -8); c.lineTo(PR - 2, -8); c.stroke();
      c.fillStyle = '#1d3557'; c.fillRect(-28 * f - (f > 0 ? 0 : 12), -14, 12, 8);    // patch
      c.fillStyle = '#e63946'; c.fillRect(-28 * f - (f > 0 ? 0 : 12), -11, 12, 2);
      c.fillStyle = '#6c757d'; c.fillRect(14 * f - (f > 0 ? 0 : 16), -7, 16, 7);      // control box
      for (let i = 0; i < 3; i++) { c.fillStyle = ['#2ec27e', '#ffd60a', '#e63946'][i]; c.fillRect(14 * f - (f > 0 ? 0 : 16) + 2 + i * 5, -5, 3, 3); }
      c.strokeStyle = '#868e96'; c.lineWidth = 3;                                        // oxygen hose
      c.beginPath(); c.moveTo(-34 * f, -6); c.quadraticCurveTo(-40 * f, -24, -30 * f, -36); c.stroke();
    }
  }

  // Parrot perched on the pirate's head, bobbing a little.
  function drawParrot(c, f) {
    const bob = Math.sin(time * 4) * 1.5;
    c.save(); c.translate(-18 * f, -PR - 4 + bob); c.scale(f, 1);
    c.fillStyle = '#1d4ed8'; c.beginPath(); c.moveTo(-6, 2); c.lineTo(-18, 16); c.lineTo(-10, 4); c.fill();   // tail
    c.fillStyle = '#e63946'; c.beginPath(); c.moveTo(-4, 4); c.lineTo(-14, 18); c.lineTo(-2, 6); c.fill();
    const bg = c.createLinearGradient(-8, -18, 8, 6);
    bg.addColorStop(0, '#52b788'); bg.addColorStop(1, '#1b7a43');
    c.fillStyle = bg; c.beginPath(); c.ellipse(0, -4, 8, 11, 0.25, 0, Math.PI * 2); c.fill();             // body
    c.fillStyle = '#ffd60a'; c.beginPath(); c.ellipse(-3, -2, 4, 7, 0.4, 0, Math.PI * 2); c.fill();      // wing
    c.fillStyle = '#e63946'; c.beginPath(); c.arc(3, -16, 7, 0, Math.PI * 2); c.fill();                  // head
    c.fillStyle = '#ffd166'; c.beginPath(); c.moveTo(8, -18); c.quadraticCurveTo(15, -15, 9, -10); c.lineTo(8, -14); c.fill();  // beak
    c.fillStyle = '#fff'; c.beginPath(); c.arc(5, -18, 2.4, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#111'; c.beginPath(); c.arc(5.6, -18, 1.2, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#6c4a2b'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-2, 6); c.lineTo(-3, 9); c.moveTo(2, 6); c.lineTo(2, 9); c.stroke();
    c.restore();
  }

  // King's royal cape: red velvet flaring out behind the body down to the ground.
  function drawCape(c, f, still) {
    const sway = still ? 0 : Math.sin(time * 3) * 4;
    const back = -f;
    const g = c.createLinearGradient(0, -PR, back * (PR + 14), 0);
    g.addColorStop(0, '#d00000'); g.addColorStop(1, '#6a040f');
    c.fillStyle = g; c.strokeStyle = '#370617'; c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(back * 4, -PR + 4);
    c.bezierCurveTo(back * (PR + 2), -PR + 2, back * (PR + 12 + sway), -PR * 0.4, back * (PR + 14 + sway), 0);
    c.lineTo(back * (PR - 8), 0);
    c.closePath(); c.fill(); c.stroke();
    // velvet folds and a gold hem
    c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 2;
    for (const k of [0.45, 0.7]) {
      c.beginPath(); c.moveTo(back * (8 + k * 20), -PR + 8); c.quadraticCurveTo(back * (PR + k * 8), -PR * 0.4, back * (PR + k * 12 + sway), -2); c.stroke();
    }
    c.strokeStyle = '#ffd60a'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(back * (PR - 6), -1.5); c.lineTo(back * (PR + 13 + sway), -1.5); c.stroke();
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
    } else if (id === 'mini') {
      c.arc(0, 0, 3.5 * k, 0, Math.PI * 2); c.fill();
      c.beginPath();
      for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
        const ox = Math.cos(a), oy = Math.sin(a);
        c.moveTo(ox * 13 * k, oy * 13 * k); c.lineTo(ox * 7 * k, oy * 7 * k);
        c.moveTo(ox * 7 * k - oy * 3 * k + ox * 3 * k, oy * 7 * k + ox * 3 * k + oy * 3 * k); c.lineTo(ox * 7 * k, oy * 7 * k);
        c.lineTo(ox * 7 * k + oy * 3 * k + ox * 3 * k, oy * 7 * k - ox * 3 * k + oy * 3 * k);
      }
      c.stroke();
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
      circle(tp.x, tp.y, (b.r || BR) * (0.4 + i / b.trail.length * 0.7));
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
    const rr = b.r || BR;
    ctx.fillStyle = s.glow; ctx.globalAlpha = alpha * 0.5; circle(b.x, b.y, rr + 7);
    ctx.globalAlpha = alpha;
    drawBall(b, BALLS[save.ball], null, rr);
    if (b.super !== 'mini') drawSuperIcon(ctx, b.super, b.x, b.y, rr * 0.75);
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
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-offX, 0, viewW, H);
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
    if (kind === 'practice') {
      ctx.font = '700 14px "Trebuchet MS",sans-serif'; ctx.fillStyle = '#ffffffdd';
      ctx.fillText(t('practiceHint'), W / 2, 86);
    }
    if (kind === 'career' || kind === 'tour') {
      ctx.font = '700 13px "Trebuchet MS",sans-serif'; ctx.fillStyle = '#ffffffcc';
      ctx.fillText(kind === 'career' ? t('level', { n: careerLevel }) : t('round', { n: save.tourRun ? save.tourRun.round + 1 : TOUR_SIZE }), W / 2, 84);
    }
    ctx.font = '700 15px "Trebuchet MS",sans-serif';
    let n0 = mode === 'duo' ? 'P1' : CHARS[save.char].name;
    let n1 = mode === 'duo' ? 'P2' : kind === 'online' ? '' : rivalName(rival);
    if (kind === 'online') {
      n0 = players[0].char.name; n1 = players[1].char.name;
      if (net && net.role === 'guest') n1 += ' (' + t('you') + ')'; else n0 += ' (' + t('you') + ')';
      ctx.font = '700 13px "Trebuchet MS",sans-serif'; ctx.fillStyle = '#ffffffcc';
      ctx.fillText(t('room', { c: net ? net.code : '' }), W / 2, 84);
      ctx.font = '700 15px "Trebuchet MS",sans-serif'; ctx.fillStyle = '#fff';
    }
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

  // Transparent glass walls at the court edges, so you can see where the ball bounces.
  function drawWalls() {
    const T = 16;
    for (let i = 0; i < 2; i++) {
      const edge = i ? W + courtExt : -courtExt, dir = i ? -1 : 1, x0 = i ? edge - T : edge;
      wallFlash[i] = Math.max(0, wallFlash[i] - 0.03);
      const g = ctx.createLinearGradient(edge, 0, edge + dir * T, 0);
      g.addColorStop(0, 'rgba(170,220,255,' + (0.42 + 0.4 * wallFlash[i]) + ')');
      g.addColorStop(1, 'rgba(170,220,255,' + (0.14 + 0.25 * wallFlash[i]) + ')');
      ctx.fillStyle = g; ctx.fillRect(x0, 0, T, GROUND);
      ctx.fillStyle = 'rgba(255,255,255,' + (0.75 + 0.25 * wallFlash[i]) + ')';
      ctx.fillRect(edge + dir * T - (i ? 0 : 3), 0, 3, GROUND);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(edge - (i ? 2 : 0), 0, 2, GROUND);
      // reflections sliding down the glass
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (let k = 0; k < 4; k++) {
        const y = ((time * 40 + k * 140) % (GROUND + 80)) - 80;
        ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, T, GROUND); ctx.clip();
        ctx.beginPath(); ctx.moveTo(x0, y + 40); ctx.lineTo(x0 + T, y); ctx.lineTo(x0 + T, y + 18); ctx.lineTo(x0, y + 58); ctx.fill();
        ctx.restore();
      }
    }
  }

  // Phones: the court is lifted so the touch buttons sit on a band below the floor and
  // a finger on them never hides the player. Depends on the player's button size.
  function ctrlShift() {
    if (!isTouch || !players.length) return 0;
    const c = save.controls, top = H - 14 - Math.max(c.dirSize, c.jumpSize);
    return Math.max(0, Math.min(130, GROUND + 14 - top));
  }
  // the band starts just under the floor, so the court reads as ending there
  function drawControlDeck(sy) {
    const top = GROUND - sy + 12;
    const g = ctx.createLinearGradient(0, top, 0, H);
    g.addColorStop(0, '#1a2233'); g.addColorStop(1, '#0b1018');
    ctx.fillStyle = g; ctx.fillRect(0, top, W, H - top);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(0, top, W, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, top + 2, W, 4);
  }

  function render() {
    const sy = ctrlShift();
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 30, (Math.random() - 0.5) * shake * 30);
    ctx.save(); ctx.scale(viewW / W, 1);
    ctx.save(); ctx.translate(0, -sy); drawBackground(); ctx.restore();
    if (sy) drawControlDeck(sy);
    ctx.restore();
    ctx.translate(offX, -sy);
    if (players.length) {
      drawNet();
      drawWalls();
      for (const p of players) drawPlayer(p, p.x, p.y, 1, ball.x, ball.y);
      for (const f of fakes) drawSuperBall(Object.assign({}, f, { super: 'clones', trail: [] }));
      if (ball.super) {
        drawSuperBall(ball);
      } else {
        ball.trail.forEach((tp, i) => {
          ctx.globalAlpha = i / ball.trail.length * 0.18; ctx.fillStyle = '#fff'; circle(tp.x, tp.y, BR * 0.7);
        });
        ctx.globalAlpha = 1;
        drawBall(ball, BALLS[save.ball], null, ball.r);
      }
      // marker when the ball is above the screen
      if (ball.y < sy - BR && ball.super !== 'ghost') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(ball.x, sy + 6); ctx.lineTo(ball.x - 8, sy + 20); ctx.lineTo(ball.x + 8, sy + 20); ctx.fill(); }
      for (const pt of particles) { ctx.globalAlpha = Math.max(0, pt.life / pt.max); ctx.fillStyle = pt.color; circle(pt.x, pt.y, pt.r); }
      ctx.globalAlpha = 1;
      for (const p of players) if (p.fx.ink > 0) drawInk(p);
      ctx.translate(0, sy);
      if (state === 'playing' || state === 'point' || state === 'paused' || state === 'countdown' || state === 'editing') drawHUD();
      if (state === 'countdown') drawCountdown();
    }
    ctx.restore();
  }

  // ---------- Menus ----------
  const screens = ['menu', 'tour', 'career', 'shop', 'pause', 'result', 'trophy', 'online'];
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
    if (kind === 'online') { leaveOnline(); kind = 'tour'; fit(); }
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
        drawPlayer(fake, 45, 62, 0.8, 10, 30, g);
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
  // Themed backdrop behind the level tiles of each world.
  function drawWorldScenery(c, v) {
    const W2 = MAP_W, H2 = MAP_H, lin = (y0, y1, stops) => {
      const g = c.createLinearGradient(0, y0, 0, y1); stops.forEach((col, i) => g.addColorStop(i / (stops.length - 1), col)); return g;
    };
    const blob = (x, y, rx, ry, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); };
    if (v === 'beach') {
      c.fillStyle = lin(0, 90, ['#4cc9f0', '#a8e6ff']); c.fillRect(0, 0, W2, 90);
      blob(760, 40, 26, 26, '#fff3b0');
      c.fillStyle = lin(80, 170, ['#0077b6', '#00b4d8']); c.fillRect(0, 80, W2, 95);
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 2;
      for (let r = 0; r < 4; r++) for (let x = 0; x < W2; x += 70) {
        const y = 96 + r * 20, o = (time * 20 + r * 25) % 70;
        c.beginPath(); c.moveTo(x + o, y); c.quadraticCurveTo(x + o + 12, y - 5, x + o + 24, y); c.stroke();
      }
      c.fillStyle = '#e9f5ff';                                    // foam line
      c.beginPath(); c.moveTo(0, 178);
      for (let x = 0; x <= W2; x += 20) c.lineTo(x, 172 + Math.sin(x * 0.05 + time * 2) * 4);
      c.lineTo(W2, 186); c.lineTo(0, 186); c.fill();
      c.fillStyle = lin(176, H2, ['#f7dc9c', '#e6be6a']); c.fillRect(0, 180, W2, H2 - 180);
      for (let i = 0; i < 70; i++) { c.fillStyle = 'rgba(160,120,60,0.35)'; c.fillRect(hash(i) * W2, 190 + hash(i + 1) * 105, 2, 2); }
      for (const [x, y] of [[40, 270], [820, 250], [470, 288]]) {   // shells and a starfish
        c.fillStyle = '#ff8fab'; c.beginPath(); c.arc(x, y, 6, Math.PI, 0); c.fill();
      }
      c.fillStyle = '#ff7b00'; c.save(); c.translate(140, 285); for (let k = 0; k < 5; k++) { c.rotate(Math.PI * 2 / 5); c.beginPath(); c.ellipse(0, -6, 3, 7, 0, 0, Math.PI * 2); c.fill(); } c.restore();
      c.fillStyle = '#d62828'; c.fillRect(800, 200, 4, 70);         // beach umbrella
      c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(760, 205); c.quadraticCurveTo(802, 160, 846, 205); c.fill();
      c.fillStyle = '#d62828'; c.beginPath(); c.moveTo(780, 205); c.quadraticCurveTo(802, 168, 803, 205); c.fill();
    } else if (v === 'jungle') {
      c.fillStyle = lin(0, H2, ['#1b4332', '#2d6a4f', '#52b788']); c.fillRect(0, 0, W2, H2);
      for (let i = 0; i < 9; i++) blob(i * 110 + 20, 20, 90, 50, ['#081c15', '#1b4332'][i % 2]);
      for (let i = 0; i < 6; i++) { c.fillStyle = '#3a2618'; c.fillRect(i * 160 + 40, 20, 16, H2); }
      c.strokeStyle = '#40916c'; c.lineWidth = 3;                      // hanging vines
      for (let i = 0; i < 12; i++) { const x = i * 75 + 10; c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + 10, 50, x, 70 + hash(i) * 50); c.stroke(); }
      c.fillStyle = lin(210, H2, ['#4cc9f0', '#0077b6']);               // river across the bottom
      c.beginPath(); c.moveTo(0, 250);
      for (let x = 0; x <= W2; x += 20) c.lineTo(x, 245 + Math.sin(x * 0.02 + 1) * 10);
      c.lineTo(W2, H2); c.lineTo(0, H2); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 2;
      for (let x = 0; x < W2; x += 60) { const o = (time * 25) % 60; c.beginPath(); c.moveTo(x + o, 270); c.lineTo(x + o + 20, 270); c.stroke(); }
      for (const x of [30, 300, 560, 830]) for (let k = 0; k < 5; k++) {  // ferns
        c.save(); c.translate(x, 245); c.rotate(-1.2 + k * 0.6); blob(0, -22, 7, 24, '#2d6a4f'); c.restore();
      }
    } else if (v === 'snow') {
      c.fillStyle = lin(0, 160, ['#5b8fc7', '#cfe2f3']); c.fillRect(0, 0, W2, 160);
      for (const [base, amp, col] of [[120, 50, '#8aa5c4'], [150, 40, '#5f7f9f']]) {
        c.fillStyle = col; c.beginPath(); c.moveTo(0, 200);
        for (let x = 0; x <= W2; x += 40) c.lineTo(x, base - Math.abs(Math.sin(x * 0.012 + amp)) * amp - hash(x) * 14);
        c.lineTo(W2, 200); c.fill();
      }
      c.fillStyle = lin(150, H2, ['#ffffff', '#dbe9f6']); c.fillRect(0, 150, W2, H2 - 150);
      for (const [x, y, sc] of [[30, 140, 1], [100, 150, 0.7], [800, 145, 1.1], [730, 155, 0.7]]) {
        for (let k = 0; k < 3; k++) { c.fillStyle = '#1d4a3a'; c.beginPath(); c.moveTo(x - (22 - k * 5) * sc, y - k * 16 * sc); c.lineTo(x, y - (k * 16 + 28) * sc); c.lineTo(x + (22 - k * 5) * sc, y - k * 16 * sc); c.fill(); }
      }
      for (let i = 0; i < 60; i++) { c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc((hash(i) * W2 + time * 10) % W2, (hash(i + 3) * H2 + time * 30) % H2, 1.5 + (i % 3), 0, Math.PI * 2); c.fill(); }
    } else if (v === 'rooftop') {
      c.fillStyle = lin(0, H2, ['#10002b', '#3c096c', '#7b2cbf']); c.fillRect(0, 0, W2, H2);
      for (let i = 0; i < 50; i++) { c.fillStyle = 'rgba(255,255,255,' + (0.4 + 0.4 * Math.sin(time * 2 + i)) + ')'; c.fillRect(hash(i) * W2, hash(i + 9) * 110, 2, 2); }
      blob(90, 50, 22, 22, '#fff8dc');
      for (let i = 0; i < 16; i++) {                                  // skyline with lit windows
        const bw = 40 + hash(i) * 30, bh = 90 + hash(i + 5) * 120, bx = i * 56 - 10;
        c.fillStyle = i % 2 ? '#1a1033' : '#24123f'; c.fillRect(bx, H2 - bh, bw, bh);
        for (let wy = H2 - bh + 10; wy < H2 - 10; wy += 16) for (let wx = bx + 6; wx < bx + bw - 6; wx += 12)
          if (hash(wx * 3 + wy) > 0.45) { c.fillStyle = hash(wx + wy) > 0.8 ? '#ff4d6d' : '#ffd166'; c.fillRect(wx, wy, 5, 7); }
      }
      c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 30;
      for (let k = 0; k < 2; k++) { const a = Math.sin(time * 0.8 + k * 2) * 0.5; c.beginPath(); c.moveTo(250 + k * 380, H2); c.lineTo(250 + k * 380 + Math.sin(a) * 300, 0); c.stroke(); }
    } else { // warehouse
      c.fillStyle = '#5c4033'; c.fillRect(0, 0, W2, H2);
      for (let y = 0; y < 200; y += 16) for (let x = (y / 16) % 2 ? -20 : 0; x < W2; x += 40) {   // brick wall
        c.fillStyle = hash(x + y * 7) > 0.5 ? '#8b4a32' : '#7a3f2a'; c.fillRect(x + 1, y + 1, 38, 14);
      }
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(0, 0, W2, 18);
      for (const x of [140, 430, 720]) {                              // windows with daylight
        c.fillStyle = '#2b2d42'; c.fillRect(x - 50, 30, 100, 60); c.fillStyle = '#a8dadc'; c.fillRect(x - 46, 34, 44, 52); c.fillRect(x + 2, 34, 44, 52);
      }
      c.fillStyle = lin(200, H2, ['#8d99ae', '#5c677d']); c.fillRect(0, 200, W2, H2 - 200);
      c.strokeStyle = '#ffd60a'; c.lineWidth = 6; c.setLineDash([24, 18]); c.beginPath(); c.moveTo(0, 212); c.lineTo(W2, 212); c.stroke(); c.setLineDash([]);
      for (const [x, y, sz] of [[30, 205, 46], [70, 225, 36], [800, 200, 50], [760, 232, 34]]) {   // crates
        c.fillStyle = '#b5835a'; c.fillRect(x - sz / 2, y - sz, sz, sz);
        c.strokeStyle = '#6f4e37'; c.lineWidth = 3; c.strokeRect(x - sz / 2, y - sz, sz, sz);
        c.beginPath(); c.moveTo(x - sz / 2, y - sz); c.lineTo(x + sz / 2, y); c.stroke();
      }
    }
    c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, 0, MAP_W, MAP_H);   // keep the tiles readable
  }
  // chains wrapped round a boss tile that still needs stars
  function drawChains(c, x, y, R, need, have) {
    c.save();
    for (const a of [0.75, -0.75]) {
      c.save(); c.translate(x, y); c.rotate(a);
      for (let k = -4; k <= 4; k++) {
        c.strokeStyle = '#adb5bd'; c.lineWidth = 3.5;
        c.beginPath(); c.ellipse(k * 11, 0, 7, k % 2 ? 2.5 : 4.5, 0, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = '#495057'; c.lineWidth = 1; c.stroke();
      }
      c.restore();
    }
    c.fillStyle = '#ffd60a'; c.strokeStyle = '#7a5c00'; c.lineWidth = 2;   // padlock
    c.fillRect(x - 9, y + 2, 18, 15); c.strokeRect(x - 9, y + 2, 18, 15);
    c.beginPath(); c.arc(x, y + 2, 6, Math.PI, 0); c.stroke();
    c.fillStyle = '#7a5c00'; c.fillRect(x - 1.5, y + 7, 3, 6);
    c.font = '900 14px "Trebuchet MS",sans-serif'; c.textAlign = 'center';
    c.fillStyle = '#0009'; c.fillRect(x - 34, y - R - 40, 68, 20);
    c.fillStyle = '#ffd60a'; c.fillText('★ ' + have + '/' + need, x, y - R - 29);
    c.restore();
  }
  function drawCareerMap() {
    const c = mapCtx;
    c.setTransform(mapCanvas.width / MAP_W, 0, 0, mapCanvas.height / MAP_H, 0, 0);
    drawWorldScenery(c, WORLD_VENUES[careerWorld]);
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
        if (!bossUnlocked(careerWorld)) drawChains(c, q.x, q.y, R, BOSS_NEED[careerWorld], worldStars(careerWorld));
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
        if (level % 10 === 0 && !bossUnlocked(careerWorld)) { toast(t('bossNeed', { n: BOSS_NEED[careerWorld] })); return; }
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
        if (shopTab === 'chars') drawPlayer({ char: it, dark: false, side: 0, squash: 0, onGround: true, y: GROUND }, 45, 62, 0.8, 80, 30, g);
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
    on('btnControls', () => { Sound.click(); startMatch('practice'); });
    on('editorDone', closeEditor);
    on('editorReset', () => {
      save.controls = { dirSize: 92, dirGap: 48, dirX: 20, jumpSize: 92, jumpX: 20 }; applyControls();
      document.querySelectorAll('#editorSliders input').forEach(i => { i.value = save.controls[i.id.slice(4)]; });
    });
    on('btnCareer', () => { Sound.click(); openCareer(); });
    on('worldPrev', () => { careerWorld = Math.max(0, careerWorld - 1); updateWorldBar(); });
    on('worldNext', () => { careerWorld = Math.min(4, careerWorld + 1); updateWorldBar(); });
    on('btn2p', () => { Sound.click(); startMatch('duo'); });
    on('btnCreate', () => { Sound.click(); createRoom(); });
    on('btnJoin', () => { Sound.click(); openJoin(); });
    on('btnJoinGo', () => { Sound.click(); joinRoom(); });
    on('btnOnBack', () => { Sound.click(); leaveOnline(); goMenu(); });
    document.getElementById('onInput').addEventListener('keydown', e => { if (e.key === 'Enter') joinRoom(); });
    on('btnShop', () => { Sound.click(); shopTab = 'chars'; buildShop(); showScreen('shop'); });
    on('tabChars', () => { shopTab = 'chars'; buildShop(); });
    on('tabBalls', () => { shopTab = 'balls'; buildShop(); });
    on('tabSupers', () => { shopTab = 'supers'; buildShop(); });
    on('btnMute', () => { save.muted = !save.muted; persist(); updateMute(); });
    on('btnFull', () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else goFullscreen();
    });
    if (onCrazy || !canFull) document.getElementById('btnFull').classList.add('hidden');
    on('btnPause', pauseGame);
    on('btnResume', resumeGame);
    on('btnQuit', () => { Platform.gameplayStop(); goMenu(); });   // also leaves an online match
    on('btnMenu', goMenu);
    on('btnNext', () => {
      const r = lastResult;
      if (kind === 'online') requestRematch();
      else if (kind === 'duo') startMatch('duo');
      else if (kind === 'career') {
        const nxt = careerLevel + 1;
        if (r.won && nxt % 10 === 0 && !bossUnlocked(Math.floor((nxt - 1) / 10))) { openCareer(); toast(t('bossNeed', { n: BOSS_NEED[Math.floor((nxt - 1) / 10)] })); }
        else if (r.won && careerLevel < CAREER_LEVELS) startMatch('career', nxt);
        else if (r.won) openCareer();
        else startMatch('career', careerLevel);
      } else if (r.won && save.tourRun) startMatch('tour');
      else openTour();
    });
    on('btnDouble', async () => {
      const ok = await runAd('rewarded');
      if (ok) {
        save.coins += lastResult.bonus; persist();
        document.getElementById('resCoins').textContent = t('coinsEarned', { n: lastResult.coins + lastResult.bonus });
        Sound.win();
      } else {
        toast(t('adUnavailable'));
      }
      afterRewardChoice();
    });
    on('btnNoThanks', afterRewardChoice);
    on('btnClaim', claimPrize);
    document.querySelectorAll('#trophy .box').forEach((b, i) => b.addEventListener('click', () => openBox(i)));
    on('btnTrophyGo', () => { Sound.click(); trophyOpen = false; showResult(true); });
    document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => { Sound.click(); goMenu(); }));
    if (isTouch) {
      document.querySelector('#menu .hint').classList.add('hidden');
      document.getElementById('btn2p').classList.add('hidden');      // 2 players is keyboard-only for now
      document.getElementById('btnControls').classList.remove('hidden');
    }
    const standalone = matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches;
    if (standalone) document.getElementById('btnFull').classList.add('hidden');
  }

  // ---------- Online (2 devices, peer to peer) ----------
  // The room creator is the host: it runs the whole match and streams snapshots;
  // the guest only sends its buttons and draws what it receives.
  let net = null;
  const ROOM_ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const roomId = code => 'spikeduel-v1-' + code;
  function netEvent(e) { if (net && net.role === 'host' && kind === 'online' && state !== 'result') net.ev.push(e); }
  // PeerJS cloud broker by default (it also provides STUN/TURN); tests can point to a local server
  const peerOpts = () => Object.assign({}, window.SPIKE_PEER_OPTS || {});
  let peerLib = null;
  function loadPeer() {
    if (window.Peer) return Promise.resolve();
    if (!peerLib) peerLib = new Promise((res, rej) => {
      const tag = document.createElement('script');
      tag.src = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
      tag.onload = () => res(); tag.onerror = () => { peerLib = null; rej(new Error('peerjs')); };
      document.head.appendChild(tag);
    });
    return peerLib;
  }
  // mirror sounds to the guest (a point for the host is a lost point for the guest)
  ['hit', 'spike', 'superSpike', 'effect', 'jump', 'point', 'lose', 'count'].forEach(name => {
    const fn = Sound[name];
    Sound[name] = (...a) => { netEvent(['a', name, a[0]]); fn(...a); };
  });
  function onlineScreen(title, showCode, showInput) {
    document.getElementById('onTitle').textContent = title;
    document.getElementById('onCode').classList.toggle('hidden', !showCode);
    document.getElementById('onJoinRow').classList.toggle('hidden', !showInput);
    showScreen('online');
  }
  const onNote = txt => { document.getElementById('onNote').textContent = txt; };
  function newNet(role) {
    leaveOnline();
    net = { role, peer: null, conn: null, code: '', rin: { left: false, right: false, jump: false }, ev: [],
      meReady: false, remReady: false, sendAcc: 0, guest: null, lastIn: '',
      send(m) { try { if (this.conn && this.conn.open) this.conn.send(m); } catch (e) { /* closed */ } } };
    return net;
  }
  function createRoom() {
    const n = newNet('host');
    onlineScreen(t('createRoom'), true, false);
    document.getElementById('onCode').textContent = '····';
    onNote(t('connecting'));
    loadPeer().then(() => {
      const tryOpen = () => {
        if (net !== n) return;
        n.code = Array.from({ length: 4 }, () => ROOM_ABC[Math.floor(Math.random() * ROOM_ABC.length)]).join('');
        const peer = n.peer = new window.Peer(roomId(n.code), peerOpts());
        peer.on('open', () => { document.getElementById('onCode').textContent = n.code; onNote(t('shareCode')); });
        peer.on('error', e => {
          if (net !== n) return;
          if (e.type === 'unavailable-id') { peer.destroy(); tryOpen(); }
          else if (!n.conn) onNote(t('netFail'));
        });
        peer.on('connection', c => {
          if (n.conn) { c.on('open', () => c.close()); return; }
          n.conn = c; wireConn(n, c);
        });
      };
      tryOpen();
    }).catch(() => onNote(t('netFail')));
  }
  function openJoin() {
    newNet('guest');
    onlineScreen(t('joinRoom'), false, true);
    onNote(t('enterCode'));
    const inp = document.getElementById('onInput');
    inp.value = '';
    if (!isTouch) setTimeout(() => inp.focus(), 50);
  }
  function joinRoom() {
    const code = document.getElementById('onInput').value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length !== 4) { onNote(t('enterCode')); return; }
    const n = newNet('guest');
    n.code = code;
    onNote(t('connecting'));
    loadPeer().then(() => {
      if (net !== n) return;
      const peer = n.peer = new window.Peer(undefined, peerOpts());
      const fail = setTimeout(() => { if (net === n && !(n.conn && n.conn.open)) onNote(t('netFail')); }, 15000);
      peer.on('open', () => {
        const c = n.conn = peer.connect(roomId(code), { reliable: true });
        wireConn(n, c);
        c.on('open', () => { clearTimeout(fail); c.send({ t: 'hi', ch: save.char, su: save.superSel, v: 1 }); });
      });
      peer.on('error', e => {
        if (net !== n) return;
        clearTimeout(fail);
        onNote(e.type === 'peer-unavailable' ? t('noRoom') : t('netFail'));
      });
    }).catch(() => onNote(t('netFail')));
  }
  function wireConn(n, c) {
    c.on('data', m => { if (net === n) onNetData(m); });
    const lost = () => {
      if (net !== n) return;
      const wasPlaying = kind === 'online';
      leaveOnline();
      if (wasPlaying || document.getElementById('online').classList.contains('hidden') === false) {
        goMenu(); toast(t('rivalLeft'));
      }
    };
    c.on('close', lost); c.on('error', lost);
  }
  function leaveOnline() {
    if (!net) return;
    const n = net; net = null;
    try { if (n.conn) n.conn.close(); } catch (e) { /* already closed */ }
    try { if (n.peer) n.peer.destroy(); } catch (e) { /* already gone */ }
  }
  function onNetData(m) {
    if (!m || typeof m !== 'object') return;
    if (net.role === 'host') {
      if (m.t === 'hi') { net.guest = { ch: m.ch | 0, su: m.su | 0 }; net.guest.ch %= CHARS.length; net.guest.su %= SUPERS.length; startMatch('online'); }
      else if (m.t === 'in') { net.rin.left = !!m.l; net.rin.right = !!m.r; net.rin.jump = !!m.j; }
      else if (m.t === 're') { net.remReady = true; checkRematch(); }
    } else {
      if (m.t === 'start') guestStart(m);
      else if (m.t === 's') guestSnapshot(m);
      else if (m.t === 'end') { score = m.sc; onlineEnd(); }
      else if (m.t === 're') { net.remReady = true; document.getElementById('resNote').textContent = (LANG === 'es' ? '¿' : '') + t('rematch') + '?'; }
    }
  }
  // host -> guest, about 30 times a second
  function hostSend(dt) {
    if (!net || net.role !== 'host' || kind !== 'online' || !players.length || state === 'result') return;
    net.sendAcc += dt;
    if (net.sendAcc < 1 / 30) return;
    net.sendAcc = 0;
    const r1 = v => Math.round(v * 10) / 10;
    net.send({
      t: 's', st: state, cd: r1(countdown), sc: score, sh: r1(shake), wf: [r1(wallFlash[0]), r1(wallFlash[1])],
      pl: players.map(p => [r1(p.x), r1(p.y), r1(p.vx), r1(p.vy), r1(p.r), r1(p.squash), p.onGround ? 1 : 0, r1(p.power), p.fx]),
      b: ball ? [r1(ball.x), r1(ball.y), r1(ball.vx), r1(ball.vy), r1(ball.angle), r1(ball.spin), ball.super, ball.superOwner, r1(ball.r)] : null,
      fk: fakes.map(f => [r1(f.x), r1(f.y), r1(f.vx), r1(f.vy)]),
      ev: net.ev.splice(0),
    });
  }
  // guest -> host, whenever the buttons change (and every half second just in case)
  function guestSendInput(dt) {
    if (!net || net.role !== 'guest' || kind !== 'online') return;
    readInput();
    const i = input[0], key = (i.left ? 'l' : '') + (i.right ? 'r' : '') + (i.jump ? 'j' : '');
    net.sendAcc += dt;
    if (key !== net.lastIn || net.sendAcc > 0.5) { net.lastIn = key; net.sendAcc = 0; net.send({ t: 'in', l: i.left, r: i.right, j: i.jump }); }
  }
  function guestStart(m) {
    kind = 'online'; mode = 'solo'; score = [0, 0]; particles = []; fakes = []; server = 0;
    venue = m.venue;
    players = [makePlayer(0, m.ch[0], false, 1, m.su[0]), makePlayer(1, m.ch[1], false, 1, m.su[1])];
    players[1].dark = m.ch[0] === m.ch[1];
    net.meReady = net.remReady = false;
    fit();
    ball = { x: 200, y: 170, vx: 0, vy: 0, spin: 0, angle: 0, trail: [], super: null, superOwner: -1, r: BR };
    showScreen(null);
    const touch = document.getElementById('touch');
    touch.classList.toggle('hidden', !isTouch); touch.classList.add('solo'); touch.classList.remove('duo');
    document.getElementById('hud').classList.remove('hidden');
    state = 'countdown'; countdown = 3;
    Platform.gameplayStart();
  }
  function guestSnapshot(m) {
    if (state === 'result' || !players.length) return;
    state = m.st; countdown = m.cd; score = m.sc; shake = Math.max(shake, m.sh); wallFlash[0] = m.wf[0]; wallFlash[1] = m.wf[1];
    m.pl.forEach((a, i) => {
      const p = players[i];
      [p.x, p.y, p.vx, p.vy, p.r, p.squash, p.onGround, p.power] = a; p.onGround = !!p.onGround; p.fx = a[8];
    });
    if (m.b) {
      const b = m.b;
      [ball.x, ball.y, ball.vx, ball.vy, ball.angle, ball.spin, ball.super, ball.superOwner, ball.r] = b;
    }
    fakes = m.fk.map(f => ({ x: f[0], y: f[1], vx: f[2], vy: f[3], angle: 0, spin: 0 }));
    for (const e of m.ev) {
      if (e[0] === 'b') { banner = e[1]; bannerTimer = e[2]; bannerColor = e[3]; }
      else if (e[0] === 'p') burst(e[1], e[2], e[3], e[4]);
      else if (e[0] === 's') sand(e[1]);
      else if (e[0] === 'a') {
        const name = e[1] === 'point' ? 'lose' : e[1] === 'lose' ? 'point' : e[1];
        if (Sound[name]) Sound[name](e[2]);
      }
    }
  }
  // the guest keeps things moving smoothly between snapshots
  function guestUpdate(dt) {
    time += dt;
    if (bannerTimer > 0) bannerTimer -= dt;
    shake = Math.max(0, shake - dt);
    for (const w of [0, 1]) wallFlash[w] = Math.max(0, wallFlash[w] - dt);
    for (const pt of particles) { pt.vy += 900 * dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.life -= dt; }
    particles = particles.filter(pt => pt.life > 0);
    if (state === 'countdown') countdown = Math.max(0, countdown - dt);
    if (state !== 'playing' || !ball) return;
    for (const p of players) { p.x += p.vx * dt; p.y = Math.min(GROUND, p.y + p.vy * dt); }
    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > 10) ball.trail.shift();
    ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.angle += ball.spin * dt;
    for (const f of fakes) { f.x += f.vx * dt; f.y += f.vy * dt; }
  }
  function onlineEnd() {
    state = 'result';
    Platform.gameplayStop();
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('touch').classList.add('hidden');
    const me = net && net.role === 'guest' ? 1 : 0;
    const won = score[me] > score[1 - me];
    const coins = won ? 15 : 5;
    save.coins += coins; persist();
    if (won) Sound.win(); else Sound.lose();
    if (net) net.meReady = net.remReady = false;
    lastResult = { won, coins, title: won ? t('youWin') : t('youLose'), note: '' };
    showResult(false);
    document.getElementById('resScore').textContent = score[me] + ' - ' + score[1 - me];
  }
  function requestRematch() {
    if (!net) { goMenu(); return; }
    net.meReady = true;
    net.send({ t: 're' });
    document.getElementById('resNote').textContent = t('waitRival');
    checkRematch();
  }
  function checkRematch() {
    if (net && net.role === 'host' && net.meReady && net.remReady) { net.meReady = net.remReady = false; startMatch('online'); }
  }

  // ---------- Loop ----------
  let last = 0, acc = 0;
  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;
    if (state === 'menu') time += dt;
    acc += dt;
    while (acc >= STEP) { update(STEP); acc -= STEP; }
    hostSend(dt); guestSendInput(dt);
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
    applyControls();
    Platform.loadingStop();
    goMenu();
    requestAnimationFrame(frame);
  }

  // Exposed for automated tests only.
  window.__spike = {
    get state() { return state; }, get score() { return score; }, get ball() { return ball; },
    get players() { return players; }, get fakes() { return fakes; }, startMatch, save, openCareer, openTour,
    newTourRun, careerRival, setVenue(v) { venue = v; }, get net() { return net; }, get kind() { return kind; }, showTrophy, get lastResult() { return lastResult; }, set lastResult(v) { lastResult = v; },
    tick(n) { for (let i = 0; i < n; i++) update(STEP); },
    effect(side, id) { applySuperEffect(players[side], id); },
  };

  boot();
})();
