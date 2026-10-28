import * as THREE from 'three';
import type { PoseInput } from './rig';
import { ModelRig, eyeMaterials, gait } from './kit';

/**
 * Rattata y Raticate (modelos originales de rata, en enjambre):
 * - Rattata: morada con vientre crema, orejas grandes, incisivos blancos y cola enroscada.
 * - Raticate: marrón y más robusta, con incisivos enormes, bigotes y cola larga escamosa.
 * Corren a cuatro patas y muerden.
 */
export class RattataRig extends ModelRig {
  readonly height: number;
  private readonly head = new THREE.Group();
  private readonly legs: THREE.Group[] = [];
  private readonly tail: THREE.Group;

  constructor(variant: 'rattata' | 'raticate' = 'rattata') {
    super();
    const big = variant === 'raticate';
    this.height = big ? 0.85 : 0.72;
    if (big) this.size.scale.setScalar(1.12);
    const fur = this.mat(big ? 0xb08a5c : 0x9b7aa8);
    const belly = this.mat(big ? 0xf0dcbd : 0xe6d6c8);
    const dark = this.mat(big ? 0x6b4a2c : 0x5a4560);
    const tooth = this.mat(0xffffff);
    const red = this.mat(0xd83a3a, { roughness: 0.25 });
    const { black } = eyeMaterials();

    this.blob(this.body, 0.22, [1, 0.85, 1.35], [0, 0.3, -0.05], fur);
    this.blob(this.body, 0.17, [0.9, 0.7, 1.1], [0, 0.24, 0.02], belly, [0, 0, 0], 0);
    this.head.position.set(0, 0.42, 0.26);
    this.body.add(this.head);
    this.blob(this.head, 0.17, [1, 0.9, 1.2], [0, 0, 0], fur);
    this.blob(this.head, 0.09, [1, 0.8, 1], [0, -0.04, 0.17], belly, [0, 0, 0], 0.03);
    for (const s of [-1, 1]) {
      this.blob(this.head, 0.09, [1, 1.2, 0.5], [0.14 * s, 0.16, -0.04], fur, [0, 0, -0.4 * s]);
      this.blob(this.head, 0.06, [1, 1.1, 0.4], [0.14 * s, 0.16, -0.01], dark, [0, 0, -0.4 * s], 0);
    }
    this.blob(this.head, big ? 0.05 : 0.04, [1.1, 1.6, 0.5], [0, -0.12, 0.22], tooth, [0, 0, 0], 0.02);
    if (big) for (const s of [-1, 1]) this.cap(this.head, 0.012, 0.16, [0.12 * s, -0.04, 0.22], [0, 0, Math.PI / 2], dark, 0);
    this.face(this.head, ['R....R', 'K....K'], { R: red, K: black }, 0.07);
    this.setMouth(this.head, [0, -0.06, 0.25]);
    for (const [x, z] of [[-0.13, 0.12], [0.13, 0.12], [-0.13, -0.2], [0.13, -0.2]] as const) {
      const g = this.joint(this.body, [x, 0.16, z]);
      this.blob(g, 0.06, [0.9, 1.3, 1.2], [0, -0.07, 0.02], fur, [0, 0, 0], 0.03);
      this.legs.push(g);
    }
    this.tail = this.joint(this.body, [0, 0.28, -0.32]);
    for (let i = 0; i < 4; i++) this.blob(this.tail, 0.05, [1, 1, 1], [0, 0.04 + i * 0.08, -0.08 - i * 0.04], big ? dark : fur, [0, 0, 0], 0);
  }

  pose(p: PoseInput): void {
    const { stride, hop } = gait(p.time, p.run, 18);
    this.body.position.y = hop * 0.05;
    this.body.position.z = p.release * 0.12 - p.hurt * 0.08;
    this.body.rotation.x = -p.hurt * 0.2;
    this.legs.forEach((g, i) => (g.rotation.x = Math.sin(stride + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.8 * p.run));
    this.head.rotation.x = p.release * 0.4 - p.charge * 0.1;
    this.head.rotation.z = p.stunned ? Math.sin(p.time * 9) * 0.25 : 0;
    this.tail.rotation.y = Math.sin(p.time * 6) * 0.3;
  }
}
