import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDb, all, one, run, tx } from './db.js';
import {
  hashPassword, verifyPassword, createSession, setSessionCookie,
  loadUser, requireUser, tooManyAttempts, clearAttempts,
} from './auth.js';
import { searchCatalog, getById, catalogMeta, topPosters, norm } from './catalog.js';
import { liveSearch, liveDetail, JW_PACKAGES } from './justwatch.js';
import { TEMPLATE_PEOPLE, TEMPLATE_ROWS } from './template-my.js';
import { COLORS, RESERVED, DEFAULT_COLOR, QUIZ_RESULTS, FALLBACK_COLOR } from './profile.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

export const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '200kb' }));
app.use(loadUser);

// Envuelve handlers async y convierte errores "HttpError" en respuestas.
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const fail = (status, msg) => { throw new HttpError(status, msg); };
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const api = express.Router();
app.use('/api', api);

const USERNAME_RE = /^[a-zA-Z0-9_.]{3,20}$/;
const cleanText = (v, max = 200) => (v == null ? null : String(v).trim().slice(0, max) || null);
const intId = (v) => { const n = Number(v); if (!Number.isInteger(n) || n <= 0) fail(400, 'Id no válido'); return n; };
const publicUser = (u) => ({ id: u.id, username: u.username, color: u.color || null, quizDone: !!u.quiz_done, quizResult: u.quiz_result || null });

// ───────────── Cuenta ─────────────
api.post('/auth/register', h(async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  if (!USERNAME_RE.test(username)) fail(400, 'El usuario debe tener 3-20 caracteres: letras, números, "_" o "."');
  if (password.length < 6) fail(400, 'La contraseña debe tener al menos 6 caracteres');
  if (await one('SELECT 1 FROM users WHERE username = ?', [username])) fail(409, 'Ese nombre de usuario ya existe');
  const color = DEFAULT_COLOR(username);
  const r = await run('INSERT INTO users (username, pass_hash, created_at, color, quiz_done) VALUES (?, ?, ?, ?, 0)',
    [username, await hashPassword(password), Date.now(), color]);
  const id = Number(r.lastInsertRowid);
  setSessionCookie(req, res, await createSession(id), { persistent: req.body.remember !== false });
  res.status(201).json({ user: publicUser({ id, username, color, quiz_done: 0 }) });
}));

api.post('/auth/login', h(async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const key = `${req.ip}:${username.toLowerCase()}`;
  if (tooManyAttempts(key)) fail(429, 'Demasiados intentos. Espera unos minutos.');
  const u = await one('SELECT id, username, pass_hash, color, quiz_done, quiz_result FROM users WHERE username = ?', [username]);
  if (!u || !(await verifyPassword(password, u.pass_hash))) fail(401, 'Usuario o contraseña incorrectos');
  clearAttempts(key);
  setSessionCookie(req, res, await createSession(u.id), { persistent: req.body.remember !== false });
  res.json({ user: publicUser(u) });
}));

api.post('/auth/logout', h(async (req, res) => {
  if (req.sessionToken) await run('DELETE FROM sessions WHERE token = ?', [req.sessionToken]);
  setSessionCookie(req, res, null);
  res.json({ ok: true });
}));

api.get('/me', h(async (req, res) => {
  if (!req.user) return res.json({ user: null });
  const me = req.user.id;
  const stats = await one(`SELECT
      (SELECT COUNT(*) FROM list_members WHERE user_id = ?) AS lists,
      (SELECT COUNT(*) FROM friendships WHERE status = 'accepted' AND (requester_id = ? OR addressee_id = ?)) AS friends,
      (SELECT COUNT(*) FROM friendships WHERE status = 'pending' AND addressee_id = ?)
        + (SELECT COUNT(*) FROM list_invites WHERE to_user = ?) AS requests`,
  [me, me, me, me, me]);
  const created = await one('SELECT created_at FROM users WHERE id = ?', [me]);
  res.json({ user: { ...publicUser(req.user), createdAt: created.created_at }, stats });
}));

