// Cartas: miembro × era × rango. Arte original generado (sin fotos ni arte oficial).
import { MEMBERS, THEMES, GRADES, GRADE_INFO, DECK_SIZE, ERAS, LEGACY_ERA } from './data.js';

const PACK_THEMES = ERAS;

// Foto del miembro en el año de esa era (img/cards/<era>/<miembro>.jpg); si no hay, la foto general.
export function cardPhoto(card) {
  return ERAS.includes(card.theme) ? `img/cards/${card.theme}/${card.member}.jpg` : memberById(card.member).photo;
}
// Pasa las cartas guardadas con eras antiguas a las nuevas (sin perder ninguna).
export function migrateEras(profile) {
  let ch = false;
  for (const c of profile.cards) if (LEGACY_ERA[c.theme]) { c.theme = LEGACY_ERA[c.theme]; ch = true; }
  for (const s of profile.customSongs || []) if (LEGACY_ERA[s.theme]) { s.theme = LEGACY_ERA[s.theme]; ch = true; }
  // si al cambiar quedan dos cartas iguales, se juntan (la mejor se queda, la otra le sube el nivel)
  const seen = new Map();
  for (const c of [...profile.cards]) {
    const k = c.member + c.theme + c.grade, o = seen.get(k);
    if (!o) { seen.set(k, c); continue; }
    o.lvl = Math.min(GRADE_INFO[o.grade].maxLvl, Math.max(o.lvl, c.lvl) + 1);
    profile.cards = profile.cards.filter(x => x !== c);
    profile.deck = profile.deck.map(u => (u === c.uid ? (profile.deck.includes(o.uid) ? null : o.uid) : u));
    ch = true;
  }
  return ch;
}

export function memberById(id) { return MEMBERS.find(m => m.id === id) || MEMBERS[0]; }

export function cardPower(card, songTheme) {
  const g = GRADE_INFO[card.grade];
  let p = g.power * (1 + 0.08 * (card.lvl - 1));
  if (songTheme && card.theme === songTheme) p *= 1.5;  // bonus de tema
  return Math.round(p);
}

export function deckPower(profile, songTheme) {
  let sum = 0;
  const themes = {};
  for (const uid of profile.deck) {
    const c = profile.cards.find(x => x.uid === uid);
    if (!c) continue;
    sum += cardPower(c, songTheme);
    themes[c.theme] = (themes[c.theme] || 0) + 1;
  }
  // bonus de set: 4+ cartas de la misma era
  const maxSet = Math.max(0, ...Object.values(themes));
  if (maxSet >= 4) sum = Math.round(sum * (1 + 0.05 * (maxSet - 3)));
  return sum;
}

export function rollGrade(rng = Math.random) {
  let r = rng(), acc = 0;
  for (const g of [...GRADES].reverse()) { acc += GRADE_INFO[g].odds; if (r < acc) return g; }
  return 'C';
}

// Añade una carta al perfil. Si ya existe la misma (miembro+era+rango), sube de nivel.
export function grantCard(profile, member, theme, grade) {
  const dup = profile.cards.find(c => c.member === member && c.theme === theme && c.grade === grade);
  if (dup) {
    const max = GRADE_INFO[grade].maxLvl;
    const before = dup.lvl;
    dup.lvl = Math.min(max, dup.lvl + 1);
    if (dup.lvl === before) profile.rp += 800; // ya al máximo: se convierte en RP
    return { card: dup, dup: true, maxed: dup.lvl === before };
  }
  const card = { uid: profile.uid++, member, theme, grade, lvl: 1 };
  profile.cards.push(card);
  // si hay hueco en el mazo, se coloca sola
  const free = profile.deck.indexOf(null);
  if (free >= 0) profile.deck[free] = card.uid;
  return { card, dup: false };
}

export function openPack(profile, n = 1) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const m = MEMBERS[Math.floor(Math.random() * MEMBERS.length)].id;
    const t = PACK_THEMES[Math.floor(Math.random() * PACK_THEMES.length)];
    out.push(grantCard(profile, m, t, rollGrade()));
  }
  return out;
}

export function welcomePack(profile) {
  // Una carta de cada miembro para empezar con el mazo lleno.
  const out = [];
  MEMBERS.forEach((m, i) => {
    const t = PACK_THEMES[(i * 3) % PACK_THEMES.length];
    out.push(grantCard(profile, m.id, t, i === 0 ? 'A' : (i < 3 ? 'B' : 'C')));
  });
  return out;
}

export function autoDeck(profile, songTheme) {
  const best = [...profile.cards].sort((a, b) => cardPower(b, songTheme) - cardPower(a, songTheme)).slice(0, DECK_SIZE);
  profile.deck = Array(DECK_SIZE).fill(null).map((_, i) => best[i] ? best[i].uid : null);
}

function esc(s) { return String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }

// HTML de una carta. size: 'sm' | 'md' | 'lg'
export function cardHTML(card, { size = 'md', extra = '', songTheme = null } = {}) {
  if (!card) return `<div class="card card-empty card-${size}" ${extra}><span>+</span></div>`;
  const m = memberById(card.member);
  const th = THEMES[card.theme] || THEMES.SPECIAL;
  const g = GRADE_INFO[card.grade];
  const bonus = songTheme && card.theme === songTheme;
  const initials = m.mono || m.name.slice(0, 2).toUpperCase();
  return `
  <div class="card card-${size} grade-${card.grade} era-${card.theme}${bonus ? ' has-bonus' : ''}" ${extra}
       style="--c1:${th.c1};--c2:${th.c2};--ink:${th.ink};--mc:${m.color};--gc:${g.color}">
    <div class="card-art">
      ${m.photo ? `<div class="card-photo" style="background-image:url('${cardPhoto(card)}'),url('${m.photo}')"></div><div class="card-tint"></div>` : `<div class="card-orb"></div>
      <div class="card-mono">${esc(initials)}</div>`}
    </div>
    <div class="card-grade">${card.grade}</div>
    <div class="card-lvl">Lv.${card.lvl}</div>
    ${bonus ? '<div class="card-bonus">x1.5</div>' : ''}
    <div class="card-foot">
      <div class="card-name">${esc(m.name)}</div>
      <div class="card-theme">${esc(th.short)}${th.year ? ' · ' + th.year : ''}</div>
    </div>
    ${card.grade === 'R' || card.grade === 'S' ? '<div class="card-holo"></div>' : ''}
  </div>`;
}
