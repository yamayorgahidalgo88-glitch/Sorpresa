import type { Difficulty } from '../sim/ai/opponent';
import type { Team } from '../sim/core/state';

/**
 * Progresión: trofeos y rangos. Las cartas nuevas ya no se desbloquean por trofeos: salen
 * de las Pokéballs (persistence/economy.ts), y los trofeos dan recompensas en su camino.
 * Las cartas sí mejoran: evolucionan con copias y monedas.
 */

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
  rankUp: string | null;
}

export function applyResult(current: number, winner: Team | null, difficulty: Difficulty): ProgressUpdate {
  const delta = trophyDelta(current, winner, difficulty);
  const after = current + delta;
  const rankBefore = rankOf(current).name;
  const rankAfter = rankOf(after).name;
  return { before: current, after, delta, rankUp: rankAfter !== rankBefore && delta > 0 ? rankAfter : null };
}

export function rankOf(trophies: number): { name: string; min: number; next: { name: string; min: number } | null } {
  let i = 0;
  while (i + 1 < RANKS.length && trophies >= RANKS[i + 1].min) i++;
  return { ...RANKS[i], next: RANKS[i + 1] ?? null };
}
