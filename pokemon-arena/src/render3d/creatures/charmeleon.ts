import type { PoseInput } from './rig';
import * as THREE from 'three';
import { BipedRig, eyeMaterials } from './kit';

/**
 * Charmeleon (modelo original): lagarto rojo con vientre crema, cuerno hacia atrás, garras
 * y llama en la punta de la cola (brilla y ondula). Altura base 1,80 (1,1 m reales).
 */
export class CharmeleonRig extends BipedRig {
  readonly height = 1.75;
  private readonly flame: THREE.Group;
  private readonly flameMat: THREE.MeshPhysicalMaterial;

  constructor() {
    super();
    const skin = this.mat(0xe0533a);
    const cream = this.mat(0xf2cf8a);
    const blue = this.mat(0x2a6fb0, { roughness: 0.25 });
    const dark = this.mat(0x6a1c12);
    const { white } = eyeMaterials();
    this.flameMat = this.glowMat(0xffb347, 0xff6a00, 1.6);
    const core = this.glowMat(0xfff07a, 0xffd23a, 2);

    this.legL = this.joint(this.body, [-0.15, 0.34, 0]);
    this.legR = this.joint(this.body, [0.15, 0.34, 0]);
    for (const g of [this.legL, this.legR]) {
      this.blob(g, 0.13, [1, 1.3, 1.1], [0, -0.1, 0], skin);
      this.blob(g, 0.1, [1, 0.6, 1.5], [0, -0.28, 0.07], skin);
    }
    this.blob(this.body, 0.26, [1, 1.35, 0.9], [0, 0.7, 0], skin);
    this.blob(this.body, 0.2, [0.9, 1.25, 0.6], [0, 0.66, 0.11], cream, [0, 0, 0], 0);

    this.head.position.set(0, 1.2, 0.05);
    this.body.add(this.head);
    this.blob(this.head, 0.25, [1, 0.95, 1.1], [0, 0, 0], skin);
    this.blob(this.head, 0.17, [1, 0.75, 1.2], [0, -0.08, 0.17], skin);
    this.blob(this.head, 0.09, [1, 1, 2.6], [0, 0.12, -0.28], skin, [0.5, 0, 0]);
    this.face(this.head, ['.W..W.', '.B..B.', '.B..B.', '......', 'd....d'], { W: white, B: blue, d: dark }, 0.15);
    this.setMouth(this.head, [0, -0.1, 0.38]);

    this.armL = this.joint(this.body, [-0.25, 0.86, 0.05]);
    this.armR = this.joint(this.body, [0.25, 0.86, 0.05]);
    for (const [g, s] of [[this.armL, -1], [this.armR, 1]] as const) {
      this.cap(g, 0.065, 0.16, [0.05 * s, -0.1, 0.03], [0, 0, 0.4 * s], skin);
      this.blob(g, 0.07, [1, 1, 1], [0.09 * s, -0.22, 0.07], cream, [0, 0, 0], 0.03);
    }

    this.tail = this.joint(this.body, [0, 0.48, -0.18]);
    this.blob(this.tail, 0.12, [1, 1, 2.4], [0, 0, -0.26], skin, [-0.45, 0, 0]);
    this.flame = this.joint(this.tail, [0, 0.16, -0.52]);
    this.blob(this.flame, 0.12, [1, 1.6, 1], [0, 0.12, 0], this.flameMat, [0, 0, 0], 0);
    this.blob(this.flame, 0.07, [1, 1.4, 1], [0, 0.1, 0.06], core, [0, 0, 0], 0);
  }

  override pose(p: PoseInput): void {
    super.pose(p);
    const f = 1 + Math.sin(p.time * 17) * 0.1 + Math.sin(p.time * 29) * 0.06 + p.charge * 0.3;
    this.flame.scale.set(1 / Math.sqrt(f), f, 1 / Math.sqrt(f));
    this.flameMat.emissiveIntensity = 1.4 + p.charge * 2 + p.release * 2;
  }
}
