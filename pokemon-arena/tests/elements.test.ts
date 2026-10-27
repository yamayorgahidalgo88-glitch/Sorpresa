import { describe, expect, it } from 'vitest';
import {
  EFFECTIVENESS,
  ELEMENTS,
  MULTIPLIER_MAX,
  MULTIPLIER_MIN,
  TYPE_CHART,
  effectivenessLabel,
  singleMultiplier,
  typeMultiplier,
} from '../src/sim/data/elements';
import { newBattle, steps, disarmTowers } from './helpers';

describe('sistema elemental', () => {
  it('define explícitamente los multiplicadores de diseño', () => {
    expect(EFFECTIVENESS).toEqual({ eficaz: 1.5, neutro: 1, poco_eficaz: 0.7, casi_inmune: 0.4 });
  });

  it.each([
    ['agua', 'fuego', 1.5],
    ['fuego', 'planta', 1.5],
    ['planta', 'agua', 1.5],
    ['electrico', 'agua', 1.5],
    ['electrico', 'volador', 1.5],
    ['hielo', 'dragon', 1.5],
    ['roca', 'volador', 1.5],
    ['lucha', 'normal', 1.5],
    ['fuego', 'agua', 0.7],
    ['agua', 'planta', 0.7],
    ['planta', 'fuego', 0.7],
    ['electrico', 'planta', 0.7],
    ['electrico', 'tierra', 0.4],
    ['tierra', 'volador', 0.4],
    ['normal', 'fantasma', 0.4],
    ['dragon', 'hada', 0.4],
    ['normal', 'normal', 1],
    ['fuego', 'electrico', 1],
  ] as const)('%s contra %s = x%s', (atk, def, expected) => {
    expect(singleMultiplier(atk, def)).toBe(expected);
    expect(typeMultiplier(atk, [def])).toBe(expected);
  });

  it('multiplica contra dobles tipos y acota el resultado', () => {
    // Onix (roca/tierra) recibe agua x1.5 * x1.5
    expect(typeMultiplier('agua', ['roca', 'tierra'])).toBe(2.25);
    // Eléctrico contra Onix: neutro (roca) * casi inmune (tierra)
    expect(typeMultiplier('electrico', ['roca', 'tierra'])).toBe(0.4);
    // Fuego contra Charizard (fuego/volador): x0.7 * x1
    expect(typeMultiplier('fuego', ['fuego', 'volador'])).toBe(0.7);
    // Roca contra Charizard: x1.5 * x1.5 = 2.25 (máximo)
    expect(typeMultiplier('roca', ['fuego', 'volador'])).toBe(MULTIPLIER_MAX);
    for (const a of ELEMENTS) {
      for (const d1 of ELEMENTS) {
        for (const d2 of ELEMENTS) {
          const m = typeMultiplier(a, [d1, d2]);
          expect(m).toBeGreaterThanOrEqual(MULTIPLIER_MIN);
          expect(m).toBeLessThanOrEqual(MULTIPLIER_MAX);
        }
      }
    }
  });

  it('las torres no tienen tipo: siempre x1', () => {
    for (const a of ELEMENTS) expect(typeMultiplier(a, [])).toBe(1);
    expect(typeMultiplier(null, ['agua'])).toBe(1);
  });

  it('la tabla no contradice ninguna relación ni usa tipos inexistentes', () => {
    for (const a of ELEMENTS) {
      const rel = TYPE_CHART[a];
      const all = [...(rel.eficaz ?? []), ...(rel.poco_eficaz ?? []), ...(rel.casi_inmune ?? [])];
      expect(new Set(all).size).toBe(all.length);
      for (const d of all) expect(ELEMENTS).toContain(d);
    }
  });

  it('etiqueta la eficacia', () => {
    expect(effectivenessLabel(1.5)).toBe('eficaz');
    expect(effectivenessLabel(1)).toBe('neutro');
    expect(effectivenessLabel(0.4)).toBe('poco_eficaz');
  });

  it('la simulación aplica la ventaja elemental al daño real', () => {
    // Squirtle (agua, 95 de daño) contra Onix (roca/tierra): 95 * 2.25 = 214 (redondeado)
    const b = newBattle();
    disarmTowers(b);
    const [sq] = b.spawnUnchecked(0, 'squirtle', { x: 9, y: 20 }, { ready: true });
    const [ox] = b.spawnUnchecked(1, 'onix', { x: 9, y: 23 }, { ready: true });
    const events = steps(b, 60);
    const hits = events.filter((e) => e.type === 'dano' && e.targetId === ox);
    expect(hits.length).toBeGreaterThan(0);
    for (const h of hits) {
      if (h.type !== 'dano') continue;
      expect(h.amount).toBe(Math.round(95 * 2.25));
      expect(h.effectiveness).toBe('eficaz');
    }
    expect(sq).toBeGreaterThan(0);
  });
});
