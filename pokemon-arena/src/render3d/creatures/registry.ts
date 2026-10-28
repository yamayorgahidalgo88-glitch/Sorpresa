import * as THREE from 'three';
import { getCard } from '../../sim/data/cards';
import { ELEMENT_COLORS } from '../../sim/data/elements';
import { plasticMaterial } from '../palette';
import { PikachuRig } from './pikachu';
import type { PoseInput } from './rig';
import { CreatureRig } from './rig';
import { voxelizeRig } from './voxel';

/** Estilo de los personajes: 'suave' (volúmenes redondeados) o 'voxel' (píxel 3D). */
export type CreatureStyle = 'suave' | 'voxel';

/**
 * PROVISIONAL (hito F): cápsula con el color del tipo para los Pokémon que aún no tienen
 * modelo de producción. Se marca explícitamente para no confundirla con un recurso final.
 */
class PlaceholderRig extends CreatureRig {
  readonly height: number;
  constructor(cardId: string) {
    super();
    const card = getCard(cardId);
    const r = card.kind === 'pokemon' ? card.radius : 0.5;
    this.height = r * 2.4;
    const m = this.part(new THREE.CapsuleGeometry(r * 0.75, r * 0.8, 6, 16), plasticMaterial(ELEMENT_COLORS[card.types[0]]), this.body);
    m.position.y = this.height / 2;
  }
  pose(p: PoseInput): void {
    this.body.position.y = Math.abs(Math.sin(p.time * 12)) * 0.1 * p.run;
    this.body.rotation.x = -p.hurt * 0.3 + p.release * 0.3;
  }
  emitterWorld(out: THREE.Vector3): THREE.Vector3 {
    return this.body.localToWorld(out.set(0, this.height * 0.7, 0.3));
  }
}

/** Modelos de producción disponibles. Añadir aquí cada Pokémon a medida que se termine. */
const RIGS: Record<string, (style: CreatureStyle) => CreatureRig> = {
  pikachu: (style) => new PikachuRig(style === 'voxel'),
};

/** Arista del cubo en el estilo vóxel (casillas, antes de la escala visual). */
let voxelSize = 0.085;
export function setVoxelSize(size: number): void {
  voxelSize = size;
}

export function createRig(cardId: string, style: CreatureStyle = 'suave'): CreatureRig {
  const rig = RIGS[cardId]?.(style) ?? new PlaceholderRig(cardId);
  if (style === 'voxel') voxelizeRig(rig, voxelSize);
  return rig;
}

export function hasProductionModel(cardId: string): boolean {
  return cardId in RIGS;
}
