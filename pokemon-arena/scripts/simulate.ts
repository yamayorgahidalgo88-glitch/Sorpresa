/**
 * Simulación por lotes IA contra IA (sin interfaz).
 * Uso: npm run simulate -- [partidas=20] [dificultad=normal]
 */
declare const process: { argv: string[] };
import { runAiMatch } from '../src/sim/match';
import { DIFFICULTIES, type Difficulty } from '../src/sim/ai/opponent';
import { DEFAULT_PLAYER_DECK, DEFAULT_RIVAL_DECK } from '../src/sim/data/cards';

const games = Number(process.argv[2] ?? 20);
const diff = (process.argv[3] ?? 'normal') as Difficulty;
const params = DIFFICULTIES[diff];
const wins = { 0: 0, 1: 0, empate: 0 } as Record<string, number>;
const reasons: Record<string, number> = {};
const played: Record<string, number> = {};
let ticks = 0;
const t0 = Date.now();
for (let seed = 1; seed <= games; seed++) {
  const r = runAiMatch({ seed, decks: [DEFAULT_PLAYER_DECK, DEFAULT_RIVAL_DECK] }, [params, params]);
  const res = r.result!;
  wins[res.winner === null ? 'empate' : String(res.winner)]++;
  reasons[res.reason] = (reasons[res.reason] ?? 0) + 1;
  ticks += res.tick;
  for (const c of r.battle.commandLog) played[c.cardId] = (played[c.cardId] ?? 0) + 1;
}
console.log(`Partidas: ${games} (dificultad ${diff}) en ${Date.now() - t0} ms`);
console.log('Victorias  mazo jugador (0):', wins[0], ' mazo rival (1):', wins[1], ' empates:', wins.empate);
console.log('Motivos:', reasons);
console.log('Duración media (s):', (ticks / games / 20).toFixed(1));
console.log('Cartas jugadas:', played);
