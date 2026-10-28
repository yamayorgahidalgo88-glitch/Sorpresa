import { describe, expect, it } from 'vitest';
import { Rng } from '../src/sim/core/rng';
import { CARDS, DEFAULT_RIVAL_DECK, LINES, STARTER_LINES, getCard, maxStage } from '../src/sim/data/cards';
import { validateDeck } from '../src/sim/systems/deck';
import {
  BALLS,
  COPY_VALUE,
  EVOLVE_COST,
  STARTING_COINS,
  TROPHY_ROAD,
  buyBall,
  canEvolve,
  cardIdFor,
  claimRoad,
  deckStage,
  evolve,
  evolvedValue,
  matchCoins,
  newProfile,
  openBall,
  rivalDeck,
} from '../src/persistence/economy';
import type { BallKind } from '../src/persistence/economy';

describe('catálogo con evoluciones', () => {
  it('las líneas tienen fases coherentes y las evoluciones mejoran sin cambiar el coste', () => {
    for (const line of LINES) {
      const stages = Object.values(CARDS).filter((c) => c.line === line).sort((a, b) => a.stage - b.stage);
      expect(stages.map((c) => c.stage)).toEqual([1, 2, 3].slice(0, stages.length));
      for (const c of stages.slice(1)) {
        expect(c.cost, c.id).toBe(stages[0].cost);
        if (c.kind === 'pokemon' && stages[0].kind === 'pokemon') {
          expect(c.hp, c.id).toBeGreaterThan(stages[0].hp);
          expect(c.damage, c.id).toBeGreaterThan(stages[0].damage);
        } else if (c.kind === 'hechizo' && stages[0].kind === 'hechizo') {
          expect(c.damage, c.id).toBeGreaterThan(stages[0].damage);
        }
      }
    }
    expect(maxStage('snorlax')).toBe(1);
    expect(maxStage('pikachu')).toBe(2);
    expect(maxStage('charmander')).toBe(3);
    expect(maxStage('rayo')).toBe(3);
    expect(getCard('charizard').line).toBe('charmander');
  });

  it('se empieza con 9 cartas base y el mazo no admite dos fases de la misma línea', () => {
    expect(STARTER_LINES).toHaveLength(9);
    for (const l of STARTER_LINES) expect(getCard(l).stage).toBe(1);
    expect(validateDeck(['charmander', 'charmeleon', 'pikachu', 'squirtle', 'bulbasaur', 'machop', 'pidgey', 'rayo']).ok).toBe(false);
  });
});

