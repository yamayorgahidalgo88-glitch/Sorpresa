import { describe, expect, it } from 'vitest';
import { ARENA, bridgeAt, inRiverBand } from '../src/sim/data/arena';
import { getCard } from '../src/sim/data/cards';
import { isDeployAllowed } from '../src/sim/systems/deployment';
import { disarmTowers, forceInHand, newBattle, setEnergy, steps, tower, unit } from './helpers';

describe('zonas de despliegue', () => {
  const b = newBattle();
  const towers = b.world.towers;
  const onix = getCard('onix');
  const rayo = getCard('rayo');

  it('permite la mitad propia y rechaza la rival y el río', () => {
    expect(isDeployAllowed(0, onix, { x: 9.5, y: 20.5 }, towers)).toBe(true);
    expect(isDeployAllowed(0, onix, { x: 9.5, y: 17.5 }, towers)).toBe(true);
    expect(isDeployAllowed(0, onix, { x: 9.5, y: 16.5 }, towers)).toBe(false); // río
    expect(isDeployAllowed(0, onix, { x: 9.5, y: 15.5 }, towers)).toBe(false); // río
    expect(isDeployAllowed(0, onix, { x: 9.5, y: 10.5 }, towers)).toBe(false); // campo rival
    expect(isDeployAllowed(1, onix, { x: 9.5, y: 10.5 }, towers)).toBe(true);
    expect(isDeployAllowed(1, onix, { x: 9.5, y: 20.5 }, towers)).toBe(false);
  });

  it('rechaza posiciones encima de torres en pie y fuera del campo', () => {
    expect(isDeployAllowed(0, onix, { x: 3.5, y: 25.5 }, towers)).toBe(false);
    expect(isDeployAllowed(0, onix, { x: 9.5, y: 29.5 }, towers)).toBe(false);
    expect(isDeployAllowed(0, onix, { x: -1, y: 25 }, towers)).toBe(false);
    expect(isDeployAllowed(0, onix, { x: 5, y: 40 }, towers)).toBe(false);
  });

  it('los hechizos se pueden lanzar en cualquier punto del campo', () => {
    expect(isDeployAllowed(0, rayo, { x: 3.5, y: 6.5 }, towers)).toBe(true);
    expect(isDeployAllowed(0, rayo, { x: 9.5, y: 16.5 }, towers)).toBe(true);
    expect(isDeployAllowed(0, rayo, { x: 9.5, y: 33 }, towers)).toBe(false);
  });

  it('derribar una torre guardiana abre la bolsa de esa ruta', () => {
    const b2 = newBattle();
    const pocketLeft = { x: 3.5, y: 12.5 };
    const pocketRight = { x: 14.5, y: 12.5 };
    expect(isDeployAllowed(0, onix, pocketLeft, b2.world.towers)).toBe(false);
    tower(b2, 1, 'guardia_izq').destroyed = true;
    expect(isDeployAllowed(0, onix, pocketLeft, b2.world.towers)).toBe(true);
    expect(isDeployAllowed(0, onix, pocketRight, b2.world.towers)).toBe(false);
    expect(isDeployAllowed(0, onix, { x: 3.5, y: 9.5 }, b2.world.towers)).toBe(false); // más allá de la bolsa
  });

  it('la batalla rechaza despliegues fuera de zona sin gastar energía', () => {
    const b3 = newBattle();
    const card = b3.hand(0).find((c) => getCard(c).kind === 'pokemon')!;
    setEnergy(b3, 0, 10);
    expect(b3.deploy(0, card, { x: 9, y: 8 })).toEqual({ ok: false, reason: 'zona_no_permitida' });
    expect(b3.energy(0)).toBe(10);
    expect(b3.hand(0)).toContain(card);
  });

  it('ajusta la posición al centro de la casilla', () => {
    const b4 = newBattle();
    forceInHand(b4, 0, 'squirtle');
    const r = b4.deploy(0, 'squirtle', { x: 9.93, y: 21.07 });
    expect(r.ok && r.pos).toEqual({ x: 9.5, y: 21.5 });
  });
});

