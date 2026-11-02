// Guardado: perfil en localStorage, audio y análisis en IndexedDB. Todo local al dispositivo.

const LS_KEY = 'superstar.profile.v1';

export function defaultProfile() {
  return {
    name: 'ARMY',
    level: 1,
    exp: 0,
    rp: 6000,             // regalo de bienvenida: alcanza para el primer sobre
    hp: 10,
    hpTs: Date.now(),
    cards: [],            // {uid, member, theme, grade, lvl}
    deck: Array(7).fill(null),
    records: {},          // "songId|diff" -> {score, rank, fc, ap, plays}
    customSongs: [],      // {id, title, artist, theme}
    settings: { speed: 5, offset: 0, music: 0.9, sfx: true, sfxVol: 0.45, fx: true },
    welcomed: false,
    lastDiff: 'normal',
    uid: 1,
  };
}

export function loadProfile() {
  const d = defaultProfile();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return d;
    const p = JSON.parse(raw);
    return { ...d, ...p, settings: { ...d.settings, ...(p.settings || {}) } };
  } catch { return d; }
}

export function saveProfile(p) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(p)); } catch { /* modo privado */ }
}

export function resetProfile() {
  try { localStorage.removeItem(LS_KEY); } catch {}
}

// ---------- IndexedDB ----------
let dbp = null;
function db() {
  if (!dbp) {
    dbp = new Promise((resolve, reject) => {
      const r = indexedDB.open('superstar', 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains('audio')) d.createObjectStore('audio');
        if (!d.objectStoreNames.contains('analysis')) d.createObjectStore('analysis');
      };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  return dbp;
}

function tx(store, mode, fn) {
  return db().then(d => new Promise((resolve, reject) => {
    const t = d.transaction(store, mode);
    const s = t.objectStore(store);
    let out;
    const req = fn(s);
    if (req) req.onsuccess = () => { out = req.result; };
    t.oncomplete = () => resolve(out);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

export const idb = {
  get: (store, key) => tx(store, 'readonly', s => s.get(key)),
  put: (store, key, val) => tx(store, 'readwrite', s => s.put(val, key)),
  del: (store, key) => tx(store, 'readwrite', s => s.delete(key)),
  keys: (store) => tx(store, 'readonly', s => s.getAllKeys()),
  clear: (store) => tx(store, 'readwrite', s => s.clear()),
};

export async function askPersistent() {
  try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch {}
}
