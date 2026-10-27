import type { BattleResult, EndReason, Team, TowerEntity } from '../core/state';
import { enemyOf } from '../core/state';

/**
 * Medallas de un equipo = torres rivales derribadas. Derribar la base rival vale 3
 * (la victoria inmediata), igual que derribar las tres torres.
 */
export function medalsOf(team: Team, towers: readonly TowerEntity[]): number {
  const foe = enemyOf(team);
  let medals = 0;
  for (const t of towers) {
    if (t.team !== foe || !t.destroyed) continue;
    if (t.role === 'base') return 3;
    medals++;
  }
  return medals;
}

/** Salud total restante de las torres de un equipo (criterio de desempate). */
export function totalTowerHp(team: Team, towers: readonly TowerEntity[]): number {
  let hp = 0;
  for (const t of towers) if (t.team === team && !t.destroyed) hp += t.hp;
  return hp;
}

export function baseDestroyed(team: Team, towers: readonly TowerEntity[]): boolean {
  return towers.some((t) => t.team === team && t.role === 'base' && t.destroyed);
}

/** Resultado por medallas; si hay empate y `allowTiebreak`, decide la salud total de las torres. */
export function decide(towers: readonly TowerEntity[], tick: number, reason: EndReason, allowTiebreak: boolean): BattleResult | null {
  const medals: [number, number] = [medalsOf(0, towers), medalsOf(1, towers)];
  if (medals[0] !== medals[1]) {
    return { winner: medals[0] > medals[1] ? 0 : 1, reason, medals, tick };
  }
  if (!allowTiebreak) return null;
  const hp0 = totalTowerHp(0, towers);
  const hp1 = totalTowerHp(1, towers);
  if (hp0 === hp1) return { winner: null, reason: 'empate', medals, tick };
  return { winner: hp0 > hp1 ? 0 : 1, reason: 'desempate', medals, tick };
}
