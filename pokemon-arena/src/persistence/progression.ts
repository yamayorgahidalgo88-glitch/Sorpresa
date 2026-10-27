import type { Difficulty } from '../sim/ai/opponent';
import type { Team } from '../sim/core/state';
import { CARD_IDS, DEFAULT_PLAYER_DECK } from '../sim/data/cards';

/**
 * Progresión: trofeos, rangos y desbloqueo de cartas.
 *
 * Decisión de diseño: NO hay niveles de carta ni mejoras de estadísticas. La progresión
 * amplía las opciones (más Pokémon para el mazo), pero no hace más fuertes las cartas:
 * la partida la decide la estrategia, y el balance medido sigue siendo válido.
 */

/** Cartas disponibles desde el principio (el mazo inicial). */
export const STARTER_CARDS: readonly string[] = DEFAULT_PLAYER_DECK;

/** Trofeos necesarios para desbloquear el resto de cartas. */
export const UNLOCKS: readonly { cardId: string; trophies: number }[] = [
  { cardId: 'geodude', trophies: 30 },
  { cardId: 'jigglypuff', trophies: 80 },
  { cardId: 'snorlax', trophies: 150 },
  { cardId: 'ventisca', trophies: 220 },
  { cardId: 'charizard', trophies: 300 },
];

export const RANKS: readonly { name: string; min: number }[] = [
  { name: 'Novato', min: 0 },
  { name: 'Entrenador', min: 100 },
  { name: 'Líder de Gimnasio', min: 250 },
  { name: 'Alto Mando', min: 400 },
  { name: 'Campeón', min: 600 },
];

/** Trofeos por victoria según dificultad; las derrotas restan siempre lo mismo. */
export const TROPHIES_WIN: Record<Difficulty, number> = { facil: 20, normal: 30, dificil: 40 };
export const TROPHIES_LOSS = 15;

export function unlockRequirement(cardId: string): number {
  if (STARTER_CARDS.includes(cardId)) return 0;
  const u = UNLOCKS.find((x) => x.cardId === cardId);
  // Cualquier carta nueva sin entrada en UNLOCKS queda disponible (no bloquea contenido por olvido).
  return u ? u.trophies : 0;
}

export function isUnlocked(cardId: string, trophies: number): boolean {
  return trophies >= unlockRequirement(cardId);
}

export function unlockedCards(trophies: number): string[] {
  return CARD_IDS.filter((id) => isUnlocked(id, trophies));
}

/** Variación de trofeos para el equipo 0 (jugador). Nunca deja el total por debajo de 0. */
export function trophyDelta(current: number, winner: Team | null, difficulty: Difficulty): number {
  if (winner === 0) return TROPHIES_WIN[difficulty];
  if (winner === 1) return 0 - Math.min(current, TROPHIES_LOSS); // 0 - x evita devolver -0
  return 0;
}

export interface ProgressUpdate {
  before: number;
  after: number;
  delta: number;
  newlyUnlocked: string[];
  rankUp: string | null;
}

export function applyResult(current: number, winner: Team | null, difficulty: Difficulty): ProgressUpdate {
  const delta = trophyDelta(current, winner, difficulty);
  const after = current + delta;
  const newlyUnlocked = CARD_IDS.filter((id) => !isUnlocked(id, current) && isUnlocked(id, after));
  const rankBefore = rankOf(current).name;
  const rankAfter = rankOf(after).name;
  return { before: current, after, delta, newlyUnlocked, rankUp: rankAfter !== rankBefore && delta > 0 ? rankAfter : null };
}

export function rankOf(trophies: number): { name: string; min: number; next: { name: string; min: number } | null } {
  let i = 0;
  while (i + 1 < RANKS.length && trophies >= RANKS[i + 1].min) i++;
  return { ...RANKS[i], next: RANKS[i + 1] ?? null };
}

/** Siguiente desbloqueo pendiente (para mostrar el objetivo en el menú). */
export function nextUnlock(trophies: number): { cardId: string; trophies: number } | null {
  return UNLOCKS.find((u) => u.trophies > trophies) ?? null;
}
