import * as THREE from 'three';
import type { Team } from '../sim/core/state';

/** Paleta de la dirección artística (docs/direccion_artistica.md). */
export const PAL = {
  sky: 0x9fdcf5,
  fog: 0xb8e6f2,
  hemiSky: 0xe4f4ff,
  hemiGround: 0x5f8d43,
  sun: 0xfff0d2,
  rim: 0x9fc7ff,
  stone: 0xd9d1c2,
  stoneDark: 0x8d8478,
  wood: 0xb8793f,
  woodDark: 0x7a4a24,
  gold: 0xf5c542,
  water: 0x2fb7e6,
  waterDeep: 0x1677b8,
  outline: 0x1d1410,
  team: [0x3f8cff, 0xff5146] as const,
  teamDark: [0x1f4fae, 0xb3261d] as const,
  teamLight: [0x9cc8ff, 0xffa59e] as const,
};

export function teamColor(team: Team): number {
  return PAL.team[team];
}

/** Material estándar de "juguete": colores limpios, rugosidad media, sin metal. */
export function toyMaterial(color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...opts });
}

/** Material plástico brillante para personajes (barniz suave). */
export function plasticMaterial(color: number, opts: Partial<THREE.MeshPhysicalMaterialParameters> = {}): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.42, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.35, ...opts });
}
