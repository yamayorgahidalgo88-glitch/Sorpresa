import * as THREE from 'three';
import type { PoseInput } from './rig';
import { ModelRig, eyeMaterials, gait } from './kit';

/**
 * Bulbasaur (modelo original): cuadrúpedo verde azulado con manchas, orejas cortas, ojos
 * rojos y el bulbo en el lomo (palpita al curar y al cargar). Altura base 1,58 (0,7 m).
 */
export class BulbasaurRig extends ModelRig {
  readonly height = 1.25;
  private readonly head = new THREE.Group();
  private readonly bulb: THREE.Group;
  private readonly legs: THREE.Group[] = [];

  constructor() {
    super();
    const skin = this.mat(0x7ccfb0);
    const spot = this.mat(0x3f8f78);
    const bulbMat = this.mat(0x47a64f);
    const leaf = this.mat(0x2f7a3a);
    const red = this.mat(0xd8343a, { roughness: 0.25 });
    const dark = this.mat(0x2a4a40);
    const { white } = eyeMaterials();

    this.blob(this.body, 0.3, [1.1, 0.85, 1.3], [0, 0.42, -0.04], skin);
    this.blob(this.body, 0.08, [1, 0.6, 1], [0.2, 0.62, 0.12], spot, [0, 0, 0], 0);
    this.blob(this.body, 0.07, [1, 0.6, 1], [-0.24, 0.5, -0.12], spot, [0, 0, 0], 0);

    this.bulb = this.joint(this.body, [0, 0.66, -0.1]);
    this.blob(this.bulb, 0.27, [1, 1.05, 1], [0, 0.16, 0], bulbMat);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      this.blob(this.bulb, 0.11, [0.7, 1.7, 0.7], [Math.cos(a) * 0.17, 0.28, Math.sin(a) * 0.17], leaf, [Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4], 0);
    }
    this.blob(this.bulb, 0.09, [1, 1.3, 1], [0, 0.46, 0], bulbMat, [0, 0, 0], 0.03);

    this.head.position.set(0, 0.6, 0.34);
    this.body.add(this.head);
    this.blob(this.head, 0.3, [1.15, 0.88, 0.95], [0, 0, 0], skin);
    for (const s of [-1, 1]) this.blob(this.head, 0.09, [1, 1.3, 0.6], [0.25 * s, 0.24, -0.04], skin, [0, 0, -0.5 * s]);
    this.blob(this.head, 0.07, [1, 0.5, 1], [-0.12, 0.25, -0.05], spot, [0, 0, 0], 0);
    this.face(this.head, ['.WR..RW.', '.RR..RR.', '........', '.dddddd.'], { W: white, R: red, d: dark }, 0.1);
    this.setMouth(this.head, [0, -0.1, 0.32]);

    for (const [x, z] of [[-0.21, 0.2], [0.21, 0.2], [-0.21, -0.26], [0.21, -0.26]] as const) {
      const g = this.joint(this.body, [x, 0.24, z]);
      this.cap(g, 0.09, 0.08, [0, -0.1, 0], [0, 0, 0], skin);
      this.blob(g, 0.09, [1, 0.6, 1.3], [0, -0.19, 0.05], skin, [0, 0, 0], 0.03);
      this.legs.push(g);
    }
  }

  pose(p: PoseInput): void {
    const { stride, hop, breathe } = gait(p.time, p.run, 11);
    const crouch = p.charge * 0.1 - p.release * 0.06 + p.hurt * 0.1;
    this.body.scale.set(1 + crouch * 0.4, 1 + breathe * 0.02 - crouch, 1 + crouch * 0.4);
    this.body.position.y = hop * 0.05;
    this.body.position.z = p.release * 0.08 - p.hurt * 0.1;
    this.body.rotation.x = -p.hurt * 0.2 + p.release * 0.1;
    // Paso en diagonal (delantera izquierda con trasera derecha)
    this.legs.forEach((g, i) => {
      g.rotation.x = Math.sin(stride + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.6 * p.run;
    });
    this.head.rotation.x = -p.release * 0.2 + p.charge * 0.1;
    this.head.rotation.z = p.stunned ? Math.sin(p.time * 9) * 0.2 : Math.sin(p.time * 1.4) * 0.04;
    const pulse = 1 + Math.sin(p.time * 2.2) * 0.03 + p.charge * 0.15 + p.release * 0.1;
    this.bulb.scale.set(pulse, pulse, pulse);
  }
}
