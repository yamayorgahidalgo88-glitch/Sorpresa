import * as THREE from 'three';
import type { PoseInput } from './rig';
import { BipedRig, eyeMaterials } from './kit';

/**
 * Raichu (modelo original): naranja con vientre crema, orejas grandes con interior marrón y
 * punta rizada, mejillas amarillas que se encienden al cargar y cola fina y larga acabada en
 * un rayo. Altura base 1,67 (0,8 m reales).
 */
export class RaichuRig extends BipedRig {
  readonly height = 1.65;
  private readonly cheekMat: THREE.MeshPhysicalMaterial;

  constructor() {
    super();
    const fur = this.mat(0xeba84f);
    const cream = this.mat(0xf8ecd2);
    const brown = this.mat(0x6b4a2c);
    const { white, black } = eyeMaterials();
    this.cheekMat = this.glowMat(0xf7e04a, 0xffe14a, 0);
    this.cadence = 14;
    this.hopHeight = 0.14;

    this.legL = this.joint(this.body, [-0.15, 0.24, 0.02]);
    this.legR = this.joint(this.body, [0.15, 0.24, 0.02]);
    for (const g of [this.legL, this.legR]) {
      this.blob(g, 0.12, [1, 1.2, 1.1], [0, -0.08, 0], fur);
      this.blob(g, 0.1, [1, 0.55, 1.6], [0, -0.2, 0.06], brown);
    }
    this.blob(this.body, 0.3, [1, 1.15, 0.92], [0, 0.56, 0], fur);
    this.blob(this.body, 0.24, [0.9, 1.05, 0.6], [0, 0.52, 0.12], cream, [0, 0, 0], 0);

    this.head.position.set(0, 1.0, 0.04);
    this.body.add(this.head);
    this.blob(this.head, 0.3, [1.15, 0.95, 1], [0, 0, 0], fur);
    for (const s of [-1, 1]) {
      const ear = this.joint(this.head, [0.24 * s, 0.2, -0.02], [0, 0, -0.55 * s]);
      this.blob(ear, 0.13, [1, 2.2, 0.55], [0, 0.26, 0], fur);
      this.blob(ear, 0.08, [0.9, 1.9, 0.5], [0, 0.24, 0.05], brown, [0, 0, 0], 0);
      this.blob(ear, 0.07, [1.6, 0.8, 0.6], [0.05 * s, 0.56, 0], brown, [0, 0, 0.6 * s], 0.03);
    }
    this.face(this.head, ['.WK..KW.', '.KK..KK.', 'C......C', 'C..kk..C'], { W: white, K: black, C: this.cheekMat, k: brown }, 0.1);
    this.setMouth(this.head, [0, -0.08, 0.36]);

    this.armL = this.joint(this.body, [-0.28, 0.7, 0.08]);
    this.armR = this.joint(this.body, [0.28, 0.7, 0.08]);
    for (const [g, s] of [[this.armL, -1], [this.armR, 1]] as const) this.cap(g, 0.06, 0.14, [0.04 * s, -0.08, 0.03], [0, 0, 0.6 * s], fur);

    // Cola larga y fina terminada en rayo
    this.tail = this.joint(this.body, [0, 0.36, -0.28]);
    for (let i = 0; i < 6; i++) this.blob(this.tail, 0.055, [1, 1, 1], [0, 0.02 + i * 0.05, -0.08 - i * 0.12], black, [0, 0, 0], 0);
    this.blob(this.tail, 0.17, [0.4, 1.1, 1.3], [0, 0.44, -0.86], fur, [0.6, 0, 0.35]);
    this.blob(this.tail, 0.12, [0.4, 1.0, 1.2], [0, 0.66, -0.98], fur, [-0.4, 0, -0.3]);
  }

  override pose(p: PoseInput): void {
    super.pose(p);
    this.cheekMat.emissiveIntensity = p.charge * 3.5 + p.release * 5;
  }
}
