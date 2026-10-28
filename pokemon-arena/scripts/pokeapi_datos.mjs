/**
 * Consulta PokéAPI (https://pokeapi.co, catálogo public-apis) para obtener DATOS de referencia:
 * tipos oficiales, altura real y color de cada Pokémon del juego, y las relaciones de tipos.
 * Compara con la configuración del juego y escribe docs/datos_pokeapi.json.
 * No descarga imágenes ni sprites (son recursos de juegos comerciales).
 * Uso: node scripts/pokeapi_datos.mjs
 */
import { writeFileSync } from 'node:fs';

const API = 'https://pokeapi.co/api/v2';
const POKEMON = [
  'onix', 'steelix', 'snorlax', 'pikachu', 'raichu', 'charmander', 'charmeleon', 'charizard', 'squirtle', 'wartortle', 'blastoise',
  'bulbasaur', 'ivysaur', 'venusaur', 'machop', 'machoke', 'machamp', 'pidgey', 'pidgeotto', 'pidgeot', 'geodude', 'graveler', 'golem',
  'jigglypuff', 'wigglytuff', 'gastly', 'haunter', 'gengar', 'abra', 'kadabra', 'alakazam', 'dratini', 'dragonair', 'dragonite',
];
// Nombres de tipo en PokéAPI (inglés) -> nombres del juego
const TYPES = { normal: 'normal', fire: 'fuego', water: 'agua', grass: 'planta', electric: 'electrico', ice: 'hielo', fighting: 'lucha', poison: 'veneno', ground: 'tierra', flying: 'volador', psychic: 'psiquico', rock: 'roca', ghost: 'fantasma', dragon: 'dragon', fairy: 'hada', steel: 'acero' };

const get = async (path) => {
  const r = await fetch(`${API}/${path}`);
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return r.json();
};

const pokemon = {};
for (const name of POKEMON) {
  const [p, s] = await Promise.all([get(`pokemon/${name}`), get(`pokemon-species/${name}`)]);
  pokemon[name] = {
    tipos: p.types.map((t) => TYPES[t.type.name] ?? t.type.name),
    altura_m: p.height / 10,
    peso_kg: p.weight / 10,
    color: s.color.name,
  };
}

const relaciones = {};
for (const [en, es] of Object.entries(TYPES)) {
  const t = await get(`type/${en}`);
  const map = (arr) => arr.map((x) => TYPES[x.name]).filter(Boolean).sort();
  relaciones[es] = {
    eficaz: map(t.damage_relations.double_damage_to),
    poco_eficaz: map(t.damage_relations.half_damage_to),
    casi_inmune: map(t.damage_relations.no_damage_to),
  };
}

const out = { fuente: 'PokéAPI v2 (https://pokeapi.co)', consultado: new Date().toISOString().slice(0, 10), pokemon, relaciones };
writeFileSync(new URL('../../docs/datos_pokeapi.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify(pokemon, null, 1));
