import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { one, run } from './db.js';

const scryptAsync = promisify(scrypt);
export const COOKIE = 'al_session';

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  const [, salt, hash] = stored.split('$');
  const expected = Buffer.from(hash, 'base64');
  const key = await scryptAsync(password, Buffer.from(salt, 'base64'), expected.length);
  return timingSafeEqual(key, expected);
}

export async function createSession(userId) {
  const token = randomBytes(32).toString('base64url');
  await run('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)', [token, userId, Date.now()]);
  return token;
}

function readCookie(req) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE) return decodeURIComponent(v.join('='));
  }
  return null;
}

export function setSessionCookie(req, res, token) {
  const secure = req.secure ? '; Secure' : '';
  const maxAge = token ? 60 * 60 * 24 * 365 : 0;
  res.setHeader('Set-Cookie', `${COOKIE}=${token || ''}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`);
}

/** Middleware: añade req.user si la cookie de sesión es válida. */
export async function loadUser(req, _res, next) {
  try {
    const token = readCookie(req);
    req.sessionToken = token;
    req.user = token
      ? await one('SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?', [token])
      : null;
    next();
  } catch (e) {
    next(e);
  }
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Inicia sesión para continuar' });
  next();
}

// Freno simple contra fuerza bruta en el login (por IP + usuario).
const attempts = new Map();
export function tooManyAttempts(key) {
  const now = Date.now();
  const a = attempts.get(key) || { n: 0, t: now };
  if (now - a.t > 15 * 60 * 1000) { a.n = 0; a.t = now; }
  a.n++;
  attempts.set(key, a);
  return a.n > 10;
}
export const clearAttempts = (key) => attempts.delete(key);
