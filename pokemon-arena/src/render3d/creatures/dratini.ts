import * as THREE from 'three';
import type { PoseInput } from './rig';
import { BipedRig, ModelRig, eyeMaterials } from './kit';

/**
 * Dratini y Dragonair (modelos originales de dragón serpiente):
 * - Dratini: azul con vientre blanco y aletas blancas en la cabeza.
 * - Dragonair: azul celeste, cuerno blanco, alas pequeñas y perlas azules en cuello y cola.
 * Se yerguen sobre la cola y barren con ella.
 */
export class DratiniRig extends ModelRig {
  readonly height: number;
  private readonly head = new THREE.Group();
  private readonly segs: THREE.Group[] = [];

  constructor(variant: 'dratini' | 'dragonair' = 'dratini') {
    super();
    const adult = variant === 'dragonair';
    this.height = adult ? 2.1 : 1.45;
    const blue = this.mat(adult ? 0x6fa6dc : 0x8aa0dc);
    const belly = this.mat(0xf0f2f6);
    const fin = this.mat(0xeaeef6);
    const orb = this.glowMat(0x3f6fe0, 0x2a50d0, 0.6);
    const { white, black } = eyeMaterials();
    const n = adult ? 13 : 10;
    const rise = adult ? 1.5 : 0.95;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const r = (adult ? 0.21 : 0.19) * (0.6 + 0.4 * Math.min(1, t * 2));
      // Desde la punta de la cola (detrás, en el suelo) hasta el cuello, erguido
      const g = this.joint(this.body, [0, 0.12 + Math.pow(t, 2.2) * rise, -1.0 + t * 1.05]);
      this.blob(g, r, [1, 1, 1.3], [0, 0, 0], blue);
      this.blob(g, r * 0.8, [0.9, 0.8, 1.2], [0, -r * 0.2, r * 0.35], belly, [0, 0, 0], 0);
      this.segs.push(g);
    }
    if (adult) {
      this.blob(this.segs[n - 3], 0.08, [1, 1, 1], [0, 0, 0.24], orb, [0, 0, 0], 0);
      this.blob(this.segs[0], 0.1, [1, 1, 1], [0, 0.05, -0.12], orb, [0, 0, 0], 0);
      this.blob(this.segs[1], 0.09, [1, 1, 1], [0, 0.04, -0.06], orb, [0, 0, 0], 0);
    }
    this.head.position.set(0, 0.12 + rise + 0.1, 0.1);
    this.body.add(this.head);
    this.blob(this.head, adult ? 0.24 : 0.25, [1, 0.95, 1.2], [0, 0, 0], blue);
    this.blob(this.head, 0.13, [0.9, 0.7, 1], [0, -0.06, 0.2], blue, [0, 0, 0], 0.03);
    for (const s of [-1, 1]) {
      this.blob(this.head, 0.11, [0.4, 1.2, 1], [0.24 * s, 0.06, -0.04], fin, [0, 0, -0.5 * s]);
      this.blob(this.head, 0.05, [0.4, 1.4, 1], [0.3 * s, 0.18, -0.02], fin, [0, 0, -0.6 * s], 0);
    }
    if (adult) this.cone(this.head, 0.06, 0.2, [0, 0.27, 0.06], [0.2, 0, 0], fin);
    this.face(this.head, ['.KW..WK.', '.KK..KK.'], { K: black, W: white }, 0.08);
    this.setMouth(this.head, [0, -0.08, 0.35]);
  }

  pose(p: PoseInput): void {
    const t = p.time;
    const amp = 0.06 + p.run * 0.12;
    this.segs.forEach((g, i) => {
      g.position.x = Math.sin(t * (2.2 + p.run * 5) - i * 0.9) * amp * (1 - i / (this.segs.length + 2));
    });
    const lunge = p.release * 0.3 - p.charge * 0.15 - p.hurt * 0.12;
    this.head.position.z = 0.12 + lunge;
    this.head.rotation.x = p.release * 0.5 - p.charge * 0.25;
    this.head.rotation.z = p.stunned ? Math.sin(t * 9) * 0.25 : Math.sin(t * 1.3) * 0.08;
    // Barrido de cola al golpear
    this.segs[0].position.x += p.release * 0.4;
    this.segs[1].position.x += p.release * 0.25;
  }
}

