import type { PoseInput } from './rig';
import * as THREE from 'three';
import { BipedRig, eyeMaterials } from './kit';

/**
 * Jigglypuff (modelo original): bola rosa con mechón rizado, orejas puntiagudas y ojos
 * azules enormes. Avanza dando botes y se hincha al cantar. Altura base 1,44 (0,5 m reales).
 */
export class JigglypuffRig extends BipedRig {
  readonly height = 1.2;
  private readonly earL: THREE.Group;
  private readonly earR: THREE.Group;

  constructor() {
    super();
    const pink = this.mat(0xf6a5c0);
    const inner = this.mat(0x4a2c40);
    const blue = this.mat(0x3fa6d8, { roughness: 0.2 });
    const dark = this.mat(0x7a2a4a);
    const { white } = eyeMaterials();
    this.hopHeight = 0.3;
    this.cadence = 9;

    this.blob(this.body, 0.46, [1, 0.98, 1], [0, 0.56, 0], pink);
    // Mechón rizado
    this.blob(this.body, 0.13, [1.1, 1, 0.8], [0, 1.0, 0.14], pink);
    this.blob(this.body, 0.08, [1, 1, 1], [0.06, 1.04, 0.27], pink);
    this.face(this.body, ['.WBB..WBB.', '.BBB..BBB.', '.BBB..BBB.', '..........', '....dd....'], { W: white, B: blue, d: dark }, 0.72);
    this.setMouth(this.body, [0, 0.42, 0.46]);
    this.body.add(this.head); // sin cabeza separada: la bola es cabeza y cuerpo

    this.earL = this.joint(this.body, [-0.28, 0.9, 0]);
    this.earR = this.joint(this.body, [0.28, 0.9, 0]);
    for (const [g, s] of [[this.earL, -1], [this.earR, 1]] as const) {
      this.blob(g, 0.12, [0.85, 1.5, 0.5], [0.04 * s, 0.1, 0], pink, [0, 0, -0.5 * s]);
      this.blob(g, 0.08, [0.8, 1.3, 0.4], [0.04 * s, 0.1, 0.04], inner, [0, 0, -0.5 * s], 0);
    }
    this.armL = this.joint(this.body, [-0.44, 0.55, 0.08]);
    this.armR = this.joint(this.body, [0.44, 0.55, 0.08]);
    for (const g of [this.armL, this.armR]) this.blob(g, 0.08, [1, 0.8, 1], [0, 0, 0], pink);
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
