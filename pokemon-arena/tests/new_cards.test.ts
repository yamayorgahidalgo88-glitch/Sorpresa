import { describe, expect, it } from 'vitest';
import { getCard } from '../src/sim/data/cards';
import type { SpellCard } from '../src/sim/data/cards';
import { disarmTowers, forceInHand, newBattle, setEnergy, steps, unit } from './helpers';

const DECK = ['magnemite', 'voltorb', 'chansey', 'rattata', 'zubat', 'pocion', 'toxico', 'pikachu'];
const RIVAL = ['snorlax', 'charmander', 'geodude', 'jigglypuff', 'squirtle', 'pikachu', 'machop', 'ventisca'];

describe('edificios', () => {
  it('no se mueven y pierden toda su salud en su tiempo de vida', () => {
    const b = newBattle(1, undefined, [DECK, RIVAL]);
    disarmTowers(b);
    const [id] = b.spawnUnchecked(0, 'magnemite', { x: 9, y: 22 }, { ready: true });
    const u = unit(b, id)!;
    const life = getCard('magnemite').kind === 'pokemon' ? (getCard('magnemite') as { building: { lifetime: number } }).building.lifetime : 0;
    steps(b, (life / 2) * 20);
    expect(u.pos).toEqual({ x: 9, y: 22 });
    expect(u.hp).toBeGreaterThan(u.maxHp * 0.45);
    expect(u.hp).toBeLessThan(u.maxHp * 0.55);
    steps(b, (life / 2) * 20 + 2);
    expect(unit(b, id)).toBeUndefined();
  });

  it('los Pokémon que solo atacan edificios van a por ellos antes que a las torres', () => {
    const b = newBattle(1, undefined, [DECK, RIVAL]);
    const [mag] = b.spawnUnchecked(0, 'magnemite', { x: 3.5, y: 21 }, { ready: true });
    const [gd] = b.spawnUnchecked(1, 'geodude', { x: 3.5, y: 17.6 }, { ready: true });
    steps(b, 4);
    expect(unit(b, gd)!.targetId).toBe(mag);
  });

  it('Magnemite dispara a voladores y Voltorb explota al ser destruido', () => {
    const b = newBattle(1, undefined, [DECK, RIVAL]);
    disarmTowers(b);
    b.spawnUnchecked(0, 'magnemite', { x: 9, y: 22 }, { ready: true });
    const [zb] = b.spawnUnchecked(1, 'zubat', { x: 9, y: 18.5 }, { ready: true });
    const evs = steps(b, 60);
    expect(evs.some((e) => e.type === 'dano' && e.sourceCardId === 'magnemite')).toBe(true);
    void zb;
    const b2 = newBattle(2, undefined, [DECK, RIVAL]);
    disarmTowers(b2);
    const [vt] = b2.spawnUnchecked(0, 'voltorb', { x: 9, y: 22 }, { ready: true });
    unit(b2, vt)!.hp = 0;
    expect(b2.step().some((e) => e.type === 'explosion')).toBe(true);
  });
});

describe('Chansey', () => {
  it('genera 1 de energía cada 8 s mientras sigue en pie', () => {
    const b = newBattle(1, undefined, [DECK, RIVAL]);
    disarmTowers(b);
    setEnergy(b, 0, 0);
    setEnergy(b, 1, 0);
    b.spawnUnchecked(0, 'chansey', { x: 9, y: 26 }, { ready: true });
    const evs = steps(b, 8 * 20 + 1);
    expect(evs.filter((e) => e.type === 'energia')).toHaveLength(1);
    // El jugador 0 tiene 1 punto más que el rival (que solo regenera)
    expect(b.energy(0) - b.energy(1)).toBeCloseTo(1, 5);
  });
});

describe('enjambres', () => {
  it('Rattata salen 5 y Zubat 4 (voladores)', () => {
    const b = newBattle(1, undefined, [DECK, RIVAL]);
    forceInHand(b, 0, 'rattata');
    setEnergy(b, 0, 10);
    expect(b.deploy(0, 'rattata', { x: 9, y: 22 }).ok).toBe(true);
    forceInHand(b, 0, 'zubat');
    expect(b.deploy(0, 'zubat', { x: 9, y: 24 }).ok).toBe(true);
    b.step();
    expect(b.world.units.filter((u) => u.cardId === 'rattata')).toHaveLength(5);
    const z = b.world.units.filter((u) => u.cardId === 'zubat');
    expect(z).toHaveLength(4);
    expect(z.every((u) => u.locomotion === 'aire')).toBe(true);
  });
});

describe('Poción y Tóxico', () => {
  it('Poción cura a los aliados de la zona y no daña a nadie', () => {
    const b = newBattle(1, undefined, [DECK, RIVAL]);
    disarmTowers(b);
    const [ally] = b.spawnUnchecked(0, 'pikachu', { x: 9, y: 22 }, { ready: true });
    const [foe] = b.spawnUnchecked(1, 'pikachu', { x: 9, y: 23 }, { ready: true });
    unit(b, ally)!.hp = 100;
    unit(b, foe)!.hp = 100;
    for (const id of [ally, foe]) unit(b, id)!.status.stunUntil = 10 ** 9;
    forceInHand(b, 0, 'pocion');
    setEnergy(b, 0, 10);
    b.deploy(0, 'pocion', { x: 9, y: 22.5 });
    steps(b, 10);
    const heal = (getCard('pocion') as SpellCard).heal!;
    expect(unit(b, ally)!.hp).toBe(100 + heal);
    expect(unit(b, foe)!.hp).toBe(100);
  });

  it('Tóxico golpea 8 veces, una por segundo, con daño reducido a torres', () => {
    const b = newBattle(1, undefined, [DECK, RIVAL]);
    disarmTowers(b);
    const [snor] = b.spawnUnchecked(1, 'snorlax', { x: 9, y: 10 }, { ready: true });
    unit(b, snor)!.status.stunUntil = 10 ** 9;
    forceInHand(b, 0, 'toxico');
    setEnergy(b, 0, 10);
    b.deploy(0, 'toxico', { x: 9, y: 10 });
    const evs = steps(b, 20 * 10);
    const pulses = evs.filter((e) => e.type === 'veneno');
    expect(pulses).toHaveLength(8);
    expect(pulses.at(-1)).toMatchObject({ final: true });
    const hits = evs.filter((e) => e.type === 'dano' && e.targetId === snor);
    expect(hits).toHaveLength(8);
    expect(b.world.poisons).toHaveLength(0);
  });
});
