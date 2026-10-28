import type { PoseInput } from './rig';
import * as THREE from 'three';
import { BipedRig, eyeMaterials } from './kit';

/**
 * Charmander y Charmeleon (modelos originales a partir de la misma forma):
 * - Charmander: naranja, cabeza grande y redonda, sin cuerno, vientre crema, llama en la cola.
 * - Charmeleon: rojo, cabeza alargada con cuerno hacia atrás y garras.
 * Altura base 1,53 (0,6 m) y 1,80 (1,1 m).
 */
export class CharmeleonRig extends BipedRig {
  readonly height: number;
  private readonly flame: THREE.Group;
  private readonly flameMat: THREE.MeshPhysicalMaterial;

  constructor(variant: 'charmander' | 'charmeleon' = 'charmeleon') {
    super();
    const young = variant === 'charmander';
    this.height = young ? 1.55 : 1.75;
    const skin = this.mat(young ? 0xf2934a : 0xd9503c);
    const cream = this.mat(young ? 0xf7e2a8 : 0xf0cf96);
    const blue = this.mat(young ? 0x1f5f8a : 0x2a6fb0, { roughness: 0.25 });
    const dark = this.mat(0x6a1c12);
    const claw = this.mat(0xf4f0e6);
    const { white } = eyeMaterials();
    this.flameMat = this.glowMat(0xffb347, 0xff6a00, 1.6);
    const core = this.glowMat(0xfff07a, 0xffd23a, 2);

    const legLen = young ? 0.85 : 1;
    this.legL = this.joint(this.body, [-0.15, 0.34 * legLen, 0]);
    this.legR = this.joint(this.body, [0.15, 0.34 * legLen, 0]);
    for (const g of [this.legL, this.legR]) {
      this.blob(g, 0.13, [1, 1.3 * legLen, 1.1], [0, -0.1 * legLen, 0], skin);
      this.blob(g, 0.1, [1, 0.6, 1.5], [0, -0.26 * legLen - 0.02, 0.07], skin);
      if (!young) this.blob(g, 0.05, [1, 0.6, 1], [0, -0.3, 0.2], claw, [0, 0, 0], 0);
    }
    const ty = young ? 0.62 : 0.7;
    this.blob(this.body, 0.26, [1, young ? 1.15 : 1.35, 0.9], [0, ty, 0], skin);
    this.blob(this.body, 0.2, [0.9, young ? 1.05 : 1.25, 0.6], [0, ty - 0.03, 0.11], cream, [0, 0, 0], 0);

    this.head.position.set(0, young ? 1.06 : 1.2, 0.05);
    this.body.add(this.head);
    if (young) {
      // Cabeza redonda y grande, hocico corto
      this.blob(this.head, 0.3, [1, 0.95, 1], [0, 0, 0], skin);
      this.blob(this.head, 0.18, [1.05, 0.7, 1], [0, -0.1, 0.17], skin);
      this.face(this.head, ['.W....W.', '.B....B.', '.B....B.', '........', '..dddd..'], { W: white, B: blue, d: dark }, 0.16);
      this.setMouth(this.head, [0, -0.12, 0.38]);
    } else {
      this.blob(this.head, 0.25, [1, 0.95, 1.1], [0, 0, 0], skin);
      this.blob(this.head, 0.17, [1, 0.75, 1.2], [0, -0.08, 0.17], skin);
      this.blob(this.head, 0.09, [1, 1, 2.6], [0, 0.12, -0.28], skin, [0.5, 0, 0]);
      this.face(this.head, ['.W..W.', '.B..B.', '.B..B.', '......', 'd....d'], { W: white, B: blue, d: dark }, 0.15);
      this.setMouth(this.head, [0, -0.1, 0.38]);
    }

    this.armL = this.joint(this.body, [-0.25, young ? 0.76 : 0.86, 0.05]);
    this.armR = this.joint(this.body, [0.25, young ? 0.76 : 0.86, 0.05]);
    for (const [g, s] of [[this.armL, -1], [this.armR, 1]] as const) {
      this.cap(g, 0.065, young ? 0.12 : 0.16, [0.05 * s, -0.1, 0.03], [0, 0, 0.4 * s], skin);
      this.blob(g, 0.07, [1, 1, 1], [0.09 * s, young ? -0.19 : -0.22, 0.07], young ? skin : claw, [0, 0, 0], 0.03);
    }

    this.tail = this.joint(this.body, [0, 0.42, -0.18]);
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
