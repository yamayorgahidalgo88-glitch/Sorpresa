import type { PoseInput } from './rig';
import * as THREE from 'three';
import { BipedRig, eyeMaterials } from './kit';

/**
 * Jigglypuff y Wigglytuff (modelos originales):
 * - Jigglypuff: bola rosa con mechón rizado, orejas puntiagudas y ojos azules enormes.
 * - Wigglytuff: cuerpo de huevo alto con barriga blanca, orejas largas y mechón grande.
 * Avanzan dando botes y se hinchan al cantar.
 */
export class JigglypuffRig extends BipedRig {
  readonly height: number;
  private readonly earL: THREE.Group;
  private readonly earR: THREE.Group;

  constructor(variant: 'jigglypuff' | 'wigglytuff' = 'jigglypuff') {
    super();
    const tall = variant === 'wigglytuff';
    this.height = tall ? 1.75 : 1.2;
    const pink = this.mat(tall ? 0xf3c9d2 : 0xf6a5c0);
    const belly = this.mat(0xf6eef2);
    const inner = this.mat(0x4a2c40);
    const blue = this.mat(0x3fa6d8, { roughness: 0.2 });
    const dark = this.mat(0x7a2a4a);
    const { white } = eyeMaterials();
    this.hopHeight = tall ? 0.16 : 0.3;
    this.cadence = 9;

    const cy = tall ? 0.78 : 0.56;
    this.blob(this.body, 0.46, tall ? [1, 1.45, 0.95] : [1, 0.98, 1], [0, cy, 0], pink);
    if (tall) this.blob(this.body, 0.36, [0.95, 0.95, 0.6], [0, cy - 0.22, 0.2], belly, [0, 0, 0], 0);
    const top = tall ? cy + 0.66 : cy + 0.44;
    // Mechón rizado
    this.blob(this.body, tall ? 0.17 : 0.13, [1.1, 1, 0.8], [0, top, 0.14], pink);
    this.blob(this.body, tall ? 0.11 : 0.08, [1, 1, 1], [0.06, top + 0.04, 0.29], pink);
    const eyes = ['.WBB..WBB.', '.BBB..BBB.', '.BBB..BBB.', '..........', '....dd....'];
    this.face(this.body, eyes, { W: white, B: blue, d: dark }, tall ? cy + 0.56 : cy + 0.16);
    this.setMouth(this.body, [0, tall ? cy + 0.1 : cy - 0.14, 0.46]);
    this.body.add(this.head); // sin cabeza separada: la bola es cabeza y cuerpo

    const earY = tall ? cy + 0.52 : cy + 0.34;
    const earK = tall ? 1.5 : 1;
    this.earL = this.joint(this.body, [-0.28, earY, 0]);
    this.earR = this.joint(this.body, [0.28, earY, 0]);
    for (const [g, s] of [[this.earL, -1], [this.earR, 1]] as const) {
      this.blob(g, 0.12 * earK, [0.85, 1.5, 0.5], [0.04 * s, 0.1 * earK, 0], pink, [0, 0, -0.5 * s]);
      this.blob(g, 0.08 * earK, [0.8, 1.3, 0.4], [0.04 * s, 0.1 * earK, 0.04], inner, [0, 0, -0.5 * s], 0);
    }
    this.armL = this.joint(this.body, [-0.44, cy, 0.08]);
    this.armR = this.joint(this.body, [0.44, cy, 0.08]);
    for (const g of [this.armL, this.armR]) this.blob(g, 0.08, [1, tall ? 1.3 : 0.8, 1], [0, 0, 0], pink);
    this.legL = this.joint(this.body, [-0.17, 0.12, 0.05]);
    this.legR = this.joint(this.body, [0.17, 0.12, 0.05]);
    for (const g of [this.legL, this.legR]) this.blob(g, 0.11, [0.9, 0.6, 1.3], [0, -0.04, 0.04], pink);
  }

  override pose(p: PoseInput): void {
    super.pose(p);
    // Se hincha al cargar el canto y rebota al soltarlo
    const puff = 1 + p.charge * 0.12 + Math.sin(p.time * 2.5) * 0.02;
    this.body.scale.multiplyScalar(puff);
    this.body.rotation.x *= 0.4;
    this.earL.rotation.z = Math.sin(p.time * 3) * 0.08 + p.release * 0.3;
    this.earR.rotation.z = -Math.sin(p.time * 3) * 0.08 - p.release * 0.3;
  }
}
