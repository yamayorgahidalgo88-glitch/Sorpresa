import { describe, expect, it } from 'vitest';
import { CARDS, getCard } from '../src/sim/data/cards';
import type { PokemonCard } from '../src/sim/data/cards';
import { cardStatTiles, matchups, speedLabel } from '../src/game/ui/cardDetail';

const value = (id: string, label: string) => cardStatTiles(getCard(id)).find((t) => t.label === label)?.value;

describe('ficha de carta', () => {
  it('muestra las estadísticas del catálogo sin inventar datos', () => {
    const p = getCard('pikachu') as PokemonCard;
    expect(value('pikachu', 'Puntos de salud')).toBe(String(p.hp));
    expect(value('pikachu', 'Daño')).toBe(String(p.damage));
    expect(value('pikachu', 'Daño por segundo')).toBe(String(Math.round(p.damage / p.hitSpeed)));
    expect(value('pikachu', 'Vel. de ataque')).toBe(`${p.hitSpeed} s`);
    expect(value('pikachu', 'Alcance')).toBe(`${p.range} casillas`);
    expect(value('pikachu', 'Objetivos')).toBe('Aire y tierra');
  });

  it('distingue cuerpo a cuerpo, voladores, solo torres, cantidad y área', () => {
    expect(value('machop', 'Alcance')).toBe('Cuerpo a cuerpo');
    expect(value('machop', 'Cantidad')).toBe('x3');
    expect(value('pidgeotto', 'Unidad')).toBe('Voladora');
    expect(value('onix', 'Objetivos')).toBe('Solo torres');
    expect(value('charizard', 'Daño en área')).toBe('1.5 casillas');
  });

  it('las velocidades se agrupan en categorías legibles', () => {
    expect(speedLabel(0.6)).toBe('Lenta');
    expect(speedLabel(1.0)).toBe('Media');
    expect(speedLabel(1.4)).toBe('Rápida');
    expect(speedLabel(1.8)).toBe('Muy rápida');
  });

  it('los hechizos muestran daño, daño a torres, radio y efecto', () => {
    const rayo = getCard('rayo') as { damage: number; towerDamageFactor: number };
    expect(value('rayo', 'Daño')).toBe(String(rayo.damage));
    expect(value('rayo', 'Daño a torres')).toBe(`${Math.round(rayo.damage * rayo.towerDamageFactor)} (35 %)`);
    expect(value('ventisca', 'Efecto')).toContain('Ralentiza');
  });

  it('todas las cartas tienen ficha y las debilidades salen de la tabla de tipos', () => {
    for (const c of Object.values(CARDS)) expect(cardStatTiles(c).length).toBeGreaterThanOrEqual(4);
    const m = matchups(getCard('charmeleon') as PokemonCard);
    expect(m.weak).toContain('agua');
    expect(m.resist).toContain('planta');
  });
});
