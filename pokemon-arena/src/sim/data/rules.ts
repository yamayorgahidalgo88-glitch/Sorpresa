/**
 * Reglas temporales y de energía. Todas las cifras son decisiones de diseño propias
 * (documentadas en docs/diseno_juego.md); se pueden sobrescribir al crear una batalla.
 */
export interface Rules {
  /** Pasos de simulación por segundo (paso fijo). */
  tickRate: number;
  /** Duración del tiempo reglamentario, en segundos. */
  regularSeconds: number;
  /** Segundo a partir del cual la energía se genera al doble. */
  doubleEnergyFromSecond: number;
  /** Duración de la prórroga (muerte súbita), en segundos. */
  overtimeSeconds: number;
  /** Multiplicador de energía durante la prórroga. */
  overtimeEnergyMultiplier: number;
  maxEnergy: number;
  startEnergy: number;
  /** Segundos para generar 1 punto de energía a ritmo x1. */
  secondsPerEnergy: number;
  handSize: number;
  deckSize: number;
}

export const DEFAULT_RULES: Rules = {
  tickRate: 20,
  regularSeconds: 180,
  doubleEnergyFromSecond: 120,
  overtimeSeconds: 60,
  overtimeEnergyMultiplier: 3,
  maxEnergy: 10,
  startEnergy: 5,
  secondsPerEnergy: 2.8,
  handSize: 4,
  deckSize: 8,
};

export function secondsToTicks(rules: Rules, seconds: number): number {
  return Math.round(seconds * rules.tickRate);
}
