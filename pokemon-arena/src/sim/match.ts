import { Battle } from './battle';
import type { BattleOptions } from './battle';
import type { BattleResult, SimEvent } from './core/state';
import { deriveSeed } from './core/rng';
import type { AiParams } from './ai/opponent';
import { OpponentAI } from './ai/opponent';
import { observe } from './ai/observation';

export interface AiMatchReport {
  battle: Battle;
  result: BattleResult | null;
  eventCounts: Record<string, number>;
  rejectedActions: number;
}

/**
 * Partida automática IA contra IA. Sirve para pruebas de larga duración, balance
 * y reproducibilidad: misma semilla y mismos parámetros => misma partida.
 */
export function runAiMatch(
  opts: BattleOptions,
  params: [AiParams, AiParams],
  onEvents?: (events: SimEvent[], battle: Battle) => void,
): AiMatchReport {
  const battle = new Battle(opts);
  const ais = [
    new OpponentAI(0, params[0], deriveSeed(opts.seed, 101)),
    new OpponentAI(1, params[1], deriveSeed(opts.seed, 202)),
  ];
  const eventCounts: Record<string, number> = {};
  let rejectedActions = 0;
  const limit = battle.regularTicks + battle.overtimeTicks + 10;
  while (!battle.isOver && battle.tick < limit) {
    for (const ai of ais) {
      const action = ai.decide(observe(battle, ai.team));
      if (action && !battle.deploy(ai.team, action.cardId, action.pos).ok) rejectedActions++;
    }
    const events = battle.step();
    for (const e of events) eventCounts[e.type] = (eventCounts[e.type] ?? 0) + 1;
    onEvents?.(events, battle);
  }
  return { battle, result: battle.result, eventCounts, rejectedActions };
}