// Color y resultado del test de personalidad
api.patch('/me', requireUser, h(async (req, res) => {
  const u = req.user;
  let { color, quiz_done: quizDone, quiz_result: quizResult } = u;
  if ('color' in req.body) {
    const c = String(req.body.color || '').toLowerCase();
    if (!COLORS[c]) fail(400, 'Ese color no está disponible');
    if (RESERVED[c] && RESERVED[c] !== u.username.toLowerCase()) fail(403, `El ${COLORS[c].toLowerCase()} está reservado para otra persona`);
    color = c;
  }
  if ('quizResult' in req.body) {
    if (!QUIZ_RESULTS.includes(req.body.quizResult)) fail(400, 'Resultado no válido');
    quizResult = req.body.quizResult;
    quizDone = 1;
  }
  await run('UPDATE users SET color = ?, quiz_done = ?, quiz_result = ? WHERE id = ?', [color, quizDone, quizResult, u.id]);
  res.json({ user: publicUser({ ...u, color, quiz_done: quizDone, quiz_result: quizResult }) });
}));

api.get('/meta', (_req, res) => res.json({ catalog: catalogMeta(), platforms: JW_PACKAGES.map(({ key, name }) => ({ key, name })) }));

// Pósters para el fondo animado (público: también se ve en la pantalla de login)
api.get('/backdrop', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=86400');
  res.json({ posters: topPosters(48) });
});

// ───────────── Catálogo de anime (España) ─────────────
api.get('/anime/search', requireUser, h(async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 80);
  if (q.length < 2) return res.json({ results: [] });
  const local = searchCatalog(q, 10);
  let live = [];
  try {
    live = await Promise.race([liveSearch(q), new Promise((r) => setTimeout(() => r([]), 2500))]);
  } catch { /* sin conexión con JustWatch: nos quedamos con el catálogo local */ }
  const seen = new Set();
  const nq = norm(q);
  // Primero coincidencias exactas/prefijo del catálogo, luego la búsqueda en vivo, luego el resto.
  const strong = local.filter((it) => [it.title, ...(it.aka || [])].some((n) => norm(n).startsWith(nq)));
  const merged = [...strong, ...live, ...local].filter((it) => !seen.has(it.id) && seen.add(it.id));
  res.json({ results: merged.slice(0, 12) });
}));

api.get('/anime/:id', requireUser, h(async (req, res) => {
  const id = String(req.params.id);
  if (!/^t[ms]\d+$/.test(id)) fail(400, 'Id no válido');
  let item = null;
  try { item = await liveDetail(id); } catch { item = getById(id); }
  if (!item) fail(404, 'No encontrado');
  res.json({ item, live: !!item });
}));

// ───────────── Tablas ─────────────
async function membership(listId, userId) {
  const m = await one(`SELECT l.id, l.owner_id, l.name, m.role FROM lists l
    JOIN list_members m ON m.list_id = l.id AND m.user_id = ? WHERE l.id = ?`, [userId, listId]);
  if (!m) fail(404, 'Tabla no encontrada');
  return m;
}
const touch = (listId) => run('UPDATE lists SET updated_at = ? WHERE id = ?', [Date.now(), listId]);

async function entryInList(entryId, userId) {
  const e = await one('SELECT id, list_id FROM entries WHERE id = ?', [entryId]);
  if (!e) fail(404, 'Anime no encontrado');
  await membership(e.list_id, userId);
  return e;
}

async function addPersonColumn(listId, userId) {
  const n = (await one('SELECT COUNT(*) AS n FROM list_people WHERE list_id = ?', [listId])).n;
  await run('INSERT INTO list_people (list_id, name, color, position, user_id) VALUES (?, ?, ?, ?, ?)', [listId, '', FALLBACK_COLOR, n, userId]);
}

// Al salir alguien de la tabla, su columna se queda con su nombre pero sin dueño (nadie puede editarla).
async function unlinkColumns(listId, userId) {
  const u = await one('SELECT username, color FROM users WHERE id = ?', [userId]);
  await run('UPDATE list_people SET user_id = NULL, name = ?, color = COALESCE(?, color) WHERE list_id = ? AND user_id = ?',
    [u?.username || 'Antiguo miembro', u?.color, listId, userId]);
  await run('DELETE FROM pending_orders WHERE list_id = ? AND user_id = ?', [listId, userId]);
}

