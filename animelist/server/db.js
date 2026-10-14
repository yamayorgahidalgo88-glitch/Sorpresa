import { createClient } from '@libsql/client';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// Local: fichero SQLite en data/. En la nube: DATABASE_URL=libsql://... (Turso) + DATABASE_TOKEN.
// La integración de Turso en Vercel crea TURSO_DATABASE_URL y TURSO_AUTH_TOKEN.
function makeClient() {
  const env = process.env;
  // Con «Custom Prefix» las variables cambian de nombre (p. ej. STORAGE_DATABASE_URL): buscamos cualquier libsql://
  const urlKey = ['DATABASE_URL', 'TURSO_DATABASE_URL'].find((k) => env[k]) ||
    Object.keys(env).find((k) => /^(libsql|https?):\/\/.+turso\.io/.test(env[k] || '') || /^libsql:\/\//.test(env[k] || ''));
  if (urlKey) {
    const prefix = urlKey.replace(/_?(DATABASE_)?URL$/, '');
    const authToken = env.DATABASE_TOKEN || env.TURSO_AUTH_TOKEN || env[`${prefix}_AUTH_TOKEN`] || env[`${prefix}_TOKEN`] ||
      env[Object.keys(env).find((k) => k.endsWith('AUTH_TOKEN')) || ''];
    return createClient({ url: env[urlKey], authToken });
  }
  // En Vercel el disco no es permanente: sin base de datos externa se perderían las cuentas.
  if (process.env.VERCEL) throw new Error('Falta la base de datos: conecta Turso al proyecto (TURSO_DATABASE_URL / TURSO_AUTH_TOKEN)');
  const file = process.env.DB_FILE || path.join(ROOT, 'data', 'app.db');
  mkdirSync(path.dirname(file), { recursive: true });
  return createClient({ url: 'file:' + file });
}

export const db = makeClient();

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    pass_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL,
    UNIQUE (requester_id, addressee_id)
  )`,
  `CREATE TABLE IF NOT EXISTS lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS list_members (
    list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    PRIMARY KEY (list_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS list_people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    position INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    title TEXT NOT NULL,
    jw_id TEXT,
    poster TEXT,
    kind TEXT,
    duration TEXT,
    platform TEXT,
    language TEXT,
    together INTEGER NOT NULL DEFAULT 0,
    availability TEXT,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS entry_marks (
    entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    person_id INTEGER NOT NULL REFERENCES list_people(id) ON DELETE CASCADE,
    seen INTEGER NOT NULL DEFAULT 0,
    rating REAL,
    PRIMARY KEY (entry_id, person_id)
  )`,
  `CREATE TABLE IF NOT EXISTS list_invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    from_user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    person_id INTEGER,
    created_at INTEGER NOT NULL,
    UNIQUE (list_id, to_user)
  )`,
  `CREATE TABLE IF NOT EXISTS pending_orders (
    list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ids TEXT NOT NULL,
    PRIMARY KEY (list_id, user_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_entries_list ON entries(list_id, position)`,
  `CREATE INDEX IF NOT EXISTS idx_members_user ON list_members(user_id)`,
];

// Columnas añadidas después de la primera versión (bases de datos ya existentes)
const MIGRATIONS = [
  'ALTER TABLE users ADD COLUMN color TEXT',
  'ALTER TABLE users ADD COLUMN quiz_done INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE users ADD COLUMN quiz_result TEXT',
  'ALTER TABLE list_people ADD COLUMN user_id INTEGER',
];

export async function initDb() {
  await db.execute('PRAGMA foreign_keys = ON');
  await db.batch(SCHEMA, 'write');
  for (const sql of MIGRATIONS) {
    try { await db.execute(sql); } catch (e) { if (!/duplicate column/i.test(e.message)) throw e; }
  }
}

// Helpers
export const all = async (sql, args = []) => (await db.execute({ sql, args })).rows;
export const one = async (sql, args = []) => (await db.execute({ sql, args })).rows[0] || null;
export const run = (sql, args = []) => db.execute({ sql, args });
export const tx = (stmts) => db.batch(stmts.map(([sql, args = []]) => ({ sql, args })), 'write');
