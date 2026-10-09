const path = require('path');
const http = require('http');
const crypto = require('crypto');
const express = require('express');
const { Server } = require('socket.io');
const { TIERS, CATALOG } = require('./data/categories');

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = 5;
const MIN_PLAYERS = Number(process.env.MIN_PLAYERS || 2);
const ITEMS_PER_PLAYER = 4;
const START_COINS = 20;
const FIRST_TIMER_MS = 10000;
const BID_TIMER_MS = 5000;
const REVEAL_MS = 2500;
const SOLD_MS = 4200;
const CATEGORY_REVEAL_MS = 4000;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));
// ---------- Imágenes con IA (Pollinations) ----------
// El servidor hace de intermediario: pone las peticiones en cola (el servicio gratuito
// solo admite una a la vez por IP), reintenta si falla y guarda el resultado en memoria
// para que todos los jugadores reciban la misma imagen al instante.
const IMG_TOKEN = process.env.POLLINATIONS_TOKEN || '';
const IMG_MAX_ACTIVE = IMG_TOKEN ? 3 : 1;
const IMG_CACHE_MAX = 400;
const imgCache = new Map(); // key -> { buf, type }
const imgPending = new Map(); // key -> { promise, job }
const imgQueue = [];
let imgActive = 0;

const findItem = id => {
  const cat = CATALOG[String(id).split('-')[0]];
  return cat && cat.items.find(i => i.id === id);
};
const seedOf = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 100000;

function itemImageJob(item) {
  const cat = CATALOG[item.id.split('-')[0]];
  return { key: `item:${item.id}`, prompt: `${item.name}, ${cat.itemPrompt}`, seed: seedOf(item.id), size: 512 };
}
function sceneImageJob(catKey, items) {
  const cat = CATALOG[catKey];
  const ids = items.map(i => i.id).sort();
  return {
    key: `scene:${catKey}:${ids.join(',')}`,
    prompt: `Featuring all of these clearly visible: ${items.map(i => i.name).join('; ')}. Setting: ${cat.scenePrompt}`,
    seed: 4242, size: 768,
  };
}

function requestImage(job, urgent = false) {
  if (imgCache.has(job.key)) return Promise.resolve(imgCache.get(job.key));
  const pending = imgPending.get(job.key);
  if (pending) {
    if (urgent) { const i = imgQueue.indexOf(pending.job); if (i > 0) { imgQueue.splice(i, 1); imgQueue.unshift(pending.job); } }
    return pending.promise;
  }
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  promise.catch(() => {});
  Object.assign(job, { resolve, reject });
  imgPending.set(job.key, { promise, job });
  urgent ? imgQueue.unshift(job) : imgQueue.push(job);
  pumpImages();
  return promise;
}

function pumpImages() {
  while (imgActive < IMG_MAX_ACTIVE && imgQueue.length) {
    const job = imgQueue.shift();
    imgActive++;
    fetchImage(job)
      .then(img => {
        imgCache.set(job.key, img);
        if (imgCache.size > IMG_CACHE_MAX) imgCache.delete(imgCache.keys().next().value);
        job.resolve(img);
      })
      .catch(err => job.reject(err))
      .finally(() => { imgPending.delete(job.key); imgActive--; pumpImages(); });
  }
}