describe('movimiento y navegación', () => {
  it('las unidades terrestres solo cruzan el río por los puentes', () => {
    const b = newBattle();
    disarmTowers(b);
    // Desplegada en el centro: tiene que desviarse hacia un puente.
    const [id] = b.spawnUnchecked(0, 'onix', { x: 9, y: 21 }, { ready: true });
    let crossed = false;
    for (let i = 0; i < 20 * 40; i++) {
      b.step();
      const u = unit(b, id);
      if (!u) break;
      if (inRiverBand(u.pos.y)) expect(bridgeAt(u.pos.x, u.radius * 0.5)).toBeGreaterThanOrEqual(0);
      if (u.pos.y < ARENA.riverTop) crossed = true;
    }
    expect(crossed).toBe(true);
  });

  it('los voladores cruzan en línea recta por encima del río', () => {
    const b = newBattle();
    disarmTowers(b);
    const [id] = b.spawnUnchecked(0, 'pidgeotto', { x: 9, y: 21 }, { ready: true });
    let overWater = false;
    for (let i = 0; i < 20 * 10; i++) {
      b.step();
      const u = unit(b, id)!;
      if (inRiverBand(u.pos.y) && bridgeAt(u.pos.x) < 0) overWater = true;
    }
    expect(overWater).toBe(true);
  });

  it('sin enemigos a la vista, avanza hacia la torre rival de su ruta', () => {
    const b = newBattle();
    disarmTowers(b);
    const [id] = b.spawnUnchecked(0, 'machop', { x: 3.5, y: 21 }, { ready: true });
    b.step();
    expect(unit(b, id)!.targetId).toBe(tower(b, 1, 'guardia_izq').id);
    const [id2] = b.spawnUnchecked(0, 'machop', { x: 14.5, y: 21 }, { ready: true });
    b.step();
    expect(unit(b, id2)!.targetId).toBe(tower(b, 1, 'guardia_der').id);
  });

  it('una unidad no actúa mientras se despliega', () => {
    const b = newBattle();
    const [id] = b.spawnUnchecked(0, 'pikachu', { x: 3.5, y: 21 });
    const start = { ...unit(b, id)!.pos };
    steps(b, 10);
    expect(unit(b, id)!.pos).toEqual(start);
    steps(b, 20);
    expect(unit(b, id)!.pos).not.toEqual(start);
  });

  it('las tropas no se atraviesan: tras resolver colisiones no se solapan', () => {
    const b = newBattle();
    disarmTowers(b);
    const ids = [
      ...b.spawnUnchecked(0, 'machop', { x: 9, y: 22 }, { ready: true }),
      ...b.spawnUnchecked(0, 'machop', { x: 9, y: 22 }, { ready: true }),
      ...b.spawnUnchecked(0, 'snorlax', { x: 9, y: 22 }, { ready: true }),
    ];
    steps(b, 5);
    const units = ids.map((i) => unit(b, i)!);
    for (let i = 0; i < units.length; i++) {
      for (let j = i + 1; j < units.length; j++) {
        const d = Math.hypot(units[i].pos.x - units[j].pos.x, units[i].pos.y - units[j].pos.y);
        expect(d).toBeGreaterThan((units[i].radius + units[j].radius) * 0.9);
      }
    }
  });

  it('selecciona como objetivo al enemigo válido más cercano', () => {
    const b = newBattle();
    disarmTowers(b);
    const [sq] = b.spawnUnchecked(0, 'squirtle', { x: 9, y: 20 }, { ready: true });
    const trio = b.spawnUnchecked(1, 'machop', { x: 9, y: 22.5 }, { ready: true });
    b.spawnUnchecked(1, 'snorlax', { x: 9, y: 25 }, { ready: true });
    b.step();
    // El más cercano de los tres Machop (la formación adelanta a dos de ellos).
    const target = unit(b, sq)!.targetId!;
    expect(trio).toContain(target);
    const d = (id: number) => Math.hypot(unit(b, id)!.pos.x - 9, unit(b, id)!.pos.y - 20);
    for (const id of trio) expect(d(target)).toBeLessThanOrEqual(d(id) + 1e-9);
  });

  it('las unidades que solo atacan edificios ignoran a las tropas', () => {
    const b = newBattle();
    disarmTowers(b);
    const [ox] = b.spawnUnchecked(0, 'onix', { x: 3.5, y: 19 }, { ready: true });
    b.spawnUnchecked(1, 'snorlax', { x: 3.5, y: 18 }, { ready: true });
    b.step();
    const t = b.world.entities.get(unit(b, ox)!.targetId!);
    expect(t?.kind).toBe('tower');
  });

  it('las unidades "tierra" no pueden atacar a voladores', () => {
    const b = newBattle();
    disarmTowers(b);
    const [ch] = b.spawnUnchecked(0, 'charmeleon', { x: 9, y: 20 }, { ready: true });
    b.spawnUnchecked(1, 'pidgeotto', { x: 9, y: 21 }, { ready: true });
    b.step();
    const t = b.world.entities.get(unit(b, ch)!.targetId!);
    expect(t?.kind).toBe('tower');
  });

  it('se detiene al tener el objetivo a su alcance', () => {
    const b = newBattle();
    disarmTowers(b);
    const [sq] = b.spawnUnchecked(0, 'squirtle', { x: 9, y: 20 }, { ready: true });
    const [sn] = b.spawnUnchecked(1, 'snorlax', { x: 9, y: 24 }, { ready: true });
    b.world.entities.get(sn)!.hp = 999999; // que no muera
    const s = unit(b, sn)!;
    s.status.stunUntil = 10 ** 9; // inmóvil
    steps(b, 40);
    const before = { ...unit(b, sq)!.pos };
    steps(b, 20);
    expect(unit(b, sq)!.pos).toEqual(before);
    expect(unit(b, sq)!.engaged).toBe(true);
  });
});
