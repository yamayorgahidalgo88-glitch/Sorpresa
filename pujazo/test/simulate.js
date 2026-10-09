// Simula una partida completa con 3 bots: node test/simulate.js
const { io } = require('socket.io-client');
const URL = process.env.URL || 'http://localhost:3000';
const assert = require('assert');
const emit = (s, ev, d) => new Promise(r => s.emit(ev, d, r));
const mk = () => new Promise(r => { const s = io(URL, { forceNew: true }); s.on('connect', () => r(s)); });

(async () => {
  const [a, b, c] = await Promise.all([mk(), mk(), mk()]);
  const ids = new Map();
  for (const s of [a, b, c]) s.on('joined', d => ids.set(s, d.playerId));
  const r = await emit(a, 'create', { name: 'Yago', category: 'random' });
  assert(r.ok && /^[A-Z0-9]{4}$/.test(r.code), 'código');
  assert((await emit(b, 'join', { name: 'Lucía', code: r.code.toLowerCase() })).ok);
  assert((await emit(c, 'join', { name: 'Yago', code: r.code })).ok);
  let last;
  a.on('state', s => last = s);
  const bots = [a, b, c];
  let seenItem = null, soldCount = 0, raceRejected = false;
  const done = new Promise(res => {
    a.on('state', async s => {
      if (s.phase === 'auction' && s.auction.item.id !== seenItem) {
        seenItem = s.auction.item.id;
        // Carrera: dos bots pujan 1 a la vez → uno debe ser rechazado
        const res2 = await Promise.all([emit(a, 'bid', { amount: 1 }), emit(b, 'bid', { amount: 1 })]);
        if (res2.filter(x => x.ok).length === 1 && res2.some(x => !x.ok)) raceRejected = true;
        for (const bot of bots) emit(bot, 'pass');
      }
      if (s.phase === 'sold' && s.sold) soldCount = s.itemIndex;
      if (s.phase === 'voting') res(s);
    });
  });
  assert((await emit(a, 'start')).ok);
  const voting = await done;
  console.log('Categoría:', voting.category.name, '| objetos:', voting.totalItems);
  for (const p of voting.players) {
    console.log(` ${p.name}: ${p.items.length} cosas, ${p.coins} monedas ->`, p.items.map(i => `${i.emoji}${i.price}`).join(' '));
    assert.strictEqual(p.items.length, 4);
    assert.strictEqual(p.coins + p.items.reduce((t, i) => t + i.price, 0), 20);
  }
  assert(raceRejected, 'la carrera de pujas debe rechazar una');
  assert(new Set(voting.players.flatMap(p => p.items.map(i => i.id))).size === 12, 'sin repetidos');
  const resultsP = new Promise(res => a.on('state', s => s.phase === 'results' && res(s)));
  for (const bot of bots) {
    const me = ids.get(bot);
    const scores = Object.fromEntries(voting.players.filter(p => p.id !== me).map(p => [p.id, 7.5]));
    assert(!(await emit(bot, 'vote', { scores: { ...scores, x: 1, [Object.keys(scores)[0]]: 11 } })).ok, 'rechaza >10');
    assert((await emit(bot, 'vote', { scores })).ok);
  }
  const results = await resultsP;
  console.log('Resultados:', results.results.map(r => `${r.name} ${r.avg}`).join(', '));
  console.log('OK ✅');
  process.exit(0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
