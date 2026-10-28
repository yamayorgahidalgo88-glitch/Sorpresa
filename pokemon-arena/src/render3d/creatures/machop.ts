import type { PoseInput } from './rig';
import { BipedRig, eyeMaterials } from './kit';

/**
 * Machop (modelo original): luchador gris azulado con tres crestas en la cabeza, brazos
 * grandes con puños y ojos rojos. Golpea con el puño derecho. Altura base 1,64 (0,8 m reales).
 */
export class MachopRig extends BipedRig {
  readonly height = 1.5;

  constructor() {
    super();
    const skin = this.mat(0x9eb4c9);
    const shade = this.mat(0x7e93aa);
    const red = this.mat(0xd8343a, { roughness: 0.25 });
    const dark = this.mat(0x3a3f55);
    const { white } = eyeMaterials();
    this.punch = 1.8;
    this.oneArmPunch = true;
    this.cadence = 13;

    this.legL = this.joint(this.body, [-0.14, 0.3, 0]);
    this.legR = this.joint(this.body, [0.14, 0.3, 0]);
    for (const g of [this.legL, this.legR]) {
      this.blob(g, 0.12, [1, 1.25, 1], [0, -0.1, 0], skin);
      this.blob(g, 0.1, [1, 0.6, 1.4], [0, -0.25, 0.06], skin);
    }
    this.blob(this.body, 0.26, [1.1, 1.15, 0.85], [0, 0.64, 0], skin);
    this.blob(this.body, 0.2, [1, 0.8, 0.6], [0, 0.72, 0.1], shade, [0, 0, 0], 0);

    this.head.position.set(0, 1.08, 0.03);
    this.body.add(this.head);
    this.blob(this.head, 0.24, [1, 1, 1], [0, 0, 0], skin);
    for (const x of [-0.1, 0, 0.1]) this.blob(this.head, 0.075, [0.7, 1.6, 1], [x, 0.25, -0.02], shade, [0, 0, -x * 3]);
    this.face(this.head, ['.WR..RW.', '.RR..RR.', '........', '..dddd..'], { W: white, R: red, d: dark }, 0.1);

    this.armL = this.joint(this.body, [-0.3, 0.8, 0]);
    this.armR = this.joint(this.body, [0.3, 0.8, 0]);
    for (const [g, s] of [[this.armL, -1], [this.armR, 1]] as const) {
      this.cap(g, 0.085, 0.16, [0.06 * s, -0.12, 0.02], [0, 0, 0.45 * s], skin);
      this.blob(g, 0.12, [1, 1, 1], [0.13 * s, -0.27, 0.06], skin);
    }
    this.setMouth(this.armR, [0.13, -0.27, 0.18]);
  }

  override pose(p: PoseInput): void {
    super.pose(p);
    // Guardia de boxeo en reposo
    this.armL.rotation.z = -0.15 * (1 - p.run);
    this.armR.rotation.z = 0.15 * (1 - p.run) - p.release * 0.3;
  }
}
