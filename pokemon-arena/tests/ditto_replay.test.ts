import { describe, expect, it } from 'vitest';
import { Battle } from '../src/sim/battle';
import { DIFFICULTIES, OpponentAI } from '../src/sim/ai/opponent';
import { observe } from '../src/sim/ai/observation';
import { getCard } from '../src/sim/data/cards';
import { forceInHand, newBattle, setEnergy } from './helpers';

const DECK = ['ditto', 'pikachu', 'charmander', 'squirtle', 'bulbasaur', 'machop', 'pidgey', 'rayo'];
const RIVAL = ['snorlax', 'charmander', 'geodude', 'jigglypuff', 'squirtle', 'pikachu', 'machop', 'ventisca'];

describe('Ditto (transformación)', () => {
  it('sin carta previa no se puede jugar', () => {
    const b = newBattle(5, undefined, [DECK, RIVAL]);
    forceInHand(b, 0, 'ditto');
    setEnergy(b, 0, 10);
    expect(b.deploy(0, 'ditto', { x: 9, y: 21 })).toEqual({ ok: false, reason: 'nada_que_copiar' });
    expect(b.energy(0)).toBe(10);
  });

  it('copia la última carta jugada (Pokémon) y cuesta 1 más', () => {
    const b = newBattle(5, undefined, [DECK, RIVAL]);
    forceInHand(b, 0, 'pikachu');
    setEnergy(b, 0, 10);
    expect(b.deploy(0, 'pikachu', { x: 4, y: 21 }).ok).toBe(true);
    forceInHand(b, 0, 'ditto');
    setEnergy(b, 0, 10);
    expect(b.effectiveCard(0, 'ditto')).toEqual({ card: getCard('pikachu'), cost: getCard('pikachu').cost + 1 });
    const r = b.deploy(0, 'ditto', { x: 14, y: 21 });
    expect(r.ok).toBe(true);
    expect(b.energy(0)).toBe(10 - (getCard('pikachu').cost + 1));
    const ev = b.step().find((e) => e.type === 'despliegue');
    const units = b.world.units.filter((u) => u.team === 0);
    expect(units.every((u) => u.cardId === 'pikachu')).toBe(true);
    expect(units).toHaveLength(2);
    void ev;
  });

  it('también copia hechizos (y respeta su zona: en cualquier parte)', () => {
    const b = newBattle(5, undefined, [DECK, RIVAL]);
    forceInHand(b, 0, 'rayo');
    setEnergy(b, 0, 10);
    expect(b.deploy(0, 'rayo', { x: 9, y: 5 }).ok).toBe(true);
    forceInHand(b, 0, 'ditto');
    setEnergy(b, 0, 10);
    expect(b.canDeploy(0, 'ditto', { x: 9, y: 5 }).ok).toBe(true);
    b.deploy(0, 'ditto', { x: 9, y: 5 });
    expect(b.world.spells.filter((s) => s.cardId === 'rayo')).toHaveLength(2);
  });

  it('la IA no juega a Ditto', () => {
    const b = new Battle({ seed: 3, decks: [RIVAL, DECK] });
    const ai = new OpponentAI(1, DIFFICULTIES.dificil, 9);
    for (let i = 0; i < 2000 && !b.isOver; i++) {
      const a = ai.decide(observe(b, 1));
      if (a) expect(a.cardId).not.toBe('ditto');
      if (a) b.deploy(1, a.cardId, a.pos);
      b.step();
    }
  });
});

describe('repeticiones', () => {
  it('una partida con Ditto se reproduce exacta con la semilla, los mazos y las órdenes', () => {
    const opts = { seed: 77, decks: [DECK, RIVAL] as [string[], string[]] };
    const b = new Battle(opts);
    const ai0 = new OpponentAI(0, DIFFICULTIES.normal, 1);
    const ai1 = new OpponentAI(1, DIFFICULTIES.normal, 2);
    let dittoPlayed = false;
    while (!b.isOver) {
      // El jugador 0 usa a Ditto en cuanto puede copiar algo; si no, juega la IA
      if (b.hand(0).includes('ditto') && b.canDeploy(0, 'ditto', { x: 9, y: 22 }).ok) {
        b.deploy(0, 'ditto', { x: 9, y: 22 });
        dittoPlayed = true;
      } else {
        const a0 = ai0.decide(observe(b, 0));
        if (a0) b.deploy(0, a0.cardId, a0.pos);
      }
      const a1 = ai1.decide(observe(b, 1));
      if (a1) b.deploy(1, a1.cardId, a1.pos);
      b.step();
    }
    expect(dittoPlayed).toBe(true);
    const again = Battle.replay(opts, b.commandLog);
    expect(again.stateHash()).toBe(b.stateHash());
    expect(again.result).toEqual(b.result);
  });
});
