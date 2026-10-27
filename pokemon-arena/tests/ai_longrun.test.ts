import { describe, expect, it } from 'vitest';
import { DIFFICULTIES, OpponentAI } from '../src/sim/ai/opponent';
import { observe } from '../src/sim/ai/observation';
import { CARDS, DEFAULT_PLAYER_DECK, DEFAULT_RIVAL_DECK, getCard } from '../src/sim/data/cards';
import { runAiMatch } from '../src/sim/match';
import { isDeployAllowed } from '../src/sim/systems/deployment';
import type { SimEvent } from '../src/sim/core/state';
import { newBattle, setEnergy, steps } from './helpers';

describe('IA del oponente', () => {
  it('la observación no expone la mano, la cola ni la energía del rival', () => {
    const b = newBattle();
    const obs = observe(b, 1);
    const json = JSON.stringify(obs);
    expect(obs.hand).toEqual(b.hand(1));
    expect(Object.keys(obs).sort()).toEqual(
      ['energy', 'hand', 'maxEnergy', 'next', 'phase', 'secondsLeft', 'team', 'tick', 'tickRate', 'towers', 'units'].sort(),
    );
    // La cola del jugador (cartas que verá después) no aparece en ningún sitio.
    for (const c of b.player(0).deck.queue) {
      if (!b.hand(1).includes(c) && b.nextCard(1) !== c) expect(json).not.toContain(`"${c}"`);
    }
  });

  it('solo propone cartas de su mano, que puede pagar y en zonas legales', () => {
    for (let seed = 1; seed <= 5; seed++) {
      const b = newBattle(seed);
      const ai = new OpponentAI(1, DIFFICULTIES.dificil, seed);
      for (let i = 0; i < 20 * 120 && !b.isOver; i++) {
        const obs = observe(b, 1);
        const a = ai.decide(obs);
        if (a) {
          expect(obs.hand).toContain(a.cardId);
          expect(getCard(a.cardId).cost).toBeLessThanOrEqual(obs.energy);
          expect(isDeployAllowed(1, getCard(a.cardId), a.pos, b.world.towers)).toBe(true);
          expect(b.deploy(1, a.cardId, a.pos).ok).toBe(true);
        }
        // El jugador lanza tropas de vez en cuando para provocar defensas.
        if (i % 100 === 50) {
          const card = b.hand(0).find((c) => getCard(c).kind === 'pokemon');
          if (card) b.deploy(0, card, { x: i % 200 === 50 ? 3.5 : 14.5, y: 18.5 });
        }
        b.step();
      }
    }
  });

  it('defiende cuando una amenaza entra en su campo', () => {
    const b = newBattle(3);
    const ai = new OpponentAI(1, { ...DIFFICULTIES.normal, hesitation: 0 }, 3);
    setEnergy(b, 1, 6); // por debajo del umbral de ataque
    b.spawnUnchecked(0, 'machop', { x: 3.5, y: 12 }, { ready: true });
    let action = null;
    for (let i = 0; i < 60 && !action; i++) {
      action = ai.decide(observe(b, 1));
      b.step();
    }
    expect(action?.intent).toBe('defensa');
    expect(action!.pos.y).toBeLessThan(16);
  });

  it('no despliega sin motivo con poca energía (no juega al azar)', () => {
    const b = newBattle(4);
    const ai = new OpponentAI(1, { ...DIFFICULTIES.normal, hesitation: 0 }, 4);
    setEnergy(b, 1, 5);
    let action = null;
    for (let i = 0; i < 30; i++) {
      action = action ?? ai.decide(observe(b, 1));
      b.step();
    }
    expect(action).toBeNull();
  });

  it('remata una torre con un hechizo cuando puede', () => {
    const b = newBattle(5, undefined, [DEFAULT_PLAYER_DECK, DEFAULT_RIVAL_DECK]);
    const ai = new OpponentAI(1, { ...DIFFICULTIES.dificil }, 5);
    const deck = b.player(1).deck;
    if (!deck.hand.includes('ventisca')) {
      const qi = deck.queue.indexOf('ventisca');
      [deck.hand[0], deck.queue[qi]] = ['ventisca', deck.hand[0]];
    }
    setEnergy(b, 1, 10);
    const t = b.world.towers.find((x) => x.team === 0 && x.role === 'guardia_izq')!;
    t.hp = 50;
    const a = ai.decide(observe(b, 1));
    expect(a).toMatchObject({ cardId: 'ventisca', intent: 'remate' });
  });

  it('la dificultad se ajusta por parámetros', () => {
    expect(DIFFICULTIES.facil.reactionDelay).toBeGreaterThan(DIFFICULTIES.dificil.reactionDelay);
    expect(DIFFICULTIES.facil.decisionInterval).toBeGreaterThan(DIFFICULTIES.dificil.decisionInterval);
    expect(DIFFICULTIES.facil.hesitation).toBeGreaterThan(DIFFICULTIES.dificil.hesitation);
  });
});

