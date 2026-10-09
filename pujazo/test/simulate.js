// Simula una partida completa con 3 jugadores contra el motor: node test/simulate.js
const assert = require('assert');
const { Room } = require('../engine.js');

let last;
const room = new Room('TEST', 'random', s => { last = s; });
const yago = room.addPlayer('Yago').player;
const lucia = room.addPlayer('Lucía').player;
const yago2 = room.addPlayer('Yago').player;
assert.strictEqual(yago2.name, 'Yago 2');
const ids = [yago.id, lucia.id, yago2.id];
assert(!room.handle(lucia.id, 'start').ok, 'solo el anfitrión empieza');
assert(room.handle(yago.id, 'start').ok);

let seen = null, raceRejected = false;
const timer = setInterval(() => {
  if (last.phase === 'auction' && last.auction.item.id !== seen) {
    seen = last.auction.item.id;
    const elig = last.auction.eligible;
    const [p1, p2] = elig;
    const r1 = room.handle(p1, 'bid', { amount: 1 });
    const r2 = p2 ? room.handle(p2, 'bid', { amount: 1 }) : { ok: false };
    if (r1.ok && p2 && !r2.ok) raceRejected = true;
    ids.forEach(id => room.handle(id, 'pass'));
  }
  if (last.phase === 'voting') {
    clearInterval(timer);
    console.log('Categoría:', last.category.name, '| objetos:', last.totalItems);
    for (const p of last.players) {
      console.log(` ${p.name}: ${p.coins} 🪙 ->`, p.items.map(i => `${i.emoji}${i.price}`).join(' '));
      assert.strictEqual(p.items.length, 4);
      assert.strictEqual(p.coins + p.items.reduce((t, i) => t + i.price, 0), 20);
    }
    assert(raceRejected, 'dos pujas iguales: solo vale la primera');
    assert.strictEqual(new Set(last.players.flatMap(p => p.items.map(i => i.id))).size, 12, 'sin repetidos');
    for (const id of ids) {
      const scores = Object.fromEntries(ids.filter(x => x !== id).map(x => [x, 7.5]));
      assert(!room.handle(id, 'vote', { scores: { ...scores, [ids.find(x => x !== id)]: 11 } }).ok, 'rechaza >10');
      assert(room.handle(id, 'vote', { scores }).ok);
    }
    assert.strictEqual(last.phase, 'results');
    console.log('Resultados:', last.results.map(r => `${r.name} ${r.avg}`).join(', '));
    console.log('OK ✅');
    room.destroy();
  }
}, 50);