api.get('/lists', requireUser, h(async (req, res) => {
  const lists = await all(`SELECT l.id, l.name, l.owner_id, l.updated_at, m.role, u.username AS owner,
      (SELECT COUNT(*) FROM entries e WHERE e.list_id = l.id) AS count,
      (SELECT COUNT(*) FROM list_members x WHERE x.list_id = l.id) AS members
    FROM lists l JOIN list_members m ON m.list_id = l.id AND m.user_id = ?
    JOIN users u ON u.id = l.owner_id ORDER BY l.updated_at DESC`, [req.user.id]);
  const covers = await all(`SELECT e.list_id, e.poster FROM entries e
    JOIN list_members m ON m.list_id = e.list_id AND m.user_id = ?
    WHERE e.poster IS NOT NULL ORDER BY e.position`, [req.user.id]);
  res.json({
    lists: lists.map((l) => ({
      ...l,
      covers: covers.filter((c) => c.list_id === l.id).slice(0, 4).map((c) => c.poster),
    })),
  });
}));

api.post('/lists', requireUser, h(async (req, res) => {
  const name = cleanText(req.body.name, 60);
  if (!name) fail(400, 'Ponle un nombre a la tabla');
  const now = Date.now();
  const r = await run('INSERT INTO lists (owner_id, name, created_at, updated_at) VALUES (?, ?, ?, ?)', [req.user.id, name, now, now]);
  const listId = Number(r.lastInsertRowid);
  await run('INSERT INTO list_members (list_id, user_id, role) VALUES (?, ?, ?)', [listId, req.user.id, 'owner']);
  if (req.body.template === 'my') await importTemplate(listId, req.user.id);
  else await addPersonColumn(listId, req.user.id);
  res.status(201).json({ id: listId });
}));

