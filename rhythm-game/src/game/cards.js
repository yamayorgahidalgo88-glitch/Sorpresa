// Colección de cartas de personajes ficticios (todos originales).
// Persistencia en localStorage (con try/catch: el juego funciona sin ella).
import { NOTE_COLORS } from './constants.js';

export const CHARACTERS = [
  { id: 'luna', name: 'LUNA', attr: 'pink', theme: 'NEON NIGHT', rarity: 3, hair: 'long', hairColor: '#e8e3ff', skin: '#ffe0cf', outfit: '#3b1d6e', accent: '#ff4fd8', acc: 'star' },
  { id: 'kai', name: 'KAI', attr: 'cyan', theme: 'NEON NIGHT', rarity: 2, hair: 'spiky', hairColor: '#1d2a5a', skin: '#f6d2b8', outfit: '#0e3b5c', accent: '#38e1ff', acc: 'earring' },
  { id: 'nova', name: 'NOVA', attr: 'yellow', theme: 'NEON NIGHT', rarity: 2, hair: 'bob', hairColor: '#ffd36b', skin: '#ffe3d1', outfit: '#5a2d12', accent: '#ffd23f', acc: 'none' },
  { id: 'rio', name: 'RIO', attr: 'pink', theme: 'SUNRISE', rarity: 1, hair: 'short', hairColor: '#c0207f', skin: '#eec1a2', outfit: '#2a1040', accent: '#ff4fd8', acc: 'headphones' },
  { id: 'sora', name: 'SORA', attr: 'cyan', theme: 'NEON NIGHT', rarity: 1, hair: 'side', hairColor: '#cfd8e6', skin: '#ffdcc8', outfit: '#16224a', accent: '#38e1ff', acc: 'none' },
  { id: 'mika', name: 'MIKA', attr: 'yellow', theme: 'SUNRISE', rarity: 1, hair: 'bun', hairColor: '#6b3b1f', skin: '#f9d4bd', outfit: '#6e1b4a', accent: '#ffd23f', acc: 'star' },
  { id: 'jae', name: 'JAE', attr: 'pink', theme: 'CRYSTAL', rarity: 2, hair: 'short', hairColor: '#141019', skin: '#f2cdb3', outfit: '#401458', accent: '#ff4fd8', acc: 'headphones' },
  { id: 'vega', name: 'VEGA', attr: 'cyan', theme: 'CRYSTAL', rarity: 3, hair: 'long', hairColor: '#7a4bd6', skin: '#ffe2d4', outfit: '#11173f', accent: '#38e1ff', acc: 'earring' },
  { id: 'aria', name: 'ARIA', attr: 'yellow', theme: 'NEON NIGHT', rarity: 3, hair: 'long', hairColor: '#ff8a3d', skin: '#ffe1cc', outfit: '#3f0f3f', accent: '#ffd23f', acc: 'star' },
  { id: 'zen', name: 'ZEN', attr: 'pink', theme: 'SUNRISE', rarity: 2, hair: 'spiky', hairColor: '#f2f2f7', skin: '#e9bf9f', outfit: '#29123d', accent: '#ff4fd8', acc: 'earring' },
];

export const CHAR_BY_ID = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));

const STORAGE_KEY = 'neonpulse.collection.v1';
const STARTER = ['luna', 'kai', 'nova', 'rio', 'sora', 'mika'];
export const MAX_LEVEL = 30;
export const XP_PER_LEVEL = 100;

function defaultCollection() {
  return {
    cards: Object.fromEntries(STARTER.map((id) => [id, { level: 1, xp: 0 }])),
    deck: ['luna', 'kai', 'nova', 'rio', 'sora'],
    best: {},
  };
}

export function loadCollection() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const c = JSON.parse(raw);
      if (c && c.cards && Array.isArray(c.deck)) {
        c.deck = c.deck.filter((id) => c.cards[id]);
        if (!c.deck.length) c.deck = Object.keys(c.cards).slice(0, 5);
        c.best ||= {};
        return c;
      }
    }
  } catch {
    /* sin almacenamiento */
  }
  return defaultCollection();
}

export function saveCollection(c) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  } catch {
    /* sin almacenamiento */
  }
}

export function deckCards(collection) {
  return collection.deck.map((id) => ({ ...CHAR_BY_ID[id], level: collection.cards[id]?.level || 1 }));
}

// THEME BONUS: cartas cuyo tema coincide con el de la canción + nivel total
export function computeThemeBonus(deck, songTheme) {
  const matching = deck.filter((c) => c.theme === songTheme).length;
  const levelSum = deck.reduce((a, c) => a + c.level, 0);
  const rarity = deck.reduce((a, c) => a + c.rarity, 0);
  const level = Math.min(10, matching + Math.floor(levelSum / 10) + Math.floor(rarity / 6));
  const percent = level * 3; // +3 % por nivel
  return { level, percent, multiplier: 1 + percent / 100, matching };
}

// Recompensas al final de la partida. Devuelve la colección nueva y un resumen.
export function applyRewards(collection, result, songId) {
  const c = JSON.parse(JSON.stringify(collection));
  const xp = Math.max(5, Math.floor(result.score / 12000));
  const levelUps = [];
  for (const id of c.deck) {
    const card = c.cards[id];
    if (!card) continue;
    if (card.level >= MAX_LEVEL) continue;
    card.xp += xp;
    while (card.xp >= XP_PER_LEVEL && card.level < MAX_LEVEL) {
      card.xp -= XP_PER_LEVEL;
      card.level++;
      levelUps.push({ id, level: card.level });
    }
  }
  let unlocked = null;
  if (result.cleared && (result.rank === 'S' || result.rank === 'A' || result.rank === 'B')) {
    const locked = CHARACTERS.find((ch) => !c.cards[ch.id]);
    if (locked) {
      c.cards[locked.id] = { level: 1, xp: 0 };
      unlocked = locked.id;
    }
  }
  const key = `${songId}:${result.difficulty}`;
  const isBest = !c.best[key] || result.score > c.best[key];
  if (isBest) c.best[key] = result.score;
  return { collection: c, xp, levelUps, unlocked, isBest };
}

export function attrColor(attr) {
  return NOTE_COLORS[attr]?.main || '#fff';
}
