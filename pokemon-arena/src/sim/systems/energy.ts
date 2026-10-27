import type { Rules } from '../data/rules';

/**
 * Energía en aritmética entera: 1 punto = `subPerPoint` subunidades, y a ritmo x1 se gana
 * exactamente 1 subunidad por paso. Así la regeneración es exacta y reproducible
 * (sin errores de coma flotante acumulados).
 */
export interface EnergyState {
  sub: number;
  subPerPoint: number;
  maxSub: number;
}

export function createEnergy(rules: Rules): EnergyState {
  const subPerPoint = Math.round(rules.secondsPerEnergy * rules.tickRate);
  return {
    sub: rules.startEnergy * subPerPoint,
    subPerPoint,
    maxSub: rules.maxEnergy * subPerPoint,
  };
}

/** Regenera un paso con el multiplicador indicado (1, 2 o 3). */
export function regenerate(e: EnergyState, multiplier: number): void {
  e.sub = Math.min(e.maxSub, e.sub + Math.max(0, Math.floor(multiplier)));
}

/** Puntos enteros disponibles para gastar. */
export function energyPoints(e: EnergyState): number {
  return Math.floor(e.sub / e.subPerPoint);
}

/** Valor continuo (para la barra de la interfaz). */
export function energyValue(e: EnergyState): number {
  return e.sub / e.subPerPoint;
}

export function canAfford(e: EnergyState, cost: number): boolean {
  return cost >= 0 && e.sub >= cost * e.subPerPoint;
}

/** Gasta energía si hay suficiente. Nunca deja la energía en negativo. */
export function spend(e: EnergyState, cost: number): boolean {
  if (!canAfford(e, cost)) return false;
  e.sub -= cost * e.subPerPoint;
  return true;
}
