import * as THREE from 'three';
import type { PoseInput } from './rig';
import { ModelRig, eyeMaterials } from './kit';

/**
 * Pidgeotto (modelo original): ave marrón con pecho crema, cresta roja y amarilla, antifaz
 * negro y cola de plumas rojas y amarillas. Vuela batiendo las alas y ataca en picado.
 * Altura base 1,80 (1,1 m reales).
 */
export class PidgeottoRig extends ModelRig {
  readonly height = 1.5;
  private readonly head = new THREE.Group();
  private readonly wingL: THREE.Group;
  private readonly wingR: THREE.Group;
  private readonly tailG: THREE.Group;

  constructor() {
    super();
    const brown = this.mat(0xa86a3a);
    const cream = this.mat(0xf0d9a8);
    const red = this.mat(0xe2453a);
    const yellow = this.mat(0xf2c64b);
    const beak = this.mat(0xc9a097);
    const black = this.mat(0x1b1512, { roughness: 0.25 });
    const { white } = eyeMaterials();

    this.blob(this.body, 0.3, [1, 1.05, 1.2], [0, 0.7, 0], brown);
    this.blob(this.body, 0.24, [0.9, 1, 0.7], [0, 0.64, 0.14], cream, [0, 0, 0], 0);
    for (const s of [-1, 1]) this.cap(this.body, 0.05, 0.14, [0.11 * s, 0.32, 0.04], [0, 0, 0], beak, 0.03);

    this.head.position.set(0, 1.1, 0.12);
    this.body.add(this.head);
    this.blob(this.head, 0.22, [1, 1, 1.05], [0, 0, 0], brown);
    this.blob(this.head, 0.1, [0.5, 1.8, 1], [0, 0.22, -0.12], red, [-0.8, 0, 0]);
    this.blob(this.head, 0.09, [0.5, 1.7, 1], [0, 0.14, -0.24], yellow, [-1.1, 0, 0]);
    this.blob(this.head, 0.07, [1, 0.8, 2], [0, -0.05, 0.24], beak, [0, 0, 0], 0.03);
    this.face(this.head, ['KKW..WKK', '.KK..KK.'], { W: white, K: black }, 0.08);
    this.setMouth(this.head, [0, -0.05, 0.36]);

    this.wingL = this.joint(this.body, [-0.26, 0.82, -0.02]);
    this.wingR = this.joint(this.body, [0.26, 0.82, -0.02]);
    for (const [g, s] of [[this.wingL, -1], [this.wingR, 1]] as const) {
      this.blob(g, 0.3, [1.6, 0.36, 1], [0.4 * s, 0, -0.04], brown);
      this.blob(g, 0.17, [1.5, 0.32, 0.9], [0.78 * s, -0.01, -0.08], cream, [0, 0, 0], 0);
    }
    this.tailG = this.joint(this.body, [0, 0.58, -0.3]);
    this.blob(this.tailG, 0.15, [1.1, 0.3, 1.6], [0, 0, -0.18], red, [0.3, 0, 0]);
    this.blob(this.tailG, 0.12, [1.2, 0.28, 1.3], [0, 0.02, -0.34], yellow, [0.3, 0, 0], 0);
  }

  pose(p: PoseInput): void {
    const flap = Math.sin(p.time * 9) * 0.6 + 0.1 + p.charge * 0.4;
    this.wingL.rotation.z = flap;
    this.wingR.rotation.z = -flap;
    this.body.position.y = Math.sin(p.time * 9 + 1) * 0.05;
    // Inclinación hacia delante al volar y picotazo al golpear
    this.body.rotation.x = p.run * 0.2 - p.charge * 0.25 + p.release * 0.5 - p.hurt * 0.3;
    this.body.position.z = p.release * 0.18 - p.hurt * 0.1;
    this.head.rotation.x = p.release * 0.4;
    this.head.rotation.z = p.stunned ? Math.sin(p.time * 9) * 0.25 : 0;
    this.tailG.rotation.x = Math.sin(p.time * 4) * 0.1;
  }
}