async function importTemplate(listId, ownerId) {
  const peopleIds = [];
  for (const [i, p] of TEMPLATE_PEOPLE.entries()) {
    const r = await run('INSERT INTO list_people (list_id, name, color, position, user_id) VALUES (?, ?, ?, ?, ?)',
      [listId, p.name, p.color, i, p.owner ? ownerId : null]);
    peopleIds.push(Number(r.lastInsertRowid));
  }
  const now = Date.now();
  for (const [pos, [title, duration, platform, language, mMark, yMark, jwId]] of TEMPLATE_ROWS.entries()) {
    const cat = jwId ? getById(jwId) : null;
    const r = await run(`INSERT INTO entries (list_id, position, title, jw_id, poster, kind, duration, platform, language, availability, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [listId, pos, title, jwId || null, cat?.poster || null, duration === 'Película' ? 'movie' : 'show',
      duration, platform, language, cat ? JSON.stringify(cat.platforms) : null, now + pos]);
    const entryId = Number(r.lastInsertRowid);
    await tx([mMark, yMark].map(([seen, rating], k) => [
      'INSERT INTO entry_marks (entry_id, person_id, seen, rating) VALUES (?, ?, ?, ?)', [entryId, peopleIds[k], seen, rating]]));
  }
}

api.get('/lists/:id', requireUser, h(async (req, res) => {
  const listId = intId(req.params.id);
  const m = await membership(listId, req.user.id);
  const [list, people, entries, marks, members, invites, order] = await Promise.all([
    one('SELECT id, name, owner_id, updated_at FROM lists WHERE id = ?', [listId]),
    all(`SELECT p.id, p.position, p.user_id, COALESCE(u.username, p.name) AS name, COALESCE(u.color, p.color) AS color
      FROM list_people p LEFT JOIN users u ON u.id = p.user_id WHERE p.list_id = ? ORDER BY p.position, p.id`, [listId]),
    all('SELECT * FROM entries WHERE list_id = ? ORDER BY position, id', [listId]),
    all('SELECT k.entry_id, k.person_id, k.seen, k.rating FROM entry_marks k JOIN entries e ON e.id = k.entry_id WHERE e.list_id = ?', [listId]),
    all('SELECT u.id, u.username, u.color, m.role FROM list_members m JOIN users u ON u.id = m.user_id WHERE m.list_id = ? ORDER BY m.role DESC, u.username', [listId]),
    all('SELECT i.id, i.to_user, i.person_id, u.username FROM list_invites i JOIN users u ON u.id = i.to_user WHERE i.list_id = ?', [listId]),
    one('SELECT ids FROM pending_orders WHERE list_id = ? AND user_id = ?', [listId, req.user.id]),
  ]);
  const byEntry = {};
  for (const k of marks) (byEntry[k.entry_id] ||= {})[k.person_id] = { seen: !!k.seen, rating: k.rating };
  res.json({
    list: { ...list, role: m.role },
    people,
    members,
    invites: m.role === 'owner' ? invites : [],
    pendingOrder: order ? JSON.parse(order.ids) : [],
    entries: entries.map((e) => ({
      ...e,
      availability: e.availability ? JSON.parse(e.availability) : null,
      marks: byEntry[e.id] || {},
    })),
  });
}));

api.patch('/lists/:id', requireUser, h(async (req, res) => {
  const listId = intId(req.params.id);
  await membership(listId, req.user.id);
  const name = cleanText(req.body.name, 60);
  if (!name) fail(400, 'Nombre vacío');
  await run('UPDATE lists SET name = ?, updated_at = ? WHERE id = ?', [name, Date.now(), listId]);
  res.json({ ok: true });
}));

// Dueño: borra la tabla para todos. Invitado: sale de la tabla.
api.delete('/lists/:id', requireUser, h(async (req, res) => {
  const listId = intId(req.params.id);
  const m = await membership(listId, req.user.id);
  if (m.role !== 'owner') {
    await unlinkColumns(listId, req.user.id);
    await run('DELETE FROM list_members WHERE list_id = ? AND user_id = ?', [listId, req.user.id]);
    await touch(listId);
    return res.json({ ok: true, left: true });
  }
  await tx([
    ['DELETE FROM entry_marks WHERE entry_id IN (SELECT id FROM entries WHERE list_id = ?)', [listId]],
    ['DELETE FROM entries WHERE list_id = ?', [listId]],
    ['DELETE FROM list_people WHERE list_id = ?', [listId]],
    ['DELETE FROM list_invites WHERE list_id = ?', [listId]],
    ['DELETE FROM pending_orders WHERE list_id = ?', [listId]],
    ['DELETE FROM list_members WHERE list_id = ?', [listId]],
    ['DELETE FROM lists WHERE id = ?', [listId]],
  ]);
  res.json({ ok: true, deleted: true });
}));

// Columnas sin dueño (p. ej. «Marta» antes de unirse): solo el creador puede renombrarlas o quitarlas.
async function freeColumn(personId, user) {
  const p = await one('SELECT id, list_id, user_id FROM list_people WHERE id = ?', [personId]);
  if (!p) fail(404, 'Columna no encontrada');
  const m = await membership(p.list_id, user.id);
  if (m.role !== 'owner') fail(403, 'Solo quien creó la tabla puede cambiar las columnas');
  if (p.user_id) fail(400, 'Esa columna es de una persona de la tabla');
  return p;
}

api.patch('/people/:pid', requireUser, h(async (req, res) => {
  const p = await freeColumn(intId(req.params.pid), req.user);
  const name = cleanText(req.body.name, 24);
  if (!name) fail(400, 'Pon un nombre');
  await run('UPDATE list_people SET name = ? WHERE id = ?', [name, p.id]);
  await touch(p.list_id);
  res.json({ ok: true });
}));

api.delete('/people/:pid', requireUser, h(async (req, res) => {
  const p = await freeColumn(intId(req.params.pid), req.user);
  await tx([
    ['DELETE FROM entry_marks WHERE person_id = ?', [p.id]],
    ['UPDATE list_invites SET person_id = NULL WHERE person_id = ?', [p.id]],
    ['DELETE FROM list_people WHERE id = ?', [p.id]],
  ]);
  await touch(p.list_id);
  res.json({ ok: true });
}));

// Animes de una tabla
const ENTRY_FIELDS = {
  title: (v) => cleanText(v, 120),
  jw_id: (v) => (v && /^t[ms]\d+$/.test(v) ? v : null),
  poster: (v) => (v && /^https:\/\/images\.justwatch\.com\//.test(v) ? v : null),
  kind: (v) => (v === 'movie' ? 'movie' : 'show'),
  duration: (v) => cleanText(v, 30),
  platform: (v) => cleanText(v, 40),
  language: (v) => cleanText(v, 40),
  availability: (v) => (Array.isArray(v) ? JSON.stringify(v.slice(0, 8)).slice(0, 4000) : null),
};
function pickEntry(body, partial) {
  const out = {};
  for (const [k, f] of Object.entries(ENTRY_FIELDS)) if (!partial || k in body) out[k] = f(body[k]);
  return out;
}

api.post('/lists/:id/entries', requireUser, h(async (req, res) => {
  const listId = intId(req.params.id);
  await membership(listId, req.user.id);
  const e = pickEntry(req.body, false);
  if (!e.title) fail(400, 'Escribe el nombre del anime');
  const pos = (await one('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM entries WHERE list_id = ?', [listId])).p;
  const r = await run(`INSERT INTO entries (list_id, position, title, jw_id, poster, kind, duration, platform, language, availability, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [listId, pos, e.title, e.jw_id, e.poster, e.kind, e.duration, e.platform, e.language, e.availability, Date.now()]);
  await touch(listId);
  res.status(201).json({ id: Number(r.lastInsertRowid) });
}));

