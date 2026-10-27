import { CARDS } from '../data/cards';
import type { Rng } from '../core/rng';

export interface DeckValidation {
  ok: boolean;
  errors: string[];
}

/** Un mazo válido tiene exactamente `size` cartas distintas y existentes. */
export function validateDeck(ids: readonly string[], size = 8): DeckValidation {
  const errors: string[] = [];
  if (ids.length !== size) errors.push(`El mazo debe tener ${size} cartas (tiene ${ids.length}).`);
  const seen = new Set<string>();
  for (const id of ids) {
    if (!CARDS[id]) errors.push(`Carta desconocida: ${id}.`);
    if (seen.has(id)) errors.push(`Carta repetida: ${id}.`);
    seen.add(id);
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Ciclo de cartas: mano visible de `handSize` y cola con el resto.
 * Al jugar una carta, va al final de la cola y su hueco lo ocupa la primera de la cola.
 */
export class DeckCycle {
  readonly hand: string[];
  readonly queue: string[];

  constructor(deck: readonly string[], rng: Rng, handSize = 4) {
    const v = validateDeck(deck, deck.length);
    if (!v.ok) throw new Error(v.errors.join(' '));
    if (deck.length <= handSize) throw new Error('El mazo debe ser mayor que la mano.');
    const shuffled = rng.shuffle(deck);
    this.hand = shuffled.slice(0, handSize);
    this.queue = shuffled.slice(handSize);
  }

  get next(): string {
    return this.queue[0];
  }

  indexOf(cardId: string): number {
    return this.hand.indexOf(cardId);
  }

  /** Rota la carta del hueco `index`. Devuelve la carta jugada. */
  play(index: number): string {
    if (index < 0 || index >= this.hand.length) throw new Error(`Índice de mano no válido: ${index}`);
    const played = this.hand[index];
    const incoming = this.queue.shift()!;
    this.hand[index] = incoming;
    this.queue.push(played);
    return played;
  }
}
