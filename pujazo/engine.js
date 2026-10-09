// Motor de PUJAZO. Se ejecuta en el navegador del anfitrión, que hace de "servidor"
// de la sala: decide quién gana cada puja, lleva los relojes y reparte el estado.
(() => {
  const DATA = typeof module === 'object' && module.exports ? require('./categories.js') : window.PujazoData;
  const { TIERS, CATALOG } = DATA;

  const MAX_PLAYERS = 5;
  const MIN_PLAYERS = 2;
  const ITEMS_PER_PLAYER = 4;
  const START_COINS = 20;
  const FIRST_TIMER_MS = 10000;
  const BID_TIMER_MS = 5000;
  const REVEAL_MS = 2500;
  const SOLD_MS = 4200;
  const CATEGORY_REVEAL_MS = 4000;

  const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randInt = n => Math.floor(Math.random() * n);
  const rand = arr => arr[randInt(arr.length)];
  const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
  const newCode = () => Array.from({ length: 4 }, () => CODE_CHARS[randInt(CODE_CHARS.length)]).join('');
  const cleanName = n => String(n || '').replace(/\s+/g, ' ').trim().slice(0, 16);
  const ok = extra => ({ ok: true, ...extra });
  const fail = error => ({ ok: false, error });

  class Room {
    constructor(code, categoryChoice, onChange) {
      Object.assign(this, {
        code, categoryChoice, onChange, hostId: null, phase: 'lobby', category: null,
        players: [], deck: [], itemIndex: 0, auction: null, sold: null, votes: {}, results: null, used: {}, timer: null,
      });
    }

    /* ---------- Jugadores ---------- */
    addPlayer(name) {
      name = cleanName(name);
      if (!name) return fail('Escribe tu nombre');
      if (this.phase !== 'lobby') return fail('La partida ya ha empezado');
      if (this.players.length >= MAX_PLAYERS) return fail('La sala está llena (máximo 5)');
      const taken = new Set(this.players.map(p => p.name.toLowerCase()));
      let final = name;
      for (let i = 2; taken.has(final.toLowerCase()); i++) final = `${name} ${i}`;
      const player = { id: uid(), token: uid(), name: final, connected: true, coins: START_COINS, items: [] };
      this.players.push(player);
      if (!this.hostId) this.hostId = player.id;
      this.changed();
      return ok({ player });
    }

    resume(token) {
      const player = this.players.find(p => p.token === token);
      if (!player) return fail('expired');
      player.connected = true;
      this.changed();
      return ok({ player });
    }

    disconnect(playerId) {
      const player = this.players.find(p => p.id === playerId);
      if (!player) return;
      if (this.phase === 'lobby') this.players = this.players.filter(p => p !== player);
      else player.connected = false;
      this.changed();
      if (this.phase === 'auction') this.checkEarlyEnd();
      if (this.phase === 'voting') this.maybeFinishVoting();
    }

    /* ---------- Acciones de los jugadores ---------- */
    handle(playerId, action, data = {}) {
      const player = this.players.find(p => p.id === playerId);
      if (!player) return fail('No estás en la sala');
      const isHost = playerId === this.hostId;
      const a = this.auction;
      switch (action) {
        case 'setCategory':
          if (!isHost || this.phase !== 'lobby') return fail('Ahora no');
          if (data.category !== 'random' && !CATALOG[data.category]) return fail('Categoría no válida');
          this.categoryChoice = data.category;
          this.changed();
          return ok();

        case 'start':
          if (!isHost) return fail('Solo el anfitrión puede empezar');
          if (this.phase !== 'lobby') return fail('La partida ya ha empezado');
          if (this.players.length < MIN_PLAYERS) return fail(`Hacen falta al menos ${MIN_PLAYERS} jugadores`);
          this.startGame();
          return ok();

        case 'bid': {
          if (this.phase !== 'auction') return fail('Ahora no se puede pujar');
          const amount = Math.floor(Number(data.amount));
          if (!a.eligible.includes(player.id)) return fail('Ya tienes tus 4 cosas');
          if (a.passed.includes(player.id)) return fail('Ya te has retirado de esta puja');
          if (a.leaderId === player.id) return fail('Ya vas ganando tú');
          if (!Number.isFinite(amount) || amount <= a.bid) return fail(`Alguien se te adelantó: la puja ya está en ${a.bid}`);
          if (amount > player.coins) return fail(`Solo tienes ${player.coins} monedas`);
          a.bid = amount;
          a.leaderId = player.id;
          a.endsAt = Date.now() + BID_TIMER_MS;
          a.history.push({ name: player.name, amount });
          this.schedule(BID_TIMER_MS, () => this.closeAuction());
          this.changed();
          this.checkEarlyEnd();
          return ok();
        }

        case 'pass':
          if (this.phase !== 'auction') return fail('Ahora no');
          if (a.leaderId === player.id) return fail('Vas ganando, no puedes retirarte');
          if (!a.passed.includes(player.id)) a.passed.push(player.id);
          this.changed();
          this.checkEarlyEnd();
          return ok();

        case 'vote': {
          if (this.phase !== 'voting') return fail('Ahora no se vota');
          const clean = {};
          for (const p of this.players) {
            if (p.id === player.id) continue;
            const s = Number(data.scores && data.scores[p.id]);
            if (!Number.isFinite(s) || s < 0 || s > 10) return fail(`Pon una nota de 0 a 10 a ${p.name}`);
            clean[p.id] = Math.round(s * 10) / 10;
          }
          this.votes[player.id] = clean;
          this.changed();
          this.maybeFinishVoting();
          return ok();
        }

        case 'forceResults':
          if (!isHost || this.phase !== 'voting') return fail('Ahora no');
          this.finishVoting();
          return ok();

        case 'again':
          if (!isHost || this.phase !== 'results') return fail('Ahora no');
          this.players = this.players.filter(p => p.connected);
          this.players.forEach(p => { p.coins = START_COINS; p.items = []; });
          Object.assign(this, { phase: 'lobby', category: null, deck: [], itemIndex: 0, auction: null, sold: null, votes: {}, results: null });
          this.changed();
          return ok();

        case 'leave':
          this.disconnect(player.id);
          return ok();
      }
      return fail('Acción desconocida');
    }

    /* ---------- Desarrollo de la partida ---------- */
    // Elige N cosas sin repetir, priorizando las que no han salido en partidas anteriores de la sala.
    buildDeck(catKey, n) {
      const cat = CATALOG[catKey];
      const used = this.used[catKey] || (this.used[catKey] = new Set());
      let pool = cat.items.filter(i => !used.has(i.id));
      if (pool.length < n) { used.clear(); pool = cat.items.slice(); }
      const tierKeys = Object.keys(TIERS);
      const deck = [];
      while (deck.length < n) {
        const available = tierKeys.filter(t => pool.some(i => i.tier === t));
        let r = randInt(available.reduce((s, t) => s + TIERS[t].weight, 0));
        const tier = available.find(t => (r -= TIERS[t].weight) < 0);
        const pick = rand(pool.filter(i => i.tier === tier));
        pool = pool.filter(i => i !== pick);
        used.add(pick.id);
        deck.push(pick);
      }
      return deck;
    }

    startGame() {
      const catKey = this.categoryChoice === 'random' ? rand(Object.keys(CATALOG)) : this.categoryChoice;
      this.category = catKey;
      this.deck = this.buildDeck(catKey, this.players.length * ITEMS_PER_PLAYER);
      Object.assign(this, { itemIndex: 0, votes: {}, results: null, sold: null, auction: null, phase: 'category' });
      this.players.forEach(p => { p.coins = START_COINS; p.items = []; });
      this.changed();
      this.schedule(this.categoryChoice === 'random' ? CATEGORY_REVEAL_MS : 2500, () => this.nextItem());
    }

    nextItem() {
      this.sold = null;
      const eligible = this.players.filter(p => p.items.length < ITEMS_PER_PLAYER);
      if (!eligible.length || this.itemIndex >= this.deck.length) return this.startVoting();
      const item = this.deck[this.itemIndex++];
      this.auction = { item, bid: 0, leaderId: null, passed: [], history: [], eligible: eligible.map(p => p.id), endsAt: 0 };
      this.phase = 'reveal';
      this.changed();
      if (eligible.length === 1) {
        // Solo queda una persona con huecos: se lo lleva directamente.
        this.schedule(REVEAL_MS, () => this.award(eligible[0], 0, 'unico'));
        return;
      }
      this.schedule(REVEAL_MS, () => {
        this.phase = 'auction';
        this.auction.endsAt = Date.now() + FIRST_TIMER_MS;
        this.changed();
        this.schedule(FIRST_TIMER_MS, () => this.closeAuction());
        this.checkEarlyEnd();
      });
    }

    // Jugadores que todavía pueden superar la puja actual.
    activeBidders() {
      const a = this.auction;
      return this.players.filter(p =>
        a.eligible.includes(p.id) && p.connected && !a.passed.includes(p.id) && p.id !== a.leaderId && p.coins > a.bid);
    }

    checkEarlyEnd() {
      if (this.phase === 'auction' && this.activeBidders().length === 0) this.closeAuction();
    }

    closeAuction() {
      if (this.phase !== 'auction') return;
      const a = this.auction;
      const leader = a.leaderId && this.players.find(p => p.id === a.leaderId);
      if (leader) return this.award(leader, a.bid, 'puja');
      // Nadie ha pujado: se adjudica gratis, primero a quien no tenga dinero.
      const eligible = this.players.filter(p => a.eligible.includes(p.id));
      let pool = eligible.filter(p => p.coins === 0);
      if (!pool.length) {
        const min = Math.min(...eligible.map(p => p.coins));
        pool = eligible.filter(p => p.coins === min);
      }
      this.award(rand(pool), 0, 'nadie');
    }

    award(player, price, reason) {
      const item = this.auction.item;
      player.coins -= price;
      player.items.push({ ...item, price });
      this.phase = 'sold';
      this.sold = { item, winnerId: player.id, winnerName: player.name, price, reason };
      this.changed();
      this.schedule(SOLD_MS, () => this.nextItem());
    }

    startVoting() {
      this.clearTimer();
      Object.assign(this, { auction: null, sold: null, phase: 'voting', votes: {} });
      this.changed();
    }

    maybeFinishVoting() {
      if (this.players.every(p => !p.connected || this.votes[p.id])) this.finishVoting();
    }

    finishVoting() {
      const name = id => (this.players.find(x => x.id === id) || {}).name || '?';
      this.results = this.players.map(p => {
        const votes = Object.entries(this.votes)
          .filter(([voter, v]) => voter !== p.id && typeof v[p.id] === 'number')
          .map(([voter, v]) => ({ from: name(voter), score: v[p.id] }));
        const avg = votes.length ? votes.reduce((t, v) => t + v.score, 0) / votes.length : 0;
        return { id: p.id, name: p.name, avg: Math.round(avg * 100) / 100, votes, coins: p.coins };
      }).sort((a, b) => b.avg - a.avg || b.coins - a.coins);
      this.phase = 'results';
      this.changed();
    }

    /* ---------- Relojes y estado ---------- */
    clearTimer() {
      if (this.timer) clearTimeout(this.timer);
      this.timer = null;
    }

    schedule(ms, fn) {
      this.clearTimer();
      this.timer = setTimeout(() => { this.timer = null; fn(); }, ms);
    }

    destroy() {
      this.clearTimer();
    }

    changed() {
      if (this.onChange) this.onChange(this.publicState());
    }

    publicState() {
      const cat = this.category && CATALOG[this.category];
      const a = this.auction;
      return {
        code: this.code,
        hostId: this.hostId,
        phase: this.phase,
        categoryChoice: this.categoryChoice,
        category: cat ? { key: cat.key, name: cat.name, emoji: cat.emoji } : null,
        categoryChoices: Object.values(CATALOG).map(c => ({ key: c.key, name: c.name, emoji: c.emoji })),
        itemIndex: this.itemIndex,
        totalItems: this.deck.length,
        players: this.players.map(p => ({
          id: p.id, name: p.name, connected: p.connected, coins: p.coins, items: p.items, voted: !!this.votes[p.id],
        })),
        auction: a ? {
          item: a.item, bid: a.bid, leaderId: a.leaderId, endsAt: a.endsAt,
          passed: a.passed, eligible: a.eligible, history: a.history.slice(-8),
        } : null,
        sold: this.sold,
        results: this.results,
        serverNow: Date.now(),
      };
    }
  }

  const api = { Room, newCode, cleanName, CATALOG };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else window.PujazoEngine = api;
})();
