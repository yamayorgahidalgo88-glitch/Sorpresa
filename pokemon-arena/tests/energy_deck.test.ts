import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES } from '../src/sim/data/rules';
import { canAfford, createEnergy, energyPoints, energyValue, regenerate, spend } from '../src/sim/systems/energy';
import { DeckCycle, validateDeck } from '../src/sim/systems/deck';
import { Rng } from '../src/sim/core/rng';
import { CARDS, DEFAULT_PLAYER_DECK, getCard } from '../src/sim/data/cards';
import { forceInHand, newBattle, setEnergy } from './helpers';

describe('energía', () => {
  it('empieza en 5 y tiene tope 10', () => {
    const e = createEnergy(DEFAULT_RULES);
    expect(energyPoints(e)).toBe(5);
    for (let i = 0; i < 10000; i++) regenerate(e, 3);
    expect(energyValue(e)).toBe(10);
  });

  it('se regenera exactamente 1 punto cada 2,8 s a ritmo x1 (56 pasos)', () => {
    const e = createEnergy(DEFAULT_RULES);
    for (let i = 0; i < 55; i++) regenerate(e, 1);
    expect(energyPoints(e)).toBe(5);
    regenerate(e, 1);
    expect(energyPoints(e)).toBe(6);
  });

  it('x2 y x3 multiplican la velocidad', () => {
    const e2 = createEnergy(DEFAULT_RULES);
    for (let i = 0; i < 28; i++) regenerate(e2, 2);
    expect(energyValue(e2)).toBe(6);
    const e3 = createEnergy(DEFAULT_RULES);
    for (let i = 0; i < 56; i++) regenerate(e3, 3);
    expect(energyValue(e3)).toBe(8);
  });

  it('nunca es negativa: gastar sin saldo falla y no cambia nada', () => {
    const e = createEnergy(DEFAULT_RULES);
    expect(spend(e, 6)).toBe(false);
    expect(energyValue(e)).toBe(5);
    expect(spend(e, 5)).toBe(true);
    expect(e.sub).toBe(0);
    expect(spend(e, 1)).toBe(false);
    expect(e.sub).toBe(0);
    expect(canAfford(e, -1)).toBe(false);
  });

  it('en batalla, la energía se mantiene en [0, 10] tras miles de intentos de gasto', () => {
    const b = newBattle(7);
    for (let i = 0; i < 2000; i++) {
      for (const team of [0, 1] as const) {
        const id = b.hand(team)[i % 4];
        b.deploy(team, id, team === 0 ? { x: 9, y: 22 } : { x: 9, y: 10 });
        expect(b.energy(team)).toBeGreaterThanOrEqual(0);
        expect(b.energy(team)).toBeLessThanOrEqual(10);
      }
      b.step();
      if (b.isOver) break;
    }
  });
});

describe('costes de cartas', () => {
  it('desplegar descuenta exactamente el coste de cada carta', () => {
    for (const id of Object.keys(CARDS)) {
      if (id === 'ditto') continue; // su coste depende de la carta copiada (ditto.test.ts)
      // Relleno con cartas de otras líneas (no se pueden llevar dos fases de la misma).
      const others = Object.values(CARDS).filter((c) => c.line !== CARDS[id].line && c.stage === 1).map((c) => c.id);
      const deck = [id, ...others.slice(0, 7)];
      const b = newBattle(3, undefined, [deck, deck]);
      forceInHand(b, 0, id);
      setEnergy(b, 0, 10);
      const r = b.deploy(0, id, { x: 9, y: 21 });
      expect(r.ok, id).toBe(true);
      expect(b.energy(0)).toBe(10 - getCard(id).cost);
    }
  });

  it('rechaza el despliegue sin energía suficiente', () => {
    const b = newBattle(3);
    forceInHand(b, 0, 'onix');
    setEnergy(b, 0, 4);
    expect(b.deploy(0, 'onix', { x: 9, y: 21 })).toEqual({ ok: false, reason: 'energia_insuficiente' });
    expect(b.energy(0)).toBe(4);
  });

  it('todas las cartas tienen costes y estadísticas coherentes', () => {
    for (const c of Object.values(CARDS)) {
      expect(c.cost).toBeGreaterThanOrEqual(1);
      expect(c.cost).toBeLessThanOrEqual(10);
      if (c.kind === 'pokemon') {
        expect(c.hp).toBeGreaterThan(0);
        expect(c.damage).toBeGreaterThan(0);
        expect(c.hitSpeed).toBeGreaterThan(0);
        expect(c.speed).toBeGreaterThan(0);
        expect(c.range).toBeGreaterThan(0);
        expect(c.sight).toBeGreaterThanOrEqual(c.range);
        expect(c.count).toBeGreaterThanOrEqual(1);
      } else {
        expect(c.radius).toBeGreaterThan(0);
        expect(c.towerDamageFactor).toBeGreaterThan(0);
        expect(c.towerDamageFactor).toBeLessThanOrEqual(1);
      }
    }
  });

  it('los Pokémon tienen funciones tácticas diferenciadas', () => {
    const roles = new Set(Object.values(CARDS).map((c) => c.role));
    for (const r of ['tanque', 'rapido', 'distancia', 'apoyo', 'antigrupo', 'area', 'hechizo']) expect(roles).toContain(r);
    const air = Object.values(CARDS).filter((c) => c.kind === 'pokemon' && c.locomotion === 'aire');
    const buildings = Object.values(CARDS).filter((c) => c.kind === 'pokemon' && c.targets === 'edificios');
    expect(air.length).toBeGreaterThan(0);
    expect(buildings.length).toBeGreaterThan(0);
  });
});

describe('mazo y ciclo', () => {
  it('valida mazos de 8 cartas distintas y existentes', () => {
    expect(validateDeck(DEFAULT_PLAYER_DECK).ok).toBe(true);
    expect(validateDeck(DEFAULT_PLAYER_DECK.slice(0, 7)).ok).toBe(false);
    expect(validateDeck([...DEFAULT_PLAYER_DECK.slice(0, 7), 'onix']).ok).toBe(false);
    expect(validateDeck([...DEFAULT_PLAYER_DECK.slice(0, 7), 'mewtwo']).ok).toBe(false);
  });

  it('mano de 4 y rotación: la carta jugada va al final y entra la siguiente', () => {
    const d = new DeckCycle(DEFAULT_PLAYER_DECK, new Rng(42));
    expect(d.hand).toHaveLength(4);
    expect(new Set([...d.hand, ...d.queue]).size).toBe(8);
    const next = d.next;
    const played = d.hand[2];
    d.play(2);
    expect(d.hand[2]).toBe(next);
    expect(d.queue[d.queue.length - 1]).toBe(played);
    expect(d.hand).not.toContain(played);
  });

  it('tras 8 jugadas del primer hueco, el ciclo es periódico', () => {
    const d = new DeckCycle(DEFAULT_PLAYER_DECK, new Rng(1));
    const seq: string[] = [];
    for (let i = 0; i < 16; i++) seq.push(d.play(0));
    expect(new Set(seq).size).toBeLessThanOrEqual(8);
    expect(d.hand.length + d.queue.length).toBe(8);
  });

  it('no se puede jugar una carta que no está en la mano', () => {
    const b = newBattle(5);
    const notInHand = b.player(0).deck.queue[0];
    expect(b.deploy(0, notInHand, { x: 9, y: 21 })).toEqual({ ok: false, reason: 'carta_no_en_mano' });
  });
});
