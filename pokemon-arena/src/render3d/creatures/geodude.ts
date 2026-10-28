import * as THREE from 'three';
import type { PoseInput } from './rig';
import { ModelRig, eyeMaterials } from './kit';

/**
 * Geodude (modelo original): roca gris con relieves, cejas gruesas y dos brazos musculosos.
 * Flota a ras de suelo; golpea con ambos puños. Altura base 1,35 (0,4 m reales).
 */
export class GeodudeRig extends ModelRig {
  readonly height = 1.2;
  private readonly armL: THREE.Group;
  private readonly armR: THREE.Group;

  constructor() {
    super();
    const rock = this.mat(0x9b8f80, { roughness: 0.8, clearcoat: 0 });
    const rockDark = this.mat(0x7a6f62, { roughness: 0.85, clearcoat: 0 });
    const brow = this.mat(0x4e463e);
    const dark = this.mat(0x2a2420);
    const { white, black } = eyeMaterials();

    this.blob(this.body, 0.38, [1.1, 0.95, 1], [0, 0.72, 0], rock);
    for (const [x, y, z, r] of [[0.28, 0.95, -0.12, 0.13], [-0.3, 0.55, -0.15, 0.12], [0.05, 1.04, -0.2, 0.11], [-0.22, 0.98, 0.05, 0.09]] as const) {
      this.blob(this.body, r, [1, 0.8, 1], [x, y, z], rockDark, [0, 0, 0], 0);
    }
    this.face(this.body, ['DDD..DDD', '.WK..KW.', '.KK..KK.', '........', '..dddd..'], { D: brow, W: white, K: black, d: dark }, 0.9);
    this.body.add(new THREE.Object3D());

    this.armL = this.joint(this.body, [-0.4, 0.75, 0.04]);
    this.armR = this.joint(this.body, [0.4, 0.75, 0.04]);
    for (const [g, s] of [[this.armL, -1], [this.armR, 1]] as const) {
      this.cap(g, 0.085, 0.18, [0.12 * s, 0.02, 0], [0, 0, 1.25 * s], rock);
      this.blob(g, 0.14, [1.1, 1, 1.1], [0.3 * s, -0.04, 0.08], rock);
    }
    this.setMouth(this.armR, [0.3, -0.04, 0.24]);
  }

  pose(p: PoseInput): void {
    // Flota con un vaivén lento; al moverse se inclina y balancea los brazos.
    const bob = Math.sin(p.time * 3) * 0.05;
    this.body.position.y = 0.06 + bob;
    this.body.rotation.x = p.run * 0.2 - p.charge * 0.15 + p.release * 0.35 - p.hurt * 0.3;
    this.body.rotation.z = p.stunned ? Math.sin(p.time * 9) * 0.15 : 0;
    const swing = Math.sin(p.time * 10) * 0.5 * p.run;
    this.armL.rotation.x = swing + p.charge * 0.6 - p.release * 1.4;
    this.armR.rotation.x = -swing + p.charge * 0.6 - p.release * 1.4;
    this.armL.rotation.z = Math.sin(p.time * 2) * 0.1;
    this.armR.rotation.z = -Math.sin(p.time * 2) * 0.1;
    const sq = 1 - p.charge * 0.1 + p.hurt * 0.05;
    this.body.scale.set(2 - sq, sq, 2 - sq);
  }
}
