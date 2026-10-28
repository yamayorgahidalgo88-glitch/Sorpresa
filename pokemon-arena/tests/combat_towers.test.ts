import { getCard } from '../src/sim/data/cards';
import type { PokemonCard } from '../src/sim/data/cards';
import { describe, expect, it } from 'vitest';
import type { SimEvent } from '../src/sim/core/state';
import { disarmTowers, forceInHand, newBattle, setEnergy, steps, tower, unit } from './helpers';

const deaths = (evs: SimEvent[]) => evs.filter((e) => e.type === 'muerte');

describe('daño y muerte', () => {
  it('el daño cuerpo a cuerpo resta exactamente el daño (con tipo neutro)', () => {
    const b = newBattle();
    disarmTowers(b);
    // Machop (lucha) contra Squirtle (agua): neutro, 75 por golpe.
    const [mc] = b.spawnUnchecked(0, 'machop', { x: 9, y: 22 }, { ready: true });
    const [sq] = b.spawnUnchecked(1, 'squirtle', { x: 9, y: 21.2 }, { ready: true });
    unit(b, sq)!.status.stunUntil = 10 ** 9;
    const evs = steps(b, 30);
    const hits = evs.filter((e) => e.type === 'dano' && e.targetId === sq);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((h) => h.type === 'dano' && h.amount === 75)).toBe(true);
    expect(unit(b, sq)!.hp).toBe(480 - 75 * hits.length);
    expect(mc).toBeGreaterThan(0);
  });

  it('la salud nunca baja de 0 y cada muerte se emite una sola vez', () => {
    const b = newBattle();
    disarmTowers(b);
    for (let i = 0; i < 6; i++) b.spawnUnchecked(0, 'machop', { x: 8 + (i % 3), y: 21 }, { ready: true });
    for (let i = 0; i < 6; i++) b.spawnUnchecked(1, 'machop', { x: 8 + (i % 3), y: 19 }, { ready: true });
    const all: SimEvent[] = [];
    for (let i = 0; i < 400; i++) {
      all.push(...b.step());
      for (const u of b.world.units) expect(u.hp).toBeGreaterThanOrEqual(0);
    }
    const ids = deaths(all).map((e) => e.type === 'muerte' && e.unitId);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of all) if (e.type === 'dano') expect(e.amount).toBeGreaterThanOrEqual(0);
  });

  it('una unidad muerta desaparece y deja de ser objetivo', () => {
    const b = newBattle();
    disarmTowers(b);
    const [sq] = b.spawnUnchecked(1, 'squirtle', { x: 9, y: 21 }, { ready: true });
    unit(b, sq)!.hp = 1;
    const [mc] = b.spawnUnchecked(0, 'machop', { x: 9, y: 21.9 }, { ready: true });
    steps(b, 30);
    expect(unit(b, sq)).toBeUndefined();
    expect(unit(b, mc)!.targetId).not.toBe(sq);
  });

  it('el daño en área alcanza a varios enemigos', () => {
    const b = newBattle();
    disarmTowers(b);
    b.spawnUnchecked(0, 'charmeleon', { x: 9, y: 22 }, { ready: true });
    const enemies = b.spawnUnchecked(1, 'machop', { x: 9, y: 20 }, { ready: true });
    for (const id of enemies) unit(b, id)!.status.stunUntil = 10 ** 9;
    const evs = steps(b, 50);
    const damaged = new Set(evs.filter((e) => e.type === 'dano').map((e) => e.type === 'dano' && e.targetId));
    expect(enemies.filter((id) => damaged.has(id)).length).toBeGreaterThanOrEqual(2);
    expect(evs.some((e) => e.type === 'impacto_area')).toBe(true);
  });

  it('Geodude explota al morir y daña a lo que tenga cerca (una sola vez)', () => {
    const b = newBattle();
    disarmTowers(b);
    const [gd] = b.spawnUnchecked(0, 'geodude', { x: 9, y: 21 }, { ready: true });
    const [vic] = b.spawnUnchecked(1, 'snorlax', { x: 10, y: 21 }, { ready: true });
    unit(b, vic)!.status.stunUntil = 10 ** 9;
    unit(b, gd)!.hp = 0;
    const evs = b.step();
    expect(evs.filter((e) => e.type === 'explosion')).toHaveLength(1);
    expect(deaths(evs)).toHaveLength(1);
    // roca contra normal: neutro => 260
    expect(unit(b, vic)!.hp).toBe(3000 - 260);
    expect(steps(b, 20).filter((e) => e.type === 'explosion')).toHaveLength(0);
  });

  it('Pikachu encadena descargas a enemigos cercanos con daño decreciente', () => {
    const b = newBattle();
    disarmTowers(b);
    b.spawnUnchecked(0, 'pikachu', { x: 9, y: 22 }, { ready: true });
    const targets = [
      ...b.spawnUnchecked(1, 'squirtle', { x: 9, y: 19.5 }, { ready: true }),
      ...b.spawnUnchecked(1, 'squirtle', { x: 10.5, y: 19.5 }, { ready: true }),
      ...b.spawnUnchecked(1, 'squirtle', { x: 12, y: 19.5 }, { ready: true }),
    ];
    for (const id of targets) unit(b, id)!.status.stunUntil = 10 ** 9;
    const evs = steps(b, 40);
    const chain = evs.find((e) => e.type === 'cadena');
    expect(chain && chain.type === 'cadena' && chain.points.length).toBe(3);
    // Cifras derivadas del catálogo: eléctrico contra agua x1,5 y cada salto multiplica por `falloff`.
    const pk = getCard('pikachu') as PokemonCard;
    const ab = pk.ability as { falloff: number };
    const first = Math.round(pk.damage * 1.5);
    const amounts = evs.filter((e) => e.type === 'dano').map((e) => e.type === 'dano' && e.amount);
    expect(amounts).toContain(first);
    expect(amounts).toContain(Math.round(pk.damage * ab.falloff * 1.5));
    expect(amounts).toContain(Math.round(pk.damage * ab.falloff * ab.falloff * 1.5));
  });

  it('Bulbasaur cura a los aliados heridos cercanos sin superar su salud máxima', () => {
    const b = newBattle();
    disarmTowers(b);
    // Un enemigo inmóvil y casi indestructible delante mantiene a Bulbasaur quieto atacando.
    const [dummy] = b.spawnUnchecked(1, 'snorlax', { x: 9, y: 19.5 }, { ready: true });
    unit(b, dummy)!.hp = unit(b, dummy)!.maxHp = 10 ** 6;
    unit(b, dummy)!.status.stunUntil = 10 ** 9;
    b.spawnUnchecked(0, 'bulbasaur', { x: 9, y: 23 }, { ready: true });
    const [ally] = b.spawnUnchecked(0, 'squirtle', { x: 10.5, y: 24 }, { ready: true });
    unit(b, ally)!.hp = 400;
    unit(b, ally)!.status.stunUntil = 10 ** 9; // aliado quieto: solo recibe curación
    const evs = steps(b, 100);
    expect(evs.some((e) => e.type === 'curacion' && e.targetId === ally)).toBe(true);
    expect(unit(b, ally)!.hp).toBeLessThanOrEqual(unit(b, ally)!.maxHp);
    expect(unit(b, ally)!.hp).toBe(480);
  });

  it('Jigglypuff duerme a los enemigos cercanos', () => {
    const b = newBattle();
    disarmTowers(b);
    const [jp] = b.spawnUnchecked(0, 'jigglypuff', { x: 9, y: 22 }, { ready: true });
    unit(b, jp)!.abilityTimer = 0;
    const [en] = b.spawnUnchecked(1, 'snorlax', { x: 9, y: 20.5 }, { ready: true });
    const evs = b.step();
    expect(evs.some((e) => e.type === 'canto')).toBe(true);
    expect(unit(b, en)!.status.stunUntil).toBeGreaterThan(b.tick);
  });

  it('los hechizos dañan en área, aturden/ralentizan y hacen daño reducido a torres', () => {
    const b = newBattle();
    const t = tower(b, 1, 'guardia_izq');
    const [en] = b.spawnUnchecked(1, 'snorlax', { x: 3.5, y: 8.5 }, { ready: true });
    forceInHand(b, 0, 'rayo');
    setEnergy(b, 0, 10);
    expect(b.deploy(0, 'rayo', t.pos).ok).toBe(true);
    const evs = steps(b, 8);
    expect(evs.some((e) => e.type === 'hechizo_impacto')).toBe(true);
    const rayoDmg = (getCard('rayo') as { damage: number }).damage;
    expect(t.hp).toBe(1600 - Math.round(rayoDmg * 0.35));
    expect(unit(b, en)!.hp).toBe(3000 - rayoDmg);
    expect(unit(b, en)!.status.stunUntil).toBeGreaterThan(b.tick);
  });
});

