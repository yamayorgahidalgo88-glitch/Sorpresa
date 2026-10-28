import { describe, expect, it } from 'vitest';
import datos from '../../docs/datos_pokeapi.json';
import { getCard } from '../src/sim/data/cards';
import { ELEMENTS, TYPE_CHART } from '../src/sim/data/elements';

/**
 * Contraste con una instantánea de PokéAPI (scripts/pokeapi_datos.mjs → docs/datos_pokeapi.json).
 * Verifica las RELACIONES de tipos; los multiplicadores atenuados son decisión de diseño.
 */
describe('coherencia con PokéAPI', () => {
  it('cada Pokémon tiene los tipos oficiales', () => {
    for (const [id, p] of Object.entries(datos.pokemon)) expect(getCard(id).types, id).toEqual(p.tipos);
  });

  it('la tabla de tipos coincide con las relaciones oficiales', () => {
    const rel = datos.relaciones as Record<string, { eficaz: string[]; poco_eficaz: string[]; casi_inmune: string[] }>;
    for (const e of ELEMENTS) {
      const mine = TYPE_CHART[e];
      expect([...(mine.eficaz ?? [])].sort(), `${e} eficaz`).toEqual(rel[e].eficaz);
      expect([...(mine.poco_eficaz ?? [])].sort(), `${e} poco eficaz`).toEqual(rel[e].poco_eficaz);
      expect([...(mine.casi_inmune ?? [])].sort(), `${e} inmune`).toEqual(rel[e].casi_inmune);
    }
  });
});
