import type { Difficulty } from '../sim/ai/opponent';
import { CARDS, DEFAULT_PLAYER_DECK, LINES, maxStage } from '../sim/data/cards';
import type { Stage } from '../sim/data/cards';
import { validateDeck } from '../sim/systems/deck';
import type { BallKind, Profile, RoadReward } from './economy';
import { BALL_ORDER, cardIdFor, claimRoad, matchCoins, newProfile } from './economy';
import type { ProgressUpdate } from './progression';
import { applyResult } from './progression';

export interface Settings {
  difficulty: Difficulty;
  muted: boolean;
  /** Mazo como LÍNEAS (id de la primera fase); la fase real sale del perfil. */
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
const PROFILE_KEY = 'pokemon-arena:perfil';

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
  // Un mazo guardado solo vale si es válido y todas sus cartas son del jugador. Los mazos de
  // versiones anteriores (con Charmeleon, Pidgeotto…) se traducen a su línea.
  const profile = loadProfile(store);
  const lines = Array.isArray(s.deck) ? s.deck.map((id) => (typeof id === 'string' && CARDS[id] ? CARDS[id].line : '')) : [];
  const deckOk = lines.length > 0 && validateDeck(lines).ok && lines.every((l) => !!profile.owned[l]);
  const deck = deckOk ? lines : DEFAULT_SETTINGS.deck.slice();
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

/** Cartas que se juegan con un mazo de líneas: cada línea en la fase que tiene el jugador. */
export function battleDeck(deckLines: readonly string[], profile: Profile): string[] {
  return deckLines.map((l) => cardIdFor(profile, l));
}

/** Versión anterior (desbloqueo por trofeos): se conservan las cartas que ya se tenían. */
const LEGACY_UNLOCKS: Record<string, number> = { jigglypuff: 80, snorlax: 150, ventisca: 220 };

/** Carga el perfil (monedas, colección, Pokéballs); corrige valores corruptos. */
export function loadProfile(store: KeyValueStore | null = defaultStore()): Profile {
  const base = newProfile();
  const raw = read<Profile>(store, PROFILE_KEY);
  const fresh = !raw || Object.keys(raw).length === 0;
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
  const p: Profile = fresh ? base : {
    coins: n(raw.coins),
    owned: { ...base.owned },
    balls: { ...base.balls },
    claimedRoad: Array.isArray(raw.claimedRoad) ? raw.claimedRoad.filter((x) => typeof x === 'number') : [],
    challenge: raw.challenge && typeof raw.challenge === 'object' ? { wins: Math.min(12, n(raw.challenge.wins)), losses: Math.min(3, n(raw.challenge.losses)) } : null,
  };
  if (!fresh) {
    for (const k of BALL_ORDER) p.balls[k as BallKind] = n(raw.balls?.[k as BallKind]);
    for (const [line, o] of Object.entries(raw.owned ?? {})) {
      if (!LINES.includes(line) || !o) continue;
      const stage = Math.max(1, Math.min(maxStage(line), n(o.stage) || 1)) as Stage;
      p.owned[line] = { stage, copies: n(o.copies) };
    }
  } else {
    const trophies = loadStats(store).trophies;
    for (const [line, t] of Object.entries(LEGACY_UNLOCKS)) if (trophies >= t) p.owned[line] = { stage: 1, copies: 0 };
  }
  return p;
}

export function saveProfile(profile: Profile, store: KeyValueStore | null = defaultStore()): void {
  write(store, PROFILE_KEY, profile);
}

export interface MatchRewards {
  stats: Stats;
  progress: ProgressUpdate;
  coins: number;
  road: RoadReward[];
  profile: Profile;
}

/** Registra el resultado de una partida: trofeos, monedas y recompensas del camino. */
export function recordResult(
  winner: 0 | 1 | null,
  difficulty: Difficulty,
  store: KeyValueStore | null = defaultStore(),
  medals = 0,
): MatchRewards {
  const s = loadStats(store);
  if (winner === 0) s.wins++;
  else if (winner === 1) s.losses++;
  else s.draws++;
  const progress = applyResult(s.trophies, winner, difficulty);
  s.trophies = progress.after;
  write(store, STATS_KEY, s);
  const profile = loadProfile(store);
  const coins = matchCoins(winner, medals);
  profile.coins += coins;
  const road = claimRoad(profile, s.trophies);
  saveProfile(profile, store);
  return { stats: s, progress, coins, road, profile };
}
