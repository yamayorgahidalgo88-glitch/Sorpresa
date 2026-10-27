/**
 * Informe de balance por carta (IA contra IA, sin interfaz).
 *
 * Juega partidas entre mazos aleatorios válidos y estima, para cada carta, la tasa de
 * victoria de los mazos que la incluyen. Un empate cuenta como media victoria.
 * También mide el emparejamiento de los dos mazos por defecto (con cambio de lado).
 *
 * Uso: npm run balance -- [partidas=400] [dificultad=normal]
 */
declare const process: { argv: string[] };
import { runAiMatch } from '../src/sim/match';
import { DIFFICULTIES, type Difficulty } from '../src/sim/ai/opponent';
import { CARD_IDS, DEFAULT_PLAYER_DECK, DEFAULT_RIVAL_DECK, getCard } from '../src/sim/data/cards';
import { Rng } from '../src/sim/core/rng';

const games = Number(process.argv[2] ?? 400);
const diff = (process.argv[3] ?? 'normal') as Difficulty;
const params = DIFFICULTIES[diff];
const rng = new Rng(20261027);

/** Mazo aleatorio con al menos una carta antiaérea (como exige el sentido común del jugador). */
function randomDeck(): string[] {
  for (;;) {
    const deck = rng.shuffle(CARD_IDS).slice(0, 8);
    const antiAir = deck.some((id) => {
      const c = getCard(id);
      return c.kind === 'hechizo' || c.targets === 'aire_y_tierra';
    });
    if (antiAir) return deck;
  }
}

const stats = new Map<string, { games: number; points: number; played: number }>();
for (const id of CARD_IDS) stats.set(id, { games: 0, points: 0, played: 0 });
let sides = [0, 0];
const t0 = Date.now();
for (let g = 0; g < games; g++) {
  const decks: [string[], string[]] = [randomDeck(), randomDeck()];
  const r = runAiMatch({ seed: 1000 + g, decks }, [params, params]);
  const w = r.result!.winner;
  for (const team of [0, 1] as const) {
    const pts = w === null ? 0.5 : w === team ? 1 : 0;
    sides[team] += pts;
    for (const id of decks[team]) {
      const s = stats.get(id)!;
      s.games++;
      s.points += pts;
    }
  }
  for (const c of r.battle.commandLog) stats.get(c.cardId)!.played++;
}

console.log(`Mazos aleatorios: ${games} partidas (${diff}) en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
console.log(`Ventaja de lado: equipo 0 ${(sides[0] / games).toFixed(3)} · equipo 1 ${(sides[1] / games).toFixed(3)}`);
console.log('Carta        partidas  victoria  jugadas/partida');
for (const [id, s] of [...stats].sort((a, b) => b[1].points / b[1].games - a[1].points / a[1].games)) {
  const wr = s.points / s.games;
  // Error estándar aproximado de una proporción: sirve para no sobreinterpretar el ruido.
  const se = Math.sqrt((wr * (1 - wr)) / s.games);
  console.log(`${id.padEnd(12)} ${String(s.games).padStart(8)}  ${wr.toFixed(3)} ±${(1.96 * se).toFixed(3)}  ${(s.played / s.games).toFixed(1)}`);
}

let pts = 0;
const n = Math.max(10, Math.floor(games / 10));
for (let s = 1; s <= n; s++) {
  for (const swap of [false, true]) {
    const decks: [string[], string[]] = swap ? [DEFAULT_RIVAL_DECK, DEFAULT_PLAYER_DECK] : [DEFAULT_PLAYER_DECK, DEFAULT_RIVAL_DECK];
    const w = runAiMatch({ seed: 5000 + s, decks }, [params, params]).result!.winner;
    const me = swap ? 1 : 0;
    pts += w === null ? 0.5 : w === me ? 1 : 0;
  }
}
console.log(`\nMazo del jugador contra mazo de la IA (ambos lados, ${2 * n} partidas): ${(pts / (2 * n)).toFixed(3)}`);
