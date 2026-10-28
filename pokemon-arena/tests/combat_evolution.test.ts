import { describe, expect, it } from 'vitest';
import type { Battle } from '../src/sim/battle';
import { forceInHand, newBattle, setEnergy } from './helpers';

const DECK = ['charmander', 'pikachu', 'squirtle', 'bulbasaur', 'machop', 'pidgey', 'snorlax', 'rayo'];
const RIVAL = ['snorlax', 'charmander', 'geodude', 'jigglypuff', 'squirtle', 'pikachu', 'machop', 'ventisca'];

function play(b: Battle, id: string): string {
  forceInHand(b, 0, id);
  setEnergy(b, 0, 10);
  const r = b.deploy(0, id, { x: 9, y: 22 });
  expect(r.ok).toBe(true);
  const ev = b.step().find((e) => e.type === 'despliegue' || e.type === 'hechizo_lanzado');
  return (ev as { cardId: string }).cardId;
}

describe('evolución en combate', () => {
  it('la tercera vez que juegas una línea sale una fase por encima y la cuenta se reinicia', () => {
    const b = newBattle(4, undefined, [DECK, RIVAL]);
    expect(play(b, 'charmander')).toBe('charmander');
    expect(play(b, 'charmander')).toBe('charmander');
    expect(b.effectiveCard(0, 'charmander')).toMatchObject({ evolved: true, cost: 4 });
    expect(play(b, 'charmander')).toBe('charmeleon');
    expect(play(b, 'charmander')).toBe('charmander');
  });

  it('una carta ya en fase máxima (o que no evoluciona) y los hechizos no cambian', () => {
    const b = newBattle(4, undefined, [['charizard', 'pikachu', 'squirtle', 'bulbasaur', 'machop', 'pidgey', 'snorlax', 'rayo'], RIVAL]);
    for (let i = 0; i < 3; i++) expect(play(b, 'charizard')).toBe('charizard');
    for (let i = 0; i < 3; i++) expect(play(b, 'snorlax')).toBe('snorlax');
    for (let i = 0; i < 3; i++) expect(play(b, 'rayo')).toBe('rayo');
  });

  it('el rival también evoluciona en combate y se puede desactivar con las reglas', () => {
    const off = newBattle(4, { evolveAfterPlays: 0 }, [DECK, RIVAL]);
    for (let i = 0; i < 3; i++) expect(play(off, 'pikachu')).toBe('pikachu');
    const b = newBattle(4, undefined, [DECK, RIVAL]);
    for (let i = 0; i < 2; i++) {
      forceInHand(b, 1, 'pikachu');
      setEnergy(b, 1, 10);
      b.deploy(1, 'pikachu', { x: 9, y: 9 });
    }
    expect(b.effectiveCard(1, 'pikachu')?.card.id).toBe('raichu');
  });
});