/**
 * Dragonite (modelo original): dragón naranja y rechoncho con vientre crema a franjas,
 * antenas, alas pequeñas verde azuladas y cola gruesa. Vuela.
 */
export class DragoniteRig extends BipedRig {
  readonly height = 2.05;
  private readonly wingL: THREE.Group;
  private readonly wingR: THREE.Group;

  constructor() {
    super();
    const skin = this.mat(0xf2b06a);
    const cream = this.mat(0xf5e6c4);
    const stripe = this.mat(0xe2cfa0);
    const wing = this.mat(0x2f978b);
    const { white, black } = eyeMaterials();
    this.hopHeight = 0;
    this.cadence = 8;

    this.legL = this.joint(this.body, [-0.2, 0.36, 0]);
    this.legR = this.joint(this.body, [0.2, 0.36, 0]);
    for (const g of [this.legL, this.legR]) {
      this.blob(g, 0.15, [1, 1.3, 1.1], [0, -0.1, 0], skin);
      this.blob(g, 0.12, [1, 0.55, 1.5], [0, -0.28, 0.06], skin);
    }
    this.blob(this.body, 0.38, [1, 1.25, 0.95], [0, 0.82, 0], skin);
    this.blob(this.body, 0.3, [0.85, 1.2, 0.6], [0, 0.78, 0.16], cream, [0, 0, 0], 0);
    for (const y of [0.6, 0.78, 0.96]) this.blob(this.body, 0.22, [1.05, 0.12, 0.62], [0, y, 0.2], stripe, [0, 0, 0], 0);

    this.head.position.set(0, 1.5, 0.08);
    this.body.add(this.head);
    this.blob(this.head, 0.23, [1, 0.95, 1.1], [0, 0, 0], skin);
    this.blob(this.head, 0.15, [1, 0.75, 1.1], [0, -0.06, 0.18], skin, [0, 0, 0], 0.03);
    for (const s of [-1, 1]) {
      this.cap(this.head, 0.025, 0.3, [0.1 * s, 0.32, 0.02], [0, 0, -0.25 * s], skin, 0.02);
      this.blob(this.head, 0.05, [1, 1, 1], [0.15 * s, 0.24, -0.08], skin, [0, 0, 0], 0);
    }
    this.face(this.head, ['.KW..WK.', '.KK..KK.', '........', '..kkkk..'], { K: black, W: white, k: black }, 0.1);
    this.setMouth(this.head, [0, -0.08, 0.38]);

    this.armL = this.joint(this.body, [-0.36, 1.02, 0.08]);
    this.armR = this.joint(this.body, [0.36, 1.02, 0.08]);
    for (const [g, s] of [[this.armL, -1], [this.armR, 1]] as const) this.cap(g, 0.08, 0.2, [0.05 * s, -0.12, 0.03], [0, 0, 0.4 * s], skin);

    this.wingL = this.joint(this.body, [-0.2, 1.08, -0.28]);
    this.wingR = this.joint(this.body, [0.2, 1.08, -0.28]);
    for (const [g, s] of [[this.wingL, -1], [this.wingR, 1]] as const) {
      this.blob(g, 0.26, [1.4, 0.9, 0.2], [0.3 * s, 0.1, 0], skin, [0, 0, -0.4 * s]);
      this.blob(g, 0.22, [1.3, 0.8, 0.14], [0.3 * s, 0.08, 0.03], wing, [0, 0, -0.4 * s], 0);
    }
    this.tail = this.joint(this.body, [0, 0.45, -0.3]);
    this.blob(this.tail, 0.18, [1, 1, 2.4], [0, -0.1, -0.32], skin, [-0.5, 0, 0]);
  }

  override pose(p: PoseInput): void {
    super.pose(p);
    this.legL.rotation.x = 0.3;
    this.legR.rotation.x = 0.3;
    const flap = Math.sin(p.time * 9) * 0.5 + 0.1 + p.release * 0.4;
    this.wingL.rotation.z = flap;
    this.wingR.rotation.z = -flap;
    this.body.position.y = Math.sin(p.time * 9 + 1) * 0.04;
  }
}
