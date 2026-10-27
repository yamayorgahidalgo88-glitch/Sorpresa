import { describe, expect, it } from 'vitest';
import { Battle } from '../src/sim/battle';
import { DIFFICULTIES } from '../src/sim/ai/opponent';
import { DEFAULT_PLAYER_DECK, DEFAULT_RIVAL_DECK } from '../src/sim/data/cards';
import { runAiMatch } from '../src/sim/match';
import { newBattle, steps, tower } from './helpers';

const fast = { regularSeconds: 10, doubleEnergyFromSecond: 5, overtimeSeconds: 5 };

describe('condiciones de victoria', () => {
  it('derribar la base da la victoria inmediata con 3 medallas', () => {
    const b = newBattle();
    tower(b, 1, 'base').hp = 0;
    const evs = b.step();
    expect(b.result).toMatchObject({ winner: 0, reason: 'base_destruida', medals: [3, 0] });
    expect(evs.filter((e) => e.type === 'fin')).toHaveLength(1);
    expect(b.isOver).toBe(true);
  });

  it('al acabar el tiempo gana quien tenga más medallas', () => {
    const b = newBattle(1, fast);
    tower(b, 0, 'guardia_izq').hp = 0;
    steps(b, 20 * 11);
    expect(b.result).toMatchObject({ winner: 1, reason: 'tiempo', medals: [0, 1] });
    expect(b.result!.tick).toBe(200);
  });

  it('con empate a medallas hay prórroga con energía x3 y muerte súbita', () => {
    const b = newBattle(1, fast);
    steps(b, 20 * 10);
    expect(b.isOver).toBe(false);
    expect(b.phase).toBe('prorroga');
    expect(b.energyMultiplier()).toBe(3);
    tower(b, 1, 'guardia_der').hp = 0;
    b.step();
    expect(b.result).toMatchObject({ winner: 0, reason: 'muerte_subita', medals: [1, 0] });
  });

  it('las fases de energía cambian a x2 en el último tramo', () => {
    const b = newBattle(1, fast);
    expect(b.energyMultiplier()).toBe(1);
    steps(b, 20 * 5);
    expect(b.phase).toBe('doble');
    expect(b.energyMultiplier()).toBe(2);
  });

  it('si la prórroga acaba empatada decide la salud total de las torres', () => {
    const b = newBattle(1, fast);
    tower(b, 0, 'guardia_izq').hp -= 10;
    steps(b, 20 * 16);
    expect(b.result).toMatchObject({ winner: 1, reason: 'desempate' });
    expect(b.result!.tick).toBe(300);
  });

  it('salud idéntica al final de la prórroga => empate', () => {
    const b = newBattle(1, fast);
    steps(b, 20 * 16);
    expect(b.result).toMatchObject({ winner: null, reason: 'empate', medals: [0, 0] });
  });

  it('tras terminar no se aceptan despliegues y step() no avanza', () => {
    const b = newBattle();
    tower(b, 0, 'base').hp = 0;
    b.step();
    const t = b.tick;
    expect(b.deploy(0, b.hand(0)[0], { x: 9, y: 21 })).toEqual({ ok: false, reason: 'partida_terminada' });
    b.step();
    expect(b.tick).toBe(t);
  });

  it('la partida con reglas por defecto termina como muy tarde en 4 minutos', () => {
    const b = newBattle(9);
    b.runUntilEnd(20 * 300);
    expect(b.isOver).toBe(true);
    expect(b.result!.tick).toBe(20 * 240);
  });
});

describe('reproducibilidad', () => {
  const opts = { seed: 1234, decks: [DEFAULT_PLAYER_DECK, DEFAULT_RIVAL_DECK] as [string[], string[]] };
  const params: [typeof DIFFICULTIES.normal, typeof DIFFICULTIES.normal] = [DIFFICULTIES.normal, DIFFICULTIES.dificil];

  it('misma semilla => misma partida (huella y resultado idénticos)', () => {
    const a = runAiMatch(opts, params);
    const b = runAiMatch(opts, params);
    expect(a.battle.stateHash()).toBe(b.battle.stateHash());
    expect(a.result).toEqual(b.result);
    expect(a.battle.commandLog).toEqual(b.battle.commandLog);
  });

  it('el registro de órdenes reproduce exactamente la partida', () => {
    const a = runAiMatch(opts, params);
    const r = Battle.replay(opts, a.battle.commandLog);
    expect(r.stateHash()).toBe(a.battle.stateHash());
    expect(r.result).toEqual(a.result);
  });

  it('semillas distintas producen manos iniciales distintas', () => {
    const hands = new Set<string>();
    for (let s = 1; s <= 10; s++) hands.add(new Battle({ ...opts, seed: s }).hand(0).join(','));
    expect(hands.size).toBeGreaterThan(1);
  });
});
