import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'catalog.json');

export const norm = (s = '') =>
  s.toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9぀-ヿ一-鿿]+/g, ' ').trim();

const trigrams = (s) => {
  const t = new Set();
  const p = `  ${s} `;
  for (let i = 0; i < p.length - 2; i++) t.add(p.slice(i, i + 3));
  return t;
};
const dice = (a, b) => {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return (2 * n) / (a.size + b.size || 1);
};

let meta = { builtAt: null, count: 0 };
let items = [];

export function loadCatalog() {
  if (!existsSync(FILE)) return;
  const data = JSON.parse(readFileSync(FILE, 'utf8'));
  meta = { builtAt: data.builtAt, count: data.count };
  items = data.items.map((it, rank) => {
    const names = [it.title, it.original, ...(it.aka || [])].filter(Boolean).map(norm);
    return { it, rank, names, grams: names.map(trigrams) };
  });
}
loadCatalog();

export const catalogMeta = () => meta;
export const topPosters = (n) => items.filter((x) => x.it.poster).slice(0, n).map((x) => x.it.poster);
export const topTitles = (n) => items.slice(0, n).map((x) => x.it.title);
export const getById =(id) => items.find((x) => x.it.id === id)?.it || null;

/** Búsqueda tolerante a erratas ("tokyo goul", "black cover", "kimetsu"). */
export function searchCatalog(query, limit = 10) {
  const q = norm(query);
  if (!q) return [];
  const qg = trigrams(q);
  const qWords = q.split(' ');
  const scored = [];
  for (const x of items) {
    let best = 0;
    x.names.forEach((n, i) => {
      let s;
      if (n === q) s = 100;
      else if (n.startsWith(q)) s = 80;
      else if (n.includes(' ' + q) ) s = 70;
      else if (qWords.every((w) => n.includes(w))) s = 60;
      else s = dice(qg, x.grams[i]) * 70;
      if (s > best) best = s;
    });
    if (best >= 30) scored.push({ s: best - x.rank / 400, it: x.it });
  }
  return scored.sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.it);
}

/** Mejor coincidencia razonable para un nombre escrito a mano (usado al importar). */
export function bestMatch(name, { type } = {}) {
  const res = searchCatalog(name, 8).filter((it) => !type || it.type === type);
  return res[0] || null;
}
