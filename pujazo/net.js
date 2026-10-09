// Red de PUJAZO sin servidor propio: el navegador del anfitrión aloja la sala (engine.js)
// y los demás jugadores se conectan directamente a él por WebRTC usando PeerJS.
// El código de sala de 4 caracteres forma parte del identificador del anfitrión.
window.PujazoNet = (() => {
  const { Room, newCode } = window.PujazoEngine;
  const PREFIX = 'pujazo-v1-';
  const listeners = {};
  const pending = new Map();
  let peer = null;
  let room = null; // solo en el anfitrión
  let hostConns = new Map(); // anfitrión: conexión -> playerId
  let conn = null; // invitado: conexión con el anfitrión
  let myId = null;
  let reqSeq = 0;

  const emit = (evt, data) => (listeners[evt] || []).forEach(fn => fn(data));
  const on = (evt, fn) => (listeners[evt] = listeners[evt] || []).push(fn);
  const fail = error => ({ ok: false, error });

  function openPeer(id) {
    return new Promise((resolve, reject) => {
      const p = id ? new Peer(id, { debug: 0 }) : new Peer({ debug: 0 });
      const onError = err => { p.destroy(); reject(err); };
      p.once('open', () => { p.off('error', onError); resolve(p); });
      p.once('error', onError);
    });
  }

  function keepAlive(p) {
    // Si se pierde la conexión con el servidor de señalización, se reintenta.
    p.on('disconnected', () => { if (p === peer && !p.destroyed) setTimeout(() => !p.destroyed && p.reconnect(), 1000); });
  }

  /* ---------- Anfitrión ---------- */
  async function createRoom(name, category) {
    reset();
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = newCode();
      try {
        peer = await openPeer(PREFIX + code);
      } catch (err) {
        if (err.type === 'unavailable-id') continue;
        return fail('No se pudo crear la sala. Revisa tu conexión a internet.');
      }
      keepAlive(peer);
      room = new Room(code, category, broadcast);
      const r = room.addPlayer(name);
      if (!r.ok) return r;
      myId = r.player.id;
      peer.on('connection', setupHostConn);
      emit('joined', { code, playerId: myId, host: true });
      broadcast(room.publicState());
      return { ok: true, code };
    }
    return fail('No se pudo crear la sala, inténtalo otra vez');
  }

  function broadcast(state) {
    emit('state', state);
    for (const [c, playerId] of hostConns) if (playerId && c.open) c.send({ t: 'state', state });
  }

  function setupHostConn(c) {
    hostConns.set(c, null);
    c.on('data', msg => {
      if (!room || !msg) return;
      if (msg.t === 'hello') {
        const r = msg.token ? room.resume(msg.token) : room.addPlayer(msg.name);
        if (!r.ok) { c.send({ t: 'res', id: msg.id, ok: false, error: r.error }); return; }
        hostConns.set(c, r.player.id);
        c.send({ t: 'joined', id: msg.id, code: room.code, playerId: r.player.id, token: r.player.token });
        c.send({ t: 'state', state: room.publicState() });
      } else if (msg.t === 'req') {
        const playerId = hostConns.get(c);
        const r = playerId ? room.handle(playerId, msg.action, msg.data) : fail('No estás en la sala');
        c.send({ t: 'res', id: msg.id, ...r });
      }
    });
    const gone = () => {
      const playerId = hostConns.get(c);
      hostConns.delete(c);
      if (room && playerId && ![...hostConns.values()].includes(playerId)) room.disconnect(playerId);
    };
    c.on('close', gone);
    c.on('error', gone);
  }

  /* ---------- Invitado ---------- */
  async function joinRoom(name, code, token) {
    reset();
    code = String(code || '').toUpperCase().trim();
    try {
      peer = await openPeer();
    } catch {
      return fail('No se pudo conectar. Revisa tu conexión a internet.');
    }
    keepAlive(peer);
    return new Promise(resolve => {
      let settled = false;
      const done = r => { if (!settled) { settled = true; clearTimeout(timer); resolve(r); } };
      const timer = setTimeout(() => done(fail('No se pudo conectar con la sala')), 15000);
      peer.on('error', err => {
        if (err.type === 'peer-unavailable') done(fail('No existe ninguna sala con ese código'));
      });
      const c = conn = peer.connect(PREFIX + code, { reliable: true, serialization: 'json' });
      const helloId = ++reqSeq;
      c.on('open', () => c.send({ t: 'hello', id: helloId, name, token }));
      c.on('data', msg => {
        if (msg.t === 'joined') {
          myId = msg.playerId;
          emit('joined', { code: msg.code, playerId: msg.playerId, token: msg.token, host: false });
          done({ ok: true });
        } else if (msg.t === 'state') {
          emit('state', msg.state);
        } else if (msg.t === 'res') {
          if (msg.id === helloId) return done(msg);
          const cb = pending.get(msg.id);
          if (cb) { pending.delete(msg.id); cb(msg); }
        }
      });
      c.on('close', () => {
        done(fail('No se pudo conectar con la sala'));
        if (conn === c && myId) emit('closed');
      });
    });
  }

  /* ---------- Común ---------- */
  function send(action, data) {
    if (room) return Promise.resolve(room.handle(myId, action, data));
    if (!conn || !conn.open) return Promise.resolve(fail('Sin conexión con el anfitrión'));
    const id = ++reqSeq;
    return new Promise(resolve => {
      const t = setTimeout(() => { pending.delete(id); resolve(fail('Sin respuesta del anfitrión')); }, 8000);
      pending.set(id, r => { clearTimeout(t); resolve(r); });
      conn.send({ t: 'req', id, action, data });
    });
  }

  function reset() {
    const oldPeer = peer, oldRoom = room;
    room = null; peer = null; conn = null; myId = null;
    hostConns = new Map();
    pending.clear();
    if (oldRoom) oldRoom.destroy();
    if (oldPeer) oldPeer.destroy();
  }

  async function leave() {
    if (!room && conn && conn.open) {
      await send('leave');
    }
    reset();
  }

  return { on, createRoom, joinRoom, send, leave, isHost: () => !!room };
})();
