import * as THREE from 'three';
import type { PoseInput } from './rig';
import { BipedRig, eyeMaterials } from './kit';

type Variant = 'machop' | 'machoke' | 'machamp';

/**
 * Línea de Machop (modelos originales de luchador):
 * - Machop: gris azulado, tres crestas, ojos rojos.
 * - Machoke: gris lavanda, cresta alta, calzón negro y cinturón dorado.
 * - Machamp: cuatro brazos, cresta de tres picos, calzón y cinturón.
 * Golpean con el puño derecho (Machamp, con los dos derechos).
 */
export class MachopRig extends BipedRig {
  readonly height: number;
  private readonly lowerL: THREE.Group | null = null;
  private readonly lowerR: THREE.Group | null = null;

  constructor(variant: Variant = 'machop') {
    super();
    const k = variant === 'machop' ? 1 : variant === 'machoke' ? 1.18 : 1.25;
    this.size.scale.setScalar(k);
    this.height = 1.5 * k;
    const skin = this.mat({ machop: 0x9eb4c9, machoke: 0x9ea3c8, machamp: 0x93a8c0 }[variant]);
    const shade = this.mat({ machop: 0x7e93aa, machoke: 0x807c95, machamp: 0x7d8692 }[variant]);
    const red = this.mat(0xd8343a, { roughness: 0.25 });
    const dark = this.mat(0x3a3f55);
    const shorts = this.mat(0x23222a);
    const gold = this.mat(0xe7c04a, { roughness: 0.3, clearcoat: 0.8 });
    const { white } = eyeMaterials();
    this.punch = 1.8;
    this.oneArmPunch = true;
    this.cadence = 13;
    const adult = variant !== 'machop';

    this.legL = this.joint(this.body, [-0.14, 0.3, 0]);
    this.legR = this.joint(this.body, [0.14, 0.3, 0]);
    for (const g of [this.legL, this.legR]) {
      this.blob(g, 0.12, [1, 1.25, 1], [0, -0.1, 0], skin);
      this.blob(g, 0.1, [1, 0.6, 1.4], [0, -0.25, 0.06], skin);
    }
    // Torso en V (más ancho de hombros en las evoluciones)
    this.blob(this.body, 0.26, [adult ? 1.3 : 1.1, 1.15, 0.85], [0, 0.64, 0], skin);
    this.blob(this.body, 0.2, [1, 0.8, 0.6], [0, 0.74, 0.1], shade, [0, 0, 0], 0);
    if (adult) {
      this.blob(this.body, 0.24, [1.05, 0.45, 0.9], [0, 0.38, 0], shorts);
      this.blob(this.body, 0.25, [1.07, 0.18, 0.92], [0, 0.47, 0], gold, [0, 0, 0], 0.03);
    }

    this.head.position.set(0, 1.08, 0.03);
    this.body.add(this.head);
    this.blob(this.head, 0.24, [1, 1, 1], [0, 0, 0], skin);
    if (variant === 'machop') {
      for (const x of [-0.1, 0, 0.1]) this.blob(this.head, 0.075, [0.7, 1.6, 1], [x, 0.25, -0.02], shade, [0, 0, -x * 3]);
    } else if (variant === 'machoke') {
      this.blob(this.head, 0.1, [0.6, 1.8, 1.6], [0, 0.3, -0.04], shade);
    } else {
      for (const x of [-0.12, 0, 0.12]) this.blob(this.head, 0.07, [0.6, 1.9, 1.1], [x, 0.28, -0.04], shade, [0, 0, -x * 2.5]);
    }
    this.face(this.head, adult ? ['.RR..RR.', '.WR..RW.', '........', '..dddd..'] : ['.WR..RW.', '.RR..RR.', '........', '..dddd..'], { W: white, R: red, d: dark }, 0.1);

    const arm = (y: number, s: number, big: number) => {
      const g = this.joint(this.body, [0.3 * s * (adult ? 1.1 : 1), y, 0]);
      this.cap(g, 0.085 * big, 0.16, [0.06 * s, -0.12, 0.02], [0, 0, 0.45 * s], skin);
      this.blob(g, 0.12 * big, [1, 1, 1], [0.13 * s, -0.27, 0.06], skin);
      return g;
    };
    const bigArm = adult ? 1.2 : 1;
    this.armL = arm(0.82, -1, bigArm);
    this.armR = arm(0.82, 1, bigArm);
    if (variant === 'machamp') {
      this.lowerL = arm(0.62, -1, 1.05);
      this.lowerR = arm(0.62, 1, 1.05);
    }
    this.setMouth(this.armR, [0.13, -0.27, 0.18]);
  }

  override pose(p: PoseInput): void {
    super.pose(p);
    // Guardia de boxeo en reposo
    this.armL.rotation.z = -0.15 * (1 - p.run);
    this.armR.rotation.z = 0.15 * (1 - p.run) - p.release * 0.3;
    if (this.lowerL && this.lowerR) {
      this.lowerL.rotation.x = -this.armL.rotation.x * 0.8;
      this.lowerR.rotation.x = this.armR.rotation.x;
      this.lowerL.rotation.z = -0.5;
      this.lowerR.rotation.z = 0.5;
    }
  }
}
