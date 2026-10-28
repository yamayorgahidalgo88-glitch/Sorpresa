import type { PoseInput } from './rig';
import * as THREE from 'three';
import { BipedRig, eyeMaterials } from './kit';

/**
 * Charizard (modelo original): dragón naranja con vientre crema, dos cuernos, alas con
 * membrana azul verdosa (aletean sin parar: es volador) y llama en la cola.
 * Altura base 2,11 (1,7 m reales).
 */
export class CharizardRig extends BipedRig {
  readonly height = 2.05;
  private readonly wingL: THREE.Group;
  private readonly wingR: THREE.Group;
  private readonly flame: THREE.Group;
  private readonly flameMat: THREE.MeshPhysicalMaterial;

  constructor() {
    super();
    const skin = this.mat(0xf08a3a);
    const cream = this.mat(0xf6d58c);
    const membrane = this.mat(0x2c8aa0);
    const blue = this.mat(0x2a6fb0, { roughness: 0.25 });
    const dark = this.mat(0x6a2c12);
    const { white } = eyeMaterials();
    this.flameMat = this.glowMat(0xffb347, 0xff6a00, 1.6);
    const core = this.glowMat(0xfff07a, 0xffd23a, 2);
    this.hopHeight = 0;

    this.legL = this.joint(this.body, [-0.18, 0.42, 0]);
    this.legR = this.joint(this.body, [0.18, 0.42, 0]);
    for (const g of [this.legL, this.legR]) {
      this.blob(g, 0.15, [1, 1.3, 1.1], [0, -0.12, 0], skin);
      this.blob(g, 0.11, [1, 0.6, 1.5], [0, -0.33, 0.08], skin);
    }
    this.blob(this.body, 0.32, [1, 1.3, 0.95], [0, 0.82, 0], skin);
    this.blob(this.body, 0.25, [0.9, 1.25, 0.6], [0, 0.78, 0.14], cream, [0, 0, 0], 0);
    this.blob(this.body, 0.16, [1, 1.6, 1], [0, 1.25, 0.04], skin);

    this.head.position.set(0, 1.55, 0.08);
    this.body.add(this.head);
    this.blob(this.head, 0.24, [1, 0.92, 1.15], [0, 0, 0], skin);
    this.blob(this.head, 0.17, [1.05, 0.75, 1.25], [0, -0.07, 0.2], skin);
    for (const s of [-1, 1]) this.blob(this.head, 0.07, [1, 1, 3], [0.13 * s, 0.15, -0.22], skin, [0.6, 0, 0]);
    this.face(this.head, ['.W..W.', '.B..B.', '.B..B.', '......', 'd....d'], { W: white, B: blue, d: dark }, 0.15);
    this.setMouth(this.head, [0, -0.08, 0.44]);

    this.armL = this.joint(this.body, [-0.3, 1.0, 0.08]);
    this.armR = this.joint(this.body, [0.3, 1.0, 0.08]);
    for (const [g, s] of [[this.armL, -1], [this.armR, 1]] as const) this.cap(g, 0.07, 0.16, [0.05 * s, -0.1, 0.03], [0, 0, 0.4 * s], skin);

    // Alas: capa naranja por detrás y membrana delante (la última pieza manda en el vóxel)
    this.wingL = this.joint(this.body, [-0.2, 1.1, -0.2]);
    this.wingR = this.joint(this.body, [0.2, 1.1, -0.2]);
    for (const [g, s] of [[this.wingL, -1], [this.wingR, 1]] as const) {
      this.blob(g, 0.4, [1.6, 1.1, 0.24], [0.55 * s, 0.25, -0.04], skin, [0, 0, -0.35 * s]);
      this.blob(g, 0.36, [1.5, 1, 0.16], [0.55 * s, 0.22, 0.02], membrane, [0, 0, -0.35 * s], 0);
    }

    this.tail = this.joint(this.body, [0, 0.55, -0.24]);
    this.blob(this.tail, 0.13, [1, 1, 2.6], [0, -0.05, -0.3], skin, [-0.5, 0, 0]);
    this.flame = this.joint(this.tail, [0, 0.12, -0.62]);
    this.blob(this.flame, 0.14, [1, 1.6, 1], [0, 0.14, 0], this.flameMat, [0, 0, 0], 0);
    this.blob(this.flame, 0.08, [1, 1.4, 1], [0, 0.12, 0.07], core, [0, 0, 0], 0);
  }

  override pose(p: PoseInput): void {
    super.pose(p);
    // Vuela: piernas colgando, alas batiendo (más fuerte al lanzar).
    this.legL.rotation.x = 0.35;
    this.legR.rotation.x = 0.35;
    const flap = Math.sin(p.time * 7) * 0.55 + 0.15 + p.release * 0.5 - p.charge * 0.3;
    this.wingL.rotation.z = flap;
    this.wingR.rotation.z = -flap;
    this.wingL.rotation.y = 0.35;
    this.wingR.rotation.y = -0.35;
    this.body.position.y = Math.sin(p.time * 7 + 1.2) * 0.05;
    const f = 1 + Math.sin(p.time * 17) * 0.1 + Math.sin(p.time * 29) * 0.06 + p.charge * 0.3;
    this.flame.scale.set(1 / Math.sqrt(f), f, 1 / Math.sqrt(f));
    this.flameMat.emissiveIntensity = 1.4 + p.charge * 2 + p.release * 2;
  }
}
