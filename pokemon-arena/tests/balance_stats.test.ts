import { describe, expect, it } from 'vitest';
import { DIFFICULTIES } from '../src/sim/ai/opponent';
import { CARDS, DEFAULT_PLAYER_DECK, DEFAULT_RIVAL_DECK, STAGE_MULTIPLIER } from '../src/sim/data/cards';
import { runAiMatch } from '../src/sim/match';
import { disarmTowers, newBattle, steps, tower, unit } from './helpers';

describe('estadísticas de batalla', () => {
  it('el daño a torres se atribuye a la carta y al equipo que lo causa', () => {
    const b = newBattle();
    const t = tower(b, 1, 'guardia_izq');
    const [gd] = b.spawnUnchecked(0, 'geodude', { x: t.pos.x, y: t.pos.y + 2.2 }, { ready: true });
    unit(b, gd)!.hp = 0;
    const evs = b.step();
    const hit = evs.find((e) => e.type === 'dano' && e.targetId === t.id);
    expect(hit).toMatchObject({ sourceTeam: 0, sourceCardId: 'geodude' });
    // La explosión hace el 60 % de su daño a las torres.
    expect(t.hp).toBe(1600 - Math.round(260 * 0.6));
    expect(b.player(0).towerDamage).toBe(Math.round(260 * 0.6));
    expect(b.player(1).towerDamage).toBe(0);
  });

  it('los disparos de torre se marcan sin carta de origen', () => {
    const b = newBattle();
    const [en] = b.spawnUnchecked(1, 'snorlax', { x: 3.5, y: 19.5 }, { ready: true });
    unit(b, en)!.status.stunUntil = 10 ** 9;
    const evs = steps(b, 40);
    const shot = evs.find((e) => e.type === 'dano' && e.targetId === en);
    expect(shot).toMatchObject({ sourceTeam: 0, sourceCardId: null });
  });

  it('cuenta los Pokémon rivales derrotados', () => {
    const b = newBattle();
    disarmTowers(b);
    const ids = b.spawnUnchecked(1, 'machop', { x: 9, y: 20 }, { ready: true });
    for (const id of ids) unit(b, id)!.hp = 0;
    b.step();
    expect(b.player(0).defeated).toBe(3);
    expect(b.player(1).defeated).toBe(0);
  });
});

describe('regresión de balance (IA contra IA)', () => {
  it('ninguna carta está fuera de rango y los mazos por defecto no están descompensados', () => {
    // Guardas de cordura (detectan erratas como un daño de 1500), no afinan el balance.
    // Machop es el máximo actual (75 de daño/s por energía) por diseño: trío frágil.
    for (const c of Object.values(CARDS)) {
      if (c.kind !== 'pokemon') continue;
      // Las evoluciones mejoran a propósito: el límite se escala con su multiplicador de fase.
      const k = STAGE_MULTIPLIER[c.stage];
      const dps = (c.damage * c.count) / c.hitSpeed;
      expect(dps / c.cost, `${c.id}: daño por segundo y energía`).toBeLessThan(90 * k);
      expect((c.hp * c.count) / c.cost, `${c.id}: salud por energía`).toBeLessThan(700 * k);
    }
    let pts = 0;
    const n = 12;
    for (let s = 1; s <= n; s++) {
      for (const swap of [false, true]) {
        const decks: [string[], string[]] = swap ? [DEFAULT_RIVAL_DECK, DEFAULT_PLAYER_DECK] : [DEFAULT_PLAYER_DECK, DEFAULT_RIVAL_DECK];
        const w = runAiMatch({ seed: 9100 + s, decks }, [DIFFICULTIES.normal, DIFFICULTIES.normal]).result!.winner;
        const me = swap ? 1 : 0;
        pts += w === null ? 0.5 : w === me ? 1 : 0;
      }
    }
    const rate = pts / (2 * n);
    expect(rate).toBeGreaterThanOrEqual(0.2);
    expect(rate).toBeLessThanOrEqual(0.8);
  }, 60_000);
});