api.patch('/entries/:eid', requireUser, h(async (req, res) => {
  const ent = await entryInList(intId(req.params.eid), req.user.id);
  const e = pickEntry(req.body, true);
  if ('title' in e && !e.title) fail(400, 'El nombre no puede estar vacío');
  const keys = Object.keys(e);
  if (keys.length) {
    await run(`UPDATE entries SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`, [...keys.map((k) => e[k]), ent.id]);
    await touch(ent.list_id);
  }
  res.json({ ok: true });
}));

api.delete('/entries/:eid', requireUser, h(async (req, res) => {
  const ent = await entryInList(intId(req.params.eid), req.user.id);
  await tx([
    ['DELETE FROM entry_marks WHERE entry_id = ?', [ent.id]],
    ['DELETE FROM entries WHERE id = ?', [ent.id]],
  ]);
  await touch(ent.list_id);
  res.json({ ok: true });
}));

// Orden personal de la vista «Pendientes»
api.put('/lists/:id/pending-order', requireUser, h(async (req, res) => {
  const listId = intId(req.params.id);
  await membership(listId, req.user.id);
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(Number).filter(Number.isInteger).slice(0, 2000) : [];
  await run(`INSERT INTO pending_orders (list_id, user_id, ids) VALUES (?, ?, ?)
    ON CONFLICT (list_id, user_id) DO UPDATE SET ids = excluded.ids`, [listId, req.user.id, JSON.stringify(ids)]);
  res.json({ ok: true });
}));

// Check (visto) y nota: cada persona solo puede cambiar los suyos
api.put('/entries/:eid/marks/:pid', requireUser, h(async (req, res) => {
  const ent = await entryInList(intId(req.params.eid), req.user.id);
  const person = await one('SELECT id, user_id FROM list_people WHERE id = ? AND list_id = ?', [intId(req.params.pid), ent.list_id]);
  if (!person) fail(404, 'Columna no encontrada');
  if (person.user_id !== req.user.id) fail(403, 'Solo puedes cambiar tu propio check y tu nota');
  const cur = await one('SELECT seen, rating FROM entry_marks WHERE entry_id = ? AND person_id = ?', [ent.id, person.id]) || { seen: 0, rating: null };
  let { seen, rating } = cur;
  if ('seen' in req.body) seen = req.body.seen ? 1 : 0;
  if ('rating' in req.body) {
    if (req.body.rating === null || req.body.rating === '') rating = null;
    else {
      rating = Math.round(Number(String(req.body.rating).replace(',', '.')) * 100) / 100;
      if (!Number.isFinite(rating) || rating < 0 || rating > 10) fail(400, 'La nota va de 0 a 10');
    }
  }
  await run(`INSERT INTO entry_marks (entry_id, person_id, seen, rating) VALUES (?, ?, ?, ?)
    ON CONFLICT (entry_id, person_id) DO UPDATE SET seen = excluded.seen, rating = excluded.rating`, [ent.id, person.id, seen, rating]);
  await touch(ent.list_id);
  res.json({ seen: !!seen, rating });
}));

// ───────────── Compartir: invitación que el amigo acepta o rechaza ─────────────
api.post('/lists/:id/share', requireUser, h(async (req, res) => {
  const listId = intId(req.params.id);
  const m = await membership(listId, req.user.id);
  if (m.role !== 'owner') fail(403, 'Solo quien creó la tabla puede compartirla');
  const friend = await one('SELECT id, username FROM users WHERE id = ?', [intId(req.body.userId)]);
  if (!friend || !(await areFriends(req.user.id, friend.id))) fail(400, 'Solo puedes compartir con tus amigos');
  if (await one('SELECT 1 FROM list_members WHERE list_id = ? AND user_id = ?', [listId, friend.id])) fail(409, 'Ya está en la tabla');
  let personId = null;
  if (req.body.personId) {
    const p = await one('SELECT id FROM list_people WHERE id = ? AND list_id = ? AND user_id IS NULL', [intId(req.body.personId), listId]);
    if (!p) fail(400, 'Esa columna ya no está libre');
    personId = p.id;
  }
  await run(`INSERT INTO list_invites (list_id, from_user, to_user, person_id, created_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (list_id, to_user) DO UPDATE SET person_id = excluded.person_id, created_at = excluded.created_at`,
  [listId, req.user.id, friend.id, personId, Date.now()]);
  res.status(201).json({ ok: true });
}));