describe('torres', () => {
  it('disparan solo a enemigos dentro de su alcance', () => {
    const b = newBattle();
    const t = tower(b, 0, 'guardia_izq');
    // Fuera de alcance (borde a borde > 7,5)
    const [far] = b.spawnUnchecked(1, 'snorlax', { x: 3.5, y: 15.5 }, { ready: true });
    unit(b, far)!.status.stunUntil = 10 ** 9;
    const evs = steps(b, 40);
    expect(evs.some((e) => e.type === 'ataque' && e.sourceId === t.id)).toBe(false);
    // Dentro de alcance
    unit(b, far)!.pos = { x: 3.5, y: 19 };
    const evs2 = steps(b, 40);
    expect(evs2.some((e) => e.type === 'ataque' && e.sourceId === t.id && e.targetId === far)).toBe(true);
  });

  it('la base no dispara hasta activarse; se activa al recibir daño', () => {
    const b = newBattle();
    const base = tower(b, 0, 'base');
    expect(base.active).toBe(false);
    const [en] = b.spawnUnchecked(1, 'squirtle', { x: 9, y: 24 }, { ready: true });
    unit(b, en)!.status.stunUntil = 10 ** 9;
    const evs = steps(b, 40);
    expect(evs.some((e) => e.type === 'ataque' && e.sourceId === base.id)).toBe(false);
    unit(b, en)!.status.stunUntil = 0;
    const evs2 = steps(b, 200);
    expect(evs2.some((e) => e.type === 'base_activada' && e.towerId === base.id)).toBe(true);
  });

  it('la base se activa cuando cae una torre guardiana de su equipo', () => {
    const b = newBattle();
    const g = tower(b, 1, 'guardia_der');
    g.hp = 0;
    const evs = b.step();
    expect(evs.filter((e) => e.type === 'torre_destruida')).toHaveLength(1);
    expect(tower(b, 1, 'base').active).toBe(true);
    expect(steps(b, 10).filter((e) => e.type === 'torre_destruida')).toHaveLength(0);
  });

  it('las tropas terrestres no atraviesan las torres', () => {
    const b = newBattle();
    disarmTowers(b);
    const t = tower(b, 0, 'guardia_izq');
    const [u] = b.spawnUnchecked(0, 'snorlax', { x: 3.5, y: 25.6 }, { ready: true });
    b.step();
    const p = unit(b, u)!;
    expect(Math.hypot(p.pos.x - t.pos.x, p.pos.y - t.pos.y)).toBeGreaterThanOrEqual(t.radius + p.radius - 1e-9);
  });
});

describe('habilidad «escudo» (Abra)', () => {
  it('la Barrera absorbe el daño antes que la salud', async () => {
    const { newBattle, unit } = await import('./helpers');
    const { applyDamage } = await import('../src/sim/systems/combat');
    const b = newBattle();
    const [id] = b.spawnUnchecked(0, 'abra', { x: 9, y: 22 }, { ready: true });
    const u = unit(b, id)!;
    expect(u.shield).toBe(240);
    applyDamage(b.world, u, 200, null, { team: 1, cardId: null });
    expect(u.shield).toBe(40);
    expect(u.hp).toBe(u.maxHp);
    applyDamage(b.world, u, 200, null, { team: 1, cardId: null });
    expect(u.shield).toBe(0);
    expect(u.hp).toBe(u.maxHp - 160);
    // Alakazam (fase 3) tiene una Barrera mayor
    const [k] = b.spawnUnchecked(0, 'alakazam', { x: 9, y: 24 }, { ready: true });
    expect(unit(b, k)!.shield).toBe(300);
  });
});
