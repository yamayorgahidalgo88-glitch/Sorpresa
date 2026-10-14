// Vista previa sin servidor: emula la API de /api en el navegador (datos en este dispositivo).
// La inyecta scripts/build-preview.mjs junto con CATALOG, TEMPLATE y POSTERS.
(() => {
  const KEY = 'animelist-preview-v1';
  let mem = null;
  const load = () => {
    if (mem) return mem;
    try { mem = JSON.parse(localStorage.getItem(KEY)); } catch { mem = null; }
    mem ||= { seq: 1, users: [], session: null, friendships: [], lists: [], members: [], people: [], entries: [], marks: [] };
    return mem;
  };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch { /* solo en memoria */ } };
  const id = () => load().seq++;
  const now = () => Date.now();
  const PALETTE = ['#8bc34a', '#5b9bd5', '#ff8a3d', '#e05b8f', '#b38cff', '#ffd54f', '#4dd0c4'];

  class E extends Error { constructor(s, m) { super(m); this.status = s; } }
  const fail = (s, m) => { throw new E(s, m); };

  const poster = (it) => (it && POSTERS[it.id]) || null;
  const withPoster = (it) => it && { ...it, poster: poster(it) };

  // ── Búsqueda (misma lógica que server/catalog.js) ──
  const norm = (s = '') => s.toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9぀-ヿ一-鿿]+/g, ' ').trim();
  const tri = (s) => { const t = new Set(), p = `  ${s} `; for (let i = 0; i < p.length - 2; i++) t.add(p.slice(i, i + 3)); return t; };
  const dice = (a, b) => { let n = 0; for (const x of a) if (b.has(x)) n++; return (2 * n) / (a.size + b.size || 1); };
  const index = CATALOG.items.map((it, rank) => {
    const names = [it.title, it.original, ...(it.aka || [])].filter(Boolean).map(norm);
    return { it, rank, names, grams: names.map(tri) };
  });
  const byId = Object.fromEntries(CATALOG.items.map((i) => [i.id, i]));
  function search(query, limit = 12) {
    const q = norm(query);
    if (!q) return [];
    const qg = tri(q), qw = q.split(' '), out = [];
    for (const x of index) {
      let best = 0;
      x.names.forEach((n, i) => {
        const s = n === q ? 100 : n.startsWith(q) ? 80 : n.includes(' ' + q) ? 70 : qw.every((w) => n.includes(w)) ? 60 : dice(qg, x.grams[i]) * 70;
        if (s > best) best = s;
      });
      if (best >= 30) out.push({ s: best - x.rank / 400, it: x.it });
    }
    return out.sort((a, b) => b.s - a.s).slice(0, limit).map((x) => withPoster(x.it));
  }

  // ── Helpers de datos ──
  const db = () => load();
  const me = (req) => { const u = db().users.find((x) => x.id === db().session); if (!u && req) fail(401, 'Inicia sesión para continuar'); return u; };
  const pub = (u) => ({ id: u.id, username: u.username });
  const userByName = (n) => db().users.find((u) => u.username.toLowerCase() === String(n).trim().toLowerCase());
  const membership = (listId, uid) => {
    const m = db().members.find((x) => x.list_id === listId && x.user_id === uid);
    if (!m) fail(404, 'Tabla no encontrada');
    return m;
  };
  const touch = (listId) => { const l = db().lists.find((x) => x.id === listId); if (l) l.updated_at = now(); };
  const areFriends = (a, b) => db().friendships.some((f) => f.status === 'accepted' && ((f.requester_id === a && f.addressee_id === b) || (f.requester_id === b && f.addressee_id === a)));
  const clean = (v, max) => (v == null ? null : String(v).trim().slice(0, max) || null);
  async function hash(pw) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('animelist:' + pw));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  const deleteEntry = (eid) => { db().marks = db().marks.filter((k) => k.entry_id !== eid); db().entries = db().entries.filter((e) => e.id !== eid); };
  const ENTRY = ['title', 'jw_id', 'poster', 'kind', 'duration', 'platform', 'language', 'availability'];
  const pick = (b, partial) => {
    const o = {};
    for (const k of ENTRY) if (!partial || k in b) o[k] = k === 'availability' ? (Array.isArray(b[k]) ? b[k] : null) : k === 'kind' ? (b[k] === 'movie' ? 'movie' : 'show') : clean(b[k], 200);
    return o;
  };

  // ── Rutas ──
  const routes = [
    ['POST', /^\/auth\/register$/, async (b) => {
      const username = String(b.username || '').trim();
      if (!/^[a-zA-Z0-9_.]{3,20}$/.test(username)) fail(400, 'El usuario debe tener 3-20 caracteres: letras, números, "_" o "."');
      if (String(b.password || '').length < 6) fail(400, 'La contraseña debe tener al menos 6 caracteres');
      if (userByName(username)) fail(409, 'Ese nombre de usuario ya existe');
      const u = { id: id(), username, pass: await hash(b.password), created_at: now() };
      db().users.push(u); db().session = u.id;
      return { user: pub(u) };
    }],
    ['POST', /^\/auth\/login$/, async (b) => {
      const u = userByName(b.username || '');
      if (!u || u.pass !== (await hash(String(b.password || '')))) fail(401, 'Usuario o contraseña incorrectos');
      db().session = u.id;
      return { user: pub(u) };
    }],
    ['POST', /^\/auth\/logout$/, () => { db().session = null; return { ok: true }; }],
    ['GET', /^\/me$/, () => {
      const u = me(false);
      if (!u) return { user: null };
      const d = db();
      return {
        user: { ...pub(u), createdAt: u.created_at },
        stats: {
          lists: d.members.filter((m) => m.user_id === u.id).length,
          friends: d.friendships.filter((f) => f.status === 'accepted' && (f.requester_id === u.id || f.addressee_id === u.id)).length,
          requests: d.friendships.filter((f) => f.status === 'pending' && f.addressee_id === u.id).length,
        },
      };
    }],
    ['GET', /^\/meta$/, () => ({ catalog: { count: CATALOG.count, builtAt: CATALOG.builtAt } })],
    ['GET', /^\/backdrop$/, () => ({ posters: Object.values(POSTERS) })],
    ['GET', /^\/anime\/search$/, (_b, _m, qs) => { me(true); const q = qs.get('q') || ''; return { results: q.trim().length < 2 ? [] : search(q) }; }],
    ['GET', /^\/anime\/(t[ms]\d+)$/, (_b, m) => { me(true); const it = byId[m[1]]; if (!it) fail(404, 'No encontrado'); return { item: withPoster(it), live: false }; }],

    ['GET', /^\/lists$/, () => {
      const u = me(true), d = db();
      const lists = d.members.filter((m) => m.user_id === u.id).map((m) => {
        const l = d.lists.find((x) => x.id === m.list_id);
        const entries = d.entries.filter((e) => e.list_id === l.id).sort((a, b) => a.position - b.position);
        return {
          id: l.id, name: l.name, owner_id: l.owner_id, updated_at: l.updated_at, role: m.role,
          owner: d.users.find((x) => x.id === l.owner_id)?.username,
          count: entries.length, members: d.members.filter((x) => x.list_id === l.id).length,
          covers: entries.map((e) => e.poster).filter(Boolean).slice(0, 4),
        };
      }).sort((a, b) => b.updated_at - a.updated_at);
      return { lists };
    }],
    ['POST', /^\/lists$/, (b) => {
      const u = me(true), d = db();
      const name = clean(b.name, 60);
      if (!name) fail(400, 'Ponle un nombre a la tabla');
      const l = { id: id(), owner_id: u.id, name, created_at: now(), updated_at: now() };
      d.lists.push(l); d.members.push({ list_id: l.id, user_id: u.id, role: 'owner' });
      if (b.template === 'my') {
        const pids = TEMPLATE.people.map((p, i) => { const pid = id(); d.people.push({ id: pid, list_id: l.id, name: p.name, color: p.color, position: i }); return pid; });
        TEMPLATE.rows.forEach(([title, duration, platform, language, mk, yk, jw], pos) => {
          const cat = byId[jw];
          const eid = id();
          d.entries.push({ id: eid, list_id: l.id, position: pos, title, jw_id: jw, poster: poster(cat), kind: duration === 'Película' ? 'movie' : 'show', duration, platform, language, availability: cat?.platforms || null, created_at: now() });
          [mk, yk].forEach(([seen, rating], k) => d.marks.push({ entry_id: eid, person_id: pids[k], seen: !!seen, rating }));
        });
      } else d.people.push({ id: id(), list_id: l.id, name: u.username, color: PALETTE[0], position: 0 });
      return { id: l.id };
    }],
    ['GET', /^\/lists\/(\d+)$/, (_b, m) => {
      const u = me(true), d = db(), lid = +m[1];
      const mem_ = membership(lid, u.id);
      const l = d.lists.find((x) => x.id === lid);
      const people = d.people.filter((p) => p.list_id === lid).sort((a, b) => a.position - b.position || a.id - b.id);
      const entries = d.entries.filter((e) => e.list_id === lid).sort((a, b) => a.position - b.position || a.id - b.id).map((e) => {
        const marks = {};
        d.marks.filter((k) => k.entry_id === e.id).forEach((k) => (marks[k.person_id] = { seen: !!k.seen, rating: k.rating }));
        return { ...e, marks };
      });
      const members = d.members.filter((x) => x.list_id === lid).map((x) => ({ ...pub(d.users.find((uu) => uu.id === x.user_id)), role: x.role }));
      return { list: { id: l.id, name: l.name, owner_id: l.owner_id, updated_at: l.updated_at, role: mem_.role }, people, members, entries };
    }],
    ['PATCH', /^\/lists\/(\d+)$/, (b, m) => {
      const u = me(true), lid = +m[1]; membership(lid, u.id);
      const name = clean(b.name, 60); if (!name) fail(400, 'Nombre vacío');
      db().lists.find((x) => x.id === lid).name = name; touch(lid);
      return { ok: true };
    }],
    ['DELETE', /^\/lists\/(\d+)$/, (_b, m) => {
      const u = me(true), d = db(), lid = +m[1];
      const mm = membership(lid, u.id);
      if (mm.role !== 'owner') { d.members = d.members.filter((x) => !(x.list_id === lid && x.user_id === u.id)); return { ok: true, left: true }; }
      d.entries.filter((e) => e.list_id === lid).forEach((e) => deleteEntry(e.id));
      d.people = d.people.filter((p) => p.list_id !== lid);
      d.members = d.members.filter((x) => x.list_id !== lid);
      d.lists = d.lists.filter((x) => x.id !== lid);
      return { ok: true, deleted: true };
    }],
    ['POST', /^\/lists\/(\d+)\/people$/, (b, m) => {
      const u = me(true), d = db(), lid = +m[1]; membership(lid, u.id);
      const name = clean(b.name, 24); if (!name) fail(400, 'Pon un nombre');
      const count = d.people.filter((p) => p.list_id === lid).length;
      if (count >= 8) fail(400, 'Máximo 8 personas por tabla');
      const p = { id: id(), list_id: lid, name, color: /^#[0-9a-f]{6}$/i.test(b.color || '') ? b.color : PALETTE[count % PALETTE.length], position: count };
      d.people.push(p); touch(lid);
      return { id: p.id };
    }],
    ['PATCH', /^\/people\/(\d+)$/, (b, m) => {
      const u = me(true), p = db().people.find((x) => x.id === +m[1]); if (!p) fail(404, 'Columna no encontrada');
      membership(p.list_id, u.id);
      if (clean(b.name, 24)) p.name = clean(b.name, 24);
      if (/^#[0-9a-f]{6}$/i.test(b.color || '')) p.color = b.color;
      touch(p.list_id); return { ok: true };
    }],
    ['DELETE', /^\/people\/(\d+)$/, (_b, m) => {
      const u = me(true), d = db(), p = d.people.find((x) => x.id === +m[1]); if (!p) fail(404, 'Columna no encontrada');
      membership(p.list_id, u.id);
      d.marks = d.marks.filter((k) => k.person_id !== p.id); d.people = d.people.filter((x) => x.id !== p.id);
      touch(p.list_id); return { ok: true };
    }],
    ['POST', /^\/lists\/(\d+)\/entries$/, (b, m) => {
      const u = me(true), d = db(), lid = +m[1]; membership(lid, u.id);
      const e = pick(b, false); if (!e.title) fail(400, 'Escribe el nombre del anime');
      if (e.jw_id && byId[e.jw_id]) e.poster = poster(byId[e.jw_id]);
      const pos = Math.max(-1, ...d.entries.filter((x) => x.list_id === lid).map((x) => x.position)) + 1;
      const ent = { id: id(), list_id: lid, position: pos, ...e, created_at: now() };
      d.entries.push(ent); touch(lid);
      return { id: ent.id };
    }],
    ['PATCH', /^\/entries\/(\d+)$/, (b, m) => {
      const u = me(true), ent = db().entries.find((x) => x.id === +m[1]); if (!ent) fail(404, 'Anime no encontrado');
      membership(ent.list_id, u.id);
      const e = pick(b, true); if ('title' in e && !e.title) fail(400, 'El nombre no puede estar vacío');
      Object.assign(ent, e); touch(ent.list_id); return { ok: true };
    }],
    ['DELETE', /^\/entries\/(\d+)$/, (_b, m) => {
      const u = me(true), ent = db().entries.find((x) => x.id === +m[1]); if (!ent) fail(404, 'Anime no encontrado');
      membership(ent.list_id, u.id); deleteEntry(ent.id); touch(ent.list_id); return { ok: true };
    }],
    ['PUT', /^\/entries\/(\d+)\/marks\/(\d+)$/, (b, m) => {
      const u = me(true), d = db(), ent = d.entries.find((x) => x.id === +m[1]); if (!ent) fail(404, 'Anime no encontrado');
      membership(ent.list_id, u.id);
      const pid = +m[2]; if (!d.people.some((p) => p.id === pid && p.list_id === ent.list_id)) fail(404, 'Columna no encontrada');
      let k = d.marks.find((x) => x.entry_id === ent.id && x.person_id === pid);
      if (!k) { k = { entry_id: ent.id, person_id: pid, seen: false, rating: null }; d.marks.push(k); }
      if ('seen' in b) k.seen = !!b.seen;
      if ('rating' in b) {
        if (b.rating === null || b.rating === '') k.rating = null;
        else {
          const r = Math.round(Number(String(b.rating).replace(',', '.')) * 100) / 100;
          if (!Number.isFinite(r) || r < 0 || r > 10) fail(400, 'La nota va de 0 a 10');
          k.rating = r;
        }
      }
      touch(ent.list_id); return { seen: k.seen, rating: k.rating };
    }],
    ['POST', /^\/lists\/(\d+)\/share$/, (b, m) => {
      const u = me(true), d = db(), lid = +m[1];
      if (membership(lid, u.id).role !== 'owner') fail(403, 'Solo quien creó la tabla puede compartirla');
      const f = d.users.find((x) => x.id === +b.userId);
      if (!f || !areFriends(u.id, f.id)) fail(400, 'Solo puedes compartir con tus amigos');
      if (!d.members.some((x) => x.list_id === lid && x.user_id === f.id)) d.members.push({ list_id: lid, user_id: f.id, role: 'editor' });
      const ppl = d.people.filter((p) => p.list_id === lid);
      if (!ppl.some((p) => p.name.toLowerCase() === f.username.toLowerCase()) && ppl.length < 8) {
        d.people.push({ id: id(), list_id: lid, name: f.username, color: PALETTE[ppl.length % PALETTE.length], position: ppl.length });
      }
      touch(lid); return { ok: true };
    }],
    ['DELETE', /^\/lists\/(\d+)\/share\/(\d+)$/, (_b, m) => {
      const u = me(true), d = db(), lid = +m[1];
      if (membership(lid, u.id).role !== 'owner') fail(403, 'Solo quien creó la tabla puede gestionar con quién se comparte');
      d.members = d.members.filter((x) => !(x.list_id === lid && x.user_id === +m[2] && x.role !== 'owner'));
      return { ok: true };
    }],

    ['GET', /^\/friends$/, () => {
      const u = me(true), d = db();
      const rows = d.friendships.filter((f) => f.requester_id === u.id || f.addressee_id === u.id).sort((a, b) => b.created_at - a.created_at);
      const other = (f) => pub(d.users.find((x) => x.id === (f.requester_id === u.id ? f.addressee_id : f.requester_id)));
      return {
        friends: rows.filter((f) => f.status === 'accepted').map((f) => ({ ...other(f), since: f.created_at })).sort((a, b) => a.username.localeCompare(b.username)),
        incoming: rows.filter((f) => f.status === 'pending' && f.addressee_id === u.id).map((f) => ({ requestId: f.id, ...other(f), at: f.created_at })),
        outgoing: rows.filter((f) => f.status === 'pending' && f.requester_id === u.id).map((f) => ({ requestId: f.id, ...other(f), at: f.created_at })),
      };
    }],
    ['GET', /^\/users\/search$/, (_b, _m, qs) => {
      const u = me(true), d = db(), q = (qs.get('q') || '').trim().toLowerCase();
      if (!q) return { users: [] };
      const users = d.users.filter((x) => x.id !== u.id && x.username.toLowerCase().startsWith(q))
        .sort((a, b) => a.username.length - b.username.length || a.username.localeCompare(b.username)).slice(0, 15)
        .map((x) => {
          const f = d.friendships.find((ff) => (ff.requester_id === u.id && ff.addressee_id === x.id) || (ff.requester_id === x.id && ff.addressee_id === u.id));
          return { ...pub(x), relation: f ? `${f.status}:${f.requester_id === u.id ? 'out' : 'in'}` : null };
        });
      return { users };
    }],
    ['POST', /^\/friends\/request$/, (b) => {
      const u = me(true), d = db(), t = userByName(b.username || '');
      if (!t) fail(404, 'No existe ningún usuario con ese nombre');
      if (t.id === u.id) fail(400, 'No puedes enviarte una solicitud a ti mismo');
      const ex = d.friendships.find((f) => (f.requester_id === u.id && f.addressee_id === t.id) || (f.requester_id === t.id && f.addressee_id === u.id));
      if (ex?.status === 'accepted') fail(409, 'Ya sois amigos');
      if (ex && ex.requester_id === u.id) fail(409, 'Ya le enviaste una solicitud');
      if (ex) { ex.status = 'accepted'; return { ok: true, accepted: true }; }
      d.friendships.push({ id: id(), requester_id: u.id, addressee_id: t.id, status: 'pending', created_at: now() });
      return { ok: true };
    }],
    ['POST', /^\/friends\/requests\/(\d+)\/(accept|reject|cancel)$/, (_b, m) => {
      const u = me(true), d = db(), f = d.friendships.find((x) => x.id === +m[1] && x.status === 'pending');
      if (!f) fail(404, 'Solicitud no encontrada');
      if (m[2] === 'accept' && f.addressee_id === u.id) { f.status = 'accepted'; f.created_at = now(); }
      else if ((m[2] === 'reject' && f.addressee_id === u.id) || (m[2] === 'cancel' && f.requester_id === u.id)) d.friendships = d.friendships.filter((x) => x !== f);
      else fail(400, 'Acción no válida');
      return { ok: true };
    }],
    ['DELETE', /^\/friends\/(\d+)$/, (_b, m) => {
      const u = me(true), o = +m[1];
      db().friendships = db().friendships.filter((f) => !((f.requester_id === u.id && f.addressee_id === o) || (f.requester_id === o && f.addressee_id === u.id)));
      return { ok: true };
    }],
  ];

  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, opts = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, 'https://preview.local');
    if (!url.pathname.startsWith('/api/')) return realFetch(input, opts);
    const path = url.pathname.slice(4), method = (opts.method || 'GET').toUpperCase();
    const body = opts.body ? JSON.parse(opts.body) : {};
    const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
    for (const [m, re, fn] of routes) {
      const match = method === m && path.match(re);
      if (!match) continue;
      try {
        const data = await fn(body, match, url.searchParams);
        save();
        return json(200, data);
      } catch (e) {
        if (e instanceof E) return json(e.status, { error: e.message });
        console.error(e);
        return json(500, { error: 'Error en la vista previa' });
      }
    }
    return json(404, { error: 'Ruta no encontrada' });
  };
})();