// Cancelar invitación o sacar a alguien de la tabla (solo el creador)
api.delete('/lists/:id/share/:userId', requireUser, h(async (req, res) => {
  const listId = intId(req.params.id);
  const m = await membership(listId, req.user.id);
  if (m.role !== 'owner') fail(403, 'Solo quien creó la tabla puede gestionar con quién se comparte');
  const uid = intId(req.params.userId);
  if (uid === req.user.id) fail(400, 'No puedes sacarte de tu propia tabla');
  await run('DELETE FROM list_invites WHERE list_id = ? AND to_user = ?', [listId, uid]);
  if (await one('SELECT 1 FROM list_members WHERE list_id = ? AND user_id = ?', [listId, uid])) {
    await unlinkColumns(listId, uid);
    await run('DELETE FROM list_members WHERE list_id = ? AND user_id = ?', [listId, uid]);
    await touch(listId);
  }
  res.json({ ok: true });
}));

api.post('/invites/:iid/:action', requireUser, h(async (req, res) => {
  const inv = await one('SELECT * FROM list_invites WHERE id = ? AND to_user = ?', [intId(req.params.iid), req.user.id]);
  if (!inv) fail(404, 'Invitación no encontrada');
  if (req.params.action === 'reject') {
    await run('DELETE FROM list_invites WHERE id = ?', [inv.id]);
    return res.json({ ok: true });
  }
  if (req.params.action !== 'accept') fail(400, 'Acción no válida');
  await run('INSERT OR IGNORE INTO list_members (list_id, user_id, role) VALUES (?, ?, ?)', [inv.list_id, req.user.id, 'editor']);
  const free = inv.person_id && await one('SELECT id FROM list_people WHERE id = ? AND list_id = ? AND user_id IS NULL', [inv.person_id, inv.list_id]);
  const already = await one('SELECT 1 FROM list_people WHERE list_id = ? AND user_id = ?', [inv.list_id, req.user.id]);
  if (free) await run('UPDATE list_people SET user_id = ? WHERE id = ?', [req.user.id, free.id]);
  else if (!already) await addPersonColumn(inv.list_id, req.user.id);
  await run('DELETE FROM list_invites WHERE id = ?', [inv.id]);
  await touch(inv.list_id);
  res.json({ ok: true, listId: inv.list_id });
}));

// ───────────── Amigos ─────────────
async function areFriends(a, b) {
  return !!(await one(`SELECT 1 FROM friendships WHERE status = 'accepted' AND
    ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?))`, [a, b, b, a]));
}

api.get('/friends', requireUser, h(async (req, res) => {
  const me = req.user.id;
  const rows = await all(`SELECT f.id, f.status, f.requester_id, f.addressee_id, f.created_at,
      ur.username AS requester, ur.color AS rcolor, ua.username AS addressee, ua.color AS acolor
    FROM friendships f JOIN users ur ON ur.id = f.requester_id JOIN users ua ON ua.id = f.addressee_id
    WHERE f.requester_id = ? OR f.addressee_id = ? ORDER BY f.created_at DESC`, [me, me]);
  const invites = await all(`SELECT i.id AS inviteId, i.created_at AS at, l.id AS listId, l.name AS listName,
      (SELECT COUNT(*) FROM entries e WHERE e.list_id = l.id) AS count, u.id AS fromId, u.username AS fromName, u.color AS fromColor
    FROM list_invites i JOIN lists l ON l.id = i.list_id JOIN users u ON u.id = i.from_user
    WHERE i.to_user = ? ORDER BY i.created_at DESC`, [me]);
  const other = (r) => (r.requester_id === me
    ? { id: r.addressee_id, username: r.addressee, color: r.acolor }
    : { id: r.requester_id, username: r.requester, color: r.rcolor });
  res.json({
    friends: rows.filter((r) => r.status === 'accepted').map((r) => ({ ...other(r), since: r.created_at }))
      .sort((a, b) => a.username.localeCompare(b.username)),
    incoming: rows.filter((r) => r.status === 'pending' && r.addressee_id === me).map((r) => ({ requestId: r.id, ...other(r), at: r.created_at })),
    outgoing: rows.filter((r) => r.status === 'pending' && r.requester_id === me).map((r) => ({ requestId: r.id, ...other(r), at: r.created_at })),
    invites,
  });
}));