describe('partidas automatizadas prolongadas', () => {
  it('30 partidas IA contra IA terminan sin errores ni estados imposibles', () => {
    const diffs = ['facil', 'normal', 'dificil'] as const;
    for (let seed = 1; seed <= 30; seed++) {
      const d0 = DIFFICULTIES[diffs[seed % 3]];
      const d1 = DIFFICULTIES[diffs[(seed + 1) % 3]];
      const deaths = new Set<number>();
      const destroyed = new Set<number>();
      const problems: string[] = [];
      const report = runAiMatch({ seed, decks: [DEFAULT_PLAYER_DECK, DEFAULT_RIVAL_DECK] }, [d0, d1], (events: SimEvent[], b) => {
        for (const e of events) {
          if (e.type === 'muerte') {
            if (deaths.has(e.unitId)) problems.push(`muerte duplicada ${e.unitId}`);
            deaths.add(e.unitId);
          }
          if (e.type === 'torre_destruida') {
            if (destroyed.has(e.towerId)) problems.push(`torre destruida dos veces ${e.towerId}`);
            destroyed.add(e.towerId);
          }
        }
        for (const team of [0, 1] as const) {
          const en = b.energy(team);
          if (en < 0 || en > 10) problems.push(`energía fuera de rango ${en}`);
        }
        for (const u of b.world.units) {
          if (!Number.isFinite(u.pos.x) || !Number.isFinite(u.pos.y)) problems.push(`posición no finita ${u.id}`);
          if (u.hp <= 0 || u.hp > u.maxHp) problems.push(`salud imposible ${u.id}: ${u.hp}`);
        }
      });
      expect(problems, `semilla ${seed}`).toEqual([]);
      expect(report.result, `semilla ${seed}`).not.toBeNull();
      expect(report.result!.tick).toBeLessThanOrEqual(20 * 240);
      expect(report.rejectedActions).toBe(0);
      expect(report.battle.player(0).cardsPlayed).toBeGreaterThan(5);
      expect(report.battle.player(1).cardsPlayed).toBeGreaterThan(5);
    }
  }, 120_000);

  it('una batalla saturada (muchas tropas) sigue siendo estable', () => {
    const b = newBattle(77);
    const ids = Object.keys(CARDS).filter((c) => getCard(c).kind === 'pokemon');
    for (let i = 0; i < 40; i++) {
      b.spawnUnchecked(0, ids[i % ids.length], { x: 1 + (i % 16), y: 18 + (i % 5) }, { ready: true });
      b.spawnUnchecked(1, ids[(i + 3) % ids.length], { x: 1 + (i % 16), y: 14 - (i % 5) }, { ready: true });
    }
    steps(b, 20 * 60);
    for (const u of b.world.units) expect(Number.isFinite(u.pos.x)).toBe(true);
  });
});
