import { describe, expect, it } from 'vitest';
import { CARD_IDS, DEFAULT_PLAYER_DECK } from '../src/sim/data/cards';
import {
  RANKS,
  STARTER_CARDS,
  TROPHIES_LOSS,
  TROPHIES_WIN,
  UNLOCKS,
  applyResult,
  isUnlocked,
  nextUnlock,
  rankOf,
  trophyDelta,
  unlockedCards,
} from '../src/persistence/progression';

describe('progresión', () => {
  it('el mazo inicial está siempre desbloqueado y es jugable', () => {
    expect(unlockedCards(0).sort()).toEqual([...STARTER_CARDS].sort());
    expect(DEFAULT_PLAYER_DECK.every((id) => isUnlocked(id, 0))).toBe(true);
  });

  it('con trofeos suficientes se desbloquea todo el catálogo', () => {
    const max = Math.max(...UNLOCKS.map((u) => u.trophies));
    expect(unlockedCards(max).sort()).toEqual([...CARD_IDS].sort());
    for (const u of UNLOCKS) expect(CARD_IDS).toContain(u.cardId);
  });

  it('las victorias suman según la dificultad y las derrotas restan sin bajar de 0', () => {
    expect(trophyDelta(0, 0, 'facil')).toBe(TROPHIES_WIN.facil);
    expect(trophyDelta(0, 0, 'dificil')).toBe(TROPHIES_WIN.dificil);
    expect(trophyDelta(100, 1, 'normal')).toBe(-TROPHIES_LOSS);
    expect(trophyDelta(5, 1, 'normal')).toBe(-5);
    expect(trophyDelta(0, 1, 'normal')).toBe(0);
    expect(trophyDelta(50, null, 'normal')).toBe(0);
  });

  it('informa de los desbloqueos y del ascenso de rango al cruzar umbrales', () => {
    const u = applyResult(10, 0, 'normal');
    expect(u).toMatchObject({ before: 10, after: 40, delta: 30, newlyUnlocked: ['geodude'], rankUp: null });
    const r = applyResult(90, 0, 'normal');
    expect(r.rankUp).toBe('Entrenador');
    expect(applyResult(110, 1, 'normal')).toMatchObject({ after: 95, newlyUnlocked: [], rankUp: null });
  });

  it('rangos y siguiente desbloqueo', () => {
    expect(rankOf(0).name).toBe(RANKS[0].name);
    expect(rankOf(0).next?.min).toBe(RANKS[1].min);
    expect(rankOf(10_000).next).toBeNull();
    expect(nextUnlock(0)).toEqual(UNLOCKS[0]);
    expect(nextUnlock(10_000)).toBeNull();
  });
});