api.get('/users/search', requireUser, h(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ users: [] });
  const like = q.replace(/[%_\\]/g, (c) => '\\' + c) + '%';
  const users = await all(`SELECT u.id, u.username, u.color,
      (SELECT f.status || ':' || CASE WHEN f.requester_id = ? THEN 'out' ELSE 'in' END FROM friendships f
        WHERE (f.requester_id = ? AND f.addressee_id = u.id) OR (f.requester_id = u.id AND f.addressee_id = ?)) AS relation
    FROM users u WHERE u.username LIKE ? ESCAPE '\\' AND u.id <> ? ORDER BY length(u.username), u.username LIMIT 15`,
  [req.user.id, req.user.id, req.user.id, like, req.user.id]);
  res.json({ users });
}));

api.post('/friends/request', requireUser, h(async (req, res) => {
  const target = await one('SELECT id, username FROM users WHERE username = ?', [String(req.body.username || '').trim()]);
  if (!target) fail(404, 'No existe ningún usuario con ese nombre');
  if (target.id === req.user.id) fail(400, 'No puedes enviarte una solicitud a ti mismo');
  const existing = await one(`SELECT * FROM friendships WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)`,
    [req.user.id, target.id, target.id, req.user.id]);
  if (existing?.status === 'accepted') fail(409, 'Ya sois amigos');
  if (existing && existing.requester_id === req.user.id) fail(409, 'Ya le enviaste una solicitud');
  if (existing) {
    // Él ya me la había enviado: aceptamos directamente
    await run("UPDATE friendships SET status = 'accepted' WHERE id = ?", [existing.id]);
    return res.json({ ok: true, accepted: true });
  }
  await run('INSERT INTO friendships (requester_id, addressee_id, status, created_at) VALUES (?, ?, ?, ?)', [req.user.id, target.id, 'pending', Date.now()]);
  res.status(201).json({ ok: true });
}));

api.post('/friends/requests/:rid/:action', requireUser, h(async (req, res) => {
  const r = await one("SELECT * FROM friendships WHERE id = ? AND status = 'pending'", [intId(req.params.rid)]);
  const action = req.params.action;
  if (!r) fail(404, 'Solicitud no encontrada');
  if (action === 'accept' && r.addressee_id === req.user.id) {
    await run("UPDATE friendships SET status = 'accepted', created_at = ? WHERE id = ?", [Date.now(), r.id]);
  } else if ((action === 'reject' && r.addressee_id === req.user.id) || (action === 'cancel' && r.requester_id === req.user.id)) {
    await run('DELETE FROM friendships WHERE id = ?', [r.id]);
  } else fail(400, 'Acción no válida');
  res.json({ ok: true });
}));

api.delete('/friends/:userId', requireUser, h(async (req, res) => {
  const other = intId(req.params.userId);
  await run(`DELETE FROM friendships WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)`,
    [req.user.id, other, other, req.user.id]);
  await run('DELETE FROM list_invites WHERE (from_user = ? AND to_user = ?) OR (from_user = ? AND to_user = ?)',
    [req.user.id, other, other, req.user.id]);
  res.json({ ok: true });
}));

api.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// ───────────── Frontend ─────────────
app.use(express.static(path.join(ROOT, 'public'), { maxAge: '1h', extensions: ['html'] }));
app.get('*', (_req, res) => res.sendFile(path.join(ROOT, 'public', 'index.html')));

app.use((err, _req, res, _next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Petición no válida' });
  console.error(err);
  res.status(500).json({ error: 'Error del servidor' });
});

// Prepara la base de datos una sola vez (también en Vercel, en la primera petición)
let initPromise = null;
export const ready = () => (initPromise ||= initDb().catch((e) => { initPromise = null; throw e; }));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await ready();
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => console.log(`Anime List M&Y → http://localhost:${port}`));
}