async function fetchImage({ prompt, seed, size }) {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${size}&height=${size}&seed=${seed}&nologo=true`;
  const headers = IMG_TOKEN ? { Authorization: `Bearer ${IMG_TOKEN}` } : {};
  let lastErr;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(60000) });
      const type = res.headers.get('content-type') || '';
      if (res.ok && type.startsWith('image/')) return { buf: Buffer.from(await res.arrayBuffer()), type };
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) { lastErr = e; }
    await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
  }
  throw lastErr;
}

async function sendImage(res, job) {
  try {
    const img = await requestImage(job, true);
    res.set('Cache-Control', 'public, max-age=604800').type(img.type).send(img.buf);
  } catch {
    res.status(502).end();
  }
}

app.get('/img/item/:id', (req, res) => {
  const item = findItem(req.params.id);
  if (!item) return res.status(404).end();
  sendImage(res, itemImageJob(item));
});

app.get('/img/scene/:cat/:ids', (req, res) => {
  const ids = req.params.ids.split(',');
  const items = ids.map(findItem);
  if (!CATALOG[req.params.cat] || ids.length < 1 || ids.length > 4 || items.some(i => !i || !i.id.startsWith(req.params.cat + '-'))) return res.status(404).end();
  sendImage(res, sceneImageJob(req.params.cat, items));
});

app.get('/api/categories', (_req, res) => {
  res.json({
    tiers: TIERS,
    categories: Object.values(CATALOG).map(c => ({ key: c.key, name: c.name, emoji: c.emoji, count: c.items.length })),
  });
});

/** @type {Map<string, any>} */
const rooms = new Map();

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newCode() {
  let code;
  do {
    code = Array.from({ length: 4 }, () => CODE_CHARS[crypto.randomInt(CODE_CHARS.length)]).join('');
  } while (rooms.has(code));
  return code;
}

const rand = arr => arr[crypto.randomInt(arr.length)];
const cleanName = n => String(n || '').replace(/\s+/g, ' ').trim().slice(0, 16);

function uniqueName(room, name) {
  const taken = new Set(room.players.map(p => p.name.toLowerCase()));
  if (!taken.has(name.toLowerCase())) return name;
  for (let i = 2; ; i++) if (!taken.has(`${name} ${i}`.toLowerCase())) return `${name} ${i}`;
}

function makePlayer(name, socket) {
  return { id: crypto.randomUUID(), token: crypto.randomUUID(), name, socketId: socket.id, connected: true, coins: START_COINS, items: [] };
}

// Elige N objetos sin repetir, priorizando los que no han salido en partidas anteriores de la sala.
function buildDeck(room, catKey, n) {
  const cat = CATALOG[catKey];
  const used = room.used[catKey] || (room.used[catKey] = new Set());
  const fresh = cat.items.filter(i => !used.has(i.id));
  if (fresh.length < n) used.clear();
  const pool = (fresh.length < n ? cat.items : fresh).slice();
  const deck = [];
  const tierKeys = Object.keys(TIERS);
  while (deck.length < n) {
    const total = tierKeys.reduce((s, t) => s + (pool.some(i => i.tier === t) ? TIERS[t].weight : 0), 0);
    let r = crypto.randomInt(total);
    let tier = tierKeys.find(t => pool.some(i => i.tier === t) && (r -= TIERS[t].weight) < 0);
    const options = pool.filter(i => i.tier === tier);
    const pick = rand(options);
    pool.splice(pool.indexOf(pick), 1);
    used.add(pick.id);
    deck.push(pick);
  }
  return deck;
}

function publicState(room) {
  const a = room.auction;
  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    categoryChoice: room.categoryChoice,
    category: room.category ? { key: room.category, name: CATALOG[room.category].name, emoji: CATALOG[room.category].emoji, itemPrompt: CATALOG[room.category].itemPrompt, scenePrompt: CATALOG[room.category].scenePrompt } : null,
    categoryChoices: Object.values(CATALOG).map(c => ({ key: c.key, name: c.name, emoji: c.emoji })),
    itemIndex: room.itemIndex,
    totalItems: room.deck.length,
    nextItem: room.deck[room.itemIndex] || null,
    players: room.players.map(p => ({
      id: p.id, name: p.name, connected: p.connected, coins: p.coins, items: p.items,
      voted: !!room.votes[p.id],
    })),
    auction: a ? {
      item: a.item, bid: a.bid, leaderId: a.leaderId, endsAt: a.endsAt, startsAt: a.startsAt,
      passed: [...a.passed], eligible: a.eligible, history: a.history.slice(-8),
    } : null,
    sold: room.sold,
    results: room.results,
    serverNow: Date.now(),
  };
}

function broadcast(room) {
  io.to(room.code).emit('state', publicState(room));
}

function clearTimer(room) {
  if (room.timer) clearTimeout(room.timer);
  room.timer = null;
}

function schedule(room, ms, fn) {
  clearTimer(room);
  room.timer = setTimeout(() => { room.timer = null; fn(); }, ms);
}

function startGame(room) {
  const catKey = room.categoryChoice === 'random' ? rand(Object.keys(CATALOG)) : room.categoryChoice;
  room.category = catKey;
  room.deck = buildDeck(room, catKey, room.players.length * ITEMS_PER_PLAYER);
  room.itemIndex = 0;
  room.votes = {};
  room.results = null;
  room.sold = null;
  room.auction = null;
  room.players.forEach(p => { p.coins = START_COINS; p.items = []; });
  room.deck.forEach(item => requestImage(itemImageJob(item)).catch(() => {}));
  room.phase = 'category';
  broadcast(room);
  schedule(room, room.categoryChoice === 'random' ? CATEGORY_REVEAL_MS : 2500, () => nextItem(room));
}

function nextItem(room) {
  room.sold = null;
  const eligible = room.players.filter(p => p.items.length < ITEMS_PER_PLAYER);
  if (!eligible.length || room.itemIndex >= room.deck.length) return startVoting(room);
  const item = room.deck[room.itemIndex++];
  room.auction = {
    item, bid: 0, leaderId: null, passed: new Set(), history: [],
    eligible: eligible.map(p => p.id), startsAt: Date.now() + REVEAL_MS, endsAt: Date.now() + REVEAL_MS + FIRST_TIMER_MS,
  };
  if (eligible.length === 1) {
    // Solo queda una persona con huecos: se lo lleva directamente.
    room.phase = 'reveal';
    broadcast(room);
    schedule(room, REVEAL_MS, () => award(room, eligible[0], 0, 'unico'));
    return;
  }
  room.phase = 'reveal';
  broadcast(room);
  schedule(room, REVEAL_MS, () => {
    room.phase = 'auction';
    room.auction.endsAt = Date.now() + FIRST_TIMER_MS;
    broadcast(room);
    schedule(room, FIRST_TIMER_MS, () => closeAuction(room));
    checkEarlyEnd(room);
  });
}

// Jugadores que todavía pueden superar la puja actual.
function activeBidders(room) {
  const a = room.auction;
  return room.players.filter(p =>
    a.eligible.includes(p.id) && p.connected && !a.passed.has(p.id) && p.id !== a.leaderId && p.coins > a.bid);
}

function checkEarlyEnd(room) {
  if (room.phase !== 'auction') return;
  if (activeBidders(room).length === 0) closeAuction(room);
}

function closeAuction(room) {
  if (room.phase !== 'auction') return;
  clearTimer(room);
  const a = room.auction;
  const leader = a.leaderId && room.players.find(p => p.id === a.leaderId);
  if (leader) return award(room, leader, a.bid, 'puja');
  // Nadie ha pujado: se adjudica gratis, primero a quien no tenga dinero.
  const eligible = room.players.filter(p => a.eligible.includes(p.id));
  const broke = eligible.filter(p => p.coins === 0);
  let pool = broke;
  if (!pool.length) {
    const min = Math.min(...eligible.map(p => p.coins));
    pool = eligible.filter(p => p.coins === min);
  }
  award(room, rand(pool), 0, 'nadie');
}

function award(room, player, price, reason) {
  clearTimer(room);
  const item = room.auction.item;
  player.coins -= price;
  player.items.push({ ...item, price });
  room.phase = 'sold';
  room.sold = { item, winnerId: player.id, winnerName: player.name, price, reason };
  broadcast(room);
  schedule(room, SOLD_MS, () => nextItem(room));
}

function startVoting(room) {
  clearTimer(room);
  room.auction = null;
  room.sold = null;
  room.phase = 'voting';
  room.votes = {};
  room.players.forEach(p => p.items.length && requestImage(sceneImageJob(room.category, p.items)).catch(() => {}));
  broadcast(room);
}

function maybeFinishVoting(room) {
  const pending = room.players.filter(p => p.connected && !room.votes[p.id]);
  if (pending.length === 0) finishVoting(room);
}

function finishVoting(room) {
  const results = room.players.map(p => {
    const scores = Object.entries(room.votes)
      .filter(([voter]) => voter !== p.id)
      .map(([, v]) => v[p.id])
      .filter(s => typeof s === 'number');
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const votes = Object.entries(room.votes)
      .filter(([voter, v]) => voter !== p.id && typeof v[p.id] === 'number')
      .map(([voter, v]) => ({ from: room.players.find(x => x.id === voter)?.name || '?', score: v[p.id] }));
    return { id: p.id, name: p.name, avg: Math.round(avg * 100) / 100, votes, coins: p.coins };
  }).sort((a, b) => b.avg - a.avg || b.coins - a.coins);
  room.results = results;
  room.phase = 'results';
  broadcast(room);
}

function removePlayer(room, player) {
  room.players = room.players.filter(p => p !== player);
  if (!room.players.length) { clearTimer(room); rooms.delete(room.code); return; }
  if (room.hostId === player.id) room.hostId = room.players[0].id;
}

function findBySocket(socket) {
  const room = rooms.get(socket.data.code);
  if (!room) return {};
  return { room, player: room.players.find(p => p.id === socket.data.playerId) };
}

function attach(socket, room, player) {
  socket.data.code = room.code;
  socket.data.playerId = player.id;
  player.socketId = socket.id;
  player.connected = true;
  socket.join(room.code);
  socket.emit('joined', { code: room.code, playerId: player.id, token: player.token });
  broadcast(room);
}

io.on('connection', socket => {
  const fail = (cb, msg) => typeof cb === 'function' && cb({ ok: false, error: msg });
  const ok = (cb, extra) => typeof cb === 'function' && cb({ ok: true, ...extra });

  socket.on('create', ({ name, category } = {}, cb) => {
    name = cleanName(name);
    if (!name) return fail(cb, 'Escribe tu nombre');
    if (category !== 'random' && !CATALOG[category]) return fail(cb, 'Categoría no válida');
    const code = newCode();
    const player = makePlayer(name, socket);
    const room = {
      code, hostId: player.id, phase: 'lobby', categoryChoice: category, category: null,
      players: [player], deck: [], itemIndex: 0, auction: null, sold: null, votes: {}, results: null, used: {}, timer: null,
    };
    rooms.set(code, room);
    attach(socket, room, player);
    ok(cb, { code });
  });

  socket.on('join', ({ name, code } = {}, cb) => {
    name = cleanName(name);
    code = String(code || '').toUpperCase().trim();
    if (!name) return fail(cb, 'Escribe tu nombre');
    const room = rooms.get(code);
    if (!room) return fail(cb, 'No existe ninguna sala con ese código');
    if (room.phase !== 'lobby') return fail(cb, 'La partida ya ha empezado');
    if (room.players.length >= MAX_PLAYERS) return fail(cb, 'La sala está llena (máximo 5)');
    const player = makePlayer(uniqueName(room, name), socket);
    room.players.push(player);
    attach(socket, room, player);
    ok(cb, { code });
  });

  socket.on('resume', ({ code, token } = {}, cb) => {
    const room = rooms.get(String(code || '').toUpperCase());
    const player = room && room.players.find(p => p.token === token);
    if (!player) return fail(cb, 'expired');
    attach(socket, room, player);
    ok(cb);
  });

  socket.on('setCategory', ({ category } = {}) => {
    const { room, player } = findBySocket(socket);
    if (!room || room.phase !== 'lobby' || room.hostId !== player?.id) return;
    if (category !== 'random' && !CATALOG[category]) return;
    room.categoryChoice = category;
    broadcast(room);
  });

  socket.on('start', (_d, cb) => {
    const { room, player } = findBySocket(socket);
    if (!room || room.hostId !== player?.id) return fail(cb, 'Solo el anfitrión puede empezar');
    if (room.phase !== 'lobby') return fail(cb, 'La partida ya ha empezado');
    if (room.players.length < MIN_PLAYERS) return fail(cb, `Hacen falta al menos ${MIN_PLAYERS} jugadores`);
    startGame(room);
    ok(cb);
  });

  socket.on('bid', ({ amount } = {}, cb) => {
    const { room, player } = findBySocket(socket);
    if (!room || !player || room.phase !== 'auction') return fail(cb, 'Ahora no se puede pujar');
    const a = room.auction;
    amount = Math.floor(Number(amount));
    if (!a.eligible.includes(player.id)) return fail(cb, 'Ya tienes tus 4 objetos');
    if (a.passed.has(player.id)) return fail(cb, 'Ya te has retirado de esta puja');
    if (a.leaderId === player.id) return fail(cb, 'Ya vas ganando tú');
    if (!Number.isFinite(amount) || amount <= a.bid) return fail(cb, `Alguien se te adelantó: la puja ya está en ${a.bid}`);
    if (amount > player.coins) return fail(cb, `Solo tienes ${player.coins} monedas`);
    a.bid = amount;
    a.leaderId = player.id;
    a.endsAt = Date.now() + BID_TIMER_MS;
    a.history.push({ name: player.name, amount, t: Date.now() });
    schedule(room, BID_TIMER_MS, () => closeAuction(room));
    broadcast(room);
    ok(cb);
    checkEarlyEnd(room);
  });

  socket.on('pass', (_d, cb) => {
    const { room, player } = findBySocket(socket);
    if (!room || !player || room.phase !== 'auction') return fail(cb, 'Ahora no');
    const a = room.auction;
    if (a.leaderId === player.id) return fail(cb, 'Vas ganando, no puedes retirarte');
    a.passed.add(player.id);
    broadcast(room);
    ok(cb);
    checkEarlyEnd(room);
  });

  socket.on('vote', ({ scores } = {}, cb) => {
    const { room, player } = findBySocket(socket);
    if (!room || !player || room.phase !== 'voting') return fail(cb, 'Ahora no se vota');
    const clean = {};
    for (const p of room.players) {
      if (p.id === player.id) continue;
      const s = Number(scores?.[p.id]);
      if (!Number.isFinite(s) || s < 0 || s > 10) return fail(cb, `Pon una nota de 0 a 10 a ${p.name}`);
      clean[p.id] = Math.round(s * 10) / 10;
    }
    room.votes[player.id] = clean;
    broadcast(room);
    ok(cb);
    maybeFinishVoting(room);
  });

  socket.on('forceResults', () => {
    const { room, player } = findBySocket(socket);
    if (room && room.phase === 'voting' && room.hostId === player?.id) finishVoting(room);
  });

  socket.on('again', () => {
    const { room, player } = findBySocket(socket);
    if (!room || room.phase !== 'results' || room.hostId !== player?.id) return;
    room.players = room.players.filter(p => p.connected);
    room.players.forEach(p => { p.coins = START_COINS; p.items = []; });
    Object.assign(room, { phase: 'lobby', category: null, deck: [], itemIndex: 0, auction: null, sold: null, votes: {}, results: null });
    broadcast(room);
  });

  socket.on('leave', () => {
    const { room, player } = findBySocket(socket);
    if (!room || !player) return;
    socket.leave(room.code);
    socket.data.code = null;
    if (room.phase === 'lobby') removePlayer(room, player);
    else { player.connected = false; player.socketId = null; }
    if (rooms.has(room.code)) { broadcast(room); onPlayerGone(room); }
  });

  socket.on('disconnect', () => {
    const { room, player } = findBySocket(socket);
    if (!room || !player || player.socketId !== socket.id) return;
    if (room.phase === 'lobby') removePlayer(room, player);
    else { player.connected = false; player.disconnectedAt = Date.now(); }
    if (rooms.has(room.code)) { broadcast(room); onPlayerGone(room); }
  });
});

function onPlayerGone(room) {
  if (room.phase === 'auction') checkEarlyEnd(room);
  if (room.phase === 'voting') maybeFinishVoting(room);
  // Si el anfitrión se va, otro jugador conectado pasa a ser anfitrión.
  const host = room.players.find(p => p.id === room.hostId);
  if (host && !host.connected) {
    const other = room.players.find(p => p.connected);
    if (other) { room.hostId = other.id; broadcast(room); }
  }
}

// Limpieza de salas abandonadas.
setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) {
    const alive = room.players.some(p => p.connected);
    if (!alive) {
      room.emptySince = room.emptySince || now;
      if (now - room.emptySince > 10 * 60 * 1000) { clearTimer(room); rooms.delete(room.code); }
    } else room.emptySince = null;
  }
}, 60 * 1000).unref();

server.listen(PORT, () => console.log(`PUJAZO escuchando en http://localhost:${PORT}`));

module.exports = { server };
