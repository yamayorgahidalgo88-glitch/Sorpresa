import type { Difficulty } from '../sim/ai/opponent';
import { DEFAULT_PLAYER_DECK } from '../sim/data/cards';
import { validateDeck } from '../sim/systems/deck';
import type { ProgressUpdate } from './progression';
import { applyResult, isUnlocked } from './progression';

export interface Settings {
  difficulty: Difficulty;
  muted: boolean;
  deck: string[];
}

export interface Stats {
  wins: number;
  losses: number;
  draws: number;
  trophies: number;
}

const SETTINGS_KEY = 'pokemon-arena:ajustes';
const STATS_KEY = 'pokemon-arena:estadisticas';

export const DEFAULT_SETTINGS: Settings = { difficulty: 'normal', muted: false, deck: DEFAULT_PLAYER_DECK.slice() };

/** Almacenamiento mínimo (inyectable en pruebas). */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function defaultStore(): KeyValueStore | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function read<T>(store: KeyValueStore | null, key: string): Partial<T> {
  if (!store) return {};
  try {
    const raw = store.getItem(key);
    return raw ? (JSON.parse(raw) as Partial<T>) : {};
  } catch {
    return {};
  }
}

function write(store: KeyValueStore | null, key: string, value: unknown): void {
  if (!store) return;
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    /* almacenamiento lleno o bloqueado: el juego sigue funcionando sin guardar */
  }
}

/** Carga los ajustes; cualquier valor corrupto vuelve al valor por defecto. */
export function loadSettings(store: KeyValueStore | null = defaultStore()): Settings {
  const s = read<Settings>(store, SETTINGS_KEY);
  const difficulty = s.difficulty === 'facil' || s.difficulty === 'normal' || s.difficulty === 'dificil' ? s.difficulty : DEFAULT_SETTINGS.difficulty;
  // Un mazo guardado solo vale si es válido y todas sus cartas están desbloqueadas.
  const trophies = loadStats(store).trophies;
  const deckOk = Array.isArray(s.deck) && validateDeck(s.deck).ok && s.deck.every((id) => isUnlocked(id, trophies));
  const deck = deckOk ? s.deck!.slice() : DEFAULT_SETTINGS.deck.slice();
  return { difficulty, muted: s.muted === true, deck };
}

export function saveSettings(settings: Settings, store: KeyValueStore | null = defaultStore()): void {
  write(store, SETTINGS_KEY, settings);
}

export function loadStats(store: KeyValueStore | null = defaultStore()): Stats {
  const s = read<Stats>(store, STATS_KEY);
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
  return { wins: n(s.wins), losses: n(s.losses), draws: n(s.draws), trophies: n(s.trophies) };
}

/** Registra el resultado de una partida y aplica la variación de trofeos. */
export function recordResult(
  winner: 0 | 1 | null,
  difficulty: Difficulty,
  store: KeyValueStore | null = defaultStore(),
): { stats: Stats; progress: ProgressUpdate } {
  const s = loadStats(store);
  if (winner === 0) s.wins++;
  else if (winner === 1) s.losses++;
  else s.draws++;
  const progress = applyResult(s.trophies, winner, difficulty);
  s.trophies = progress.after;
  write(store, STATS_KEY, s);
  return { stats: s, progress };
}
