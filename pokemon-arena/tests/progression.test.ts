import { describe, expect, it } from 'vitest';
import { RANKS, TROPHIES_LOSS, TROPHIES_WIN, applyResult, rankOf, trophyDelta } from '../src/persistence/progression';

describe('progresión', () => {
  it('las victorias suman según la dificultad y las derrotas restan sin bajar de 0', () => {
    expect(trophyDelta(0, 0, 'facil')).toBe(TROPHIES_WIN.facil);
    expect(trophyDelta(0, 0, 'dificil')).toBe(TROPHIES_WIN.dificil);
    expect(trophyDelta(100, 1, 'normal')).toBe(-TROPHIES_LOSS);
    expect(trophyDelta(5, 1, 'normal')).toBe(-5);
    expect(trophyDelta(0, 1, 'normal')).toBe(0);
    expect(trophyDelta(50, null, 'normal')).toBe(0);
  });

  it('informa del ascenso de rango al cruzar umbrales', () => {
    expect(applyResult(10, 0, 'normal')).toMatchObject({ before: 10, after: 40, delta: 30, rankUp: null });
    expect(applyResult(90, 0, 'normal').rankUp).toBe('Entrenador');
    expect(applyResult(110, 1, 'normal')).toMatchObject({ after: 95, rankUp: null });
  });

  it('rangos', () => {
    expect(rankOf(0).name).toBe(RANKS[0].name);
    expect(rankOf(0).next?.min).toBe(RANKS[1].min);
    expect(rankOf(10_000).next).toBeNull();
  });
});