describe('Pokéballs', () => {
  const open = (kind: BallKind, seed: number, profile = newProfile()) => {
    profile.balls[kind] = 1;
    return { drops: openBall(profile, kind, new Rng(seed))!, profile };
  };

  it('comprar descuenta el precio y no permite saldo negativo', () => {
    const p = newProfile();
    expect(p.coins).toBe(STARTING_COINS);
    expect(buyBall(p, 'poke')).toBe(true);
    expect(p.coins).toBe(STARTING_COINS - BALLS.poke.price);
    expect(buyBall(p, 'master')).toBe(false);
    expect(p.balls).toMatchObject({ poke: 1, master: 0 });
  });

  it('cada Pokéball da su número de cartas distintas con cantidades en su rango', () => {
    for (const kind of ['poke', 'super', 'ultra', 'master'] as BallKind[]) {
      for (let seed = 1; seed <= 40; seed++) {
        const { drops } = open(kind, seed);
        const def = BALLS[kind];
        expect(drops).toHaveLength(def.distinct);
        expect(new Set(drops.map((d) => d.line)).size).toBe(def.distinct);
        for (const d of drops) {
          expect(d.copies).toBeGreaterThanOrEqual(def.min);
          expect(d.copies).toBeLessThanOrEqual(def.max);
        }
      }
    }
  });

  it('solo Ultra y Master dan cartas evolucionadas; la Master garantiza al menos una', () => {
    let ultraEvolved = 0;
    for (let seed = 1; seed <= 300; seed++) {
      for (const kind of ['poke', 'super'] as BallKind[]) expect(open(kind, seed).drops.every((d) => getCard(d.cardId).stage === 1)).toBe(true);
      if (open('ultra', seed).drops.some((d) => getCard(d.cardId).stage > 1)) ultraEvolved++;
      expect(open('master', seed).drops.some((d) => getCard(d.cardId).stage >= 2)).toBe(true);
    }
    expect(ultraEvolved).toBeGreaterThan(0);
    expect(ultraEvolved).toBeLessThan(300 * 0.6);
  });

  it('una carta nueva se añade a la colección y una evolución mejora la que tienes', () => {
    // Fuerza con una sola línea disponible para controlar el resultado.
    const p = newProfile();
    const before = Object.keys(p.owned).length;
    let found = false;
    for (let seed = 1; seed <= 200 && !found; seed++) {
      const { drops, profile } = open('super', seed);
      const nueva = drops.find((d) => d.isNew);
      if (nueva) {
        expect(Object.keys(profile.owned).length).toBe(before + drops.filter((d) => d.isNew).length);
        expect(profile.owned[nueva.line].copies).toBe(nueva.copies - 1);
        found = true;
      }
    }
    expect(found).toBe(true);
    // Un Charmeleon en una Pokéball sustituye a tu Charmander
    for (let seed = 1; seed <= 400; seed++) {
      const { drops, profile } = open('master', seed);
      const up = drops.find((d) => d.upgradedTo && !d.isNew);
      if (up) {
        expect(profile.owned[up.line].stage).toBe(up.upgradedTo);
        expect(cardIdFor(profile, up.line)).toBe(up.cardId);
        return;
      }
    }
    throw new Error('ninguna Master Ball mejoró una carta en 400 tiradas');
  });

  it('lo repetido se convierte en monedas por su valor', () => {
    const p = newProfile();
    p.owned.snorlax = { stage: 1, copies: 0 }; // Snorlax no evoluciona: sus copias son monedas
    p.owned.charmander = { stage: 3, copies: 0 };
    let checked = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const prof = structuredClone(p);
      const coins0 = prof.coins;
      prof.balls.master = 1;
      const drops = openBall(prof, 'master', new Rng(seed))!;
      const sum = drops.reduce((s, d) => s + d.coins, 0);
      expect(prof.coins).toBe(coins0 + sum);
      for (const d of drops) {
        if (d.line === 'snorlax') {
          expect(d.coins).toBe(d.copies * COPY_VALUE);
          checked++;
        }
        if (d.line === 'charmander') {
          const st = getCard(d.cardId).stage;
          expect(d.coins).toBe(d.copies * COPY_VALUE + (st > 1 ? evolvedValue(st) : 0));
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(10);
  });
});

describe('evolucionar', () => {
  it('cuesta copias y monedas, cambia la carta del mazo y mejora sus estadísticas', () => {
    const p = newProfile();
    expect(canEvolve(p, 'bulbasaur')).toBe(false);
    p.owned.bulbasaur.copies = EVOLVE_COST[2].copies;
    p.coins = EVOLVE_COST[2].coins;
    expect(canEvolve(p, 'bulbasaur')).toBe(true);
    expect(evolve(p, 'bulbasaur')).toBe(true);
    expect(p.owned.bulbasaur).toEqual({ stage: 2, copies: 0 });
    expect(p.coins).toBe(0);
    expect(cardIdFor(p, 'bulbasaur')).toBe('ivysaur');
    p.owned.bulbasaur.copies = 50;
    p.coins = 5000;
    expect(evolve(p, 'bulbasaur')).toBe(true);
    // Fase final: las copias sobrantes pasan a monedas
    expect(p.owned.bulbasaur).toEqual({ stage: 3, copies: 0 });
    expect(p.coins).toBe(5000 - EVOLVE_COST[3].coins + 10 * COPY_VALUE);
    expect(cardIdFor(p, 'bulbasaur')).toBe('venusaur');
    expect(evolve(p, 'bulbasaur')).toBe(false);
    expect(evolve(p, 'snorlax')).toBe(false);
  });
});

describe('monedas, camino de trofeos y rival', () => {
  it('monedas por partida', () => {
    expect(matchCoins(0, 3)).toBe(45);
    expect(matchCoins(null, 1)).toBe(17);
    expect(matchCoins(1, 0)).toBe(6);
  });

  it('el camino da cada hito una vez, con Ultraball cada 100 y Master Ball a los 500', () => {
    const p = newProfile();
    const got = claimRoad(p, 520);
    expect(got.map((r) => r.trophies)).toEqual(TROPHY_ROAD.filter((r) => r.trophies <= 520).map((r) => r.trophies));
    expect(TROPHY_ROAD.find((r) => r.trophies === 100)?.ball).toBe('ultra');
    expect(TROPHY_ROAD.find((r) => r.trophies === 500)?.ball).toBe('master');
    expect(p.balls.master).toBe(1);
    expect(claimRoad(p, 520)).toEqual([]);
  });

  it('el rival se ajusta a la fuerza de tu mazo (emparejamiento justo) y es reproducible', () => {
    const mean = (playerStage: number, trophies: number) => {
      let sum = 0;
      for (let s = 0; s < 300; s++) sum += deckStage(rivalDeck(DEFAULT_RIVAL_DECK, playerStage, trophies, new Rng(s)));
      return sum / 300;
    };
    // Con tu mazo en primera fase, el rival casi no evoluciona; con tu mazo evolucionado, sí.
    expect(mean(1, 0)).toBeLessThan(1.15);
    expect(Math.abs(mean(2, 0) - 2)).toBeLessThan(0.2);
    expect(mean(2.6, 0)).toBeGreaterThan(mean(2, 0) + 0.3);
    // Los trofeos solo añaden un pequeño margen (hasta +0,25)
    expect(mean(1.5, 1000) - mean(1.5, 0)).toBeGreaterThan(0.1);
    expect(mean(1.5, 1000) - mean(1.5, 0)).toBeLessThan(0.35);
    expect(rivalDeck(DEFAULT_RIVAL_DECK, 2, 300, new Rng(9))).toEqual(rivalDeck(DEFAULT_RIVAL_DECK, 2, 300, new Rng(9)));
    for (let s = 0; s < 50; s++) expect(validateDeck(rivalDeck(DEFAULT_RIVAL_DECK, 3, 900, new Rng(s))).ok).toBe(true);
  });

  it('la fuerza de un mazo ignora las cartas que no evolucionan', () => {
    expect(deckStage(['charmander', 'squirtle', 'snorlax', 'ditto'])).toBe(1);
    expect(deckStage(['charizard', 'wartortle', 'snorlax'])).toBe(2.5);
  });
});
