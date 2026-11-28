// GREVOS · cuentas y amigos. Una sola función: POST /api/cuenta  { op, ... }
// Guarda un JSON por jugador en Vercel Blob (privado): users/<clave>.json
// Sin contraseña: cada dispositivo guarda un token secreto; aquí solo se guarda su hash.
const crypto = require('crypto');

/* ---------- almacenamiento: Vercel Blob en producción, carpeta local para pruebas ---------- */
const store = process.env.BLOB_READ_WRITE_TOKEN ? (() => {
  const { put, get, del } = require('@vercel/blob');
  return {
    async read(path) {
      const r = await get(path, { access: 'private', useCache: false }).catch(e => { if (/not.?found/i.test(e.name + e.message)) return null; throw e; });
      if (!r || !r.stream) return null;
      return JSON.parse(await new Response(r.stream).text());
    },
    async create(path, data) {   // falla si ya existe
      try { await put(path, JSON.stringify(data), { access: 'private', addRandomSuffix: false, allowOverwrite: false, contentType: 'application/json' }); return true; }
      catch (e) { if (/exist|already|precondition|conflict/i.test(e.name + e.message)) return false; throw e; }
    },
    async write(path, data) { await put(path, JSON.stringify(data), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' }); },
    async remove(path) { await del(path); },
  };
})() : (() => {
  const fs = require('fs'), dir = process.env.GREVOS_DATA || '/tmp/grevos-data';
  const f = p => require('path').join(dir, p.replace(/\//g, '__'));
  fs.mkdirSync(dir, { recursive: true });
  return {
    async read(p) { try { return JSON.parse(fs.readFileSync(f(p), 'utf8')); } catch (e) { return null; } },
    async create(p, d) { try { fs.writeFileSync(f(p), JSON.stringify(d), { flag: 'wx' }); return true; } catch (e) { return false; } },
    async write(p, d) { fs.writeFileSync(f(p), JSON.stringify(d)); },
    async remove(p) { try { fs.unlinkSync(f(p)); } catch (e) { } },
  };
})();

/* ---------- utilidades ---------- */
const keyOf = n => String(n || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const validName = n => typeof n === 'string' && /^[\p{L}\p{N} _.-]{3,14}$/u.test(n.trim()) && n.trim() === n.replace(/\s+/g, ' ').trim();
const pathOf = n => 'users/' + encodeURIComponent(keyOf(n)) + '.json';
const hash = t => crypto.createHash('sha256').update(String(t || '')).digest('hex');
const PUBLIC = ['avatar', 'frame', 'mastery', 'bg', 'fav', 'streak', 'bestStreak', 'trophies', 'clan', 'wins'];
const cleanProfile = p => { const o = {}; for (const k of PUBLIC) if (p && p[k] !== undefined) o[k] = typeof p[k] === 'number' ? Math.max(0, Math.min(1e6, Math.round(p[k]))) : String(p[k]).slice(0, 40); return o; };
const pub = u => ({ name: u.name, profile: u.profile || {} });
class Err extends Error { constructor(code, msg) { super(msg); this.code = code; } }
async function load(name) { const u = await store.read(pathOf(name)); if (!u) throw new Err(404, 'Ese jugador no existe'); return u; }
async function auth(name, token) { const u = await load(name); if (u.tokenHash !== hash(token)) throw new Err(403, 'Sesión no válida'); return u; }
const uniq = a => [...new Set(a)];
const same = (a, b) => keyOf(a) === keyOf(b);

/* ---------- operaciones ---------- */
const OPS = {
  async check({ name }) { if (!validName(name)) return { ok: false, libre: false, msg: 'Nombre no válido' }; return { ok: true, libre: !(await store.read(pathOf(name))) }; },
  async register({ name, token, profile }) {
    if (!validName(name)) throw new Err(400, 'El nombre debe tener entre 3 y 14 letras o números');
    if (!token || String(token).length < 20) throw new Err(400, 'Falta el token');
    const u = { name: name.trim(), tokenHash: hash(token), created: Date.now(), profile: cleanProfile(profile), friends: [], requests: [], sent: [] };
    if (!(await store.create(pathOf(name), u))) throw new Err(409, 'Ese nombre ya está en uso');
    return { ok: true, me: { name: u.name, friends: [], requests: [], sent: [] } };
  },
  async me({ name, token }) { const u = await auth(name, token); return { ok: true, me: { name: u.name, friends: u.friends, requests: u.requests, sent: u.sent } }; },
  async save({ name, token, profile }) { const u = await auth(name, token); u.profile = cleanProfile(profile); await store.write(pathOf(u.name), u); return { ok: true }; },
  async invite({ name, token, to }) {
    const u = await auth(name, token);
    if (same(name, to)) throw new Err(400, 'No puedes invitarte a ti mismo');
    const t = await load(to);
    if (u.friends.some(f => same(f, t.name))) throw new Err(400, 'Ya sois amigos');
    if (u.requests.some(f => same(f, t.name))) return OPS.respond({ name, token, from: t.name, accept: true });   // ya te había invitado él: amigos directamente
    t.requests = uniq([...t.requests.filter(f => !same(f, u.name)), u.name]); u.sent = uniq([...u.sent.filter(f => !same(f, t.name)), t.name]);
    await store.write(pathOf(t.name), t); await store.write(pathOf(u.name), u);
    return { ok: true, msg: 'Invitación enviada a ' + t.name, me: { name: u.name, friends: u.friends, requests: u.requests, sent: u.sent } };
  },
  async respond({ name, token, from, accept }) {
    const u = await auth(name, token), f = await load(from);
    u.requests = u.requests.filter(x => !same(x, f.name)); f.sent = f.sent.filter(x => !same(x, u.name));
    if (accept) { u.friends = uniq([...u.friends, f.name]); f.friends = uniq([...f.friends.filter(x => !same(x, u.name)), u.name]); u.sent = u.sent.filter(x => !same(x, f.name)); f.requests = f.requests.filter(x => !same(x, u.name)); }
    await store.write(pathOf(f.name), f); await store.write(pathOf(u.name), u);
    return { ok: true, me: { name: u.name, friends: u.friends, requests: u.requests, sent: u.sent } };
  },
  async unfriend({ name, token, who }) {
    const u = await auth(name, token), f = await load(who);
    u.friends = u.friends.filter(x => !same(x, f.name)); f.friends = f.friends.filter(x => !same(x, u.name));
    await store.write(pathOf(f.name), f); await store.write(pathOf(u.name), u);
    return { ok: true, me: { name: u.name, friends: u.friends, requests: u.requests, sent: u.sent } };
  },
  async profile({ name, token, of }) {   // solo puedes ver el perfil de tus amigos
    const u = await auth(name, token);
    if (!same(name, of) && !u.friends.some(f => same(f, of))) throw new Err(403, 'Solo puedes ver el perfil de tus amigos');
    return { ok: true, user: pub(await load(of)) };
  },
  async borrar({ name, token }) { await auth(name, token); await store.remove(pathOf(name)); return { ok: true }; },
};

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(JSON.stringify({ ok: false, msg: 'Usa POST' })); }
  let body = req.body;
  if (!body || typeof body === 'string') { try { body = JSON.parse(body || await new Promise(r => { let d = ''; req.on('data', c => d += c); req.on('end', () => r(d)); })); } catch (e) { body = {}; } }
  const fn = OPS[body && body.op];
  res.setHeader('Content-Type', 'application/json');
  if (!fn) { res.statusCode = 400; return res.end(JSON.stringify({ ok: false, msg: 'Operación desconocida' })); }
  try { res.statusCode = 200; res.end(JSON.stringify(await fn(body))); }
  catch (e) { res.statusCode = e.code || 500; res.end(JSON.stringify({ ok: false, msg: e.code ? e.message : 'Error del servidor' })); if (!e.code) console.error(e); }
};
